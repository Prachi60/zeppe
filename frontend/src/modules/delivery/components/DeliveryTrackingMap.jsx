import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";
import customerPin from "@/assets/customer-pin.png";
import { deliveryApi } from "../services/deliveryApi";
import storePin from "@/assets/store-pin.png";
import deliveryRiderIcon from "@/assets/delivery-rider.png";
import {
  getCachedDeliveryPartnerLocation,
  saveDeliveryPartnerLocation,
} from "../utils/deliveryLastLocation";

const libraries = ["geometry"];
const ROUTE_REFRESH_THRESHOLD_M = 150;
const ROUTE_REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const RECENTER_INTERVAL_MS = 5000;
const RIDER_FOCUS_RADIUS_M = 500;

const containerStyle = {
  width: "100%",
  height: "100%",
  minHeight: "200px",
};

/** GeoJSON [lng, lat] → { lat, lng } */
function coordsToLatLng(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const [lng, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function distanceMeters(from, to) {
  if (!from || !to) return null;
  const r = 6371000;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function destinationForPhase(order, phase) {
  const isReturn = order?.returnStatus && order.returnStatus !== "none";
  if (phase === "pickup") {
    if (isReturn) {
      const loc = order?.address?.location;
      return loc && Number.isFinite(loc.lat) ? { lat: loc.lat, lng: loc.lng } : null;
    }
    return coordsToLatLng(order?.seller?.location?.coordinates);
  }
  if (isReturn) return coordsToLatLng(order?.seller?.location?.coordinates);
  const loc = order?.address?.location;
  return loc && Number.isFinite(loc.lat) ? { lat: loc.lat, lng: loc.lng } : null;
}

/**
 * Custom Airplane Emoji Pin for Rider Side
 */
const getRiderIcon = (isLoaded) => {
  if (!isLoaded) return undefined;
  if (typeof window !== "undefined" && window.google?.maps?.Size) {
    return {
      url: deliveryRiderIcon,
      scaledSize: new window.google.maps.Size(48, 48),
      anchor: new window.google.maps.Point(24, 48),
    };
  }
  return deliveryRiderIcon;
};

const DeliveryTrackingMapComponent = ({
  orderId,
  phase,
  order,
  onRouteStatsChange,
}) => {
  const mapRef = useRef(null);
  const routePolylineRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [rider, setRider] = useState(() => {
    const c = getCachedDeliveryPartnerLocation();
    return c ? { lat: c.lat, lng: c.lng, heading: 0 } : null;
  });
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const lastFetchRef = useRef({ at: 0, phase: null, orderId: null });
  const routeOriginRef = useRef(null);
  const watchIdRef = useRef(null);
  const visibilityHandlerRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "delivery-tracking-map",
    googleMapsApiKey: apiKey,
    libraries,
  });

  useEffect(() => {
    if (!navigator.geolocation) return undefined;

    const startWatch = () => {
      if (watchIdRef.current != null) return;
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;
          const heading = pos.coords.heading || 0;
          const speed = pos.coords.speed;

          saveDeliveryPartnerLocation(lat, lng);
          setRider({ lat, lng, heading, speed });

          deliveryApi.postLocation({
            lat,
            lng,
            accuracy,
            heading,
            speed,
            orderId: orderId || null,
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
      );
    };

    const stopWatch = () => {
      if (watchIdRef.current == null) return;
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    };

    startWatch();

    visibilityHandlerRef.current = () => {
      if (document.visibilityState === "visible") startWatch();
      else stopWatch();
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", visibilityHandlerRef.current);
    }

    return () => {
      stopWatch();
      if (typeof document !== "undefined" && visibilityHandlerRef.current) {
        document.removeEventListener("visibilitychange", visibilityHandlerRef.current);
      }
    };
  }, [orderId]);

  const fetchRoute = useCallback(async () => {
    if (!orderId || !rider) return;
    const now = Date.now();
    const sameRouteContext = lastFetchRef.current.phase === phase && lastFetchRef.current.orderId === orderId;
    const originDrift = routeOriginRef.current ? distanceMeters(routeOriginRef.current, rider) : null;

    if (sameRouteContext && lastFetchRef.current.at && now - lastFetchRef.current.at < ROUTE_REFRESH_INTERVAL_MS && (originDrift === null || originDrift < ROUTE_REFRESH_THRESHOLD_M)) {
      return;
    }

    lastFetchRef.current = { at: now, phase, orderId };
    setRouteLoading(true);
    try {
      const res = await deliveryApi.getOrderRoute(orderId, {
        phase,
        originLat: rider.lat,
        originLng: rider.lng,
        _t: now,
      });
      if (res.data?.success) {
        setRouteData(res.data.result || res.data.data || null);
        routeOriginRef.current = { lat: rider.lat, lng: rider.lng };
      }
    } catch {
      setRouteData((prev) => prev || { degraded: true });
    } finally {
      setRouteLoading(false);
    }
  }, [orderId, phase, rider]);

  useEffect(() => {
    setRouteData((prev) => (prev?.phase === phase ? prev : null));
    lastFetchRef.current = { at: 0, phase: null, orderId: null };
    routeOriginRef.current = null;
  }, [orderId, phase]);

  useEffect(() => {
    if (!rider) return undefined;
    fetchRoute();
    const iv = setInterval(fetchRoute, ROUTE_REFRESH_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [rider, fetchRoute, phase, orderId]);

  const dest = useMemo(() => destinationForPhase(order, phase), [order, phase]);

  useEffect(() => {
    if (typeof onRouteStatsChange !== "function") return undefined;
    onRouteStatsChange({
      phase,
      rider,
      destination: dest,
      routeDurationSeconds: Number(routeData?.duration) || null,
      routeDistanceMeters: Number(routeData?.distanceMeters ?? routeData?.distance) || null,
    });
    return undefined;
  }, [onRouteStatsChange, phase, rider, dest, routeData]);

  const linePath = useMemo(() => {
    const encoded = routeData?.polyline;
    if (!encoded || !isLoaded || !window.google?.maps?.geometry?.encoding) return [];
    try {
      return window.google.maps.geometry.encoding.decodePath(encoded);
    } catch {
      return [];
    }
  }, [routeData?.polyline, isLoaded]);

  const riderMarkerIcon = useMemo(() => getRiderIcon(isLoaded), [isLoaded]);

  const customerMarkerIcon = useMemo(() => {
    if (!isLoaded || !customerPin) return undefined;
    return { url: customerPin, scaledSize: new window.google.maps.Size(40, 40), anchor: new window.google.maps.Point(20, 40) };
  }, [isLoaded]);

  const storeMarkerIcon = useMemo(() => {
    if (!isLoaded || !storePin) return undefined;
    return { url: storePin, scaledSize: new window.google.maps.Size(40, 40), anchor: new window.google.maps.Point(20, 40) };
  }, [isLoaded]);

  const mapCenter = useMemo(() => rider || dest || { lat: 20.5937, lng: 78.9629 }, [rider, dest]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    setMapInstance(map);
  }, []);

  const focusOnRider500m = useCallback((map, riderLocation) => {
    if (!map || !window.google?.maps?.geometry?.spherical || !riderLocation) return;
    const center = new window.google.maps.LatLng(riderLocation.lat, riderLocation.lng);
    const bounds = new window.google.maps.LatLngBounds();
    [0, 90, 180, 270].forEach((h) => bounds.extend(window.google.maps.geometry.spherical.computeOffset(center, RIDER_FOCUS_RADIUS_M, h)));
    map.fitBounds(bounds, 24);
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapInstance || !linePath?.length) return undefined;
    const pl = new window.google.maps.Polyline({ path: linePath, strokeColor: "#2563eb", strokeOpacity: 0.95, strokeWeight: 4, map: mapInstance });
    routePolylineRef.current = pl;
    return () => { if (routePolylineRef.current) routePolylineRef.current.setMap(null); };
  }, [isLoaded, mapInstance, linePath]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;
    if (rider) { focusOnRider500m(map, rider); return; }
    try {
      const bounds = new window.google.maps.LatLngBounds();
      if (linePath?.length) linePath.forEach((p) => bounds.extend(p));
      if (dest) bounds.extend(dest);
      map.fitBounds(bounds, 32);
    } catch {}
  }, [linePath, rider, dest, focusOnRider500m]);

  useEffect(() => {
    if (!isLoaded || !rider) return undefined;
    const map = mapRef.current;
    if (!map) return undefined;
    const id = setInterval(() => { map.panTo(rider); focusOnRider500m(map, rider); }, RECENTER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isLoaded, rider?.lat, rider?.lng, focusOnRider500m]);

  if (!apiKey) return <div className="relative w-full h-48 bg-slate-100 rounded-2xl flex items-center justify-center text-center px-4"><p className="text-xs text-slate-500">Set API Key.</p></div>;
  if (!isLoaded) return <div className="relative w-full h-48 bg-slate-50 rounded-2xl flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={28} /></div>;

  const isReturn = order?.returnStatus && order.returnStatus !== "none";

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={14}
        onLoad={onMapLoad}
        options={{ disableDefaultUI: true, zoomControl: true }}
      >
        {rider && <Marker position={rider} title="Your location" icon={riderMarkerIcon} />}
        {dest && (
          <Marker
            position={dest}
            title={phase === "pickup" ? (isReturn ? "Pickup (customer)" : "Pickup (store)") : (isReturn ? "Drop (seller)" : "Drop (customer)")}
            icon={phase === "pickup" ? (isReturn ? customerMarkerIcon : storeMarkerIcon) : (isReturn ? storeMarkerIcon : customerMarkerIcon)}
          />
        )}
      </GoogleMap>
      <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur px-2 py-1 rounded-md text-[10px] text-slate-600 font-bold border border-slate-200 shadow-sm">
        {routeLoading ? "Updating route…" : "Tracking View"}
      </div>
    </div>
  );
}

const DeliveryTrackingMap = memo(DeliveryTrackingMapComponent, (prevProps, nextProps) => {
  const destPrev = destinationForPhase(prevProps.order, prevProps.phase);
  const destNext = destinationForPhase(nextProps.order, nextProps.phase);
  return prevProps.orderId === nextProps.orderId && prevProps.phase === nextProps.phase && destPrev?.lat === destNext?.lat && destPrev?.lng === destNext?.lng;
});

DeliveryTrackingMap.displayName = 'DeliveryTrackingMap';
export default DeliveryTrackingMap;
