import jwt from "jsonwebtoken";
import handleResponse from "../utils/helper.js";
import Admin from "../models/admin.js";
import Delivery from "../models/delivery.js";
import Seller from "../models/seller.js";
import User from "../models/customer.js";

const AUTH_MODEL_BY_ROLE = {
  admin: Admin,
  seller: Seller,
  delivery: Delivery,
  customer: User,
  user: User,
};

function extractBearerToken(req) {
  const authHeader = String(req.headers?.authorization || "").trim();
  if (!authHeader) return "";

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function resolveAuthModel(role) {
  return AUTH_MODEL_BY_ROLE[String(role || "").toLowerCase()] || null;
}

function unauthorized(res, message) {
  return handleResponse(res, 401, message);
}

/* ===============================
   Verify Token
================================ */
export const verifyToken = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      return unauthorized(res, "Unauthorized, token missing");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const normalizedRole = String(decoded?.role || "").toLowerCase();
    const AuthModel = resolveAuthModel(normalizedRole);

    if (!decoded?.id || !AuthModel) {
      return unauthorized(res, "Invalid token payload");
    }

    const principal = await AuthModel.findById(decoded.id)
      .select("_id role isActive isVerified")
      .lean();

    if (!principal) {
      return unauthorized(res, "User account not found");
    }

    if (principal.isActive === false) {
      return handleResponse(res, 403, "Account suspended. Please contact support.");
    }

    req.user = {
      ...decoded,
      id: String(principal._id),
      role: normalizedRole,
    };
    req.authToken = token;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return unauthorized(res, "Token expired");
    }
    return unauthorized(res, "Invalid or expired token");
  }
};

/* ===============================
   Optional Verify Token (for public routes that need user context)
================================ */
export const optionalVerifyToken = (req, res, next) => {
  try {
    const token = extractBearerToken(req);

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
          ...decoded,
          role: String(decoded?.role || "").toLowerCase(),
        };
        req.authToken = token;
      } catch (error) {
        // Token is invalid, but we don't block the request
        req.user = null;
      }
    }

    next();
  } catch (error) {
    // Don't block the request, just continue without user
    next();
  }
};

/* ===============================
   Role Based Access
================================ */
export const allowRoles = (...roles) => {
  return (req, res, next) => {
    const normalizedAllowedRoles = roles.map((role) => String(role).toLowerCase());

    if (!req.user?.role) {
      return unauthorized(res, "Unauthorized");
    }

    if (!normalizedAllowedRoles.includes(String(req.user.role).toLowerCase())) {
      return handleResponse(res, 403, "Access denied");
    }

    next();
  };
};

/* ===============================
   Ensure seller can access seller-only operational routes
================================ */
export const requireApprovedSeller = async (req, res, next) => {
  try {
    if (req.user?.role !== "seller") {
      return next();
    }

    const seller = await Seller.findById(req.user.id)
      .select("isVerified isActive applicationStatus rejectionReason")
      .lean();

    if (!seller) {
      return handleResponse(res, 401, "Seller account not found");
    }

    const applicationStatus =
      seller.applicationStatus || (seller.isVerified ? "approved" : "pending");
    const isApproved =
      seller.isVerified === true &&
      seller.isActive === true &&
      applicationStatus === "approved";

    if (!isApproved) {
      const message =
        applicationStatus === "rejected"
          ? "Seller application rejected. Please contact admin support."
          : "Seller account is pending admin approval.";

      return handleResponse(res, 403, message, {
        applicationStatus,
        isVerified: seller.isVerified === true,
        isActive: seller.isActive === true,
        rejectionReason: seller.rejectionReason || "",
      });
    }

    next();
  } catch (error) {
    return handleResponse(res, 500, "Unable to validate seller approval status");
  }
};
