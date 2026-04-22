import React, { useState, useMemo, useEffect, useRef } from 'react';
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';
import Badge from '@shared/components/ui/Badge';
import Input from '@shared/components/ui/Input';
import {
    HiOutlineMagnifyingGlass,
    HiOutlineEye,
    HiOutlinePrinter,
    HiOutlineCheck,
    HiOutlineXMark,
    HiOutlineTruck,
    HiOutlineBanknotes,
    HiOutlineClock,
    HiOutlineArchiveBoxXMark,
    HiOutlineChartBar,
    HiOutlineChevronDown,
    HiOutlineChevronRight,
    HiOutlineInboxStack,
    HiOutlineMapPin,
    HiOutlinePhone,
    HiOutlineCalendarDays
} from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Orders Page

import { MagicCard } from '@/components/ui/magic-card';
import { BlurFade } from '@/components/ui/blur-fade';
import ShimmerButton from '@/components/ui/shimmer-button';
import { sellerApi } from '../services/sellerApi';
import { useToast } from '@shared/components/ui/Toast';
import { getLegacyStatusFromOrder } from '@/shared/utils/orderStatus';
import { Loader2 } from 'lucide-react';
import DynamicDataTable from "@shared/components/ui/DynamicDataTable";
import { DatePicker } from "@/components/ui/date-picker";


