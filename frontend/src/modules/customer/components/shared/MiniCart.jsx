import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const MiniCart = () => {
    const { cart, cartCount } = useCart();
    const location = useLocation();

    // Show up to 2 product images
    const displayItems = cart.slice(0, 2);

    const path = location.pathname.replace(/\/$/, '') || '/';

    // Hide MiniCart on checkout page, order details page, profile page, wallet, transactions, wishlist, addresses, support, privacy, and about page
    const isCheckoutPage = path === '/checkout';
    const isOrderDetailsPage = path.startsWith('/orders');
    const isProfilePage = path === '/profile';
    const isWalletPage = path === '/wallet';
    const isTransactionsPage = path === '/transactions';
    const isWishlistPage = path.startsWith('/wishlist');
    const isAddressesPage = path.startsWith('/addresses');
    const isSupportPage = path.startsWith('/support');
    const isPrivacyPage = path.startsWith('/privacy');
    const isAboutPage = path.startsWith('/about');

    return (
        <AnimatePresence>
            {cart.length > 0 && !isCheckoutPage && !isOrderDetailsPage && !isProfilePage && !isWalletPage && !isTransactionsPage && !isWishlistPage && !isAddressesPage && !isSupportPage && !isPrivacyPage && !isAboutPage && (
                <div
                    key="mini-cart-wrapper"
                    id="mini-cart-target"
                    className="fixed bottom-[80px] md:bottom-[calc(6rem-20px)] left-0 right-0 flex justify-center z-[55] pointer-events-none px-4"
                >

                    <motion.div
                        initial={{ y: 50, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 50, opacity: 0, scale: 0.9 }}
                        className="w-full max-w-[170px] pointer-events-auto"
                    >
                        <Link
                            to="/checkout"
                            className="flex items-center gap-2 text-white py-1 px-1.5 rounded-full shadow-[0_12px_40px_rgba(245,153,49,0.4)] hover:scale-[1.02] active:scale-95 transition-all group border border-white/10 relative overflow-hidden bg-[#f59931]"
                        >
                            <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                                <div className="mini-cart-shimmer absolute inset-y-0 left-[-40%] w-[40%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]" />
                            </div>

                            {/* Single Circular Thumbnail */}
                            <div className="h-9 w-9 rounded-full bg-white p-0.5 border-2 border-white/10 shadow-sm overflow-hidden flex-shrink-0 z-[1]">
                                {cart.length > 0 && (
                                    <img
                                        src={cart[0].image}
                                        alt={cart[0].name}
                                        className="w-full h-full object-contain rounded-full"
                                    />
                                )}
                            </div>

                            {/* Text Section */}
                            <div className="flex-1 flex flex-col justify-center min-w-0 pr-0.5">
                                <h4 className="text-[12px] font-bold leading-tight whitespace-nowrap">View cart</h4>
                                <p className="text-[10px] opacity-90 font-semibold leading-tight">{cartCount} {cartCount === 1 ? 'item' : 'items'}</p>
                            </div>

                            {/* Arrow Button */}
                            <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
                                <ChevronRight size={16} strokeWidth={3} className="text-white" />
                            </div>
                        </Link>
                    </motion.div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes mini-cart-shimmer {
                    0% { transform: translateX(-140%); }
                    100% { transform: translateX(320%); }
                }
                .mini-cart-shimmer {
                    animation: mini-cart-shimmer 2.8s ease-in-out infinite;
                }
                @keyframes gradient-move {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    animation: gradient-move 3s ease infinite;
                }
            `}} />
        </AnimatePresence>
    );
};

export default MiniCart;

