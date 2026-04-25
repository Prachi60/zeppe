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
            "group flex flex-col w-full h-full bg-white rounded-xl overflow-hidden transition-all duration-200",
            className
          )}
          onClick={handleProductClick}
        >
          {/* Top Section: Image + Wishlist + Floating ADD */}
          <div className="relative aspect-[1/1.1] w-full p-1.5 sm:p-2 bg-gray-50/50 rounded-xl">
            {/* Discount Badge */}
            {product.originalPrice > product.price && (
              <div className="absolute top-0 left-0 z-10 bg-[#2563eb] text-white text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-br-lg shadow-sm">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
              </div>
            )}

            {/* Wishlist Heart */}
            <button
              onClick={toggleWishlist}
              className="absolute top-1 right-1 z-10 p-1 rounded-full bg-white/80 shadow-sm active:scale-90"
            >
              <Heart
                size={12}
                className={cn(isWishlisted ? "text-red-500 fill-current" : "text-gray-400")}
              />
            </button>

            {/* Product Image */}
            <div className="w-full h-full flex items-center justify-center mix-blend-multiply">
              <img
                ref={imageRef}
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain drop-shadow-sm transition-transform group-hover:scale-105"
              />
            </div>

            {/* Floating ADD Button - Overlapping Image Bottom Right */}
            <div className="absolute -bottom-1 -right-1 z-20">
              {quantity > 0 ? (
                <div className="flex items-center bg-white border border-gray-200 rounded-lg h-7 min-w-[60px] shadow-md overflow-hidden">
                  <button onClick={handleDecrement} className="px-1.5 py-1 text-gray-500 hover:bg-gray-50"><Minus size={10} strokeWidth={3} /></button>
                  <span className="text-[11px] font-bold text-gray-800 flex-1 text-center">{quantity}</span>
                  <button onClick={handleIncrement} className="px-1.5 py-1 text-gray-500 hover:bg-gray-50"><Plus size={10} strokeWidth={3} /></button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="bg-white text-black border border-gray-200 text-[10px] font-bold px-3 h-7 rounded-lg shadow-md hover:bg-gray-50 active:scale-95 transition-all"
                >
                  ADD
                </button>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex flex-col flex-1 p-1.5 sm:p-2 gap-0.5">
            {/* Weight/Unit */}
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 border border-gray-300 rounded-full flex items-center justify-center">
                <div className="h-1 w-1 bg-gray-400 rounded-full" />
              </div>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">
                {product.weight || "1 unit"}
              </span>
            </div>

            {/* Product Name */}
            <h4 className="text-[11px] sm:text-[12px] font-bold text-gray-800 leading-[1.2] line-clamp-2 min-h-[1.5rem] sm:min-h-[1.8rem]">
              {product.name}
            </h4>

            {/* Price Block */}
            <div className="mt-auto pt-1">
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-[13px] sm:text-[14px] font-[900] text-gray-900">₹{product.price}</span>
                {product.originalPrice > product.price && (
                  <span className="text-[10px] font-medium text-gray-400 line-through">₹{product.originalPrice}</span>
                )}
              </div>
              {/* Optional: Delivery Time in tiny text */}
              <div className="flex items-center gap-1 text-[8px] text-gray-400 font-medium">
                <Clock size={8} /> <span>{product.deliveryTime || "8-12 mins"}</span>
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
          "group flex h-full w-full flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100/60 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:border-[#9edcf3] hover:bg-[#f7fcff] hover:shadow-[0_10px_26_rgba(69,176,226,0.14)] focus-within:border-[#74c8ea] focus-within:bg-[#f7fcff]",
          className,
        )}
        onClick={handleProductClick}>
        {/* Top Image Section */}
        <div
          className={cn(
            "relative pb-0",
            storeWide ? "p-3" : microCompact ? "p-1.5" : compact ? "p-2" : "p-3",
          )}>
          {/* Badge (Custom or Discount) */}
          {(badge ||
            product.discount ||
            product.originalPrice > product.price) && (
              <div
                className={cn(
                  "absolute z-10 bg-black text-white font-bold rounded-full shadow-sm uppercase tracking-wider flex items-center justify-center top-2 left-2 px-2 py-1 text-[9px]",
                )}>
                {badge ||
                  product.discount ||
                  `${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF`}
              </div>
            )}

          <button
            onClick={toggleWishlist}
            className={cn(
              "absolute z-10 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-white transition-all active:scale-90",
              microCompact
                ? "top-1.5 right-1.5 h-5 w-5"
                : compact
                  ? "top-2 right-2 h-7 w-7"
                  : "top-3 right-3 h-8 w-8",
            )}>
            <motion.div
              whileTap={{ scale: 0.8 }}
              animate={isWishlisted ? { scale: [1, 1.2, 1] } : {}}>
              <Heart
                size={microCompact ? 10 : compact ? 13 : 16}
                className={cn(
                  isWishlisted
                    ? "text-red-500 fill-current"
                    : "text-neutral-400",
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
              "block w-full overflow-hidden rounded-lg bg-gray-50 transition-all duration-300 group-hover:scale-[1.02] group-hover:bg-[#f2faff] flex items-center justify-center",
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
              className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm"
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
          <div className="flex items-center gap-1.5 mb-0.5">
            <div
              className={cn(
                "border border-gray-400/30 rounded-full flex items-center justify-center",
                storeWide
                  ? "h-3 w-3"
                  : microCompact
                    ? "h-2 w-2"
                    : compact
                      ? "h-2.5 w-2.5"
                      : "h-3.5 w-3.5",
              )}>
              <div
                className={cn(
                  "bg-gray-400 rounded-full",
                  storeWide
                    ? "h-1 w-1"
                    : microCompact
                      ? "h-0.5 w-0.5"
                      : compact
                        ? "h-1 w-1"
                        : "h-1.5 w-1.5",
                )}
              />
            </div>
            <div
              className={cn(
                "bg-gray-100 text-gray-500 font-semibold rounded px-1.5 py-0.5",
                storeWide
                  ? "text-[9px]"
                  : microCompact
                    ? "text-[7px]"
                    : compact
                      ? "text-[8px]"
                      : "text-[10px]",
              )}>
              {product.weight || "1 unit"}
            </div>
          </div>

          <div
            className={cn(
              storeWide ? "min-h-[2rem]" : microCompact ? "min-h-[1.9rem]" : "min-h-[2.4rem]",
            )}>
            <h4
              className={cn(
                "font-bold text-[#1A1A1A] leading-tight line-clamp-2",
                storeWide
                  ? "text-sm"
                  : microCompact
                    ? "text-[10px]"
                    : compact
                      ? "text-[13px]"
                      : "text-sm",
              )}>
              {product.name}
            </h4>
          </div>

          {/* Delivery Time & Unit info */}
          <div className="mb-2 flex items-center gap-1.5 text-gray-400">
            <Clock
              size={storeWide ? 11 : microCompact ? 8 : compact ? 10 : 12}
              className="text-gray-400/60"
            />
            <span
              className={cn(
                "font-medium",
                storeWide
                  ? "text-[10px]"
                  : microCompact
                    ? "text-[8px]"
                    : compact
                      ? "text-[9px]"
                      : "text-[11px]",
              )}>
              {product.deliveryTime || "8-12 mins"}
            </span>
          </div>

          {/* Price Row / ADD Button Combination */}
          <div className="mt-auto flex items-center justify-between gap-1.5">
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-[#1A1A1A] leading-none">
                ₹{product.price}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-[11px] font-medium text-gray-400 line-through mt-0.5">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            {/* ADD Button / Quantity Selector */}
            <div className="flex">
              {quantity > 0 ? (
                <div
                  className={cn(
                    "flex items-center bg-white border border-gray-400 rounded-lg p-0.5 justify-between shadow-sm",
                    storeWide ? "min-w-[84px]" : compact ? "min-w-[64px]" : "min-w-[90px]",
                  )}>
                  <button
                    onClick={handleDecrement}
                    className="p-1 px-1.5 text-gray-600 active:scale-90 transition-transform">
                    <Minus size={storeWide ? 13 : compact ? 12 : 14} strokeWidth={3} />
                  </button>
                  <span
                    className={cn(
                      "font-bold text-gray-700",
                      storeWide ? "text-sm" : compact ? "text-xs" : "text-sm",
                    )}>
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    className="p-1 px-1.5 text-gray-600 active:scale-90 transition-transform">
                    <Plus size={storeWide ? 13 : compact ? 12 : 14} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddToCart}
                  className={cn(
                    "bg-black text-white rounded-full font-bold transition-all",
                    storeWide
                      ? "px-4 py-1.5 text-[10px]"
                      :
                      compact
                        ? "px-4 py-1.5 text-[10px]"
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

