import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    ClipboardList,
    Box,
    Wallet,
    MoreHorizontal,
    ChevronDown,
    X
} from 'lucide-react';

import { useAuth } from '@core/context/AuthContext';

const BottomNav = ({ navItems }) => {
    const { role } = useAuth();
    const location = useLocation();
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    // Close "More" drawer on route change
    useEffect(() => {
        setIsMoreOpen(false);
    }, [location.pathname]);

    // Define the primary bottom nav items based on user role
    const primaryItems = role === 'admin' ? [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
        { label: 'Orders', path: '/admin/orders/all', icon: ClipboardList },
        { label: 'Products', path: '/admin/products', icon: Box },
        { label: 'Wallet', path: '/admin/wallet', icon: Wallet },
    ] : [
        { label: 'Dashboard', path: '/seller', icon: LayoutDashboard, end: true },
        { label: 'Orders', path: '/seller/orders', icon: ClipboardList },
        { label: 'Products', path: '/seller/products', icon: Box },
        { label: 'Earnings', path: '/seller/earnings', icon: Wallet },
    ];

    return (
        <>
            {/* More Menu Drawer */}
            <AnimatePresence>
                {isMoreOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMoreOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-[calc(64px+var(--sab,0px))] left-0 right-0 bg-[#161b22] z-[56] md:hidden rounded-t-3xl border-t border-white/10 max-h-[70vh] overflow-y-auto p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">More Actions</h3>
                                <button onClick={() => setIsMoreOpen(false)} className="p-2 bg-white/5 rounded-full text-white/50">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {navItems?.map((item) => {
                                    const isPrimary = primaryItems.some(pi => pi.path === item.path);
                                    if (isPrimary) return null;
                                    
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            end={item.end}
                                            className={({ isActive }) => cn(
                                                "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group",
                                                isActive ? "bg-primary text-white" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn("p-2 rounded-xl transition-colors", isActive ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10")}>
                                                    <item.icon size={20} />
                                                </div>
                                                <span className="font-bold tracking-tight">{item.label}</span>
                                            </div>
                                            <ChevronRight size={18} className={isActive ? "text-white/50" : "text-gray-600"} />
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="fixed bottom-0 left-0 right-0 h-[calc(64px+var(--sab,0px))] bg-[#0a0c10] border-t border-white/5 z-[60] md:hidden px-2 pb-[var(--sab,0px)] flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.4)]">
                {primaryItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) => cn(
                            "flex flex-col items-center justify-center space-y-1 w-16 transition-all duration-300",
                            isActive ? "text-primary" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
                    </NavLink>
                ))}
                
                {/* More Button */}
                <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    className={cn(
                        "flex flex-col items-center justify-center space-y-1 w-16 transition-all duration-300",
                        isMoreOpen ? "text-primary" : "text-gray-500"
                    )}
                >
                    <MoreHorizontal className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">More</span>
                </button>
            </div>
        </>
    );
};

export default BottomNav;

