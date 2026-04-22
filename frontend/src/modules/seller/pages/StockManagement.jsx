import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@shared/components/ui/Card';
import Button from '@shared/components/ui/Button';
import Badge from '@shared/components/ui/Badge';
import Input from '@shared/components/ui/Input';
import {
    HiOutlineCube,
    HiOutlineExclamationTriangle,
    HiOutlineArchiveBoxXMark,
    HiOutlineArrowsUpDown,
    HiOutlineMagnifyingGlass,
    HiOutlinePlus,
    HiOutlineMinus,
    HiOutlineXMark,
    HiOutlineCalendarDays
} from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BlurFade } from '@/components/ui/blur-fade';
import { MagicCard } from '@/components/ui/magic-card';
import { sellerApi } from '../services/sellerApi';
import DynamicDataTable from "@shared/components/ui/DynamicDataTable";
import { toast } from 'sonner';

const StockManagement = () => {
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState('inventory'); // 'inventory' or 'history'
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [inventory, setInventory] = useState([]);
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [adjustType, setAdjustType] = useState('Restock');
    const [adjustValue, setAdjustValue] = useState('');
    const [adjustNote, setAdjustNote] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    const refreshData = () => setRefreshKey(prev => prev + 1);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await sellerApi.getProducts({ limit: 100 });
                if (res.data.success) {
                    setInventory(res.data.result?.items || []);
                }
            } catch (err) {}
        };
        
        const fetchHist = async () => {
            try {
                const res = await sellerApi.getStockHistory();
                if (res.data.success) {
                    setHistory(res.data.result || []);
                }
            } catch (err) {}
        };

        fetchStats();
        fetchHist();
        setIsLoading(false);
    }, [refreshKey]);

    const stats = useMemo(() => [
        { label: 'Total Inventory', value: inventory.reduce((acc, item) => acc + (item.stock || 0), 0), icon: HiOutlineCube, color: 'text-indigo-600', bg: 'bg-indigo-50', status: 'All' },
        { label: 'Low Stock Items', value: inventory.filter(i => (i.stock || 0) > 0 && (i.stock || 0) <= (i.lowStockAlert || 5)).length, icon: HiOutlineExclamationTriangle, color: 'text-amber-600', bg: 'bg-amber-50', status: 'Low Stock' },
        { label: 'Out of Stock', value: inventory.filter(i => (i.stock || 0) === 0).length, icon: HiOutlineArchiveBoxXMark, color: 'text-rose-600', bg: 'bg-rose-50', status: 'Out of Stock' },
        { label: 'Stock Valuation', value: `₹${inventory.reduce((acc, item) => acc + ((item.stock || 0) * (item.price || 0)), 0).toLocaleString()}`, icon: HiOutlineArrowsUpDown, color: 'text-brand-600', bg: 'bg-brand-50', status: 'In Stock' }
    ], [inventory]);

    const handleFullAdjustment = async () => {
        const value = parseInt(adjustValue);
        if (isNaN(value) || value <= 0) {
            toast.error("Please enter a valid quantity");
            return;
        }

        try {
            const res = await sellerApi.adjustStock({
                productId: selectedItem.id,
                type: adjustType === 'Restock' ? 'Restock' : 'Correction',
                quantity: adjustType === 'Restock' ? value : -value,
                note: adjustNote
            });

            if (res.data.success) {
                toast.success("Stock adjusted successfully");
                setIsAdjustModalOpen(false);
                refreshData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to adjust stock");
        }
    };

    const openAdjustModal = (item) => {
        setSelectedItem(item);
        setAdjustValue('');
        setAdjustNote('');
        setIsAdjustModalOpen(true);
    };

    if (isLoading && inventory.length === 0) {
        return <div className="flex items-center justify-center h-screen font-black text-slate-600">LOADING STOCK DATA...</div>;
    }

    return (
        <div className="space-y-6 pb-16">
            <BlurFade delay={0.1}>
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            Stock Management
                            <Badge variant="warning" className="text-[9px] px-1.5 py-0 font-bold tracking-wider uppercase bg-amber-100 text-amber-700">
                                Inventory Control
                            </Badge>
                        </h1>
                        <p className="text-slate-600 text-sm mt-0.5 font-medium">
                            Monitor stock levels, manage restocks, and track movements.
                        </p>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                        <button
                            onClick={() => setActiveView('inventory')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                activeView === 'inventory' ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Inventory
                        </button>
                        <button
                            onClick={() => setActiveView('history')}
                            className={cn(
                                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                activeView === 'history' ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            History
                        </button>
                    </div>
                </div>
            </BlurFade>

            {activeView === 'inventory' ? (
                <>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((stat, i) => (
                            <BlurFade key={i} delay={0.1 + (i * 0.05)}>
                                <div onClick={() => setFilterStatus(stat.status)} className="cursor-pointer">
                                    <MagicCard
                                        className="border-none shadow-sm ring-1 ring-slate-100 p-0 overflow-hidden group bg-white hover:ring-primary/20 transition-all duration-500"
                                        gradientColor="#f8fafc"
                                    >
                                        <div className="flex items-center gap-3 p-4 relative z-10">
                                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shadow-sm", stat.bg, stat.color)}>
                                                <stat.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                                <h4 className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</h4>
                                            </div>
                                        </div>
                                    </MagicCard>
                                </div>
                            </BlurFade>
                        ))}
                    </div>

                    <BlurFade delay={0.3}>
                        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden rounded-3xl">
                            {/* Toolbox */}
                            <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
                                <div className="flex flex-col md:flex-row gap-3 items-center w-full">
                                    <div className="relative w-full md:w-72">
                                        <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Search product..."
                                            className="pl-10 pr-4 py-2.5 rounded-2xl border-none ring-1 ring-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-primary/20 transition-all text-xs font-bold shadow-inner"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm">
                                        {['All', 'In Stock', 'Out of Stock', 'Low Stock'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setFilterStatus(status)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all uppercase tracking-tighter",
                                                    filterStatus === status
                                                        ? "bg-white text-slate-900 shadow-md"
                                                        : "text-slate-600 hover:text-slate-700"
                                                )}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => navigate('/seller/products/add')}
                                        className="rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                                    >
                                        <HiOutlinePlus className="h-4 w-4 mr-2" />
                                        NEW PRODUCT
                                    </Button>
                                </div>
                            </div>

                            {/* Dynamic Stock Table */}
                            <DynamicDataTable
                                apiService={sellerApi}
                                endpoint="products/seller/me"
                                refreshSelected={refreshKey}
                                defaultParams={{
                                    stockStatus: filterStatus === 'In Stock' ? 'in' : (filterStatus === 'Out of Stock' ? 'out' : (filterStatus === 'Low Stock' ? 'low' : '')),
                                    search: searchTerm
                                }}
                                columns={[
                                    {
                                        header: "Product Detail",
                                        cell: (p) => (
                                            <div className="flex items-center gap-4 group">
                                                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-slate-600 group-hover:scale-105 transition-transform overflow-hidden ring-1 ring-slate-100 shadow-sm">
                                                    {p.mainImage ? (
                                                        <img src={p.mainImage} alt={p.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <HiOutlineCube className="h-6 w-6 opacity-30" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">
                                                        {p.name}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                        SKU: {p.sku || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    },
                                    {
                                        header: "Inventory",
                                        cell: (p) => (
                                            <div className="flex flex-col">
                                                <span className={cn(
                                                    "text-sm font-black",
                                                    (p.stock || 0) <= (p.lowStockAlert || 5) ? "text-rose-600" : "text-slate-900"
                                                )}>
                                                    {(p.stock || 0)} units
                                                </span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    Threshold: {p.lowStockAlert || 5}
                                                </span>
                                            </div>
                                        )
                                    },
                                    {
                                        header: "Status",
                                        cell: (p) => {
                                            const status = (p.stock || 0) === 0 ? 'Out of Stock' : ((p.stock || 0) <= (p.lowStockAlert || 5) ? 'Low Stock' : 'In Stock');
                                            return (
                                                <Badge
                                                    variant={status === 'In Stock' ? 'success' : (status === 'Low Stock' ? 'warning' : 'destructive')}
                                                    className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
                                                >
                                                    {status}
                                                </Badge>
                                            );
                                        }
                                    },
                                    {
                                        header: "Price",
                                        cell: (p) => <p className="text-sm font-black text-slate-900">₹{(p.price || 0).toLocaleString()}</p>
                                    },
                                    {
                                        header: "Actions",
                                        align: "right",
                                        cell: (p) => (
                                            <button
                                                onClick={() => openAdjustModal({ ...p, id: p._id, threshold: p.lowStockAlert || 5 })}
                                                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-md shadow-slate-900/10 hover:shadow-primary/20"
                                            >
                                                Adjust
                                            </button>
                                        )
                                    }
                                ]}
                            />
                        </Card>
                    </BlurFade>
                </>
            ) : (
                /* History View */
                <BlurFade delay={0.2}>
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/10">
                            <div>
                                <h3 className="text-base font-black text-slate-900">Inventory Movement Log</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Audit trail for all stock movements.</p>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-50">
                        <DynamicDataTable
                            apiService={sellerApi}
                            endpoint="products/stock-history"
                            refreshSelected={refreshKey}
                            defaultParams={{}}
                            columns={[
                                {
                                    header: "Activity",
                                    cell: (log) => (
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-2xl flex items-center justify-center shadow-sm",
                                                log.type === 'Restock' ? "bg-emerald-50 text-emerald-600" :
                                                    log.type === 'Sale' ? "bg-indigo-50 text-indigo-600" : "bg-rose-50 text-rose-600"
                                            )}>
                                                {log.type === 'Restock' ? <HiOutlinePlus className="h-5 w-5" /> :
                                                    log.type === 'Sale' ? <HiOutlineCube className="h-5 w-5" /> : <HiOutlineMinus className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-black text-slate-900">{log.product?.name || 'Unknown Product'}</h4>
                                                    <Badge className={cn(
                                                        "text-[8px] font-black uppercase px-2 py-0.5 rounded-md border-none",
                                                        log.type === 'Restock' ? "bg-emerald-100 text-emerald-700" :
                                                            log.type === 'Sale' ? "bg-indigo-100 text-indigo-700" : "bg-rose-100 text-rose-700"
                                                    )}>
                                                        {log.type}
                                                    </Badge>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                    {log.note || 'Internal Adjustment'}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    header: "Qty",
                                    align: "center",
                                    cell: (log) => (
                                        <div className={cn(
                                            "text-lg font-black tracking-tight",
                                            log.quantity > 0 ? "text-emerald-600" : "text-rose-600"
                                        )}>
                                            {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                                        </div>
                                    )
                                },
                                {
                                    header: "Timestamp",
                                    align: "right",
                                    cell: (log) => (
                                        <div className="flex flex-col items-end gap-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {new Date(log.createdAt).toLocaleDateString()}
                                            </p>
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">
                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    )
                                }
                            ]}
                        />
                        </div>
                    </Card>
                </BlurFade>
            )}

            {/* Adjustment Modal */}
            <AnimatePresence>
                {isAdjustModalOpen && selectedItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setIsAdjustModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="w-full max-w-md relative z-10 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                                        <HiOutlineArrowsUpDown className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900">Inventory Sync</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Refine stock levels</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsAdjustModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
                                    <HiOutlineXMark className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 overflow-hidden shadow-sm">
                                        {selectedItem.mainImage ? (
                                            <img src={selectedItem.mainImage} alt="" className="h-full w-full object-cover" />
                                        ) : <HiOutlineCube className="h-8 w-8 opacity-20" />}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900">{selectedItem.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Stock:</span>
                                            <span className="text-[10px] font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">{(selectedItem.stock || 0)} Units</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex p-1.5 bg-slate-100 rounded-[1.5rem] border border-slate-200">
                                        {['Restock', 'Remove'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setAdjustType(type)}
                                                className={cn(
                                                    "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                                    adjustType === type
                                                        ? "bg-white text-slate-900 shadow-lg"
                                                        : "text-slate-500 hover:text-slate-600"
                                                )}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-2 text-center">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity of Units</label>
                                        <div className="relative group flex items-center justify-center">
                                            <input
                                                type="number"
                                                value={adjustValue}
                                                onChange={(e) => setAdjustValue(e.target.value)}
                                                className="w-32 bg-transparent border-b-2 border-slate-100 text-4xl font-black text-slate-900 focus:border-primary transition-all outline-none text-center py-2"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Reference Note</label>
                                        <textarea
                                            value={adjustNote}
                                            onChange={(e) => setAdjustNote(e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-3xl text-[11px] font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none h-24 shadow-inner"
                                            placeholder="Why are we adjusting this stock?"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                                <Button
                                    onClick={() => setIsAdjustModalOpen(false)}
                                    variant="outline"
                                    className="flex-1 py-4 text-[10px] font-black rounded-2xl bg-white uppercase tracking-widest"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleFullAdjustment}
                                    className="flex-1 py-4 text-[10px] font-black rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-widest"
                                >
                                    Confirm Update
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StockManagement;
