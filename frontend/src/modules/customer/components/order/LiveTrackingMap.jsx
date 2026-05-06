import React, { useEffect, useState, useRef, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleMap, useJsApiLoader, Marker, Polyline } from "@react-google-maps/api";
import {
  MapPin,
  Navigation,
  Phone,
  MessageSquare,
  Shield,
  Clock,
  Star,
  Search,
  Loader2,
} from "lucide-react";
import customerPin from "@/assets/customer-pin.png";
import storePin from "@/assets/store-pin.png";

const libraries = ["geometry"];

const containerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "350px",
};

// Significantly faster recenter for smoother "follow" feeling
const RECENTER_INTERVAL_MS = 4000; 
const RIDER_FOCUS_RADIUS_M = 500;
const INTERPOLATION_STEP_MS = 30; // 33fps for interpolation

/** Delivery / rider search statuses */
const SEARCHING_STATUSES = [
  "pending",
  "confirmed",
  "delivery_search",
  "DELIVERY_SEARCH",
  "seller_accepted",
  "SELLER_ACCEPTED",
  "created",
  "CREATED",
];

function hasValidLatLng(location) {
  return (
    location &&
    typeof location.lat === "number" &&
    typeof location.lng === "number" &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng)
  );
}

/**
 * Custom Airplane Emoji Pin - Premium Marker Style
 */
