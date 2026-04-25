import Seller from "../models/seller.js";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import handleResponse from "../utils/helper.js";
import {
    issueSellerVerificationOtp,
    verifySellerOtpCode,
    verifySellerVerificationToken,
} from "../services/sellerVerificationService.js";
import { uploadToCloudinary } from "../services/mediaService.js";

/* ===============================
   Utils
================================ */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_SELLER_DOCS_DIR = path.resolve(__dirname, "../../uploads/seller-documents");

const generateToken = (seller) =>
    jwt.sign({ id: seller._id, role: "seller" }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

const SELLER_DOCUMENT_FIELDS = {
    tradeLicense: "Trade License",
    gstCertificate: "GST Certificate",
    idProof: "ID Proof",
};

const REQUIRED_SELLER_DOCUMENT_FIELDS = Object.keys(SELLER_DOCUMENT_FIELDS);

const parseDocumentsPayload = (documents) => {
    if (!documents) {
        return {};
    }

    if (typeof documents === "string") {
        try {
            return JSON.parse(documents);
        } catch {
            return {};
        }
    }

    if (typeof documents === "object") {
        return documents;
    }

    return {};
};

const isValidUploadedDocumentReference = (value) => {
    const normalized = String(value || "").trim();
    return /^https?:\/\//i.test(normalized);
};

const resolveSellerDocuments = (body = {}, parsedDocuments = {}) => {
    const resolved = { ...(parsedDocuments || {}) };

    const directFields = {
        tradeLicense: body.tradeLicenseUrl || body.tradeLicense,
        gstCertificate: body.gstCertificateUrl || body.gstCertificate,
        idProof: body.idProofUrl || body.idProof,
    };

    for (const [field, candidate] of Object.entries(directFields)) {
        const normalized = String(candidate || "").trim();
        if (normalized && /^https?:\/\//i.test(normalized)) {
            resolved[field] = normalized;
        }
    }

    return resolved;
};

const getMissingRequiredSellerDocuments = (documents = {}) =>
    REQUIRED_SELLER_DOCUMENT_FIELDS.filter(
        (fieldName) => !isValidUploadedDocumentReference(documents[fieldName]),
    );

const buildPublicBaseUrl = (req) => {
    const configuredOrigin = String(
        process.env.PUBLIC_BACKEND_URL ||
        process.env.BACKEND_PUBLIC_URL ||
        process.env.API_BASE_URL ||
        "",
    ).trim();
    if (configuredOrigin) {
        return configuredOrigin.replace(/\/+$/, "");
    }

    const forwardedProto = String(req.headers["x-forwarded-proto"] || "").trim();
    const protocol = forwardedProto || req.protocol || "http";
    return `${protocol}://${req.get("host")}`;
};

const isImageDocumentFile = (file) =>
    String(file?.mimetype || "").toLowerCase().startsWith("image/");

const sanitizeFileExtension = (file) => {
    const fromMime = String(file?.mimetype || "").toLowerCase();
    if (fromMime === "application/pdf") return ".pdf";
    if (fromMime === "application/msword") return ".doc";
    if (
        fromMime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
        return ".docx";
    }

    const ext = path.extname(String(file?.originalname || "")).toLowerCase();
    if (/^\.[a-z0-9]{1,10}$/.test(ext)) return ext;
    return "";
};

const saveSellerDocumentLocally = async (file, req) => {
    await fs.mkdir(LOCAL_SELLER_DOCS_DIR, { recursive: true });

    const safeFieldName = String(file?.fieldname || "document")
        .replace(/[^a-z0-9_-]/gi, "")
        .toLowerCase();
    const extension = sanitizeFileExtension(file) || ".bin";
    const uniqueName = `${safeFieldName}-${Date.now()}-${crypto.randomUUID()}${extension}`;
    const targetPath = path.join(LOCAL_SELLER_DOCS_DIR, uniqueName);

    await fs.writeFile(targetPath, file.buffer);

    return `${buildPublicBaseUrl(req)}/uploads/seller-documents/${uniqueName}`;
};

/* ===============================
   SELLER SIGNUP
================================ */
export const signupSeller = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            password,
            emailVerificationToken,
            shopName,
            category,
            description,
            address,
            locality,
            pincode,
            city,
            state,
            documents,
            lat,
            lng,
            radius
        } = req.body || {};

        // 1. Handle file uploads if they exist in req.files (multipart form)
        const documentFiles = req.files || [];
        const uploadedDocs = {};

        if (Array.isArray(documentFiles) && documentFiles.length > 0) {
            for (const file of documentFiles) {
                try {
                    const fieldName = file.fieldname;
                    if (fieldName && REQUIRED_SELLER_DOCUMENT_FIELDS.includes(fieldName)) {
                        const url = isImageDocumentFile(file)
                            ? await uploadToCloudinary(file.buffer, "docs")
                            : await saveSellerDocumentLocally(file, req);
                        uploadedDocs[fieldName] = url;
                    }
                } catch (err) {
                    console.error("Failed to upload document to Cloudinary", err);
                    return handleResponse(
                        res,
                        500,
                        `Failed to upload ${SELLER_DOCUMENT_FIELDS[file.fieldname] || "document"}`,
                    );
                }
            }
        }

        // Merge uploaded document URLs into body for resolveSellerDocuments
        const augmentedBody = {
            ...req.body,
            ...uploadedDocs
        };

        const parsedLat = lat !== undefined ? Number(lat) : undefined;
        const parsedLng = lng !== undefined ? Number(lng) : undefined;
        const parsedRadius = radius !== undefined ? Number(radius) : undefined;

        if (!name || !email || !phone || !password || !shopName) {
            return handleResponse(res, 400, "All fields are required");
        }

        verifySellerVerificationToken({
            channel: "email",
            rawValue: email,
            token: emailVerificationToken,
        });

        // Validate coordinates and radius if provided
        if (lat !== undefined && (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90)) {
            return handleResponse(res, 400, "Invalid latitude");
        }
        if (lng !== undefined && (!Number.isFinite(parsedLng) || parsedLng < -180 || parsedLng > 180)) {
            return handleResponse(res, 400, "Invalid longitude");
        }
        if (radius !== undefined && (!Number.isFinite(parsedRadius) || parsedRadius < 1 || parsedRadius > 100)) {
            return handleResponse(res, 400, "Radius must be between 1 and 100 km");
        }

        let seller = await Seller.findOne({ $or: [{ email }, { phone }] });

        if (seller) {
            return handleResponse(res, 400, "Seller with this email or phone already exists");
        }

        const parsedDocuments = parseDocumentsPayload(documents);
        const sellerDocuments = resolveSellerDocuments(augmentedBody, parsedDocuments);
        const missingRequiredDocuments = getMissingRequiredSellerDocuments(
            sellerDocuments || {}
        );

        if (missingRequiredDocuments.length > 0) {
            const readableMissing = missingRequiredDocuments
                .map((field) => SELLER_DOCUMENT_FIELDS[field] || field)
                .join(", ");
            return handleResponse(
                res,
                400,
                `All required documents must be uploaded: ${readableMissing}`
            );
        }

        const sellerData = {
            name,
            email,
            phone,
            password,
            shopName,
            category,
            description,
            address,
            locality,
            pincode,
            city,
            state,
            documents: sellerDocuments,
            applicationStatus: "pending",
            isVerified: false,
            emailVerified: true,
            phoneVerified: true,
            isActive: false,
        };

        if (parsedLat !== undefined && parsedLng !== undefined) {
            sellerData.location = {
                type: "Point",
                coordinates: [parsedLng, parsedLat],
            };
        }

        if (parsedRadius !== undefined) {
            sellerData.serviceRadius = parsedRadius;
        }

        seller = await Seller.create(sellerData);

        return handleResponse(res, 201, "Seller registered successfully", {
            seller,
            applicationStatus: "pending",
            requiresApproval: true,
        });
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

