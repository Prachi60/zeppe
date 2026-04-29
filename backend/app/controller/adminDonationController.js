import Donation from "../models/donation.js";
import Setting from "../models/setting.js";
import handleResponse from "../utils/helper.js";
import {
  createDonationEntry,
  parseDonationInput,
} from "../services/donationService.js";

function toNumber(value, fallback = null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function buildDonationFilters(query = {}) {
  const match = {};

  if (query.status) {
    match.status = String(query.status).trim().toUpperCase();
  }

  const minAmount = toNumber(query.minAmount);
  const maxAmount = toNumber(query.maxAmount);
  if (minAmount != null || maxAmount != null) {
    match.amount = {};
    if (minAmount != null) match.amount.$gte = minAmount;
    if (maxAmount != null) match.amount.$lte = maxAmount;
  }

  const fromDate = parseDate(query.fromDate);
  const toDate = parseDate(query.toDate);
  if (fromDate || toDate) {
    match.createdAt = {};
    if (fromDate) match.createdAt.$gte = fromDate;
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
      match.createdAt.$lte = toDate;
    }
  }

  if (query.user) {
    const escaped = String(query.user).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    match.$or = [
      { donorName: { $regex: escaped, $options: "i" } },
      { donorEmail: { $regex: escaped, $options: "i" } },
      { "meta.customerId": { $regex: escaped, $options: "i" } },
    ];
  }

  return match;
}

function mapDonationRow(donation) {
  return {
    _id: donation._id,
    donorName: donation.donorName || "Anonymous",
    donorEmail: donation.donorEmail || "",
    orderId: donation.orderId?.orderId || donation.orderId || "Direct",
    amount: donation.amount,
    status: donation.status,
    paymentStatus: donation.status,
    transactionId: donation.transactionId || null,
    date: donation.donatedAt || donation.createdAt,
    source: donation.source,
    causeId: donation.causeId,
    causeTitle: donation.causeTitle,
    message: donation.message || "",
    customerId: donation.customer?._id || null,
  };
}

async function getDonationSummary(match = {}) {
  const [rows] = await Donation.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        totalCount: { $sum: 1 },
        successfulCount: {
          $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] },
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] },
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] },
        },
      },
    },
  ]);

  return {
    totalAmount: rows?.totalAmount || 0,
    totalCount: rows?.totalCount || 0,
    successfulCount: rows?.successfulCount || 0,
    pendingCount: rows?.pendingCount || 0,
    failedCount: rows?.failedCount || 0,
  };
}

