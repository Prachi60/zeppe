import React from "react";
import { Link } from "react-router-dom";
import { Heart, Plus, Minus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "@shared/components/ui/Toast";
import { useCartAnimation } from "../../context/CartAnimationContext";

import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";

import { useProductDetail } from "../../context/ProductDetailContext";

const ProductCard = React.memo(
  ({
    product,
    badge,
    className,
    compact = false,
    microCompact = false,
    neutralBg = false,
    storeWide = false,
    quickComm = false,
  }) => {
    const { toggleWishlist: toggleWishlistGlobal, isInWishlist } =
      useWishlist();
    const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
    const { showToast } = useToast();
    const { animateAddToCart, animateRemoveFromCart } = useCartAnimation();

    const { openProduct } = useProductDetail();
    const [showHeartPopup, setShowHeartPopup] = React.useState(false);

    const imageRef = React.useRef(null);

    const defaultVariant = React.useMemo(() => {
      const variants = Array.isArray(product?.variants) ? product.variants : [];
      if (variants.length === 0) return null;

      const displayed = Number(product?.price || 0);
      const displayedOriginal = Number(product?.originalPrice || 0);

      const matchesDisplayedPrice = (variant) => {
        const mrp = Number(variant?.price || 0);
        const sale = Number(variant?.salePrice || 0);
        const effective = sale > 0 && sale < mrp ? sale : mrp;

        if (Number.isFinite(displayedOriginal) && displayedOriginal > displayed) {
          // Try to match both (sale + original) when card shows a discount.
          if (effective === displayed && (mrp === displayedOriginal || displayedOriginal === 0)) {
            return true;
          }
        }

        return effective === displayed || mrp === displayed;
      };

      const picked = variants.find(matchesDisplayedPrice) || variants[0];
      const key = String(picked?.sku || picked?.name || "").trim();
      return {
        key,
        name: String(picked?.name || "").trim(),
      };
    }, [product]);

    const productId = product.id || product._id;
    const variantKey = String(defaultVariant?.key || "").trim();
    const cartKey = `${productId}::${variantKey || ""}`;

    const cartItem = React.useMemo(
      () =>
        cart.find(
          (item) =>
            `${item.id || item._id}::${String(item.variantSku || "").trim()}` ===
            cartKey,
        ),
      [cart, cartKey],
    );
    const quantity = cartItem ? cartItem.quantity : 0;
    const isWishlisted = isInWishlist(product.id || product._id);

    const handleProductClick = React.useCallback(
      (e) => {
        if (openProduct) {
          e.preventDefault();
          openProduct(product);
        }
      },
      [openProduct, product],
    );

    const toggleWishlist = React.useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isWishlisted) {
          setShowHeartPopup(true);
          setTimeout(() => setShowHeartPopup(false), 1000);
        }

        toggleWishlistGlobal(product);
        showToast(
          isWishlisted
            ? `${product.name} removed from wishlist`
            : `${product.name} added to wishlist`,
          isWishlisted ? "info" : "success",
        );
      },
      [isWishlisted, toggleWishlistGlobal, product, showToast],
    );

    const handleAddToCart = React.useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (imageRef.current) {
          animateAddToCart(
            imageRef.current.getBoundingClientRect(),
            product.image,
          );
        }
        addToCart({
          ...product,
          variantSku: variantKey,
          variantName: defaultVariant?.name || "",
        });
      },
      [animateAddToCart, product, addToCart, variantKey, defaultVariant?.name],
    );

    const handleIncrement = React.useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        updateQuantity(productId, 1, variantKey);
      },
      [updateQuantity, productId, variantKey],
    );

    const handleDecrement = React.useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (quantity === 1) {
          animateRemoveFromCart(product.image);
          removeFromCart(productId, variantKey);
        } else {
          updateQuantity(productId, -1, variantKey);
        }
      },
      [
        quantity,
        animateRemoveFromCart,
        product.image,
        removeFromCart,
        productId,
        updateQuantity,
        variantKey,
      ],
    );

    if (quickComm) {
      return (
        <motion.div
          whileTap={{ scale: 0.98 }}
          className={cn(
            "group flex flex-col w-full h-full bg-white rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-gray-100",
            className
          )}
          onClick={handleProductClick}
        >
          {/* Top Section: Image + Badge + Floating ADD */}
          <div className="relative aspect-square w-full p-2 sm:p-3 bg-[#f8f9fa] overflow-visible">
            {/* Discount Badge - Orange with White Gradient */}
            {product.originalPrice > product.price && (
              <div className="absolute top-0 left-0 z-10 bg-gradient-to-br from-[#ff6b00] via-[#ff8c00] to-[#ff9f1c] text-white text-[10px] font-black px-2.5 py-1 rounded-br-xl shadow-lg border-b border-r border-white/20">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                <span className="relative z-10">{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF</span>
              </div>
            )}

            {/* Wishlist Heart */}
            <button
              onClick={toggleWishlist}
              className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm active:scale-90 hover:bg-white transition-colors"
            >
              <Heart
                size={14}
                className={cn(isWishlisted ? "text-red-500 fill-current" : "text-gray-400")}
              />
            </button>

            {/* Product Image */}
            <div className="w-full h-full flex items-center justify-center">
              <img
                ref={imageRef}
                src={product.image}
                alt={product.name}
                className="w-[85%] h-[85%] object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            {/* Floating ADD Button - Fixed Clipping & Orange Border */}
            <div className="absolute bottom-2 right-2 z-20">
              {quantity > 0 ? (
                <div className="flex items-center bg-white border-2 border-[#ff6b00] rounded-xl h-8 min-w-[70px] shadow-lg overflow-hidden">
                  <button onClick={handleDecrement} className="px-2 py-1 text-[#ff6b00] hover:bg-orange-50 transition-colors"><Minus size={11} strokeWidth={3} /></button>
                  <span className="text-xs font-black text-gray-900 flex-1 text-center">{quantity}</span>
                  <button onClick={handleIncrement} className="px-2 py-1 text-[#ff6b00] hover:bg-orange-50 transition-colors"><Plus size={11} strokeWidth={3} /></button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="bg-white text-[#ff6b00] border-2 border-[#ff6b00] text-[11px] font-black px-4 h-8 rounded-xl shadow-lg hover:bg-[#ff6b00] hover:text-white transition-all active:scale-95 flex items-center justify-center tracking-tight"
                >
                  ADD
                </button>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex flex-col flex-1 p-3 gap-1">
            {/* Ratings & Weight Row */}
            <div className="flex items-center justify-between mb-1">
              {/* Ratings */}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={10} 
                    className={cn(
                      "transition-all",
                      star <= Math.round(product.ratings || 4.5) 
                        ? "text-yellow-400 fill-current" 
                        : "text-gray-200 fill-current"
                    )} 
                  />
                ))}
                <span className="text-[10px] font-black text-gray-400 ml-1">({product.ratings || "4.5"})</span>
              </div>
              
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 border-[1.5px] border-gray-400 rounded-full flex items-center justify-center">
                  <div className="h-0.5 w-0.5 bg-gray-500 rounded-full" />
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                  {product.weight || "1 unit"}
                </span>
              </div>
            </div>

            {/* Product Name */}
            <h4 className="text-[12px] sm:text-[13px] font-bold text-gray-900 leading-tight line-clamp-2 min-h-[2.2rem]">
              {product.name}
            </h4>

            {/* Price & Delivery Block */}
            <div className="mt-auto pt-2 border-t border-gray-50 flex flex-col gap-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[16px] font-black text-gray-900">₹{product.price}</span>
                {product.originalPrice > product.price && (
                  <span className="text-[11px] font-bold text-gray-400 line-through">₹{product.originalPrice}</span>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="flex items-center justify-center h-4 w-4 bg-orange-50 rounded-full">
                    <Clock size={10} className="text-orange-500" />
                  </div>
                  <span className="text-[9px] font-black text-orange-600 uppercase tracking-tighter">
                    {product.deliveryTime || "8-15 mins"}
                  </span>
                </div>

                {product.originalPrice > product.price && (
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shadow-sm">
                    SAVE ₹{product.originalPrice - product.price}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        whileTap={{ scale: 0.97 }}
        className={cn(
          "group flex h-full w-full flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.1)] hover:border-orange-100",
          className,
        )}
        onClick={handleProductClick}>
        {/* Top Image Section */}
        <div
          className={cn(
            "relative",
            storeWide ? "p-3" : microCompact ? "p-1.5" : compact ? "p-2" : "p-3",
          )}>
          {/* Badge (Custom or Discount) - Orange with White Gradient */}
          {(badge ||
            product.discount ||
            product.originalPrice > product.price) && (
              <div
                className={cn(
                  "absolute z-10 bg-gradient-to-br from-[#ff6b00] via-[#ff8c00] to-[#ff9f1c] text-white font-black rounded-br-xl shadow-lg uppercase tracking-wider flex items-center justify-center top-0 left-0 px-3 py-1 text-[11px] border-b border-r border-white/20",
                )}>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                <span className="relative z-10">
                  {badge ||
                    product.discount ||
                    `${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF`}
                </span>
              </div>
            )}

          <button
            onClick={toggleWishlist}
            className={cn(
              "absolute z-10 bg-white/90 backdrop-blur-sm rounded-full shadow-sm flex items-center justify-center cursor-pointer hover:bg-white transition-all active:scale-90",
              microCompact
                ? "top-1.5 right-1.5 h-6 w-6"
                : compact
                  ? "top-2 right-2 h-7 w-7"
                  : "top-3 right-3 h-9 w-9",
            )}>
            <motion.div
              whileTap={{ scale: 0.8 }}
              animate={isWishlisted ? { scale: [1, 1.2, 1] } : {}}>
              <Heart
                size={microCompact ? 12 : compact ? 14 : 18}
                className={cn(
                  isWishlisted
                    ? "text-red-500 fill-current"
                    : "text-neutral-300",
                )}
              />
            </motion.div>
          </button>

          <AnimatePresence>
            {showHeartPopup && (
              <motion.div
                initial={{ scale: 0.5, opacity: 1, y: 0 }}
                animate={{ scale: 2, opacity: 0, y: -40 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute top-3 right-3 z-50 pointer-events-none text-red-500">
                <Heart size={24} fill="currentColor" />
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className={cn(
              "block w-full overflow-hidden rounded-xl bg-[#f8f9fa] transition-all duration-500 group-hover:scale-[1.03] flex items-center justify-center",
              storeWide
                ? "h-36 rounded-2xl p-2 sm:h-40"
                : microCompact
                  ? "aspect-square p-1.5"
                  : "aspect-square p-3",
            )}>
            <img
              ref={imageRef}
              src={product.image}
              alt={product.name}
              className="w-[85%] h-[85%] object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Info Section */}
        <div
          className={cn(
            "flex flex-col flex-1",
            storeWide
              ? "p-3 pt-2 gap-1.5"
              : microCompact
                ? "p-2 pt-0.5 gap-0.5"
                : compact
                  ? "p-3 pt-1 gap-1"
                  : "p-4 pt-2 gap-1.5",
          )}>
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 border-[1.5px] border-gray-400 rounded-full flex items-center justify-center">
                <div className="h-0.5 w-0.5 bg-gray-500 rounded-full" />
              </div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-tight">
                {product.weight || "1 unit"}
              </span>
            </div>
            
            <div className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded-md">
              <Star size={9} className="text-green-600 fill-current" />
              <span className="text-[10px] font-black text-green-700">{product.ratings || "4.5"}</span>
            </div>
          </div>

          <div
            className={cn(
              storeWide ? "min-h-[2rem]" : microCompact ? "min-h-[1.9rem]" : "min-h-[2.4rem]",
            )}>
            <h4
              className={cn(
                "font-bold text-gray-900 leading-tight line-clamp-2",
                storeWide
                  ? "text-sm"
                  : microCompact
                    ? "text-[11px]"
                    : compact
                      ? "text-[13px]"
                      : "text-[15px]",
              )}>
              {product.name}
            </h4>
          </div>

          {/* Delivery Time info */}
          <div className="flex items-center gap-1 text-orange-600 mb-2">
            <div className="flex items-center justify-center h-4 w-4 bg-orange-50 rounded-full">
              <Clock
                size={storeWide ? 10 : microCompact ? 8 : compact ? 9 : 11}
                className="text-orange-500"
              />
            </div>
            <span
              className={cn(
                "font-black uppercase tracking-tighter",
                storeWide
                  ? "text-[9px]"
                  : microCompact
                    ? "text-[7px]"
                    : compact
                      ? "text-[8px]"
                      : "text-[10px]",
              )}>
              {product.deliveryTime || "8-12 mins"}
            </span>
          </div>

          {/* Price Row / ADD Button Combination */}
          <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-gray-50 pt-2">
            <div className="flex flex-col">
              <span className="text-base font-black text-gray-900 leading-none">
                ₹{product.price}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-[11px] font-bold text-gray-400 line-through mt-0.5">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            {/* ADD Button / Quantity Selector */}
            <div className="flex">
              {quantity > 0 ? (
                <div
                  className={cn(
                    "flex items-center bg-white border-2 border-[#ff6b00] rounded-xl p-0.5 justify-between shadow-md",
                    storeWide ? "min-w-[84px]" : compact ? "min-w-[64px]" : "min-w-[90px]",
                  )}>
                  <button
                    onClick={handleDecrement}
                    className="p-1 px-1.5 text-[#ff6b00] active:scale-90 transition-transform">
                    <Minus size={storeWide ? 13 : compact ? 12 : 14} strokeWidth={3} />
                  </button>
                  <span
                    className={cn(
                      "font-black text-gray-900",
                      storeWide ? "text-sm" : compact ? "text-xs" : "text-sm",
                    )}>
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    className="p-1 px-1.5 text-[#ff6b00] active:scale-90 transition-transform">
                    <Plus size={storeWide ? 13 : compact ? 12 : 14} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddToCart}
                  className={cn(
                    "bg-white text-[#ff6b00] border-2 border-[#ff6b00] rounded-xl font-black shadow-md hover:bg-[#ff6b00] hover:text-white transition-all",
                    storeWide
                      ? "px-4 py-1.5 text-[10px]"
                      :
                      compact
                        ? "px-4 py-1.5 text-[11px]"
                        : "px-6 py-2 text-xs",
                  )}>
                  ADD
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  },
);

export default ProductCard;

