import React, { useState } from 'react';
import PageHeader from '@shared/components/ui/PageHeader';
import Card from '@shared/components/ui/Card';
import Badge from '@shared/components/ui/Badge';
import Modal from '@shared/components/ui/Modal';
import DynamicDataTable from '@shared/components/ui/DynamicDataTable';
import { 
    HiOutlineBuildingOffice2, 
    HiOutlineEye, 
    HiOutlineArrowTrendingUp, 
    HiOutlineDocumentText, 
    HiOutlineCalendarDays,
    HiOutlineMapPin,
    HiOutlineEnvelope,
    HiOutlinePhone
} from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const ActiveSellers = () => {
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [stats, setStats] = useState({
        totalActiveSellers: 0,
        totalRevenue: 0,
        totalOrders: 0,
        newThisMonth: 0
    });

    const columns = [
        {
            header: "Store Entity",
            width: "30%",
            cell: (row) => (
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl overflow-hidden bg-slate-100 ring-2 ring-slate-100 shadow-sm">
                        <img 
                            src={row.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${row.shopName}`} 
                            alt="" 
                            className="h-full w-full object-cover" 
                        />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-slate-900">{row.shopName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-semibold text-slate-400">{row.ownerName}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">{row.category}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: "Performance",
            width: "25%",
            cell: (row) => (
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-900">{(row.totalOrders || 0).toLocaleString()} Orders</span>
                        <span className="text-[10px] font-bold text-emerald-600">₹{(row.totalRevenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-brand-500 rounded-full" 
                            style={{ width: `${row.fulfillmentRate || 0}%` }} 
                        />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{row.fulfillmentRate || 0}% fulfillment</p>
                </div>
            )
        },
        {
            header: "Business Intel",
            width: "25%",
            cell: (row) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-semibold">
                        <HiOutlineDocumentText className="h-3.5 w-3.5" />
                        {row.productCount || 0} products listed
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-semibold">
                        <HiOutlineMapPin className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[150px]">{row.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[9px] font-black uppercase tracking-tight">
                        <HiOutlineCalendarDays className="h-3.5 w-3.5" />
                        Joined {row.joinedDate}
                    </div>
                </div>
            )
        },
        {
            header: "Actions",
            width: "20%",
            align: "right",
            cell: (row) => (
                <button 
                    onClick={() => setSelectedSeller(row)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
                >
                    <HiOutlineEye className="h-3.5 w-3.5" />
                    Profile
                </button>
            )
        }
    ];

    const handleDataFetched = (data) => {
        if (data?.stats) {
            setStats(data.stats);
        }
    };

    return (
        <div className="ds-section-spacing animate-in fade-in slide-in-from-bottom-2 duration-700 pb-16">
            <PageHeader
                title="Active Sellers"
                description="Monitor performance metrics, business intelligence and operational health of verified partners."
            />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Active Sellers', value: stats.totalActiveSellers, icon: HiOutlineBuildingOffice2, color: 'blue' },
                    { label: 'Gross Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, icon: HiOutlineArrowTrendingUp, color: 'emerald' },
                    { label: 'Total Orders', value: stats.totalOrders?.toLocaleString(), icon: HiOutlineDocumentText, color: 'amber' },
                    { label: 'New This Month', value: stats.newThisMonth, icon: HiOutlineCalendarDays, color: 'rose' },
                ].map((stat, i) => (
                    <Card key={i} className="p-5 border-none shadow-sm ring-1 ring-slate-100 bg-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-black text-slate-900 leading-none">{stat.value}</h3>
                            </div>
                            <div className={cn("p-3 rounded-2xl", `bg-${stat.color}-50 text-${stat.color}-600`)}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <DynamicDataTable
                endpoint="/admin/sellers/active"
                columns={columns}
                onDataFetched={handleDataFetched}
                searchPlaceholder="Search store name, owner, email or location..."
            />

            <AnimatePresence>
                {selectedSeller && (
                    <Modal
                        isOpen={!!selectedSeller}
                        onClose={() => setSelectedSeller(null)}
                        title={selectedSeller.shopName}
                        size="xl"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                            <div className="lg:col-span-4 space-y-6">
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Information</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-slate-700">
                                            <HiOutlineEnvelope className="h-4 w-4 text-slate-400" />
                                            <span className="text-xs font-bold break-all">{selectedSeller.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-700">
                                            <HiOutlinePhone className="h-4 w-4 text-slate-400" />
                                            <span className="text-xs font-bold">{selectedSeller.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-700">
                                            <HiOutlineMapPin className="h-4 w-4 text-slate-400" />
                                            <span className="text-xs font-bold leading-relaxed">{selectedSeller.location}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
                                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Operational Intel</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs font-bold text-indigo-900 border-b border-indigo-100 pb-2">
                                            <span className="opacity-60 font-medium">Platform Joined</span>
                                            <span>{selectedSeller.joinedDate}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold text-indigo-900 border-b border-indigo-100 pb-2">
                                            <span className="opacity-60 font-medium">Service Radius</span>
                                            <span>{selectedSeller.serviceRadius} km</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                                            <span className="opacity-60 font-medium">Average Order Value</span>
                                            <span>₹{Math.round(selectedSeller.avgOrderValue).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-8 space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        { label: "Total Orders", value: selectedSeller.totalOrders.toLocaleString() },
                                        { label: "Total Revenue", value: `₹${selectedSeller.totalRevenue.toLocaleString()}` },
                                        { label: "Products", value: selectedSeller.productCount },
                                        { label: "Delivered", value: selectedSeller.deliveredOrders },
                                        { label: "Pending", value: selectedSeller.pendingOrders },
                                        { label: "Fulfillment", value: `${selectedSeller.fulfillmentRate}%` },
                                    ].map((item, i) => (
                                        <div key={i} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                            <p className="text-lg font-black text-slate-900">{item.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600">
                                            < HiOutlineArrowTrendingUp className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-black text-emerald-900 tracking-tight">Healthy Account Performance</h5>
                                            <p className="text-xs font-bold text-emerald-700/80 mt-1">This partner maintains a {selectedSeller.fulfillmentRate}% completion rate with an active inventory of {selectedSeller.productCount} items.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ActiveSellers;
