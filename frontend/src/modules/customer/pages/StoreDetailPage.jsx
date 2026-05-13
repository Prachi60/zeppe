import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Search, Clock, Star, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import ProductCard from "../components/shared/ProductCard";
import { customerApi } from "../services/customerApi";
import { useLocation as useAppLocation } from "../context/LocationContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import StoreCategorySidebar from "../components/store/StoreCategorySidebar";
import { getCategoryImage } from "@/shared/constants/categoryImageMap";

function mapProduct(product, isShopOpen = true) {
  return {
    id: product._id,
    _id: product._id,
    name: product.name,
    image:
      product.mainImage ||
      product.image ||
      "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1200&auto=format&fit=crop",
    price: product.salePrice ?? product.price,
    originalPrice: product.price,
    weight: product.weight || "1 unit",
    deliveryTime: "21 min", // Dynamic delivery time placeholder
    ratings: 4.5, // Placeholder for rating
    variants: Array.isArray(product.variants) ? product.variants : [],
    sellerIsOpen: isShopOpen !== false,
  };
}

const StoreDetailPage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { currentLocation } = useAppLocation();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [globalCategories, setGlobalCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStoreData = async () => {
      if (!storeId) return;
      
      setIsLoading(true);
      setError("");
      
      try {
        const params = {};
        if (currentLocation?.latitude && currentLocation?.longitude) {
          params.lat = currentLocation.latitude;
          params.lng = currentLocation.longitude;
        }

        // Use allSettled to ensure one failure (like 404 store) doesn't block categories/products
        const results = await Promise.allSettled([
          customerApi.getPublicSellerById(storeId, params),
          customerApi.getStoreProducts(storeId, params),
          customerApi.getCategories({ limit: 1000, status: "active" })
        ]);

        const [storeResult, productsResult, categoriesResult] = results;

        // 1. Handle Categories
        if (categoriesResult.status === "fulfilled" && categoriesResult.value?.data?.success) {
          const catData = categoriesResult.value.data.result?.items || categoriesResult.value.data.result || categoriesResult.value.data.results;
          const list = Array.isArray(catData) ? catData : [];
          setGlobalCategories(list);
        }

        // 2. Handle Store Details
        if (storeResult.status === "fulfilled" && storeResult.value?.data?.success) {
          setStore(storeResult.value.data.result);
        } else {
          console.warn("Store details could not be loaded", storeResult.reason);
          // If 404, we can still show products if they exist
          if (storeResult.reason?.response?.status === 404) {
            setError("Store profile not found in database.");
          }
        }

        // 3. Handle Products
        if (productsResult.status === "fulfilled" && productsResult.value?.data?.success) {
          const productItems = productsResult.value.data.result?.items || productsResult.value.data.results || [];
          setProducts(Array.isArray(productItems) ? productItems : []);
        }

      } catch (err) {
        console.error("Store load error:", err);
        setError("Failed to load store information.");
      } finally {
        setIsLoading(false);
      }
    };

    loadStoreData();
  }, [storeId, currentLocation?.latitude, currentLocation?.longitude]);

  const categories = useMemo(() => {
    // 1. Start with 'All'
    const catList = [{ id: "all", name: "All", image: "https://cdn-icons-png.flaticon.com/512/3081/3081840.png" }];
    
    // 2. Show all Level 2 Categories from the system
    globalCategories
      .filter(cat => cat.type === "category")
      .forEach(cat => {
        catList.push({
          id: cat._id,
          name: cat.name,
          image: cat.image || getCategoryImage(cat.name) || "https://cdn-icons-png.flaticon.com/512/3081/3081840.png"
        });
      });
    
    return catList;
  }, [globalCategories]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let mapped = products.map((p) => mapProduct(p, store?.isShopOpen));
    
    if (activeCategoryId !== "all") {
      mapped = mapped.filter(p => {
        const raw = products.find(r => r._id === p._id);
        if (!raw) return false;
        
        // Helper to check ID match against possible populated or string fields
        const matches = (field, targetId) => {
          if (!field) return false;
          if (typeof field === "string") return field === targetId;
          if (typeof field === "object" && field._id) return String(field._id) === targetId;
          return false;
        };

        // Match against any of the category levels
        return matches(raw.categoryId, activeCategoryId) || 
               matches(raw.headerId, activeCategoryId) || 
               matches(raw.subcategoryId, activeCategoryId) ||
               raw.category === activeCategoryId; // Support legacy string category if present
      });
    }

    if (!query) return mapped;
    return mapped.filter((product) =>
      String(product.name || "").toLowerCase().includes(query)
    );
  }, [products, searchQuery, activeCategoryId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-4 border-[#0066FF] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Loading {searchQuery ? "products..." : "store..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 1. STICKY HEADER WITH SEARCH */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-4 pt-safe pb-3 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-90"
          >
            <ArrowLeft size={24} className="text-slate-800" />
          </button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${store?.shopName || "Store"}`}
              className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#0066FF] outline-none transition-all"
            />
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <div className="max-w-3xl mx-auto">
        {/* Banner */}
        <div className={cn(
          "relative h-44 w-full overflow-hidden md:rounded-b-3xl",
          store?.isShopOpen === false && "grayscale"
        )}>
          <img 
            src={store?.shopBanner || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200"} 
            alt="Store Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Store Profile Overlap */}
        <div className="relative px-4 -mt-12 flex flex-col items-start gap-3">
          {/* Logo */}
          <div className={cn(
            "h-24 w-24 rounded-full border-[5px] border-white shadow-xl overflow-hidden bg-white relative",
            store?.isShopOpen === false && "grayscale"
          )}>
            {store?.isShopOpen === false && (
              <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center">
                <span className="text-[10px] font-black text-white uppercase bg-black/60 px-2 py-0.5 rounded">Closed</span>
              </div>
            )}
            <img 
              src={store?.shopLogo || "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=200"} 
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Action Row */}
          <div className="w-full flex items-center justify-end -mt-6">
             <div className="bg-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border border-slate-50">
               <Star className="text-yellow-400 fill-current" size={16} />
               <span className="text-sm font-bold text-slate-800">5.00/5 (1)</span>
             </div>
          </div>

          {/* Name & Details */}
          <div className="mt-2 w-full">
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              {store?.shopName || "Store Name"}
            </h1>
            
            <div className="mt-3 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin size={16} className="shrink-0" />
                <span className="text-sm font-semibold truncate">
                  {store?.locality ? `${store.locality}, ${store.city}` : "Nearby location available"}
                </span>
                <span className="ml-auto bg-[#E8F3FF] text-[#0066FF] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {store?.distance ? `${store.distance.toFixed(1)} km` : "0.0 km"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                <Clock size={16} className="shrink-0" />
                <div className="flex items-center gap-1.5">
                  {store?.isShopOpen !== false ? (
                    <span className="text-sm font-bold text-emerald-500">Open Now</span>
                  ) : (
                    <span className="text-sm font-bold text-red-500">Closed</span>
                  )}
                  <span className="text-slate-300">•</span>
                  <span className="text-sm font-semibold">MON-FRI 9 TO 5 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LAYOUT WITH SIDEBAR - independent scrolling columns */}
      <div className="max-w-4xl mx-auto flex" style={{ height: 'calc(100dvh - 68px - 70px)', position: 'sticky', top: '68px' }}>
        {/* Sidebar - scrolls independently */}
        <div className="w-[100px] shrink-0 bg-white border-r border-slate-100 overflow-y-auto no-scrollbar z-30 shadow-[4px_0_15px_rgba(0,0,0,0.02)]">
          <StoreCategorySidebar 
            categories={categories}
            activeCategoryId={activeCategoryId}
            onCategoryChange={setActiveCategoryId}
          />
        </div>

        {/* Main Content Area - scrolls independently */}
        <div className="flex-1 bg-white overflow-y-auto no-scrollbar">
          {/* Filters & Sort (Moved Inside Content) */}
          <div className="px-4 py-3 border-b border-slate-50 sticky top-0 z-40 bg-white/95 backdrop-blur-md">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 active:scale-95 transition-all">
                <SlidersHorizontal size={14} />
                Filter
              </button>
              
              <button className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 active:scale-95 transition-all">
                <ArrowUpDown size={14} />
                Sort
              </button>

              <div className="h-6 w-px bg-slate-100 mx-1" />
              
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                {activeCategoryId === 'all' ? 'All Items' : activeCategoryId}
              </span>
            </div>
          </div>

          <main className="px-3 pt-4 pb-12">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in duration-700">
                {/* Coming Soon UI - Premium Look */}
                <div className="relative mb-8">
                  <div className="h-40 w-40 bg-indigo-50 rounded-[40px] flex items-center justify-center relative overflow-hidden shadow-2xl shadow-indigo-100/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
                    <motion.div 
                      animate={{ 
                        y: [0, -10, 0],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="relative z-10"
                    >
                      <div className="h-20 w-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Search size={40} className="text-white" strokeWidth={2.5} />
                      </div>
                    </motion.div>
                    
                    {/* Floating Decorative Elements */}
                    <div className="absolute top-4 right-4 h-3 w-3 bg-yellow-400 rounded-full blur-[1px]" />
                    <div className="absolute bottom-8 left-6 h-2 w-2 bg-indigo-300 rounded-full" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full mb-6">
                  <span className="h-2 w-2 bg-indigo-600 rounded-full animate-pulse" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">Stay Tuned</span>
                </div>

                <h3 className="text-3xl font-black text-slate-900 leading-tight mb-4 tracking-tighter">
                  COMING <span className="text-indigo-600">SOON</span>
                </h3>

                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-10 max-w-[280px] mx-auto">
                  Our awesome products for <span className="text-slate-900 font-bold">"{categories.find(c => c.id === activeCategoryId)?.name || 'this category'}"</span> are almost ready. Prepare to discover the best items very soon!
                </p>

                <div className="w-full flex flex-col gap-3 max-w-[280px]">
                  <button 
                    onClick={() => setActiveCategoryId("all")}
                    className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        <SlidersHorizontal size={20} className="text-slate-400 group-hover:text-indigo-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-slate-800">Keep Exploring</p>
                        <p className="text-[10px] font-bold text-slate-400">Browse other categories</p>
                      </div>
                    </div>
                    <ArrowLeft size={18} className="text-slate-300 rotate-180" />
                  </button>

                  <button className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                        <Search size={20} className="text-slate-400 group-hover:text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-slate-800">Search Items</p>
                        <p className="text-[10px] font-bold text-slate-400">Find exactly what you need</p>
                      </div>
                    </div>
                    <ArrowLeft size={18} className="text-slate-300 rotate-180" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-2 gap-y-4">
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    quickComm
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 5. DYNAMIC FOOTER MESSAGE */}
      <div className="max-w-3xl mx-auto px-4 mt-12 mb-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          - End of Catalog -
        </p>
      </div>
    </div>
  );
};

export default StoreDetailPage;
