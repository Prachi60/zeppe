import React from 'react';
import { useAuth } from '@core/context/AuthContext';
import {
    HiOutlineLogout,
    HiOutlineUserCircle,
    HiOutlineBell,
    HiOutlineSearch,
    HiOutlineMenu
} from 'react-icons/hi';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { sellerApi } from '@/modules/seller/services/sellerApi';
import { AnimatePresence } from 'framer-motion';
import NotificationPopup from './NotificationPopup';
import { toast } from 'sonner';

const Topbar = React.memo(({ onMenuClick }) => {
    const { user, logout, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [searchQuery, setSearchQuery] = React.useState('');
    const [notifications, setNotifications] = React.useState([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [isShopOpen, setIsShopOpen] = React.useState(true);
    const [shopToggleLoading, setShopToggleLoading] = React.useState(false);
    const notificationRef = React.useRef(null);

    const isSeller = location.pathname.startsWith('/seller');

    const handleSearchSubmit = React.useCallback((e) => {
        e?.preventDefault();
        const q = (searchQuery || '').trim();
        if (!q) return;
        if (isSeller) {
            navigate(`/seller/products?q=${encodeURIComponent(q)}`);
        }
    }, [searchQuery, isSeller, navigate]);

    const fetchNotifications = React.useCallback(async () => {
        try {
            if (!isSeller) return;

            const response = await sellerApi.getNotifications();
            if (response.data.success) {
                setNotifications(response.data.result.notifications);
                setUnreadCount(response.data.result.unreadCount);
            }
        } catch (error) {
            console.error("Notif Fetch Error:", error);
        }
    }, [isSeller]);

    React.useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Load initial shop status from profile
    React.useEffect(() => {
        if (role === 'seller') {
            sellerApi.getProfile()
                .then((res) => {
                    const profile = res.data?.result ?? res.data;
                    if (typeof profile?.isShopOpen === 'boolean') {
                        setIsShopOpen(profile.isShopOpen);
                    }
                })
                .catch(() => { });
        }
    }, [role]);

    const handleToggleShop = React.useCallback(async () => {
        if (shopToggleLoading) return;
        setShopToggleLoading(true);
        const prev = isShopOpen;
        setIsShopOpen(!prev); // optimistic
        try {
            const res = await sellerApi.toggleShopStatus();
            const updated = res.data?.result?.isShopOpen;
            if (typeof updated === 'boolean') setIsShopOpen(updated);
            toast.success(updated ? '🟢 Shop is now Open' : '🔴 Shop is now Closed — customers cannot add your products to cart.');
        } catch {
            setIsShopOpen(prev); // revert on error
            toast.error('Failed to update shop status');
        } finally {
            setShopToggleLoading(false);
        }
    }, [isShopOpen, shopToggleLoading]);

    // Handle Click Outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = React.useCallback(async (id) => {
        try {
            await sellerApi.markNotificationRead(id);
            fetchNotifications();
        } catch (error) {
            toast.error("Failed to mark as read");
        }
    }, [fetchNotifications]);

    const handleMarkAllAsRead = React.useCallback(async () => {
        try {
            await sellerApi.markAllNotificationsRead();
            fetchNotifications();
            toast.success("All caught up!");
        } catch (error) {
            toast.error("Failed to mark all as read");
        }
    }, [fetchNotifications]);

    const handleLogout = React.useCallback(() => {
        logout();
    }, [logout]);

    const handleProfileClick = React.useCallback(() => {
        if (location.pathname.startsWith('/admin')) {
            navigate('/admin/profile');
        } else if (location.pathname.startsWith('/seller')) {
            navigate('/seller/profile');
        } else if (location.pathname.startsWith('/delivery')) {
            navigate('/delivery/profile');
        } else {
            navigate('/profile');
        }
    }, [location.pathname, navigate]);

    return (
        <header className={cn(
            "bg-white/70 backdrop-blur-xl border-b border-gray-100/50 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.02)] transition-all duration-300",
            (role === 'admin' || role === 'seller')
                ? "fixed top-0 left-0 right-0 z-50 h-14 px-4 md:static md:h-16 md:px-6"
                : "fixed top-0 left-56 right-0 h-16 px-6 z-40"
        )}>
            <div className="flex items-center flex-1 mr-4 overflow-hidden">
                <button
                    onClick={onMenuClick}
                    className="p-2.5 mr-2 bg-gray-100/80 hover:bg-white rounded-xl text-gray-600 hover:text-primary transition-all duration-300 md:hidden border border-transparent hover:border-primary/20 shadow-sm"
                >
                    <HiOutlineMenu className="h-5 w-5" />
                </button>

                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-[400px] group">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-all duration-300" />
                    <input
                        type="text"
                        placeholder={isSeller ? "Search products by name or SKU..." : "Search anything..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100/50 border border-transparent rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all duration-500 outline-none"
                    />
                </form>
            </div>

            <div className="flex items-center space-x-3 md:space-x-4">
                {/* Shop Toggle (Sellers only) */}
                {role === 'seller' && (
                    <button
                        onClick={handleToggleShop}
                        disabled={shopToggleLoading}
                        className={cn(
                            "flex items-center gap-2 px-2.5 py-1.5 rounded-xl border font-bold text-[10px] transition-all duration-300 shadow-sm shrink-0",
                            isShopOpen
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
                            shopToggleLoading && "opacity-60 cursor-not-allowed"
                        )}
                    >
                        <div className={cn(
                            "relative w-7 h-3.5 rounded-full transition-colors duration-300",
                            isShopOpen ? "bg-emerald-500" : "bg-red-400"
                        )}>
                            <div className={cn(
                                "absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow transition-transform duration-300",
                                isShopOpen ? "translate-x-4" : "translate-x-0.5"
                            )} />
                        </div>
                        <span className="hidden sm:inline uppercase tracking-wider">{isShopOpen ? 'Open' : 'Closed'}</span>
                    </button>
                )}

                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={cn(
                            "p-2 hover:bg-primary/5 text-gray-500 hover:text-primary rounded-xl transition-all duration-300 relative group",
                            showNotifications && "bg-primary/5 text-primary"
                        )}
                    >
                        <HiOutlineBell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white shadow-sm"></span>
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <NotificationPopup
                                notifications={notifications}
                                onMarkAsRead={handleMarkAsRead}
                                onMarkAllAsRead={handleMarkAllAsRead}
                                onClose={() => setShowNotifications(false)}
                            />
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-8 w-px bg-gray-100 mx-1"></div>
                <button
                    onClick={handleProfileClick}
                    className="flex items-center space-x-2.5 p-1 pr-3 hover:bg-gray-50 rounded-xl transition-all duration-300 group ring-1 ring-transparent hover:ring-gray-100 shadow-sm hover:shadow-md"
                >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                        {user?.name?.[0] || 'A'}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">{user?.name || 'Demo User'}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{user?.role || 'Member'}</p>
                    </div>
                </button>
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-300 font-bold text-xs shadow-sm hover:shadow-rose-100/50"
                >
                    <HiOutlineLogout className="h-4 w-4" />
                    <span className="hidden lg:block">Sign Out</span>
                </button>
            </div>
        </header>
    );
});

export default Topbar;

