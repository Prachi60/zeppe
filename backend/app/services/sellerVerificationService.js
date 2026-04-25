import crypto from "crypto";
import jwt from "jsonwebtoken";
import Seller from "../models/seller.js";
import OtpVerification from "../models/otpVerification.js";
import { getRedisClient } from "../config/redis.js";
import { sendOtpEmail } from "./nodemailerService.js";
import { generateOTP, useRealEmail, MOCK_OTP } from "../utils/otp.js";
import { maskEmail, normalizeEmail, isValidEmail } from "../utils/emailHelpers.js";

const SELLER_SIGNUP_PURPOSE = "seller_signup";
const OTP_EXPIRY_MINUTES = () =>
  parseInt(process.env.SELLER_OTP_EXPIRY_MINUTES || process.env.OTP_EXPIRY_MINUTES || "5", 10);
const OTP_RESEND_COOLDOWN_SECONDS = () =>
  parseInt(
    process.env.SELLER_OTP_RESEND_COOLDOWN_SECONDS ||
    process.env.OTP_RESEND_COOLDOWN_SECONDS ||
    "60",
    10,
  );
const OTP_MAX_FAILED_ATTEMPTS = () =>
  parseInt(
    process.env.SELLER_OTP_MAX_FAILED_ATTEMPTS ||
    process.env.OTP_MAX_FAILED_ATTEMPTS ||
    "5",
    10,
  );
const OTP_SEND_LIMIT_WINDOW_SECONDS = () =>
  parseInt(process.env.SELLER_OTP_SEND_LIMIT_WINDOW_SECONDS || "900", 10);
const OTP_SEND_LIMIT_PER_WINDOW = () =>
  parseInt(process.env.SELLER_OTP_SEND_LIMIT_PER_WINDOW || "5", 10);
const OTP_VERIFY_LIMIT_WINDOW_SECONDS = () =>
  parseInt(process.env.SELLER_OTP_VERIFY_LIMIT_WINDOW_SECONDS || "900", 10);
const OTP_VERIFY_LIMIT_PER_WINDOW = () =>
  parseInt(process.env.SELLER_OTP_VERIFY_LIMIT_PER_WINDOW || "20", 10);
const OTP_LENGTH = () => 4;

function verificationSecret() {
  return (
    process.env.SELLER_VERIFICATION_SECRET ||
    process.env.OTP_HASH_SECRET ||
    process.env.JWT_SECRET ||
    "unsafe-dev-secret"
  );
}

function generateSellerOtp() {
  const production = process.env.NODE_ENV === "production";
  const useRealDelivery = useRealEmail();

  if (production && !useRealDelivery) {
    const error = new Error("Email OTP delivery is not configured in production");
    error.statusCode = 500;
    throw error;
  }

  // Note: We use generateOTP() from utils/otp.js to be consistent with other modules
  return generateOTP();
}

function hashOtp(target, otp) {
  return crypto
    .createHmac("sha256", verificationSecret())
    .update(`${SELLER_SIGNUP_PURPOSE}:email:${target}:${otp}`)
    .digest("hex");
}

async function incrementWindowCounter(redisKey, { limit, windowSeconds }) {
  const redis = getRedisClient();
  if (redis) {
    try {
      const [count] = await Promise.all([
        redis.incr(redisKey),
        redis.expire(redisKey, windowSeconds),
      ]);
      return Number(count) <= limit;
    } catch {
      // fall back to in-memory counter
    }
  }

  if (!globalThis.__SELLER_OTP_WINDOW_COUNTER__) {
    globalThis.__SELLER_OTP_WINDOW_COUNTER__ = new Map();
  }

  const now = Date.now();
  const store = globalThis.__SELLER_OTP_WINDOW_COUNTER__;
  const entry = store.get(redisKey);

  if (!entry || entry.expiresAt <= now) {
    store.set(redisKey, {
      count: 1,
      expiresAt: now + windowSeconds * 1000,
    });
    return true;
  }

  entry.count += 1;
  store.set(redisKey, entry);
  return entry.count <= limit;
}

function normalizeTarget(channel, rawValue) {
  if (channel !== "email") {
    const error = new Error("Only email verification is supported for sellers");
    error.statusCode = 400;
    throw error;
  }
  
  const email = normalizeEmail(rawValue);
  if (!isValidEmail(email)) {
    const error = new Error("Please enter a valid email address");
    error.statusCode = 400;
    throw error;
  }
  return email;
}

async function ensureTargetAvailable(target) {
  const existingSeller = await Seller.findOne({ email: target }).select("_id").lean();
  if (existingSeller) {
    const error = new Error("A seller with this email already exists");
    error.statusCode = 400;
    throw error;
  }
}

async function dispatchEmailOtp({ email, otp }) {
  await sendOtpEmail({ to: email, otp, purpose: SELLER_SIGNUP_PURPOSE, expiresInMinutes: OTP_EXPIRY_MINUTES() });
}

function signVerificationToken({ target }) {
  return jwt.sign(
    {
      purpose: SELLER_SIGNUP_PURPOSE,
      channel: "email",
      target,
      verified: true,
    },
    verificationSecret(),
    {
      expiresIn: process.env.SELLER_VERIFICATION_TOKEN_EXPIRY || "2h",
    },
  );
}

