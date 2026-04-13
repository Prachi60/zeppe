import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, Search, Heart } from 'lucide-react';
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
            whileTap={{ scale: 0.98 }}
            onClick={handleCardClick}
            className="flex flex-col cursor-pointer bg-white overflow-hidden relative pb-4 border-b border-r border-[#f1f3f6]"
        >
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
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                </div>

                {/* ADD Button slightly overlapping image bottom right */}
                <div className="absolute -bottom-3 right-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-[6px] bg-white border border-[#e0e0e0] z-20">
                    {quantity > 0 ? (
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
                            whileTap={{ scale: 0.92 }}
                            onClick={handleAdd}
                            className="text-[11px] font-black tracking-wide text-[#1A1A1A] h-[28px] px-4 hover:bg-gray-50 transition-all uppercase rounded-[6px]"
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
                        image: s.image || s.mainImage || "https://cdn-icons-png.flaticon.com/128/2321/2321831.png"
                    }));
                    
                    // Assign generic category image for 'All'
                    setSubCategories([{ 
                        id: 'all', 
                        name: 'All', 
                        image: currentCat.image || currentCat.mainImage || "https://cdn-icons-png.flaticon.com/128/1040/1040230.png"
                    }, ...subs]);
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
                {subCategories.length > 0 && (
                    <div className="w-[84px] bg-[#FFFFFF] border-r border-[#EAEAEA] overflow-y-auto hide-scrollbar pb-24 flex flex-col pt-1">
                        {subCategories.map((cat) => {
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
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center mt-10">
                            <h3 className="text-lg font-black text-[#1A1A1A] tracking-tighter mb-2">
                                No Products Found
                            </h3>
                            <p className="text-[#888] font-bold text-xs mt-2 leading-relaxed">
                                No items available in "{subCategories.find(c => c.id === selectedSubCategory)?.name || 'this category'}" right now.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 pb-[120px] bg-white">
                            {filteredProducts.map((product) => (
                                <KuikloCard key={product.id || product._id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <MiniCart />
            <ProductDetailSheet />

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


