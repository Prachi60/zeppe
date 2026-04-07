import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import Lottie from "lottie-react";
import LocationDrawer from "./LocationDrawer";
import { useLocation } from "../../context/LocationContext";
import { useProductDetail } from "../../context/ProductDetailContext";
import { useSettings } from "@core/context/SettingsContext";
import { cn } from "@/lib/utils";
import {
  buildHeaderGradient,
  buildMiniCartColor,
  buildSearchBarBackgroundColor,
  shiftHex,
} from "../../utils/headerTheme";
import { HeaderCategoryVisual } from "@/shared/constants/headerCategoryVisuals";
import LogoImage from "../../../../assets/Logo.png";
import shoppingCartAnimation from "../../../../assets/lottie/shopping-cart.json";

// MUI Icons
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import MicIcon from "@mui/icons-material/Mic";
import ChevronDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

/** Full-width bottom stroke + tab curve; l/r are 0–100% of column where the inner bump sits. */
function buildActiveTabPath(l, r) {
  const y = 20;
  const mapX = (x) => l + ((x - 1.5) / (98.5 - 1.5)) * (r - l);
  // Softer shoulders + flatter crown for a cleaner active tab curve.
  return `M 0 ${y} L ${l} ${y} L ${l} 12 C ${mapX(2.6)} 7 ${mapX(8.2)} 1.55 ${mapX(15)} 1.55 L ${mapX(85)} 1.55 C ${mapX(91.8)} 1.55 ${mapX(97.4)} 7 ${mapX(98.5)} 12 V ${y} L 100 ${y}`;
}

import { LayoutGrid } from "lucide-react";

function CategoryNavColumn({
  cat,
  isActive,
  onCategorySelect,
}) {
  const isAll = cat.id === "all" || cat.slug === "all";

  return (
    <div
      onClick={() => onCategorySelect && onCategorySelect(cat)}
      className={cn(
        "relative flex min-w-[70px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 pb-1 transition-all active:scale-95",
        isActive ? "border-b-2 border-[#2822e3]" : "border-b-2 border-transparent",
      )}>
      <div className="flex h-12 w-12 items-center justify-center">
        {isAll ? (
          <LayoutGrid
            className={cn(
              "h-6 w-6 translate-y-[2px] transition-colors",
              isActive ? "text-white" : "text-white/60",
            )}
            strokeWidth={2.4}
          />
        ) : (
          <img
            src={cat.image || "https://cdn-icons-png.flaticon.com/128/2321/2321831.png"}
            alt={cat.name}
            className="h-full w-full object-contain"
          />
        )}
      </div>
      <span
        className={cn(
          "whitespace-nowrap text-center text-xs tracking-tight transition-colors",
          isActive ? "font-semibold text-white" : "font-medium text-white/80",
        )}>
        {cat.name}
      </span>
    </div>
  );
}

