import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';
import { sellerApi } from '@/modules/seller/services/sellerApi';
import { useAuth } from "@core/context/AuthContext";
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, Check, X, Clock, Truck, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SellerOrdersProvider } from '@/modules/seller/context/SellerOrdersContext';
import { SellerEarningsProvider, defaultEarnings } from '@/modules/seller/context/SellerEarningsContext';
import { getOrderSocket, onSellerOrderNew, onReturnDropOtp, onSellerReturnRequested } from '@/core/services/orderSocket';
import { showSystemNotification } from '@/core/firebase/pushClient';
import { orderAlertSoundUrl } from "@/assets/sound/orderAlertSound";

const POLL_INTERVAL_MS = 15000;

/** Match server `sellerPendingExpiresAt` — never reset to a full 60s when the modal opens late. */
function secondsLeftUntilSellerExpiry(order) {
    if (!order) return 0;
    const raw = order.sellerPendingExpiresAt ?? order.expiresAt;
    if (!raw) return 60;
    const ms = new Date(raw).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 1000));
}

const isEarningsRoute = (path) =>
    path.includes('earnings') || path.includes('withdrawals') || path.includes('transactions');


const DashboardLayout = ({ children, navItems, title }) => {
    const [newOrderAlert, setNewOrderAlert] = useState(null);
    const [newReturnAlert, setNewReturnAlert] = useState(null);
    const [shownOrderIds, setShownOrderIds] = useState(() => new Set());
    const [shownReturnOrderIds, setShownReturnOrderIds] = useState(() => new Set());
    const [timeLeft, setTimeLeft] = useState(0);
    /** Total seconds in this acceptance window (for progress bar), set when modal opens */
    const acceptWindowTotalRef = useRef(60);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [returnDropOtpAlert, setReturnDropOtpAlert] = useState(null); // { orderId, otp, expiresAt }
    const audioRef = useRef(null);

    useEffect(() => {
        const shouldPlay = !!newOrderAlert || !!newReturnAlert || !!returnDropOtpAlert;

        if (shouldPlay) {
            if (!audioRef.current) {
                audioRef.current = new Audio(orderAlertSoundUrl);
                audioRef.current.loop = true;
            }
            audioRef.current.play().catch(() => { });
        } else if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, [newOrderAlert, newReturnAlert, returnDropOtpAlert]);

    // Handle browser autoplay policy + desktop notifications
    useEffect(() => {
        const hasAlert = !!newOrderAlert || !!newReturnAlert || !!returnDropOtpAlert;
        if (hasAlert) {
            // 1. Try to play audio immediately
            if (audioRef.current && audioRef.current.paused) {
                audioRef.current.play().catch(() => {
                    console.log("Audio autoplay blocked by browser policy");
                });
            }

            // 2. Also show desktop notification (OS will play system sound)
            const title = newOrderAlert ? "New Order!" : (newReturnAlert ? "Return Request" : "Rider at Store");
            const body = newOrderAlert 
                ? `Order #${newOrderAlert.orderId} - ₹${newOrderAlert.pricing?.total || newOrderAlert.total}`
                : (newReturnAlert ? `Return for #${newReturnAlert.orderId}` : `Rider waiting for OTP for #${returnDropOtpAlert?.orderId}`);
            
            showSystemNotification({ title, body }).catch(() => {});
        }

        const unlockAudio = () => {
            if (hasAlert && audioRef.current && audioRef.current.paused) {
                audioRef.current.play().catch(() => { });
            }
        };
        window.addEventListener("click", unlockAudio);
        window.addEventListener("touchstart", unlockAudio);
        return () => {
            window.removeEventListener("click", unlockAudio);
            window.removeEventListener("touchstart", unlockAudio);
        };
    }, [newOrderAlert, newReturnAlert, returnDropOtpAlert]);

    const { user, logout, role } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Shared data for seller – single source, avoids duplicate API calls
    const [sellerOrders, setSellerOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [sellerEarningsData, setSellerEarningsData] = useState(defaultEarnings);
    const [earningsLoading, setEarningsLoading] = useState(false);

    const shownOrderIdsRef = useRef(new Set());
    const shownReturnOrderIdsRef = useRef(new Set());
    const isFirstLoadRef = useRef(true);
    const newOrderAlertRef = useRef(null);
    const newReturnAlertRef = useRef(null);
    const fetchOrdersRef = useRef(null);
    const playedSoundIdsRef = useRef(new Set());
    const earningsFetchedRef = useRef(false);

    useEffect(() => {
        shownOrderIdsRef.current = shownOrderIds;
    }, [shownOrderIds]);
    useEffect(() => {
        shownReturnOrderIdsRef.current = shownReturnOrderIds;
    }, [shownReturnOrderIds]);
    useEffect(() => {
        newOrderAlertRef.current = newOrderAlert;
    }, [newOrderAlert]);
    useEffect(() => {
        newReturnAlertRef.current = newReturnAlert;
    }, [newReturnAlert]);

    useEffect(() => {
        if (role !== 'seller') {
            setSellerOrders([]);
            setOrdersLoading(false);
            return;
        }
        setOrdersLoading(true);

        const fetchOrders = async () => {
            try {
                const res = await sellerApi.getOrders();
                if (!res?.data?.success) return;

                const payload = res.data.result || {};
                const rawOrders = Array.isArray(payload.items)
                    ? payload.items
                    : (res.data.results || []);
                const allOrders = Array.isArray(rawOrders) ? rawOrders : [];
                setSellerOrders(allOrders);

                const pendingOrders = allOrders.filter((o) => {
                    const ws = (o.workflowStatus || '').toUpperCase();
                    if (ws === 'SELLER_PENDING') return true;
                    return (o?.status || '').toLowerCase() === 'pending';
                });

                if (isFirstLoadRef.current) {
                    const existingIds = new Set(pendingOrders.map((o) => o.orderId).filter(Boolean));
                    shownOrderIdsRef.current = existingIds;
                    isFirstLoadRef.current = false;
                    setShownOrderIds(existingIds);
                    return;
                }

                // 1. SOUND ALERT: Play sound for any order we haven't alerted yet
                const unalertedOrders = pendingOrders.filter(o => !playedSoundIdsRef.current.has(o.orderId));
                if (unalertedOrders.length > 0) {
                    unalertedOrders.forEach(o => playedSoundIdsRef.current.add(o.orderId));
                }

                // 2. MODAL DISPLAY: Only show if no modal is currently active
                if (newOrderAlertRef.current) return;

                const nextOrderToShow = pendingOrders.find((o) => !shownOrderIdsRef.current.has(o.orderId));
                if (!nextOrderToShow) return;

                setNewOrderAlert(nextOrderToShow);
                setShownOrderIds((prev) => new Set(prev).add(nextOrderToShow.orderId));
                shownOrderIdsRef.current = new Set(shownOrderIdsRef.current).add(nextOrderToShow.orderId);
                newOrderAlertRef.current = nextOrderToShow;
            } catch (error) {
                console.error("Polling Error:", error);
            } finally {
                setOrdersLoading(false);
            }
        };

        fetchOrdersRef.current = fetchOrders;
        fetchOrders();
        // Removed aggressive polling: Sockets handle real-time updates now.
    }, [role]);

    useEffect(() => {
        if (role !== 'seller') return undefined;
        const getToken = () => localStorage.getItem('auth_seller');
        getOrderSocket(getToken);
        onSellerOrderNew(getToken, () => {
            if (fetchOrdersRef.current) fetchOrdersRef.current();
        });

        const unsubscribeDrop = onReturnDropOtp(getToken, (payload) => {
            console.log("[DashboardLayout] Received return drop OTP:", payload);
            setReturnDropOtpAlert(payload);
        });

        const unsubscribeReturn = onSellerReturnRequested(getToken, (payload) => {
            console.log("[DashboardLayout] Received return request:", payload);
            setNewReturnAlert(payload);
        });

        return () => {
            unsubscribeDrop();
            unsubscribeReturn();
        };
    }, [role]);

    // Single earnings fetch when seller is on earnings/withdrawals/transactions – no duplicate calls
    useEffect(() => {
        if (role !== 'seller' || !isEarningsRoute(location.pathname)) {
            if (!isEarningsRoute(location.pathname)) earningsFetchedRef.current = false;
            return;
        }
        if (earningsFetchedRef.current) return;
        earningsFetchedRef.current = true;
        setEarningsLoading(true);

        sellerApi
            .getEarnings()
            .then((response) => {
                const raw = response?.data?.result ?? response?.data?.data;
                if (response?.data?.success && raw && typeof raw === 'object') {
                    setSellerEarningsData({
                        balances: raw.balances ?? {},
                        ledger: Array.isArray(raw.ledger) ? raw.ledger : [],
                        monthlyChart: Array.isArray(raw.monthlyChart) ? raw.monthlyChart : [],
                    });
                }
            })
            .catch((err) => console.error("Earnings Fetch Error:", err))
            .finally(() => setEarningsLoading(false));
    }, [role, location.pathname]);

    const refreshOrders = () => {
        if (fetchOrdersRef.current) fetchOrdersRef.current();
    };
    const refreshEarnings = () => {
        earningsFetchedRef.current = false;
        setEarningsLoading(true);
        sellerApi
            .getEarnings()
            .then((response) => {
                const raw = response?.data?.result ?? response?.data?.data;
                if (response?.data?.success && raw && typeof raw === 'object') {
                    setSellerEarningsData({
                        balances: raw.balances ?? {},
                        ledger: Array.isArray(raw.ledger) ? raw.ledger : [],
                        monthlyChart: Array.isArray(raw.monthlyChart) ? raw.monthlyChart : [],
                    });
                }
            })
            .catch((err) => console.error("Earnings Fetch Error:", err))
            .finally(() => {
                setEarningsLoading(false);
                earningsFetchedRef.current = true;
            });
    };

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    // Timer: driven by server expiry (sellerPendingExpiresAt), not a local 60s from modal open
    useEffect(() => {
        if (!newOrderAlert) return undefined;

        const left = secondsLeftUntilSellerExpiry(newOrderAlert);
        if (left <= 0) {
            setNewOrderAlert(null);
            toast.error("This order has already expired — you can no longer accept it.");
            return undefined;
        }

        acceptWindowTotalRef.current = left;
        setTimeLeft(left);

        const timer = setInterval(() => {
            const next = secondsLeftUntilSellerExpiry(newOrderAlertRef.current);
            setTimeLeft(next);
            if (next <= 0) {
                clearInterval(timer);
                setNewOrderAlert(null);
                toast.error("Order timed out!");
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [newOrderAlert]);

    const handleAcceptOrder = async (orderId) => {
        setNewOrderAlert(null); // Stop sound immediately
        newOrderAlertRef.current = null;
        try {
            await sellerApi.updateOrderStatus(orderId, { status: 'confirmed' });
            toast.success(`Order #${orderId} Accepted!`);
            // Check for next order in queue
            setTimeout(() => refreshOrders(), 500);
        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                "Failed to accept order";
            toast.error(msg);
        }
    };

    const handleDeclineOrder = async (orderId) => {
        setNewOrderAlert(null); // Stop sound immediately
        newOrderAlertRef.current = null;
        try {
            await sellerApi.updateOrderStatus(orderId, { status: 'cancelled' });
            toast.error(`Order #${orderId} Declined`);
            // Check for next order in queue
            setTimeout(() => refreshOrders(), 500);
        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                "Failed to update order";
            toast.error(msg);
        }
    };

    const handleSidebarClose = React.useCallback(() => setIsSidebarOpen(false), []);
    const handleSidebarOpen = React.useCallback(() => setIsSidebarOpen(true), []);

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
            {/* background depth removed for performance */}
            <Sidebar
                items={navItems}
                title={title}
                isOpen={isSidebarOpen}
                onClose={handleSidebarClose}
            />
            <div className={cn("transition-all duration-300", (role === "admin" || role === "seller") ? "pl-0 md:pl-56" : "pl-56")}>
                <Topbar onMenuClick={handleSidebarOpen} />
                <main className={cn("p-4 md:p-6 min-h-screen", (role === "admin" || role === "seller") ? "pt-20 md:pt-6 pb-24 md:pb-6" : "pt-20")}>
                    <div className="w-full pb-12">
                        <SellerOrdersProvider
                            value={useMemo(() => ({
                                orders: role === 'seller' ? sellerOrders : [],
                                ordersLoading: role === 'seller' ? ordersLoading : false,
                                refreshOrders,
                            }), [role, sellerOrders, ordersLoading])}>
                            <SellerEarningsProvider
                                value={useMemo(() => ({
                                    earningsData: role === 'seller' ? sellerEarningsData : defaultEarnings,
                                    earningsLoading: role === 'seller' ? earningsLoading : false,
                                    refreshEarnings,
                                }), [role, sellerEarningsData, earningsLoading])}>
                                {children}
                            </SellerEarningsProvider>
                        </SellerOrdersProvider>
                    </div>
                </main>
            </div>

            {/* Global Order Alert Modal */}
            <AnimatePresence>
                {newOrderAlert && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                    <BellRing className="h-10 w-10 text-primary" />
                                </div>

                                <h2 className="text-2xl font-black text-slate-900 mb-2">New Order Received!</h2>
                                <p className="text-slate-600 font-medium mb-6">
                                    You have a new order <span className="text-primary font-bold">#{newOrderAlert.orderId}</span> for <span className="text-slate-900 font-bold">₹{newOrderAlert.pricing?.total || newOrderAlert.total}</span>
                                </p>

                                {/* Timer Bar — width from real server deadline */}
                                <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full transition-[width] duration-1000 ease-linear",
                                            timeLeft < 15 ? "bg-rose-500" : "bg-primary",
                                        )}
                                        style={{
                                            width: `${acceptWindowTotalRef.current > 0 ? (timeLeft / acceptWindowTotalRef.current) * 100 : 0}%`,
                                        }}
                                    />
                                </div>

                                <div className="flex items-center gap-4 text-sm font-bold mb-8">
                                    <Clock className={cn("h-4 w-4", timeLeft < 15 ? "text-rose-500 animate-pulse" : "text-slate-600")} />
                                    <span className={timeLeft < 15 ? "text-rose-500" : "text-slate-600"}>
                                        Accept within {timeLeft} {timeLeft === 1 ? "second" : "seconds"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={() => handleDeclineOrder(newOrderAlert.orderId)}
                                        className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                        Decline
                                    </button>
                                    <button
                                        onClick={() => handleAcceptOrder(newOrderAlert.orderId)}
                                        className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95"
                                    >
                                        <Check className="h-5 w-5" />
                                        Accept
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Global Return Drop OTP Modal */}
                {returnDropOtpAlert && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-brand-100"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="h-20 w-20 bg-brand-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <Truck className="h-10 w-10 text-brand-600" />
                                </div>

                                <h2 className="text-2xl font-black text-slate-900 mb-2">Rider at Store!</h2>
                                <p className="text-slate-600 font-medium mb-6">
                                    A rider is at your store for Return <span className="text-brand-600 font-bold">#{returnDropOtpAlert.orderId}</span>.
                                    Please share the OTP below:
                                </p>

                                <div className="flex items-center justify-center gap-3 mb-8">
                                    {returnDropOtpAlert.otp.split('').map((char, i) => (
                                        <div key={i} className="h-16 w-14 bg-slate-50 rounded-2xl shadow-sm border border-brand-100 flex items-center justify-center text-4xl font-black text-slate-900 border-b-4 border-b-brand-600">
                                            {char}
                                        </div>
                                    ))}
                                </div>

                                <p className="text-xs font-bold text-slate-500 italic mb-8">
                                    Confirm receipt of the product by sharing this code.
                                </p>

                                <button
                                    onClick={() => setReturnDropOtpAlert(null)}
                                    className="w-full py-4 rounded-2xl bg-primary text-white font-black hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95 uppercase tracking-widest text-xs"
                                >
                                    Dismiss Alert
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Global Return Request Alert Modal */}
                {newReturnAlert && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-orange-100"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="h-20 w-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                    <BellRing className="h-10 w-10 text-orange-600" />
                                </div>

                                <h2 className="text-2xl font-black text-slate-900 mb-2">Return Requested!</h2>
                                <p className="text-slate-600 font-medium mb-4">
                                    A customer has requested a return for order <span className="text-orange-600 font-bold">#{newReturnAlert.orderId}</span>.
                                </p>
                                
                                <div className="w-full bg-orange-50 rounded-2xl p-4 mb-6 border border-orange-100 text-left">
                                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Reason</p>
                                    <p className="text-sm font-bold text-slate-800 line-clamp-3">
                                        {newReturnAlert.returnReason || "No reason provided."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={() => setNewReturnAlert(null)}
                                        className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        onClick={() => {
                                            setNewReturnAlert(null);
                                            navigate('/seller/returns');
                                        }}
                                        className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-xl shadow-orange-200 transition-all active:scale-95"
                                    >
                                        <Eye className="h-5 w-5" />
                                        Review
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {(role === "admin" || role === "seller") && <BottomNav navItems={navItems} />}
        </div>
    );
};

export default DashboardLayout;
