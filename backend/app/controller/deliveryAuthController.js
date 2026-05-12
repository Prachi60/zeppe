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

        let delivery = await Delivery.findOne({ email });

        if (delivery && delivery.isVerified) {
            return handleResponse(res, 400, "Delivery partner already exists with this email");
        }

        const otp = generateOTP();

        let aadharUrl = delivery?.documents?.aadhar || "";
        let panUrl = delivery?.documents?.pan || "";
        let dlUrl = delivery?.documents?.drivingLicense || "";

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

        if (!delivery) {
            delivery = await Delivery.create(deliveryData);
        } else {
            Object.assign(delivery, deliveryData);
            await delivery.save();
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

        const delivery = await Delivery.findOne({ email });

        if (!delivery) {
            return handleResponse(res, 404, "Delivery partner not found. Please signup first.");
        }

        const otp = generateOTP();

        delivery.otp = hashOtp(otp);
        delivery.otpExpiry = Date.now() + 5 * 60 * 1000;
        await delivery.save();

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

        const delivery = await Delivery.findOne({
            email,
            otp: hashOtp(otp),
            otpExpiry: { $gt: Date.now() },
        });

        if (!delivery) {
            return handleResponse(res, 400, "Invalid or expired OTP");
        }

        delivery.isEmailVerified = true;
        delivery.otp = undefined;
        delivery.otpExpiry = undefined;
        delivery.lastLogin = new Date();

        await delivery.save();

        // Check if any active plans are configured by admin for delivery boys
        const activePlansCount = await mongoose.model("SubscriptionPlan").countDocuments({
            targetRole: "delivery",
            isActive: true,
            deletedAt: null
        });

        // Verify subscription status dynamically
        const activeSub = await UserSubscription.findOne({
            userId: delivery._id,
            role: "delivery",
            status: "active",
            endDate: { $gt: new Date() }
        });

        const token = generateToken(delivery);

        // Verify subscription status dynamically
        const settings = await Setting.findOne({});
        const isGlobalEnabled = settings?.subscriptionsEnabled !== false;

        const activeSub = await UserSubscription.findOne({
            userId: delivery._id,
            role: "delivery",
            status: "active",
            endDate: { $gt: new Date() }
        });

        const deliveryObj = delivery.toObject();
        deliveryObj.subscriptionStatus = (activeSub || !isGlobalEnabled) ? "active" : "inactive";
        const deliveryObj = delivery.toObject();
        deliveryObj.subscriptionStatus = activeSub ? "active" : "inactive";
        deliveryObj.plansAvailable = activePlansCount > 0;

        return handleResponse(res, 200, "Login successful", {
            token,
            delivery: deliveryObj,
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
        const delivery = await Delivery.findById(req.user.id);
        if (!delivery) {
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

        const deliveryObj = delivery.toObject();
        deliveryObj.subscriptionStatus = (activeSub || !isGlobalEnabled) ? "active" : "inactive";
        deliveryObj.subscriptionStatus = activeSub ? "active" : "inactive";
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

        const delivery = await Delivery.findById(req.user.id);
        if (!delivery) {
            return handleResponse(res, 404, "Delivery partner not found");
        }

        if (name) delivery.name = name;
        if (email) delivery.email = email;
        if (address) delivery.address = address;
        if (vehicleType) delivery.vehicleType = vehicleType;
        if (vehicleNumber) delivery.vehicleNumber = vehicleNumber;
        if (vehicleModel) delivery.vehicleModel = vehicleModel;
        if (vehicleColor) delivery.vehicleColor = vehicleColor;
        if (fuelType) delivery.fuelType = fuelType;
        if (drivingLicenseNumber) delivery.drivingLicenseNumber = drivingLicenseNumber;
        if (drivingLicenseExpiry) delivery.drivingLicenseExpiry = drivingLicenseExpiry;
        if (rcExpiry) delivery.rcExpiry = rcExpiry;
        if (currentArea) delivery.currentArea = currentArea;
        if (dob) delivery.dob = dob;
        if (bloodGroup) delivery.bloodGroup = bloodGroup;
        if (accountHolder) delivery.accountHolder = accountHolder;
        if (accountNumber) delivery.accountNumber = accountNumber;
        if (ifsc) delivery.ifsc = ifsc;
        if (typeof isOnline !== 'undefined') delivery.isOnline = isOnline;

        await delivery.save();

        return handleResponse(res, 200, "Profile updated successfully", delivery);
    } catch (error) {
        return handleResponse(res, 500, error.message);
    }
};
