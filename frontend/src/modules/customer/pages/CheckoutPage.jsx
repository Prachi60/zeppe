import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation as useRouteLocation } from "react-router-dom";
import Lottie from "lottie-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../../../core/context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { customerApi } from "../services/customerApi";
import { useLocation as useAppLocation } from "../context/LocationContext";
import {
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  ChevronRight,
  ChevronLeft,
  Share2,
  Gift,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Heart,
  Truck,
  Tag,
  Sparkles,
  Plus,
  Minus,
  Search,
  X,
  Clipboard,
  Check,
  Contact2,
  Wallet,
  PhoneOff,
  BellOff,
  DoorOpen,
  Shield,
  PawPrint,
  MoreHorizontal,
  MessageCircle,
  Twitter,
  Facebook,
  Mail,
  Link2,
  Navigation,
  Loader2,
  Home,
  Briefcase,
  AlertCircle
} from "lucide-react";
import { 
  GoogleMap, 
  Marker, 
  Autocomplete, 
  useJsApiLoader 
} from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@shared/components/ui/Toast";
import { useSettings } from "@core/context/SettingsContext";
import SlideToPay from "../components/shared/SlideToPay";
import { getCachedGeocode, setCachedGeocode } from "@/core/utils/geocodeCache";
import {
  getOrderSocket,
  joinOrderRoom,
  leaveOrderRoom,
  onOrderStatusUpdate,
} from "@/core/services/orderSocket";
import ProductCard from "../components/shared/ProductCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import emptyBoxAnimation from "../../../assets/lottie/Empty box.json";

