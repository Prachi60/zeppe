import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '@shared/components/ui/Toast';
import { cn } from '@/lib/utils';

import ProductDetailSheet from '../components/shared/ProductDetailSheet';
import { useProductDetail } from '../context/ProductDetailContext';
import { customerApi } from '../services/customerApi';
import MiniCart from '../components/shared/MiniCart';
import { useLocation as useAppLocation } from '../context/LocationContext';
import { useSettings } from '@core/context/SettingsContext';
import { useCartAnimation } from '../context/CartAnimationContext';
import Lottie from 'lottie-react';
import noServiceAnimation from '@/assets/lottie/animation.json';

/* ─── Compact Kuiklo-style card ─────────────────────────────────────────── */
const KuikloCard = React.memo(({ product }) => {
    const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
    const { animateAddToCart, animateRemoveFromCart } = useCartAnimation();
    const { openProduct } = useProductDetail();
    const imageRef = useRef(null);

    const productId = product.id || product._id;
    const cartItem = cart.find(
        (item) => (item.id || item._id) === productId
    );
    const quantity = cartItem ? cartItem.quantity : 0;

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPct = hasDiscount
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const handleCardClick = (e) => {
        if (openProduct) { e.preventDefault(); openProduct(product); }
    };

    const handleAdd = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (imageRef.current) {
            animateAddToCart(imageRef.current.getBoundingClientRect(), product.image);
        }
        addToCart({ ...product });
    };

    const handleInc = (e) => {
        e.preventDefault(); e.stopPropagation();
        updateQuantity(productId, 1);
    };

    const handleDec = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (quantity === 1) {
            animateRemoveFromCart(product.image);
            removeFromCart(productId);
        } else {
            updateQuantity(productId, -1);
        }
    };

    return (
        <motion.div
            whileTap={{ scale: 0.96 }}
            onClick={handleCardClick}
            className="flex flex-col cursor-pointer bg-white rounded-xl overflow-hidden border border-gray-100"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
            {/* Image Box */}
            <div className="relative">
                {hasDiscount && (
                    <span className="absolute top-1.5 left-1.5 z-10 bg-[#c0392b] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                        {discountPct}% OFF
                    </span>
                )}
                <div
                    className="w-full aspect-square flex items-center justify-center p-2"
                    style={{ backgroundColor: '#F8F4EC' }}
                >
                    <img
                        ref={imageRef}
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain mix-blend-multiply"
                        style={{ maxHeight: '90px' }}
                    />
                </div>
            </div>

            {/* Info */}
            <div className="px-1.5 pt-1 pb-2 flex flex-col gap-0.5">
                <p className="text-[11px] font-semibold text-gray-800 leading-tight line-clamp-2 min-h-[28px]">
                    {product.name}
                </p>
                <p className="text-[9px] text-gray-400 font-medium">{product.weight || '1 unit'}</p>

                {/* Price + ADD */}
                <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-gray-900 leading-none">₹{product.price}</span>
                        {hasDiscount && (
                            <span className="text-[9px] text-gray-400 line-through">₹{product.originalPrice}</span>
                        )}
                    </div>

                    {quantity > 0 ? (
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden"
                            style={{ minWidth: '64px' }}>
                            <button
                                onClick={handleDec}
                                className="px-1.5 py-1 text-gray-600 active:bg-gray-100 transition-colors"
                            >
                                <Minus size={10} strokeWidth={3} />
                            </button>
                            <span className="text-[11px] font-bold text-gray-700 px-1">{quantity}</span>
                            <button
                                onClick={handleInc}
                                className="px-1.5 py-1 text-gray-600 active:bg-gray-100 transition-colors"
                            >
                                <Plus size={10} strokeWidth={3} />
                            </button>
                        </div>
                    ) : (
                        <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={handleAdd}
                            className="text-[10px] font-bold bg-white border border-gray-800 text-gray-800 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-all"
                        >
                            ADD
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

/* ─── Page ───────────────────────────────────────────────────────────────── */
const CategoryProductsPage = () => {
    const { categoryName: catId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentLocation } = useAppLocation();
    const { settings } = useSettings();
    const initialSubcategoryId = location.state?.activeSubcategoryId || 'all';
    const { isOpen: isProductDetailOpen } = useProductDetail();
    const [selectedSubCategory, setSelectedSubCategory] = useState(initialSubcategoryId);
    const [category, setCategory] = useState(null);
    const [subCategories, setSubCategories] = useState([{ id: 'all', name: 'All' }]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const tabsRef = useRef(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const hasValidLocation =
                Number.isFinite(currentLocation?.latitude) &&
                Number.isFinite(currentLocation?.longitude);

            if (hasValidLocation) {
                const prodRes = await customerApi.getProducts({
                    categoryId: catId,
                    lat: currentLocation.latitude,
                    lng: currentLocation.longitude,
                });
                if (prodRes.data.success) {
                    const rawResult = prodRes.data.result;
                    const dbProds = Array.isArray(prodRes.data.results)
                        ? prodRes.data.results
                        : Array.isArray(rawResult?.items)
                        ? rawResult.items
                        : Array.isArray(rawResult)
                        ? rawResult
                        : [];

                    const formattedProds = dbProds.map(p => ({
                        ...p,
                        id: p._id,
                        image: p.mainImage || p.image || "https://images.unsplash.com/photo-1550989460-0adf9ea622e2",
                        price: p.salePrice || p.price,
                        originalPrice: p.price,
                        weight: p.weight || "1 unit",
                        deliveryTime: "8-15 mins"
                    }));
                    setProducts(Array.isArray(formattedProds) ? formattedProds : []);
                }
            } else {
                setProducts([]);
            }

            const catRes = await customerApi.getCategories({ tree: true });
            if (catRes.data.success) {
                const tree = catRes.data.results || catRes.data.result || [];
                let currentCat = null;
                for (const header of tree) {
                    const found = (header.children || []).find(c => c._id === catId);
                    if (found) { currentCat = found; break; }
                }
                if (currentCat) {
                    setCategory(currentCat);
                    const subs = (currentCat.children || []).map(s => ({
                        id: s._id,
                        name: s.name,
                    }));
                    setSubCategories([{ id: 'all', name: 'All' }, ...subs]);
                }
            }
        } catch (error) {
            console.error("Error fetching category data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        setSelectedSubCategory(location.state?.activeSubcategoryId || 'all');
    }, [catId, location.state?.activeSubcategoryId, currentLocation?.latitude, currentLocation?.longitude]);

    const safeProducts = Array.isArray(products) ? products : [];

    const filteredProducts = safeProducts.filter(p =>
        selectedSubCategory === 'all' ||
        p.subcategoryId?._id === selectedSubCategory ||
        p.subcategoryId === selectedSubCategory
    );

    return (
        <div className="flex flex-col min-h-screen bg-white max-w-md mx-auto relative" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {/* Header */}
            <header className={cn(
                "sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3",
                isProductDetailOpen && "hidden md:flex"
            )}>
                <button
                    onClick={() => navigate(-1)}
                    className="p-1.5 hover:bg-gray-50 rounded-full transition-colors flex-shrink-0"
                >
                    <ChevronLeft size={22} className="text-gray-900" />
                </button>
                <h1 className="text-[17px] font-bold text-gray-900 tracking-tight truncate">
                    {category?.name || catId}
                </h1>
            </header>

            {/* Subcategory Tabs — horizontal scroll */}
            {subCategories.length > 1 && (
                <div
                    ref={tabsRef}
                    className="sticky z-40 bg-white border-b border-gray-100 flex gap-2 px-4 py-2.5 overflow-x-auto hide-scrollbar"
                    style={{ top: '52px' }}
                >
                    {subCategories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedSubCategory(cat.id)}
                            className={cn(
                                "flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all whitespace-nowrap",
                                selectedSubCategory === cat.id
                                    ? "bg-gray-900 text-white border-gray-900"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Content */}
            <div className="flex-1">
                {isLoading ? (
                    /* skeleton */
                    <div className="grid grid-cols-4 gap-2 p-3 pb-28">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="flex flex-col rounded-xl overflow-hidden bg-gray-100 animate-pulse">
                                <div className="aspect-square bg-gray-200" />
                                <div className="p-1.5 space-y-1">
                                    <div className="h-2.5 bg-gray-200 rounded w-3/4" />
                                    <div className="h-2 bg-gray-200 rounded w-1/2" />
                                    <div className="h-5 bg-gray-200 rounded w-full mt-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : safeProducts.length === 0 ? (
                    <div className="w-full py-20 px-8 flex flex-col items-center justify-center text-center">
                        <div className="w-64 h-64 mb-6">
                            <Lottie animationData={noServiceAnimation} loop={true} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tighter mb-3 uppercase">
                            Service <span className="text-[#45B0E2]">Unavailable</span>
                        </h3>
                        <p className="text-slate-500 font-bold text-sm max-w-[280px] mb-8 leading-relaxed">
                            {settings?.appName || 'Our service'} is not available in your area yet.
                        </p>
                        <button
                            onClick={fetchData}
                            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all"
                        >
                            Try Refreshing
                        </button>
                    </div>
                ) : (
                    <>
                        {filteredProducts.length === 0 ? (
                            <div className="py-16 text-center text-gray-400 text-sm font-semibold">
                                No products in this subcategory
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2 p-3 pb-28">
                                {filteredProducts.map((product) => (
                                    <KuikloCard key={product.id || product._id} product={product} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <MiniCart />
            <ProductDetailSheet />

            <style dangerouslySetInnerHTML={{
                __html: `
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
                    .hide-scrollbar::-webkit-scrollbar { display: none; }
                    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}} />
        </div>
    );
};

export default CategoryProductsPage;

