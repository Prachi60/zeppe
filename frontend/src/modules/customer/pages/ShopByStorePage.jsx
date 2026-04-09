import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, Star, Store } from "lucide-react";
import { customerApi } from "../services/customerApi";
import { useLocation as useAppLocation } from "../context/LocationContext";
import { formatStoreAddress, resolveStoreLogo } from "../utils/storeVisuals";

function resolveStoreRating(store = {}) {
  const candidates = [
    store.rating,
    store.averageRating,
    store.avgRating,
    store.sellerRating,
    store.metrics?.rating,
  ];

  const realRating = candidates.find((value) => Number.isFinite(Number(value)));
  if (Number.isFinite(Number(realRating)) && Number(realRating) > 0) {
    return Math.min(5, Number(realRating)).toFixed(1);
  }

  const seed = String(
    store._id || store.id || store.shopName || store.name || "store",
  );
  const hash = seed
    .split("")
    .reduce((acc, char) => ((acc * 33) + char.charCodeAt(0)) >>> 0, 17);

  return (4 + (hash % 9) / 10).toFixed(1);
}

const ShopByStorePage = () => {
  const navigate = useNavigate();
  const { currentLocation } = useAppLocation();
  const [stores, setStores] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStores = async () => {
      const hasValidLocation =
        Number.isFinite(currentLocation?.latitude) &&
        Number.isFinite(currentLocation?.longitude);
      if (!hasValidLocation) {
        setStores([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await customerApi.getNearbySellers({
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        });
        const payload = response?.data;
        const items = payload?.result || payload?.results || [];
        setStores(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error("Failed to load nearby stores:", error);
        setStores([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStores();
  }, [currentLocation?.latitude, currentLocation?.longitude]);

  const filteredStores = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return stores;

    return stores.filter((store) => {
      const haystack = [
        store.shopName,
        store.name,
        store.category,
        store.address,
        store.locality,
        store.city,
      ]
        .map((item) => String(item || "").toLowerCase())
        .join(" ");
      return haystack.includes(query);
    });
  }, [searchQuery, stores]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 pt-4 pb-28 md:px-8 md:pt-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#45B0E2]">
            Browse Stores
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            Nearby Stores
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Choose a store to explore only that store&apos;s products.
          </p>
        </div>

        <div className="mb-7 rounded-[28px] border border-slate-200/80 bg-white p-3.5 shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
          <label className="flex items-center gap-3 rounded-[22px] bg-slate-50 px-4 py-3.5">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search for a store"
              className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
        </div>

        <div className="space-y-2">
          {isLoading && (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
              Loading nearby stores...
            </div>
          )}

          {!isLoading && filteredStores.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Store size={24} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">No stores found</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Try another search or change your delivery location.
              </p>
            </div>
          )}

          {!isLoading &&
            filteredStores.map((store) => {
              const storeName = store.shopName || store.name || "Store";
              const storeLogo = resolveStoreLogo(store);
              const address = formatStoreAddress(store);
              const rating = resolveStoreRating(store);
              const initial = (storeName || "S")[0].toUpperCase();

              return (
                <button
                  key={store._id}
                  type="button"
                  onClick={() => navigate(`/stores/${store._id}`)}
                  className="group w-full flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 text-left shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 active:scale-[0.99]"
                >
                  {/* Store Logo */}
                  <div className="relative flex-shrink-0">
                    <div className="h-14 w-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                      {storeLogo ? (
                        <img
                          src={storeLogo}
                          alt={storeName}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span
                        className="text-xl font-black text-slate-400"
                        style={{ display: storeLogo ? 'none' : 'flex' }}
                      >
                        {initial}
                      </span>
                    </div>
                  </div>

                  {/* Store Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-[15px] font-bold text-slate-900 truncate">
                        {storeName}
                      </h2>
                      <div className="flex flex-shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                        <Star size={11} className="fill-current" />
                        <span className="text-[11px] font-black">{rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="shrink-0 text-slate-400" />
                      <p className="text-[12px] font-medium text-slate-400 truncate">
                        {address || "Location not available"}
                      </p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 text-slate-300 group-hover:text-slate-500 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default ShopByStorePage;
