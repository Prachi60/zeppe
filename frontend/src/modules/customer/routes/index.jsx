import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const Home = React.lazy(() => import('../pages/Home'));
const CategoriesPage = React.lazy(() => import('../pages/CategoriesPage'));
const CategoryProductsPage = React.lazy(() => import('../pages/CategoryProductsPage'));
const WishlistPage = React.lazy(() => import('../pages/WishlistPage'));
const CartPage = React.lazy(() => import('../pages/CartPage'));
const OffersPage = React.lazy(() => import('../pages/OffersPage'));
const ShopByStorePage = React.lazy(() => import('../pages/ShopByStorePage'));
const ProfilePage = React.lazy(() => import('../pages/ProfilePage'));
const OrdersPage = React.lazy(() => import('../pages/OrdersPage'));
const OrderTransactionsPage = React.lazy(() => import('../pages/OrderTransactionsPage'));
const AddressesPage = React.lazy(() => import('../pages/AddressesPage'));
const SettingsPage = React.lazy(() => import('../pages/SettingsPage'));
const SupportPage = React.lazy(() => import('../pages/SupportPage'));
const ChatPage = React.lazy(() => import('../pages/ChatPage'));
const TermsPage = React.lazy(() => import('../pages/TermsPage'));
const PrivacyPage = React.lazy(() => import('../pages/PrivacyPage'));
const AboutPage = React.lazy(() => import('../pages/AboutPage'));
const EditProfilePage = React.lazy(() => import('../pages/EditProfilePage'));
const OrderDetailPage = React.lazy(() => import('../pages/OrderDetailPage'));
const ProductDetailPage = React.lazy(() => import('../pages/ProductDetailPage'));
const CheckoutPage = React.lazy(() => import('../pages/CheckoutPage'));
const PaymentStatusPage = React.lazy(() => import('../pages/PaymentStatusPage'));
const StoreDetailPage = React.lazy(() => import('../pages/StoreDetailPage'));
const WalletPage = React.lazy(() => import('../pages/WalletPage'));
const MyScratchCards = React.lazy(() => import('../pages/MyScratchCards'));

import ScrollToTop from '../components/shared/ScrollToTop';
import { WishlistProvider } from '../context/WishlistContext';
import { CartProvider } from '../context/CartContext';
import { CartAnimationProvider } from '../context/CartAnimationContext';
import { LocationProvider } from '../context/LocationContext';

import ProtectedRoute from '../../../core/guards/ProtectedRoute';

const CustomerRoutes = () => {
    return (
        <LocationProvider>
            <WishlistProvider>
                <CartProvider>
                    <CartAnimationProvider>
                        <ScrollToTop />
                        <React.Suspense fallback={<div className="flex h-[80vh] w-full items-center justify-center bg-white text-xs font-bold uppercase tracking-widest text-slate-400">Loading...</div>}>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="categories" element={<CategoriesPage />} />
                                <Route path="category/:categoryId" element={<CategoryProductsPage />} />
                                <Route path="product/:id" element={<ProductDetailPage />} />
                                <Route path="terms" element={<TermsPage />} />
                                <Route path="privacy" element={<PrivacyPage />} />
                                <Route path="about" element={<AboutPage />} />
                                <Route path="offers" element={<OffersPage />} />
                                <Route path="shop-by-store" element={<Navigate to="/stores" replace />} />
                                <Route path="stores" element={<ShopByStorePage />} />
                                <Route path="stores/:storeId" element={<StoreDetailPage />} />

                                {/* Protected Customer Routes */}
                                <Route path="wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
                                <Route path="orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                                <Route path="orders/:orderId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
                                <Route path="transactions" element={<ProtectedRoute><OrderTransactionsPage /></ProtectedRoute>} />
                                <Route path="addresses" element={<ProtectedRoute><AddressesPage /></ProtectedRoute>} />
                                <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                                <Route path="support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
                                <Route path="chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                                <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                                <Route path="payment-status" element={<ProtectedRoute><PaymentStatusPage /></ProtectedRoute>} />
                                <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                                <Route path="profile/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
                                <Route path="wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
                                <Route path="rewards" element={<ProtectedRoute><MyScratchCards /></ProtectedRoute>} />
                            </Routes>
                        </React.Suspense>
                    </CartAnimationProvider>
                </CartProvider>
            </WishlistProvider>
        </LocationProvider>
    );
};

export default CustomerRoutes;