const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isQuickViewModalOpen, setIsQuickViewModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const { showToast } = useToast();
    const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

    const refreshOrders = () => setRefreshKey(prev => prev + 1);

    // Fetch stats or just use DynamicDataTable for everything. 
    // For now, let's keep stats simple by fetching a small batch.
    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await sellerApi.getOrders({ limit: 100 });
                setOrders(res.data.result?.items || []);
            } catch (err) {
                console.error("Error fetching order stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const tabs = ['All', 'Pending', 'Confirmed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];
    const todayStr = new Date().toISOString().split('T')[0];

    const safeOrders = useMemo(
        () => (Array.isArray(orders) ? orders : []),
        [orders]
    );

    const filteredOrders = useMemo(() => {
        return safeOrders.filter(order => {
            const matchesSearch = (order?.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order?.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            const statusToMatch = activeTab === 'Out for Delivery' ? 'out_for_delivery' : activeTab.toLowerCase();
            const matchesTab = activeTab === 'All' || (order?.status || '').toLowerCase() === statusToMatch;
            return matchesSearch && matchesTab;
        });
    }, [safeOrders, searchTerm, activeTab]);

    const stats = useMemo(() => [
        {
            label: 'Total Orders',
            value: safeOrders.length,
            icon: HiOutlineArchiveBoxXMark,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        },
        {
            label: 'Pending',
            value: safeOrders.filter(o => (o?.status || '').toLowerCase() === 'pending').length,
            icon: HiOutlineClock,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        },
        {
            label: 'Confirmed',
            value: safeOrders.filter(o => (o?.status || '').toLowerCase() === 'confirmed').length,
            icon: HiOutlineCheck,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            label: 'Delivered',
            value: safeOrders.filter(o => (o?.status || '').toLowerCase() === 'delivered').length,
            icon: HiOutlineCheck,
            color: 'text-brand-600',
            bg: 'bg-brand-50'
        }
    ], [safeOrders]);

    const getStatusColor = (status) => {
        const s = status.toLowerCase();
        switch (s) {
            case 'pending': return 'warning';
            case 'confirmed': return 'info';
            case 'packed': return 'primary';
            case 'out_for_delivery': return 'secondary';
            case 'delivered': return 'success';
            case 'cancelled': return 'error';
            default: return 'secondary';
        }
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await sellerApi.updateOrderStatus(orderId, { status: newStatus.toLowerCase() });
            showToast(`Order status updated to ${newStatus}`, "success");
            refreshOrders(); 
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            showToast("Failed to update status", "error");
        }
    };

    const exportOrders = () => {
        const data = filteredOrders;
        if (!data.length) {
            showToast("No orders to export", "warning");
            return;
        }
        const escapeCsv = (v) => {
            const s = String(v ?? "").replace(/"/g, '""');
            return /[",\n\r]/.test(s) ? `"${s}"` : s;
        };
        const headers = ["Order ID", "Customer", "Phone", "Date", "Time", "Total (₹)", "Status", "Address", "Payment"];
        const rows = data.map((o) => [
            o.id,
            o.customer?.name ?? "",
            o.customer?.phone ?? "",
            o.date,
            o.time,
            o.total,
            o.status,
            o.address ?? "",
            o.payment ?? "",
        ]);
        const csvContent = [
            headers.map(escapeCsv).join(","),
            ...rows.map((row) => row.map(escapeCsv).join(",")),
        ].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Exported ${data.length} order(s) as CSV`, "success");
    };

    return (
        <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-16">
            <BlurFade delay={0.1}>
                {/* Page Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex flex-wrap items-center gap-2">
                            Order Management
                            <Badge variant="primary" className="text-[10px] px-1.5 py-0 font-bold tracking-wider uppercase bg-blue-100 text-blue-700">Real-time</Badge>
                        </h1>
                        <p className="text-slate-600 text-sm sm:text-base mt-0.5 font-medium">Process and track your customer orders with ease.</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <Button
                            onClick={exportOrders}
                            variant="outline"
                            className="flex items-center space-x-1.5 sm:space-x-2 px-3 py-2 sm:px-5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 border-slate-200"
                        >
                            <HiOutlinePrinter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">EXPORT ALL</span>
                        </Button>
                        <ShimmerButton
                            onClick={() => setIsQuickViewModalOpen(true)}
                            className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold text-white shadow-xl flex items-center space-x-1.5 sm:space-x-2"
                        >
                            <HiOutlineEye className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-0" />
                            <span className="hidden sm:inline">QUICK VIEW</span>
                        </ShimmerButton>
                    </div>
                </div>
            </BlurFade>

            {/* Quick Stats */}
            {loading ? (
                <div className="min-h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-slate-600 font-bold mt-4 uppercase tracking-widest text-xs">Fetching Active Orders...</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {stats.map((stat, i) => (
                            <BlurFade key={i} delay={0.1 + (i * 0.05)}>
                                <MagicCard
                                    className="border-none shadow-sm ring-1 ring-slate-100 p-0 overflow-hidden group bg-white"
                                    gradientColor={stat.bg.includes('indigo') ? "#eef2ff" : stat.bg.includes('amber') ? "#fffbeb" : stat.bg.includes('emerald') ? "#ecfdf5" : "#fff1f2"}
                                >
                                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 relative z-10">
                                        <div className={cn("h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-sm shrink-0", stat.bg, stat.color)}>
                                            <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-widest truncate">{stat.label}</p>
                                            <h4 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h4>
                                        </div>
                                    </div>
                                </MagicCard>
                            </BlurFade>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <BlurFade delay={0.3}>
                        <Card className="border-none shadow-xl ring-1 ring-slate-100 rounded-lg bg-white overflow-visible">
                            {/* Tabs */}
                            <div className="border-b border-slate-100 bg-slate-50/30 overflow-x-auto scrollbar-hide">
                                <div className="flex px-3 sm:px-6 items-center min-w-max">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={cn(
                                                "relative py-3 sm:py-4 px-2.5 sm:px-4 text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300",
                                                activeTab === tab
                                                    ? "text-primary scale-105"
                                                    : "text-slate-600 hover:text-slate-700"
                                            )}
                                        >
                                            {tab}
                                            {activeTab === tab && (
                                                <motion.div
                                                    layoutId="tab-underline"
                                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full mx-2 sm:mx-4"
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Toolbox */}
                            <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                                <div className="relative flex-1 group w-full">
                                    <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-primary transition-all" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by Order ID or Customer Name..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 border-none rounded-lg text-sm font-semibold text-slate-700 placeholder:text-slate-500 focus:ring-2 focus:ring-primary/5 transition-all outline-none"
                                    />
                                </div>
                                <div className="flex gap-3 shrink-0 w-full lg:w-auto items-center justify-end flex-wrap">
                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                                        <div className="w-full sm:w-32">
                                            <DatePicker
                                                value={startDate}
                                                max={todayStr}
                                                align="left"
                                                onChange={(value) => {
                                                    if (!value) {
                                                        setStartDate("");
                                                        setPage(1);
                                                        return;
                                                    }
                                                    const today = new Date().toISOString().split("T")[0];
                                                    if (value > today) {
                                                        showToast("Start date cannot be in the future", "error");
                                                        return;
                                                    }
                                                    if (endDate && value > endDate) {
                                                        showToast("Start date cannot be after end date", "error");
                                                        return;
                                                    }
                                                    setPage(1);
                                                    setStartDate(value);
                                                }}
                                                placeholder="From date"
                                            />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-600 hidden sm:inline">
                                            to
                                        </span>
                                        <div className="w-full sm:w-32 mt-2 sm:mt-0">
                                            <DatePicker
                                                value={endDate}
                                                max={todayStr}
                                                min={startDate || undefined}
                                                align="right"
                                                popupClassName="mt-4"
                                                disabled={!startDate}
                                                onChange={(value) => {
                                                    if (!value) {
                                                        setEndDate("");
                                                        setPage(1);
                                                        return;
                                                    }
                                                    const today = new Date().toISOString().split("T")[0];
                                                    if (value > today) {
                                                        showToast("End date cannot be in the future", "error");
                                                        return;
                                                    }
                                                    if (startDate && value < startDate) {
                                                        showToast("End date cannot be before start date", "error");
                                                        return;
                                                    }
                                                    setPage(1);
                                                    setEndDate(value);
                                                }}
                                                placeholder="To date"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
                                        className="text-xs font-semibold text-slate-600 hover:text-slate-700"
                                    >
                                        Clear dates
                                    </button>
                                </div>
                            </div>          {/* Orders Table */}
          <DynamicDataTable
            apiService={sellerApi}
            refreshSelected={refreshKey}
            endpoint="/orders/seller-orders"
            searchPlaceholder="Search by Order ID or Customer Name..."
            defaultParams={{
              startDate,
              endDate,
              search: searchTerm,
              status: activeTab === 'All' ? '' : (activeTab === 'Out for Delivery' ? 'out_for_delivery' : activeTab.toLowerCase())
            }}
            columns={[
              {
                header: "Order Details",
                width: "25%",
                cell: (o) => (
                  <div className="cursor-pointer" onClick={() => handleViewDetails(o)}>
                    <p className="text-sm font-black text-slate-900 hover:text-indigo-600 transition-colors">
                      #{o.orderId}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1 flex items-center gap-1">
                      <HiOutlineCalendarDays className="h-3 w-3" />
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )
              },
              {
                header: "Customer",
                width: "25%",
                cell: (o) => (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center text-xs font-black text-white shadow-sm ring-2 ring-white">
                      {(o.customer?.name || 'U').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{o.customer?.name || 'Unknown'}</p>
                      <p className="text-[10px] font-bold text-slate-400">{o.customer?.phone || 'No Phone'}</p>
                    </div>
                  </div>
                )
              },
              {
                header: "Total",
                cell: (o) => (
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900">₹{(o.pricing?.total || 0).toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{(o.items || []).length} items</span>
                  </div>
                )
              },
              {
                header: "Status",
                cell: (o) => {
                  const status = getLegacyStatusFromOrder(o);
                  return (
                    <div className="relative inline-block w-36">
                      <select
                        value={status}
                        onChange={(e) => handleStatusUpdate(o.orderId, e.target.value)}
                        className={cn(
                          "w-full text-[10px] pl-2.5 pr-8 py-1.5 rounded-full font-black uppercase tracking-widest cursor-pointer appearance-none focus:ring-2 focus:ring-offset-1 transition-all border-none outline-none shadow-sm",
                          status === 'pending' ? "bg-amber-100 text-amber-700 focus:ring-amber-200" :
                            status === 'confirmed' ? "bg-blue-100 text-blue-700 focus:ring-blue-200" :
                              status === 'packed' ? "bg-indigo-100 text-indigo-700 focus:ring-indigo-200" :
                                status === 'out_for_delivery' ? "bg-purple-100 text-purple-700 focus:ring-purple-200" :
                                  status === 'delivered' ? "bg-brand-100 text-brand-700 focus:ring-brand-200" :
                                    status === 'cancelled' ? "bg-rose-100 text-rose-700 focus:ring-rose-200" :
                                      "bg-slate-100 text-slate-700 focus:ring-slate-200"
                        )}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="packed">Packed</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <HiOutlineChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none opacity-60" />
                    </div>
                  );
                }
              },
              {
                header: "Actions",
                align: "right",
                cell: (o) => (
                  <button
                    onClick={() => handleViewDetails(o)}
                    className="p-2 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition-all text-slate-400 ring-1 ring-slate-100 shadow-sm"
                  >
                    <HiOutlineEye className="h-5 w-5" />
                  </button>
                )
              }
            ]}
          />
          <div className="mt-6 border-t border-slate-50 pt-4 px-4 pb-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
              Standardized Order Management View
            </p>
          </div>
          </Card>
        </BlurFade>
 
        {/* Quick View Summary Modal */}
        <AnimatePresence>
            {isQuickViewModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setIsQuickViewModalOpen(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="w-full max-w-lg relative z-10 bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                    >
                        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="h-9 w-9 sm:h-10 sm:w-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                                    <HiOutlineChartBar className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">Quick Snapshot</h3>
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-widest">Today's Performance</p>
                                </div>
                            </div>
                            <button onClick={() => setIsQuickViewModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600 shrink-0">
                                <HiOutlineXMark className="h-5 w-5" />
                            </button>
                        </div>
 
                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="p-3 sm:p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                                    <p className="text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Total Revenue</p>
                                    <p className="text-base sm:text-xl font-black text-indigo-700 truncate">₹{safeOrders.reduce((acc, o) => acc + o.total, 0).toLocaleString()}</p>
                                </div>
                                <div className="p-3 sm:p-4 rounded-2xl bg-brand-50 border border-brand-100">
                                    <p className="text-[10px] sm:text-xs font-bold text-brand-400 uppercase tracking-widest mb-1">Avg. Order Value</p>
                                    <p className="text-base sm:text-xl font-black text-brand-700">₹{safeOrders.length ? (safeOrders.reduce((acc, o) => acc + o.total, 0) / safeOrders.length).toFixed(0) : '0'}</p>
                                </div>
                            </div>
                        </div>
 
                        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100">
                            <Button
                                onClick={() => {
                                    setIsQuickViewModalOpen(false);
                                    setActiveTab('Pending');
                                }}
                                className="w-full py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold"
                            >
                                VIEW ALL PENDING ORDERS
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
 
        {/* Order Details Modal Container */}
        <AnimatePresence>
            {isDetailsModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-stretch sm:items-center justify-center p-3 sm:p-6 lg:p-12">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
                        onClick={() => setIsDetailsModalOpen(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="w-full max-w-lg sm:max-w-2xl relative z-10 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                                    <HiOutlineTruck className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900">Order Details</h3>
                                    <div className="flex items-center space-x-2 mt-0.5">
                                        <Badge variant={getStatusColor(selectedOrder.status)} className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0">{selectedOrder.status}</Badge>
                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">#{selectedOrder.id}</span>
                                    </div>
                                    {(selectedOrder.date || selectedOrder.time) && (
                                        <p className="text-[11px] font-bold text-slate-500 mt-1.5 flex items-center gap-1.5">
                                            <HiOutlineCalendarDays className="h-3.5 w-3.5" />
                                            {selectedOrder.date}
                                            {selectedOrder.time && (
                                                <>
                                                    <span className="text-slate-300">•</span>
                                                    <HiOutlineClock className="h-3.5 w-3.5" />
                                                    {selectedOrder.time}
                                                </>
                                            )}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                                <HiOutlineXMark className="h-5 w-5" />
                            </button>
                        </div>
 
                        <div className="px-4 py-4 sm:px-6 sm:py-5 overflow-y-auto scrollbar-hide flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                                <div className="space-y-3 sm:space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                                <HiOutlineMapPin className="h-3 w-3 text-primary" /> Delivery Address
                                            </h4>
                                            {selectedOrder.location &&
                                                typeof selectedOrder.location.lat === "number" &&
                                                typeof selectedOrder.location.lng === "number" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const { lat, lng } = selectedOrder.location;
                                                            window.open(
                                                                `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                                                                "_blank",
                                                            );
                                                        }}
                                                        className="text-[10px] font-bold text-primary hover:underline"
                                                    >
                                                        View on map
                                                    </button>
                                                )}
                                        </div>
                                        <p className="text-xs font-bold text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-sm">
                                            {selectedOrder.address}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <HiOutlinePhone className="h-3 w-3 text-brand-500" /> Contact Info
                                        </h4>
                                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-sm">
                                            <p className="text-xs font-bold text-slate-800">{selectedOrder.customer.name}</p>
                                            <p className="text-xs font-semibold text-slate-600 mt-0.5">{selectedOrder.customer.phone}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="bg-primary/5 p-3 sm:p-4 rounded-3xl border border-primary/10">
                                        <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-3">Order Summary</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-bold text-slate-600">Subtotal</span>
                                                <span className="font-black text-slate-900">₹{(selectedOrder.total - 10).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="font-bold text-slate-600">Delivery Fee</span>
                                                <span className="font-black text-brand-600">₹10.00</span>
                                            </div>
                                            <div className="h-px bg-primary/10 my-2" />
                                            <div className="flex justify-between text-sm">
                                                <span className="font-black text-slate-900">Total</span>
                                                <span className="font-black text-primary">₹{selectedOrder.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 p-3 sm:p-4 rounded-3xl text-white shadow-xl shadow-slate-900/10">
                                        <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2">Payment Status</h4>
                                        <div className="flex items-center gap-2">
                                            <HiOutlineBanknotes className="h-5 w-5 text-brand-400" />
                                            <span className="text-xs font-bold tracking-tight">{selectedOrder.payment}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
 
                            <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3 sm:mb-4">Items Ordered ({selectedOrder.items.length})</h4>
                            <div className="space-y-3 max-h-52 sm:max-h-64 overflow-y-auto pr-1">
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white ring-1 ring-slate-100 rounded-2xl group hover:shadow-md transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-50 ring-1 ring-slate-200">
                                                <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">{item.name}</p>
                                                <p className="text-xs font-semibold text-slate-600 mt-0.5">₹{item.price.toFixed(2)} × {item.qty}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-900">₹{(item.price * item.qty).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
 
                        {/* Modal Footer */}
                        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center justify-end">
                            <div className="flex gap-2 items-center">
                                <button onClick={() => setIsDetailsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">CLOSE</button>
                                <div className="relative inline-block w-40">
                                    <select
                                        value={selectedOrder.status.toLowerCase()}
                                        onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                                        className={cn(
                                            "w-full text-xs pl-3 pr-8 py-2 rounded-xl font-black uppercase tracking-wider border appearance-none cursor-pointer focus:ring-2 focus:ring-offset-1 transition-all outline-none shadow-sm",
                                            getStatusColor(selectedOrder.status) === 'warning' ? "bg-amber-100 text-amber-700 focus:ring-amber-200" :
                                                getStatusColor(selectedOrder.status) === 'info' ? "bg-blue-100 text-blue-700 focus:ring-blue-200" :
                                                    getStatusColor(selectedOrder.status) === 'primary' ? "bg-indigo-100 text-indigo-700 focus:ring-indigo-200" :
                                                        getStatusColor(selectedOrder.status) === 'secondary' ? "bg-purple-100 text-purple-700 focus:ring-purple-200" :
                                                            getStatusColor(selectedOrder.status) === 'success' ? "bg-brand-100 text-brand-700 focus:ring-brand-200" :
                                                                getStatusColor(selectedOrder.status) === 'error' ? "bg-rose-100 text-rose-700 focus:ring-rose-200" :
                                                                    "bg-slate-100 text-slate-700 focus:ring-slate-200"
                                        )}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="packed">Packed</option>
                                        <option value="out_for_delivery">Out for Delivery</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <HiOutlineChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none opacity-60" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
                </>
            )}
    </div>
);
};
 
export default Orders;
