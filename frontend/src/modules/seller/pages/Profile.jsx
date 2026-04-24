import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Store,
  Shield,
  Edit2,
  Save,
  X,
  Rocket,
  Globe,
  MapPin,
  CheckCircle,
  Upload,
  Loader2,
  ImagePlus,
} from "lucide-react";
import { sellerApi } from "../services/sellerApi";
import { toast } from "sonner";
import Card from "@shared/components/ui/Card";
import Button from "@shared/components/ui/Button";
import MapPicker from "../../../shared/components/MapPicker";

const STORE_IMAGE_TAGS = ["seller", "store"];

function getFileExtension(file) {
  const fromName = String(file?.name || "")
    .split(".")
    .pop()
    ?.trim()
    .toLowerCase();
  if (fromName) return fromName;

  const mimeType = String(file?.type || "").toLowerCase();
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  return "";
}

const SellerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    shopName: "",
    phone: "",
    email: "",
    lat: null,
    lng: null,
    radius: 5,
    address: "",
    shopLogo: "",
    shopBanner: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await sellerApi.getProfile();
      const data = response.data.result;
      setProfile(data);
      setFormData({
        name: data.name,
        shopName: data.shopName,
        phone: data.phone,
        email: data.email,
        lat: data.location?.coordinates[1] || null,
        lng: data.location?.coordinates[0] || null,
        radius: data.serviceRadius || 5,
        address: data.address || "",
        shopLogo: data.shopLogo || "",
        shopBanner: data.shopBanner || "",
      });
    } catch (error) {
      toast.error("Failed to fetch profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setFormData((prev) => ({
      ...prev,
      lat: location.lat,
      lng: location.lng,
      radius: location.radius,
      address: location.address,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      // Disallow numbers in seller name
      const cleaned = value.replace(/[0-9]/g, "");
      setFormData({ ...formData, [name]: cleaned });
    } else if (name === "phone") {
      // Allow only digits, max 10 characters
      const digitsOnly = value.replace(/[^0-9]/g, "").slice(0, 10);
      setFormData({ ...formData, [name]: digitsOnly });
    } else if (name === "email") {
      // Trim spaces, keep as-is otherwise; HTML5 type=email will help validate shape
      setFormData({ ...formData, [name]: value.trimStart() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const uploadStoreImage = async (file, type) => {
    const extension = getFileExtension(file);
    const mimeType = String(file?.type || "").toLowerCase();

    const intentResponse = await sellerApi.createMediaUploadIntent({
      entityType: "profile",
      resourceType: "image",
      mimeType,
      fileSize: file.size,
      extension,
      tags: [...STORE_IMAGE_TAGS, type],
    });

    const intent = intentResponse?.data?.result ?? intentResponse?.data;
    const uploadUrl = intent?.uploadUrl;
    const uploadFields = intent?.uploadFields;
    const intentId = intent?.intentId;

    if (!uploadUrl || !uploadFields || !intentId) {
      throw new Error("Failed to prepare image upload");
    }

    const cloudinaryFormData = new FormData();
    Object.entries(uploadFields).forEach(([key, value]) => {
      cloudinaryFormData.append(key, value);
    });
    cloudinaryFormData.append("file", file);

    const cloudinaryResponse = await fetch(uploadUrl, {
      method: "POST",
      body: cloudinaryFormData,
    });

    const cloudinaryPayload = await cloudinaryResponse.json().catch(() => ({}));
    if (!cloudinaryResponse.ok) {
      throw new Error(
        cloudinaryPayload?.error?.message || "Cloudinary upload failed",
      );
    }

    const confirmResponse = await sellerApi.confirmMediaUpload({
      intentId,
      publicId: cloudinaryPayload.public_id,
      secureUrl: cloudinaryPayload.secure_url,
      resourceType: cloudinaryPayload.resource_type || "image",
      format: cloudinaryPayload.format || extension,
      mimeType,
      width: cloudinaryPayload.width,
      height: cloudinaryPayload.height,
      bytes: cloudinaryPayload.bytes || file.size,
      etag: cloudinaryPayload.etag,
      entityType: "profile",
      tags: [...STORE_IMAGE_TAGS, type],
    });

    const confirmedMedia = confirmResponse?.data?.result ?? confirmResponse?.data;
    return confirmedMedia?.secureUrl || cloudinaryPayload.secure_url || "";
  };

  const handleStoreImageUpload = async (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = getFileExtension(file);
    const mimeType = String(file.type || "").toLowerCase();
    if (!mimeType.startsWith("image/") || !extension) {
      toast.error("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    const setUploading =
      type === "shopLogo" ? setLogoUploading : setBannerUploading;

    setUploading(true);
    try {
      const url = await uploadStoreImage(file, type === "shopLogo" ? "logo" : "banner");
      if (!url) throw new Error("No image URL returned");

      setFormData((prev) => ({ ...prev, [type]: url }));
      setProfile((prev) => (prev ? { ...prev, [type]: url } : prev));
      toast.success(
        `${type === "shopLogo" ? "Store logo" : "Store banner"} uploaded. Save changes to publish it.`,
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Image upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic phone validation: must be exactly 10 digits
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    // Basic email validation
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        lat: formData.lat,
        lng: formData.lng,
        radius: formData.radius,
        shopLogo: formData.shopLogo,
        shopBanner: formData.shopBanner,
      };
      await sellerApi.updateProfile(payload);
      toast.success("Profile updated successfully");
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async () => {
    try {
      const newStatus = !profile.isActive;
      await sellerApi.updateProfile({ isActive: newStatus });
      setProfile((prev) => ({ ...prev, isActive: newStatus }));
      toast.success(`Shop is now ${newStatus ? "Active" : "Inactive"}`);
    } catch (error) {
      toast.error("Failed to update shop status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 font-['Outfit']">
      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => handleStoreImageUpload(event, "shopLogo")}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => handleStoreImageUpload(event, "shopBanner")}
      />
      {/* Header Section */}
      <div className="relative mb-24 px-4">
        {/* Banner Background */}
        <div className="bg-linear-to-r from-slate-900 via-slate-950 to-black h-64 rounded-lg shadow-2xl relative overflow-hidden">
          {formData.shopBanner ? (
            <img
              src={formData.shopBanner}
              alt={profile?.shopName || "Store banner"}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-slate-950/45" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 shadow-lg transition hover:bg-white"
            >
              {bannerUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {bannerUploading ? "Uploading" : "Change Banner"}
            </button>
          )}
        </div>

        {/* Profile Info Row */}
        <div className="absolute bottom-8 left-4 right-4 md:left-8 md:right-8 lg:left-12 lg:right-12 grid grid-cols-1 md:grid-cols-[176px_minmax(0,1fr)_auto] items-center md:items-end gap-6 md:gap-8">
          {/* Avatar Container */}
          <div className="h-44 w-44 rounded-full bg-white p-2 shadow-[0_30px_70px_rgba(0,0,0,0.15)] flex-shrink-0 mx-auto md:mx-0">
            <div className="relative h-full w-full rounded-full bg-slate-50 flex items-center justify-center border-4 border-slate-50 overflow-hidden">
              {formData.shopLogo ? (
                <img
                  src={formData.shopLogo}
                  alt={profile?.shopName || "Store logo"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-7xl font-black text-slate-900">
                  {profile?.name?.charAt(0)}
                </span>
              )}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg transition hover:scale-105"
                >
                  {logoUploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                </button>
              )}
            </div>
          </div>

          {/* Info Block */}
          <div className="min-w-0 pb-2 md:pb-4 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
              <span className="px-4 py-1.5 bg-white/10 backdrop-blur-xl text-white text-[10px] font-black uppercase tracking-[2px] rounded-full border border-white/20">
                {profile?.role}
              </span>
              <button
                onClick={toggleStatus}
                className={`group flex items-center gap-2 px-4 py-1.5 text-[10px] font-black uppercase tracking-[2px] rounded-full border transition-all hover:scale-105 active:scale-95 ${
                  profile?.isActive
                    ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                    : "bg-rose-500 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                }`}>
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    profile?.isActive ? "bg-emerald-200" : "bg-rose-200"
                  }`}
                />
                {profile?.isActive ? "Active" : "Inactive"}
              </button>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter drop-shadow-sm mb-1 break-words">
              {profile?.name}
            </h1>
            <p className="text-white/60 font-black tracking-[1px] text-lg">
              {profile?.shopName}
            </p>
          </div>

          {/* Action Button */}
          <div className="pb-2 md:pb-4 w-full md:w-auto">
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full md:w-auto bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white hover:text-slate-950 transition-all rounded-lg px-6 lg:px-12 py-4 md:py-5 flex items-center justify-center gap-3 md:gap-4 font-black tracking-[2px] md:tracking-[3px] text-xs shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:scale-[1.03] active:scale-[0.95] whitespace-nowrap">
                <Edit2 size={18} /> EDIT PROFILE
              </Button>
            ) : (
              <div className="w-full md:w-auto flex gap-3 md:gap-4 justify-center md:justify-end">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="h-[64px] w-[64px] flex items-center justify-center bg-white/5 text-white border border-white/20 hover:bg-white hover:text-slate-900 rounded-lg shadow-lg transition-all backdrop-blur-md">
                  <X size={24} className="stroke-[2.5]" />
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="min-w-0 max-w-full bg-white text-slate-950 hover:bg-slate-100 rounded-lg px-5 md:px-8 lg:px-12 py-4 md:py-5 font-black tracking-[2px] md:tracking-[3px] text-xs flex items-center gap-3 md:gap-4 shadow-[0_25px_50px_rgba(0,0,0,0.15)] h-[64px] whitespace-nowrap">
                  {isSaving ? (
                    "UPDATING..."
                  ) : (
                    <>
                      <Save size={20} /> SAVE CHANGES
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Info Card */}
        <div className="md:col-span-2 space-y-8">
          <Card className="p-8 border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-lg">
            <h3 className="text-xl font-black text-slate-900 mb-8 border-b border-slate-50 pb-4">
              Business Profile
            </h3>

            <form className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-600 ml-1">
                    Seller Identity
                  </label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-lg text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-100 transition-all disabled:opacity-70"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-600 ml-1">
                    Store Name
                  </label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors">
                      <Store size={18} />
                    </div>
                    <input
                      type="text"
                      name="shopName"
                      value={formData.shopName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-lg text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-100 transition-all disabled:opacity-70"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-600 ml-1">
                    Contact Number
                  </label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-lg text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-100 transition-all disabled:opacity-70"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-600 ml-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-lg text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-100 transition-all disabled:opacity-70"
                    />
                  </div>
                </div>
              </div>
            </form>
          </Card>

          <Card className="p-8 border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-lg">
            <div className="flex items-center justify-between gap-4 mb-8 border-b border-slate-50 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Store Visual Identity</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  These images are shown to customers in the Stores tab and on your store page.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Store Logo
                </p>
                <div className="h-48 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
                  {formData.shopLogo ? (
                    <img
                      src={formData.shopLogo}
                      alt="Store logo preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <Store size={40} />
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={!isEditing || logoUploading}
                    className="flex-1 bg-slate-900 text-white hover:bg-black rounded-lg py-3 text-[10px] font-black tracking-[2px] disabled:opacity-60"
                  >
                    {logoUploading ? "UPLOADING..." : "UPLOAD LOGO"}
                  </Button>
                  {isEditing && formData.shopLogo ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData((prev) => ({ ...prev, shopLogo: "" }))}
                      className="px-4 rounded-lg text-[10px] font-black tracking-[2px]"
                    >
                      REMOVE
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Store Banner
                </p>
                <div className="h-48 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
                  {formData.shopBanner ? (
                    <img
                      src={formData.shopBanner}
                      alt="Store banner preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                      <ImagePlus size={36} />
                      <p className="text-sm font-semibold">No banner uploaded yet</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={!isEditing || bannerUploading}
                    className="flex-1 bg-slate-900 text-white hover:bg-black rounded-lg py-3 text-[10px] font-black tracking-[2px] disabled:opacity-60"
                  >
                    {bannerUploading ? "UPLOADING..." : "UPLOAD BANNER"}
                  </Button>
                  {isEditing && formData.shopBanner ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData((prev) => ({ ...prev, shopBanner: "" }))}
                      className="px-4 rounded-lg text-[10px] font-black tracking-[2px]"
                    >
                      REMOVE
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>

          {/* Location & Radius Settings Card */}
          <Card className="p-8 border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-lg">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
              <h3 className="text-xl font-black text-slate-900">
                Location & Service Settings
              </h3>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-slate-900 text-white hover:bg-black rounded-lg px-6 py-2 text-[10px] font-black tracking-[2px]">
                  MANAGE
                </Button>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100/50 space-y-6">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${
                        formData.lat
                          ? "bg-brand-100 text-brand-600 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.3)]"
                          : "bg-white text-slate-400 shadow-sm"
                      }`}>
                      <MapPin size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-900">
                        {formData.lat
                          ? "Store Location Pin"
                          : "Location Not Defined"}
                      </p>
                      <p className="text-xs text-slate-500 font-medium max-w-[400px] leading-relaxed">
                        {formData.address ||
                          "Click change to precisely mark your shop location on the map for delivery accuracy."}
                      </p>
                    </div>
                  </div>
                  {isEditing && (
                    <Button
                      type="button"
                      onClick={() => setIsMapOpen(true)}
                      className="bg-white text-slate-900 border-2 border-slate-200 hover:border-slate-900 rounded-lg px-8 py-3 text-[10px] font-black tracking-[2px] shadow-sm hover:shadow-md transition-all whitespace-nowrap">
                      CHANGE PIN
                    </Button>
                  )}
                </div>

                {formData.lat && (
                  <div className="pt-6 border-t border-slate-200/60 flex flex-wrap gap-8">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Service Radius
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-900">
                          {formData.radius}
                        </span>
                        <span className="text-xs font-bold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-md">
                          KM
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Latitude
                      </span>
                      <span className="text-sm font-bold text-slate-700 tabular-nums">
                        {formData.lat.toFixed(6)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Longitude
                      </span>
                      <span className="text-sm font-bold text-slate-700 tabular-nums">
                        {formData.lng.toFixed(6)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <Shield size={16} className="text-amber-600 mt-0.5" />
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  Your shop location and service radius determine which
                  customers can view your products. Ensure the marker is placed
                  exactly at your physical storefront for accurate delivery
                  assignments.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Card */}
        <div className="space-y-8">
          <Card className="p-8 border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[40px] bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800 text-white">
            <h4 className="text-[10px] font-black uppercase tracking-[4px] text-white/40 mb-6">
              Security & Trust
            </h4>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Shield size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/60">
                    Verification
                  </p>
                  <p className="text-sm font-bold">
                    {profile?.isVerified
                      ? "Verified Merchant"
                      : "Verification Pending"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Rocket size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/60">
                    Partner Tier
                  </p>
                  <p className="text-sm font-bold">Standard Growth</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Globe size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/60">
                    Region
                  </p>
                  <p className="text-sm font-bold">Pan India Reach</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[40px] bg-emerald-50 border border-emerald-100">
            <h4 className="text-[10px] font-black uppercase tracking-[4px] text-emerald-600/60 mb-6">
              Partnership Subscription
            </h4>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <CheckCircle size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-800/60">
                    Plan Status
                  </p>
                  <p className="text-base font-black text-emerald-900 uppercase">
                    {profile?.subscriptionStatus === 'active' || localStorage.getItem('demo_subscription_active') ? "Active Partner" : "Inactive"}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-emerald-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60 mb-1">
                    Activated On
                  </p>
                  <p className="text-sm font-bold text-emerald-900">
                    23 April 2026
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800/60 mb-1">
                    Valid Until
                  </p>
                  <p className="text-sm font-bold text-emerald-900">
                    23 April 2027
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-white/60 rounded-2xl border border-emerald-200/50">
                <p className="text-[10px] font-bold text-emerald-800 leading-relaxed italic">
                  Note: Your partnership is valid for 1 year. Renewal notifications will be sent 30 days before expiry.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {isMapOpen && (
        <MapPicker
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          onConfirm={handleLocationSelect}
          initialLocation={
            formData.lat ? { lat: formData.lat, lng: formData.lng } : null
          }
          initialRadius={formData.radius}
        />
      )}
    </div>
  );
};

export default SellerProfile;