const getAirplaneEmojiPin = (heading = 0) => {
  // We wrap the 🛩️ emoji in a high-end white circular pin with shadows and brand-blue accents.
  // The plane itself rotates inside the pin.
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <!-- Shadow and base glow -->
      <circle cx="32" cy="32" r="28" fill="white" />
      <circle cx="32" cy="32" r="28" stroke="#45B0E2" stroke-width="3" />
      
      <!-- Subtle internal ring -->
      <circle cx="32" cy="32" r="24" stroke="#45B0E2" stroke-width="1" stroke-dasharray="4 4" opacity="0.4" />
      
      <!-- Directional Indicator (Small blue triangle pointing where the plane is facing) -->
      <g transform="rotate(${heading} 32 32)">
        <path d="M32 4 L36 12 L28 12 Z" fill="#45B0E2" />
        
        <!-- The Emoji itself -->
        <text x="32" y="38" font-size="34" text-anchor="middle" dominant-baseline="middle" style="font-family: Arial, sans-serif;">🛩️</text>
      </g>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const LiveTrackingMap = memo(({
  status = "out for delivery",
  eta = "8 mins",
  riderName = "Ramesh Kumar",
  riderLocation,
  sellerLocation,
  destinationLocation,
  routePhase = "pickup",
  routePolyline,
  onOpenInMaps,
}) => {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const isSearching = SEARCHING_STATUSES.includes(status?.toLowerCase());
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState("");
  
  // Interpolation state
  const [interpolatedRider, setInterpolatedRider] = useState(riderLocation);
  const riderRef = useRef(riderLocation);
  const interpTimerRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "customer-tracking-map",
    googleMapsApiKey: apiKey,
    libraries,
  });

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    setMapInstance(map);
  }, []);

  const focusOnRider500m = useCallback((map, rider) => {
    if (!map || !window.google || !hasValidLatLng(rider)) return;
    const center = new window.google.maps.LatLng(rider.lat, rider.lng);
    const bounds = new window.google.maps.LatLngBounds();
    const offsets = [0, 90, 180, 270];
    offsets.forEach((heading) => {
      const point = window.google.maps.geometry.spherical.computeOffset(
        center,
        RIDER_FOCUS_RADIUS_M,
        heading,
      );
      bounds.extend(point);
    });
    map.fitBounds(bounds, 24);
  }, []);

  // Handle interpolation when riderLocation changes
  useEffect(() => {
    if (!hasValidLatLng(riderLocation)) return;
    
    if (!hasValidLatLng(riderRef.current)) {
      setInterpolatedRider(riderLocation);
      riderRef.current = riderLocation;
      return;
    }

    if (interpTimerRef.current) clearInterval(interpTimerRef.current);

    const startPos = { ...riderRef.current };
    const endPos = { ...riderLocation };
    
    const duration = 1500;
    const steps = duration / INTERPOLATION_STEP_MS;
    let currentStep = 0;

    interpTimerRef.current = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setInterpolatedRider(endPos);
        riderRef.current = endPos;
        clearInterval(interpTimerRef.current);
        return;
      }

      const ratio = currentStep / steps;
      const nextLat = startPos.lat + (endPos.lat - startPos.lat) * ratio;
      const nextLng = startPos.lng + (endPos.lng - startPos.lng) * ratio;
      
      const nextPos = {
        ...endPos,
        lat: nextLat,
        lng: nextLng,
      };
      
      setInterpolatedRider(nextPos);
      riderRef.current = nextPos;
    }, INTERPOLATION_STEP_MS);

    return () => {
      if (interpTimerRef.current) clearInterval(interpTimerRef.current);
    };
  }, [riderLocation?.lat, riderLocation?.lng]);

  const effectiveRiderLocation = interpolatedRider || 
    (hasValidLatLng(sellerLocation) ? sellerLocation : 
    (hasValidLatLng(destinationLocation) ? destinationLocation : null));

  const activeTargetLocation = routePhase === "delivery" ? destinationLocation : sellerLocation;
  const shouldShowStoreMarker =
    routePhase === "pickup" && hasValidLatLng(sellerLocation) && !(!interpolatedRider && hasValidLatLng(sellerLocation));
  const shouldShowCustomerMarker =
    routePhase === "delivery" && hasValidLatLng(destinationLocation);

  const decodedPath = useMemo(() => {
    if (!routePolyline?.polyline || !isLoaded || !window.google?.maps?.geometry?.encoding) {
      return null;
    }
    try {
      return window.google.maps.geometry.encoding.decodePath(routePolyline.polyline);
    } catch (err) {
      console.error("[LiveTrackingMap] Error decoding polyline:", err);
      return null;
    }
  }, [routePolyline, isLoaded]);

  const getRiderIcon = (heading) => {
    if (!isLoaded) return undefined;
    const url = getAirplaneEmojiPin(heading || 0);
    if (typeof window !== "undefined" && window.google?.maps?.Size) {
      return {
        url,
        scaledSize: new window.google.maps.Size(48, 48),
        anchor: new window.google.maps.Point(24, 24),
      };
    }
    return url;
  };

  const getCustomerIcon = () => {
    if (!isLoaded || !customerPin) return undefined;
    if (typeof window !== "undefined" && window.google?.maps?.Size) {
      return {
        url: customerPin,
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40),
      };
    }
    return customerPin;
  };

  const getStoreIcon = () => {
    if (!isLoaded || !storePin) return undefined;
    if (typeof window !== "undefined" && window.google?.maps?.Size) {
      return {
        url: storePin,
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40),
      };
    }
    return storePin;
  };

  const riderMarkerIcon = useMemo(() => getRiderIcon(interpolatedRider?.heading), [isLoaded, interpolatedRider?.heading]);
  const customerMarkerIcon = getCustomerIcon();
  const storeMarkerIcon = getStoreIcon();

  const mapCenter = useMemo(() => {
    if (effectiveRiderLocation) return effectiveRiderLocation;
    if (hasValidLatLng(activeTargetLocation)) return activeTargetLocation;
    return { lat: 20.5937, lng: 78.9629 };
  }, [activeTargetLocation, effectiveRiderLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;

    if (hasValidLatLng(interpolatedRider)) {
      focusOnRider500m(map, interpolatedRider);
      return;
    }
    
    try {
      const bounds = new window.google.maps.LatLngBounds();
      let hasPoints = false;
      
      if (decodedPath && decodedPath.length > 0) {
        decodedPath.forEach((point) => bounds.extend(point));
        hasPoints = true;
      } else {
        if (interpolatedRider) {
          bounds.extend(interpolatedRider);
          hasPoints = true;
        }
        if (hasValidLatLng(activeTargetLocation)) {
          bounds.extend(activeTargetLocation);
          hasPoints = true;
        }
      }
      
      if (hasPoints) {
        map.fitBounds(bounds, 60);
      }
    } catch (err) {
      console.error("Error fitting bounds:", err);
    }
  }, [activeTargetLocation, interpolatedRider, decodedPath, focusOnRider500m]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !hasValidLatLng(interpolatedRider)) return undefined;

    const intervalId = setInterval(() => {
      const map = mapRef.current;
      if (!map || !hasValidLatLng(interpolatedRider)) return;
      map.panTo(interpolatedRider);
      focusOnRider500m(map, interpolatedRider);
    }, RECENTER_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isLoaded, interpolatedRider?.lat, interpolatedRider?.lng, focusOnRider500m]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev + 0.5) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isSearching) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [isSearching]);

  const norm = status?.toLowerCase?.() || "";
  if (norm === "cancelled" || norm === "canceled") {
    return (
      <div className="relative w-full min-h-[220px] bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden rounded-b-[2rem] flex flex-col items-center justify-center gap-3 px-6 py-10 border-b border-slate-200">
        <div className="h-14 w-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
          <Clock size={28} />
        </div>
        <h3 className="text-lg font-black text-slate-800 text-center">
          Order cancelled
        </h3>
        <p className="text-sm text-slate-500 text-center max-w-sm font-medium">
          This order is closed. If payment was reserved, any applicable refund
          follows your store policy.
        </p>
      </div>
    );
  }

  if (norm === "seller_pending") {
    return (
      <div className="relative w-full min-h-[260px] bg-gradient-to-br from-[#f0faf4] to-[#e8f5e9] overflow-hidden rounded-b-[2rem] flex flex-col items-center justify-center gap-3 px-6 py-10 border-b border-brand-100">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-16 w-16 bg-[#45B0E2] rounded-full flex items-center justify-center shadow-lg shadow-brand-200">
          <Clock size={30} className="text-white" />
        </motion.div>
        <h3 className="text-lg font-black text-gray-800 text-center">
          Waiting for seller to accept
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-sm font-medium">
          The store has up to 60 seconds to confirm. If they don&apos;t, your
          order will be cancelled automatically.
        </p>
      </div>
    );
  }

  if (isSearching) {
    return (
      <div className="relative w-full h-[320px] bg-gradient-to-br from-[#f0faf4] to-[#e8f5e9] overflow-hidden rounded-b-[2rem] flex flex-col items-center justify-center gap-4">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border-2 border-[#45B0E2]/20"
            initial={{ width: 60, height: 60, opacity: 0.8 }}
            animate={{ width: 60 + i * 70, height: 60 + i * 70, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeOut",
            }}
          />
        ))}

        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="relative z-10 h-16 w-16 bg-[#45B0E2] rounded-full flex items-center justify-center shadow-xl shadow-brand-200">
          <Search size={28} className="text-white" />
        </motion.div>

        <div className="relative z-10 text-center px-6">
          <h3 className="text-lg font-black text-gray-800">
            Searching for delivery partner{dots}
          </h3>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Hang tight! We're finding the best rider near you.
          </p>
        </div>

        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative z-10 bg-white px-4 py-2 rounded-full shadow-md border border-brand-100 flex items-center gap-2">
          <div className="h-2 w-2 bg-brand-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
            {status === "confirmed"
              ? "Order Confirmed · Assigning Rider"
              : "Order Placed · Finding Rider"}
          </span>
        </motion.div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="relative w-full h-[350px] bg-slate-100 rounded-b-[2rem] flex items-center justify-center text-center px-4">
        <p className="text-xs text-slate-500">
          Set <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code> to show live tracking.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="relative w-full h-[350px] bg-rose-50 rounded-b-[2rem] flex items-center justify-center text-xs text-rose-700 px-4">
        Map failed to load. Check the API key and billing.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative w-full h-[350px] bg-slate-50 rounded-b-[2rem] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-600" size={28} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[350px] bg-[#E5E3DF] overflow-hidden rounded-b-[2rem] shadow-md border-b border-gray-200">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={14}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
      >
        {effectiveRiderLocation && (
          <Marker
            position={effectiveRiderLocation}
            title="Delivery Partner"
            icon={riderMarkerIcon}
          />
        )}

        {shouldShowStoreMarker && (
          <Marker
            position={sellerLocation}
            title="Store Location"
            icon={storeMarkerIcon}
          />
        )}

        {shouldShowCustomerMarker && (
          <Marker
            position={destinationLocation}
            title="Your Location"
            icon={customerMarkerIcon}
          />
        )}

        {decodedPath && decodedPath.length > 0 ? (
          <Polyline
            path={decodedPath}
            options={{
              strokeColor: "#45B0E2",
              strokeOpacity: 0.8,
              strokeWeight: 4,
              geodesic: false,
            }}
          />
        ) : effectiveRiderLocation && hasValidLatLng(activeTargetLocation) ? (
          <Polyline
            path={[effectiveRiderLocation, activeTargetLocation]}
            options={{
              strokeColor: "#45B0E2",
              strokeOpacity: 0.6,
              strokeWeight: 3,
              geodesic: true,
            }}
          />
        ) : null}
      </GoogleMap>

      <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-start">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/50 flex items-center gap-3">
          <div className="h-10 w-10 bg-brand-50 rounded-xl flex items-center justify-center text-[#45B0E2]">
            <Clock size={20} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Arriving in
            </p>
            <h2 className="text-xl font-black text-gray-900 leading-none">
              {eta}
            </h2>
          </div>
        </motion.div>
        <button
          type="button"
          className="bg-white/90 backdrop-blur-md rounded-full px-3 py-2 shadow-lg border border-white/50 cursor-pointer hover:bg-white transition-colors flex items-center gap-1.5 text-[10px] font-bold text-slate-700"
          onClick={() => {
            if (typeof onOpenInMaps === "function") {
              onOpenInMaps({ riderLocation, destinationLocation });
            }
          }}
        >
          <MapPin size={14} className="text-[#45B0E2]" />
          Open in Maps
        </button>
      </div>

      {routePolyline && (
        <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur px-2 py-1 rounded-md text-[10px] text-slate-600 font-bold border border-slate-200 shadow-sm">
          Live Tracking Active • {Math.round(interpolatedRider?.speed || 0)} km/h
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.status === nextProps.status &&
    prevProps.eta === nextProps.eta &&
    prevProps.riderName === nextProps.riderName &&
    prevProps.riderLocation?.lat === nextProps.riderLocation?.lat &&
    prevProps.riderLocation?.lng === nextProps.riderLocation?.lng &&
    prevProps.riderLocation?.heading === nextProps.riderLocation?.heading &&
    prevProps.sellerLocation?.lat === nextProps.sellerLocation?.lat &&
    prevProps.sellerLocation?.lng === nextProps.sellerLocation?.lng &&
    prevProps.destinationLocation?.lat === nextProps.destinationLocation?.lat &&
    prevProps.destinationLocation?.lng === nextProps.destinationLocation?.lng &&
    prevProps.routePhase === nextProps.routePhase &&
    prevProps.routePolyline?.phase === nextProps.routePolyline?.phase &&
    prevProps.routePolyline?.polyline === nextProps.routePolyline?.polyline &&
    prevProps.routePolyline?.cachedAt === nextProps.routePolyline?.cachedAt
  );
});

LiveTrackingMap.displayName = 'LiveTrackingMap';

export default LiveTrackingMap;
