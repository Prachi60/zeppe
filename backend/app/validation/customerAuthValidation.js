import Joi from "joi";

export const sendSignupOtpSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().email().trim().required(),
});

export const sendLoginOtpSchema = Joi.object({
  email: Joi.string().email().trim().required(),
});

export const verifyOtpSchema = Joi.object({
  email: Joi.string().email().trim().required(),
  otp: Joi.string().trim().pattern(/^\d{4,8}$/).required(),
});

export function validateSchema(schema, payload) {
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (!error) return value;
  const err = new Error(error.details.map((item) => item.message).join("; "));
  err.statusCode = 400;
  throw err;
}
