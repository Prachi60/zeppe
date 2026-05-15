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
    const isShopClosed = product.sellerIsOpen === false;

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
        if (isShopClosed) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (openProduct) {
          e.preventDefault();
          openProduct(product);
        }
      },
      [openProduct, product, isShopClosed],
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
      async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isShopClosed) {
          showToast("This shop is currently closed. Please check back later.", "error");
          return;
        }

        const success = await addToCart({
          ...product,
          variantSku: variantKey,
          variantName: defaultVariant?.name || "",
        });

        if (success && imageRef.current) {
          animateAddToCart(
            imageRef.current.getBoundingClientRect(),
            product.image || product.mainImage,
          );
        }
      },
      [animateAddToCart, product, addToCart, variantKey, defaultVariant?.name, isShopClosed, showToast],
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
          animateRemoveFromCart(product.image || product.mainImage);
          removeFromCart(productId, variantKey);
        } else {
          updateQuantity(productId, -1, variantKey);
        }
      },
      [
        quantity,
        animateRemoveFromCart,
        product.image,
        product.mainImage,
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
            "group relative flex flex-col w-full max-w-[110px] h-full bg-white rounded-xl overflow-hidden transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-gray-100",
            isShopClosed && "grayscale cursor-not-allowed",
            className
          )}
          onClick={handleProductClick}
        >
          {/* Shop Closed overlay badge */}
          {isShopClosed && (
            <div className="absolute inset-x-0 top-1/3 z-30 flex justify-center">
              <span className="bg-black/70 text-white text-[8px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                Shop Closed
              </span>
            </div>
          )}
          {/* Top Section: Image + Badge + Floating ADD */}
          <div className="relative aspect-square w-full p-1 bg-[#f2f2f2] overflow-visible">
            {/* Discount Badge - Orange with White Gradient */}
            {product.originalPrice > product.price && (
              <div className="absolute top-0 left-0 z-10 bg-[#f59931] text-white text-[9px] font-bold px-2 py-0.5 rounded-br-lg shadow-sm">
                <span className="relative z-10">{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF</span>
              </div>
            )}

            {/* Wishlist Heart */}
            <button
              onClick={toggleWishlist}
              className="absolute top-0 right-0 z-10 p-1.5 rounded-bl-xl bg-white/90 backdrop-blur-sm shadow-sm active:scale-90 hover:bg-white transition-colors"
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
                src={product.image || product.mainImage}
                alt={product.name}
                className="w-[80%] h-[80%] object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            {/* Floating ADD Button */}
            <div className="absolute bottom-0 right-0 z-20">
              {!isShopClosed && quantity > 0 ? (
                <div className="flex items-center bg-[#f59931] text-white rounded-xl h-8 min-w-[70px] shadow-lg overflow-hidden">
                  <button onClick={handleDecrement} className="px-2 py-1 text-white hover:bg-orange-600 transition-colors"><Minus size={11} strokeWidth={3} /></button>
                  <span className="flex-1 text-center text-[13px] font-bold text-white">{quantity}</span>
                  <button onClick={handleIncrement} className="px-2 py-1 text-white hover:bg-orange-600 transition-colors"><Plus size={11} strokeWidth={3} /></button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={isShopClosed}
                  className={cn(
                    "bg-white text-[#f59931] border-2 border-[#f59931] h-8 px-3.5 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center",
                    isShopClosed ? "opacity-40 cursor-not-allowed" : "hover:bg-[#f59931] hover:text-white"
                  )}
                >
                  Add
                </button>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex flex-col items-center flex-1 p-1 gap-0.5 text-center">
            {/* Product Name */}
            <h4 className="text-[10px] sm:text-[11px] font-bold text-gray-900 leading-tight line-clamp-2 h-[2.2rem] flex items-center justify-center">
              {product.name}
            </h4>
            
            {/* Product Weight */}
            <div className="bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5 select-none my-0.5 h-[1.3rem] flex items-center justify-center">
              <span className="text-[9px] font-extrabold text-slate-500 tracking-tight">
                {product.weight || "1 unit"}
              </span>
            </div>

            {/* Price Block */}
            <div className="flex items-baseline justify-center gap-1.5 h-[1.2rem]">
              <span className="text-[14px] font-semibold text-gray-900">₹{product.price}</span>
              {product.originalPrice > product.price && (
                <span className="text-[10px] font-medium text-gray-400 line-through">₹{product.originalPrice}</span>
              )}
            </div>

            {/* Ratings Row */}
            <div className="flex items-center justify-center gap-0.5 h-[1rem]">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  size={8} 
                  className={cn(
                    "transition-all",
                    star <= Math.round(product.ratings || 4.5) 
                      ? "text-yellow-400 fill-current" 
                      : "text-gray-200 fill-current"
                  )} 
                />
              ))}
              <span className="text-[9px] font-semibold text-gray-400 ml-1">({product.ratings || "4.5"})</span>
            </div>

            {/* Delivery Time Bar */}
            <div className="mt-1 flex items-center justify-center gap-1 bg-[#E8F3FF] rounded-md px-1.5 py-1 w-full">
              <Clock size={10} className="text-[#2563EB]" />
              <span className="text-[10px] font-bold text-[#2563EB] tracking-tight">
                {product.deliveryTime || "21 min"}
              </span>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        whileTap={{ scale: 0.97 }}
        className={cn(
          "group relative flex h-full w-full max-w-[110px] flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_12px_30_rgba(0,0,0,0.1)] hover:border-orange-100",
          isShopClosed && "grayscale cursor-not-allowed",
          className,
        )}
        onClick={handleProductClick}>
        {/* Shop Closed overlay badge */}
        {isShopClosed && (
          <div className="absolute inset-x-0 top-1/3 z-30 flex justify-center">
            <span className="bg-black/70 text-white text-[8px] font-bold px-2 py-0.5 rounded-full tracking-wide">
              Shop Closed
            </span>
          </div>
        )}
        {/* Top Image Section */}
        <div
          className={cn(
            "relative",
            storeWide ? "p-3" : microCompact ? "p-1" : compact ? "p-1" : "p-3",
          )}>
          {/* Badge (Custom or Discount) - Orange with White Gradient */}
          {(badge ||
            product.discount ||
            product.originalPrice > product.price) && (
              <div
                className={cn(
                  "absolute z-10 bg-gradient-to-br from-[#f59931] via-[#d47a1c] to-[#b96815] text-white font-semibold rounded-br-xl shadow-lg tracking-wider flex items-center justify-center top-0 left-0 px-3 py-1 text-[11px] border-b border-r border-white/20",
                )}>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                <span className="relative z-10">
                  {badge ||
                    product.discount ||
                    `${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off`}
                </span>
              </div>
            )}

          <button
            onClick={toggleWishlist}
            className={cn(
              "absolute z-10 bg-white/90 backdrop-blur-sm rounded-bl-xl shadow-sm flex items-center justify-center cursor-pointer hover:bg-white transition-all active:scale-90",
              microCompact
                ? "top-0 right-0 h-6 w-6"
                : compact
                  ? "top-0 right-0 h-7 w-7"
                  : "top-0 right-0 h-9 w-9",
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
              "block w-full overflow-hidden bg-[#f2f2f2] transition-all duration-500 group-hover:scale-[1.03] flex items-center justify-center",
              storeWide
                ? "h-32 rounded-xl p-2 sm:h-36"
                : microCompact
                  ? "aspect-square p-0.5"
                  : "aspect-square p-1",
            )}>
            <img
              ref={imageRef}
              src={product.image || product.mainImage}
              alt={product.name}
              className={cn(
                "object-contain drop-shadow-md",
                compact ? "w-[80%] h-[80%]" : "w-[85%] h-[85%]"
              )}
            />
          </div>
        </div>

        {/* Info Section */}
        <div
          className={cn(
            "flex flex-col items-center flex-1 text-center",
            storeWide
              ? "p-3 pt-2 gap-1.5"
              : microCompact
                ? "p-1 pt-0.5 gap-0.5"
                : compact
                  ? "p-1 pt-0.5 gap-0.5"
                  : "p-4 pt-2 gap-1.5",
          )}>
          {/* Product Name */}
          <div
            className={cn(
              storeWide ? "h-[2rem]" : microCompact ? "h-[1.8rem]" : compact ? "h-[1.9rem]" : "h-[2.4rem]",
              "flex items-center justify-center"
            )}>
            <h4
              className={cn(
                "font-semibold text-gray-900 leading-tight line-clamp-2",
                storeWide
                  ? "text-sm"
                  : microCompact
                    ? "text-[11px]"
                    : compact
                      ? "text-[10.5px]"
                      : "text-[15px]",
              )}>
              {product.name}
            </h4>
          </div>

          {/* Product Weight */}
          <div className="bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5 select-none my-0.5 h-[1.3rem] flex items-center justify-center">
            <span className="text-[10px] font-extrabold text-slate-500 tracking-tight">
              {product.weight || "1 unit"}
            </span>
          </div>

          {/* Price Block */}
          <div className="flex flex-col items-center gap-0.5 h-[2rem] justify-center">
            <span className={cn(
              "font-semibold text-gray-900 leading-none",
              compact ? "text-sm" : "text-base"
            )}>
              ₹{product.price}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-[10px] font-medium text-gray-400 line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center justify-center gap-0.5 bg-green-50 w-fit mx-auto px-1.5 py-0.5 rounded-md mt-1">
            <Star size={8} className="text-green-600 fill-current" />
            <span className="text-[8px] font-semibold text-green-700">{product.ratings || "4.5"}</span>
          </div>

          {/* Delivery Time */}
          <div className="mt-auto flex items-center justify-center gap-1 border-t border-gray-50 pt-1 w-full">
            <div className="flex items-center justify-center gap-1 text-orange-600">
              <div className="flex items-center justify-center h-3.5 w-3.5 bg-orange-50 rounded-full">
                <Clock
                  size={storeWide ? 10 : microCompact ? 7 : compact ? 9 : 11}
                  className="text-orange-500"
                />
              </div>
              <span
                className={cn(
                  "font-semibold tracking-tighter",
                  storeWide
                    ? "text-[9px]"
                    : microCompact
                      ? "text-[7px]"
                      : compact
                        ? "text-[9.5px]"
                        : "text-[10px]",
                )}>
                {product.deliveryTime || "8-12 mins"}
              </span>
            </div>
          </div>

          {/* ADD Button - Absolute Corner */}
          <div className="absolute bottom-0 right-0 z-20">
            {!isShopClosed && quantity > 0 ? (
              <div
                className={cn(
                  "flex items-center bg-[#f59931] text-white rounded-tl-xl p-0.5 justify-between shadow-md",
                  storeWide ? "min-w-[84px]" : compact ? "min-w-[64px]" : "min-w-[90px]",
                )}>
                <button
                  onClick={handleDecrement}
                  className="p-1 px-1.5 text-white active:scale-90 transition-transform">
                  <Minus size={16} strokeWidth={3} />
                </button>
                <span className="text-[15px] font-black text-white min-w-[24px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="p-1 px-1.5 text-white active:scale-90 transition-transform">
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: isShopClosed ? 1 : 0.95 }}
                onClick={handleAddToCart}
                disabled={isShopClosed}
                className={cn(
                  "bg-white text-[#f59931] border-2 border-[#f59931] rounded-tl-xl font-bold shadow-md transition-all flex items-center justify-center",
                  compact ? "h-7 px-2.5 text-xs" : "h-8 px-3.5 text-xs",
                  isShopClosed && "opacity-40 cursor-not-allowed"
                )}>
                Add
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  },
);

export default ProductCard;