export const sendSellerSignupOtp = async (req, res) => {
    try {
        const { email, value } = req.body || {};
        const targetValue = email || value;

        if (!targetValue) {
            return handleResponse(res, 400, "Email address is required");
        }

        const result = await issueSellerVerificationOtp({
            channel: "email",
            rawValue: targetValue,
            ipAddress: req.ip,
        });

        return handleResponse(res, 200, "OTP sent successfully", result);
    } catch (error) {
        return handleResponse(res, error.statusCode || 500, error.message);
    }
};

export const verifySellerSignupOtp = async (req, res) => {
    try {
        const { email, value, otp } = req.body || {};
        const targetValue = email || value;

        if (!targetValue || !otp) {
            return handleResponse(res, 400, "Email and OTP are required");
        }

        const result = await verifySellerOtpCode({
            channel: "email",
            rawValue: targetValue,
            otp,
            ipAddress: req.ip,
        });

        return handleResponse(res, 200, "OTP verified successfully", result);
    } catch (error) {
        return handleResponse(res, error.statusCode || 500, error.message);
    }
};

/* ===============================
   SELLER LOGIN
================================ */
export const loginSeller = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return handleResponse(res, 400, "Email and password are required");
        }

        // Include password for comparison
        const seller = await Seller.findOne({ email }).select("+password");

        if (!seller) {
            return handleResponse(res, 404, "Seller not found");
        }

        const isMatch = await seller.comparePassword(password);

        if (!isMatch) {
            return handleResponse(res, 401, "Invalid credentials");
        }

        const applicationStatus =
            seller.applicationStatus || (seller.isVerified ? "approved" : "pending");
        const isApproved =
            seller.isVerified === true &&
            seller.isActive === true &&
            applicationStatus === "approved";

        if (!isApproved) {
            const approvalMessage =
                applicationStatus === "rejected"
                    ? "Your seller application was rejected. Please contact support."
                    : "Your seller account is pending admin approval.";

            return handleResponse(res, 403, approvalMessage, {
                applicationStatus,
                isVerified: seller.isVerified === true,
                isActive: seller.isActive === true,
                rejectionReason: seller.rejectionReason || "",
            });
        }

        seller.lastLogin = new Date();
        await seller.save();

        const token = generateToken(seller);

        return handleResponse(res, 200, "Login successful", {
            token,
            seller,
        });
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};