export function verifySellerVerificationToken({ channel, rawValue, token }) {
  const normalizedChannel = String(channel || "").trim().toLowerCase();
  if (normalizedChannel !== "email") {
    const error = new Error("Only email verification is supported");
    error.statusCode = 400;
    throw error;
  }

  const normalizedTarget = normalizeTarget("email", rawValue);

  if (!token) {
    const error = new Error("Email verification is required before signup");
    error.statusCode = 400;
    throw error;
  }

  let payload;
  try {
    payload = jwt.verify(token, verificationSecret());
  } catch {
    const error = new Error("Verification expired. Please verify again.");
    error.statusCode = 400;
    throw error;
  }

  if (
    payload?.purpose !== SELLER_SIGNUP_PURPOSE ||
    payload?.channel !== "email" ||
    payload?.target !== normalizedTarget ||
    payload?.verified !== true
  ) {
    const error = new Error("Verification does not match the provided details");
    error.statusCode = 400;
    throw error;
  }

  return {
    channel: "email",
    target: normalizedTarget,
  };
}

export async function issueSellerVerificationOtp({
  channel,
  rawValue,
  ipAddress = "unknown",
}) {
  const normalizedChannel = String(channel || "").trim().toLowerCase();
  if (normalizedChannel !== "email") {
    const error = new Error("Only email verification is supported");
    error.statusCode = 400;
    throw error;
  }

  const target = normalizeTarget("email", rawValue);
  await ensureTargetAvailable(target);

  const sendAllowed = await incrementWindowCounter(
    `seller:otp:send:email:${target}`,
    {
      limit: OTP_SEND_LIMIT_PER_WINDOW(),
      windowSeconds: OTP_SEND_LIMIT_WINDOW_SECONDS(),
    },
  );
  if (!sendAllowed) {
    const error = new Error("Too many OTP requests. Please try again later.");
    error.statusCode = 429;
    throw error;
  }

  const now = new Date();
  let session = await OtpVerification.findOne({
    purpose: SELLER_SIGNUP_PURPOSE,
    channel: "email",
    target,
  }).select("+otpHash +expiresAt");

  if (session?.lastSentAt) {
    const elapsedMs = now.getTime() - new Date(session.lastSentAt).getTime();
    const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS() * 1000;
    if (elapsedMs < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
      const error = new Error(`Please wait ${waitSeconds}s before requesting another OTP`);
      error.statusCode = 429;
      throw error;
    }
  }

  const otp = generateSellerOtp();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES() * 60 * 1000);

  if (!session) {
    session = new OtpVerification({
      purpose: SELLER_SIGNUP_PURPOSE,
      channel: "email",
      target,
      otpHash: hashOtp(target, otp),
      expiresAt,
      verifiedAt: null,
      failedAttempts: 0,
      lastSentAt: now,
    });
  } else {
    session.otpHash = hashOtp(target, otp);
    session.expiresAt = expiresAt;
    session.verifiedAt = null;
    session.failedAttempts = 0;
    session.lastSentAt = now;
  }

  await session.save();
  await dispatchEmailOtp({ email: target, otp });

  console.log(
    JSON.stringify({
      level: "info",
      ts: new Date().toISOString(),
      event: "seller_signup_otp_issued",
      channel: "email",
      target: maskEmail(target),
      ipAddress,
      mode: useRealEmail() ? "real" : "mock",
    }),
  );

  return {
    sent: true,
    channel: "email",
    maskedTarget: maskEmail(target),
    expiresInSeconds: OTP_EXPIRY_MINUTES() * 60,
  };
}

export async function verifySellerOtpCode({
  channel,
  rawValue,
  otp,
  ipAddress = "unknown",
}) {
  const normalizedChannel = String(channel || "").trim().toLowerCase();
  if (normalizedChannel !== "email") {
    const error = new Error("Only email verification is supported");
    error.statusCode = 400;
    throw error;
  }

  const target = normalizeTarget("email", rawValue);
  const code = String(otp || "").trim();

  if (!/^\d{4}$/.test(code)) {
    const error = new Error("Please enter a valid OTP");
    error.statusCode = 400;
    throw error;
  }

  const verifyAllowed = await incrementWindowCounter(
    `seller:otp:verify:email:${target}`,
    {
      limit: OTP_VERIFY_LIMIT_PER_WINDOW(),
      windowSeconds: OTP_VERIFY_LIMIT_WINDOW_SECONDS(),
    },
  );
  if (!verifyAllowed) {
    const error = new Error("Too many verification attempts. Please try again later.");
    error.statusCode = 429;
    throw error;
  }

  const session = await OtpVerification.findOne({
    purpose: SELLER_SIGNUP_PURPOSE,
    channel: "email",
    target,
  }).select("+otpHash +expiresAt");

  if (!session || !session.otpHash || !session.expiresAt || session.expiresAt <= new Date()) {
    const error = new Error("Invalid or expired OTP");
    error.statusCode = 400;
    throw error;
  }

  const isValid = hashOtp(target, code) === session.otpHash;
  if (!isValid) {
    session.failedAttempts = (session.failedAttempts || 0) + 1;
    await session.save();

    if (session.failedAttempts >= OTP_MAX_FAILED_ATTEMPTS()) {
      await OtpVerification.deleteOne({ _id: session._id });
    }

    const error = new Error("Invalid or expired OTP");
    error.statusCode = 400;
    throw error;
  }

  session.verifiedAt = new Date();
  session.failedAttempts = 0;
  await session.save();

  console.log(
    JSON.stringify({
      level: "info",
      ts: new Date().toISOString(),
      event: "seller_signup_otp_verified",
      channel: "email",
      target: maskEmail(target),
      ipAddress,
    }),
  );

  return {
    verified: true,
    channel: "email",
    verificationToken: signVerificationToken({ target }),
  };
}
