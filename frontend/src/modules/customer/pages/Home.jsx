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
import CardBanner from "@/assets/CardBanner.jpg";
import QuickCategoriesBg from "@/assets/Catagorysection_bg.png";
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

const DEFAULT_CATEGORY_THEME = {
  gradient: "linear-gradient(to bottom, #45B0E2, #38bdf8)",
  shadow: "shadow-cyan-500/20",
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

  const scrollQuickCats = (direction) => {
    if (quickCatsRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      quickCatsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
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
      bgFrom: "#45B0E2",
      bgVia: "#cffafe",
      bgTo: "#ecfeff",
      glowColor: "rgba(97,218,251,0.18)",
      frameColor: "#a5f3fc",
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

  // Autoplay for Mobile Banner Carousel (smooth, one-direction loop)
  useEffect(() => {
    const totalSlides = 3; // keep in sync with rendered slides
    const intervalId = setInterval(() => {
      setMobileBannerIndex((prev) => {
        // Prevent index from growing unbounded (which would push banners off-screen)
        if (prev >= totalSlides - 1) return prev;
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
    const totalSlides = 3; // real1, real2, clone(real1)
    if (mobileBannerIndex === totalSlides - 1) {
      // Instantly jump back to the first slide without any reverse animation
      setIsInstantBannerJump(true);
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

  // Experience sections for main content (all sections; hero is separate)
  const sectionsForRenderer = headerSections.length
    ? headerSections
    : experienceSections;

  // Fade out banner as user scrolls (0 to 100px)
  // Parallax effect for banner - moves slower than scroll
  const opacity = useTransform(scrollY, [0, 300], [1, 0.6]);
  const y = useTransform(scrollY, [0, 300], [0, 80]); // Positive Y moves down as we scroll up = Parallax
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);
  const pointerEvents = useTransform(scrollY, [0, 100], ["auto", "none"]);
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
    <div className="min-h-screen bg-white pt-[216px] md:pt-[250px] pb-10">
      <MainLocationHeader
        categories={categories}
        activeCategory={activeCategory}
        onCategorySelect={setActiveCategory}
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

          {/* Dynamic Hierarchical Category Sections (Level 2 & 3) */}
          {filteredCategorizedSections.length > 0 && (
            <div className="w-full space-y-8 px-4 relative z-20 mb-8 mt-2">
              {filteredCategorizedSections.map((section) => (
                <div key={section._id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                      {section.name}
                    </h3>
                  </div>

                  <div className="mt-4">
                    <div className="grid grid-cols-4 gap-y-8 gap-x-3">
                      {section.subcategories.map((sub) => {
                        const themeColor = activeCategory?.headerColor || "#45B0E2";
                        const darkBase = "#0F172A"; // Rich slate dark base
                        const midTint = mixHexColors(darkBase, themeColor, 0.15); // Subtle 15% tint
                        const spotlightTint = mixHexColors(darkBase, themeColor, 0.35); // 35% spotlight tint

                        return (
                          <motion.div
                            key={sub._id}
                            initial={false}
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
                            className="flex flex-col items-center gap-2 cursor-pointer group">
                            <motion.div
                              animate={{
                                background: `radial-gradient(circle at center, ${mixHexColors("#FFFFFF", themeColor, 0.3)} 0%, ${themeColor} 65%, ${mixHexColors(themeColor, "#000000", 0.15)} 100%)`,
                              }}
                              transition={{ duration: 0.5, ease: "easeInOut" }}
                              className="w-20 h-20 rounded-2xl flex items-center justify-center p-2.5 shadow-md border border-white/30 relative overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]">

                              <img
                                src={
                                  sub.image ||
                                  "https://cdn-icons-png.flaticon.com/128/2321/2321831.png"
                                }
                                alt={sub.name}
                                className="w-[85%] h-[85%] object-contain block mx-auto relative z-10 transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]"
                              />
                            </motion.div>
                            <motion.span
                              animate={{ color: "#1A1A1A" }}
                              className="text-[11px] font-bold text-center leading-tight line-clamp-2 px-0.5 tracking-tight transition-colors duration-500">
                              {sub.name}
                            </motion.span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hero Banners: Prominent carousel after categories */}
          <div className="w-full mt-3 px-4 relative z-20 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-full rounded-2xl overflow-hidden shadow-md border border-slate-100 transition-all duration-200">
              <div className="relative w-full overflow-hidden">
                {heroConfig.banners?.items?.length ? (
                  <ExperienceBannerCarousel
                    section={{ title: "" }}
                    items={heroConfig.banners.items}
                    fullWidth
                    edgeToEdge
                  />
                ) : (
                  <div className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${mobileBannerIndex * 100}%)` }}>
                    {[1, 2, 3].map((_, idx) => (
                      <motion.div
                        key={idx}
                        onClick={() => navigate("/category/all")}
                        className="min-w-full relative">
                        <div className="absolute inset-0 bg-black/5 z-10 pointer-events-none" />
                        <div className={cn(
                          "w-full h-[220px] p-6 relative overflow-hidden flex items-center",
                          idx % 2 === 0 ? "bg-[#ecfeff]" : "bg-white"
                        )}>
                          <div className="relative z-20 w-3/5 flex flex-col items-start gap-1">
                            <h4 className="text-xl font-[1000] text-[#1A1A1A] tracking-tighter leading-none">
                              {idx % 2 === 0 ? "Get " : "Big "}
                              <span className="text-[#45B0E2]">{idx % 2 === 0 ? "Products" : "Savings"}</span>
                            </h4>
                            <p className="text-[10px] font-bold text-gray-500 max-w-[140px] leading-tight">
                              Best quality groceries delivered
                            </p>
                          </div>
                          <div className="absolute right-[-10px] bottom-0 top-0 w-2/5 flex items-center justify-center z-0">
                            <img
                              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400"
                              alt="Promo"
                              className="w-full h-full object-contain rotate-2 scale-110"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>


          {/* Lowest Prices Section - Clean Horizontal Scroll */}
          <div className="py-6 mb-8 px-4 relative overflow-hidden">
            <div className="container mx-auto relative z-10">
              <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#2822e3]/70 mb-0.5">
                    Maximum Savings
                  </p>
                  <h2 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                    Lowest Prices
                  </h2>
                </div>
                <button
                  onClick={() => navigate("/offers")}
                  className="text-[#2822e3] text-xs font-bold transition-all p-1">
                  See all
                </button>
              </div>

              <div className="relative z-10 flex overflow-x-auto gap-4 pb-6 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scroll-smooth">
                {products.slice(0, 12).map((product) => (
                  <div
                    key={product.id}
                    className="w-[160px] md:w-[180px] shrink-0 snap-start">
                    <ProductCard
                      product={product}
                      className="hover:shadow-md transition-shadow"
                      compact={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Offer Sections (admin-configured: Trending, etc.) */}
          {offerSections.length > 0 && (
            <div className="w-full px-0 pt-0 pb-6 md:pb-10">
              {[...offerSections]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((section) => {
                  const bgColor = getBackgroundColorByValue(
                    section.backgroundColor,
                  );
                  const sectionProducts = (section.productIds || [])
                    .filter((p) => typeof p === "object" && p !== null)
                    .map((p) => ({
                      id: p._id,
                      _id: p._id,
                      name: p.name,
                      image: p.mainImage || p.image || "",
                      price: p.salePrice ?? p.price,
                      originalPrice: p.price ?? p.salePrice,
                      weight: p.weight,
                      deliveryTime: p.deliveryTime,
                    }));
                  return (
                    <motion.div
                      key={section._id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{ duration: 0.4 }}
                      className="mb-8 rounded-none overflow-hidden bg-transparent">
                      <div className="relative flex items-center justify-between px-4 mb-4">
                        <div className="flex flex-col">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#2822e3]/70">
                            Trending Now
                          </p>
                          <h3 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                            {section.title}
                          </h3>
                        </div>
                        <button className="text-[#2822e3] text-xs font-bold">
                          See all
                        </button>
                      </div>
                      <div className="px-4">
                        <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar snap-x snap-mandatory">
                          {sectionProducts.length === 0 ? (
                            <div className="w-full py-10 flex flex-col items-center justify-center text-center">
                              <div className="w-32 h-32 mb-3">
                                <Lottie animationData={noServiceAnimation} loop={true} />
                              </div>
                              <p className="text-sm md:text-base text-slate-400 font-bold">
                                Looking for the best items in this category...
                              </p>
                            </div>
                          ) : (
                            sectionProducts.map((product) => (
                              <div
                                key={product.id}
                                className="w-[140px] md:w-[140px] flex-shrink-0 snap-start">
                                <ProductCard
                                  product={product}
                                  className="bg-white border border-slate-100 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                                  compact
                                />
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

              {/* Shop by Store - Standardized Clean Grid Section */}
              {nearbyStores.length > 0 && (
                <div className="py-6 mb-8 mt-4">
                  <div className="px-4 mb-4 flex justify-between items-end">
                    <div className="flex flex-col">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#2822e3]/70">
                        Local Favorites
                      </p>
                      <h3 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                        Shop by Store
                      </h3>
                    </div>
                    <button
                      onClick={() => navigate("/stores")}
                      className="text-[#2822e3] text-xs font-bold">
                      View all
                    </button>
                  </div>

                  <div className="px-4">
                    <div className="grid grid-cols-3 gap-3">
                      {nearbyStores.map((store) => (
                        <motion.button
                          key={store._id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigate(`/stores/${store._id}`)}
                          className="flex flex-col items-center bg-white rounded-2xl p-3 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-gray-100/50"
                        >
                          <div className="w-12 h-12 aspect-square rounded-full bg-gray-50 flex items-center justify-center overflow-hidden mb-2">
                            <img
                              src={resolveStoreLogo(store)}
                              alt={store.shopName}
                              className="w-10 h-10 object-contain"
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-[#1A1A1A] text-center line-clamp-1">
                            {store.shopName || store.name || "Store"}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main Content Area */}
          {sectionsForRenderer.length > 0 && (
            <div className="container mx-auto px-4 md:px-8 lg:px-[50px] py-10 md:py-16">
              <SectionRenderer
                sections={sectionsForRenderer}
                productsById={productsById}
                categoriesById={categoryMap}
                subcategoriesById={subcategoryMap}
                themeColor={activeCategory?.headerColor || "#45B0E2"}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;


