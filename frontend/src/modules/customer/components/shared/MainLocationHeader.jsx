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
    pharmacy: Pill,

    // Lifestyle
    sports: Dumbbell,
    toys: Gamepad2,
    books: Book,
    education: Book,
    gifts: Gift,
    kids: Baby,
    "pet supplies": PawPrint,
    pet: PawPrint,
    stationery: Pencil,
    flower: Flower2,
    flowers: Flower2,

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

import { LayoutGrid, ShoppingBag, Shirt, Home, Zap, Heart, Dumbbell, Book, Droplet, Leaf, Coffee, Gift, Gamepad2, Lightbulb, Smartphone, Utensils, Baby, Pill, PawPrint, Pencil, Flower2 } from "lucide-react";

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

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const topInfoEl = document.getElementById("mobile-top-info");
      const threshold = topInfoEl ? topInfoEl.offsetHeight : 100;
      // Triggers transition exactly as the top section disappears
      setIsScrolled(window.scrollY > (threshold - 1));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Search bar always white/cream — visible on gradient background
  const baseHeaderColor = activeCategory?.headerColor || "#7B4419";
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
      {/* 1. TOP INFO (Scrolls away normally) */}
      <div 
        id="mobile-top-info"
        className={cn(
          "relative w-full z-[900] h-auto",
          isProductDetailOpen && "hidden",
          isLocationOpen && "hidden"
        )}>
        <div
          style={{
            backgroundImage: buildHeaderGradient(baseHeaderColor),
          }}
          className="w-full z-10 rounded-none px-4 pt-[calc(env(safe-area-inset-top,_0px)+8px)] md:hidden">
          
          <div className="flex flex-col pt-1">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setIsLocationOpen(true)}
              className="absolute top-[calc(env(safe-area-inset-top,0px)+30px)] right-[4.55rem] z-30 flex h-7 items-center gap-1 rounded-full px-2.5 shadow-[0_8px_18px_rgba(0,0,0,0.16)]"
              style={{
                background: "linear-gradient(180deg, #a6e4cc 0%, #84cfb0 100%)",
                border: "1px solid rgba(255,255,255,0.38)",
              }}>
              <LocationOnIcon sx={{ fontSize: 12, color: "#1F6B53" }} />
              <span className="text-[10px] font-black tracking-tight text-[#1F6B53]">
                2.7 kms
              </span>
            </motion.button>
            {/* Profile Button — absolute top-right corner */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleProfileClick}
              className="absolute top-[calc(env(safe-area-inset-top,0px)+30px)] right-4 z-30 flex items-center justify-center w-12 h-12 rounded-full shadow-lg overflow-hidden"
              style={{ backgroundColor: "rgba(30, 16, 8, 0.85)", border: "1.5px solid rgba(255,255,255,0.15)" }}>
              <PersonRoundedIcon sx={{ fontSize: 28, color: "rgba(255,255,255,0.9)" }} />
            </motion.button>

            {/* Top Row: Location only (full width) */}
            <div className="flex flex-col py-2 pr-14 relative">
              <div className="text-[20px] font-black leading-none tracking-tight text-white">
                zeppe
              </div>
              <div className="mt-0.5 text-[32px] font-bold leading-[0.88] tracking-[-0.06em] text-white -ml-1">
                {deliveryTimeText}
              </div>
              <div className="mt-1.5 mb-1 overflow-hidden relative w-full flex items-center h-[26px]">
                <style>{`
                  @keyframes scrollingTextShine {
                    0% { background-position: 200% center; }
                    100% { background-position: -200% center; }
                  }
                  .text-glass-flare {
                    background: linear-gradient(
                      110deg,
                      rgba(255,255,255,0.85) 0%,
                      rgba(255,255,255,0.85) 40%,
                      #ffffff 48%,
                      #ffffff 52%,
                      rgba(255,255,255,0.85) 60%,
                      rgba(255,255,255,0.85) 100%
                    );
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    color: transparent;
                    animation: scrollingTextShine 3s linear infinite;
                    text-shadow: 0px 1px 2px rgba(0,0,0,0.1);
                  }
                `}</style>
                <motion.div
                  animate={{ x: ["105%", "-105%"] }}
                  transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="inline-flex items-center whitespace-nowrap h-full">
                  <span className="text-[16px] font-bold tracking-[0.02em] text-glass-flare">
                    Our favourite offer is back "{featuredOffer?.title || "Sugar"} @ {featuredOffer?.subtitle || "Rs. 1 per Kg*"}"
                  </span>
                </motion.div>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationOpen(true)}
                className="mt-1 mb-1 flex items-center gap-0.5 border-0 bg-transparent p-0 text-left relative z-10 hover:opacity-80">
                <span className="text-[14px] font-bold uppercase tracking-[0.04em] text-white/90">
                  {currentLocationLabel}
                </span>
                <span className="text-[12px] font-bold tracking-[0.04em] text-white/90">
                  - {locationPromptText}
                </span>
                <ChevronDownIcon sx={{ fontSize: 12, opacity: 0.9, color: "#FFFFFF" }} />
              </button>
            </div>

            </div>
        </div>
      </div>

      {/* 2. STICKY HEADER (Search + Categories + Desktop Layout) */}
      <div
        className={cn(
          "sticky top-0 w-full z-[1000] h-auto",
          isProductDetailOpen && "hidden md:block" // Keeps logic for hiding
        )}>
        <div
          style={{
            backgroundImage: isScrolled ? "none" : buildHeaderGradient(baseHeaderColor),
            backgroundColor: isScrolled ? "#0f0f0f" : "transparent",
            transition: "all 0.3s ease"
          }}
          className={cn(
            "w-full z-10 rounded-b-none px-4 pb-0 md:rounded-b-2xl md:bg-none md:bg-white md:pt-3 transition-all duration-300 border-b-0",
            isScrolled ? "shadow-[0_4px_20px_rgba(0,0,0,0.3)]" : "shadow-none"
          )}>

          {/* Corner Lottie */}
          <div className="hidden md:block">
            <button
              type="button"
              aria-label="Open cart"
              onClick={() => navigate("/checkout")}
              className="absolute right-5 top-[calc(env(safe-area-inset-top,_0px)+12px)] z-20 h-12 w-12 cursor-pointer md:top-5 md:right-8 md:h-20 md:w-20">
              <Lottie
                animationData={shoppingCartAnimation}
                loop
                className="w-full h-full pointer-events-none drop-shadow-[0_8px_18px_rgba(0,0,0,0.14)]"
              />
            </button>
          </div>

          {/* Desktop/Tablet Header Layout (md and above) */}
          <div className="hidden md:flex items-center justify-between relative z-20 px-2 lg:px-6 mb-4 mt-1">
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
                  onClick={() => setIsLocationOpen(true)}
                  className="flex items-center gap-1 text-slate-900 hover:text-slate-700 cursor-pointer group active:scale-95 transition-all border-0 bg-transparent p-0 text-left">
                  <LocationOnIcon sx={{ fontSize: 14, color: "inherit" }} />
                  <div className="text-[13px] font-bold leading-tight max-w-[250px] lg:max-w-[320px] truncate">
                    {isFetchingLocation ? "Detecting location..." : currentLocation.name}
                  </div>
                  <ChevronDownIcon sx={{ fontSize: 12, opacity: 0.5, color: "#111827" }} />
                </button>
              </div>
            </div>

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
                <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-cyan-900 text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-cyan-800 shadow-sm transition-transform group-hover:-translate-y-0.5">0</span>
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

          {/* Bottom Row: 60/40 Split Search & Refer/Earn — sticky compact on scroll */}
          <div className="md:hidden flex items-center gap-2.5 pt-0 pb-0 w-full">
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
                <button
                  type="button"
                  onClick={() => navigate("/refer-earn")}
                  className="relative overflow-hidden w-full h-[38px] flex flex-col items-center justify-center transition-all duration-300 active:scale-[0.98] rounded-[6px]"
                  style={{
                    background: "linear-gradient(135deg, rgba(35,35,35,1) 0%, rgba(0,0,0,1) 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.4)",
                  }}>
                  {/* Glass Flare Animation (Left to Right Shine) */}
                  <motion.div 
                    className="absolute top-0 bottom-0 w-[40%] pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                      transform: "skewX(-20deg)",
                      zIndex: 20
                    }}
                    initial={{ left: "-100%" }}
                    animate={{ left: "200%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "linear",
                      repeatDelay: 2.5
                    }}
                  />
                  
                  <span 
                    className="text-[13px] font-black uppercase tracking-wider z-10 leading-none"
                    style={{
                      color: "#FCD34D", // pure sharp gold/amber
                      textShadow: "0px 1px 3px rgba(0,0,0,0.9)",
                    }}>
                    Refer &amp; Earn
                  </span>
                  <span className="text-[5px] font-bold text-white/80 tracking-widest uppercase z-10 mt-[2px]">
                    Unlock rewards together
                  </span>
                </button>
              </div>
            </div>

          {/* Categories Navigation - Smooth Collapse */}
          {categories.length > 0 && (
            <>
              <div
                className="no-scrollbar relative z-20 mt-0 flex min-h-[52px] items-center gap-2 overflow-x-auto pt-0 pb-0 scroll-smooth md:mx-0 md:min-h-[76px] md:gap-6 md:py-2 border-t-0 border-b-0 shadow-none">
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
              </div>
            </>
          )}

          {/* Background Decorative patterns */}
          <div className="pointer-events-none absolute -mr-40 -mt-40 h-80 w-80 rounded-full bg-amber-100/15 blur-[100px] md:bg-blue-100/20" />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="relative z-[1] w-full mt-0 mb-4 md:hidden">
          <motion.button
            type="button"
            onClick={() => navigate("/offers")}
            whileTap={{ scale: 0.98 }}
            className="relative w-full z-10 flex items-stretch group rounded-none overflow-hidden shadow-none">

            <div
              className="relative z-10 flex h-[110px] w-full items-center justify-between px-4"
              style={{ backgroundColor: (!activeCategory || activeCategory?.id === "all" || activeCategory?.slug === "all" || activeCategory?._id === "all") ? "#0A0A0A" : baseHeaderColor }}
            >

              {/* Left: Product Name */}
              <div className="flex-[0.8] z-20 overflow-hidden pr-2">
                <h2 className="font-serif text-[clamp(20px,6vw,38px)] font-black text-white leading-[1.05] tracking-tight line-clamp-2">
                  {(!activeCategory || activeCategory?.id === "all" || activeCategory?.slug === "all" || activeCategory?._id === "all") ? "Sugar" : (featuredOffer?.title || "Exclusive Deals")}
                </h2>
              </div>

              {/* Center: Image */}
              <div className="absolute left-1/2 -translate-x-[60%] top-1/2 -translate-y-1/2 h-[130px] w-[90px] flex items-center justify-center z-10">
                <img
                  src={(!activeCategory || activeCategory?.id === "all" || activeCategory?.slug === "all" || activeCategory?._id === "all") ? FORTUNE_SUGAR_PACK_IMAGE : (featuredOffer?.image || FORTUNE_SUGAR_PACK_IMAGE)}
                  alt={(!activeCategory || activeCategory?.id === "all" || activeCategory?.slug === "all" || activeCategory?._id === "all") ? "Fortune Sugar" : (featuredOffer?.title || "Offer")}
                  className="h-full w-full object-contain drop-shadow-2xl"
                />
              </div>

              {/* Right: Price details */}
              <div className="flex-1 flex flex-col items-end justify-center text-right z-20 pl-[80px]">
                <div className="font-serif text-[clamp(16px,4vw,24px)] font-bold text-white leading-[1.1] tracking-tight line-clamp-2 min-w-0 break-words">
                  {(!activeCategory || activeCategory?.id === "all" || activeCategory?.slug === "all" || activeCategory?._id === "all") ? "Rs. 1 per Kg*" : (featuredOffer?.subtitle || "Shop now")}
                </div>
                <div className="text-[11px] font-bold text-white mt-2 tracking-wide opacity-90 line-clamp-2">
                  {(!activeCategory || activeCategory?.id === "all" || activeCategory?.slug === "all" || activeCategory?._id === "all") ? "On Order above 399" : (featuredOffer?.description || "For best prices")}
                </div>
              </div>

            </div>
          </motion.button>
        </div>
      )}

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
