import React, { useEffect, useMemo, useState } from "react";
import Card from "@shared/components/ui/Card";
import Badge from "@shared/components/ui/Badge";
import Button from "@shared/components/ui/Button";
import { sellerApi } from "../services/sellerApi";
import { useToast } from "@shared/components/ui/Toast";
import {
    HiOutlineArrowPath,
    HiOutlineInboxStack,
    HiOutlineEye,
    HiOutlineCalendarDays,
    HiOutlineTruck,
} from "react-icons/hi2";
import { BlurFade } from "@/components/ui/blur-fade";
import { MagicCard } from "@/components/ui/magic-card";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { onReturnDropOtp } from "@core/services/orderSocket";

const Returns = () => {
    const { showToast } = useToast();
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("All");
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const canManageReturns = true;

    const refreshTable = () => setRefreshKey(prev => prev + 1);

    const tabs = [
        "All",
        "Requested",
        "Approved",
        "Rejected",
        "Pickup Assigned",
        "In Transit",
        "QC Passed",
        "QC Failed",
        "Completed",
    ];

    const mapReturnStatusLabel = (status) => {
        switch (status) {
            case "return_requested":
                return "Requested";
            case "return_approved":
                return "Approved";
            case "return_rejected":
                return "Rejected";
            case "return_pickup_assigned":
                return "Pickup Assigned";
            case "return_in_transit":
                return "In Transit";
            case "qc_passed":
                return "QC Passed";
            case "qc_failed":
                return "QC Failed";
            case "returned":
            case "refund_completed":
                return "Completed";
            default:
                return status || "Unknown";
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case "return_requested":
                return "warning";
            case "return_approved":
                return "info";
            case "return_rejected":
                return "error";
            case "return_pickup_assigned":
            case "return_in_transit":
                return "secondary";
            case "qc_passed":
                return "success";
            case "qc_failed":
                return "error";
            case "refund_completed":
            case "returned":
                return "success";
            default:
                return "secondary";
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await sellerApi.getReturns({ limit: 100 });
                const payload = res.data.result || {};
                const items = Array.isArray(payload.items) ? payload.items : (res.data.results || []);
                setReturns(items || []);
            } catch (error) {}
        };
        fetchStats();
        
        // Listen for return drop OTPs
        const getToken = () => localStorage.getItem("auth_seller");
        const unsubscribe = onReturnDropOtp(getToken, (payload) => {
            const { orderId, otp, expiresAt } = payload;
            setActiveOtps(prev => ({
                ...prev,
                [orderId]: { otp, expiresAt }
            }));
            showToast(`Rider arrived for Return #${orderId}. OTP: ${otp}`, "info");
        });

        return () => {
            if (typeof unsubscribe === "function") unsubscribe();
        };
    }, [refreshKey]);


    const openDetails = (ret) => {
        setSelectedReturn(ret);
        setIsDetailsOpen(true);
    };

    const handleApprove = async (orderId) => {
        try {
            await sellerApi.approveReturn(orderId, {});
            showToast("Return approved", "success");
            refreshTable();
        } catch (error) {
            console.error("Failed to approve return", error);
            showToast(
                error.response?.data?.message || "Failed to approve return",
                "error"
            );
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim() || !selectedReturn) return;
        try {
            setSubmittingReject(true);
            await sellerApi.rejectReturn(selectedReturn.orderId, { reason: rejectReason });
            showToast("Return rejected", "success");
            setIsRejectModalOpen(false);
            setRejectReason("");
            setIsDetailsOpen(false);
            refreshTable();
        } catch (error) {
            console.error("Failed to reject return", error);
            showToast(
                error.response?.data?.message || "Failed to reject return",
                "error"
            );
        } finally {
            setSubmittingReject(false);
        }
    };

    const handleAssignPickup = async (orderId) => {
        try {
            setAssigningPickup(true);
            await sellerApi.assignReturnDelivery(orderId, {});
            showToast("Riders notified for return pickup", "success");
            setIsDetailsOpen(false);
            refreshTable();
        } catch (error) {
            console.error("Failed to assign pickup", error);
            showToast(
                error.response?.data?.message || "No nearby riders found or assignment failed",
                "error"
            );
        } finally {
            setAssigningPickup(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-16">
            <BlurFade delay={0.1}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex flex-wrap items-center gap-2">
                            Return Requests
                            <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 font-bold tracking-widest uppercase"
                            >
                                New
                            </Badge>
                        </h1>
                        <p className="text-slate-600 text-sm sm:text-base mt-0.5 font-medium">
                            Review and manage customer return requests.
                        </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <Button
                            onClick={fetchReturns}
                            variant="outline"
                            className="flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 border-slate-200"
                        >
                            <HiOutlineArrowPath className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">REFRESH</span>
                        </Button>
                    </div>
                </div>
            </BlurFade>

            {loading ? (
                <div className="min-h-[320px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-slate-600 font-bold mt-4 uppercase tracking-widest text-xs">
                        Loading Return Requests...
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {["Requested", "Approved", "Rejected", "Completed"].map(
                            (label, i) => {
                                const count = returns.filter(
                                    (r) => mapReturnStatusLabel(r.returnStatus) === label
                                ).length;
                                return (
                                    <BlurFade key={label} delay={0.1 + i * 0.05}>
                                        <MagicCard
                                            className="border-none shadow-sm ring-1 ring-slate-100 p-0 overflow-hidden group bg-white"
                                            gradientColor="#eef2ff"
                                        >
                                            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 relative z-10">
                                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center bg-slate-900 text-white shadow-sm shrink-0">
                                                    <HiOutlineInboxStack className="h-5 w-5 sm:h-6 sm:w-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-widest truncate">
                                                        {label}
                                                    </p>
                                                    <h4 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                                                        {count}
                                                    </h4>
                                                </div>
                                            </div>
                                        </MagicCard>
                                    </BlurFade>
                                );
                            }
                        )}
                    </div>

                    <BlurFade delay={0.2}>
                        <Card className="border-none shadow-xl ring-1 ring-slate-100 rounded-lg bg-white overflow-hidden">
                            <div className="border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row gap-3 items-center justify-between p-3 sm:p-4">
                                <div className="flex px-3 items-center min-w-max bg-slate-100 rounded-xl p-1">
                                    {tabs.filter(t => ["All", "Requested", "Approved", "Completed"].includes(t)).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={cn(
                                                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300",
                                                activeTab === tab
                                                    ? "bg-white text-slate-900 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700 font-semibold"
                                            )}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative w-full md:w-64">
                                    <HiOutlineEye className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input 
                                        type="text"
                                        placeholder="Search Return ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary/10 transition-all"
                                    />
                                </div>
                            </div>

                            <DynamicDataTable
                                apiService={sellerApi}
                                endpoint="/orders/seller-returns"
                                refreshSelected={refreshKey}
                                defaultParams={{
                                    status: activeTab === 'Requested' ? 'return_requested' : (activeTab === 'Approved' ? 'return_approved' : (activeTab === 'Completed' ? 'returned' : '')),
                                    search: searchTerm
                                }}
                                columns={[
                                    {
                                        header: "Return Details",
                                        cell: (r) => (
                                            <div className="cursor-pointer" onClick={() => openDetails(r)}>
                                                <p className="text-sm font-black text-slate-900 hover:text-primary transition-colors">#{r.orderId}</p>
                                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                                                    <HiOutlineCalendarDays className="h-3 w-3" />
                                                    {r.returnRequestedAt ? new Date(r.returnRequestedAt).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        )
                                    },
                                    {
                                        header: "Customer",
                                        cell: (r) => (
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{r.customer?.name || 'Customer'}</p>
                                                <p className="text-[10px] text-slate-500">{r.customer?.phone || ''}</p>
                                            </div>
                                        )
                                    },
                                    {
                                        header: "Refund Amount",
                                        cell: (r) => (
                                            <p className="text-sm font-black text-slate-900">₹{r.returnRefundAmount || r.pricing?.subtotal || 0}</p>
                                        )
                                    },
                                    {
                                        header: "Status",
                                        cell: (r) => (
                                            <Badge
                                                variant={getStatusVariant(r.returnStatus)}
                                                className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full"
                                            >
                                                {mapReturnStatusLabel(r.returnStatus)}
                                            </Badge>
                                        )
                                    },
                                    {
                                        header: "Actions",
                                        align: "right",
                                        cell: (r) => (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openDetails(r)}
                                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                                                >
                                                    <HiOutlineEye className="h-5 w-5" />
                                                </button>
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        </Card>
                    </BlurFade>
                </>
            )}

            <AnimatePresence>
                {isDetailsOpen && selectedReturn && (
                    <div className="fixed inset-0 z-[100] flex items-stretch sm:items-center justify-center p-3 sm:p-6 lg:p-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
                            onClick={() => setIsDetailsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="w-full max-w-lg sm:max-w-2xl relative z-10 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-black text-slate-900">
                                        Return for Order #{selectedReturn.orderId}
                                    </h3>
                                    <div className="flex items-center space-x-2 mt-0.5">
                                        <Badge
                                            variant={getStatusVariant(
                                                selectedReturn.returnStatus
                                            )}
                                            className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0"
                                        >
                                            {mapReturnStatusLabel(
                                                selectedReturn.returnStatus
                                            )}
                                        </Badge>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDetailsOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="px-4 py-4 sm:px-6 sm:py-5 overflow-y-auto scrollbar-hide flex-1 space-y-4">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                        Customer
                                    </p>
                                    <p className="text-sm font-bold text-slate-900">
                                        {selectedReturn.customer?.name || "Customer"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {selectedReturn.customer?.phone || ""}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                        Return Reason
                                    </p>
                                    <p className="text-sm text-slate-800 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                        {selectedReturn.returnReason ||
                                            "No reason provided by customer."}
                                    </p>
                                    {selectedReturn.returnRejectedReason && (
                                        <p className="text-xs text-rose-600 font-semibold">
                                            Rejection reason:{" "}
                                            {selectedReturn.returnRejectedReason}
                                        </p>
                                    )}
                                </div>

                                {/* Quality Check Comparison (3-Way) */}
                                <div className="space-y-3 pt-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                                        Product Comparison (QC)
                                    </p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {/* 1. Original Listing Image */}
                                        <div className="space-y-1.5 flex flex-col h-full group">
                                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner group-hover:border-slate-300 transition-colors">
                                                <img
                                                    src={selectedReturn.items?.[0]?.image || "https://placehold.co/400x400/f8fafc/64748b?text=Original"}
                                                    alt="Original"
                                                    className="h-full w-full object-cover"
                                                />
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/60 to-transparent p-2">
                                                    <p className="text-[9px] font-black text-white uppercase leading-none">Listing</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Initial Delivery Proof */}
                                        <div className="space-y-1.5 flex flex-col h-full group">
                                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner group-hover:border-slate-300 transition-colors flex items-center justify-center">
                                                {selectedReturn.deliveryProofImages?.[0] ? (
                                                    <img
                                                        src={selectedReturn.deliveryProofImages[0]}
                                                        alt="Delivered"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1.5 text-slate-400 px-3 text-center">
                                                        <HiOutlineTruck className="h-5 w-5" />
                                                        <p className="text-[8px] font-bold leading-tight uppercase">No Delivery Photo</p>
                                                    </div>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sky-900/60 to-transparent p-2">
                                                    <p className="text-[9px] font-black text-white uppercase leading-none">Delivered</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. Return Pickup Proof */}
                                        <div className="space-y-1.5 flex flex-col h-full group">
                                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner group-hover:border-slate-300 transition-colors flex items-center justify-center">
                                                {selectedReturn.returnPickupImages?.[0] ? (
                                                    <img
                                                        src={selectedReturn.returnPickupImages[0]}
                                                        alt="Return Pickup"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1.5 text-slate-400 px-3 text-center">
                                                        <HiOutlineInboxStack className="h-5 w-5" />
                                                        <p className="text-[8px] font-bold leading-tight uppercase">Not Picked Yet</p>
                                                    </div>
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-emerald-900/60 to-transparent p-2">
                                                    <p className="text-[9px] font-black text-white uppercase leading-none">Return</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedReturn.returnPickupCondition && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                                            <div className={`h-2 w-2 rounded-full ${
                                                selectedReturn.returnPickupCondition === 'good' ? 'bg-emerald-500' : 
                                                selectedReturn.returnPickupCondition === 'damaged' ? 'bg-rose-500' : 'bg-amber-500'
                                            }`} />
                                            <p className="text-[11px] font-bold text-slate-600">
                                                Rider Condition Report: <span className="uppercase text-slate-900">{selectedReturn.returnPickupCondition}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                        Items
                                    </p>
                                    <div className="space-y-2">
                                        {(selectedReturn.returnItems || []).map(
                                            (item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100"
                                                >
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            Qty: {item.quantity}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs font-black text-slate-900">
                                                        ₹{item.price * item.quantity}
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                                        Payment Breakdown
                                    </p>
                                    <p className="text-xs text-slate-700">
                                        Product refund:{" "}
                                        <span className="font-black">
                                            ₹
                                            {selectedReturn.returnRefundAmount ||
                                                selectedReturn.pricing?.subtotal ||
                                                0}
                                        </span>
                                    </p>
                                    <p className="text-xs text-slate-700">
                                        Return delivery commission:{" "}
                                        <span className="font-black">
                                            ₹
                                            {selectedReturn.returnDeliveryCommission ||
                                                0}
                                        </span>
                                    </p>
                                </div>

                                {/* Active OTP Display */}
                                {activeOtps[selectedReturn.orderId] && (
                                    <div className="bg-brand-50 border-2 border-dashed border-brand-200 rounded-3xl p-6 text-center space-y-3 animate-in fade-in zoom-in duration-500">
                                        <p className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em]">
                                            Rider Arrived - Share OTP
                                        </p>
                                        <div className="flex items-center justify-center gap-3">
                                            {activeOtps[selectedReturn.orderId].otp.split('').map((char, i) => (
                                                <div key={i} className="h-14 w-12 bg-white rounded-xl shadow-sm border border-brand-100 flex items-center justify-center text-3xl font-black text-slate-900 border-b-4 border-b-brand-500">
                                                    {char}
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 italic">
                                            Sharing this code confirms you have received the product.
                                        </p>
                                    </div>
                                )}
                            </div>

                             <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center justify-end">
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={() => setIsDetailsOpen(false)}
                                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all"
                                    >
                                        Close
                                    </button>
                                    
                                    {/* Action: Approve/Reject */}
                                    {canManageReturns && selectedReturn.returnStatus === "return_requested" && (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50"
                                                onClick={() => setIsRejectModalOpen(true)}
                                            >
                                                Reject Request
                                            </Button>
                                            <Button
                                                className="text-xs font-bold bg-slate-900"
                                                onClick={() => handleApprove(selectedReturn.orderId)}
                                            >
                                                Approve Return
                                            </Button>
                                        </>
                                    )}

                                    {/* Action: Assign Pickup */}
                                    {canManageReturns && (selectedReturn.returnStatus === "return_approved") && (
                                        <Button
                                            className="text-xs font-bold bg-brand-600 hover:bg-brand-700"
                                            disabled={assigningPickup}
                                            onClick={() => handleAssignPickup(selectedReturn.orderId)}
                                        >
                                            {assigningPickup ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <HiOutlineInboxStack className="h-4 w-4 mr-2" />
                                            )}
                                            Assign Pickup
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {canManageReturns && isRejectModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => !submittingReject && setIsRejectModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-md relative z-10 bg-white rounded-3xl shadow-2xl p-6 space-y-4"
                        >
                            <h3 className="text-xl font-black text-slate-900">Reject Return</h3>
                            <p className="text-sm text-slate-600 font-medium">Please provide a reason for rejecting this return request. This will be shared with the customer.</p>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reason for Rejection</label>
                                <textarea
                                    className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900/10 outline-none transition-all"
                                    rows={4}
                                    placeholder="e.g. Product returned in damaged condition..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 font-bold"
                                    onClick={() => setIsRejectModalOpen(false)}
                                    disabled={submittingReject}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 font-bold bg-rose-600 hover:bg-rose-700"
                                    onClick={handleReject}
                                    isLoading={submittingReject}
                                    disabled={!rejectReason.trim() || submittingReject}
                                >
                                    Reject Request
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Returns;
