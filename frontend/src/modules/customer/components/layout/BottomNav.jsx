import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, Store, User, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@core/context/AuthContext';
import GuestProfilePrompt from '../shared/GuestProfilePrompt';

const navItems = [
    { label: 'Home', icon: Home, path: '/', id: 'home' },
    { label: 'Order Again', icon: ShoppingBag, path: '/orders', id: 'orders' },
    { label: 'Category', icon: LayoutGrid, path: '/categories', id: 'categories' },
    { label: 'Stores', icon: Store, path: '/stores', id: 'stores' },
    { label: 'Profile', icon: User, path: '/profile', id: 'profile' },
];

const BottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [isGuestPromptOpen, setIsGuestPromptOpen] = useState(false);

    const handleNavClick = (item) => {
        if ((item.path === '/profile' || item.path === '/orders') && !isAuthenticated) {
            setIsGuestPromptOpen(true);
            return;
        }

        navigate(item.path);
    };

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-[500] bg-white border-t border-gray-100 flex items-center justify-around h-[70px] md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.06)] px-4 pb-[env(safe-area-inset-bottom)]">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => handleNavClick(item)}
                            className="flex-1 flex h-full flex-col items-center justify-center relative group transition-all"
                        >
                            <div className="flex flex-col items-center justify-center relative">
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="absolute -inset-y-1.5 -inset-x-3 bg-[#2822e3]/10 rounded-xl -z-10 px-2 py-1"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </AnimatePresence>

                                <motion.div
                                    animate={{
                                        y: isActive ? -1 : 0,
                                        scale: isActive ? 1.05 : 1
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                >
                                    <item.icon
                                        size={26}
                                        strokeWidth={isActive ? 2.5 : 2}
                                        className={cn(
                                            "transition-colors duration-300",
                                            isActive ? "text-[#2822e3]" : "text-gray-400"
                                        )}
                                    />
                                </motion.div>

                                <motion.span
                                    animate={{
                                        y: isActive ? 1 : 0
                                    }}
                                    className={cn(
                                        "text-[10px] font-bold tracking-tight mt-1 transition-colors duration-300",
                                        isActive ? "text-[#2822e3]" : "text-gray-500"
                                    )}
                                >
                                    {item.label}
                                </motion.span>
                            </div>

                            {isActive && (
                                <motion.div
                                    layoutId="topLine"
                                    className="absolute -top-[1px] w-8 h-[2.5px] bg-[#2822e3] rounded-full"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            <GuestProfilePrompt
                isOpen={isGuestPromptOpen}
                onClose={() => setIsGuestPromptOpen(false)}
            />
        </>
    );
};

export default BottomNav;

