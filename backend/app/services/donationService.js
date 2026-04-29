import Donation from "../models/donation.js";
import Setting from "../models/setting.js";

const DEFAULT_CAUSE = {
  id: "general",
  title: "General Donation",
};

function toPositiveAmount(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Number(amount.toFixed(2)));
}

function normalizeSource(value) {
  const source = String(value || "DIRECT").trim().toUpperCase();
  if (["ROUND_OFF", "FIXED", "DIRECT"].includes(source)) return source;
  return "DIRECT";
}

function normalizeStatus(value, fallback = "PENDING") {
  const status = String(value || fallback).trim().toUpperCase();
  if (["PENDING", "PAID", "FAILED"].includes(status)) return status;
  return fallback;
}

function buildCauseMap(causes = []) {
  const map = new Map();
  for (const cause of causes || []) {
    if (!cause?.id) continue;
    map.set(String(cause.id), {
      id: String(cause.id),
      title: String(cause.title || DEFAULT_CAUSE.title),
      active: cause.active !== false,
    });
  }
  return map;
}

export async function resolveDonationCause({ causeId, causeTitle }) {
  const settings = await Setting.findOne().select("donationCauses").lean();
  const causeMap = buildCauseMap(settings?.donationCauses || []);

  if (causeId && causeMap.has(String(causeId))) {
    const resolved = causeMap.get(String(causeId));
    return { causeId: resolved.id, causeTitle: resolved.title };
  }

  if (causeTitle) {
    return {
      causeId: String(causeId || DEFAULT_CAUSE.id),
      causeTitle: String(causeTitle),
    };
  }

  const firstActive = Array.from(causeMap.values()).find((item) => item.active);
  if (firstActive) return { causeId: firstActive.id, causeTitle: firstActive.title };

  return { causeId: DEFAULT_CAUSE.id, causeTitle: DEFAULT_CAUSE.title };
}

export async function createDonationEntry(payload = {}, options = {}) {
  const amount = toPositiveAmount(payload.amount);
  if (amount <= 0) return null;

  const cause = await resolveDonationCause({
    causeId: payload.causeId,
    causeTitle: payload.causeTitle,
  });

  const [donation] = await Donation.create([{
    customer: payload.customer || null,
    donorName: payload.donorName || "Anonymous",
    donorEmail: payload.donorEmail || "",
    orderId: payload.orderId || null,
    checkoutGroupId: payload.checkoutGroupId || null,
    amount,
    status: normalizeStatus(payload.status, "PENDING"),
    source: normalizeSource(payload.source),
    causeId: cause.causeId,
    causeTitle: cause.causeTitle,
    message: payload.message || "",
    transactionId: payload.transactionId || null,
    donatedAt: payload.donatedAt || null,
    meta: payload.meta || {},
  }], options.session ? { session: options.session } : undefined);

  return donation;
}

export async function updateDonationStatusByCheckoutGroup(checkoutGroupId, updates = {}) {
  if (!checkoutGroupId) return { modifiedCount: 0 };
  const set = {};
  if (updates.status) set.status = normalizeStatus(updates.status, "PENDING");
  if (updates.transactionId !== undefined) set.transactionId = updates.transactionId || null;
  if (updates.donatedAt !== undefined) set.donatedAt = updates.donatedAt || null;

  if (!Object.keys(set).length) return { modifiedCount: 0 };
  const result = await Donation.updateMany({ checkoutGroupId }, { $set: set });
  return result;
}

export async function attachDonationOrderReference(checkoutGroupId, orderId, options = {}) {
  if (!checkoutGroupId || !orderId) return { modifiedCount: 0 };
  return Donation.updateMany(
    { checkoutGroupId, orderId: null },
    { $set: { orderId } },
    options.session ? { session: options.session } : undefined,
  );
}

export async function updateDonationStatusByOrderId(orderId, updates = {}) {
  if (!orderId) return { modifiedCount: 0 };
  const set = {};
  if (updates.status) set.status = normalizeStatus(updates.status, "PENDING");
  if (updates.transactionId !== undefined) set.transactionId = updates.transactionId || null;
  if (updates.donatedAt !== undefined) set.donatedAt = updates.donatedAt || null;

  if (!Object.keys(set).length) return { modifiedCount: 0 };
  return Donation.updateMany({ orderId }, { $set: set });
}

export function parseDonationInput(input = {}) {
  const rawAmount = input?.amount ?? input?.donationAmount ?? 0;
  const amount = toPositiveAmount(rawAmount);
  return {
    amount,
    source: normalizeSource(input?.source || (input?.isRoundOff ? "ROUND_OFF" : "DIRECT")),
    causeId: input?.causeId || null,
    causeTitle: input?.causeTitle || null,
    message: String(input?.message || "").trim(),
  };
}
