import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  ChevronDown,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Heart,
  Snowflake,
  Dog,
  LayoutGrid,
} from "lucide-react";

// MUI Icons (shared with admin & icon selector)
import HomeIcon from "@mui/icons-material/Home";
import DevicesIcon from "@mui/icons-material/Devices";
import LocalGroceryStoreIcon from "@mui/icons-material/LocalGroceryStore";
import KitchenIcon from "@mui/icons-material/Kitchen";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import PetsIcon from "@mui/icons-material/Pets";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
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

import SearchIcon from "@mui/icons-material/Search";
import MicIcon from "@mui/icons-material/Mic";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowRightIcon from "@mui/icons-material/ArrowForwardIos";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VerifiedIcon from "@mui/icons-material/Verified";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import SavingsIcon from "@mui/icons-material/Savings";

import { getIconSvg } from "@/shared/constants/categoryIcons";
import { motion, useScroll, useTransform } from "framer-motion";
import { customerApi } from "../services/customerApi";
import { toast } from "sonner";
import ProductCard from "../components/shared/ProductCard";
import MainLocationHeader from "../components/shared/MainLocationHeader";
import {
  HeaderCategoryVisual,
  VISUAL_IMAGES,
  getHeaderCategoryVisualMeta,
} from "@/shared/constants/headerCategoryVisuals";
import { useProductDetail } from "../context/ProductDetailContext";
import { cn } from "@/lib/utils";
import QuickCategoriesBg from "@/assets/Catagorysection_bg.png";
import HealthBanner from "@/assets/HealthBanner.png";
import SectionRenderer from "../components/experience/SectionRenderer";
import ExperienceBannerCarousel from "../components/experience/ExperienceBannerCarousel";
import { useLocation } from "../context/LocationContext";
import { useSettings } from "@core/context/SettingsContext";
import Lottie from "lottie-react";
import noServiceAnimation from "@/assets/lottie/animation.json";
import {
  getSideImageByKey,
  getBackgroundColorByValue,
  getBackgroundGradientByValue,
} from "@/shared/constants/offerSectionOptions";
import { resolveStoreLogo } from "../utils/storeVisuals";
import { mixHexColors, shiftHex } from "../utils/headerTheme";
import { getCategoryImage } from "@/shared/constants/categoryImageMap";

const DEFAULT_CATEGORY_THEME = {
  gradient: "linear-gradient(to bottom, #7B4419, #9D5C3A)",
  shadow: "shadow-amber-700/20",
  accent: "text-[#1A1A1A]",
};

const CATEGORY_METADATA = {
  All: {
    icon: HomeIcon,
    theme: DEFAULT_CATEGORY_THEME,
    banner: {
      title: "HOUSEFULL",
      subtitle: "SALE",
      floatingElements: "sparkles",
    },
  },
  Grocery: {
    icon: LocalGroceryStoreIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #FF9F1C, #FFBF69)",
      shadow: "shadow-orange-500/20",
      accent: "text-orange-900",
    },
    banner: {
      title: "SUPERSAVER",
      subtitle: "FRESH & FAST",
      floatingElements: "leaves",
    },
  },
  Wedding: {
    icon: CardGiftcardIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #FF4D6D, #FF8FA3)",
      shadow: "shadow-rose-500/20",
      accent: "text-rose-900",
    },
    banner: { title: "WEDDING", subtitle: "BLISS", floatingElements: "hearts" },
  },
  "Home & Kitchen": {
    icon: KitchenIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #BC6C25, #DDA15E)",
      shadow: "shadow-amber-500/20",
      accent: "text-amber-900",
    },
    banner: { title: "HOME", subtitle: "KITCHEN", floatingElements: "smoke" },
  },
  Electronics: {
    icon: DevicesIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #7209B7, #B5179E)",
      shadow: "shadow-purple-500/20",
      accent: "text-purple-900",
    },
    banner: {
      title: "TECH FEST",
      subtitle: "GADGETS",
      floatingElements: "tech",
    },
  },
  Kids: {
    icon: ChildCareIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #4CC9F0, #A0E7E5)",
      shadow: "shadow-blue-500/20",
      accent: "text-blue-900",
    },
    banner: {
      title: "LITTLE ONE",
      subtitle: "CARE",
      floatingElements: "bubbles",
    },
  },
  "Pet Supplies": {
    icon: PetsIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #FB8500, #FFB703)",
      shadow: "shadow-yellow-500/20",
      accent: "text-yellow-900",
    },
    banner: { title: "PAWSOME", subtitle: "DEALS", floatingElements: "bones" },
  },
  Sports: {
    icon: SportsSoccerIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #4361EE, #4895EF)",
      shadow: "shadow-indigo-500/20",
      accent: "text-indigo-900",
    },
    banner: { title: "SPORTS", subtitle: "GEAR", floatingElements: "confetti" },
  },
};

const ALL_CATEGORY = {
  id: "all",
  _id: "all",
  name: "All",
  icon: LayoutGrid,
  image: VISUAL_IMAGES.all,
  headerVisualKey: "all",
  theme: DEFAULT_CATEGORY_THEME,
  banner: {
    title: "HOUSEFULL",
    subtitle: "SALE",
    floatingElements: "sparkles",
    textColor: "text-white",
  },
};

const categories = [
  {
    id: 1,
    name: "All",
    icon: HomeIcon,
    theme: DEFAULT_CATEGORY_THEME,
    banner: {
      title: "HOUSEFULL",
      subtitle: "SALE",
      floatingElements: "sparkles",
      textColor: "text-white",
    },
  },
  {
    id: 5,
    name: "Electronics",
    icon: DevicesIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #7209B7, #B5179E)",
      shadow: "shadow-purple-500/20",
      accent: "text-purple-900",
    },
    banner: {
      title: "TECH FEST",
      subtitle: "GADGETS",
      floatingElements: "tech",
      textColor: "text-white",
    },
  },
  {
    id: 2,
    name: "Grocery",
    icon: LocalGroceryStoreIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #FF9F1C, #FFBF69)",
      shadow: "shadow-orange-500/20",
      accent: "text-orange-900",
    },
    banner: {
      title: "SUPERSAVER",
      subtitle: "FRESH & FAST",
      floatingElements: "leaves",
      textColor: "text-white",
    },
  },
  {
    id: 10,
    name: "Home & Kitchen",
    icon: KitchenIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #BC6C25, #DDA15E)",
      shadow: "shadow-amber-500/20",
      accent: "text-amber-900",
    },
    banner: {
      title: "HOME",
      subtitle: "KITCHEN",
      floatingElements: "smoke",
      textColor: "text-white",
    },
  },
  {
    id: 7,
    name: "Kids",
    icon: ChildCareIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #4CC9F0, #A0E7E5)",
      shadow: "shadow-blue-500/20",
      accent: "text-blue-900",
    },
    banner: {
      title: "LITTLE ONE",
      subtitle: "CARE",
      floatingElements: "bubbles",
      textColor: "text-white",
    },
  },
  {
    id: 8,
    name: "Pet Supplies",
    icon: PetsIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #FB8500, #FFB703)",
      shadow: "shadow-yellow-500/20",
      accent: "text-yellow-900",
    },
    banner: {
      title: "PAWSOME",
      subtitle: "DEALS",
      floatingElements: "bones",
      textColor: "text-white",
    },
  },
  {
    id: 11,
    name: "Sports",
    icon: SportsSoccerIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #4361EE, #4895EF)",
      shadow: "shadow-indigo-500/20",
      accent: "text-indigo-900",
    },
    banner: {
      title: "SPORTS",
      subtitle: "GEAR",
      floatingElements: "confetti",
      textColor: "text-white",
    },
  },
  {
    id: 3,
    name: "Wedding",
    icon: CardGiftcardIcon,
    theme: {
      gradient: "linear-gradient(to bottom, #FF4D6D, #FF8FA3)",
      shadow: "shadow-rose-500/20",
      accent: "text-rose-900",
    },
    banner: {
      title: "WEDDING",
      subtitle: "BLISS",
      floatingElements: "hearts",
      textColor: "text-white",
    },
  },
];

// Map icon ids saved from admin/category icon selector to MUI icons
const ICON_COMPONENTS = {
  electronics: DevicesIcon,
  fashion: CheckroomIcon,
  home: HomeIcon,
  food: LocalCafeIcon,
  sports: SportsSoccerIcon,
  books: MenuBookIcon,
  beauty: SpaIcon,
  toys: ToysIcon,
  automotive: DirectionsCarIcon,
  pets: PetsIcon,
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
};

const bestsellerCategories = [
  {
    id: 1,
    name: "Chips & Namkeen",
    images: [
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1613919113640-25732ec5e61f?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1599490659223-e1539e76926a?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1621444541669-451006c1103d?auto=format&fit=crop&q=80&w=200&h=200",
    ],
  },
  {
    id: 2,
    name: "Bakery & Biscuits",
    images: [
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1581339399838-2a120c18bba3?auto=format&fit=crop&q=80&w=200&h=200",
    ],
  },
  {
    id: 3,
    name: "Vegetable & Fruits",
    images: [
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1518843025960-d70213740685?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&q=80&w=200&h=200",
    ],
  },
  {
    id: 4,
    name: "Oil, Ghee & Masala",
    images: [
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1596797038558-9c50f16ee64b?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1472141521881-95d0e87e2e39?auto=format&fit=crop&q=80&w=200&h=200",
    ],
  },
  {
    id: 5,
    name: "Sweet & Chocolates",
    images: [
      "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1526081347589-7fa3cb419ee7?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1542841791-192d99906b27?auto=format&fit=crop&q=80&w=200&h=200",
    ],
  },
  {
    id: 6,
    name: "Drinks & Juices",
    images: [
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1625772290748-39126cdd9fe9?auto=format&fit=crop&q=80&w=200&h=200",
      "https://images.unsplash.com/photo-1544145945-f904253db0ad?auto=format&fit=crop&q=80&w=200&h=200",
    ],
  },
];

const MARQUEE_MESSAGES = [
  "24/7 Delivery",
  "Minimum Order ₹99",
  "Save Big on Essentials!",
];

const DRY_FRUITS_DISCOVERY_KEYWORDS = [
  "dry fruit",
  "dry fruits",
  "almond",
  "almonds",
  "cashew",
  "cashews",
  "kishmish",
  "raisin",
  "raisins",
  "pista",
  "dates",
  "anjeer",
  "fig",
  "walnut",
  "nuts",
  "seeds",
  "makhana",
];

