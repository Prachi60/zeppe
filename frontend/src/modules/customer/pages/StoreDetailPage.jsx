import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Search, ShieldCheck, Store } from "lucide-react";
import ProductCard from "../components/shared/ProductCard";
import { customerApi } from "../services/customerApi";
import { useLocation as useAppLocation } from "../context/LocationContext";
import { formatStoreAddress, getStoreCoverImage } from "../utils/storeVisuals";

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

  const coverImage = getStoreCoverImage(storeId);
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
            <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <div className="relative h-52 overflow-hidden md:h-72">
                <img
                  src={coverImage}
                  alt={store.shopName || store.name || "Store"}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  Verified Store
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="mb-2 text-[11px] font-black uppercase tracking-[0.28em] text-sky-200">
                    {store.category || "Local store"}
                  </p>
                  <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                    {store.shopName || store.name}
                  </h2>
                  {store.description && (
                    <p className="mt-3 max-w-2xl text-sm font-medium text-slate-200 md:text-base">
                      {store.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 px-5 py-5 md:grid-cols-3 md:px-6">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Distance
                  </p>
                  <p className="mt-2 text-base font-bold text-slate-900">
                    {formatDistance(store.distance)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 md:col-span-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Address
                  </p>
                  <div className="mt-2 flex items-start gap-2 text-sm font-medium text-slate-600">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                    <span>{address || "Address not available"}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900">
                    Products from this store
                  </h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Explore items available only from {store.shopName || store.name}.
                  </p>
                </div>
                <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 md:min-w-[320px]">
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
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      compact
                      neutralBg
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
