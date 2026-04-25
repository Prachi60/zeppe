import crypto from "crypto";
import jwt from "jsonwebtoken";
import OtpSession from "./otp.model.js";
import Admin from "../../models/admin.js";
import Seller from "../../models/seller.js";
import Customer from "../../models/customer.js";
import Delivery from "../../models/delivery.js";
import logger from "../../services/logger.js";
import { sendOtpEmail } from "../../services/nodemailerService.js";
import { generateOTP, useRealEmail } from "../../utils/otp.js";
import { normalizeEmail, isValidEmail } from "../../utils/emailHelpers.js";

const SUPPORTED_USER_TYPES = ["Admin", "Seller", "Customer", "Delivery"];
const SUPPORTED_PURPOSES = ["LOGIN", "SIGNUP", "PASSWORD_RESET"];
const USER_TYPE_CONFIG = {
  Admin: { model: Admin, tokenRole: "admin" },
  Seller: { model: Seller, tokenRole: "seller" },
  Customer: { model: Customer, tokenRole: "customer" },
  Delivery: { model: Delivery, tokenRole: "delivery" },
};

function otpHashSecret() {
  return process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || "unsafe-dev-secret";
}

function hashOtp(email, otp, userType, purpose) {
  return crypto
    .createHmac("sha256", otpHashSecret())
    .update(`${email}:${userType}:${purpose}:${otp}`)
    .digest("hex");
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(String(left || ""), "hex");
  const rightBuffer = Buffer.from(String(right || ""), "hex");
  if (leftBuffer.length === 0 || leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getExpiryMinutes() {
  const parsed = parseInt(process.env.OTP_EXPIRY_MINUTES || "5", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

function getMaxAttempts() {
  const parsed = parseInt(process.env.OTP_MAX_FAILED_ATTEMPTS || "5", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

function assertSupportedEnums({ userType, purpose }) {
  if (!SUPPORTED_USER_TYPES.includes(userType)) {
    const error = new Error("Unsupported userType");
    error.statusCode = 400;
    throw error;
  }
  if (!SUPPORTED_PURPOSES.includes(purpose)) {
    const error = new Error("Unsupported purpose");
    error.statusCode = 400;
    throw error;
  }
}

function assertValidEmail(email) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    const error = new Error("A valid email address is required");
    error.statusCode = 400;
    throw error;
  }
  return normalized;
}

async function findAccountByUserType(userType, email) {
  const config = USER_TYPE_CONFIG[userType];
  return config.model.findOne({ email });
}

function assertPurposeEligibility({ purpose, account, userType }) {
  if (purpose === "LOGIN" || purpose === "PASSWORD_RESET") {
    if (!account) {
      const error = new Error(`${userType} account not found`);
      error.statusCode = 404;
      throw error;
    }
  }

  if (purpose === "SIGNUP" && account) {
    const error = new Error(`${userType} account already exists`);
    error.statusCode = 409;
    throw error;
  }
}

function buildToken(account, userType) {
  const config = USER_TYPE_CONFIG[userType];
  return jwt.sign(
    { id: account._id, role: config.tokenRole },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

function sanitizeAccount(account) {
  if (!account) {
    return null;
  }
  const obj = typeof account.toObject === "function" ? account.toObject() : { ...account };
  delete obj.password;
  delete obj.__v;
  delete obj.otp;
  delete obj.otpHash;
  delete obj.otpExpiry;
  delete obj.otpExpiresAt;
  return obj;
}

async function markAccountVerified(account, userType) {
  if (!account) {
    return null;
  }

  account.lastLogin = new Date();

  if ("isVerified" in account) {
    account.isVerified = true;
  }
  
  if (userType === "Seller" && "emailVerified" in account) {
    account.emailVerified = true;
  }

  await account.save();
  return account;
}

export async function sendEmailOtp({ email, userType, purpose, ipAddress = "unknown" }) {
  assertSupportedEnums({ userType, purpose });

  const normalizedEmail = assertValidEmail(email);
  const account = await findAccountByUserType(userType, normalizedEmail);
  assertPurposeEligibility({ purpose, account, userType });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + getExpiryMinutes() * 60 * 1000);

  await OtpSession.deleteMany({ email: normalizedEmail, userType, purpose });

  const otpHash = hashOtp(normalizedEmail, otp, userType, purpose);
  
  const emailPurpose = `${userType.toLowerCase()}_${purpose.toLowerCase()}`;

  if (useRealEmail()) {
    await sendOtpEmail({ 
      to: normalizedEmail, 
      otp, 
      purpose: emailPurpose, 
      expiresInMinutes: getExpiryMinutes() 
    });
  }

  await OtpSession.create({
    email: normalizedEmail,
    userType,
    purpose,
    otpHash,
    expiresAt,
    maxAttempts: getMaxAttempts(),
  });

  logger.info("OTP session created", {
    module: "email-otp",
    userType,
    purpose,
    email: normalizedEmail,
    ipAddress,
    provider: useRealEmail() ? "nodemailer" : "mock",
  });

  const response = {
    sent: true,
    email: normalizedEmail,
    userType,
    purpose,
    expiresInSeconds: getExpiryMinutes() * 60,
    provider: useRealEmail() ? "nodemailer" : "mock",
  };

  if (!useRealEmail()) {
    response.mockOtp = otp;
  }

  return response;
}

export async function verifyEmailOtp({ email, otp, userType, purpose, ipAddress = "unknown" }) {
  assertSupportedEnums({ userType, purpose });

  const normalizedEmail = assertValidEmail(email);
  const code = String(otp || "").trim();
  
  // Use a generic pattern if length is not fixed, or adapt to generateOTP length
  if (!/^\d{4,8}$/.test(code)) {
    const error = new Error("Invalid OTP format");
    error.statusCode = 400;
    throw error;
  }

  const session = await OtpSession.findOne({
    email: normalizedEmail,
    userType,
    purpose,
  }).select("+otpHash +expiresAt");

  if (!session) {
    const error = new Error("Invalid or expired OTP");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  if (!session.expiresAt || session.expiresAt <= now) {
    await OtpSession.deleteOne({ _id: session._id });
    const error = new Error("OTP has expired");
    error.statusCode = 400;
    throw error;
  }

  if ((session.attempts || 0) >= (session.maxAttempts || getMaxAttempts())) {
    await OtpSession.deleteOne({ _id: session._id });
    const error = new Error("Maximum OTP verification attempts exceeded");
    error.statusCode = 429;
    throw error;
  }

  const incomingHash = hashOtp(normalizedEmail, code, userType, purpose);
  if (!safeCompare(session.otpHash, incomingHash)) {
    const nextAttempts = (session.attempts || 0) + 1;
    if (nextAttempts >= (session.maxAttempts || getMaxAttempts())) {
      await OtpSession.deleteOne({ _id: session._id });
      const error = new Error("Maximum OTP verification attempts exceeded");
      error.statusCode = 429;
      throw error;
    }

    session.attempts = nextAttempts;
    session.lastAttemptAt = now;
    await session.save();

    const error = new Error("Invalid OTP");
    error.statusCode = 400;
    error.attemptsRemaining = (session.maxAttempts || getMaxAttempts()) - nextAttempts;
    throw error;
  }

  session.isVerified = true;
  session.lastAttemptAt = now;
  await session.save();
  await OtpSession.deleteOne({ _id: session._id });

  const account = await findAccountByUserType(userType, normalizedEmail);
  let token = null;
  let sanitizedAccount = null;

  if (account && (purpose === "LOGIN" || purpose === "PASSWORD_RESET")) {
    const verifiedAccount = await markAccountVerified(account, userType);
    token = buildToken(verifiedAccount, userType);
    sanitizedAccount = sanitizeAccount(verifiedAccount);
  }

  logger.info("OTP verified", {
    module: "email-otp",
    userType,
    purpose,
    email: normalizedEmail,
    ipAddress,
  });

  return {
    verified: true,
    email: normalizedEmail,
    userType,
    purpose,
    token,
    account: sanitizedAccount,
  };
}

export const __testables = {
  assertValidEmail,
  hashOtp,
  sanitizeAccount,
};