const SPECIAL_TILE_COLOR_PALETTES = [
  ["#c63f2f", "#f3d8c5", "#9f2d1f"],
  ["#f0a12c", "#f8e1a8", "#b96e00"],
  ["#3e3a39", "#e8ddd1", "#1f1a18"],
  ["#2d8a4d", "#d6edd4", "#1f6136"],
];

const encodeTileSvg = (svgMarkup) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarkup)}`;

const getTileLabelMonogram = (label = "") =>
  label
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "SP";

const buildStapleTileImage = (label, paletteIndex = 0) => {
  const [primaryColor, surfaceColor, accentColor] =
    SPECIAL_TILE_COLOR_PALETTES[paletteIndex % SPECIAL_TILE_COLOR_PALETTES.length];
  const monogram = getTileLabelMonogram(label);

  return encodeTileSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="packTop" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${primaryColor}" />
          <stop offset="100%" stop-color="${accentColor}" />
        </linearGradient>
        <linearGradient id="packBody" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="${surfaceColor}" />
        </linearGradient>
      </defs>
      <rect x="34" y="14" width="92" height="132" rx="18" fill="url(#packBody)" />
      <rect x="34" y="14" width="92" height="24" rx="18" fill="url(#packTop)" />
      <rect x="34" y="28" width="92" height="12" fill="url(#packTop)" />
      <rect x="44" y="50" width="72" height="62" rx="12" fill="#fffdf8" />
      <rect x="54" y="120" width="52" height="8" rx="4" fill="${primaryColor}" opacity="0.16" />
      <text x="80" y="90" text-anchor="middle" font-size="28" font-weight="800" font-family="Arial, sans-serif" fill="${primaryColor}">
        ${monogram}
      </text>
      <text x="80" y="109" text-anchor="middle" font-size="11" font-weight="700" font-family="Arial, sans-serif" fill="${accentColor}">
        ${label.slice(0, 12).toUpperCase()}
      </text>
    </svg>
  `);
};

const SHOWCASE_PRODUCT_PALETTES = [
  { bg: "#fff8ef", panel: "#ffffff", accent: "#222222", soft: "#f59e0b" },
  { bg: "#f6f7fb", panel: "#ffffff", accent: "#2563eb", soft: "#c2410c" },
  { bg: "#fff7f3", panel: "#ffffff", accent: "#0f766e", soft: "#dc2626" },
  { bg: "#f7fbf7", panel: "#ffffff", accent: "#166534", soft: "#f59e0b" },
];