const MainLocationHeader = ({
  categories = [],
  activeCategory,
  onCategorySelect,
}) => {
  const { scrollY } = useScroll();
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const { currentLocation, refreshLocation, isFetchingLocation } =
    useLocation();
  const { isOpen: isProductDetailOpen } = useProductDetail();
  const { settings } = useSettings();
  const appName = settings?.appName || "App";
  const logoUrl = settings?.logoUrl || LogoImage;
  const navigate = useNavigate();

  // Search Logic
  const handleSearchClick = () => {
    navigate("/search");
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      navigate("/search", { state: { query: e.target.value } });
    }
  };

  // Search placeholder animation
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search ");
  const [typingState, setTypingState] = useState({
    textIndex: 0,
    charIndex: 0,
    isDeleting: false,
    isPaused: false,
  });

  const staticText = "Search ";
  const typingPhrases = [
    '"bread"',
    '"milk"',
    '"chocolate"',
    '"eggs"',
    '"chips"',
  ];

  useEffect(() => {
    const { textIndex, charIndex, isDeleting, isPaused } = typingState;
    const currentPhrase = typingPhrases[textIndex];

    if (isPaused) {
      const timeout = setTimeout(() => {
        setTypingState((prev) => ({
          ...prev,
          isPaused: false,
          isDeleting: true,
        }));
      }, 2000); // Pause after full phrase
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          // Typing
          if (charIndex < currentPhrase.length) {
            setSearchPlaceholder(
              staticText + currentPhrase.substring(0, charIndex + 1),
            );
            setTypingState((prev) => ({
              ...prev,
              charIndex: prev.charIndex + 1,
            }));
          } else {
            // Finished typing
            setTypingState((prev) => ({ ...prev, isPaused: true }));
          }
        } else {
          // Deleting
          if (charIndex > 0) {
            setSearchPlaceholder(
              staticText + currentPhrase.substring(0, charIndex - 1),
            );
            setTypingState((prev) => ({
              ...prev,
              charIndex: prev.charIndex - 1,
            }));
          } else {
            // Finished deleting
            setTypingState((prev) => ({
              ...prev,
              isDeleting: false,
              textIndex: (prev.textIndex + 1) % typingPhrases.length,
            }));
          }
        }
      },
      isDeleting ? 50 : 100,
    ); // 50ms deleting speed, 100ms typing speed

    return () => clearTimeout(timeout);
  }, [typingState]);

  // Smooth scroll interpolations
  const headerTopPadding = useTransform(scrollY, [0, 160], [16, 12]);
  const headerBottomPadding = useTransform(scrollY, [0, 160], [4, 3]);
  const headerRoundness = useTransform(scrollY, [0, 160], [0, 24]);
  const bgOpacity = useTransform(scrollY, [0, 160], [1, 0.98]);

  // Content animations
  const contentHeight = useTransform(scrollY, [0, 160], ["64px", "0px"]);
  const contentOpacity = useTransform(scrollY, [0, 160], [1, 0]);
  const navHeight = useTransform(scrollY, [0, 200], ["60px", "0px"]);
  const navOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const navMargin = useTransform(scrollY, [0, 200], [4, 0]);
  const categorySpacing = useTransform(scrollY, [0, 200], [3, 0]);
  const cartOpacity = useTransform(scrollY, [0, 110, 150], [1, 0.7, 0]);
  const cartScale = useTransform(scrollY, [0, 110, 150], [1, 0.9, 0.75]);

  // Helper to hide elements completely when collapsed to prevent clicks
  const displayContent = useTransform(scrollY, (value) =>
    value > 160 ? "none" : "block",
  );
  const displayNav = useTransform(scrollY, (value) =>
    value > 200 ? "none" : "flex",
  );
  const displayCart = useTransform(scrollY, (value) =>
    value > 150 ? "none" : "block",
  );

  const baseHeaderColor = activeCategory?.headerColor || "#45B0E2";
  const headerBackground = {
    backgroundImage: buildHeaderGradient(baseHeaderColor),
  };
  const searchBarBg = buildSearchBarBackgroundColor(baseHeaderColor);
  const categoryAccent = "#111111";

  useEffect(() => {
    const c = buildMiniCartColor(baseHeaderColor);
    document.documentElement.style.setProperty("--customer-mini-cart-color", c);
    return () => {
      document.documentElement.style.removeProperty(
        "--customer-mini-cart-color",
      );
    };
  }, [baseHeaderColor]);

  return (
    <>
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-200",
          isProductDetailOpen && "hidden md:block",
        )}>
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            paddingTop: headerTopPadding,
            paddingBottom: headerBottomPadding,
            borderBottomLeftRadius: headerRoundness,
            borderBottomRightRadius: headerRoundness,
            opacity: bgOpacity,
            ...headerBackground,
          }}
          className="sticky top-0 z-10 overflow-hidden px-4 pb-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 rounded-b-2xl">
          {/* Pure Base Layer */}
          <div className="absolute inset-0 pointer-events-none" />

          {/* Corner Lottie */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            style={{
              opacity: cartOpacity,
              scale: cartScale,
              display: displayCart,
            }}
            type="button"
            aria-label="Open cart"
            onClick={() => navigate("/checkout")}
            className="absolute top-3 right-5 sm:top-4 sm:right-6 md:top-5 md:right-8 z-20 w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 cursor-pointer">
            <Lottie
              animationData={shoppingCartAnimation}
              loop
              className="w-full h-full pointer-events-none drop-shadow-[0_8px_18px_rgba(0,0,0,0.14)]"
            />
          </motion.button>

          {/* Desktop/Tablet Header Layout (md and above) */}
          <div className="hidden md:flex items-center justify-between relative z-20 px-2 lg:px-6 mb-4 mt-1">
            {/* Left Section: Logo + Location row */}
            <div className="flex items-center gap-4 lg:gap-8">
              <div
                onClick={() => navigate("/")}
                className="flex items-center gap-3 cursor-pointer group shrink-0">
                <div className="group-hover:scale-110 transition-all duration-300 drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]">
                  <img
                    src={logoUrl}
                    alt={`${appName} Logo`}
                    className="h-10 w-auto object-contain"
                  />
                </div>
              </div>

              {/* Location Block (Desktop inline row) */}
              <div className="flex flex-col border-l border-black/10 pl-4 lg:pl-8 h-10 justify-center">
                <div className="flex items-center gap-1.5 opacity-70">
                  <AccessTimeIcon sx={{ fontSize: 13, color: "#111827" }} />
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">
                    {currentLocation.time}
                  </span>
                </div>
                <button
                  type="button"
                  data-lenis-prevent
                  data-lenis-prevent-touch
                  onClick={() => {
                    setIsLocationOpen(true);
                  }}
                  className="flex items-center gap-1 text-slate-900 hover:text-slate-700 cursor-pointer group active:scale-95 transition-all border-0 bg-transparent p-0 text-left">
                  <LocationOnIcon sx={{ fontSize: 14, color: "inherit" }} />
                  <div className="text-[13px] font-bold leading-tight max-w-[250px] lg:max-w-[320px] truncate">
                    {isFetchingLocation
                      ? "Detecting location..."
                      : currentLocation.name}
                  </div>
                  <ChevronDownIcon
                    sx={{ fontSize: 12, opacity: 0.5, color: "#111827" }}
                  />
                </button>
              </div>
            </div>

            {/* Center Section: Search Bar */}
            <div className="flex-1 max-w-[450px] lg:max-w-2xl px-6">
              <motion.div
                onClick={handleSearchClick}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                style={{ backgroundColor: searchBarBg }}
                className="rounded-full px-4 h-11 shadow-md flex items-center border border-white/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-cyan-400/60 cursor-pointer">
                <SearchIcon sx={{ color: "#000000", fontSize: 20 }} />
                <input
                  type="text"
                  placeholder={searchPlaceholder || "Search Products..."}
                  readOnly
                  className="flex-1 bg-transparent border-none outline-none pl-2 text-slate-800 font-semibold placeholder:text-slate-300 text-[15px] cursor-pointer"
                />
                <div className="flex items-center gap-2 border-l border-slate-100 pl-3">
                  <MicIcon sx={{ color: "#000000", fontSize: 20 }} />
                </div>
              </motion.div>
            </div>

            {/* Right Section: Action Icons */}
            <div className="flex items-center gap-5 lg:gap-8 shrink-0">
              <motion.button
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/wishlist")}
                className="text-slate-900 hover:text-red-500 transition-all">
                <FavoriteBorderOutlinedIcon sx={{ fontSize: 24 }} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.15, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/checkout")}
                className="text-slate-900 hover:text-slate-700 transition-all relative group">
                <ShoppingCartOutlinedIcon sx={{ fontSize: 24 }} />
                <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-cyan-900 text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-cyan-800 shadow-sm transition-transform group-hover:-translate-y-0.5">
                  0
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/profile")}
                className="text-slate-900 lg:bg-white/30 p-1.5 lg:rounded-full hover:bg-white hover:text-slate-900 transition-all">
                <AccountCircleOutlinedIcon sx={{ fontSize: 28 }} />
              </motion.button>
            </div>
          </div>

          {/* Header Rows (MOBILE ONLY) */}
          <div className="md:hidden flex flex-col gap-1">
            {/* Top Row: Delivery Info & Profile */}
            <div className="flex items-center justify-between py-2">
              <div className="flex flex-col gap-2.5">
                <span className="text-sm font-bold text-white leading-none tracking-tight">Delivery in 12-15 mins</span>
                <button
                  type="button"
                  onClick={() => setIsLocationOpen(true)}
                  className="flex items-center gap-0.5 text-left text-xs font-semibold text-white/80 border-0 bg-transparent p-0">
                  <span className="max-w-[240px] truncate">{currentLocation.name}</span>
                  <ChevronDownIcon sx={{ fontSize: 13, opacity: 0.9, color: "white" }} />
                </button>
              </div>

              <button
                onClick={() => navigate("/profile")}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 shadow-sm border border-white/10 active:scale-90 transition-transform">
                <AccountCircleOutlinedIcon sx={{ fontSize: 22, color: "#fff" }} />
              </button>
            </div>

            {/* Bottom Row: 60/40 Split Search & Refer/Earn - Dashboard Redesign */}
            <div className="pb-3 flex items-center gap-2.5 pt-0.5">
              <div className="flex-[0.6]">
                <motion.div
                  onClick={handleSearchClick}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-lg px-4 h-[40px] flex items-center bg-[#F2F2F2] border border-black/5 transition-colors duration-200 cursor-pointer">
                  <SearchIcon sx={{ color: "#6B7280", fontSize: 18 }} />
                  <input
                    type="text"
                    placeholder={searchPlaceholder || "Search products..."}
                    readOnly
                    className="flex-1 bg-transparent border-none outline-none pl-2 text-[#1A1A1A] font-medium placeholder:text-[#6B7280] text-[13px] cursor-pointer"
                  />
                  <div className="flex items-center gap-2 border-l border-gray-300/40 pl-2">
                    <MicIcon sx={{ color: "#6B7280", fontSize: 18 }} />
                  </div>
                </motion.div>
              </div>

              <div className="flex-[0.4]">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  onClick={() => navigate("/refer-earn")}
                  className="relative w-full h-[40px] rounded-lg bg-gradient-to-br from-[#2a2a2a] to-[#050505] border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.1)] flex flex-col items-center justify-center transition-all active:brightness-125 px-1 overflow-hidden">

                  {/* Gloss Shimmer Effect */}
                  <motion.div
                    initial={{ x: "-150%" }}
                    animate={{ x: "150%" }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 0, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] pointer-events-none"
                  />

                  <span className="text-[11px] font-black leading-none text-[#D4AF37] tracking-[0.04em] uppercase whitespace-nowrap mb-1.5">
                    Refer & Earn
                  </span>
                  <span className="text-[5px] font-semibold text-white/80 leading-none tracking-normal whitespace-nowrap">
                    Unlock rewards together
                  </span>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Categories Navigation - Smooth Collapse */}
          {categories.length > 0 && (
            <motion.div
              layout
              transition={{
                layout: {
                  type: "spring",
                  stiffness: 420,
                  damping: 34,
                  mass: 0.6,
                },
              }}
              style={{
                height: navHeight,
                opacity: navOpacity,
                marginTop: categorySpacing,
                display: displayNav,
                overflowY: "hidden",
              }}
              className="no-scrollbar relative z-10 flex min-h-[68px] items-center gap-6 overflow-x-auto px-4 py-2 scroll-smooth md:justify-center md:min-h-[76px]">
              {categories.map((cat) => {
                const isActive = activeCategory?.id === cat.id;
                return (
                  <CategoryNavColumn
                    key={cat.id}
                    cat={cat}
                    isActive={isActive}
                    categoryAccent={categoryAccent}
                    onCategorySelect={onCategorySelect}
                  />
                );
              })}
            </motion.div>
          )}

          {/* Background Decorative patterns */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
        </motion.div>
      </div>

      <LocationDrawer
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
      />
    </>
  );
};

export default MainLocationHeader;

