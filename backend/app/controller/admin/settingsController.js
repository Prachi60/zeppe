import Setting from "../../models/setting.js";
import handleResponse from "../../utils/helper.js";

// Explicit allowlist — only these fields may be updated via the admin settings API.
// Do NOT add internal flags like isActive, role, or system-managed fields here.
const ALLOWED_SETTING_FIELDS = [
  "appName",
  "supportEmail",
  "supportPhone",
  "currencySymbol",
  "currencyCode",
  "timezone",
  "logoUrl",
  "faviconUrl",
  "primaryColor",
  "secondaryColor",
  "companyName",
  "taxId",
  "address",
  "facebook",
  "twitter",
  "instagram",
  "linkedin",
  "youtube",
  "playStoreLink",
  "appStoreLink",
  "metaTitle",
  "metaDescription",
  "metaKeywords",
  "keywords",
  "returnDeliveryCommission",
];

export const getPlatformSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({});

    if (!settings) {
      settings = await Setting.create({});
    }

    return handleResponse(
      res,
      200,
      "Platform settings fetched successfully",
      settings,
    );
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};

export const updatePlatformSettings = async (req, res) => {
  try {
    const rawPayload = req.body || {};

    // Strip any keys not in the allowlist to prevent mass assignment
    const payload = Object.fromEntries(
      Object.entries(rawPayload).filter(([key]) =>
        ALLOWED_SETTING_FIELDS.includes(key)
      )
    );

    if (Object.keys(payload).length === 0) {
      return handleResponse(res, 400, "No valid settings fields provided");
    }

    const settings = await Setting.findOneAndUpdate(
      {},
      { $set: payload },
      { new: true, upsert: true },
    );

    return handleResponse(
      res,
      200,
      "Platform settings updated successfully",
      settings,
    );
  } catch (error) {
    return handleResponse(res, 500, error.message);
  }
};