const buildShowcaseProductImage = ({
  brand = "",
  label = "",
  kind = "pack",
  paletteIndex = 0,
}) => {
  const palette =
    SHOWCASE_PRODUCT_PALETTES[
      paletteIndex % SHOWCASE_PRODUCT_PALETTES.length
    ];

  const artMarkup = {
    lighter: `
      <rect x="10" y="22" width="58" height="88" rx="10" fill="#ffffff" stroke="#d9e0e8"/>
      <rect x="18" y="30" width="42" height="18" rx="4" fill="#f3f4f6"/>
      <text x="39" y="42" text-anchor="middle" font-size="7" font-weight="800" fill="#4b5563" font-family="Arial, sans-serif">LIGHTER</text>
      <rect x="28" y="60" width="22" height="38" rx="7" fill="#1f2937"/>
      <rect x="31" y="55" width="16" height="13" rx="4" fill="#9ca3af"/>
      <rect x="25" y="99" width="28" height="5" rx="2.5" fill="${palette.soft}" opacity="0.55"/>
    `,
    knives: `
      <rect x="10" y="20" width="58" height="92" rx="10" fill="#fbfbfc" stroke="#d8dce4"/>
      <path d="M22 28 L28 28 L26 68 L18 68 Z" fill="#dbe4ee"/>
      <path d="M40 28 L46 28 L44 68 L36 68 Z" fill="#dbe4ee"/>
      <path d="M58 28 L64 28 L62 68 L54 68 Z" fill="#dbe4ee"/>
      <rect x="17" y="68" width="10" height="30" rx="5" fill="#ef4444"/>
      <rect x="35" y="68" width="10" height="30" rx="5" fill="#f59e0b"/>
      <rect x="53" y="68" width="10" height="30" rx="5" fill="#111827"/>
    `,
    knifebox: `
      <g transform="translate(8 18) rotate(-11 32 34)">
        <rect x="8" y="18" width="58" height="54" rx="8" fill="#111827"/>
        <rect x="12" y="24" width="50" height="16" rx="5" fill="#2c3341"/>
        <rect x="18" y="48" width="36" height="4" rx="2" fill="#e5e7eb"/>
        <rect x="18" y="56" width="24" height="3" rx="1.5" fill="#9ca3af"/>
        <rect x="44" y="52" width="12" height="10" rx="3" fill="#ef4444"/>
      </g>
    `,
    foil: `
      <rect x="8" y="56" width="62" height="18" rx="6" fill="#dc2626"/>
      <rect x="57" y="56" width="13" height="18" rx="0 6 6 0" fill="#fbbf24"/>
      <rect x="13" y="60" width="28" height="4" rx="2" fill="#fef2f2"/>
      <rect x="13" y="67" width="24" height="3" rx="1.5" fill="#fee2e2"/>
      <rect x="43" y="60" width="10" height="10" rx="3" fill="#fde68a"/>
    `,
    wrap: `
      <rect x="8" y="56" width="62" height="14" rx="7" fill="#22c55e"/>
      <rect x="50" y="56" width="20" height="14" rx="7" fill="#f59e0b"/>
      <rect x="14" y="60" width="22" height="3" rx="1.5" fill="#ecfdf5"/>
      <rect x="38" y="60" width="10" height="3" rx="1.5" fill="#bbf7d0"/>
    `,
    ricebag: `
      <rect x="16" y="16" width="46" height="94" rx="10" fill="#ffffff" stroke="#d6dce6"/>
      <rect x="16" y="16" width="46" height="20" rx="10" fill="#1d4ed8"/>
      <rect x="20" y="22" width="38" height="8" rx="4" fill="#ffffff" opacity="0.2"/>
      <rect x="22" y="46" width="34" height="38" rx="8" fill="#fef3c7"/>
      <path d="M28 74 C32 56 42 56 48 74" stroke="#92400e" stroke-width="3" fill="none"/>
      <circle cx="39" cy="67" r="11" fill="#fff7ed" opacity="0.45"/>
    `,
    drinkbox: `
      <rect x="18" y="18" width="42" height="90" rx="10" fill="#fff7ed" stroke="#f4d7a6"/>
      <rect x="18" y="18" width="42" height="20" rx="10" fill="#b91c1c"/>
      <circle cx="39" cy="62" r="14" fill="#dcfce7"/>
      <path d="M31 62 q8 -12 16 0 q-8 12 -16 0Z" fill="#86efac"/>
      <rect x="27" y="82" width="24" height="8" rx="4" fill="#f59e0b" opacity="0.45"/>
    `,
    platter: `
      <circle cx="39" cy="62" r="28" fill="#854d0e"/>
      <circle cx="39" cy="62" r="22" fill="#fde68a"/>
      <path d="M39 40 L39 84" stroke="#92400e" stroke-width="3"/>
      <path d="M17 62 L61 62" stroke="#92400e" stroke-width="3"/>
      <path d="M24 47 L54 77" stroke="#92400e" stroke-width="3"/>
      <path d="M54 47 L24 77" stroke="#92400e" stroke-width="3"/>
      <circle cx="39" cy="62" r="4" fill="#92400e"/>
    `,
    chilli: `
      <path d="M20 72 q10 -18 22 -10 q-3 15 -18 18 q-7 1 -4 -8Z" fill="#16a34a"/>
      <path d="M34 60 q12 -16 24 -6 q-2 12 -16 16 q-11 3 -8 -10Z" fill="#22c55e"/>
      <path d="M16 68 q4 -6 9 -8" stroke="#166534" stroke-width="3" fill="none"/>
      <path d="M31 57 q4 -6 9 -8" stroke="#166534" stroke-width="3" fill="none"/>
      <circle cx="27" cy="74" r="2" fill="#15803d"/>
    `,
    sweetbox: `
      <rect x="14" y="24" width="50" height="72" rx="10" fill="#fef3c7" stroke="#f59e0b"/>
      <rect x="14" y="24" width="50" height="14" rx="10" fill="#dc2626"/>
      <circle cx="28" cy="56" r="7" fill="#fde68a"/>
      <circle cx="40" cy="56" r="7" fill="#f59e0b"/>
      <circle cx="52" cy="56" r="7" fill="#fcd34d"/>
      <circle cx="28" cy="72" r="7" fill="#fbbf24"/>
      <circle cx="40" cy="72" r="7" fill="#fde68a"/>
      <circle cx="52" cy="72" r="7" fill="#f59e0b"/>
    `,
    cerealbox: `
      <rect x="16" y="18" width="44" height="90" rx="8" fill="#ef4444"/>
      <rect x="22" y="28" width="32" height="20" rx="5" fill="#fff7ed"/>
      <rect x="24" y="54" width="28" height="18" rx="6" fill="#fde68a"/>
      <circle cx="33" cy="66" r="4" fill="#92400e"/>
      <circle cx="43" cy="62" r="4" fill="#b45309"/>
      <circle cx="39" cy="74" r="3" fill="#f59e0b"/>
      <rect x="24" y="82" width="28" height="8" rx="4" fill="#fee2e2"/>
    `,
    chocos: `
      <rect x="16" y="18" width="44" height="90" rx="8" fill="#92400e"/>
      <rect x="22" y="28" width="32" height="20" rx="5" fill="#fef3c7"/>
      <circle cx="39" cy="67" r="14" fill="#fff7ed"/>
      <circle cx="35" cy="65" r="4" fill="#78350f"/>
      <circle cx="43" cy="70" r="4" fill="#a16207"/>
      <rect x="25" y="84" width="28" height="8" rx="4" fill="#fbbf24" opacity="0.35"/>
    `,
    oatspack: `
      <rect x="16" y="18" width="44" height="90" rx="10" fill="#f59e0b"/>
      <rect x="22" y="28" width="32" height="18" rx="5" fill="#fff7ed"/>
      <rect x="25" y="52" width="26" height="20" rx="8" fill="#ffffff"/>
      <rect x="25" y="78" width="26" height="12" rx="6" fill="#fef3c7"/>
    `,
    daliyabox: `
      <rect x="16" y="18" width="44" height="90" rx="8" fill="#f7efe7" stroke="#ead8ca"/>
      <rect x="22" y="28" width="32" height="22" rx="5" fill="#ede9fe"/>
      <rect x="24" y="55" width="28" height="28" rx="10" fill="#ddd6fe"/>
      <rect x="28" y="69" width="20" height="10" rx="5" fill="#fde68a"/>
    `,
    jar: `
      <rect x="24" y="26" width="30" height="70" rx="10" fill="#fff7ed" stroke="#d6d3d1"/>
      <rect x="28" y="16" width="22" height="14" rx="4" fill="#dc2626"/>
      <rect x="29" y="42" width="20" height="30" rx="6" fill="#fcd34d" opacity="0.65"/>
      <rect x="31" y="49" width="16" height="16" rx="5" fill="#b45309" opacity="0.22"/>
    `,
    default: `
      <rect x="16" y="18" width="46" height="92" rx="10" fill="${palette.panel}" stroke="#d6dce6"/>
      <rect x="16" y="18" width="46" height="20" rx="10" fill="${palette.soft}"/>
      <rect x="24" y="52" width="30" height="24" rx="8" fill="${palette.bg}"/>
    `,
  }[kind] || "";

  return encodeTileSvg(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 78 126" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="bgFade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="${palette.bg}"/>
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.12"/>
        </filter>
      </defs>
      <rect width="78" height="126" rx="18" fill="url(#bgFade)" />
      <rect x="6" y="8" width="66" height="110" rx="16" fill="${palette.panel}" filter="url(#softShadow)" />
      <path d="M12 14 H66" stroke="#f3f4f6" stroke-width="1.5"/>
      ${artMarkup}
      <text x="14" y="16" font-size="7" font-weight="800" font-family="Arial, sans-serif" fill="${palette.accent}">
        ${brand.slice(0, 14).toUpperCase()}
      </text>
    </svg>
  `);
};

const DEFAULT_DISCOVERY_TILE_IMAGE = buildStapleTileImage("Special");
const KITCHEN_TOOL_IMAGES = {
  gasLighter:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Gas%20stove%20lighter..jpg",
  knifeSet:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Chef-knives.jpg",
  clingFilm:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Clingfilm.jpg",
  clingFilmShelf:
    "https://commons.wikimedia.org/wiki/Special:FilePath/Cling%20film%20on%20a%20shelf.jpg",
  foilRoll:
    "https://commons.wikimedia.org/wiki/Special:FilePath/A%20roll%20of%20aluminum%20foil.jpg",
};
const DAILY_GROCERY_IMAGES = {
  rice:
    "https://images.unsplash.com/photo-1586985289688-cacf35b67f47?auto=format&fit=crop&q=80&w=600&h=900",
  thandai:
    "https://images.unsplash.com/photo-1599599810694-b5ac4dd64e1d?auto=format&fit=crop&q=80&w=600&h=900",
  dryFruitHamper:
    "https://images.unsplash.com/photo-1585239852251-5a264af6f1c5?auto=format&fit=crop&q=80&w=600&h=900",
  greenChilli:
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600&h=900",
  sweets:
    "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?auto=format&fit=crop&q=80&w=600&h=900",
};
const CEREALS_NUTS_IMAGES = {
  muesli:
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&q=80&w=600&h=900",
  chocos:
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600&h=900",
  oats:
    "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&q=80&w=600&h=900",
  combo:
    "https://images.unsplash.com/photo-1571748982800-fa51082c2224?auto=format&fit=crop&q=80&w=600&h=900",
  daliya:
    "https://images.unsplash.com/photo-1576186726580-a310c1f4c0d0?auto=format&fit=crop&q=80&w=600&h=900",
  vermicelli:
    "https://images.unsplash.com/photo-1612960980031-5b5f7d2a9f2f?auto=format&fit=crop&q=80&w=600&h=900",
};

const SPECIAL_TILE_IMAGES = {
  atta:
    "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&q=80&w=600&h=600",
  besan:
    "https://images.unsplash.com/photo-1612257999760-2af2f2fc2e8e?auto=format&fit=crop&q=80&w=600&h=600",
  millet:
    "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&q=80&w=600&h=600",
  moong:
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600&h=600",
  poha:
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600&h=600",
  rajma:
    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=600&h=600",
  rice:
    "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600&h=600",
  toor:
    "https://images.unsplash.com/photo-1627485937980-221c88ac04f9?auto=format&fit=crop&q=80&w=600&h=600",
};

const SPECIAL_DISCOVERY_TILES = [
  {
    name: "Atta",
    query: "atta flour",
    image: SPECIAL_TILE_IMAGES.atta,
    fallbackImage: buildStapleTileImage("Atta", 0),
  },
  {
    name: "Besan, Sooji & Maida",
    query: "besan sooji maida",
    image: SPECIAL_TILE_IMAGES.besan,
    fallbackImage: buildStapleTileImage("Besan", 1),
  },
  {
    name: "Millet & Other Flours",
    query: "millet flour",
    image: SPECIAL_TILE_IMAGES.millet,
    fallbackImage: buildStapleTileImage("Millet", 2),
  },
  {
    name: "Moong & Masoor",
    query: "moong masoor dal",
    image: SPECIAL_TILE_IMAGES.moong,
    fallbackImage: buildStapleTileImage("Moong", 3),
  },
  {
    name: "Poha, Daliya & Others",
    query: "poha daliya",
    image: SPECIAL_TILE_IMAGES.poha,
    fallbackImage: buildStapleTileImage("Poha", 1),
  },
  {
    name: "Rajma, Chhole & Chana",
    query: "rajma chhole chana",
    image: SPECIAL_TILE_IMAGES.rajma,
    fallbackImage: buildStapleTileImage("Rajma", 3),
  },
  {
    name: "Rice",
    query: "rice",
    image: SPECIAL_TILE_IMAGES.rice,
    fallbackImage: buildStapleTileImage("Rice", 0),
  },
  {
    name: "Toor, Urad & Chana",
    query: "toor urad chana dal",
    image: SPECIAL_TILE_IMAGES.toor,
    fallbackImage: buildStapleTileImage("Toor", 2),
  },
];

const MOBILE_SHOWCASE_SECTIONS = [
  {
    id: "kitchen-tools-appliances",
    title: "Kitchen tools & appliances",
    productsLayout: "showcaseGrid",
    hideItemCount: true,
    products: [
      {
        id: "kitchen-lighter-topper",
        name: "topper cook like pro gas lighter",
        query: "gas lighter",
        weight: "1pc",
        price: 100,
        originalPrice: 199,
        discountText: "50% OFF",
        image: KITCHEN_TOOL_IMAGES.gasLighter,
      },
      {
        id: "kitchen-knife-maxsenso",
        name: "Max Senso Kitchen Knife Set",
        query: "kitchen knife set",
        weight: "1pc",
        price: 20,
        originalPrice: 35,
        discountText: "43% OFF",
        image: KITCHEN_TOOL_IMAGES.knifeSet,
      },
      {
        id: "kitchen-lighter-skn",
        name: "Gas Lighter for Kitchen (SKN)",
        query: "kitchen lighter",
        weight: "1 unit",
        price: 80,
        originalPrice: 99,
        badgeText: "Bestseller",
        discountText: "19% OFF",
        image: KITCHEN_TOOL_IMAGES.gasLighter,
      },
      {
        id: "kitchen-superwrap-foil",
        name: "Superwrap Aluminium Foil",
        query: "aluminium foil",
        weight: "1pc",
        price: 85,
        originalPrice: 110,
        discountText: "23% OFF",
        image: KITCHEN_TOOL_IMAGES.foilRoll,
      },
      {
        id: "kitchen-freshwrapp-food",
        name: "Freshwrapp Food Wrapping Film",
        query: "food wrapping film",
        weight: "1pc",
        price: 99,
        originalPrice: 125,
        discountText: "21% OFF",
        image: KITCHEN_TOOL_IMAGES.clingFilm,
      },
      {
        id: "kitchen-freshwrapp-roll",
        name: "Freshwrapp Food Wrapping Roll",
        query: "food wrapping roll",
        weight: "1pc",
        price: 95,
        originalPrice: 120,
        discountText: "21% OFF",
        image: KITCHEN_TOOL_IMAGES.clingFilmShelf,
      },
    ],
  },
  {
    id: "cereals-nuts-showcase",
    title: "Cereals & Nuts",
    productsLayout: "showcaseGrid",
    hideItemCount: true,
    products: [
      {
        id: "cereal-kelloggs-muesli",
        name: "Kellogg's Muesli Fruit Nut Mix",
        query: "kelloggs muesli",
        weight: "500g",
        price: 311,
        originalPrice: 346,
        discountText: "10% OFF",
        image: CEREALS_NUTS_IMAGES.muesli,
      },
      {
        id: "cereal-kelloggs-chocos",
        name: "Kellogg's Multigrain Chocos",
        query: "kelloggs chocos",
        weight: "250g",
        price: 125,
        originalPrice: 136,
        discountText: "8% OFF",
        image: CEREALS_NUTS_IMAGES.chocos,
      },
      {
        id: "cereal-saffola-oats",
        name: "Saffola Masala Oats 500g",
        query: "saffola oats",
        weight: "500g",
        price: 195,
        originalPrice: 220,
        discountText: "11% OFF",
        image: CEREALS_NUTS_IMAGES.oats,
      },
      {
        id: "cereal-saffola-combo",
        name: "Saffola Oats (1kg with 300g pack)",
        query: "saffola oats combo",
        weight: "1.3kg(pack of 1)",
        price: 499,
        originalPrice: 579,
        discountText: "14% OFF",
        image: CEREALS_NUTS_IMAGES.combo,
      },
      {
        id: "cereal-ruchi-daliya",
        name: "Ruchi Daliya Crushed Wheat",
        query: "ruchi daliya",
        weight: "300g",
        price: 59,
        originalPrice: 67,
        discountText: "12% OFF",
        image: CEREALS_NUTS_IMAGES.daliya,
      },
      {
        id: "cereal-ruchi-jar",
        name: "Ruchi Roasted Short Vermicelli",
        query: "ruchi roasted vermicelli",
        weight: "400g",
        price: 89,
        originalPrice: 96,
        discountText: "7% OFF",
        image: CEREALS_NUTS_IMAGES.vermicelli,
      },
    ],
  },
];

const EXTRA_HOME_DISCOVERY_PRESETS = [
  {
    id: "electronics",
    title: "Electronics",
    keywords: [
      "electronics",
      "electronic",
      "mobile",
      "charger",
      "cable",
      "earphone",
      "earphones",
      "earbuds",
      "speaker",
      "headphone",
      "smartwatch",
      "phone",
      "gadget",
      "appliance",
      "appliances",
    ],
    fallbackTiles: [
      { name: "Mobiles", query: "mobile" },
      { name: "Chargers", query: "charger" },
      { name: "Audio", query: "earbuds" },
      { name: "Gadgets", query: "electronics" },
    ],
  },
  {
    id: "special",
    title: "Special",
    keywords: [
      "atta",
      "besan",
      "sooji",
      "maida",
      "millet",
      "flour",
      "moong",
      "masoor",
      "poha",
      "daliya",
      "rajma",
      "chhole",
      "chana",
      "rice",
      "toor",
      "urad",
    ],
    excludedKeywords: ["oil", "bran oil", "fortune"],
    fallbackTiles: SPECIAL_DISCOVERY_TILES,
    useFallbackTilesOnly: true,
    maxTiles: 8,
    tileImageFromProducts: false,
  },

];

const normalizeHomeDiscoveryText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const matchesDiscoveryKeywords = (value, keywords = []) => {
  const normalizedValue = normalizeHomeDiscoveryText(value);
  if (!normalizedValue) return false;

  return keywords.some((keyword) => {
    const normalizedKeyword = normalizeHomeDiscoveryText(keyword);
    return normalizedKeyword && normalizedValue.includes(normalizedKeyword);
  });
};

const isDiscoveryPlaceholderProduct = (product) => {
  const normalizedName = normalizeHomeDiscoveryText(product?.name);
  return normalizedName.startsWith("test");
};

const getHeaderScopedMobileSectionAliases = (sectionId) => {
  switch (sectionId) {
    case "primary-category-discovery":
    case "special":
    case "dry-fruits":
    case "cereals-nuts-showcase":
      return ["grocery"];
    case "electronics":
      return ["electronics"];
    case "kitchen-tools-appliances":
      return ["home kitchen"];
    default:
      return [];
  }
};

const Home = () => {
  const { scrollY } = useScroll();
  const { isOpen: isProductDetailOpen } = useProductDetail();
  const { currentLocation } = useLocation();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const quickCatsRef = useRef(null);

  const [categories, setCategories] = useState([ALL_CATEGORY]);
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [products, setProducts] = useState([]);
  const [categorizedSections, setCategorizedSections] = useState([]);
  const [quickCategories, setQuickCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [experienceSections, setExperienceSections] = useState([]);
  const [headerSections, setHeaderSections] = useState([]);
  const [heroConfig, setHeroConfig] = useState({
    banners: { items: [] },
    categoryIds: [],
  });
  const [mobileBannerIndex, setMobileBannerIndex] = useState(0);
  const [isInstantBannerJump, setIsInstantBannerJump] = useState(false);
  const [categoryMap, setCategoryMap] = useState({});
  const [subcategoryMap, setSubcategoryMap] = useState({});
  const [pendingReturn, setPendingReturn] = useState(null);
  const [offerSections, setOfferSections] = useState([]);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [categoriesBannerIndex, setCategoriesBannerIndex] = useState(0);
  const [isHoveringCategoryBanner, setIsHoveringCategoryBanner] = useState(false);
  const [featuredOffer, setFeaturedOffer] = useState({
    title: "Sugar",
    image: "https://www.fortunefoods.com/wp-content/uploads/2022/12/1kg-front.png",
    subtitle: "Rs. 1 per Kg*",
    description: "On Order above 399",
  });
  const desktopHeroOffer = {
    title: "Sugar",
    image: "https://www.fortunefoods.com/wp-content/uploads/2022/12/1kg-front.png",
    subtitle: "Rs. 1 per Kg*",
    description: "On Order above 399",
  };
  const categoryBannerTouchStartXRef = useRef(null);

  const normalizedActiveHeaderCategory = useMemo(
    () =>
      normalizeHomeDiscoveryText(
        activeCategory?.name || activeCategory?.slug || activeCategory?.id || "",
      ),
    [activeCategory],
  );

  const isAllCategoryActive = useMemo(
    () => !normalizedActiveHeaderCategory || normalizedActiveHeaderCategory === "all",
    [normalizedActiveHeaderCategory],
  );

  const scrollQuickCats = (direction) => {
    if (quickCatsRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      quickCatsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Group categories by type/section
  const groupedCategoryBanners = useMemo(() => {
    if (!quickCategories || quickCategories.length === 0) return [];
    
    const banners = [];
    const categoryGroups = {};
    
    // Group categories by first category or create logical groups
    quickCategories.forEach((cat) => {
      const section = cat.section || cat.parentSection || cat.name?.split(',')[0] || 'Other';
      if (!categoryGroups[section]) {
        categoryGroups[section] = [];
      }
      categoryGroups[section].push(cat);
    });
    
    // Convert to banner format
    Object.entries(categoryGroups).forEach(([sectionName, cats]) => {
      if (cats.length > 0) {
        banners.push({
          id: sectionName,
          name: sectionName,
          categories: cats.slice(0, 6),
        });
      }
    });
    
    // Limit to 7 banners
    return banners.length > 0 ? banners.slice(0, 7) : [];
  }, [quickCategories]);

  const scrollableBannerCategories = useMemo(
    () => categories.filter((category) => category.id !== "all"),
    [categories],
  );

  // Auto-slide carousel (only for All category)
  useEffect(() => {
    if (
      isHoveringCategoryBanner ||
      scrollableBannerCategories.length === 0 ||
      !isAllCategoryActive
    ) {
      return undefined;
    }

    const interval = setInterval(() => {
      setCategoriesBannerIndex(
        (prev) => (prev + 1) % scrollableBannerCategories.length,
      );
    }, 3500);

    return () => clearInterval(interval);
  }, [
    isAllCategoryActive,
    isHoveringCategoryBanner,
    scrollableBannerCategories.length,
  ]);

  useEffect(() => {
    if (scrollableBannerCategories.length === 0) {
      setCategoriesBannerIndex(0);
      return;
    }

    setCategoriesBannerIndex((prev) => prev % scrollableBannerCategories.length);
  }, [scrollableBannerCategories.length]);

  const handleCategoryBannerTouchStart = (event) => {
    categoryBannerTouchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleCategoryBannerTouchEnd = (event) => {
    const startX = categoryBannerTouchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX ?? null;

    categoryBannerTouchStartXRef.current = null;

    if (
      startX == null ||
      endX == null ||
      scrollableBannerCategories.length <= 1
    ) {
      return;
    }

    const swipeDistance = startX - endX;
    if (Math.abs(swipeDistance) < 35) return;

    if (swipeDistance > 0) {
      setCategoriesBannerIndex(
        (prev) => (prev + 1) % scrollableBannerCategories.length,
      );
    } else {
      setCategoriesBannerIndex(
        (prev) =>
          (prev - 1 + scrollableBannerCategories.length) %
          scrollableBannerCategories.length,
      );
    }
  };

  const quickCategoryPalettes = [
    {
      bgFrom: "#ffd96a",
      bgVia: "#ffeaa0",
      bgTo: "#fff0c7",
      glowColor: "rgba(255,184,0,0.18)",
      frameColor: "#f0d98a",
    },
    {
      bgFrom: "#7B4419",
      bgVia: "#a0643a",
      bgTo: "#c08555",
      glowColor: "rgba(123,68,25,0.18)",
      frameColor: "#9d5c3a",
    },
    {
      bgFrom: "#f3a25d",
      bgVia: "#f9c48b",
      bgTo: "#fee0bf",
      glowColor: "rgba(255,139,61,0.16)",
      frameColor: "#efc08e",
    },
    {
      bgFrom: "#b8eff0",
      bgVia: "#d5f7f5",
      bgTo: "#edfdfc",
      glowColor: "rgba(122,215,215,0.16)",
      frameColor: "#b9e5e3",
    },
  ];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const hasValidLocation =
        Number.isFinite(currentLocation?.latitude) &&
        Number.isFinite(currentLocation?.longitude);
      const productParams = { limit: 20 };
      if (hasValidLocation) {
        productParams.lat = currentLocation.latitude;
        productParams.lng = currentLocation.longitude;
      }

      const [catRes, prodRes, expRes, sectionsRes, storesRes] = await Promise.all([
        customerApi.getCategories(),
        hasValidLocation
          ? customerApi.getProducts(productParams)
          : Promise.resolve({ data: { success: true, result: { items: [] } } }),
        customerApi
          .getExperienceSections({ pageType: "home" })
          .catch(() => null),
        hasValidLocation
          ? customerApi
            .getOfferSections({
              lat: currentLocation.latitude,
              lng: currentLocation.longitude,
            })
            .catch(() => ({ data: {} }))
          : Promise.resolve({ data: { results: [] } }),
        hasValidLocation
          ? customerApi
            .getNearbySellers({
              lat: currentLocation.latitude,
              lng: currentLocation.longitude,
            })
            .catch(() => ({ data: { results: [] } }))
          : Promise.resolve({ data: { results: [] } }),
      ]);

      if (storesRes?.data?.success || storesRes?.data?.results) {
        const rawStores = storesRes.data.results || storesRes.data.result || [];
        setNearbyStores(rawStores.slice(0, 9));
      }

      if (catRes.data.success) {
        let dbCats = catRes.data.results || catRes.data.result || [];

        // Build lookup maps for categories & subcategories (used by SectionRenderer)
        const catMap = {};
        const subMap = {};
        dbCats.forEach((c) => {
          if (c.type === "category") {
            catMap[c._id] = c;
          } else if (c.type === "subcategory") {
            subMap[c._id] = c;
          }
        });
        setCategoryMap(catMap);
        setSubcategoryMap(subMap);

        // 1. Process Header Categories (Main Navigation)
        const formattedHeaders = dbCats
          .filter((cat) => cat.type === "header")
          .map((cat) => {
            const catName = cat.name;
            const visualMeta =
              getHeaderCategoryVisualMeta(cat.iconId) ||
              getHeaderCategoryVisualMeta(catName);

            // Find matching category tile for fallback image
            const matchingCategoryTile = dbCats.find(
              (c) =>
                c.type === "category" &&
                (c.name === catName || c.iconId === cat.iconId),
            );

            // Use the new 3D icon for the image fallback
            const visualImage = visualMeta ? VISUAL_IMAGES[visualMeta.id] : null;

            return {
              ...cat,
              id: cat._id,
              iconId: cat.iconId,
              headerVisualKey: visualMeta ? visualMeta.id : "",
              image:
                cat.image ||
                visualImage ||
                matchingCategoryTile?.image ||
                "",
              headerColor: cat.headerColor || null,
              banner: { textColor: "text-white" },
            };
          });

        // 1a. Merge admin-configured "All" header color into the static ALL category
        const allHeaderFromAdmin = formattedHeaders.find(
          (h) =>
            (h.slug && h.slug.toLowerCase() === "all") ||
            (h.name && h.name.toLowerCase() === "all"),
        );

        const mergedAllCategory = allHeaderFromAdmin
          ? {
            ...ALL_CATEGORY,
            headerColor: allHeaderFromAdmin.headerColor || ALL_CATEGORY.headerColor, // Priority to Backend
            icon: allHeaderFromAdmin.icon || ALL_CATEGORY.icon,
            image: allHeaderFromAdmin.image || ALL_CATEGORY.image,
            headerVisualKey: allHeaderFromAdmin.headerVisualKey || ALL_CATEGORY.headerVisualKey || "",
          }
          : ALL_CATEGORY;

        const headersWithoutAll = formattedHeaders.filter(
          (h) =>
            !(
              (h.slug && h.slug.toLowerCase() === "all") ||
              (h.name && h.name.toLowerCase() === "all")
            ),
        );

        setCategories([mergedAllCategory, ...headersWithoutAll]);

        // If active category is "All", keep it in sync with admin color updates
        setActiveCategory((prev) =>
          !prev || prev._id === "all" ? mergedAllCategory : prev,
        );

        // If we have a stored header to restore (coming back from a category page), set it
        const stored = window.sessionStorage.getItem("experienceReturn");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.headerId) {
              const match = formattedHeaders.find(
                (h) => h._id === parsed.headerId,
              );
              if (match) setActiveCategory(match);
            }
          } catch (e) { }
        }

        // 2. Process Hierarchical Category Sections (Level 2 Main Categories & Level 3 Subcategories)
        const mainCategories = dbCats.filter((cat) => cat.type === "category");
        const subCategories = dbCats.filter((cat) => cat.type === "subcategory");

        const hierarchy = mainCategories
          .map((mc) => ({
            ...mc,
            subcategories: subCategories.filter((sc) => {
              const pId = sc.parentId?._id || sc.parentId || sc.categoryId?._id || sc.categoryId;
              return pId === mc._id;
            }),
          }))
          .filter((section) => section.subcategories.length > 0)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        setCategorizedSections(hierarchy);

        // 2a. Legacy Quick Navigation (Compatibility)
        const formattedQuickCats = mainCategories.map((cat) => ({
          id: cat._id,
          name: cat.name,
          image: cat.image || "https://cdn-icons-png.flaticon.com/128/2321/2321831.png",
        }));
        setQuickCategories(formattedQuickCats);
      }

      if (prodRes.data.success) {
        const rawResult = prodRes.data.result;
        const dbProds = Array.isArray(prodRes.data.results)
          ? prodRes.data.results
          : Array.isArray(rawResult?.items)
            ? rawResult.items
            : Array.isArray(rawResult)
              ? rawResult
              : [];

        const formattedProds = dbProds.map((p) => ({
          ...p,
          id: p._id,
          image:
            p.mainImage ||
            p.image ||
            "https://images.unsplash.com/photo-1550989460-0adf9ea622e2",
          price: p.salePrice || p.price,
          originalPrice: p.price,
          weight: p.weight || "1 unit",
          deliveryTime: "8-15 mins",
        }));
        setProducts(formattedProds);
      }

      if (expRes && expRes.data && expRes.data.success) {
        const raw = expRes.data.result || expRes.data.results || expRes.data;
        setExperienceSections(Array.isArray(raw) ? raw : []);
      } else {
        setExperienceSections([]);
      }

      const sectionsList =
        sectionsRes?.data?.results ||
        sectionsRes?.data?.result ||
        sectionsRes?.data;
      setOfferSections(Array.isArray(sectionsList) ? sectionsList : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch: Consolidate storage check and API calls to prevent double fetching
  useEffect(() => {
    fetchData();
  }, [currentLocation?.latitude, currentLocation?.longitude]); // Refetch when location changes

  // Listen for category color updates from admin panel
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'categoriesRefresh') {
        // Categories were updated, re-fetch them
        fetchData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch header-specific experience sections when active header category changes
  useEffect(() => {
    const fetchHeaderSections = async () => {
      if (!activeCategory || activeCategory._id === "all") {
        setHeaderSections([]);
        return;
      }
      try {
        const res = await customerApi.getExperienceSections({
          pageType: "header",
          headerId: activeCategory._id,
        });
        if (res.data.success) {
          const raw = res.data.result || res.data.results || res.data;
          setHeaderSections(Array.isArray(raw) ? raw : []);
        } else {
          setHeaderSections([]);
        }
      } catch (e) {
        console.error("Error fetching header experience sections:", e);
        setHeaderSections([]);
      }
    };

    fetchHeaderSections();
  }, [activeCategory]);

  // Fetch featured offer for active category
  useEffect(() => {
    const fetchFeaturedOffer = async () => {
      if (!activeCategory) {
        setFeaturedOffer({
          title: "Sugar",
          image: "https://www.fortunefoods.com/wp-content/uploads/2022/12/1kg-front.png",
          subtitle: "Rs. 1 per Kg*",
          description: "On Order above 399",
        });
        return;
      }

      try {
        // Fetch top product from active category
        const res = await customerApi.getProducts({
          limit: 1,
          headerId: activeCategory._id !== "all" ? activeCategory._id : undefined,
        });

        if (res.data?.success && res.data?.result?.items?.length > 0) {
          const product = res.data.result.items[0];
          setFeaturedOffer({
            title: product.name || activeCategory.name,
            image: product.image || product.thumbImage || activeCategory.image || "https://www.fortunefoods.com/wp-content/uploads/2022/12/1kg-front.png",
            subtitle: product.price ? `Rs. ${Math.floor(product.price)} per unit` : "Special Offer",
            description: product.description?.substring(0, 50) || "Limited time offer",
          });
        } else {
          // Fallback to category-based offer
          setFeaturedOffer({
            title: activeCategory.name,
            image: activeCategory.image || "https://www.fortunefoods.com/wp-content/uploads/2022/12/1kg-front.png",
            subtitle: "Exclusive Deals",
            description: "Shop now for best prices",
          });
        }
      } catch (error) {
        console.error("Error fetching featured offer:", error);
        setFeaturedOffer({
          title: activeCategory.name || "All Offers",
          image: activeCategory.image || "https://www.fortunefoods.com/wp-content/uploads/2022/12/1kg-front.png",
          subtitle: "Exclusive Deals",
          description: "Shop now for best prices",
        });
      }
    };

    fetchFeaturedOffer();
  }, [activeCategory]);

  // Fetch hero config (separate from experience sections): header first, then fallback to home
  useEffect(() => {
    const fetchHeroConfig = async () => {
      try {
        const isHeader = activeCategory && activeCategory._id !== "all";
        let payload = null;
        if (isHeader) {
          const res = await customerApi.getHeroConfig({
            pageType: "header",
            headerId: activeCategory._id,
          });
          if (res.data?.success && res.data?.result) {
            payload = res.data.result;
          }
        }
        if (
          !payload ||
          (payload.banners?.items?.length === 0 && !payload.categoryIds?.length)
        ) {
          const homeRes = await customerApi.getHeroConfig({ pageType: "home" });
          if (homeRes.data?.success && homeRes.data?.result) {
            payload = homeRes.data.result;
          }
        }
        setHeroConfig(
          payload &&
            (payload.banners?.items?.length > 0 ||
              payload.categoryIds?.length > 0)
            ? {
              banners: payload.banners || { items: [] },
              categoryIds: payload.categoryIds || [],
            }
            : { banners: { items: [] }, categoryIds: [] },
        );
      } catch (e) {
        console.error("Error fetching hero config:", e);
        setHeroConfig({ banners: { items: [] }, categoryIds: [] });
      }
    };

    fetchHeroConfig();
  }, [activeCategory]);

  // Autoplay for Mobile Banner Carousel
  useEffect(() => {
    const totalSlides = 7; // 7 banners
    const intervalId = setInterval(() => {
      setMobileBannerIndex((prev) => {
        if (prev >= totalSlides - 1) return 0;
        return prev + 1;
      });
    }, 3500);

    return () => clearInterval(intervalId);
  }, []);

  // After an instant jump back to first slide, re‑enable transition
  useEffect(() => {
    if (!isInstantBannerJump) return;
    const id = requestAnimationFrame(() => setIsInstantBannerJump(false));
    return () => cancelAnimationFrame(id);
  }, [isInstantBannerJump]);

  const handleBannerTransitionEnd = () => {
    const totalSlides = 7;
    if (mobileBannerIndex === totalSlides - 1) {
      setMobileBannerIndex(0);
    }
  };

  const bestsellerCategories = useMemo(() => {
    // Group products by category and take top 4 images for each
    const grouped = {};
    products.forEach((p) => {
      const catId = p.categoryId?._id || "other";
      const catName = p.categoryId?.name || "Other";
      if (!grouped[catId]) {
        grouped[catId] = { id: catId, name: catName, images: [] };
      }
      if (grouped[catId].images.length < 4) {
        grouped[catId].images.push(p.image);
      }
    });
    return Object.values(grouped).slice(0, 6);
  }, [products]);

  // Filtered sections based on Active Header Category
  const filteredCategorizedSections = useMemo(() => {
    if (!activeCategory || activeCategory._id === "all") return categorizedSections;
    return categorizedSections.filter((section) => {
      const pId = section.parentId?._id || section.parentId;
      return pId === activeCategory._id;
    });
  }, [activeCategory, categorizedSections]);

  const productsById = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      map[p._id || p.id] = p;
    });
    return map;
  }, [products]);

  // Quick categories: Always show full list (ignoring admin limit if user wants all)
  const effectiveQuickCategories = useMemo(() => {
    return quickCategories;
  }, [quickCategories]);

  const browseEntries = useMemo(() => {
    const seenNames = new Set();
    const entries = [];

    filteredCategorizedSections.forEach((section) => {
      (section.subcategories || []).forEach((sub) => {
        const normalizedName = normalizeHomeDiscoveryText(sub.name);
        if (!normalizedName || seenNames.has(normalizedName)) return;

        seenNames.add(normalizedName);
        entries.push({
          id: sub._id,
          name: sub.name,
          image:
            sub.image ||
            getCategoryImage(sub.name) ||
            "https://cdn-icons-png.flaticon.com/128/2321/2321831.png",
          targetPath: `/category/${section._id}`,
          targetState: { activeSubcategoryId: sub._id },
          matchText: sub.name,
        });
      });
    });

    effectiveQuickCategories.forEach((cat) => {
      const normalizedName = normalizeHomeDiscoveryText(cat.name);
      if (!normalizedName || seenNames.has(normalizedName)) return;

      seenNames.add(normalizedName);
      entries.push({
        id: cat.id,
        name: cat.name,
        image:
          cat.image ||
          getCategoryImage(cat.name) ||
          "https://cdn-icons-png.flaticon.com/128/2321/2321831.png",
        targetPath: `/category/${cat.id}`,
        targetState: undefined,
        matchText: cat.name,
      });
    });

    return entries;
  }, [effectiveQuickCategories, filteredCategorizedSections]);

  const mobileHomeTiles = useMemo(() => {
    const seenIds = new Set();
    const subcategoryTiles = filteredCategorizedSections
      .flatMap((section) =>
        (section.subcategories || []).map((sub) => ({
          id: sub._id,
          name: sub.name,
          image:
            sub.image ||
            getCategoryImage(sub.name) ||
            "https://cdn-icons-png.flaticon.com/128/2321/2321831.png",
          targetPath: `/category/${section._id}`,
          targetState: { activeSubcategoryId: sub._id },
        })),
      )
      .filter((tile) => {
        if (!tile.id || seenIds.has(tile.id)) return false;
        seenIds.add(tile.id);
        return true;
      });

    if (subcategoryTiles.length > 0) {
      return subcategoryTiles.slice(0, 8);
    }

    return effectiveQuickCategories.slice(0, 8).map((cat) => ({
      id: cat.id,
      name: cat.name,
      image:
        cat.image ||
        getCategoryImage(cat.name) ||
        "https://cdn-icons-png.flaticon.com/128/2321/2321831.png",
      targetPath: `/category/${cat.id}`,
      targetState: undefined,
    }));
  }, [effectiveQuickCategories, filteredCategorizedSections]);

  const mobileDiscoverySections = useMemo(() => {
    const primarySections = mobileHomeTiles.length
      ? [
          {
            id: "primary-category-discovery",
            title: "Daily Grocery & Kirana",
            tiles: mobileHomeTiles,
            products: [],
          },
        ]
      : [];

    const derivedSections = EXTRA_HOME_DISCOVERY_PRESETS.map((preset) => {
      const maxTiles = preset.maxTiles || 4;
      const productKeywords = preset.productKeywords || preset.keywords;
      const matchedProducts = products.filter(
        (product) =>
          !isDiscoveryPlaceholderProduct(product) &&
          !normalizeHomeDiscoveryText(product.name).includes("fortune") &&
          matchesDiscoveryKeywords(
            [
              product.name,
              product.categoryId?.name,
              product.subcategoryId?.name,
            ]
              .filter(Boolean)
              .join(" "),
            productKeywords,
          ) &&
          !matchesDiscoveryKeywords(
            [
              product.name,
              product.categoryId?.name,
              product.subcategoryId?.name,
            ]
              .filter(Boolean)
              .join(" "),
            preset.excludedKeywords || [],
          ),
      );

      const sortedProducts = preset.useDiscountedProducts
        ? [...matchedProducts].sort((left, right) => {
            const leftOriginal = Number(
              left.originalPrice || left.price || left.salePrice || 0,
            );
            const leftSale = Number(left.price || left.salePrice || 0);
            const rightOriginal = Number(
              right.originalPrice || right.price || right.salePrice || 0,
            );
            const rightSale = Number(right.price || right.salePrice || 0);

            return rightOriginal - rightSale - (leftOriginal - leftSale);
          })
        : matchedProducts;

      const matchedTiles = preset.useFallbackTilesOnly
        ? []
        : browseEntries
            .filter((entry) =>
              matchesDiscoveryKeywords(entry.matchText || entry.name, preset.keywords),
            )
            .slice(0, maxTiles)
            .map((entry) => ({
              id: entry.id,
              name: entry.name,
              image: entry.image,
              targetPath: entry.targetPath,
              targetState: entry.targetState,
            }));

      const usedTileNames = new Set(
        matchedTiles.map((tile) => normalizeHomeDiscoveryText(tile.name)),
      );

      const fallbackTiles = (preset.fallbackTiles || [])
        .filter((tile) => !usedTileNames.has(normalizeHomeDiscoveryText(tile.name)))
        .slice(0, Math.max(0, maxTiles - matchedTiles.length))
        .map((tile, index) => ({
          id: `${preset.id}-${normalizeHomeDiscoveryText(tile.name) || index}`,
          name: tile.name,
          image:
            tile.image ||
            (preset.tileImageFromProducts === false
              ? null
              : sortedProducts[index]?.image) ||
            getCategoryImage(tile.query || tile.name) ||
            DEFAULT_DISCOVERY_TILE_IMAGE,
          fallbackImage: tile.fallbackImage || DEFAULT_DISCOVERY_TILE_IMAGE,
          targetPath: "/search",
          targetState: { query: tile.query || tile.name },
        }));

      const sectionProducts = (sortedProducts.length
        ? sortedProducts
        : preset.useDiscountedProducts
          ? [...products]
              .filter(
                (product) =>
                  !isDiscoveryPlaceholderProduct(product) &&
                  Number(product.originalPrice || 0) > Number(product.price || 0),
              )
              .sort(
                (left, right) =>
                  Number(right.originalPrice || 0) -
                  Number(right.price || 0) -
                  (Number(left.originalPrice || 0) - Number(left.price || 0)),
              )
          : []
      ).slice(0, 6);

      const sectionTiles = [...matchedTiles, ...fallbackTiles].slice(0, maxTiles);

      if (!sectionTiles.length && !sectionProducts.length) {
        return null;
      }

      return {
        id: preset.id,
        title: preset.title,
        tiles: preset.hideTiles ? [] : sectionTiles,
        products:
          preset.showBanner && !preset.keepProductsWithBanner
            ? []
            : sectionProducts,
        productsLayout: preset.productsLayout || "scroll",
        banner: null,
      };
    }).filter(Boolean);

    const showcaseSections = MOBILE_SHOWCASE_SECTIONS.map((section) => ({
      ...section,
      tiles: [],
      banner: null,
    }));

    return [...derivedSections, ...showcaseSections];
  }, [browseEntries, mobileHomeTiles, products]);

  const filteredMobileDiscoverySections = useMemo(() => {
    if (isAllCategoryActive) return mobileDiscoverySections;

    return mobileDiscoverySections.filter((section) =>
      getHeaderScopedMobileSectionAliases(section.id).includes(
        normalizedActiveHeaderCategory,
      ),
    );
  }, [
    isAllCategoryActive,
    mobileDiscoverySections,
    normalizedActiveHeaderCategory,
  ]);

  // Experience sections for main content (all sections; hero is separate)
  const sectionsForRenderer = useMemo(() => {
    if (headerSections.length) return headerSections;
    if (isAllCategoryActive) return experienceSections;
    return [];
  }, [experienceSections, headerSections, isAllCategoryActive]);

  // Fade out banner as user scrolls (0 to 100px)
  // Parallax effect for banner - moves slower than scroll
  const opacity = useTransform(scrollY, [0, 300], [1, 0.6]);
  const y = useTransform(scrollY, [0, 300], [0, 80]); // Positive Y moves down as we scroll up = Parallax
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);
  const pointerEvents = useTransform(scrollY, [0, 100], ["auto", "none"]);

  // Promotional banner scroll animations (smooth upward scroll)
  const promoBannerY = useTransform(scrollY, [0, 150], [0, -250]);
  const promoBannerOpacity = useTransform(scrollY, [0, 120], [1, 0]);
  // When returning from a category page, scroll back to the section that was clicked
  useEffect(() => {
    if (!pendingReturn?.sectionId) return;

    const allSections = headerSections.length
      ? headerSections
      : experienceSections;
    if (!allSections.length) return;

    const exists = allSections.some((s) => s._id === pendingReturn.sectionId);
    if (!exists) return;

    const id = `section-${pendingReturn.sectionId}`;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "instant", block: "start" });
      window.sessionStorage.removeItem("experienceReturn");
      setPendingReturn(null);
    }
  }, [headerSections, experienceSections, pendingReturn]);

  // Helper to render dynamic floating elements
  const renderFloatingElements = (type) => {
    const count = 10; // Optimized count for performance

    const getParticleContent = (index) => {
      switch (type) {
        case "hearts":
          return (
            <Heart
              fill="white"
              size={12 + (index % 5) * 2}
              className="drop-shadow-sm"
            />
          );
        case "snow":
          return (
            <Snowflake
              fill="white"
              size={10 + (index % 4) * 3}
              className="drop-shadow-sm"
            />
          );
        case "stars":
        case "sparkles":
          return (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="white"
              className="drop-shadow-md">
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          );
        default:
          return (
            <div
              className="bg-white/40 rounded-full blur-[1px]"
              style={{
                width: 4 + (index % 3) * 3,
                height: 4 + (index % 3) * 3,
              }}
            />
          );
      }
    };

    return [...Array(count)].map((_, i) => {
      const duration = 15 + Math.random() * 20;
      const delay = Math.random() * -20;
      const startX = Math.random() * 100;
      const startY = Math.random() * 100;
      const depth = 0.5 + Math.random() * 0.5; // Parallax depth

      return (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${startX}%`,
            top: `${startY}%`,
            opacity: 0.1 * depth,
            zIndex: Math.floor(depth * 10),
          }}
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -100, -50, 0],
            rotate: [0, 360],
            scale: [depth, depth * 1.2, depth],
          }}
          transition={{
            duration: duration / depth,
            repeat: Infinity,
            ease: "easeInOut",
            delay: delay,
          }}>
          <div className="transform-gpu">{getParticleContent(i)}</div>
        </motion.div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-white pb-10">
      <MainLocationHeader
        categories={categories}
        activeCategory={activeCategory}
        onCategorySelect={setActiveCategory}
        featuredOffer={featuredOffer}
      />

      {/* Main Page Content - Conditionally Hidden if No Service */}
      {products.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center pt-24 pb-48 animate-in fade-in zoom-in duration-700">
          <div className="w-64 h-64 md:w-96 md:h-96 mb-8 drop-shadow-2xl">
            <Lottie animationData={noServiceAnimation} loop={true} />
          </div>
          <h3 className="text-3xl md:text-5xl font-[1000] text-slate-800 tracking-tighter mb-4 text-center px-4 uppercase">
            Service <span className="text-[#45B0E2]">Unavailable</span>
          </h3>
          <p className="text-slate-500 font-bold max-w-md text-center px-10 text-sm md:text-lg leading-relaxed opacity-80">
            Ah! We haven't reached your neighborhood yet. We're expanding rapidly to bring {settings?.appName || "Noyo"} to every corner.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="mt-12 px-10 py-4 bg-[#45B0E2] text-white font-[1000] rounded-[24px] shadow-2xl shadow-cyan-200 uppercase text-[13px] tracking-[0.2em] transition-all"
          >
            Check Again
          </motion.button>
        </div>
      ) : (
        <>

          {/* Full-Width Category Banner Carousel - Mobile Only */}
          {isAllCategoryActive && scrollableBannerCategories.length > 0 && (
            <div className="relative z-20 w-full overflow-visible bg-white md:hidden px-4 pt-2 pb-4">
              <div
                className="relative h-[160px] overflow-hidden rounded-lg shadow-lg"
                onMouseEnter={() => setIsHoveringCategoryBanner(true)}
                onMouseLeave={() => setIsHoveringCategoryBanner(false)}
                onTouchStart={handleCategoryBannerTouchStart}
                onTouchEnd={handleCategoryBannerTouchEnd}>
                {/* Sliding Container */}
                <div
                  className="absolute inset-0 flex transition-all duration-700 ease-in-out"
                  style={{
                    transform: `translateX(-${categoriesBannerIndex * 100}%)`,
                  }}>
                  {scrollableBannerCategories.map((category) => (
                    <div
                      key={category.id}
                      className="min-w-full h-full flex-shrink-0 relative overflow-hidden rounded-lg">
                      {/* Background Image */}
                      <img
                        src={
                          category.image ||
                          getCategoryImage(category.name) ||
                          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=500&h=300"
                        }
                        alt={category.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
                      {/* Content */}
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setActiveCategory(category);
                          navigate(`/category/${category.id}`);
                        }}
                        className="absolute inset-0 flex flex-col items-start justify-end p-4 text-left group">
                        <h3 className="text-2xl font-black text-white drop-shadow-lg mb-2 group-hover:text-yellow-300 transition-colors">
                          {category.name}
                        </h3>
                        <span className="text-xs font-semibold text-white/90 drop-shadow-md bg-black/30 px-3 py-1 rounded-full">
                          Shop Now
                        </span>
                      </motion.button>
                    </div>
                  ))}
                </div>

                {/* Navigation Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {scrollableBannerCategories.map((category, idx) => (
                    <motion.button
                      key={category.id}
                      whileHover={{ scale: 1.2 }}
                      onClick={() => setCategoriesBannerIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === categoriesBannerIndex
                          ? "w-6 bg-white"
                          : "w-2 bg-white/50 hover:bg-white/70"
                      }`}
                      aria-label={`Go to ${category.name}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {filteredMobileDiscoverySections.length > 0 && (
            <div
              className={cn(
                "relative z-20 bg-white md:hidden",
                isAllCategoryActive ? "mt-2" : "mt-10",
              )}>
              {filteredMobileDiscoverySections.map((section, sectionIndex) => {
                const isPrimaryCategoryDiscovery =
                  section.id === "primary-category-discovery";
                const isSoftHeadingSection =
                  section.id === "electronics" || section.id === "special";
                const isDryFruitsSection = section.id === "dry-fruits";

                return (
                <div key={section.id}>
                <section
                  className={cn(
                    "px-4",
                    sectionIndex === 0
                      ? isPrimaryCategoryDiscovery
                        ? "pb-6 pt-8"
                        : "pb-6 pt-4"
                      : "pb-6 pt-2",
                  )}>
                  <div className="mb-4 flex items-center justify-between">
                    <h2
                      className={cn(
                        "tracking-tight text-[#1b1b1b]",
                        isPrimaryCategoryDiscovery
                          ? "text-[15px] font-extrabold leading-none text-[#3f3f3f]"
                          : isDryFruitsSection
                            ? "text-[14px] font-bold text-[#484848]"
                          : isSoftHeadingSection
                            ? "text-[24px] font-extrabold text-[#404040]"
                          : "text-[24px] font-black",
                      )}>
                      {section.title}
                    </h2>
                    {!section.banner &&
                      !section.hideItemCount &&
                      section.products?.length > 0 && (
                      <span
                        className={cn(
                          "uppercase tracking-[0.18em] text-[#7a7a7a]",
                          isDryFruitsSection
                            ? "text-[9px] font-bold text-[#8a8a8a]"
                            : "text-[10px] font-black",
                        )}>
                        {section.products.length} items
                      </span>
                      )}
                  </div>

                  {section.tiles.length > 0 && (
                    <div className="grid grid-cols-4 gap-x-3 gap-y-4">
                      {section.tiles.map((tile) => (
                        <motion.button
                          key={tile.id}
                          whileTap={{ scale: 0.96 }}
                          onClick={() =>
                            navigate(
                              tile.targetPath,
                              tile.targetState ? { state: tile.targetState } : undefined,
                            )
                          }
                          className="flex flex-col items-center">
                          <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-[18px] border border-[#d0b391] bg-[radial-gradient(circle_at_50%_26%,_rgba(255,255,255,0.98)_0%,_rgba(255,255,255,0.42)_36%,_rgba(255,255,255,0)_60%),linear-gradient(160deg,_#d6ab73_0%,_#8b562f_100%)] p-2.5 shadow-[inset_0_10px_18px_rgba(255,255,255,0.22),0_10px_18px_rgba(92,58,28,0.18)]">
                            <img
                              src={tile.image}
                              alt={tile.name}
                              onError={(event) => {
                                if (
                                  event.currentTarget.dataset.fallbackApplied === "true"
                                ) {
                                  return;
                                }
                                event.currentTarget.dataset.fallbackApplied = "true";
                                event.currentTarget.src =
                                  tile.fallbackImage || DEFAULT_DISCOVERY_TILE_IMAGE;
                              }}
                              className="h-full w-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.18)]"
                            />
                          </div>
                          <span
                            className={cn(
                              "mt-2 line-clamp-2 text-center text-[#1f1f1f]",
                              isPrimaryCategoryDiscovery
                                ? "min-h-[22px] px-0.5 text-[9px] font-semibold leading-[1.2] text-[#111111]"
                                : "min-h-[24px] text-[10px] font-semibold leading-[1.15]",
                            )}>
                            {tile.name}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {section.products?.length > 0 &&
                  section.productsLayout === "showcaseGrid" ? (
                    <div className="mt-3 grid grid-cols-3 gap-x-2.5 gap-y-4">
                      {section.products.filter(p => !p.badgeText).slice(0, 3).map((product) => (
                        <motion.div
                          key={product.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() =>
                            navigate("/search", {
                              state: { query: product.query || product.name },
                            })
                          }
                          className="min-w-0 cursor-pointer text-left">
                          <div className="relative overflow-hidden rounded-[16px] bg-white">
                            <div className="relative overflow-hidden rounded-[14px] border border-[#eef1f5] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
                              {product.badgeText && (
                                <span className="absolute left-1.5 top-1.5 z-10 rounded-[3px] bg-black px-1.5 py-1 text-[8px] font-black uppercase tracking-[0.04em] text-white">
                                  {product.badgeText}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(event) => event.stopPropagation()}
                                className="absolute right-1 top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm">
                                <Heart size={10} className="text-[#b7bfcb]" />
                              </button>

                              <div className="relative flex aspect-[0.84] items-center justify-center bg-white p-2.5">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  onError={(event) => {
                                    if (
                                      event.currentTarget.dataset.fallbackApplied ===
                                      "true"
                                    ) {
                                      return;
                                    }
                                    event.currentTarget.dataset.fallbackApplied = "true";
                                    event.currentTarget.src =
                                      product.fallbackImage ||
                                      buildShowcaseProductImage({
                                        brand: product.name.split(" ")[0],
                                        label: product.name,
                                        kind: "default",
                                      });
                                  }}
                                  className="h-full w-full object-contain"
                                />
                                <motion.button
                                  type="button"
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    navigate("/search", {
                                      state: { query: product.query || product.name },
                                    });
                                  }}
                                  className="absolute bottom-1 right-1 rounded-[7px] border border-[#1f2937] bg-white px-2 py-0.5 text-[8px] font-black text-[#1f2937] shadow-[0_3px_8px_rgba(15,23,42,0.08)]">
                                  ADD
                                </motion.button>
                              </div>
                            </div>

                            <div className="px-0.5 pt-1">
                              <span className="inline-flex rounded-[4px] bg-[#f3f5f8] px-1 py-0.5 text-[7px] font-semibold text-[#4b5563]">
                                {product.weight}
                              </span>
                              <h3 className="mt-1 line-clamp-2 min-h-[28px] text-[9px] font-bold leading-[1.2] text-[#111827]">
                                {product.name}
                              </h3>
                              <p className="mt-0.5 text-[7px] font-extrabold uppercase tracking-[0.01em] text-[#2563eb]">
                                {product.discountText}
                              </p>
                              <div className="mt-0.5 flex items-baseline gap-1">
                                <span className="text-[9px] font-black text-[#111827]">
                                  Rs{product.price}
                                </span>
                                <span className="text-[7px] font-semibold text-[#9ca3af] line-through">
                                  MRP {product.originalPrice}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : section.products?.length > 0 && section.productsLayout === "grid3" ? (
                    <div className="mt-4 grid grid-cols-3 gap-2.5">
                      {section.products.slice(0, 3).map((product) => (
                        <div key={product.id || product._id} className="min-w-0">
                          <ProductCard
                            product={product}
                            compact
                            neutralBg
                            className="h-full min-w-0 border border-[#efe8df] shadow-[0_8px_22px_rgba(92,58,28,0.08)]"
                          />
                        </div>
                      ))}
                    </div>
                  ) : section.products?.length > 0 && (
                    <div className="mt-5 flex gap-6 overflow-x-auto pb-1 no-scrollbar">
                      {section.products.map((product) => (
                        <div
                          key={product.id || product._id}
                          className="w-[220px] flex-shrink-0">
                          <ProductCard
                            product={product}
                            compact
                            neutralBg
                            className="border border-[#efe8df] shadow-[0_8px_22px_rgba(92,58,28,0.08)]"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {false && section.banner && (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(section.banner.targetPath)}
                      className="mt-4 block h-[168px] w-full overflow-hidden rounded-[22px] border border-[#f1dfdf] bg-[#fff4f6] shadow-[0_12px_24px_rgba(198,99,116,0.18)]">
                      <img
                        src={section.banner.image}
                        alt={section.banner.alt}
                        className="h-full w-full object-cover"
                      />
                    </motion.button>
                  )}
                </section>

                {/* Top Brands between Special and Dry Fruits */}
                {section.id === "special" && (
                  <>
                  <div className="py-2 mt-0">
                    <div className="flex items-center justify-between mb-4 px-4">
                      <h2 className="text-[17px] font-black tracking-tight text-[#111111]">
                        Top Brands
                      </h2>
                      <span
                        onClick={() => navigate("/offers")}
                        className="text-[12px] font-bold text-[#111111] cursor-pointer hover:underline"
                      >
                        See All
                      </span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1 px-4 mb-2">
                      {[
                        { name: "Amul", image: "https://th.bing.com/th/id/OIP.AUCLmZuvxchn31YKeHMUowHaHa?w=183&h=183&c=7&r=0&o=5&pid=1.7" },
                        { name: "Nestle", image: "https://th.bing.com/th/id/OIP.dOFDjSfy2R8-pGHpY0oRAAHaHa?w=155&h=180&c=7&r=0&o=5&pid=1.7" },
                        { name: "Lays", image: "https://th.bing.com/th/id/OIP.asWIMrXnhPj5wTVqEonUtQHaHa?w=176&h=180&c=7&r=0&o=5&pid=1.7" },
                        { name: "Pepsi", image: "data:image/jpeg;base64,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" },
                        { name: "Dove", image: "https://th.bing.com/th/id/OIP.CVn7c9g-abfYCrbbTnsE-AHaHa?w=199&h=199&c=7&r=0&o=5&pid=1.7" }
                      ].map((brand, i) => (
                        <div
                          key={i}
                          onClick={() => navigate("/search", { state: { query: brand.name } })}
                          className="flex-shrink-0 w-[85px] h-[85px] sm:w-[110px] sm:h-[110px] rounded-[14px] border border-[#e8e8e8] bg-white flex items-center justify-center p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <img src={brand.image} alt={brand.name} className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 pb-3 w-full relative">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        navigate("/search", {
                          state: { query: "health" },
                        })
                      }
                      className="block w-full overflow-hidden relative"
                      style={{ aspectRatio: "21/9" }}>
                      <img
                        src={HealthBanner}
                        alt="Healthcare banner"
                        className="absolute inset-0 w-full h-full object-cover object-center scale-[1.25] -translate-y-1"
                      />
                    </motion.button>
                  </div>

                  </>
                )}
                </div>
              );
            })}
          </div>
        )}



          {/* Dynamic Hierarchical Category Sections (Level 2 & 3) */}
          {filteredCategorizedSections.length > 0 && (
            <div className="relative z-20 mx-auto mb-12 mt-10 hidden w-full max-w-[1360px] space-y-10 px-4 md:block lg:px-6">
              {filteredCategorizedSections.map((section) => (
                <motion.div 
                  key={section._id} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5 }}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-[#1A1A1A] tracking-tight">
                      {section.name}
                    </h3>
                  </div>

                  <div className="mt-3">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-4 md:gap-5 px-2">
                      {section.subcategories.slice(0, 8).map((sub) => (
                        <motion.div
                          key={sub._id}
                          initial={false}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            // Remember context for back navigation
                            window.sessionStorage.setItem(
                              "experienceReturn",
                              JSON.stringify({
                                headerId: activeCategory?._id,
                                sectionId: section._id,
                              }),
                            );
                            navigate(`/category/${section._id}`, {
                              state: { activeSubcategoryId: sub._id },
                            });
                          }}
                          className="flex flex-col items-center cursor-pointer group transition-all duration-300">
                          {/* Premium Brown Gradient Card with Soft White Center Glow */}
                          <div 
                            className="w-full aspect-square rounded-xl shadow-md p-1.5 hover:shadow-lg transition-all duration-300 flex items-center justify-center overflow-hidden"
                            style={{
                              background: `radial-gradient(circle at center, rgba(255,255,255,0.35), transparent 60%), linear-gradient(135deg, #c89b63, #8b5e34)`,
                              boxShadow: `inset 0 8px 20px rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.15)`
                            }}>
                            <img
                              src={
                                sub.image ||
                                getCategoryImage(sub.name) ||
                                "https://cdn-icons-png.flaticon.com/128/2321/2321831.png"
                              }
                              alt={sub.name}
                              className="w-full h-full object-contain drop-shadow-md"
                            />
                          </div>
                          {/* Name Label Below */}
                          <p className="text-xs sm:text-sm font-medium text-gray-800 mt-1 sm:mt-2 text-center line-clamp-2 px-1 w-full">
                            {sub.name}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Best Sellers: hidden on mobile to keep the curated home flow clean */}
          <div className="mx-auto hidden w-full max-w-[1360px] px-4 py-8 md:block lg:px-6">
            <div className="px-0">
              <div className="flex justify-between items-end mb-5">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
                    Best Sellers
                  </h2>
                </div>
                <button
                  onClick={() => navigate("/offers")}
                  className="text-[#2822e3] text-sm font-bold hover:underline transition-all">
                  See all products →
                </button>
              </div>
            </div>

            <div className="px-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.slice(0, 5).map((product) => {
                  const originalPrice = product.price;
                  const salePrice = product.salePrice;
                  const discountPercent = originalPrice && salePrice 
                    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
                    : 0;

                  return (
                    <motion.div
                      key={product.id || product._id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/product/${product.id || product._id}`)}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer border border-gray-200">
                      
                      {/* Product Image Container */}
                      <div className="relative h-40 bg-gray-50 overflow-hidden flex items-center justify-center">
                        {/* Bestseller Badge */}
                        {discountPercent >= 20 && (
                          <div className="absolute top-2 left-2 bg-gray-900 text-white px-2 py-1 rounded-sm text-xs font-bold z-10">
                            Bestseller
                          </div>
                        )}
                        
                        {/* Discount Badge */}
                        {discountPercent > 0 && (
                          <div className="absolute top-2 right-2 bg-gray-900 text-white px-2 py-1 rounded-sm text-xs font-bold z-10">
                            {discountPercent}% OFF
                          </div>
                        )}

                        <img
                          src={product.image || product.mainImage || "https://via.placeholder.com/200"}
                          alt={product.name}
                          className="w-full h-full object-contain p-2"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="p-3">
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-2 leading-tight">
                          {product.name}
                        </h3>

                        {/* Weight/Size */}
                        {product.weight && (
                          <p className="text-xs text-gray-500 mb-2">
                            {product.weight}
                          </p>
                        )}

                        {/* Price Section */}
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-base font-bold text-gray-900">
                            ₹{salePrice || originalPrice}
                          </span>
                          {salePrice && originalPrice > salePrice && (
                            <span className="text-xs text-gray-400 line-through">
                              ₹{originalPrice}
                            </span>
                          )}
                        </div>

                        {/* Add Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-full bg-black hover:bg-gray-900 text-white py-2 rounded-lg font-bold text-sm transition-all">
                          ADD
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

          {/* Category-wise Products Section - HIDDEN TO REDUCE CLUTTER */}

          {/* Shop by Store - Professional Redesign */}
              {false && nearbyStores.length > 0 && (
                <div className="py-8 mb-8">
                  <div className="px-4 mb-6">
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex flex-col">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                          Browse Stores
                        </p>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                          Shop by Store
                        </h2>
                      </div>
                      <button
                        onClick={() => navigate("/stores")}
                        className="text-gray-900 text-sm font-bold hover:underline">
                        View all stores →
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Choose a store to explore only that store's products.
                    </p>
                  </div>

                  <div className="px-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {nearbyStores.slice(0, 10).map((store) => (
                        <motion.div
                          key={store._id}
                          initial={{ opacity: 0, y: 12 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, amount: 0.2 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ y: -4 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigate(`/stores/${store._id}`)}
                          className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100 cursor-pointer">
                          
                          {/* Verified Store Label */}
                          <div className="px-4 pt-3 pb-0">
                            <div className="flex items-center gap-1 mb-3">
                              <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                                <span className="text-green-700 text-xs font-bold">✓</span>
                              </div>
                              <span className="text-xs font-bold uppercase tracking-wider text-green-700">
                                Verified Store
                              </span>
                            </div>
                          </div>

                          {/* Store Info */}
                          <div className="p-4 pt-2">
                            {/* Logo + Name */}
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <img
                                  src={resolveStoreLogo(store)}
                                  alt={store.shopName}
                                  className="w-11 h-11 object-contain"
                                />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-base font-bold text-gray-900 line-clamp-2">
                                  {store.shopName || store.name || "Store"}
                                </h3>
                              </div>
                            </div>

                            {/* Location */}
                            <div className="flex gap-2 mb-3">
                              <span className="text-gray-400 text-lg flex-shrink-0">📍</span>
                              <p className="text-sm text-gray-600 line-clamp-3">
                                {store.address || store.location?.address || "Address not available"}
                              </p>
                            </div>

                            {/* Delivery Time & Distance */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <div className="text-xs text-gray-600 font-medium">
                                ⏱ {store.deliveryTime || "8-12 mins"}
                              </div>
                              <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {store.distance ? `${store.distance.toFixed(1)} km` : "0.0 km"}
                              </div>
                            </div>

                            {/* View Button */}
                            <button className="w-full mt-3 bg-gray-900 hover:bg-black text-white py-2.5 rounded-lg font-semibold text-sm transition-all">
                              View Store
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          {/* Main Content Area */}
          {sectionsForRenderer.length > 0 && (
            <div className="mx-auto w-full max-w-[1360px] px-4 py-8 md:px-6 md:py-12 lg:px-6">
              <SectionRenderer
                sections={sectionsForRenderer}
                productsById={productsById}
                categoriesById={categoryMap}
                subcategoriesById={subcategoryMap}
                themeColor={activeCategory?.headerColor || "#7B4419"}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
