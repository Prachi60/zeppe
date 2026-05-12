import Delivery from "../models/delivery.js";
import UserSubscription from "../models/userSubscription.js";
import Setting from "../models/setting.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import handleResponse from "../utils/helper.js";
import { sendOtpEmail } from "../services/nodemailerService.js";
import { generateOTP, useRealEmail, hashOtp } from "../utils/otp.js";

const generateToken = (delivery) =>
    jwt.sign(
        { id: delivery._id, role: "delivery" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

/* ===============================
   SIGNUP – Send OTP
================================ */
export const signupDelivery = async (req, res) => {
    try {
        const body = req.body || {};
        const {
            name, email, vehicleType,
            phone, address, vehicleNumber,
            drivingLicenseNumber,
            accountHolder, accountNumber, ifsc
        } = body;

        if (!name || !email) {
            return handleResponse(res, 400, "Name and email are required");
        }

        let deliveryDoc = await Delivery.findOne({ email });

        if (deliveryDoc && deliveryDoc.isVerified) {
            return handleResponse(res, 400, "Delivery partner already exists with this email");
        }

        const otp = generateOTP();

        let aadharUrl = deliveryDoc?.documents?.aadhar || "";
        let panUrl = deliveryDoc?.documents?.pan || "";
        let dlUrl = deliveryDoc?.documents?.drivingLicense || "";

        const normalizedAadhar = String(body?.aadharUrl || body?.aadhar || "").trim();
        const normalizedPan = String(body?.panUrl || body?.pan || "").trim();
        const normalizedDl = String(
          body?.drivingLicenseUrl || body?.dlUrl || body?.dl || "",
        ).trim();
        if (/^https?:\/\//i.test(normalizedAadhar)) aadharUrl = normalizedAadhar;
        if (/^https?:\/\//i.test(normalizedPan)) panUrl = normalizedPan;
        if (/^https?:\/\//i.test(normalizedDl)) dlUrl = normalizedDl;

        const deliveryData = {
            name,
            email,
            phone,
            vehicleType,
            address,
            vehicleNumber,
            drivingLicenseNumber,
            accountHolder,
            accountNumber,
            ifsc,
            documents: {
                aadhar: aadharUrl,
                pan: panUrl,
                drivingLicense: dlUrl,
            },
            applicationStatus: "pending",
            rejectionReason: "",
            reviewedAt: null,
            otp: hashOtp(otp),
            otpExpiry: Date.now() + 5 * 60 * 1000,
        };

        if (!deliveryDoc) {
            deliveryDoc = await Delivery.create(deliveryData);
        } else {
            Object.assign(deliveryDoc, deliveryData);
            await deliveryDoc.save();
        }

        if (useRealEmail()) {
            await sendOtpEmail({ to: email, otp, purpose: "delivery_signup" });
        }

        console.log("-------------------");
        console.log("Delivery Signup Request Received");
        console.log("Data:", { name, email, vehicleType, phone });
        if (useRealEmail()) {
            console.log("OTP dispatched via Email provider");
        } else {
            console.log("OTP (mock mode): use 1234");
        }
        console.log("-------------------");

        return handleResponse(res, 200, "OTP sent successfully to your email");
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

/* ===============================
   LOGIN – Send OTP
================================ */
export const loginDelivery = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return handleResponse(res, 400, "Email is required");
        }

        const deliveryDoc = await Delivery.findOne({ email });

        if (!deliveryDoc) {
            return handleResponse(res, 404, "Delivery partner not found. Please signup first.");
        }

        const otp = generateOTP();

        deliveryDoc.otp = hashOtp(otp);
        deliveryDoc.otpExpiry = Date.now() + 5 * 60 * 1000;
        await deliveryDoc.save();

        if (useRealEmail()) {
            await sendOtpEmail({ to: email, otp, purpose: "delivery_login" });
        }

        console.log("-------------------");
        console.log("Delivery Login Request Received");
        console.log("Email:", email);
        if (useRealEmail()) {
            console.log("OTP dispatched via Email provider");
        } else {
            console.log("OTP (mock mode): use 1234");
        }
        console.log("-------------------");

        return handleResponse(res, 200, "OTP sent successfully to your email");
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

/* ===============================
   VERIFY OTP
================================ */
export const verifyDeliveryOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return handleResponse(res, 400, "Email and OTP are required");
        }

        const deliveryDoc = await Delivery.findOne({
            email,
            otp: hashOtp(otp),
            otpExpiry: { $gt: Date.now() },
        });

        if (!deliveryDoc) {
            return handleResponse(res, 400, "Invalid or expired OTP");
        }

        deliveryDoc.isEmailVerified = true;
        deliveryDoc.otp = undefined;
        deliveryDoc.otpExpiry = undefined;
        deliveryDoc.lastLogin = new Date();

        await deliveryDoc.save();

        // Check if any active plans are configured by admin for delivery boys
        const activePlansCount = await mongoose.model("SubscriptionPlan").countDocuments({
            targetRole: "delivery",
            isActive: true,
            deletedAt: null
        });

        const token = generateToken(deliveryDoc);

        // Verify subscription status dynamically
        const settings = await Setting.findOne({});
        const isGlobalEnabled = settings?.subscriptionsEnabled !== false;

        const activeSub = await UserSubscription.findOne({
            userId: deliveryDoc._id,
            role: "delivery",
            status: "active",
            endDate: { $gt: new Date() }
        });

        const deliveryObj = deliveryDoc.toObject();
        deliveryObj.subscriptionStatus = (activeSub || !isGlobalEnabled) ? "active" : "inactive";
        deliveryObj.plansAvailable = activePlansCount > 0;

        return handleResponse(res, 200, "Login successful", {
            token,
            delivery: deliveryObj,
        });
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

/* ===============================
   GET PROFILE
================================ */
export const getDeliveryProfile = async (req, res) => {
    try {
        const deliveryDoc = await Delivery.findById(req.user.id);
        if (!deliveryDoc) {
            return handleResponse(res, 404, "Delivery partner not found");
        }
        // Verify subscription status dynamically
        const settings = await Setting.findOne({});
        const isGlobalEnabled = settings?.subscriptionsEnabled !== false;

        const activeSub = await UserSubscription.findOne({
            userId: req.user.id,
            role: "delivery",
            status: "active",
            endDate: { $gt: new Date() }
        });

        // Check if any active plans are configured by admin for delivery boys
        const activePlansCount = await mongoose.model("SubscriptionPlan").countDocuments({
            targetRole: "delivery",
            isActive: true,
            deletedAt: null
        });

        const deliveryObj = deliveryDoc.toObject();
        deliveryObj.subscriptionStatus = (activeSub || !isGlobalEnabled) ? "active" : "inactive";
        deliveryObj.plansAvailable = activePlansCount > 0;

        return handleResponse(res, 200, "Profile fetched successfully", deliveryObj);
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};

/* ===============================
   UPDATE PROFILE
================================ */
export const updateDeliveryProfile = async (req, res) => {
    try {
        const { 
            name, vehicleType, vehicleNumber, drivingLicenseNumber, currentArea, 
            isOnline, dob, bloodGroup, email, address,
            vehicleModel, vehicleColor, fuelType, drivingLicenseExpiry, rcExpiry,
            accountHolder, accountNumber, ifsc
        } = req.body;

        const deliveryDoc = await Delivery.findById(req.user.id);
        if (!deliveryDoc) {
            return handleResponse(res, 404, "Delivery partner not found");
        }

        if (name) deliveryDoc.name = name;
        if (email) deliveryDoc.email = email;
        if (address) deliveryDoc.address = address;
        if (vehicleType) deliveryDoc.vehicleType = vehicleType;
        if (vehicleNumber) deliveryDoc.vehicleNumber = vehicleNumber;
        if (vehicleModel) deliveryDoc.vehicleModel = vehicleModel;
        if (vehicleColor) deliveryDoc.vehicleColor = vehicleColor;
        if (fuelType) deliveryDoc.fuelType = fuelType;
        if (drivingLicenseNumber) deliveryDoc.drivingLicenseNumber = drivingLicenseNumber;
        if (drivingLicenseExpiry) deliveryDoc.drivingLicenseExpiry = drivingLicenseExpiry;
        if (rcExpiry) deliveryDoc.rcExpiry = rcExpiry;
        if (currentArea) deliveryDoc.currentArea = currentArea;
        if (dob) deliveryDoc.dob = dob;
        if (bloodGroup) deliveryDoc.bloodGroup = bloodGroup;
        if (accountHolder) deliveryDoc.accountHolder = accountHolder;
        if (accountNumber) deliveryDoc.accountNumber = accountNumber;
        if (ifsc) deliveryDoc.ifsc = ifsc;
        if (typeof isOnline !== 'undefined') deliveryDoc.isOnline = isOnline;

        await deliveryDoc.save();

        // Verify subscription status dynamically
        const settings = await Setting.findOne({});
        const isGlobalEnabled = settings?.subscriptionsEnabled !== false;

        const activeSub = await UserSubscription.findOne({
            userId: req.user.id,
            role: "delivery",
            status: "active",
            endDate: { $gt: new Date() }
        });

        // Check if any active plans are configured by admin for delivery boys
        const activePlansCount = await mongoose.model("SubscriptionPlan").countDocuments({
            targetRole: "delivery",
            isActive: true,
            deletedAt: null
        });

        const deliveryObj = deliveryDoc.toObject();
        deliveryObj.subscriptionStatus = (activeSub || !isGlobalEnabled) ? "active" : "inactive";
        deliveryObj.plansAvailable = activePlansCount > 0;

        return handleResponse(res, 200, "Profile updated successfully", deliveryObj);
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};