const CheckoutPage = () => {
  const {
    cart,
    addToCart,
    cartTotal,
    cartCount,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const { wishlist, addToWishlist, fetchFullWishlist, isFullDataFetched } =
    useWishlist();
  const { showToast } = useToast();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { settings } = useSettings();
 
  // Fetch full wishlist data if not already fetched
  useEffect(() => {
    if (isAuthenticated && !isFullDataFetched) {
      fetchFullWishlist();
    }
  }, [isAuthenticated, isFullDataFetched, fetchFullWishlist]);

  const appName = settings?.appName || "App";
  const {
    savedAddresses: locationSavedAddresses,
    refreshAddresses,
    currentLocation,
    refreshLocation,
    isFetchingLocation,
    updateLocation,
  } = useAppLocation();

  useEffect(() => {
    if (isAuthenticated) {
      refreshAddresses();
    }
  }, [isAuthenticated, refreshAddresses]);
  const navigate = useNavigate();
  const routeLocation = useRouteLocation();

  // State management
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("now");
  const [selectedPayment, setSelectedPayment] = useState("cash");
  const [selectedTip, setSelectedTip] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [gstin, setGstin] = useState("");
  const validateGSTIN = (gst) => {
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return regex.test(gst);
  };
  const [isGstinModalOpen, setIsGstinModalOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState(0);
  const [customDonation, setCustomDonation] = useState("5");
  const [isGiftPackaging, setIsGiftPackaging] = useState(false);
  const [showAllCartItems, setShowAllCartItems] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isResolvingAddressCoords, setIsResolvingAddressCoords] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
  const [walletAmountToUse, setWalletAmountToUse] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [pricingPreview, setPricingPreview] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });
  const [mapMarker, setMapMarker] = useState(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  
  const { isLoaded: isMapsLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: ['places', 'geometry']
  });

  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);

  const sliderRef = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const postOrderNavigateRef = useRef(null);
  const [currentAddress, setCurrentAddress] = useState({
    type: "Home",
    name: user?.name || "",
    address: currentLocation?.name || "",
    landmark: "",
    city: [currentLocation?.city, currentLocation?.state].filter(Boolean).join(", "),
    phone: user?.phone || "",
    location: currentLocation?.latitude && currentLocation?.longitude ? {
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
    } : undefined,
  });
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);
  const [editAddressForm, setEditAddressForm] = useState({
    type: "Home",
    name: user?.name || "",
    address: currentLocation?.name || "",
    landmark: "",
    city: [currentLocation?.city, currentLocation?.state].filter(Boolean).join(", "),
    phone: user?.phone || "",
  });
  const [showRecipientForm, setShowRecipientForm] = useState(false);
  const [recipientData, setRecipientData] = useState({
    // city: 'Select city',
    completeAddress: "",
    houseAddress: "",
    landmark: "",
    pincode: "",
    name: "",
    phone: "",
    lat: null,
    lng: null,
  });

  // Sync map with currentLocation
  useEffect(() => {
    if (isMapsLoaded && currentLocation?.latitude && currentLocation?.longitude) {
      const pos = { lat: currentLocation.latitude, lng: currentLocation.longitude };
      setMapCenter(pos);
      if (!mapMarker) {
        setMapMarker(pos);
        // Also update recipientData so it has initial coords
        setRecipientData(prev => ({
          ...prev,
          lat: pos.lat,
          lng: pos.lng
        }));
        // Trigger reverse geocode for the initial spot if completeAddress is empty
        if (!recipientData.completeAddress) {
          reverseGeocode(pos);
        }
      }
    }
  }, [isMapsLoaded, currentLocation, mapMarker, recipientData.completeAddress]);
  const [savedRecipient, setSavedRecipient] = useState(null);

  // 1. Sync currentAddress with savedAddresses (e.g. if one was deleted)
  useEffect(() => {
    // Only if we have a saved address selected (has an ID)
    if (currentAddress?.id) {
      const stillExists = locationSavedAddresses.some(addr => addr.id === currentAddress.id);
      if (!stillExists) {
        // If it's gone, try to pick the first available saved address
        if (locationSavedAddresses.length > 0) {
          const first = locationSavedAddresses[0];
          handleSelectSavedAddress(first);
        } else {
          // No saved addresses left? Reset to GPS/Select Location
          setCurrentAddress({
            type: "Home",
            name: user?.name || "",
            address: currentLocation?.name || "Select Location",
            landmark: "",
            city: [currentLocation?.city, currentLocation?.state].filter(Boolean).join(", "),
            phone: user?.phone || "",
            location: currentLocation?.latitude && currentLocation?.longitude ? {
              lat: currentLocation.latitude,
              lng: currentLocation.longitude,
            } : undefined,
          });
        }
      }
    }
  }, [locationSavedAddresses, currentAddress?.id, user, currentLocation]);

  // 2. Auto-select address if coming back from AddressesPage with a specific ID
  useEffect(() => {
    const targetId = routeLocation.state?.selectedAddressId;
    if (targetId && locationSavedAddresses.length > 0) {
      const found = locationSavedAddresses.find(a => a.id === targetId || a._id === targetId);
      if (found) {
        handleSelectSavedAddress(found);
        // Clear the state so it doesn't re-trigger on subsequent renders
        navigate(routeLocation.pathname, { replace: true, state: {} });
      }
    }
  }, [routeLocation.state, locationSavedAddresses, navigate]);

  const [recommendedProducts, setRecommendedProducts] = useState([]);


  const [coupons, setCoupons] = useState([]);
  const [manualCode, setManualCode] = useState("");

  const deliveryAddress = {
    type: "Home",
    name: "John Doe",
    address: "Flat 402, Sunshine Apartments, Sector 12, Dwarka",
    city: "New Delhi - 110075",
  };

  const timeSlots = [
    { id: "now", label: "Now", sublabel: "10-15 min" },
    { id: "30min", label: "30 min", sublabel: "Standard" },
    { id: "1hour", label: "1 hour", sublabel: "Scheduled" },
    { id: "2hours", label: "2 hours", sublabel: "Scheduled" },
  ];

  const paymentMethods = [
    ...(settings?.onlineEnabled === false
      ? []
      : [
          {
            id: "online",
            label: "Pay Online",
            icon: CreditCard,
            sublabel: "UPI / Cards / NetBanking",
          },
        ]),
    ...(settings?.codEnabled === false
      ? []
      : [
          {
            id: "cash",
            label: "Cash on Delivery",
            icon: Banknote,
            sublabel: "Pay after delivery",
          },
        ]),
  ];

  const tipAmounts = [
    { value: 0, label: "No Tip" },
    { value: 10, label: "₹10" },
    { value: 20, label: "₹20" },
    { value: 30, label: "₹30" },
  ];

  const deliveryFee = pricingPreview?.deliveryFeeCharged || 0;
  const handlingFee = pricingPreview?.handlingFeeCharged || 0;
  const tipAmount = pricingPreview?.tipTotal || selectedTip || 0;
  const taxAmount = pricingPreview?.taxTotal || 0;
  const discountAmount = selectedCoupon
    ? selectedCoupon.discountAmount || selectedCoupon.discount || 0
    : 0;
  const totalAmount = (pricingPreview?.grandTotal || 0) + (Number(donationAmount) || 0) + (isGiftPackaging ? 25 : 0);

  const checkoutGrandTotal = pricingPreview?.grandTotal || 0;
  const nextTen = Math.ceil((checkoutGrandTotal + 1) / 10) * 10;
  const roundOffAmount = nextTen - checkoutGrandTotal;

  const CART_PREVIEW_LIMIT = 3;
  const displayCartItems = showAllCartItems ? cart : cart.slice(0, CART_PREVIEW_LIMIT);

  const RECIPIENT_STORAGE_KEY = "zeppe_checkout_recipient_v1";

  // Derived display values for primary delivery card
  const displayName = savedRecipient?.name || currentAddress.name || user?.name || "";
  const displayPhone =
    savedRecipient?.phone || currentAddress.phone || user?.phone || "";
  const displayAddress = savedRecipient
    ? [savedRecipient.houseAddress, savedRecipient.completeAddress, savedRecipient.landmark]
        .filter(Boolean)
        .join(", ") + (savedRecipient.pincode ? ` - ${savedRecipient.pincode}` : "")
    : `${currentAddress.address}${currentAddress.landmark ? `, ${currentAddress.landmark}` : ""}, ${currentAddress.city}`;

  useEffect(() => {
    if (!paymentMethods.length) return;
    const exists = paymentMethods.some((method) => method.id === selectedPayment);
    if (!exists) {
      setSelectedPayment(paymentMethods[0].id);
    }
  }, [paymentMethods, selectedPayment]);

  useEffect(() => {
    if (useWallet && user?.walletBalance && pricingPreview?.grandTotal) {
      const maxAvailable = Number(user.walletBalance || 0);
      // Include donation and gift packaging in the base for wallet calculation so wallet doesn't over-cover
      const totalToPay = Number(pricingPreview.grandTotal || 0) + Number(donationAmount || 0) + (isGiftPackaging ? 25 : 0);
      setWalletAmountToUse(Math.min(maxAvailable, totalToPay));
    } else {
      setWalletAmountToUse(0);
    }
  }, [useWallet, user?.walletBalance, pricingPreview?.grandTotal, donationAmount, isGiftPackaging]);

  const finalAmountToPay = Math.max(0, (pricingPreview?.grandTotal || 0) + (Number(donationAmount) || 0) + (isGiftPackaging ? 25 : 0) - walletAmountToUse);

  const buildAddressForOrder = (overrideAddress = null) => {
    // Prevent React SyntheticEvents or DOM Events from being treated as address overrides
    const addressToUse = (overrideAddress && typeof overrideAddress === "object" && overrideAddress.address)
      ? overrideAddress
      : null;

    if (savedRecipient) {
      return {
        type: "Other",
        name: savedRecipient.name,
        address: [savedRecipient.houseAddress, savedRecipient.completeAddress]
          .filter(Boolean)
          .join(", "),
        landmark: savedRecipient.landmark || "",
        city: savedRecipient.pincode ? `${savedRecipient.pincode}` : "",
        phone: savedRecipient.phone,
        location:
          savedRecipient.lat && savedRecipient.lng
            ? { lat: savedRecipient.lat, lng: savedRecipient.lng }
            : undefined,
      };
    }

    const addrObj = addressToUse || currentAddress;
    const addrLoc = addrObj?.location || (addrObj?.lat && addrObj?.lng ? { lat: addrObj.lat, lng: addrObj.lng } : null);
    const hasAddrLoc =
      addrLoc &&
      typeof addrLoc.lat === "number" &&
      typeof addrLoc.lng === "number" &&
      Number.isFinite(addrLoc.lat) &&
      Number.isFinite(addrLoc.lng);

    return {
      ...addrObj,
      location:
        // Important: delivery fee must be based on the selected delivery address,
        // not the device's last detected location (which can be stale).
        hasAddrLoc ? { lat: addrLoc.lat, lng: addrLoc.lng } : undefined,
    };
  };

  const persistAddressToProfile = async (finalAddress) => {
    if (!isAuthenticated || !user) return;
    
    // Check if this address is already saved
    const norm = (s) => String(s || "").toLowerCase().trim();
    const isAlreadySaved = user.addresses?.some(addr => 
      norm(addr.fullAddress || addr.address) === norm(finalAddress.address) && 
      norm(addr.phone) === norm(finalAddress.phone)
    );
    
    if (!isAlreadySaved) {
      try {
        const newAddress = {
          label: ["home", "work", "other"].includes(norm(finalAddress.type)) ? norm(finalAddress.type) : "other",
          fullAddress: finalAddress.address,
          name: finalAddress.name,
          phone: finalAddress.phone,
          landmark: finalAddress.landmark,
          location: finalAddress.location
        };
        const updatedAddresses = [...(user.addresses || []), newAddress];
        await customerApi.updateProfile({ addresses: updatedAddresses });
        await refreshUser();
      } catch (err) {
        console.error("[Checkout] Failed to auto-save address:", err);
      }
    }
  };

  const handleSaveRecipient = () => {
    if (!recipientData.completeAddress) {
      showToast("Please select a location on the map", "error");
      return;
    }
    if (!recipientData.houseAddress || !recipientData.name) {
      showToast("Please fill all required fields (*)", "error");
      return;
    }
    if (recipientData.phone.replace(/\D/g, '').length !== 10) {
      showToast("Please enter a valid 10-digit phone number", "error");
      return;
    }
    setSavedRecipient(recipientData);
    setShowRecipientForm(false);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          RECIPIENT_STORAGE_KEY,
          JSON.stringify(recipientData),
        );
      }
    } catch {
      // ignore storage errors
    }
    showToast("Recipient details saved!", "success");
  };

  const handleUpdatePhone = async () => {
    if (newPhone.length !== 10) {
      showToast("Please enter a valid 10-digit phone number", "error");
      return;
    }
    setIsUpdatingPhone(true);
    try {
      await customerApi.updateProfile({ phone: newPhone });
      await refreshUser();
      setCurrentAddress(prev => ({ ...prev, phone: newPhone }));
      setIsPhoneModalOpen(false);
      showToast("Phone number updated successfully", "success");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update phone number", "error");
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const handleMoveToWishlist = (item) => {
    addToWishlist(item);
    removeFromCart(item.id, item.variantSku);
    showToast(`${item.name} moved to wishlist`, "success");
  };

  const handleOpenEditAddress = () => {
    setEditAddressForm(currentAddress);
    setIsEditAddressOpen(true);
  };

  const isValidLatLng = (loc) =>
    loc &&
    typeof loc.lat === "number" &&
    typeof loc.lng === "number" &&
    Number.isFinite(loc.lat) &&
    Number.isFinite(loc.lng);

  const resolveAddressCoords = async (addressText) => {
    const q = String(addressText || "").trim();
    if (!q) return null;

    // Prefer placeId resolution if the current address has one (more reliable than text geocode).
    // Note: This helper is called with raw address text; placeId resolution happens in caller when available.
    const cacheKey = `addr:${q}`;
    const cached = getCachedGeocode(cacheKey);
    if (cached?.location?.lat && cached?.location?.lng) {
      return cached.location;
    }

    // Prefer backend geocoding (server key) so billing is controlled centrally.
    try {
      const resp = await customerApi.geocodeAddress(q);
      const loc = resp.data?.result?.location;
      if (isValidLatLng(loc)) {
        setCachedGeocode(cacheKey, { location: { lat: loc.lat, lng: loc.lng } });
        return { lat: loc.lat, lng: loc.lng };
      }
    } catch (e) {
      const serverMsg =
        e?.response?.data?.message ||
        e?.response?.data?.error?.message ||
        e?.message ||
        null;
      // Bubble up a helpful message for UI.
      const err = new Error(serverMsg || "Could not geocode address");
      err.__serverMsg = serverMsg;
      throw err;
    }

    return null;
  };

  const handleSelectSavedAddress = async (addr) => {
    const rawText = addr?.address || "";
    const addrLoc = addr?.location;
    const hasLoc = isValidLatLng(addrLoc);
    const pid = typeof addr?.placeId === "string" ? addr.placeId.trim() : "";

    setIsResolvingAddressCoords(true);
    try {
      let resolvedLoc = null;
      try {
        if (hasLoc) {
          resolvedLoc = addrLoc;
        } else if (pid) {
          const cacheKey = `pid:${pid}`;
          const cached = getCachedGeocode(cacheKey);
          if (cached?.location?.lat && cached?.location?.lng) {
            resolvedLoc = cached.location;
          } else {
            const resp = await customerApi.geocodePlaceId(pid);
            const loc = resp.data?.result?.location;
            if (isValidLatLng(loc)) {
              resolvedLoc = { lat: loc.lat, lng: loc.lng };
              setCachedGeocode(cacheKey, { location: resolvedLoc });
            }
          }
        } else {
          resolvedLoc = await resolveAddressCoords(rawText);
        }
      } catch (e) {
        showToast(
          e?.__serverMsg ||
            e?.message ||
            "Could not fetch coordinates for this address. Delivery charges may not update.",
          "error",
        );
      }

      // Don't proceed with a stale location; keep the modal open so the user can pick/edit again.
      if (!resolvedLoc) {
        showToast(
          "Could not fetch coordinates for this address. Please edit the address or choose a different one.",
          "error",
        );
        return;
      }

      const newAddr = {
        id: addr.id,
        type: addr.label,
        name: addr.name || user?.name || "",
        address: rawText,
        city: "", // already part of addr.address string
        phone: addr.phone || user?.phone || "",
        landmark: "", // already baked into addr.address if present
        ...(pid ? { placeId: pid } : {}),
        ...(resolvedLoc ? { location: resolvedLoc } : {}),
      };
      setCurrentAddress(newAddr);

      if (resolvedLoc) {
        updateLocation(
          {
            name: rawText,
            time: currentLocation?.time || "12-15 mins",
            city: currentLocation?.city,
            state: currentLocation?.state,
            pincode: currentLocation?.pincode,
            latitude: resolvedLoc.lat,
            longitude: resolvedLoc.lng,
          },
          { persist: true, updateSavedHome: false },
        );
      }

      setIsAddressModalOpen(false);
    } finally {
      setIsResolvingAddressCoords(false);
    }
  };

  const handleSaveEditedAddress = async () => {
    if (
      !editAddressForm.name.trim() ||
      !editAddressForm.address.trim() ||
      !editAddressForm.city.trim()
    ) {
      showToast("Please fill name, address and city", "error");
      return;
    }

    // Best-effort forward geocode so delivery pricing uses the edited address (not stale device coords).
    let location = null;
    let placeId = null;
    let formattedAddress = null;
    try {
      const query = [
        editAddressForm.address,
        editAddressForm.landmark,
        editAddressForm.city,
      ]
        .filter(Boolean)
        .join(", ");
      const resp = await customerApi.geocodeAddress(query);
      const loc = resp.data?.result?.location;
      if (
        loc &&
        typeof loc.lat === "number" &&
        typeof loc.lng === "number" &&
        Number.isFinite(loc.lat) &&
        Number.isFinite(loc.lng)
      ) {
        location = { lat: loc.lat, lng: loc.lng };
        placeId = resp.data?.result?.placeId || null;
        formattedAddress = resp.data?.result?.formattedAddress || null;
        updateLocation(
          {
            name: resp.data?.result?.formattedAddress || query,
            time: currentLocation?.time || "12-15 mins",
            city: currentLocation?.city,
            state: currentLocation?.state,
            pincode: currentLocation?.pincode,
            latitude: loc.lat,
            longitude: loc.lng,
          },
          { persist: true, updateSavedHome: false },
        );
      }
    } catch (e) {
      // If geocoding fails, keep the edited address but warn: distance-based pricing may be inaccurate.
      showToast(
        e.response?.data?.message ||
          "Could not fetch coordinates for this address. Delivery charges may be inaccurate.",
        "error",
      );
    }

    setCurrentAddress({
      ...editAddressForm,
      ...(location ? { location } : {}),
      ...(placeId ? { placeId } : {}),
      ...(formattedAddress ? { formattedAddress } : {}),
    });
    setIsEditAddressOpen(false);
    showToast("Delivery address updated", "success");
  };

  const handleUseCurrentLiveLocation = async () => {
    const result = await refreshLocation();

    if (result?.ok && result.location) {
      const liveLocation = result.location;
      setCurrentAddress((prev) => ({
        ...prev,
        address: liveLocation.name,
        landmark: "",
        city: [liveLocation.city, liveLocation.state, liveLocation.pincode]
          .filter(Boolean)
          .join(", "),
        ...(typeof liveLocation.latitude === "number" &&
        typeof liveLocation.longitude === "number"
          ? { location: { lat: liveLocation.latitude, lng: liveLocation.longitude } }
          : {}),
      }));
      showToast("Using your current live location", "success");
      return;
    }

    if (currentLocation?.name) {
      setCurrentAddress((prev) => ({
        ...prev,
        address: currentLocation.name,
        landmark: "",
        city: [currentLocation.city, currentLocation.state, currentLocation.pincode]
          .filter(Boolean)
          .join(", "),
        ...(typeof currentLocation.latitude === "number" &&
        typeof currentLocation.longitude === "number"
          ? { location: { lat: currentLocation.latitude, lng: currentLocation.longitude } }
          : {}),
      }));
      showToast("Using your last detected location", "success");
      return;
    }

    showToast(result?.error || "Unable to detect current location", "error");
  };

  const handleShare = async () => {
    setIsShareModalOpen(true);
  };

  const shareLinks = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-emerald-500",
      textColor: "text-emerald-500",
      action: () => {
        const text = `Hi, I have created a cart with ${cartCount} items worth ₹${Math.ceil(finalAmountToPay)}. Please review and make the payment to place the order on ${appName}.`;
        const url = window.location.href;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`, "_blank");
      },
    },
    {
      name: "Twitter",
      icon: Twitter,
      color: "bg-sky-500",
      textColor: "text-sky-500",
      action: () => {
        const text = `Hi, I have created a cart with ${cartCount} items on ${appName}. Please review and pay to place the order.`;
        const url = window.location.href;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
      },
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600",
      textColor: "text-blue-600",
      action: () => {
        const url = window.location.href;
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
      },
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-slate-600",
      textColor: "text-slate-600",
      action: () => {
        const subject = `${appName} Cart Ready for Payment`;
        const body = `Hi, I have created a cart with ${cartCount} items worth ₹${Math.ceil(finalAmountToPay)} on ${appName}.\n\nPlease review and make the payment to place the order here: ${window.location.href}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      },
    },
    {
      name: "Copy Link",
      icon: Link2,
      color: "bg-slate-200",
      textColor: "text-slate-600",
      action: () => {
        navigator.clipboard.writeText(window.location.href);
        showToast("Link copied to clipboard!", "success");
      },
    },
  ];

  const handleMapClick = (e) => {
    const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMapMarker(newPos);
    reverseGeocode(newPos);
  };

  const handleMarkerDragEnd = (e) => {
    const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMapMarker(newPos);
    reverseGeocode(newPos);
  };

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const newPos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setMapCenter(newPos);
        setMapMarker(newPos);
        
        // Extract components
        const components = place.address_components || [];
        const pincode = components.find(c => c.types.includes('postal_code'))?.long_name || '';
        const city = components.find(c => c.types.includes('locality'))?.long_name || '';
        
        setRecipientData(prev => ({
          ...prev,
          completeAddress: place.formatted_address || '',
          pincode: pincode || prev.pincode,
          city: city || prev.city,
          lat: newPos.lat,
          lng: newPos.lng
        }));
      }
    }
  };

  const reverseGeocode = (pos) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: pos }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const result = results[0];
        const components = result.address_components || [];
        const pincode = components.find(c => c.types.includes('postal_code'))?.long_name || '';
        const city = components.find(c => c.types.includes('locality'))?.long_name || '';
        
        setRecipientData(prev => ({
          ...prev,
          completeAddress: result.formatted_address || '',
          pincode: pincode || prev.pincode,
          city: city || prev.city,
          lat: pos.lat,
          lng: pos.lng
        }));
      }
    });
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsMapLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMapCenter(pos);
          setMapMarker(pos);
          reverseGeocode(pos);
          setIsMapLoading(false);
        },
        () => {
          showToast("Unable to get current location", "error");
          setIsMapLoading(false);
        }
      );
    }
  };

  const handleApplyCoupon = async (coupon) => {
    try {
      const payload = {
        code: coupon.code,
        cartTotal,
        items: cart,
        customerId: user?._id,
      };
      const res = await customerApi.validateCoupon(payload);
      if (res.data.success) {
        const data = res.data.result;
        setSelectedCoupon({
          ...coupon,
          ...data,
        });
        setIsCouponModalOpen(false);
        showToast(`Coupon ${coupon.code} applied!`, "success");
      } else {
        showToast(res.data.message || "Unable to apply coupon", "error");
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || "Unable to apply coupon",
        "error",
      );
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    showToast(`${product.name} added to cart!`, "success");
  };

  const getCartItem = (productId) => cart.find((item) => item.id === productId);

  useEffect(() => {
    // Hydrate "order for someone else" address from localStorage, if present
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(RECIPIENT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.completeAddress && parsed.name && parsed.phone) {
            setRecipientData(parsed);
            setSavedRecipient(parsed);
          }
        }
      }
    } catch {
      // ignore parse errors
    }

    const fetchCoupons = async () => {
      try {
        const res = await customerApi.getActiveCoupons();
        if (res.data.success) {
          const rawList = res.data.result || res.data.results;
          const list = Array.isArray(rawList) ? rawList : [];
          setCoupons(list);
        }
      } catch {
        // silently ignore
      }
    };
    fetchCoupons();

    // M-2 FIX: Fetch real recommendations
    customerApi.getProducts({ 
      limit: 6, 
      sort: "popular",
      lat: currentLocation?.latitude,
      lng: currentLocation?.longitude
    })
      .then(r => {
        const items = r.data.result?.items || r.data.result || [];
        setRecommendedProducts(Array.isArray(items) ? items : []);
      })
      .catch(() => {});

    // M-8 FIX: Auto-populate default address from profile
    if (isAuthenticated) {
      customerApi.getProfile().then(r => {
        const profile = r.data.result;
        
        // Show phone modal if missing
        if (!profile?.phone) {
          setIsPhoneModalOpen(true);
        }

        if (profile?.addresses?.length > 0) {
          const defaultAddr = profile.addresses.find(a => a.isDefault) || profile.addresses[0];
          setCurrentAddress({
            type: (defaultAddr.label || "home").charAt(0).toUpperCase() + (defaultAddr.label || "home").slice(1),
            name: profile.name,
            address: defaultAddr.fullAddress || defaultAddr.address,
            landmark: defaultAddr.landmark || "",
            city: [defaultAddr.city, defaultAddr.state].filter(Boolean).join(", "),
            phone: profile.phone,
            location: defaultAddr.location,
          });
        }
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || cart.length === 0) {
      setPricingPreview(null);
      return;
    }

    const fetchPreview = async () => {
      try {
        setIsPreviewLoading(true);
          const payload = {
            items: cart.map((item) => ({
              product: item.id || item._id,
              name: item.name,
              variantSku: String(item.variantSku || "").trim(),
              quantity: item.quantity,
              price: item.price,
              image: item.image,
            })),
            address: buildAddressForOrder(),
            discountTotal: discountAmount,
            taxTotal: 0,
            tipAmount: selectedTip,
            paymentMode: selectedPayment === "online" ? "ONLINE" : "COD",
            timeSlot: selectedTimeSlot,
          };
        const res = await customerApi.checkoutPreview(payload);
        if (res.data?.success) {
          setPricingPreview(res.data.result?.breakdown || null);
        }
      } catch (error) {
        console.error("Checkout preview failed", error);
      } finally {
        setIsPreviewLoading(false);
      }
    };

    fetchPreview();
  }, [
    isAuthenticated,
    cart,
    selectedPayment,
    selectedTip,
    selectedTimeSlot,
    discountAmount,
    savedRecipient,
    currentAddress,
    currentLocation,
  ]);

  const handlePlaceOrder = async (overrideAddress = null) => {
    // Prevent React SyntheticEvents or DOM Events from being treated as address overrides
    const addressToUse = (overrideAddress && typeof overrideAddress === "object" && overrideAddress.address)
      ? overrideAddress
      : null;

    const activeAddress = addressToUse || currentAddress;

    // Guard: ensure phone number exists
    if (!user?.phone && !activeAddress.phone && !savedRecipient?.phone) {
      setIsPhoneModalOpen(true);
      showToast("Please provide a phone number for delivery coordination", "warning");
      return;
    }

    // Guard: block order if seller's shop is closed
    const hasClosedShopItem = cart.some((item) => item.sellerIsOpen === false);
    if (hasClosedShopItem) {
      showToast(
        "This shop is currently closed and cannot accept orders. Please try again later.",
        "error",
      );
      return;
    }

    setIsPlacingOrder(true);
    try {
        const orderData = {
          address: buildAddressForOrder(addressToUse),
          paymentMode: selectedPayment === "online" ? "ONLINE" : "COD",
          discountTotal: discountAmount,
          taxTotal: taxAmount,
          tipAmount: selectedTip,
          timeSlot: selectedTimeSlot,
          walletAmount: walletAmountToUse,
          gstin: gstin || undefined,
          donationAmount: Number(donationAmount) || 0,
          isGiftPackaging: isGiftPackaging || false,
          items: cart.map((item) => ({
            product: item.id || item._id,
            name: item.name,
            variantSku: String(item.variantSku || "").trim(),
            quantity: item.quantity,
            price: item.price,
            image: item.image,
          })),
        };

      const response = await customerApi.createOrder(orderData);

      if (response.data.success) {
        const result = response.data.result;
        const mainOrder = result.order || (Array.isArray(result.orders) ? result.orders[0] : null);
        const mainOrderId = mainOrder?.orderId || result.orderId;
        const paymentRef = result.paymentRef || result.checkoutGroupId || mainOrderId;
        
        if (Number(donationAmount) > 0) {
          const donationKey = `donation_${mainOrderId || paymentRef || 'latest'}`;
          localStorage.setItem(donationKey, String(donationAmount));
          localStorage.setItem('latest_donation_amount', String(donationAmount));
        }
        
        console.log("[CheckoutPage] Order placed. Result:", result, "Target ID:", mainOrderId);
        
        if (!mainOrderId) {
          console.error("[CheckoutPage] CRITICAL: Order ID missing from response!", result);
          setIsPlacingOrder(false);
          showToast("Order placed but ID not received. Checking order history...", "warning");
          navigate("/orders");
          return;
        }

        // If online payment, initiate gateway redirect
        if (selectedPayment === "online") {
          try {
            const paymentRes = await customerApi.createPaymentOrder({
              orderRef: paymentRef,
              orderId: mainOrderId
            });
            
            if (paymentRes.data.success && paymentRes.data.result?.redirectUrl) {
              // C-4 FIX: DO NOT clearCart here. If redirect fails or user cancels, 
              // the items must still be in the cart for recovery.
              // clearCart is handled in PaymentStatusPage after status verified as PAID.
              window.location.href = paymentRes.data.result.redirectUrl;
              return; // End function here as we are redirecting
            } else {
              throw new Error(paymentRes.data.message || "Failed to initiate payment gateway");
            }
          } catch (payError) {
            console.error("[CheckoutPage] Payment initiation failed:", payError);
            setIsPlacingOrder(false);
            showToast(payError.message || "Order created but payment gateway failed. Please pay from order details.", "error");
            navigate(`/orders/${mainOrderId}`);
            return;
          }
        }
        
        // Auto-persist address and phone for future use
        persistAddressToProfile(orderData.address);

        // COD Flow
        clearCart();
        showToast(`Order placed — waiting for seller to accept.`, "success");
        setOrderId(mainOrderId);
        setShowSuccess(true);

        if (postOrderNavigateRef.current) {
          clearTimeout(postOrderNavigateRef.current);
        }
        postOrderNavigateRef.current = setTimeout(() => {
          postOrderNavigateRef.current = null;
          setIsPlacingOrder(false); 
          navigate(`/orders/${mainOrderId}`);
        }, 3000);
      } else {
        setIsPlacingOrder(false);
        showToast(response.data.message || "Could not place order.", "error");
      }
    } catch (error) {
      console.error("Failed to place order:", error);
      setIsPlacingOrder(false);
      showToast(
        error.response?.data?.message ||
          "Failed to place order. Please try again.",
        "error",
      );
    }
  };

  // After place order: listen for seller timeout / rejection (customer room + order room) and poll as fallback
  useEffect(() => {
    if (!orderId || !showSuccess) return undefined;

    const getToken = () => localStorage.getItem("auth_customer");
    getOrderSocket(getToken);
    joinOrderRoom(orderId, getToken);

    let pollId = null;

    const applyCancelled = (o) => {
      if (o.workflowStatus === "CANCELLED" || o.status === "cancelled") {
        if (postOrderNavigateRef.current) {
          clearTimeout(postOrderNavigateRef.current);
          postOrderNavigateRef.current = null;
        }
        if (pollId != null) clearInterval(pollId);
        setShowSuccess(false);
        showToast(
          "Order cancelled — seller did not accept in time.",
          "error",
        );
        navigate(`/orders/${orderId}`, { replace: true });
        return true;
      }
      return false;
    };

    const tick = () => {
      customerApi
        .getOrderDetails(orderId)
        .then((r) => {
          if (r.data?.result) applyCancelled(r.data.result);
        })
        .catch(() => {});
    };

    const off = onOrderStatusUpdate(getToken, tick);

    tick();
    pollId = setInterval(tick, 4000);

    return () => {
      off();
      if (pollId != null) clearInterval(pollId);
      leaveOrderRoom(orderId, getToken);
    };
  }, [orderId, showSuccess, navigate, showToast]);

  // Map-based precise location has been removed; manual addresses are used instead.

  if (cart.length === 0 && !showSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Artistic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-50/50 via-transparent to-transparent pointer-events-none" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-100/30 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            rotate: [0, -45, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 -left-20 w-60 h-60 bg-yellow-100/40 rounded-full blur-3xl pointer-events-none"
        />

        <motion.div className="relative z-10 flex flex-col items-center text-center max-w-sm mx-auto">
          {/* Empty Cart Illustration */}
          <div className="relative w-56 h-56 md:w-64 md:h-64 mb-8 flex items-center justify-center">
            <motion.div
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 rounded-[2rem] bg-white/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-brand-100">
              <Lottie
                animationData={emptyBoxAnimation}
                loop
                className="h-36 w-36 md:h-44 md:w-44"
              />
            </motion.div>

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 border-dashed border-slate-200 rounded-full"
            />
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">
            Your Cart is Empty
          </h2>
          <p className="text-slate-500 mb-8 leading-relaxed font-medium">
            It feels lighter than air! <br />
            Explore our aisles and fill it with goodies.
          </p>

          <Link
            to="/"
            className="group relative inline-flex items-center justify-center px-8 py-4 bg-[#f59931] text-black font-bold rounded-2xl overflow-hidden shadow-xl shadow-orange-600/20 transition-all hover:scale-[1.02] active:scale-95 w-full sm:w-auto">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative flex items-center gap-2 text-lg">
              Start Shopping <ChevronRight size={20} />
            </span>
          </Link>

          <div className="mt-8 flex gap-6 text-slate-400">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <Clock size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Fast Delivery
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <Tag size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Daily Deals
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <Sparkles size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Fresh Items
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans">
      {/* Shop Closed Warning Banner */}
      {cart.some((item) => item.sellerIsOpen === false) && (
        <div className="bg-red-500 text-white text-sm font-semibold text-center py-2 px-4 flex items-center justify-center gap-2">
          <span>🔴</span>
          <span>This shop is currently closed. You cannot place this order right now.</span>
        </div>
      )}
      {/* Client Reference Header: Clean White */}
      <div className="bg-white border-b border-slate-100 pt-safe pb-2 relative z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center text-slate-800 hover:bg-slate-50 rounded-xl transition-all">
              <ChevronLeft size={24} className="stroke-[2.5]" />
            </button>

            <h1 className="text-lg font-black text-slate-800 tracking-tight">
              Checkout
            </h1>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-slate-800 hover:opacity-80 transition-all font-bold">
              <Share2 size={20} className="stroke-[2]" />
              <span className="text-sm tracking-tight">
                Share
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800 mb-2">Share Order</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Share your {appName} shopping cart with friends and family.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-6">
            {shareLinks.map((platform) => (
              <button
                key={platform.name}
                onClick={() => {
                  platform.action();
                  if (platform.name !== "Copy Link") setIsShareModalOpen(false);
                }}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm",
                  platform.color
                )}>
                  <platform.icon size={20} className="text-white" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{platform.name}</span>
              </button>
            ))}
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsShareModalOpen(false)}
              className="w-full rounded-xl font-bold py-6 bg-slate-50 hover:bg-slate-100 text-slate-600 border-none"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-2xl mx-auto px-4 md:px-6 mt-4 pb-48 relative z-20 space-y-3">
        
        {/* 1. Show all products first */}
        <div className="space-y-3">
          {displayCartItems.map((item) => (
            <div
              key={`${item.id}::${String(item.variantSku || "").trim()}`}
              className="bg-white rounded-2xl p-4 flex items-start gap-3 shadow-sm border border-slate-100/50">
              <div className="h-20 w-20 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 text-sm leading-snug mb-1">
                  {item.name}
                </h4>
                {(item.variantName || item.variantSku) && (
                  <p className="text-xs text-slate-400 font-medium mb-1">
                    {item.variantName || item.variantSku}
                  </p>
                )}
                <button
                  onClick={() => handleMoveToWishlist(item)}
                  className="text-xs text-slate-400 underline font-semibold hover:text-[#f59931] transition-colors">
                  Move to wishlist
                </button>
              </div>
              <div className="flex flex-col items-end justify-between h-20">
                <div className="flex items-center bg-[#f59931] rounded-lg px-2 py-1 select-none">
                  <button
                    onClick={() =>
                      item.quantity > 1
                        ? updateQuantity(item.id, -1, item.variantSku)
                        : removeFromCart(item.id, item.variantSku)
                    }
                    className="text-black px-1.5 hover:opacity-80 transition-opacity">
                    <Minus size={14} className="stroke-[3]" />
                  </button>
                  <span className="text-black font-bold min-w-[18px] text-center text-xs">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1, item.variantSku)}
                    className="text-black px-1.5 hover:opacity-80 transition-opacity">
                    <Plus size={14} className="stroke-[3]" />
                  </button>
                </div>
                {(() => {
                  const mrp = Number(item.price || 0);
                  const sale = Number(item.salePrice || 0);
                  const qty = Math.max(0, Number(item.quantity || 0));
                  const hasDiscount =
                    Number.isFinite(mrp) &&
                    Number.isFinite(sale) &&
                    sale > 0 &&
                    sale < mrp;

                  const unit = hasDiscount ? sale : mrp;
                  const total = Math.round(unit * qty);

                  return (
                    <div className="text-right">
                      <p className="text-base font-black text-slate-900 tracking-tight">
                        ₹{total}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>

        {/* 2. See All Coupons bar */}
        <div
          onClick={() => setIsCouponModalOpen(true)}
          className="bg-white rounded-2xl p-4 flex items-center justify-center cursor-pointer border border-slate-100 shadow-sm">
          <span className="text-slate-600 font-bold text-sm flex items-center gap-1 hover:text-[#f59931] transition-colors">
            See all coupons <ChevronRight size={18} className="text-slate-400" />
          </span>
        </div>

        {/* 3. Bill Details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm mb-4">
            Bill Details
          </h3>

          <div className="space-y-3 border-b border-slate-100 pb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 flex items-center gap-2">
                <Clipboard size={16} className="text-slate-400" />
                Items total
                {selectedCoupon && (
                  <span className="bg-blue-50 text-[#f59931] text-[10px] font-bold px-1.5 py-0.5 rounded">
                    You saved ₹{discountAmount}
                  </span>
                )}
              </span>
              <span className="font-bold text-slate-800">
                ₹{pricingPreview?.productSubtotal ?? cartTotal}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 flex items-center gap-2">
                <Truck size={16} className="text-slate-400" />
                Delivery Charge
              </span>
              <span className={`font-bold text-slate-800 ${deliveryFee === 0 ? "line-through text-slate-400 font-medium" : ""}`}>
                ₹{deliveryFee === 0 ? "0" : deliveryFee}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 flex items-center gap-2">
                <ShoppingBag size={16} className="text-slate-400" />
                Platform Fee
              </span>
              <span className="font-bold text-slate-800">
                ₹{handlingFee}
              </span>
            </div>

            {taxAmount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 flex items-center gap-2">
                  <Tag size={16} className="text-slate-400" />
                  Tax
                </span>
                <span className="font-bold text-slate-800">
                  ₹{taxAmount}
                </span>
              </div>
            )}
            
            {tipAmount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Heart size={16} className="text-slate-400" />
                    Partner Tip
                  </span>
                  <button 
                    onClick={() => {
                      setSelectedTip(0);
                      setCustomTip("");
                      showToast("Tip removed", "success");
                    }}
                    className="text-xs text-red-500 font-bold hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <span className="font-bold text-slate-800">
                  ₹{tipAmount}
                </span>
              </div>
            )}
            
            {donationAmount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Heart size={16} className="text-slate-400" />
                    Feeding India Donation
                  </span>
                  <button 
                    onClick={() => {
                      setDonationAmount(0);
                      setCustomDonation("");
                      showToast("Donation removed", "success");
                    }}
                    className="text-xs text-red-500 font-bold hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <span className="font-bold text-slate-800">
                  ₹{donationAmount}
                </span>
              </div>
            )}

            {isGiftPackaging && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 flex items-center gap-2">
                  <Gift size={16} className="text-slate-400" />
                  Gift Packaging
                </span>
                <span className="font-bold text-slate-800">
                  ₹25
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-between items-center mb-4">
            <span className="font-black text-slate-800 text-sm">
              Grand Amount
            </span>
            <span className="font-black text-slate-900 text-lg">
              ₹{Math.ceil(finalAmountToPay)}
            </span>
          </div>

          {/* Payment method selection & Wallet in context of Bill Details block */}
          {user?.walletBalance > 0 && (
            <div className="border-t border-slate-50 pt-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-bold text-xs flex items-center gap-2">
                  <Wallet size={16} className="text-slate-400" />
                  Use Wallet (₹{user.walletBalance})
                </span>
                <button
                  onClick={() => setUseWallet(!useWallet)}
                  className={`w-10 h-5 rounded-full transition-all relative flex items-center px-1 ${
                    useWallet ? "bg-[#f59931]" : "bg-slate-200"
                  }`}>
                  <motion.div
                    animate={{ x: useWallet ? 20 : 0 }}
                    className="h-3 w-3 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>
            </div>
          )}

          {/* Old select payment mode removed as shifted to the bottom bar */}
        </div>

        {/* 4. Delivery Instructions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm mb-3">
            Delivery instructions
          </h3>
          <div 
            ref={sliderRef}
            onMouseDown={(e) => {
              setIsDown(true);
              setStartX(e.pageX - sliderRef.current.offsetLeft);
              setScrollLeftState(sliderRef.current.scrollLeft);
            }}
            onMouseLeave={() => setIsDown(false)}
            onMouseUp={() => setIsDown(false)}
            onMouseMove={(e) => {
              if (!isDown) return;
              e.preventDefault();
              const x = e.pageX - sliderRef.current.offsetLeft;
              const walk = (x - startX) * 2;
              sliderRef.current.scrollLeft = scrollLeftState - walk;
            }}
            className="flex flex-nowrap gap-3 overflow-x-auto pb-2 no-scrollbar cursor-grab active:cursor-grabbing select-none"
          >
            {[
              { id: "avoid_call", label: "Avoid calling", icon: PhoneOff },
              { id: "no_bell", label: "Don't ring the bell", icon: BellOff },
              { id: "leave_door", label: "Leave at door", icon: DoorOpen },
              { id: "leave_guard", label: "Leave with guard", icon: Shield },
              { id: "pet_home", label: "Pet at home", icon: PawPrint },
            ].map((inst) => {
              const Icon = inst.icon;
              const isChecked = deliveryInstructions.includes(inst.id);
              return (
                <div
                  key={inst.id}
                  onClick={() =>
                    setDeliveryInstructions((prev) =>
                      isChecked
                        ? prev.filter((i) => i !== inst.id)
                        : [...prev, inst.id]
                    )
                  }
                  className={`flex-shrink-0 w-[110px] p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between h-[100px] bg-white ${
                    isChecked ? "border-[#f59931]" : "border-slate-100"
                  }`}>
                  <div className="flex justify-between items-start">
                    <Icon
                      size={18}
                      className={isChecked ? "text-[#f59931]" : "text-slate-400"}
                    />
                    <div
                      className={`h-4 w-4 rounded border flex items-center justify-center ${
                        isChecked ? "bg-[#f59931] border-[#f59931]" : "border-slate-300"
                      }`}>
                      {isChecked && (
                        <Check size={10} className="text-white stroke-[3]" />
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 leading-tight">
                    {inst.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Ordering for Someone Else */}
        <motion.div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-slate-600 font-bold">
              Ordering for someone else?
            </span>
            <button
              onClick={() => setShowRecipientForm(!showRecipientForm)}
              className="text-emerald-600 text-xs font-bold hover:underline">
              {showRecipientForm
                ? "Close"
                : savedRecipient
                  ? "Change details"
                  : "Add details"}
            </button>
          </div>

          {savedRecipient && !showRecipientForm && (
            <div className="mb-4 p-4 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-start justify-between">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center text-[#f59931] flex-shrink-0">
                  <Contact2 size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {savedRecipient.name}
                  </p>
                  <p className="text-xs text-[#f59931] font-bold mb-1">
                    {savedRecipient.phone}
                  </p>
                  <p className="text-xs text-slate-500 leading-tight">
                    {savedRecipient.completeAddress}
                    {savedRecipient.landmark &&
                      `, ${savedRecipient.landmark}`}
                    {savedRecipient.pincode &&
                      ` - ${savedRecipient.pincode}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSavedRecipient(null);
                  setRecipientData({
                    completeAddress: "",
                    houseAddress: "",
                    landmark: "",
                    pincode: "",
                    name: "",
                    phone: "",
                    lat: null,
                    lng: null,
                  });
                  localStorage.removeItem(RECIPIENT_STORAGE_KEY);
                }}
                className="text-red-500 text-xs font-bold hover:underline">
                Remove
              </button>
            </div>
          )}

          <AnimatePresence>
            {showRecipientForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden mb-4">
                <div className="bg-[#f8f9fb] rounded-2xl p-4 border border-slate-100 space-y-4">
                  {/* Map Integration */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-800">
                      Pin delivery location
                    </h4>
                    <div className="rounded-2xl overflow-hidden border border-slate-200 h-48 relative bg-slate-100">
                      {isMapsLoaded ? (
                        <>
                          <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%' }}
                            center={mapCenter}
                            zoom={15}
                            onClick={handleMapClick}
                            onLoad={map => mapRef.current = map}
                            options={{
                              disableDefaultUI: true,
                              zoomControl: true,
                              gestureHandling: 'greedy'
                            }}
                          >
                            {mapMarker && (
                              <Marker
                                position={mapMarker}
                                draggable={true}
                                onDragEnd={handleMarkerDragEnd}
                              />
                            )}
                          </GoogleMap>
                          
                          {/* Location actions overlay on map */}
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              onClick={handleUseCurrentLocation}
                              disabled={isMapLoading}
                              className="h-10 w-10 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center text-[#f59931] shadow-lg hover:bg-white transition-colors"
                            >
                              {isMapLoading ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Loader2 className="animate-spin text-slate-300" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Tap on map or drag pin to set exact delivery spot
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3">
                      Enter delivery address details
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Location Area (from map)</Label>
                        <Input
                          placeholder="Move pin to the desired location area"
                          value={recipientData.completeAddress}
                          readOnly
                          className="h-12 rounded-xl border-slate-100 bg-slate-50 text-slate-500 text-sm font-medium cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">House / Flat / Floor*</Label>
                        <Input
                          placeholder="e.g. Flat 402, 4th Floor"
                          value={recipientData.houseAddress}
                          maxLength={150}
                          onChange={(e) =>
                            setRecipientData({
                              ...recipientData,
                              houseAddress: e.target.value,
                            })
                          }
                          className="h-12 rounded-xl border-slate-200 focus:ring-[#f59931] focus:border-[#f59931] text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nearest Landmark (optional)</Label>
                        <Input
                          placeholder="e.g. Near City Mall"
                          value={recipientData.landmark}
                          maxLength={100}
                          onChange={(e) =>
                            setRecipientData({
                              ...recipientData,
                              landmark: e.target.value,
                            })
                          }
                          className="h-12 rounded-xl border-slate-200 focus:ring-[#f59931] focus:border-[#f59931] text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Pincode</Label>
                        <Input
                          placeholder="Enter pin code"
                          value={recipientData.pincode}
                          maxLength={6}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setRecipientData({
                              ...recipientData,
                              pincode: val,
                            });
                          }}
                          className="h-12 rounded-xl border-slate-200 focus:ring-[#f59931] focus:border-[#f59931] text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">
                      Enter receiver details
                    </h4>
                    <p className="text-[10px] text-slate-400 mb-3 font-medium">
                      We'll contact receiver to get the exact delivery
                      address
                    </p>
                    <div className="space-y-3">
                      <Input
                        placeholder="Receiver's name*"
                        value={recipientData.name}
                        maxLength={50}
                        onChange={(e) =>
                          setRecipientData({
                            ...recipientData,
                            name: e.target.value,
                          })
                        }
                        className="h-12 rounded-xl border-slate-200 focus:ring-[#f59931] focus:border-[#f59931] text-sm"
                      />
                      <Input
                        placeholder="Receiver's phone number*"
                        value={recipientData.phone}
                        maxLength={10}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setRecipientData({
                            ...recipientData,
                            phone: val,
                          });
                        }}
                        className="h-12 rounded-xl border-slate-200 focus:ring-[#f59931] focus:border-[#f59931] text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveRecipient}
                    className="w-full h-12 bg-[#FF9F33] hover:bg-[#E68A1F] text-black font-extrabold rounded-xl shadow-md transition-all active:scale-[0.98]">
                    Save address
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* GSTIN, Donation, Tipping, Gift Wrap Additions */}
        <div className="space-y-3 mb-3">
          {/* 1. Add GSTIN */}
          <div 
            onClick={() => setIsGstinModalOpen(true)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/50 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all select-none"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-base">
                %
              </div>
              <div>
                <h4 className="text-slate-800 text-xs font-bold flex items-center gap-1.5">
                  Add GSTIN
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {gstin ? `GSTIN: ${gstin}` : "Claim GST input credit up to 18% on your order"}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />
          </div>

          {/* 2. Donate to Feeding India */}
          <div className="bg-[#FFF5F6] rounded-2xl p-4 shadow-sm border border-rose-100/50 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h4 className="text-slate-800 text-xs font-bold">Donate to Feeding India</h4>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Your continued support will help us serve daily meals to children.
            </p>
            <div className="bg-white/80 rounded-xl p-3 flex items-center justify-center relative min-h-[50px]">
              <span className="text-2xl select-none">👦</span>
            </div>

            {checkoutGrandTotal > 0 && roundOffAmount > 0 && (
              <div className="flex items-center justify-between bg-white/90 border border-rose-100 rounded-xl p-3 mt-1">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">Round up to ₹{nextTen}</span>
                  <p className="text-[10px] text-slate-400 font-medium">Contribute ₹{roundOffAmount} to this cause</p>
                </div>
                <button 
                  onClick={() => {
                    setDonationAmount(roundOffAmount);
                    setCustomDonation(String(roundOffAmount));
                    showToast(`₹${roundOffAmount} round-off donation added!`, "success");
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    donationAmount === roundOffAmount 
                      ? "bg-rose-500 text-white border border-rose-500" 
                      : "bg-white border border-slate-200 text-slate-700 hover:border-rose-400 hover:text-rose-500"
                  }`}
                >
                  {donationAmount === roundOffAmount ? "Added" : `+₹${roundOffAmount}`}
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] font-bold text-slate-600">Donation amount</span>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={customDonation}
                  onChange={(e) => setCustomDonation(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-16 h-8 text-center border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#f59931]"
                />
                <button
                  onClick={() => {
                    const amt = Number(customDonation) || 0;
                    setDonationAmount(amt);
                    if (amt > 0) showToast(`₹${amt} donation added!`, "success");
                  }}
                  className="bg-white border border-slate-200 text-slate-800 hover:border-[#f59931] hover:text-[#f59931] text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all"
                >
                  {donationAmount === Number(customDonation) && donationAmount > 0 ? "Added" : "Add"}
                </button>
              </div>
            </div>
          </div>

          {/* 3. Tip your delivery partner */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/50">
            <h4 className="text-slate-800 text-xs font-bold mb-1">Tip your delivery partner</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium mb-3">
              Your kindness means a lot! 100% of your tip will go directly to your delivery partner.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { val: 20, label: "😊 ₹20" },
                { val: 30, label: "🤩 ₹30" },
                { val: 50, label: "😍 ₹50" }
              ].map((tipOpt) => (
                <button
                  key={tipOpt.val}
                  onClick={() => {
                    setSelectedTip(selectedTip === tipOpt.val ? 0 : tipOpt.val);
                    setCustomTip("");
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    selectedTip === tipOpt.val
                      ? "border-[#f59931] bg-orange-50 text-[#f59931] shadow-sm"
                      : "border-slate-100 hover:border-slate-300 text-slate-700 bg-slate-50/50"
                  }`}
                >
                  {tipOpt.label}
                </button>
              ))}
              <button
                onClick={() => {
                  const val = prompt("Enter custom tip amount:");
                  if (val !== null) {
                    const numeric = Number(val.replace(/[^0-9]/g, ""));
                    if (numeric >= 0) {
                      setSelectedTip(numeric);
                      setCustomTip(String(numeric));
                    }
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  customTip
                    ? "border-[#f59931] bg-orange-50 text-[#f59931] shadow-sm"
                    : "border-slate-100 hover:border-slate-300 text-slate-700 bg-slate-50/50"
                }`}
              >
                🎁 {customTip ? `₹${customTip}` : "Custom"}
              </button>
            </div>
          </div>

          {/* 4. Gift Packaging */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/50 flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700 border border-slate-100 flex-shrink-0">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h4 className="text-slate-800 text-xs font-bold">Gift Packaging</h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isGiftPackaging ? "Applied (₹25)" : "Add gift packaging for ₹25"}
                </p>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={isGiftPackaging}
              onChange={(e) => setIsGiftPackaging(e.target.checked)}
              className="w-4 h-4 rounded text-[#f59931] focus:ring-[#f59931] border-slate-300 transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* 6. Cancellation policy */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/50">
          <h4 className="text-slate-800 text-xs font-bold mb-1 flex items-center gap-1.5">
            <Clipboard size={14} className="text-slate-400" />
            Cancellation Policy
          </h4>
          <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
            Orders cannot be cancelled once packed for delivery. In case of unexpected delays, please contact customer support immediately.
          </p>
        </div>

        {/* Footer branding */}
        <div className="flex justify-center items-center gap-1.5 pt-6 pb-2 select-none">
          <span className="text-[11px] font-medium text-slate-400">Made with</span>
          <span className="text-red-500 text-xs">❤️</span>
          <span className="text-[11px] font-medium text-slate-400">by</span>
          <span className="text-[11px] font-extrabold text-[#f59931] tracking-wide">Zeppe</span>
        </div>
      </div>

      {/* 7. Persistent Bottom Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 p-4">
        <div className="max-w-2xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Bottom Address Selector */}
          <div 
            onClick={() => setIsAddressModalOpen(true)}
            className="flex-1 flex items-center justify-between gap-3 group border border-slate-100 rounded-2xl p-2 bg-slate-50/50 min-w-0 cursor-pointer hover:bg-slate-50 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`h-10 w-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors ${
                displayAddress === "Select Location" 
                  ? "bg-amber-50 border-amber-100 text-amber-500 animate-pulse" 
                  : "bg-slate-100 border-slate-100 text-slate-800 group-hover:bg-[#f59931]/10"
              }`}>
                {displayAddress === "Select Location" ? <AlertCircle size={20} /> : <MapPin size={20} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold text-xs ${displayAddress === "Select Location" ? "text-amber-600" : "text-slate-800"}`}>
                    {displayAddress === "Select Location" ? "Select delivery address" : `Delivering to: ${displayName}`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5 leading-tight font-medium">
                  {displayAddress === "Select Location" ? "Choose from saved addresses or use GPS" : displayAddress}
                </p>
              </div>
            </div>
            <button
              className="text-emerald-600 text-xs font-black hover:underline px-2 py-1 flex-shrink-0">
              {displayAddress === "Select Location" ? (locationSavedAddresses.length > 0 ? "Select" : "Add") : "Change"}
            </button>
          </div>

          {/* Pay Using & Place Order Actions */}
          <div className="flex items-center justify-between gap-4 w-full bg-slate-50 border border-slate-100 rounded-3xl p-3">
            {/* Pay Using Selector trigger */}
            <div 
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                {selectedPayment === "cash" ? <Banknote size={20} /> : <CreditCard size={20} />}
              </div>
              <div>
                <div className="flex items-center gap-1 select-none">
                  <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase flex items-center gap-1">
                    Pay Using <ChevronUp size={12} className="stroke-[3] text-slate-600" />
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">
                  {selectedPayment === "cash" ? "Cash on Delivery" : "Pay Online"}
                </p>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder || isPreviewLoading}
              className="flex-1 max-w-[240px] h-12 bg-[#f59931] hover:bg-[#faaf5c] text-black font-extrabold rounded-2xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center text-sm px-6 gap-2"
            >
              Place Order <ChevronRight size={16} className="stroke-[3]" />
            </button>
          </div>
        </div>
      </div>

      {/* GSTIN Modal Overlay */}
      <Dialog open={isGstinModalOpen} onOpenChange={setIsGstinModalOpen}>
        <DialogContent className="fixed !bottom-0 !top-auto !left-0 !right-0 !translate-x-0 !translate-y-0 w-full sm:max-w-[425px] mx-auto rounded-t-[32px] rounded-b-none p-6 border-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom">
          <DialogHeader className="border-b border-slate-50 pb-4 flex flex-row items-center justify-between">
            <DialogTitle className="text-slate-800 font-extrabold text-lg">
              Add GST Details
            </DialogTitle>
          </DialogHeader>
          <GstModalContent 
            initialValue={gstin} 
            onSave={(val, isInvalid) => {
              if (isInvalid) {
                showToast("Please enter a valid 15-digit GSTIN format", "warning");
                return;
              }
              setGstin(val);
              setIsGstinModalOpen(false);
              if (val) showToast("GSTIN saved successfully!", "success");
            }}
            validate={validateGSTIN}
          />
        </DialogContent>
      </Dialog>

      {/* Address Selection Modal */}
      <Dialog 
        open={isAddressModalOpen} 
        onOpenChange={(open) => {
          setIsAddressModalOpen(open);
          if (open) refreshAddresses();
        }}
      >
        <DialogContent className="fixed !bottom-0 !top-auto !left-0 !right-0 !translate-x-0 !translate-y-0 w-full sm:max-w-[425px] mx-auto rounded-t-[32px] rounded-b-none p-6 border-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom">
          <DialogHeader className="border-b border-slate-50 pb-4 flex flex-row items-center justify-between">
            <DialogTitle className="text-slate-800 font-extrabold text-lg">
              Select Delivery Address
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Add New Address trigger bar */}
            <div 
              onClick={() => navigate("/addresses", { state: { from: 'checkout' } })}
              className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50/50 shadow-sm"
            >
              <span className="text-emerald-600 font-bold text-sm flex items-center gap-2">
                <Plus size={18} className="stroke-[3]" /> Add new address
              </span>
              <ChevronRight size={18} className="text-slate-400" />
            </div>

            {/* Saved Addresses List */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar pb-2">
              {/* 1. CURRENT DETECTED LOCATION */}
              <div
                onClick={() => {
                  if (currentLocation?.name && currentLocation.name !== "Select Location") {
                    setCurrentAddress({
                      id: null,
                      name: user?.name || "",
                      phone: user?.phone || "",
                      address: currentLocation?.name || "",
                      landmark: "",
                      city: [currentLocation?.city, currentLocation?.state].filter(Boolean).join(", "),
                      pincode: currentLocation?.pincode || "",
                      location: {
                        lat: currentLocation?.latitude,
                        lng: currentLocation?.longitude,
                      }
                    });
                    setIsAddressModalOpen(false);
                  } else {
                    refreshLocation();
                  }
                }}
                className={`w-full p-4 rounded-3xl border-2 cursor-pointer transition-all ${
                  !currentAddress?.id ? "border-black bg-white shadow-md" : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    !currentAddress?.id ? "bg-black text-white border-black" : "bg-slate-50 text-slate-800 border-slate-100"
                  }`}>
                    <Navigation size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Current Location
                      </span>
                      <div className="flex items-center gap-2">
                        {isFetchingLocation ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-full border border-slate-100">
                            <Loader2 size={10} className="animate-spin text-[#FF9F33]" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Detecting...</span>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              refreshLocation();
                            }}
                            className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 hover:bg-emerald-100 transition-colors"
                          >
                            <Navigation size={10} className="fill-current" />
                            <span className="text-[9px] font-black uppercase">Locate</span>
                          </button>
                        )}
                        {!currentAddress?.id && (
                          <span className="bg-[#FF9F33] text-black text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
                            Selected
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[14px] font-bold text-slate-900 leading-snug mb-1.5 break-words">
                      {isFetchingLocation ? "Detecting your location..." : (currentLocation?.name && currentLocation.name !== "Select Location" ? currentLocation.name : "Click on Locate to detect current address")}
                    </p>
                    <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${isFetchingLocation ? 'bg-slate-300' : 'bg-emerald-500 animate-pulse'}`} />
                      {isFetchingLocation ? 'Updating your position...' : 'Live GPS detection'}
                    </p>
                  </div>
                </div>
              </div>

              {locationSavedAddresses.length > 0 && (
                <div className="pt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-3 px-1">
                    Saved Addresses
                  </p>
                  <div className="space-y-3">
                    {locationSavedAddresses.map((addr) => {
                      const isSelected = currentAddress?.id === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`w-full p-4 rounded-3xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-black bg-white shadow-md"
                              : "border-slate-100 bg-white hover:border-slate-200"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                              isSelected ? "bg-black text-white border-black" : "bg-slate-50 text-slate-800 border-slate-100"
                            }`}>
                              {addr.label?.toLowerCase() === "home" ? <Home size={18} /> : 
                               addr.label?.toLowerCase() === "work" ? <Briefcase size={18} /> : <MapPin size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  {addr.label || "Address"}
                                </span>
                                {isSelected && (
                                  <span className="bg-[#FF9F33] text-black text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
                                    Selected
                                  </span>
                                )}
                              </div>
                              {addr.name && (
                                <p className="text-[13px] font-bold text-slate-800 mb-0.5">
                                  {addr.name}
                                </p>
                              )}
                              <p className="text-[14px] font-bold text-slate-900 leading-snug mb-1 break-words">
                                {addr.address}
                              </p>
                              {addr.phone && (
                                <p className="text-[11px] text-slate-500 font-bold">
                                  Phone: {addr.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Selection Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="fixed !bottom-0 !top-auto !left-0 !right-0 !translate-x-0 !translate-y-0 w-full sm:max-w-[425px] mx-auto rounded-t-[32px] rounded-b-none p-6 border-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom">
          <DialogHeader className="border-b border-slate-50 pb-4">
            <DialogTitle className="text-slate-800 font-extrabold text-lg">
              Select Payment Mode
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-3">
            {[
              { id: "cash", label: "Cash on Delivery", icon: Banknote },
              { id: "online", label: "Pay Online", icon: CreditCard },
            ].map((method) => {
              const Icon = method.icon;
              const isSelected = selectedPayment === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => {
                    setSelectedPayment(method.id);
                    setIsPaymentModalOpen(false);
                  }}
                  className={`w-full p-4 rounded-3xl border-2 flex items-center justify-between transition-all ${
                    isSelected
                      ? "border-black bg-white"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isSelected ? "bg-black text-white" : "bg-slate-100 text-slate-500"}`}>
                      <Icon size={20} />
                    </div>
                    <span className={`text-sm font-bold ${isSelected ? "text-slate-800" : "text-slate-600"}`}>
                      {method.label}
                    </span>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-black" : "border-slate-300"}`}>
                    {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-black" />}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Current Address Modal - slides up from bottom */}
      <Dialog open={isEditAddressOpen} onOpenChange={setIsEditAddressOpen}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden p-0">
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="p-6">
            <DialogHeader>
              <DialogTitle>Edit Delivery Address</DialogTitle>
              <DialogDescription>
                Update the details of your current delivery address.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="edit-address"
                  className="text-xs font-semibold text-slate-700">
                  Address
                </Label>
                <Input
                  id="edit-address"
                  value={editAddressForm.address}
                  onChange={(e) =>
                    setEditAddressForm((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  className="h-10"
                  placeholder="House, street, area"
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="edit-landmark"
                  className="text-xs font-semibold text-slate-700">
                  Nearest Landmark (optional)
                </Label>
                <Input
                  id="edit-landmark"
                  value={editAddressForm.landmark || ""}
                  onChange={(e) =>
                    setEditAddressForm((prev) => ({
                      ...prev,
                      landmark: e.target.value,
                    }))
                  }
                  className="h-10"
                  placeholder="e.g. Near City Mall, Opp. Temple"
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="edit-city"
                  className="text-xs font-semibold text-slate-700">
                  City / Pincode
                </Label>
                <Input
                  id="edit-city"
                  value={editAddressForm.city}
                  onChange={(e) =>
                    setEditAddressForm((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  className="h-10"
                  placeholder="City - Pincode"
                />
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button
                variant="outline"
                onClick={() => setIsEditAddressOpen(false)}
                className="border-slate-200 text-slate-600 hover:bg-slate-50">
                Cancel
              </Button>
              <Button
                onClick={handleSaveEditedAddress}
                className="bg-[#f59931] hover:bg-[#e08820] text-black font-bold">
                Save changes
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Coupon Selection Modal */}
      <Dialog open={isCouponModalOpen} onOpenChange={setIsCouponModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Apply Coupon</DialogTitle>
            <DialogDescription>
              Browse available offers and save more.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {coupons.map((coupon) => (
              <div
                key={coupon.code}
                className={`p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
                  selectedCoupon?.code === coupon.code
                    ? "border-[#f59931] bg-brand-50 shadow-sm"
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}>
                {selectedCoupon?.code === coupon.code && (
                  <div className="absolute top-0 right-0 p-1.5 bg-[#f59931] text-black rounded-bl-xl">
                    <Check size={12} strokeWidth={4} />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div
                    className={`p-3 rounded-2xl ${selectedCoupon?.code === coupon.code ? "bg-[#f59931]/10 text-[#f59931]" : "bg-orange-50 text-orange-500"}`}>
                    <Tag size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-slate-800 tracking-wider mb-1">
                      {coupon.code}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      {coupon.description}
                    </p>
                    <button
                      onClick={() => handleApplyCoupon(coupon)}
                      disabled={selectedCoupon?.code === coupon.code}
                      className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${
                        selectedCoupon?.code === coupon.code
                          ? "bg-white text-[#f59931] border-2 border-[#f59931] cursor-default"
                          : "bg-[#f59931] text-black hover:bg-[#e08820]"
                      }`}>
                      {selectedCoupon?.code === coupon.code
                        ? "Applied"
                        : "Apply Now"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <Input
                placeholder="Enter coupon code manually"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="pl-10 h-12 rounded-xl focus-visible:ring-[#f59931]"
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f59931] font-bold text-xs"
                onClick={async () => {
                  if (!manualCode.trim()) {
                    showToast("Please enter a coupon code", "error");
                    return;
                  }
                  try {
                    const res = await customerApi.validateCoupon({
                      code: manualCode.trim(),
                      cartTotal,
                      items: cart,
                      customerId: user?._id,
                    });
                    if (res.data.success) {
                      const data = res.data.result;
                      setSelectedCoupon({
                        code: manualCode.trim(),
                        description: "Applied manually",
                        ...data,
                      });
                      showToast(
                        `Coupon ${manualCode.trim()} applied!`,
                        "success",
                      );
                    } else {
                      showToast(res.data.message || "Invalid coupon", "error");
                    }
                  } catch (error) {
                    showToast(
                      error.response?.data?.message || "Invalid coupon",
                      "error",
                    );
                  }
                }}>
                CHECK
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phone Number Requirement Modal */}
      <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
        <DialogContent className="fixed !bottom-0 !top-auto !left-0 !right-0 !translate-x-0 !translate-y-0 w-full sm:max-w-[400px] mx-auto rounded-t-[24px] rounded-b-none p-5 border-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom">
          <DialogHeader className="border-b border-slate-50 pb-3">
            <DialogTitle className="text-slate-800 font-extrabold text-base flex items-center gap-2">
              <PhoneOff className="text-[#f59931]" size={20} />
              Missing Phone Number
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium pt-0.5 text-xs">
              We need your phone number to coordinate delivery and send order updates.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="checkout-phone" className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-0.5">
                Your 10-digit Phone Number
              </Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400 font-bold border-r border-slate-100 pr-3 mr-3">
                  <span className="text-sm">+91</span>
                </div>
                <Input
                  id="checkout-phone"
                  placeholder="00000 00000"
                  className="h-12 pl-16 rounded-xl border-slate-100 bg-slate-50 focus-visible:ring-[#f59931] font-bold text-base"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  autoFocus
                />
              </div>
            </div>
            
            <Button 
              className="w-full h-12 rounded-xl bg-[#f59931] hover:bg-[#e08820] text-black font-black text-base transition-all active:scale-[0.98]"
              onClick={handleUpdatePhone}
              disabled={newPhone.length !== 10 || isUpdatingPhone}
            >
              {isUpdatingPhone ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating...</span>
                </div>
              ) : (
                "Save and Continue"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center text-[#f59931] mb-6">
              <Check size={48} strokeWidth={4} />
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-black text-slate-800 mb-2">
              Order placed
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-500 font-medium mb-8">
              #{orderId?.slice(-6)} — waiting for the seller to accept (60s). If
              they don&apos;t, the order will cancel automatically.
              <br />
              Redirecting to order details…
            </motion.p>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, ease: "linear" }}
              className="w-48 h-1.5 bg-brand-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#45B0E2]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style
        dangerouslySetInnerHTML={{
          __html: `
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `,
        }}
      />
    </div>
  );
};

const GstModalContent = ({ initialValue, onSave, validate }) => {
  const [val, setVal] = useState(initialValue);

  return (
    <div className="py-4 space-y-4">
      <p className="text-[11px] text-slate-500 font-medium">
        Claim up to 18% GST input credit on eligible products in this order.
      </p>
      <div className="space-y-2">
        <Label htmlFor="gstin_input" className="text-xs font-bold text-slate-700">Enter GSTIN</Label>
        <Input 
          id="gstin_input"
          placeholder="22AAAAA0000A1Z5"
          value={val}
          onChange={(e) => setVal(e.target.value.toUpperCase().slice(0, 15))}
          className="h-12 rounded-xl border-slate-200 focus:ring-[#f59931] focus:border-[#f59931] font-bold text-sm"
          autoFocus
        />
      </div>
      <Button
        onClick={() => {
          if (val.length > 0 && !validate(val)) {
            const toast = document.createElement('div'); // Simple way if showToast is not in scope, but we pass onSave
            onSave(val, true); // We'll handle validation inside onSave or here
          } else {
            onSave(val);
          }
        }}
        className="w-full h-12 bg-[#f59931] hover:bg-[#faaf5c] text-black font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center text-sm mt-4"
      >
        Confirm GSTIN
      </Button>
    </div>
  );
};

export default CheckoutPage;