async function getMonthlyReport(match = {}) {
  const monthly = await Donation.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
        successfulAmount: {
          $sum: {
            $cond: [{ $eq: ["$status", "PAID"] }, "$amount", 0],
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  return monthly.map((item) => ({
    year: item._id.year,
    month: item._id.month,
    totalAmount: item.totalAmount,
    successfulAmount: item.successfulAmount,
    count: item.count,
  }));
}

export const getDonationsDashboard = async (req, res) => {
  try {
    const match = buildDonationFilters(req.query || {});
    const donations = await Donation.find(match)
      .sort({ createdAt: -1 })
      .limit(500)
      .populate("orderId", "orderId status")
      .populate("customer", "name email")
      .lean();

    const summary = await getDonationSummary(match);
    const monthlyReports = await getMonthlyReport(match);
    const totalDonors = new Set(
      donations
        .map((item) => String(item.customer?._id || item.donorEmail || item.donorName || ""))
        .filter(Boolean),
    ).size;

    const settings = await Setting.findOne().lean();

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalDonations: summary.totalCount,
          totalDonors,
          collectedAmount: summary.totalAmount,
          successfulDonations: summary.successfulCount,
          pendingDonations: summary.pendingCount,
          failedDonations: summary.failedCount,
        },
        monthlyReports,
        filtersApplied: match,
        donations: donations.map(mapDonationRow),
        settings: {
          donationsEnabled: settings?.donationsEnabled ?? true,
          suggestedDonationAmounts: settings?.suggestedDonationAmounts ?? [10, 20, 50, 100],
          roundOffDonationsEnabled: settings?.roundOffDonationsEnabled ?? false,
          donationCauses: settings?.donationCauses || [],
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllDonations = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const skip = (page - 1) * limit;
    const match = buildDonationFilters(req.query || {});

    const [rows, total, summary] = await Promise.all([
      Donation.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("orderId", "orderId status")
        .populate("customer", "name email")
        .lean(),
      Donation.countDocuments(match),
      getDonationSummary(match),
    ]);

    return handleResponse(res, 200, "Donations fetched", {
      items: rows.map(mapDonationRow),
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};

export const updateDonationStatus = async (req, res) => {
  try {
    const status = String(req.body?.status || "").trim().toUpperCase();
    if (!["PENDING", "PAID", "FAILED"].includes(status)) {
      return handleResponse(res, 400, "Invalid status");
    }

    const update = {
      status,
      transactionId: req.body?.transactionId || null,
      donatedAt: status === "PAID" ? new Date() : null,
    };

    const donation = await Donation.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!donation) {
      return handleResponse(res, 404, "Donation not found");
    }

    return handleResponse(res, 200, "Donation status updated", donation);
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};

export const getMyDonationHistory = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) return handleResponse(res, 401, "Unauthorized");

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      Donation.find({ customer: customerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("orderId", "orderId")
        .lean(),
      Donation.countDocuments({ customer: customerId }),
    ]);

    return handleResponse(res, 200, "Donation history fetched", {
      items: rows.map(mapDonationRow),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};

export const submitDirectDonation = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) return handleResponse(res, 401, "Unauthorized");

    const donation = parseDonationInput(req.body || {});
    if (donation.amount <= 0) {
      return handleResponse(res, 400, "Donation amount must be greater than 0");
    }

    const created = await createDonationEntry({
      customer: customerId,
      donorName: req.user?.name || req.body?.donorName || "Anonymous",
      donorEmail: req.user?.email || req.body?.donorEmail || "",
      amount: donation.amount,
      source: donation.source,
      causeId: donation.causeId,
      causeTitle: donation.causeTitle,
      message: donation.message,
      status: "PAID",
      transactionId: req.body?.transactionId || null,
      donatedAt: new Date(),
      meta: {
        direct: true,
        paymentMode: req.body?.paymentMode || "UNKNOWN",
      },
    });

    return handleResponse(res, 201, "Donation submitted successfully", created);
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};

export const updateDonationSettings = async (req, res) => {
  try {
    const { donationsEnabled, suggestedDonationAmounts, roundOffDonationsEnabled } = req.body;

    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    if (typeof donationsEnabled === "boolean") settings.donationsEnabled = donationsEnabled;
    if (Array.isArray(suggestedDonationAmounts)) settings.suggestedDonationAmounts = suggestedDonationAmounts;
    if (typeof roundOffDonationsEnabled === "boolean") settings.roundOffDonationsEnabled = roundOffDonationsEnabled;

    await settings.save();

    res.status(200).json({ success: true, message: "Donation settings updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addDonationCause = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ success: false, message: "Title is required" });

    let settings = await Setting.findOne();
    if (!settings) settings = new Setting();

    const newCause = {
      id: `cause_${Date.now()}`,
      title,
      description: description || "",
      active: true,
    };

    settings.donationCauses.push(newCause);
    await settings.save();

    res.status(201).json({ success: true, data: newCause });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDonationCause = async (req, res) => {
  try {
    const { causeId } = req.params;
    const { title, description, active } = req.body;

    const settings = await Setting.findOne();
    if (!settings) return res.status(404).json({ success: false, message: "Settings not found" });

    const causeIndex = settings.donationCauses.findIndex((c) => c.id === causeId);
    if (causeIndex === -1) return res.status(404).json({ success: false, message: "Cause not found" });

    if (title) settings.donationCauses[causeIndex].title = title;
    if (description !== undefined) settings.donationCauses[causeIndex].description = description;
    if (typeof active === "boolean") settings.donationCauses[causeIndex].active = active;

    await settings.save();

    res.status(200).json({ success: true, data: settings.donationCauses[causeIndex] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
