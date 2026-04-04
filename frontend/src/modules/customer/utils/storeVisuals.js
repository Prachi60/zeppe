const STORE_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1579113800032-c38bd7635818?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1604719312566-8912e9c8a213?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=1200&auto=format&fit=crop",
];

function hashString(value = "") {
  return String(value)
    .split("")
    .reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) >>> 0, 7);
}

export function getStoreCoverImage(storeId) {
  const hash = hashString(storeId);
  return STORE_IMAGE_POOL[hash % STORE_IMAGE_POOL.length];
}

export function resolveStoreCoverImage(store = {}) {
  return (
    String(store.shopBanner || "").trim() ||
    String(store.shopLogo || "").trim() ||
    getStoreCoverImage(store._id || store.id || store.shopName || store.name || "store")
  );
}

export function resolveStoreLogo(store = {}) {
  return (
    String(store.shopLogo || "").trim() ||
    String(store.shopBanner || "").trim() ||
    getStoreCoverImage(store._id || store.id || store.shopName || store.name || "store")
  );
}

export function formatStoreAddress(store = {}) {
  return [
    store.address,
    store.locality,
    store.city,
    store.state,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}
