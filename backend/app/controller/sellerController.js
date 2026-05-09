import Seller from "../models/seller.js";
import Transaction from "../models/transaction.js";
import UserSubscription from "../models/userSubscription.js";
import Setting from "../models/setting.js";
import { handleResponse, calculateDistance } from "../utils/helper.js";
import { generateUniqueSlug } from "../utils/slugify.js";
import mongoose from "mongoose";

/* ===============================
   GET NEARBY SELLERS
================================ */
export const getNearbySellers = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return handleResponse(res, 400, "Latitude and longitude are required");
    }

    const customerLat = Number(lat);
    const customerLng = Number(lng);

    // Fetch all active/verified sellers
    // We could use $geoNear, but to strictly follow the requirement of individual radii,
    // we'll fetch sellers within a reasonable max distance (e.g. 100km) and then filter.
    const sellers = await Seller.find({
      isActive: true,
      isVerified: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [customerLng, customerLat],
          },
          $maxDistance: 100000, // 100km max search area for performance
        },
      },
    }).lean();

    // Filter based on individual service radius
    const nearbySellers = sellers.filter((seller) => {
      const sellerLng = seller.location.coordinates[0];
      const sellerLat = seller.location.coordinates[1];
      const distance = calculateDistance(
        customerLat,
        customerLng,
        sellerLat,
        sellerLng,
      );

      // Add distance to seller object for frontend
      seller.distance = distance;

      return distance <= (seller.serviceRadius || 5);
    });

    return handleResponse(
      res,
      200,
      "Nearby sellers fetched successfully",
      nearbySellers,
    );
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};

/* ===============================
   REQUEST WITHDRAWAL (Seller)
================================ */
export const requestWithdrawal = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return handleResponse(res, 400, "Please enter a valid amount");
    }

    // 1. Calculate current available balance
    // Consistent with getSellerEarnings logic in sellerStatsController.js
    const transactions = await Transaction.find({
      user: sellerId,
      userModel: "Seller",
    })
      .select("status amount type")
      .lean();

    const settledBalance = transactions
      .filter((t) => t.status === "Settled")
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    const pendingPayouts = transactions
      .filter(
        (t) =>
          t.type === "Withdrawal" &&
          (t.status === "Pending" || t.status === "Processing"),
      )
      .reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);

    const availableBalance = settledBalance - pendingPayouts;

    if (amount > availableBalance) {
      return handleResponse(
        res,
        400,
        `Insufficient balance. Available: ₹${availableBalance}`,
      );
    }

    // 2. Create Withdrawal Transaction
    // Withdrawals have negative amounts per the model comment
    const withdrawal = await Transaction.create({
      user: sellerId,
      userModel: "Seller",
      type: "Withdrawal",
      amount: -Math.abs(amount),
      status: "Pending",
      reference: `WDR-${Date.now()}`,
    });

    return handleResponse(
      res,
      201,
      "Withdrawal request submitted successfully",
      withdrawal,
    );
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};

/* ===============================
   GET SELLER PROFILE
================================ */
export const getSellerProfile = async (req, res) => {
  try {
    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return handleResponse(res, 404, "Seller not found");
    }
    // Verify subscription status dynamically
    const settings = await Setting.findOne({});
    const isGlobalEnabled = settings?.subscriptionsEnabled !== false;

    const activeSub = await UserSubscription.findOne({
      userId: req.user.id,
      role: "seller",
      status: "active",
      endDate: { $gt: new Date() }
    });

    const sellerObj = seller.toObject();
    sellerObj.subscriptionStatus = (activeSub || !isGlobalEnabled) ? "active" : "inactive";

    return handleResponse(
      res,
      200,
      "Seller profile fetched successfully",
      sellerObj,
    );
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};

/* ===============================
   UPDATE SELLER PROFILE
================================ */
export const updateSellerProfile = async (req, res) => {
  try {
    const {
      name,
      shopName,
      phone,
      address,
      locality,
      pincode,
      city,
      state,
      lat,
      lng,
      radius,
      shopLogo,
      shopBanner,
      bankDetails,
      category,
      description,
    } = req.body;

    // Find seller
    const seller = await Seller.findById(req.user.id);
    if (!seller) {
      return handleResponse(res, 404, "Seller not found");
    }

    // Update fields if provided
    if (name) seller.name = name;
    if (shopName && shopName !== seller.shopName) {
      seller.shopName = shopName;
      const slugResult = await generateUniqueSlug({
        Model: Seller,
        name: shopName,
        sellerId: null, // Stores must be globally unique
        excludeId: seller._id
      });
      if (slugResult.success) {
        seller.slug = slugResult.slug;
      }
    }
    if (phone) seller.phone = phone;
    if (address !== undefined) seller.address = address;
    if (locality !== undefined) seller.locality = locality;
    if (pincode !== undefined) seller.pincode = pincode;
    if (city !== undefined) seller.city = city;
    if (state !== undefined) seller.state = state;
    if (shopLogo !== undefined) seller.shopLogo = String(shopLogo || "").trim();
    if (shopBanner !== undefined) seller.shopBanner = String(shopBanner || "").trim();
    if (bankDetails !== undefined) {
      seller.bankDetails = {
        ...(seller.bankDetails || {}),
        ...bankDetails
      };
    }
    if (category !== undefined) seller.category = category;
    if (description !== undefined) seller.description = description;

    // Validate and update geo data
    if (lat !== undefined && lng !== undefined) {
      if (lat < -90 || lat > 90)
        return handleResponse(res, 400, "Invalid latitude");
      if (lng < -180 || lng > 180)
        return handleResponse(res, 400, "Invalid longitude");

      seller.location = {
        type: "Point",
        coordinates: [Number(lng), Number(lat)],
      };
    }

    if (radius !== undefined) {
      if (radius < 1 || radius > 100)
        return handleResponse(res, 400, "Radius must be between 1 and 100 km");
      seller.serviceRadius = Number(radius);
    }

    const updatedSeller = await seller.save();

    return handleResponse(
      res,
      200,
      "Profile updated successfully",
      updatedSeller,
    );
  } catch (error) {
    // Handle duplicate phone error
    if (error.code === 11000) {
      return handleResponse(res, 400, "Phone number already in use");
    }
    return handleResponse(res, 500, error.message);
  }
};

/* ===============================
   GET PUBLIC SELLER BY ID
================================ */
export const getPublicSellerById = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.query;

    const seller = await Seller.findById(id)
      .select("shopName shopLogo shopBanner address locality city state location isActive isVerified serviceRadius")
      .lean();

    if (!seller) {
      return handleResponse(res, 404, "Seller not found");
    }

    // Add distance if coordinates provided
    if (lat && lng) {
      const sellerLng = seller.location.coordinates[0];
      const sellerLat = seller.location.coordinates[1];
      seller.distance = calculateDistance(
        Number(lat),
        Number(lng),
        sellerLat,
        sellerLng,
      );
    }

    return handleResponse(
      res,
      200,
      "Seller details fetched successfully",
      seller,
    );
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};
