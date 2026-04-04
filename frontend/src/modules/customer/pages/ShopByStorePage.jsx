import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, ShieldCheck, Store } from "lucide-react";
import { customerApi } from "../services/customerApi";
import { useLocation as useAppLocation } from "../context/LocationContext";
import { formatStoreAddress, resolveStoreCoverImage, resolveStoreLogo } from "../utils/storeVisuals";

function formatDistance(distance) {
  const value = Number(distance || 0);
  if (!Number.isFinite(value)) return "Nearby";
  return `${value.toFixed(1)} km`;
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
        <div className="mb-5">
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

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
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

        <div className="space-y-4">
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
              const coverImage = resolveStoreCoverImage(store);
              const storeLogo = resolveStoreLogo(store);
              const address = formatStoreAddress(store);

              return (
                <button
                  key={store._id}
                  type="button"
                  onClick={() => navigate(`/stores/${store._id}`)}
                  className="w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white text-left shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(15,23,42,0.10)]"
                >
                  <div className="relative h-40 overflow-hidden md:h-48">
                    <img
                      src={coverImage}
                      alt={store.shopName || store.name || "Store"}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/10 to-transparent" />
                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      Verified Store
                    </div>
                    <div className="absolute bottom-4 right-4 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
                      {formatDistance(store.distance)}
                    </div>
                  </div>

                  <div className="space-y-3 p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                          <img
                            src={storeLogo}
                            alt={store.shopName || store.name || "Store logo"}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                        <h2 className="text-xl font-black tracking-tight text-slate-900">
                          {store.shopName || store.name || "Store"}
                        </h2>
                        {store.category && (
                          <p className="mt-1 text-xs font-black uppercase tracking-[0.22em] text-[#45B0E2]">
                            {store.category}
                          </p>
                        )}
                        </div>
                      </div>
                    </div>

                    {address && (
                      <div className="flex items-start gap-2 text-sm font-medium text-slate-500">
                        <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                        <span className="line-clamp-2">{address}</span>
                      </div>
                    )}

                    {store.description && (
                      <p className="line-clamp-2 text-sm font-medium text-slate-500">
                        {store.description}
                      </p>
                    )}
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
