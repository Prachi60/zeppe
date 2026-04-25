import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useNavigate, useLocation as useRouteLocation } from "react-router-dom";
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
import CustomerAuth from "../../pages/CustomerAuth";

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

// MUI Category Icons (same as admin IconSelector)
import MuiHomeIcon from "@mui/icons-material/Home";
import DevicesIcon from "@mui/icons-material/Devices";
import LocalGroceryStoreIcon from "@mui/icons-material/LocalGroceryStore";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import MuiPetsIcon from "@mui/icons-material/Pets";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SpaIcon from "@mui/icons-material/Spa";
import ToysIcon from "@mui/icons-material/Toys";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import YardIcon from "@mui/icons-material/Yard";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import DiamondIcon from "@mui/icons-material/Diamond";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import BuildIcon from "@mui/icons-material/Build";
import LuggageIcon from "@mui/icons-material/Luggage";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import KitchenIcon from "@mui/icons-material/Kitchen";

/** Map iconId (set in admin) to MUI icon component */
const MUI_ICON_MAP = {
  electronics: DevicesIcon,
  fashion: CheckroomIcon,
  home: MuiHomeIcon,
  food: LocalCafeIcon,
  sports: SportsSoccerIcon,
  books: MenuBookIcon,
  beauty: SpaIcon,
  toys: ToysIcon,
  automotive: DirectionsCarIcon,
  pets: MuiPetsIcon,
  health: LocalHospitalIcon,
  garden: YardIcon,
  office: BusinessCenterIcon,
  music: MusicNoteIcon,
  jewelry: DiamondIcon,
  baby: ChildCareIcon,
  tools: BuildIcon,
  luggage: LuggageIcon,
  art: ColorLensIcon,
  grocery: LocalGroceryStoreIcon,
  gifts: CardGiftcardIcon,
  kitchen: KitchenIcon,
};

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
    categories: LayoutGrid,
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

  // Priority: 1) Custom Image (or static image for All), 2) MUI icon, 3) Lucide fallback
  const customImage = cat.image;
  const MuiIcon = !isAll && !customImage && cat.iconId ? MUI_ICON_MAP[cat.iconId] : null;
  const LucideIcon = !customImage && !MuiIcon ? (isAll ? (cat.image ? null : LayoutGrid) : getCategoryIcon(cat.name)) : null;

  return (
    <div
      onClick={() => onCategorySelect && onCategorySelect(cat)}
      className={cn(
        "group relative flex min-w-[58px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 pb-1.5 transition-all duration-200 active:scale-95 md:min-w-[70px] md:gap-1.5 md:pb-1 md:hover:scale-105",
      )}>
      <div className="flex h-8 w-8 items-center justify-center md:h-12 md:w-12">
        {customImage ? (
          <img
            src={customImage}
            alt={cat.name}
            className={cn(
              "h-[18px] w-[18px] object-contain transition-all duration-200 md:h-7 md:w-7",
              isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100",
              // Apply a grayscale filter if we want it to match the monochrome look, 
              // but usually custom icons are meant to be seen in color.
              !isActive && "grayscale brightness-0" 
            )}
          />
        ) : MuiIcon ? (
          <MuiIcon
            className={cn(
              "transition-colors duration-200",
              isActive ? "text-black" : "text-black/70 group-hover:text-black",
            )}
            style={{ fontSize: 20 }}
          />
        ) : LucideIcon ? (
          <LucideIcon
            className={cn(
              "h-[17px] w-[17px] transition-colors duration-200 md:h-6 md:w-6",
              isActive ? "text-black" : "text-black/70 group-hover:text-black",
            )}
            strokeWidth={2.2}
          />
        ) : null}
      </div>
      <span
        className={cn(
          "whitespace-nowrap text-center text-[10px] leading-none tracking-tight transition-colors md:text-xs",
          isActive
            ? "font-black text-black"
            : "font-medium text-black/70 group-hover:text-black",
        )}
        style={isActive ? { color: "rgb(0,0,0)" } : {}}>
        {cat.name}
      </span>

      {isActive && (
        <motion.div
          layoutId="categoryActiveBar"
          className="absolute -bottom-0.5 w-6 h-1 rounded-full bg-black"
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
  const routeLocation = useRouteLocation();
  const [isGuestPromptOpen, setIsGuestPromptOpen] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const [isDesktopLoginOpen, setIsDesktopLoginOpen] = useState(false);
  const [isDesktopSignupOpen, setIsDesktopSignupOpen] = useState(false);

  // Close guest prompt and open modals when navigating to auth pages on desktop
  useEffect(() => {
    if (isDesktopViewport) {
      if (routeLocation.pathname === "/login") {
        setIsDesktopLoginOpen(true);
        navigate("/", { replace: true });
      } else if (routeLocation.pathname === "/signup") {
        setIsDesktopSignupOpen(true);
        navigate("/", { replace: true });
      }
    }
    setIsGuestPromptOpen(false);
  }, [routeLocation.pathname, isDesktopViewport]);

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
      if (isDesktopViewport) {
        setIsDesktopLoginOpen(true);
      } else {
        setIsGuestPromptOpen(true);
      }
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

  useLayoutEffect(() => {
    const syncViewport = () => setIsDesktopViewport(window.innerWidth >= 768);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

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
  const addressString = currentLocation?.address || currentLocation?.name;
  const showDetailedAddress = !!addressString && isAuthenticated;
  const promptText = isFetchingLocation ? "Detecting location..." : "Tap to set location";

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
            backgroundImage: buildHeaderGradient(baseHeaderColor, true),
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
            <div className="flex flex-col pt-0.5 pb-2 pr-14 relative">
              <div className="text-[34px] font-black leading-[0.85] tracking-tight text-black">
                zeppe
              </div>
              <div className="mt-2.5 text-[16px] font-bold leading-none tracking-tight text-black/80">
                {deliveryTimeText}
              </div>
              <div className="mt-1.5 mb-1 overflow-hidden relative w-full flex items-center h-[28px] bg-white/10 rounded-md px-2">
                <style>{`
                  @keyframes scrollingTextShine {
                    0% { background-position: 200% center; }
                    100% { background-position: -200% center; }
                  }
                  .text-glass-flare {
                    background: linear-gradient(
                      110deg,
                      rgba(0,0,0,0.85) 0%,
                      rgba(0,0,0,0.85) 40%,
                      #000000 48%,
                      #000000 52%,
                      rgba(0,0,0,0.85) 60%,
                      rgba(0,0,0,0.85) 100%
                    );
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    color: transparent;
                    animation: scrollingTextShine 3s linear infinite;
                    text-shadow: 0px 1px 2px rgba(255,255,255,0.1);
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
                  <span className="text-[14px] font-bold tracking-[0.02em] text-glass-flare">
                    Our favourite offer is back "{featuredOffer?.title || "Sugar"} @ {featuredOffer?.subtitle || "Rs. 1 per Kg*"}"
                  </span>
                </motion.div>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationOpen(true)}
                className="mt-1 mb-1 flex items-center gap-0.5 border-0 bg-transparent p-0 text-left relative z-10 hover:opacity-80 max-w-[260px] sm:max-w-[320px] overflow-hidden">
                {showDetailedAddress ? (
                  <span className="text-[13px] sm:text-[14px] font-medium tracking-wide text-black/95 truncate">
                    {addressString}
                  </span>
                ) : (
                  <>
                    <span className="text-[14px] font-bold uppercase tracking-[0.04em] text-black/90">
                      HOME
                    </span>
                    <span className="text-[12px] font-bold tracking-[0.04em] text-black/90 whitespace-nowrap">
                      - {promptText}
                    </span>
                  </>
                )}
                <ChevronDownIcon sx={{ fontSize: 14, opacity: 0.9, color: "#000000" }} className="shrink-0" />
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
            backgroundImage:
              isDesktopViewport || isScrolled
                ? "none"
                : buildHeaderGradient(baseHeaderColor, false),
            backgroundColor: isDesktopViewport
              ? "#ffffff"
              : isScrolled
                ? baseHeaderColor
                : "transparent",
            transition: "all 0.3s ease"
          }}
          className={cn(
            "w-full z-10 rounded-b-none px-4 pb-0 md:rounded-none md:pt-4 md:pb-3 md:border-b md:border-black/10 transition-all duration-300 border-b-0",
            isScrolled && !isDesktopViewport
              ? "shadow-[0_4px_20px_rgba(0,0,0,0.3)] rounded-b-[24px]"
              : "shadow-none"
          )}>

          {/* Desktop/Tablet Header Layout (md and above) */}
          <div className="mx-auto hidden w-full max-w-[1360px] items-center gap-5 px-1 pb-1 md:flex lg:gap-8">
            <button
              type="button"
              data-lenis-prevent
              data-lenis-prevent-touch
              onClick={() => {
                navigate("/");
                setIsLocationOpen(true);
              }}
              className="flex min-w-[320px] items-center gap-5 border-0 bg-transparent p-0 text-left transition-opacity hover:opacity-90">
              <img
                src={logoUrl}
                alt={`${appName} Logo`}
                className="h-11 w-auto object-contain"
              />
              <div className="border-l border-[#e5e7eb] pl-5">
                <div className="text-[15px] font-extrabold leading-none text-[#111827]">
                  Delivery in {deliveryTimeText.replace(/\bmin\b/i, "minutes")}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[13px] leading-none text-[#111827] max-w-[280px]">
                  {showDetailedAddress ? (
                    <span className="font-medium truncate">{addressString}</span>
                  ) : (
                    <>
                      <span className="font-black uppercase">HOME</span>
                      <span className="font-medium whitespace-nowrap">- {promptText}</span>
                    </>
                  )}
                  <ChevronDownIcon sx={{ fontSize: 14, color: "#111827" }} className="shrink-0" />
                </div>
              </div>
            </button>

            <div className="min-w-0 flex-1">
              <motion.div
                onClick={handleSearchClick}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.99 }}
                style={{ backgroundColor: "#f5f7fb" }}
                className="flex h-12 items-center rounded-xl border border-[#edf0f5] px-4 shadow-none transition-all duration-200 cursor-pointer">
                <SearchIcon sx={{ color: "#6b7280", fontSize: 24 }} />
                <input
                  type="text"
                  placeholder={searchPlaceholder || "Search Products..."}
                  readOnly
                  className="flex-1 bg-transparent border-none outline-none pl-3 text-[#111827] font-medium placeholder:text-[#94a3b8] text-[16px] cursor-pointer"
                />
                <div className="flex items-center gap-2 border-l border-[#e2e8f0] pl-4">
                  <MicIcon sx={{ color: "#6b7280", fontSize: 22 }} />
                </div>
              </motion.div>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <button
                type="button"
                onClick={handleProfileClick}
                className="border-0 bg-transparent px-2 text-[15px] font-semibold text-[#111827] transition-colors hover:text-[#374151]">
                {isAuthenticated ? "Profile" : "Login"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/checkout")}
                className="inline-flex h-12 items-center gap-3 rounded-xl border border-[#edf0f5] bg-[#f5f7fb] px-5 text-[#64748b] transition-colors hover:bg-[#eef2f7]">
                <ShoppingCartOutlinedIcon sx={{ fontSize: 24, color: "#64748b" }} />
                <span className="text-[15px] font-medium text-[#64748b]">
                  My Cart
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Row: 60/40 Split Search & Refer/Earn — sticky compact on scroll */}
          <div className={cn(
            "md:hidden flex items-center gap-2.5 pt-0 pb-0 w-full",
            isScrolled && "pt-2.5"
          )}>
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
                className="no-scrollbar relative z-20 mt-0 flex min-h-[52px] items-center gap-2 overflow-x-auto pt-0 pb-0 scroll-smooth md:hidden border-t-0 border-b-0 shadow-none">
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

      <LocationDrawer
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
      />

      <GuestProfilePrompt
        isOpen={isGuestPromptOpen}
        onClose={() => setIsGuestPromptOpen(false)}
      />

      {isDesktopLoginOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md"
          onClick={() => setIsDesktopLoginOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <CustomerAuth isModal isSignup={false} onClose={() => setIsDesktopLoginOpen(false)} />
          </div>
        </div>
      )}

      {isDesktopSignupOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md"
          onClick={() => setIsDesktopSignupOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <CustomerAuth isModal isSignup={true} onClose={() => setIsDesktopSignupOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default MainLocationHeader;
