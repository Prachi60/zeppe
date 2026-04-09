import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Search, ShieldCheck, Store } from "lucide-react";
import ProductCard from "../components/shared/ProductCard";
import { customerApi } from "../services/customerApi";
import { useLocation as useAppLocation } from "../context/LocationContext";
import {
  formatStoreAddress,
  resolveStoreLogo,
} from "../utils/storeVisuals";

function mapProduct(product) {
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
    deliveryTime: "8-15 mins",
    variants: Array.isArray(product.variants) ? product.variants : [],
  };
}

function formatDistance(distance) {
  const value = Number(distance || 0);
  if (!Number.isFinite(value)) return "Nearby";
  return `${value.toFixed(1)} km away`;
}

const StoreDetailPage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { currentLocation } = useAppLocation();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStore = async () => {
      const hasValidLocation =
        Number.isFinite(currentLocation?.latitude) &&
        Number.isFinite(currentLocation?.longitude);
      if (!hasValidLocation || !storeId) {
        setError("Your location is needed to browse store products.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const [storesResponse, productsResponse] = await Promise.all([
          customerApi.getNearbySellers({
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
          }),
          customerApi.getStoreProducts(storeId, {
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
          }),
        ]);

        const storesPayload = storesResponse?.data;
        const nearbyStores = storesPayload?.result || storesPayload?.results || [];
        const resolvedStore = Array.isArray(nearbyStores)
          ? nearbyStores.find((item) => String(item?._id) === String(storeId))
          : null;

        const productPayload = productsResponse?.data;
        const productItems =
          productPayload?.result?.items ||
          productPayload?.results ||
          [];

        if (!resolvedStore) {
          setError("This store is not available for your current location.");
          setStore(null);
          setProducts([]);
          return;
        }

        setStore(resolvedStore);
        setProducts(Array.isArray(productItems) ? productItems : []);
      } catch (loadError) {
        console.error("Failed to load store detail:", loadError);
        setError(
          loadError?.response?.data?.message ||
            "We couldn't load this store right now.",
        );
        setStore(null);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStore();
  }, [currentLocation?.latitude, currentLocation?.longitude, storeId]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const mapped = products.map(mapProduct);
    if (!query) return mapped;
    return mapped.filter((product) =>
      String(product.name || "").toLowerCase().includes(query),
    );
  }, [products, searchQuery]);

  const storeLogo = resolveStoreLogo(store || { _id: storeId });
  const address = formatStoreAddress(store || {});

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-slate-50/95 px-4 pt-4 pb-3 backdrop-blur-sm md:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-200/70"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#45B0E2]">
              Store
            </p>
            <h1 className="truncate text-lg font-black text-slate-900">
              {store?.shopName || store?.name || "Store details"}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-4 md:px-8 md:pt-8">
        {isLoading && (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center text-sm font-semibold text-slate-500 shadow-sm">
            Loading store...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Store size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Store unavailable</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">{error}</p>
            <Link
              to="/stores"
              className="mt-6 inline-flex rounded-full bg-[#45B0E2] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#2d9bd1]"
            >
              Back to stores
            </Link>
          </div>
        )}

        {!isLoading && !error && store && (
          <>
            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <div className="relative px-4 pb-5 pt-5 md:px-6 md:pb-6 md:pt-6">
                <div className="flex items-end gap-4">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border-4 border-white bg-white shadow-lg md:h-28 md:w-28">
                    <img
                      src={storeLogo}
                      alt={store.shopName || store.name || "Store logo"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="pb-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#45B0E2]">
                      Store Info
                    </p>
                    <h2 className="mt-1 text-[28px] font-black leading-none tracking-tight text-slate-900 md:text-[34px]">
                      {store.shopName || store.name}
                    </h2>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF8FD] px-3 py-1.5 text-[11px] font-bold text-[#1D9BD1]">
                    <ShieldCheck size={14} />
                    Trusted Store
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600">
                    Fast-moving groceries
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600">
                    Daily essentials
                  </span>
                </div>

                <p className="mt-4 text-sm font-medium leading-6 text-slate-600 md:max-w-3xl">
                  {store.shopName || store.name} me daily use grocery products, quick-repeat essentials,
                  snacks, dairy aur home needs ka curated stock milta hai. Fresh availability ke saath
                  fast dispatch aur nearby delivery experience ke liye ye store optimized hai.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Address
                    </p>
                    <div className="mt-2 flex items-start gap-2">
                      <MapPin size={16} className="mt-0.5 text-[#45B0E2]" />
                      <p className="text-sm font-semibold leading-5 text-slate-700">
                        {address || "Nearby store address available on delivery selection."}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Delivery
                    </p>
                    <p className="mt-2 text-base font-black text-slate-900">8-15 mins</p>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Quick order processing for nearby shoppers.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Reach
                    </p>
                    <p className="mt-2 text-base font-black text-slate-900">
                      {formatDistance(store?.distance)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Best selling products visible based on nearby stock.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)] md:p-6">
              <div className="mb-5 flex flex-col gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#45B0E2]">
                    Product Catalog
                  </p>
                  <h3 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                    Products of Shop
                  </h3>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    {store.shopName || store.name} ke available products yahan browse karo.
                  </p>
                </div>
                <label className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Search size={18} className="text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search within this store"
                    className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </label>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <h4 className="text-lg font-bold text-slate-900">No matching products</h4>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Try a different search or come back later for more products.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      storeWide
                      neutralBg
                      className="w-full max-w-none"
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default StoreDetailPage;
