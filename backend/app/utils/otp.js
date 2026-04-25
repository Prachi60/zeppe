import crypto from "crypto";
import { MOCK_OTP } from "../services/nodemailerService.js";

export const hashOtp = (otp) => crypto.createHash("sha256").update(String(otp)).digest("hex");

/**
 * Check if real email should be used
 * @returns {boolean}
 */
export const useRealEmail = () =>
  process.env.USE_REAL_EMAIL === "true" || process.env.USE_REAL_EMAIL === "1";

/**
 * @deprecated Use useRealEmail instead. Kept for Phase 1 compatibility.
 */
export const useRealSMS = () =>
  process.env.USE_REAL_SMS === "true" || process.env.USE_REAL_SMS === "1";

const OTP_LENGTH = Math.max(4, parseInt(process.env.OTP_LENGTH || "4", 10));

function randomOtp(length) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

export const generateOTP = () => {
  const production = process.env.NODE_ENV === "production";
  
  // In Phase 1, we allow either SMS or Email to be "real" to avoid breaking current flows.
  const isRealMode = useRealSMS() || useRealEmail();

  if (production && !isRealMode) {
    const err = new Error("Mock OTP mode is disabled in production");
    err.statusCode = 500;
    throw err;
  }
  
  return isRealMode ? randomOtp(OTP_LENGTH) : MOCK_OTP;
};

export { MOCK_OTP };
