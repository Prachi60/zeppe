import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Calendar, Droplet, Camera, Loader2 } from "lucide-react";
import Button from "@/shared/components/ui/Button";
import Input from "@/shared/components/ui/Input";
import { toast } from "sonner";
import { useAuth } from "@core/context/AuthContext";
import { deliveryApi } from "../../services/deliveryApi";
import { useEffect } from "react";

const getFileExtension = (file) => {
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
};

const PersonalDetails = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const maxDob = (() => {
    const today = new Date();
    const minAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return minAgeDate.toISOString().split("T")[0];
  })();
  const [isEditing, setIsEditing] = useState(() => {
    return localStorage.getItem("zeppe_rider_profile_is_editing") === "true";
  });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarClick = () => {
    if (isEditing && !avatarUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = getFileExtension(file);
    const mimeType = String(file.type || "").toLowerCase();
    if (!mimeType.startsWith("image/") || !extension) {
      toast.error("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    try {
      setAvatarUploading(true);
      const toastId = toast.loading("Uploading profile image...");

      const intentResponse = await deliveryApi.createMediaUploadIntent({
        entityType: "profile",
        resourceType: "image",
        mimeType,
        fileSize: file.size,
        extension,
        tags: ["delivery", "profile"],
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

      const confirmResponse = await deliveryApi.confirmMediaUpload({
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
        tags: ["delivery", "profile"],
      });

      const confirmedMedia = confirmResponse?.data?.result ?? confirmResponse?.data;
      const finalUrl = confirmedMedia?.secureUrl || cloudinaryPayload.secure_url || "";

      if (!finalUrl) {
        throw new Error("No image URL returned");
      }

      // Update rider profile on backend with the new avatar url
      await deliveryApi.updateProfile({ avatar: finalUrl });
      await refreshUser();
      
      toast.dismiss(toastId);
      toast.success("Profile photo updated successfully!");
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast.error(error.message || "Failed to upload profile image");
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  };

  const [formData, setFormData] = useState(() => {
    try {
      const savedData = localStorage.getItem("zeppe_rider_profile_form_data");
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (e) {
      console.error("Error reading saved profile form data from localStorage:", e);
    }
    return {
      fullName: "",
      phone: "",
      email: "",
      address: "",
      dob: "",
      bloodGroup: "",
    };
  });

  // Persist state to localStorage whenever isEditing or formData changes
  useEffect(() => {
    localStorage.setItem("zeppe_rider_profile_is_editing", String(isEditing));
  }, [isEditing]);

  useEffect(() => {
    localStorage.setItem("zeppe_rider_profile_form_data", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (user) {
      const isCurrentlyEditing = localStorage.getItem("zeppe_rider_profile_is_editing") === "true";
      const hasSavedData = localStorage.getItem("zeppe_rider_profile_form_data") !== null;
      
      if (!isCurrentlyEditing || !hasSavedData) {
        setFormData({
          fullName: user.name || "",
          phone: user.phone || "",
          email: user.email || "",
          address: user.address || "",
          dob: user.dob || "",
          bloodGroup: user.bloodGroup || "",
        });
      }
    }
  }, [user]);

  const handleSave = async () => {
    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      if (dobDate > eighteenYearsAgo) {
        toast.error("You must be at least 18 years old to be a delivery partner.");
        return;
      }
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast.error("Please enter a valid email address.");
        return;
      }
    }

    try {
      setIsSaving(true);
      await deliveryApi.updateProfile({
        name: formData.fullName,
        email: formData.email ? formData.email.trim() : "",
        address: formData.address,
        bloodGroup: formData.bloodGroup,
        dob: formData.dob,
      });
      await refreshUser();
      
      // Clear persistence upon successful save
      localStorage.removeItem("zeppe_rider_profile_is_editing");
      localStorage.removeItem("zeppe_rider_profile_form_data");
      
      setIsEditing(false);
      toast.success("Personal details updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-full hover:bg-gray-100 transition-colors mr-2"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="ds-h3 text-gray-900">Personal Details</h1>
          <div className="ml-auto">
            {isEditing ? (
              <Button size="sm" onClick={handleSave} loading={isSaving} className="h-8 px-3">
                Save
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditing(true)} 
                className="text-primary hover:bg-primary/5"
              >
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Profile Photo */}
        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative">
            <div 
              onClick={handleAvatarClick}
              className={`w-24 h-24 rounded-full p-1 bg-white shadow-md relative overflow-hidden ${
                isEditing && !avatarUploading ? "cursor-pointer hover:opacity-90" : ""
              }`}
            >
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Felix'}`}
                alt="Profile"
                className="w-full h-full rounded-full object-cover bg-gray-100"
              />
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full backdrop-blur-[1px]">
                  <Loader2 className="animate-spin text-white" size={24} />
                </div>
              )}
            </div>
            {isEditing && (
              <button 
                type="button"
                disabled={avatarUploading}
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
              >
                {avatarUploading ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarChange} 
            />
          </div>
          <p className="mt-3 text-sm text-gray-500">Delivery Partner ID: {user?._id?.slice(-6).toUpperCase() || "------"}</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm">
          <Input
            label="Full Name"
            value={formData.fullName}
            readOnly={!isEditing}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            icon={User}
            className={!isEditing ? "bg-gray-50 border-transparent" : ""}
          />
          
          <Input
            label="Phone Number"
            value={formData.phone}
            readOnly={true} // Phone is usually locked
            icon={Phone}
            className="bg-gray-50 border-transparent text-gray-500"
            helperText="Contact support to change phone number"
          />

          <Input
            label="Email Address"
            value={formData.email}
            readOnly={!isEditing}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            icon={Mail}
            type="email"
            className={!isEditing ? "bg-gray-50 border-transparent" : ""}
          />

          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1 ml-1">Current Address</label>
            <div className="relative">
              <textarea
                value={formData.address}
                readOnly={!isEditing}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className={`w-full px-4 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none ${
                  !isEditing ? "bg-gray-50 border-transparent text-gray-600" : "bg-white border-gray-200"
                }`}
                rows={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              value={formData.dob}
              readOnly={!isEditing}
              onChange={(e) => setFormData({...formData, dob: e.target.value})}
              icon={Calendar}
              type="date"
              max={maxDob}
              helperText="You must be at least 18 years old"
              className={!isEditing ? "bg-gray-50 border-transparent" : ""}
            />
            <Input
              label="Blood Group"
              value={formData.bloodGroup}
              readOnly={!isEditing}
              onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
              icon={Droplet}
              className={!isEditing ? "bg-gray-50 border-transparent" : ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetails;
