import Donation from "../models/donation.js";
import Setting from "../models/setting.js";

export const getDonationsDashboard = async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 }).populate("orderId", "orderId status").lean();
    
    const totalAmount = donations.reduce((sum, d) => d.status === "PAID" ? sum + d.amount : sum, 0);
    const totalDonors = new Set(donations.map(d => d.donorName)).size;
    const totalCount = donations.filter(d => d.status === "PAID").length;

    const settings = await Setting.findOne().lean();

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalDonations: totalCount,
          totalDonors: totalDonors,
          collectedAmount: totalAmount,
        },
        donations: donations.map(d => ({
          _id: d._id,
          donorName: d.donorName || "Anonymous",
          orderId: d.orderId?.orderId || "Direct",
          amount: d.amount,
          status: d.status,
          date: d.createdAt,
          source: d.source,
          causeTitle: d.causeTitle,
        })),
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

    const causeIndex = settings.donationCauses.findIndex(c => c.id === causeId);
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
