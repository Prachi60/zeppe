import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, Search, Heart, Bell, Sparkles, ShoppingBag, LayoutGrid, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '@shared/components/ui/Toast';
import { cn } from '@/lib/utils';

import ProductDetailSheet from '../components/shared/ProductDetailSheet';
import { useProductDetail } from '../context/ProductDetailContext';
import { customerApi } from '../services/customerApi';
import { useSettings } from '@core/context/SettingsContext';
import { useCartAnimation } from '../context/CartAnimationContext';
import Lottie from 'lottie-react';
import noServiceAnimation from '@/assets/lottie/animation.json';
import { getCategoryLocation } from '../utils/categoryNavigation';
import { useLocation as useAppLocation } from '../context/LocationContext';

const MANUAL_SUBCAT_ORDER = [
  "Vegetables",
  "Fresh Fruits",
  "Rice, Dals & Atta",
  "Masala, Oil & Ghee",
  "Frozen Food",
  "Milk, Bakery & Eggs",
  "Biscuits & Cookies",
  "Cereals & Nuts",
  "Dry Fruits",
  "Sweets",
  "Puja Samagri",
  "Kitchen Tools & Appliances"
];

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
    const isShopClosed = product.sellerIsOpen === false;

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPct = hasDiscount
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const handleCardClick = (e) => {
        if (isShopClosed) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (openProduct) { e.preventDefault(); openProduct(product); }
    };

    const handleAdd = async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (isShopClosed) return;
        const success = await addToCart({ ...product });
        if (success && imageRef.current) {
            animateAddToCart(imageRef.current.getBoundingClientRect(), product.image || product.mainImage);
        }
    };

    const handleInc = (e) => {
        e.preventDefault(); e.stopPropagation();
        updateQuantity(productId, 1);
    };

    const handleDec = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (quantity === 1) {
            animateRemoveFromCart(product.image || product.mainImage);
            removeFromCart(productId);
        } else {
            updateQuantity(productId, -1);
        }
    };

    return (
        <motion.div
            whileTap={{ scale: isShopClosed ? 1 : 0.98 }}
            onClick={handleCardClick}
            className={cn(
                "flex flex-col bg-white overflow-hidden relative pb-4 border-b border-r border-[#f1f3f6]",
                isShopClosed ? "grayscale cursor-not-allowed" : "cursor-pointer"
            )}
        >
            {/* Shop Closed overlay badge */}
            {isShopClosed && (
                <div className="absolute inset-x-0 top-1/3 z-30 flex justify-center">
                    <span className="bg-black/70 text-white text-[8px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                        Shop Closed
                    </span>
                </div>
            )}
            {/* Image Box Container */}
            <div className="relative w-full pt-[100%] bg-white group">
                {/* Heart Icon top right */}
                <button 
                    onClick={(e) => { e.stopPropagation(); /* handle wishlist */ }}
                    className="absolute top-2 right-2 z-10 text-gray-300 hover:text-red-500 transition-colors"
                >
                    <Heart size={16} />
                </button>
                
                {/* Discount / Bestseller Tag top left */}
                {product.bestseller && (
                    <div className="absolute top-0 left-0 bg-black text-white text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-br-md z-10 tracking-widest shadow-sm">
                        Bestseller
                    </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center p-3">
                    <img
                        ref={imageRef}
                        src={product.image || product.mainImage}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                </div>

                {/* ADD Button slightly overlapping image bottom right */}
                <div className="absolute -bottom-3 right-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-[6px] bg-white border border-[#e0e0e0] z-20">
                    {!isShopClosed && quantity > 0 ? (
                        <div className="flex items-center h-[28px]" style={{ minWidth: '64px' }}>
                            <button
                                onClick={handleDec}
                                className="px-2 h-full text-[#333] active:bg-gray-100 transition-colors rounded-l-[6px] border-r border-gray-100"
                            >
                                <Minus size={12} strokeWidth={2.5} />
                            </button>
                            <span className="text-[12px] font-black text-[#1A1A1A] px-2 flex-1 text-center bg-[#F8F9FA]">{quantity}</span>
                            <button
                                onClick={handleInc}
                                className="px-2 h-full text-[#333] active:bg-gray-100 transition-colors rounded-r-[6px] border-l border-gray-100"
                            >
                                <Plus size={12} strokeWidth={2.5} />
                            </button>
                        </div>
                    ) : (
                        <motion.button
                            whileTap={{ scale: isShopClosed ? 1 : 0.92 }}
                            onClick={handleAdd}
                            disabled={isShopClosed}
                            className={cn(
                                "text-[11px] font-black tracking-wide text-[#1A1A1A] h-[28px] px-4 hover:bg-gray-50 transition-all uppercase rounded-[6px]",
                                isShopClosed && "opacity-40"
                            )}
                        >
                            ADD
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="px-2.5 pt-5 flex flex-col gap-0.5 bg-white h-full relative z-10">
                <div className="flex">
                    <span className="text-[9px] font-bold text-[#444] bg-[#F1F3F6] px-1.5 py-0.5 rounded mb-1 border border-[#EBEBEB]">
                        {product.weight || '1 unit'}
                    </span>
                </div>
                <p className="text-[13px] font-bold text-[#1a1a1a] leading-[1.25] line-clamp-2">
                    {product.name}
                </p>

                {/* Price Section */}
                <div className="flex flex-col mt-0.5 pb-1">
                    {hasDiscount && (
                        <span className="text-[10px] font-black text-[#0066FF] tracking-tight uppercase">
                            {discountPct}% OFF
                        </span>
                    )}
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-[14px] font-[900] tracking-tight text-[#111]">₹{product.price}</span>
                        {hasDiscount && (
                            <span className="text-[10px] font-semibold text-[#878787] line-through decoration-[#878787]/50">
                                MRP ₹{product.originalPrice}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

/* ─── Empty State Component ─────────────────────────────────────────────── */
const EmptyCategoryView = ({ categoryName }) => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in duration-700 bg-white min-h-[70vh]">
            {/* Coming Soon UI - Premium Look */}
            <div className="relative mb-8">
                <div className="h-40 w-40 bg-indigo-50 rounded-[40px] flex items-center justify-center relative overflow-hidden shadow-2xl shadow-indigo-100/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
                    <motion.div 
                        animate={{ 
                            y: [0, -10, 0],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                            duration: 4, 
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="relative z-10"
                    >
                        <div className="h-20 w-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <Search size={40} className="text-white" strokeWidth={2.5} />
                        </div>
                    </motion.div>
                    
                    {/* Floating Decorative Elements */}
                    <div className="absolute top-4 right-4 h-3 w-3 bg-yellow-400 rounded-full blur-[1px]" />
                    <div className="absolute bottom-8 left-6 h-2 w-2 bg-indigo-300 rounded-full" />
                </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full mb-6">
                <span className="h-2 w-2 bg-indigo-600 rounded-full animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">Stay Tuned</span>
            </div>

            <h3 className="text-[32px] font-black text-slate-900 leading-tight mb-4 tracking-tighter">
                COMING <span className="text-indigo-600">SOON</span>
            </h3>

            <p className="text-sm font-medium text-slate-500 leading-relaxed mb-10 max-w-[280px] mx-auto">
                Our awesome products for <span className="text-slate-900 font-bold">"{categoryName}"</span> are almost ready. Prepare to discover the best items very soon!
            </p>

            <div className="w-full flex flex-col gap-3 max-w-[280px] mx-auto">
                <button 
                    onClick={() => navigate(getCategoryLocation('all'))}
                    className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                            <LayoutGrid size={20} className="text-slate-400 group-hover:text-indigo-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-black text-slate-800">Keep Exploring</p>
                            <p className="text-[10px] font-bold text-slate-400">Browse other categories</p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                </button>

                <button 
                    onClick={() => navigate('/')}
                    className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                            <Search size={20} className="text-slate-400 group-hover:text-emerald-600" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-black text-slate-800">Search Items</p>
                            <p className="text-[10px] font-bold text-slate-400">Find exactly what you need</p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                </button>
            </div>
            

        </div>
    );
};

/* ─── Page ───────────────────────────────────────────────────────────────── */
const CategoryProductsPage = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { settings } = useSettings();
    const { currentLocation } = useAppLocation();
    const finalCategoryId = location.state?.selectedCategory || categoryId;
    const { isOpen: isProductDetailOpen } = useProductDetail();
    // Always default to 'all' so users immediately see products when opening a category
    const [selectedSubCategory, setSelectedSubCategory] = useState('all');
    const [category, setCategory] = useState(null);
    const [subCategories, setSubCategories] = useState([{ id: 'all', name: 'All' }]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMetaLoading, setIsMetaLoading] = useState(true);

    // Fetch ALL products for this category at once. Subcategory filtering is done
    // client-side so switching tabs never triggers a new API call and the page
    // always loads with products visible on the "All" tab.
    useEffect(() => {
        if (!finalCategoryId) return;

        // Don't fetch until we have coordinates, otherwise backend returns empty/400
        if (!currentLocation?.latitude || !currentLocation?.longitude) {
            setIsLoading(true);
            return;
        }

        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const res = await customerApi.getProducts({
                    categoryId: finalCategoryId,
                    limit: 100,
                    lat: currentLocation.latitude,
                    lng: currentLocation.longitude
                });
                if (res.data.success) {
                    const items = res.data.result?.items || res.data.results || [];
                    setProducts(Array.isArray(items) ? items : []);
                } else {
                    setProducts([]);
                }
            } catch (error) {
                console.error("Error fetching products:", error);
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    // NOTE: selectedSubCategory is intentionally NOT a dep — filtering is client-side
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finalCategoryId, currentLocation?.latitude, currentLocation?.longitude]);

    useEffect(() => {
        if (!finalCategoryId) return;

        const fetchCategoryMeta = async () => {
            setIsMetaLoading(true);
            try {
                // Fetch FULL unfiltered tree to reliably find the current category.
                const catRes = await customerApi.getCategories({ tree: true });
                if (!catRes.data.success) return;

                const tree = catRes.data.results || catRes.data.result || [];
                let currentCat = null;
                for (const header of tree) {
                    const found = (header.children || []).find((c) => String(c._id) === String(finalCategoryId));
                    if (found) {
                        currentCat = found;
                        break;
                    }
                }

                if (!currentCat) {
                    setIsMetaLoading(false);
                    return;
                }

                setCategory(currentCat);

                // All subcategories from the tree (sorted), shown initially
                const subs = (currentCat.children || [])
                    .sort((a, b) => {
                        const idxA = MANUAL_SUBCAT_ORDER.indexOf(a.name);
                        const idxB = MANUAL_SUBCAT_ORDER.indexOf(b.name);
                        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                        if (idxA !== -1) return -1;
                        if (idxB !== -1) return 1;
                        return new Date(a.createdAt) - new Date(b.createdAt);
                    })
                    .map((s) => ({
                        id: String(s._id),
                        name: s.name,
                        image: s.image || s.mainImage || "https://cdn-icons-png.flaticon.com/128/2321/2321831.png",
                    }));

                setSubCategories([
                    {
                        id: 'all',
                        name: 'All',
                        image: currentCat.image || currentCat.mainImage || "https://cdn-icons-png.flaticon.com/128/1040/1040230.png",
                    },
                    ...subs,
                ]);
            } catch (error) {
                console.error("Error fetching category metadata:", error);
            } finally {
                setIsMetaLoading(false);
            }
        };

        fetchCategoryMeta();
    }, [finalCategoryId]);

    const safeProducts = Array.isArray(products) ? products : [];

    // Client-side subcategory filter
    const filteredProducts = safeProducts.filter(p =>
        selectedSubCategory === 'all' ||
        String(p.subcategoryId?._id || p.subcategoryId) === String(selectedSubCategory)
    );

    // Derive which subcategory IDs actually have products, so we can hide empty ones
    const subcatsWithProducts = new Set(
        safeProducts.map(p => String(p.subcategoryId?._id || p.subcategoryId)).filter(id => id && id !== 'undefined')
    );

    // Sidebar: always show 'All', hide subcategories with no products
    const visibleSubCategories = (isLoading || isMetaLoading)
        ? subCategories
        : subCategories.filter(cat => cat.id === 'all' || subcatsWithProducts.has(String(cat.id)));

    return (
        <div className="flex flex-col min-h-[100dvh] bg-white w-full mx-auto relative overflow-hidden" style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}>
            {/* Top Toolbar App Bar */}
            <header className={cn(
                "sticky top-0 z-50 bg-white border-b border-[#EAEAEA] px-3 py-3 flex items-center justify-between",
                isProductDetailOpen && "hidden md:flex"
            )}>
                <div className="flex items-center gap-3 w-full">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                    >
                        <ChevronLeft size={24} className="text-[#1A1A1A] stroke-[2.5px]" />
                    </button>
                    <h1 className="text-[16px] font-[900] text-[#1A1A1A] tracking-[-0.02em] truncate flex-1">
                        {category?.name || "Products"}
                    </h1>
                    <button onClick={() => navigate('/search')} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 text-[#1A1A1A]">
                        <Search size={22} className="stroke-[2px]" />
                    </button>
                </div>
            </header>

            {/* Split Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Left Sidebar (Subcategories) */}
                {visibleSubCategories.length > 0 && (
                    <div className="w-[84px] bg-[#FFFFFF] border-r border-[#EAEAEA] overflow-y-auto hide-scrollbar pb-24 flex flex-col pt-1">
                        {visibleSubCategories.map((cat) => {
                            const isActive = selectedSubCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedSubCategory(cat.id)}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center py-[14px] px-1 transition-colors border-b border-[#F5F5F5] overflow-visible",
                                        isActive ? "bg-[#F3F7FA]" : "bg-white"
                                    )}
                                >
                                    {/* Active Black Border Left */}
                                    {isActive && (
                                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#1A1A1A] rounded-r-[4px]" />
                                    )}
                                    
                                    {/* Subcategory Icon/Image */}
                                    <div className="w-[46px] h-[46px] mb-2 flex items-center justify-center overflow-hidden">
                                        <img 
                                            src={cat.image} 
                                            alt={cat.name} 
                                            className={cn(
                                                "w-full h-full object-contain mix-blend-multiply transition-transform duration-300",
                                                isActive ? "scale-110 drop-shadow-sm" : "opacity-80"
                                            )} 
                                        />
                                    </div>
                                    
                                    {/* Subcategory Label */}
                                    <span className={cn(
                                        "text-[10px] text-center leading-[1.1] max-w-[70px] uppercase tracking-wide",
                                        isActive ? "font-[900] text-[#111]" : "font-bold text-[#777]"
                                    )}>
                                        {cat.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Right Content Area (Products Grid) */}
                <div className="flex-1 bg-[#F9F9F9] overflow-y-auto hide-scrollbar relative">
                    {isLoading ? (
                        /* Skeleton loader */
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-0">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex flex-col bg-white border-b border-r border-[#EAEAEA] p-3 pt-6 animate-pulse">
                                    <div className="w-full aspect-square bg-[#F5F5F5] rounded-xl mb-3" />
                                    <div className="h-2.5 bg-[#EAEAEA] rounded w-2/3 mb-2" />
                                    <div className="h-3 bg-[#EAEAEA] rounded w-full mb-3" />
                                    <div className="flex items-center justify-between">
                                        <div className="h-4 bg-[#EAEAEA] rounded w-1/3" />
                                        <div className="h-6 bg-[#EAEAEA] rounded w-12" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <EmptyCategoryView categoryName={subCategories.find(c => c.id === selectedSubCategory)?.name || 'this category'} />
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pb-[120px] bg-white">
                            {filteredProducts.map((product) => (
                                <KuikloCard key={product.id || product._id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap');
                    .hide-scrollbar::-webkit-scrollbar { display: none; }
                    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}} />
        </div>
    );
};

export default CategoryProductsPage;


