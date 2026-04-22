import React, { useState } from "react";
import Card from "@shared/components/ui/Card";
import Badge from "@shared/components/ui/Badge";
import Input from "@shared/components/ui/Input";
import Button from "@shared/components/ui/Button";
import Modal from "@shared/components/ui/Modal";
import {
  HiOutlineCreditCard,
  HiOutlineArrowDownTray,
  HiOutlineMagnifyingGlass,
  HiOutlineDocumentText,
  HiOutlineBanknotes,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineArrowUpRight,
  HiOutlineArrowDownLeft,
  HiOutlineXMark,
} from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { BlurFade } from "@/components/ui/blur-fade";
import { MagicCard } from "@/components/ui/magic-card";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/exportUtils";
import { useSellerEarnings } from "../context/SellerEarningsContext";
import { sellerApi } from "../services/sellerApi";
import DynamicDataTable from "@shared/components/ui/DynamicDataTable";

const Transactions = () => {
  const { earningsData: data, earningsLoading: loading } = useSellerEarnings();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const stats = [
    {
      label: "Settled Balance",
      value: `₹${(data?.balances?.settledBalance || 0).toLocaleString()}`,
      icon: HiOutlineBanknotes,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "On Hold Balance",
      value: `₹${(data?.balances?.onHoldBalance || 0).toLocaleString()}`,
      icon: HiOutlineClock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Total Revenue",
      value: `₹${(data?.balances?.totalRevenue || 0).toLocaleString()}`,
      icon: HiOutlineCreditCard,
      color: "text-primary",
      bg: "bg-primary/5",
    },
  ];

  const handleDownloadReceipt = (txn) => {
    try {
      const record = {
        id: txn.id || "",
        type: txn.type || "",
        amount: `₹${Math.abs(Number(txn.amount || 0)).toLocaleString()}`,
        status: txn.status || "",
        date: txn.date || (txn.createdAt ? new Date(txn.createdAt).toLocaleDateString() : ""),
        time: txn.time || (txn.createdAt ? new Date(txn.createdAt).toLocaleTimeString() : ""),
        customer: txn.customer || "",
        ref: txn.ref || "",
      };
      exportToCSV([record], `Transaction_${record.id}`, {
        id: "Transaction ID",
        type: "Type",
        amount: "Amount",
        status: "Status",
        date: "Date",
        time: "Time",
        customer: "Customer/Recipient",
        ref: "Reference",
      });
      toast.success("Receipt downloaded");
    } catch (error) {
      toast.error("Failed to download receipt");
    }
  };

  const handleExportAll = async () => {
    setIsDownloading(true);
    try {
        const res = await sellerApi.getLedger({ limit: 1000, search: searchTerm });
        if (res.data.success) {
            const items = res.data.result?.items || [];
            if (items.length === 0) {
                toast.info("No transactions to export");
                return;
            }
            const exportData = items.map(txn => ({
                id: txn.id,
                type: txn.type,
                amount: (txn.amount || 0).toLocaleString(),
                status: txn.status,
                date: txn.date,
                customer: txn.customer,
                ref: txn.ref
            }));
            exportToCSV(exportData, "Seller_Transactions", {
                id: "ID",
                type: "Type",
                amount: "Amount",
                status: "Status",
                date: "Date",
                customer: "Recipient",
                ref: "Reference"
            });
            toast.success("Statement downloaded");
        }
    } catch (err) {
        toast.error("Export failed");
    } finally {
        setIsDownloading(false);
    }
  };

  if (loading && !data) {
    return <div className="flex items-center justify-center h-screen font-black text-slate-600">LOADING TRANSACTIONS...</div>;
  }

  return (
    <div className="space-y-8 pb-16">
      <BlurFade delay={0.1}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              Transaction Ledger
              <Badge
                variant="primary"
                className="text-[10px] px-2 py-0.5 font-black tracking-widest uppercase bg-primary/10 text-primary rounded-lg">
                Verified Entries
              </Badge>
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-bold uppercase tracking-tight opacity-70">
              Audit trail for settlements and payouts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExportAll}
              disabled={isDownloading}
              className="rounded-2xl px-6 py-3 shadow-xl shadow-primary/10 disabled:opacity-50 font-black text-[10px] uppercase tracking-widest">
              <HiOutlineDocumentText className="h-4 w-4 mr-2" />
              {isDownloading ? "Processing..." : "Download CSV"}
            </Button>
          </div>
        </div>
      </BlurFade>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <BlurFade key={i} delay={0.15 + i * 0.05}>
            <MagicCard
              className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden bg-white p-0 hover:ring-primary/20 transition-all duration-500"
              gradientColor="#f8fafc">
              <div className="p-6 relative z-10 flex items-center gap-4">
                <div
                  className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 transition-transform duration-500 hover:scale-110",
                    stat.bg,
                    stat.color,
                  )}>
                  <stat.icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {stat.label}
                  </p>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                    {stat.value}
                  </h4>
                </div>
              </div>
            </MagicCard>
          </BlurFade>
        ))}
      </div>

      <BlurFade delay={0.4}>
        <Card className="border-none shadow-2xl shadow-slate-200/50 overflow-hidden rounded-[2rem] p-0 bg-white">
          {/* Toolbar handled by DynamicDataTable internal filters */}


          <DynamicDataTable
            apiService={sellerApi}
            endpoint="seller/ledger"
            searchPlaceholder="Search Reference or Status..."
            filters={[
              {
                key: "type",
                label: "All Transactions",
                options: [
                  { label: "Earnings", value: "Order Payment" },
                  { label: "Withdrawals", value: "Withdrawal" },
                  { label: "Refunds", value: "Refund" }
                ]
              }
            ]}
            defaultParams={{}}
            columns={[
              {
                header: "Reference",
                cell: (t) => (
                    <div className="flex items-center gap-4 group">
                        <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center font-black transition-all group-hover:rotate-12",
                            (t.amount || 0) > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                            {(t.amount || 0) > 0 ? <HiOutlineArrowDownLeft className="h-5 w-5" /> : <HiOutlineArrowUpRight className="h-5 w-5" />}
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">
                                {t.id}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {t.type}
                            </p>
                        </div>
                    </div>
                )
              },
              {
                header: "Entity / Source",
                cell: (t) => (
                    <div>
                        <p className="text-xs font-black text-slate-900">{t.customer}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{t.ref}</p>
                    </div>
                )
              },
              {
                header: "Financials",
                cell: (t) => (
                    <div>
                        <p className={cn(
                            "text-sm font-black tracking-tight",
                            (t.amount || 0) > 0 ? "text-emerald-600" : "text-rose-600"
                        )}>
                            {(t.amount || 0) > 0 ? "+" : ""}₹{Math.abs(t.amount || 0).toLocaleString()}
                        </p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            {(t.status === "Settled") ? "Settled Funds" : "Pending Sync"}
                        </p>
                    </div>
                )
              },
              {
                header: "Audit",
                cell: (t) => (
                    <Badge variant={t.status === 'Settled' ? 'success' : (['Pending', 'Processing'].includes(t.status) ? 'warning' : 'destructive')}
                           className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                        {t.status === 'Settled' ? <HiOutlineCheckCircle className="mr-1 h-3 w-3" /> : <HiOutlineClock className="mr-1 h-3 w-3" />}
                        {t.status}
                    </Badge>
                )
              },
              {
                header: "Details",
                align: "right",
                cell: (t) => (
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => {
                                setSelectedTxn(t);
                                setIsDetailModalOpen(true);
                            }}
                            className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                            <HiOutlineDocumentText className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => handleDownloadReceipt(t)}
                            className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                            <HiOutlineArrowDownTray className="h-5 w-5" />
                        </button>
                    </div>
                )
              }
            ]}
          />
        </Card>
      </BlurFade>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedTxn && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                    onClick={() => setIsDetailModalOpen(false)}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="w-full max-w-lg relative z-10 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                >
                    <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/20">
                                <HiOutlineBanknotes className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Receipt Details</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ref: {selectedTxn.id}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsDetailModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <HiOutlineXMark className="h-6 w-6 text-slate-400" />
                        </button>
                    </div>

                    <div className="p-10 space-y-8">
                        <div className="text-center p-8 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Net Adjustment</p>
                            <h2 className={cn(
                                "text-5xl font-black tracking-tight",
                                (selectedTxn.amount || 0) > 0 ? "text-emerald-600" : "text-rose-600"
                            )}>
                                {(selectedTxn.amount || 0) > 0 ? "+" : ""}₹{Math.abs(selectedTxn.amount || 0).toLocaleString()}
                            </h2>
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <Badge className="uppercase font-black text-[10px] px-4 py-1.5 rounded-full shadow-sm">
                                    {selectedTxn.status}
                                </Badge>
                                {(selectedTxn.status === 'Settled') && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-10 gap-x-6">
                            {[
                                { label: "Transaction ID", value: selectedTxn.id },
                                { label: "Operation Type", value: selectedTxn.type },
                                { label: "Counterparty", value: selectedTxn.customer },
                                { label: "Reference", value: selectedTxn.ref },
                                { label: "Date", value: selectedTxn.date },
                                { label: "Time", value: selectedTxn.time }
                            ].map((item, i) => (
                                <div key={i} className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                                    <p className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">{item.value || "—"}</p>
                                </div>
                            ))}
                        </div>

                        <div className="p-5 bg-primary/5 rounded-[1.5rem] border border-primary/10 flex gap-4">
                            <HiOutlineClock className="h-6 w-6 text-primary shrink-0" />
                            <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                                Funds are settled via T+2 rolling cycle. If you have any discrepancy regarding this entry, please contact our financial support desk.
                            </p>
                        </div>
                    </div>

                    <div className="p-10 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => window.print()} className="rounded-2xl py-4 font-black uppercase tracking-widest text-[10px] bg-white border-slate-200">
                            Print Receipt
                        </Button>
                        <Button onClick={() => setIsDetailModalOpen(false)} className="rounded-2xl py-4 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
                            Close
                        </Button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Transactions;
