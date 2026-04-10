import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import Lottie from "lottie-react";
import LocationDrawer from "./LocationDrawer";
import { useLocation } from "../../context/LocationContext";
import { useProductDetail } from "../../context/ProductDetailContext";
import { useSettings } from "@core/context/SettingsContext";
import { useAuth } from "@core/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  buildHeaderGradient,
  buildMiniCartColor,
  buildSearchBarBackgroundColor,
  shiftHex,
} from "../../utils/headerTheme";
import { HeaderCategoryVisual } from "@/shared/constants/headerCategoryVisuals";
import { getCategoryImage } from "@/shared/constants/categoryImageMap";
import LogoImage from "../../../../assets/Logo.png";
import shoppingCartAnimation from "../../../../assets/lottie/shopping-cart.json";
import GuestProfilePrompt from "./GuestProfilePrompt";

// MUI Icons
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import MicIcon from "@mui/icons-material/Mic";
import ChevronDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

const FORTUNE_SUGAR_PACK_IMAGE =
  "https://www.fortunefoods.com/wp-content/uploads/2022/12/1kg-front.png";

/** Map category names to Lucide React SVG icons */
function getCategoryIcon(categoryName) {
  if (!categoryName) return LayoutGrid;
  
  const name = categoryName.toLowerCase();
  
  const iconMap = {
    // Grocery
    grocery: ShoppingBag,
    vegetables: Leaf,
    fruits: Leaf,
    dairy: Droplet,
    breads: ShoppingBag,
    bakery: ShoppingBag,
    
    // Fashion & Home
    fashion: Shirt,
    clothing: Shirt,
    home: Home,
    "home & kitchen": Home,
    kitchen: Utensils,
    
    // Electronics & Appliances
    electronics: Smartphone,
    devices: Smartphone,
    appliances: Lightbulb,
    
    // Health & Beauty
    health: Zap,
    fitness: Dumbbell,
    beauty: Heart,
    wellness: Leaf,
    
    // Lifestyle
    sports: Dumbbell,
    toys: Gamepad2,
    books: Book,
    education: Book,
    gifts: Gift,
    
    // Beverages
    beverages: Coffee,
    drinks: Coffee,
    
    // Default
    all: LayoutGrid,
  };
  
  // Check for exact match
  if (iconMap[name]) return iconMap[name];
  
  // Check for partial match
  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key) || key.includes(name)) {
      return icon;
    }
  }
  
  return ShoppingBag; // Default icon
}

/** Full-width bottom stroke + tab curve; l/r are 0–100% of column where the inner bump sits. */
function buildActiveTabPath(l, r) {
  const y = 20;
  const mapX = (x) => l + ((x - 1.5) / (98.5 - 1.5)) * (r - l);
  // Softer shoulders + flatter crown for a cleaner active tab curve.
  return `M 0 ${y} L ${l} ${y} L ${l} 12 C ${mapX(2.6)} 7 ${mapX(8.2)} 1.55 ${mapX(15)} 1.55 L ${mapX(85)} 1.55 C ${mapX(91.8)} 1.55 ${mapX(97.4)} 7 ${mapX(98.5)} 12 V ${y} L 100 ${y}`;
}

import { LayoutGrid, ShoppingBag, Shirt, Home, Zap, Heart, Dumbbell, Book, Droplet, Leaf, Coffee, Gift, Gamepad2, Lightbulb, Smartphone, Utensils } from "lucide-react";

