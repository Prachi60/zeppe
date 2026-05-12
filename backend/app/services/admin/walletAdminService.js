import Transaction from "../../models/transaction.js";
import Notification from "../../models/notification.js";
import { getAdminFinanceSummary } from "../finance/walletService.js";
import { getLedgerEntries, createLedgerEntry } from "../finance/ledgerService.js";

export async function getAdminWalletOverview({ page, limit }) {
  const stats = await getAdminFinanceSummary();
  const ledger = await getLedgerEntries({ page, limit });
  const transactionItems = ledger.items.map((entry) => ({
    id: entry.transactionId || entry.reference || String(entry._id),
    type: entry.type,
    amount:
      entry.direction === "DEBIT"
        ? -Math.abs(entry.amount || 0)
        : Math.abs(entry.amount || 0),
    status: entry.status,
    sender: entry.direction === "DEBIT" ? entry.actorType : "System/Order",
    recipient: entry.direction === "CREDIT" ? entry.actorType : "Platform Wallet",
    date: new Date(entry.createdAt).toLocaleDateString(),
    time: new Date(entry.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    notes: entry.description || entry.type,
    method: entry.paymentMode || "N/A",
  }));

  return {
    stats: {
      totalPlatformEarning: stats.totalPlatformEarning,
      totalAdminEarning: stats.totalAdminEarning,
      availableBalance: stats.availableBalance,
      sellerPendingPayouts: stats.sellerPendingPayouts,
      deliveryPendingPayouts: stats.deliveryPendingPayouts,
      systemFloat: stats.systemFloatCOD,
    },
    transactions: {
      items: transactionItems,
      page: ledger.page,
      limit: ledger.limit,
      total: ledger.total,
      totalPages: ledger.totalPages,
    },
  };
}

export async function getDeliveryTransactionsData({ page, limit, skip }) {
  const query = { userModel: "Delivery" };
  const transactions = await Transaction.find(query)
    .populate("user", "name phone documents")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Transaction.countDocuments(query);

  return {
    items: transactions,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getSellerWithdrawalsData({ page, limit, skip }) {
  const query = { userModel: "Seller", type: "Withdrawal" };

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .populate("user", "name shopName phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(query),
  ]);

  return {
    items: transactions,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getSellerTransactionsData({ page, limit, skip }) {
  const query = { userModel: "Seller" };
  const transactions = await Transaction.find(query)
    .populate("user", "name shopName phone bankDetails")
    .populate({
      path: "order",
      select: "orderId pricing paymentBreakdown",
      populate: {
        path: "items.product",
        select: "name",
      },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Transaction.countDocuments(query);

  // Global Stats Aggregation
  const statsAggregation = await Transaction.aggregate([
    { $match: query },
    {
      $lookup: {
        from: "orders",
        localField: "order",
        foreignField: "_id",
        as: "orderData",
      },
    },
    { $unwind: { path: "$orderData", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: null,
        totalGross: {
          $sum: {
            $cond: [
              { $in: ["$type", ["Seller Earning", "Order Payment"]] },
              "$amount",
              0,
            ],
          },
        },
        totalCommission: {
          $sum: {
            $ifNull: [
              "$orderData.paymentBreakdown.adminProductCommissionTotal",
              0,
            ],
          },
        },
        totalPayouts: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ["$type", ["Withdrawal", "Payout"]] },
                  { $eq: ["$status", "Settled"] },
                ],
              },
              { $abs: "$amount" },
              0,
            ],
          },
        },
        pendingSettlements: {
          $sum: {
            $cond: [{ $eq: ["$status", "Pending"] }, { $abs: "$amount" }, 0],
          },
        },
      },
    },
  ]);

  const globalStats = statsAggregation[0] || {
    totalGross: 0,
    totalCommission: 0,
    totalPayouts: 0,
    pendingSettlements: 0,
  };

  return {
    items: transactions,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    stats: globalStats,
  };
}

export async function getDeliveryWithdrawalsData({ page, limit, skip }) {
  const query = { userModel: "Delivery", type: "Withdrawal" };

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .populate("user", "name phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(query),
  ]);

  return {
    items: transactions,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function updateWithdrawalStatusById({ id, status, reason }) {
  if (!["Settled", "Failed", "Processing"].includes(status)) {
    throw new Error("Invalid status");
  }

  const transaction = await Transaction.findById(id).populate("user", "name");
  if (!transaction) {
    return null;
  }

  transaction.status = status;
  if (reason) {
    transaction.notes = reason;
  }

  await transaction.save();

  // If the withdrawal is settled, record it in the ledger so it shows up in Admin Wallet History
  if (status === "Settled") {
    try {
      await createLedgerEntry({
        transactionId: transaction.reference || `WDR-${transaction._id}`,
        actorType: transaction.userModel === "Seller" ? "SELLER" : "DELIVERY_PARTNER",
        actorId: transaction.user._id,
        type: "WITHDRAWAL",
        direction: "DEBIT",
        amount: Math.abs(transaction.amount),
        status: "COMPLETED",
        description: `Withdrawal settled for ${transaction.user?.name || transaction.userModel}`,
        reference: transaction.reference,
        metadata: {
            transactionId: transaction._id
        }
      });
    } catch (ledgerError) {
      console.error("Failed to create ledger entry for withdrawal settlement:", ledgerError);
      // We don't throw here to avoid failing the status update, but we log it
    }
  }

  return transaction;
}

export async function settleDeliveryTransactionById(id) {
  const transaction = await Transaction.findByIdAndUpdate(
    id,
    { status: "Settled" },
    { new: true },
  ).populate("user", "name");

  if (!transaction) {
    return null;
  }

  await Notification.create({
    recipient: transaction.user._id,
    recipientModel: "Delivery",
    title: "Payment Settled",
    message: `Your payment of \u20B9${transaction.amount} has been settled.`,
    type: "payment",
    data: { transactionId: transaction._id },
  });

  return transaction;
}

export async function bulkSettleDeliveryTransactions() {
  return Transaction.updateMany(
    { userModel: "Delivery", status: "Pending" },
    { status: "Settled" },
  );
}
