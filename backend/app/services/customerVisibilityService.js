import Seller from "../models/seller.js";
import { calculateDistance } from "../utils/helper.js";

const MAX_SELLER_SEARCH_DISTANCE_M = 100000;

export function parseCustomerCoordinates(query = {}) {
  const lat = Number(query.lat);
  const lng = Number(query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { valid: false, lat: null, lng: null };
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { valid: false, lat: null, lng: null };
  }

  return { valid: true, lat, lng };
}

export async function getNearbySellerIdsForCustomer(lat, lng) {
  // Fetch all active and verified sellers
  const sellers = await Seller.find({
    isActive: true,
    isVerified: true,
  })
    .select("_id location serviceRadius")
    .lean();

  // If no coordinates provided, return all active/verified sellers
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return sellers.map((s) => String(s._id));
  }

  return sellers
    .filter((seller) => {
      const coords = seller?.location?.coordinates;
      // Fallback: If no location is set (0,0), include them so they show up for everyone
      // This matches the admin panel visibility
      if (!Array.isArray(coords) || coords.length < 2 || (coords[0] === 0 && coords[1] === 0)) {
        return true; 
      }

      const [sellerLng, sellerLat] = coords;
      if (!Number.isFinite(sellerLat) || !Number.isFinite(sellerLng)) {
        return true;
      }

      const distanceKm = calculateDistance(lat, lng, sellerLat, sellerLng);
      // Include if within radius OR if radius is very large (fallback)
      return distanceKm <= (seller.serviceRadius || 5) || distanceKm <= MAX_SELLER_SEARCH_DISTANCE_M / 1000;
    })
    .map((seller) => String(seller._id));
}