function CategoryNavColumn({
  cat,
  isActive,
  onCategorySelect,
  activeColor,
}) {
  const isAll = cat.id === "all" || cat.slug === "all";
  const IconComponent = isAll ? LayoutGrid : getCategoryIcon(cat.name);

  return (
    <div
      onClick={() => onCategorySelect && onCategorySelect(cat)}
      className={cn(
        "group relative flex min-w-[58px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 pb-1.5 transition-all duration-200 active:scale-95 md:min-w-[70px] md:gap-1.5 md:pb-1 md:hover:scale-105",
      )}>
      <div className="flex h-8 w-8 items-center justify-center md:h-12 md:w-12">
        <IconComponent
          className={cn(
            "h-[17px] w-[17px] transition-colors duration-200 md:h-6 md:w-6",
            isActive
              ? "text-white"
              : "text-white/70 group-hover:text-white",
          )}
          strokeWidth={2.2}
        />
      </div>
      <span
        className={cn(
          "whitespace-nowrap text-center text-[10px] leading-none tracking-tight transition-colors md:text-xs",
          isActive
            ? "font-black text-white"
            : "font-medium text-white/80 group-hover:text-white",
        )}
        style={isActive ? { color: "rgb(255,255,255)" } : {}}>
        {cat.name}
      </span>
      
      {isActive && (
        <motion.div
          layoutId="categoryActiveBar"
          className="absolute -bottom-0.5 w-6 h-1 rounded-full bg-white"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </div>
  );
}

const MainLocationHeader = ({
  categories = [],
  activeCategory,
  onCategorySelect,
  featuredOffer = {
    title: "Sugar",
    image: "https://www.fortunefoods.com/wp-content/uploads/2022/12/1kg-front.png",
    subtitle: "Rs. 1 per Kg*",
    description: "On Order above 399",
  },
}) => {
  const { scrollY } = useScroll();
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const { currentLocation, savedAddresses, refreshLocation, isFetchingLocation } =
    useLocation();
  const { isOpen: isProductDetailOpen } = useProductDetail();
  const { settings } = useSettings();
  const { isAuthenticated } = useAuth();
  const appName = settings?.appName || "zeppe";
  const logoUrl = settings?.logoUrl || LogoImage;
  const navigate = useNavigate();
  const [isGuestPromptOpen, setIsGuestPromptOpen] = useState(false);

  // Search Logic
  const handleSearchClick = () => {
    navigate("/search");
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      navigate("/search", { state: { query: e.target.value } });
    }
  };

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      setIsGuestPromptOpen(true);
      return;
    }
    navigate("/profile");
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
  const mobileHeaderTopPadding = useTransform(scrollY, [0, 60], ["26px", "4px"]);
  const desktopHeaderTopPadding = useTransform(scrollY, [0, 160], ["16px", "12px"]);
  const headerBottomPadding = useTransform(scrollY, [0, 60], [4, 0]);
  const bgOpacity = useTransform(scrollY, [0, 60], [1, 1]);

  // Content animations
  const contentHeight = useTransform(scrollY, [0, 55], ["98px", "0px"]);
  const contentOpacity = useTransform(scrollY, [0, 35], [1, 0]);
  const navHeight = useTransform(scrollY, [0, 60], ["60px", "52px"]);
  const navOpacity = useTransform(scrollY, [0, 120], [1, 1]);
  const navMargin = useTransform(scrollY, [0, 200], [4, 0]);
  const categorySpacing = useTransform(scrollY, [0, 200], [0, 0]);
  const promoHeight = useTransform(scrollY, [0, 55], ["110px", "0px"]);
  const promoOpacity = useTransform(scrollY, [0, 35], [1, 0]);
  const promoMargin = useTransform(scrollY, [0, 55], [0, -110]);
  const cartOpacity = useTransform(scrollY, [0, 110, 150], [1, 0.7, 0]);
  const cartScale = useTransform(scrollY, [0, 110, 150], [1, 0.9, 0.75]);
  const compactOverlayOpacity = useTransform(scrollY, [0, 18, 40], [0, 0.88, 1]);
  // IMPORTANT: baseHeaderColor must be declared BEFORE the MotionValue that uses it
  const baseHeaderColor = activeCategory?.headerColor || "#7B4419";

  // At scroll=0: fully transparent (parent gradient shows through seamlessly).
  // As user scrolls: fades to near-black so compact strip looks dark like the screenshot.
  const computeCompactBg = (scrollVal) => {
    const progress = Math.min(1, Math.max(0, scrollVal / 50));
    return `rgba(8, 6, 4, ${progress})`;
  };

  const compactNavBg = useMotionValue(computeCompactBg(0));

  useEffect(() => {
    compactNavBg.set(computeCompactBg(scrollY.get()));
    const unsub = scrollY.on('change', (val) => {
      compactNavBg.set(computeCompactBg(val));
    });
    return unsub;
  }, [baseHeaderColor]);

  // Search bar always white/cream — visible on gradient background

  // Helper to hide elements completely when collapsed to prevent clicks
  const displayContent = useTransform(scrollY, (value) =>
    value > 42 ? "none" : "block",
  );
  const displayNav = useTransform(scrollY, () => "flex");
  const displayCart = useTransform(scrollY, (value) =>
    value > 120 ? "none" : "block",
  );

  const searchBarBg = buildSearchBarBackgroundColor(baseHeaderColor);
  const matchedSavedAddress = savedAddresses?.find((address) => {
    const savedAddress = String(address?.address || "").trim().toLowerCase();
    const activeAddress = String(currentLocation?.name || "").trim().toLowerCase();

    if (!savedAddress || !activeAddress) return false;
    return (
      savedAddress === activeAddress ||
      savedAddress.includes(activeAddress) ||
      activeAddress.includes(savedAddress)
    );
  });
  const currentLocationLabel = (
    matchedSavedAddress?.label ||
    currentLocation?.label ||
    "Home"
  ).toUpperCase();
  const deliveryTimeText = (() => {
    const rawTime = String(currentLocation?.time || "12-15 mins").trim();
    const normalizedTime = rawTime.toLowerCase();

    if (normalizedTime.includes("hour") || normalizedTime.includes("hr")) {
      return rawTime.replace(/hours?/i, "hr");
    }

    const timeMatches = Array.from(rawTime.matchAll(/\d+/g))
      .map(([value]) => Number(value))
      .filter((value) => Number.isFinite(value));

    if (timeMatches.length > 0) {
      return `${Math.max(...timeMatches)} min`;
    }

    return "15 min";
  })();
  const locationPromptText = isFetchingLocation
    ? "Detecting location..."
    : "Tap to set location";

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
            "--mobile-header-top-padding": mobileHeaderTopPadding,
            "--desktop-header-top-padding": desktopHeaderTopPadding,
            paddingBottom: headerBottomPadding,
            opacity: bgOpacity,
            backgroundImage: buildHeaderGradient(baseHeaderColor),
          }}
          className="relative z-10 overflow-visible rounded-b-none px-4 pt-[calc(env(safe-area-inset-top,_0px)+var(--mobile-header-top-padding))] shadow-[0_18px_45px_rgba(36,18,12,0.35)] transition-all duration-500 md:rounded-b-2xl md:bg-none md:bg-white md:pt-[var(--desktop-header-top-padding)] md:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <motion.div
            aria-hidden="true"
            style={{ opacity: compactOverlayOpacity }}
            className="pointer-events-none absolute inset-0 bg-[#020202] md:hidden"
          />

          {/* Pure Base Layer */}
          <motion.div
            aria-hidden="true"
            style={{ opacity: contentOpacity }}
            className="pointer-events-none absolute inset-0 md:hidden">
            <div className="absolute -top-16 left-[-10%] h-40 w-40 rounded-full bg-amber-100/25 blur-3xl" />
            <div className="absolute -top-20 right-[-12%] h-48 w-48 rounded-full bg-white/12 blur-3xl" />
            <div className="absolute bottom-0 left-1/4 h-24 w-40 rounded-full bg-black/20 blur-3xl" />
          </motion.div>

          {/* Corner Lottie */}
          <div className="hidden md:block">
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
              className="absolute right-5 top-[calc(env(safe-area-inset-top,_0px)+12px)] z-20 h-12 w-12 cursor-pointer md:top-5 md:right-8 md:h-20 md:w-20">
              <Lottie
                animationData={shoppingCartAnimation}
                loop
                className="w-full h-full pointer-events-none drop-shadow-[0_8px_18px_rgba(0,0,0,0.14)]"
              />
            </motion.button>
          </div>

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
                onClick={handleProfileClick}
                className="text-slate-900 lg:bg-white/30 p-1.5 lg:rounded-full hover:bg-white hover:text-slate-900 transition-all">
                <AccountCircleOutlinedIcon sx={{ fontSize: 28 }} />
              </motion.button>
            </div>
          </div>

          {/* Header Rows (MOBILE ONLY) */}
          <div className="md:hidden flex flex-col">
            {/* Profile Button — absolute top-right corner */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleProfileClick}
              className="absolute top-[calc(env(safe-area-inset-top,0px)+58px)] right-4 z-30 flex items-center justify-center w-12 h-12 rounded-full shadow-lg overflow-hidden"
              style={{ opacity: contentOpacity, display: displayContent, backgroundColor: "rgba(30, 16, 8, 0.85)", border: "1.5px solid rgba(255,255,255,0.15)" }}>
              <PersonRoundedIcon sx={{ fontSize: 28, color: "rgba(255,255,255,0.9)" }} />
            </motion.button>

            {/* Top Row: Location only (full width) */}
            <motion.div
              style={{
                height: contentHeight,
                opacity: contentOpacity,
                display: displayContent,
                overflow: "hidden",
              }}
              className="flex flex-col py-2 pr-14">
              <div className="text-[20px] font-black leading-none tracking-tight text-white">
                zeppe
              </div>
              <div className="mt-0.5 text-[32px] font-bold leading-[0.88] tracking-[-0.06em] text-white -ml-1">
                {deliveryTimeText}
              </div>
              <button
                type="button"
                onClick={() => setIsLocationOpen(true)}
                className="mt-1 flex items-center gap-0.5 border-0 bg-transparent p-0 text-left">
                <span className="text-[14px] font-bold uppercase tracking-[0.04em] text-white/90">
                  {currentLocationLabel}
                </span>
                <span className="text-[12px] font-bold tracking-[0.04em] text-white/90">
                  - {locationPromptText}
                </span>
                <ChevronDownIcon sx={{ fontSize: 12, opacity: 0.9, color: "#FFFFFF" }} />
              </button>
            </motion.div>

            {/* Bottom Row: 60/40 Split Search & Refer/Earn — sticky compact on scroll */}
            <motion.div
              style={{ backgroundColor: compactNavBg }}
              className="relative z-30 -mx-4 flex items-center gap-2.5 px-4 pt-2 pb-3">
              <div className="flex-[0.55]">
                <div
                  onClick={handleSearchClick}
                  className="flex h-[40px] w-full cursor-pointer items-center rounded-xl px-4 shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-colors duration-200"
                  style={{ backgroundColor: "rgba(255,252,248,0.95)" }}>
                  <SearchIcon sx={{ color: "#6B7280", fontSize: 16 }} />
                  <input
                    type="text"
                    placeholder={searchPlaceholder || "Search products..."}
                    readOnly
                    className="flex-1 bg-transparent border-none outline-none pl-2 text-[#1A1A1A] font-medium placeholder:text-[#9CA3AF] text-[12px] cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex-[0.45]">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/refer-earn")}
                  className="flex h-[40px] w-full items-center justify-center rounded-[8px] border-2 border-[#FFD700] bg-black px-2 shadow-lg transition-all active:brightness-150">

                  <span className="text-[9px] font-black text-[#FFD700] tracking-widest uppercase whitespace-nowrap">
                    Refer &amp; Earn
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Categories Navigation - Smooth Collapse */}
          {categories.length > 0 && (
            <>
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
                  backgroundColor: compactNavBg,
                }}
                className="no-scrollbar relative z-20 -mx-4 flex min-h-[52px] items-center gap-2 overflow-x-auto px-2 pt-0.5 pb-1 scroll-smooth md:mx-0 md:min-h-[76px] md:items-center md:gap-6 md:px-4 md:py-2 mt-4">>
                {categories.map((cat) => {
                  const isActive = activeCategory?.id === cat.id;
                  return (
                    <CategoryNavColumn
                      key={cat.id}
                      cat={cat}
                      isActive={isActive}
                      onCategorySelect={onCategorySelect}
                      activeColor={baseHeaderColor}
                    />
                  );
                })}
              </motion.div>

              <motion.button
                type="button"
                onClick={() => navigate("/offers")}
                style={{
                  height: promoHeight,
                  opacity: promoOpacity,
                  marginTop: promoMargin,
                  overflow: "hidden",
                }}
                whileTap={{ scale: 0.98 }}
                className="relative w-screen left-[calc(-50vw+50%)] z-10 flex items-stretch md:hidden group border-t border-white/10">

                <div className="relative z-10 flex h-[110px] w-full items-center px-4 gap-4">

                  {/* Left: Text Content */}
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    {/* Labels row */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white/70 text-[10px] font-bold tracking-widest uppercase">✨ NEW</span>
                      <span className="text-white/70 text-[10px]">·</span>
                      <span className="text-white/70 text-[10px] font-bold tracking-widest uppercase">🔥 Exclusive Deals</span>
                    </div>

                    {/* Main Title */}
                    <h2 className="font-serif text-[28px] font-black leading-none tracking-[-0.04em] text-white drop-shadow-lg truncate">
                      {featuredOffer?.title || "All Offers"}
                    </h2>

                    {/* Subtitle + SALE Badge */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[11px] text-white/80 font-semibold leading-tight truncate">
                        {featuredOffer?.subtitle || "Shop now"}
                      </p>
                      <span className="shrink-0 bg-white/25 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-full tracking-wide">
                        SALE
                      </span>
                    </div>
                  </div>

                  {/* Right: Product Image */}
                  <div className="relative shrink-0 h-[100px] w-[100px] flex items-center justify-center mt-8">
                    <div className="absolute inset-0 bg-white/10 blur-lg rounded-full" />
                    <img
                      src={featuredOffer?.image || FORTUNE_SUGAR_PACK_IMAGE}
                      alt={featuredOffer?.title || "Featured product"}
                      className="relative z-10 h-full w-full object-contain drop-shadow-2xl brightness-110 group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                </div>
              </motion.button>
            </>
          )}

          {/* Background Decorative patterns */}
          <div className="pointer-events-none absolute -mr-40 -mt-40 h-80 w-80 rounded-full bg-amber-100/15 blur-[100px] md:bg-blue-100/20" />
        </motion.div>
      </div>

      <LocationDrawer
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
      />

      <GuestProfilePrompt
        isOpen={isGuestPromptOpen}
        onClose={() => setIsGuestPromptOpen(false)}
      />
    </>
  );
};

export default MainLocationHeader;






