import Joi from "joi";

const roleSchema = Joi.string().valid("seller", "delivery");
const statusSchema = Joi.string().valid("active", "expired", "pending", "failed", "cancelled");

export const createPlanSchema = Joi.object({
  targetRole: roleSchema.optional(),
  role: roleSchema.optional(),
  name: Joi.string().trim().min(2).max(120).required(),
  price: Joi.number().min(0).required(),
  duration: Joi.object({
    value: Joi.number().integer().min(1).required(),
    unit: Joi.string().valid("days", "months").required(),
  }).required(),
  features: Joi.array().items(Joi.string().trim().max(200)).default([]),
  isActive: Joi.boolean().default(true),
})
  .or("targetRole", "role")
  .custom((value, helpers) => {
    const normalizedRole = value.targetRole || value.role;
    return { ...value, targetRole: normalizedRole, role: normalizedRole };
  });

export const updatePlanSchema = Joi.object({
  targetRole: roleSchema.optional(),
  role: roleSchema.optional(),
  name: Joi.string().trim().min(2).max(120).optional(),
  price: Joi.number().min(0).optional(),
  duration: Joi.object({
    value: Joi.number().integer().min(1).required(),
    unit: Joi.string().valid("days", "months").required(),
  }).optional(),
  features: Joi.array().items(Joi.string().trim().max(200)).optional(),
  isActive: Joi.boolean().optional(),
}).custom((value) => {
  if (!value.targetRole && value.role) return { ...value, targetRole: value.role };
  if (value.targetRole && !value.role) return { ...value, role: value.targetRole };
  if (value.targetRole && value.role && value.targetRole !== value.role) {
    return { ...value, role: value.targetRole };
  }
  return value;
});

export const plansQuerySchema = Joi.object({
  role: roleSchema.optional(),
  targetRole: roleSchema.optional(),
  isActive: Joi.boolean().optional(),
});

export const updateSubscriptionStatusSchema = Joi.object({
  status: statusSchema.required(),
});

