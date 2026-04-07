import React from "react";
import AllIcon from "@/assets/category-icons/all.png";
import GroceryIcon from "@/assets/category-icons/grocery.png";
import FashionIcon from "@/assets/category-icons/fashion.png";
import ElectronicsIcon from "@/assets/category-icons/electronics.png";
import BeautyIcon from "@/assets/category-icons/beauty.png";
import WeddingIcon from "@/assets/category-icons/wedding.png";
import HomeIcon from "@/assets/category-icons/home.png";
import KidsIcon from "@/assets/category-icons/kids.png";
import PetsIcon from "@/assets/category-icons/pets.png";
import SportsIcon from "@/assets/category-icons/sports.png";
import CosmeticsIcon from "@/assets/category-icons/cosmetics.png";
import GardenIcon from "@/assets/category-icons/garden.png";
import MusicIcon from "@/assets/category-icons/music.png";

export const VISUAL_IMAGES = {
  all: AllIcon,
  grocery: GroceryIcon,
  fashion: FashionIcon,
  electronics: ElectronicsIcon,
  beauty: BeautyIcon,
  wedding: WeddingIcon,
  home: HomeIcon,
  kids: KidsIcon,
  pets: PetsIcon,
  sports: SportsIcon,
  cosmetics: CosmeticsIcon,
  garden: GardenIcon,
  music: MusicIcon,
};

export const headerCategoryVisuals = [
  { id: "all", label: "All", color: "#111827" },
  { id: "grocery", label: "Grocery", color: "#f59e0b" },
  { id: "fashion", label: "Fashion", color: "#ec4899" },
  { id: "electronics", label: "Electronics", color: "#0ea5e9" },
  { id: "beauty", label: "Beauty", color: "#8b5cf6" },
  { id: "wedding", label: "Wedding", color: "#ef4444" },
  { id: "home", label: "Home", color: "#14b8a6" },
  { id: "kids", label: "Kids", color: "#22c55e" },
  { id: "pets", label: "Pets", color: "#f97316" },
  { id: "sports", label: "Sports", color: "#3b82f6" },
  { id: "cosmetics", label: "Cosmetics", color: "#d946ef" },
  { id: "garden", label: "Garden", color: "#10b981" },
  { id: "music", label: "Music", color: "#6366f1" },
];

/**
 * Enhanced lookup that matches by ID or Name
 */
export function getHeaderCategoryVisualMeta(identifier) {
  if (!identifier) return null;
  const idLower = identifier.toLowerCase();
  
  // Try direct ID match
  let meta = headerCategoryVisuals.find((item) => item.id === idLower);
  
  // Try fuzzy name match if no ID match
  if (!meta) {
    meta = headerCategoryVisuals.find((item) => 
      idLower.includes(item.id) || item.id.includes(idLower)
    );
  }
  
  return meta;
}

export function HeaderCategoryVisual({
  visualKey,
  className = "",
  size = 40,
}) {
  const imageUrl = VISUAL_IMAGES[visualKey] || VISUAL_IMAGES[getHeaderCategoryVisualMeta(visualKey)?.id];
  if (!imageUrl) return null;

  return (
    <img
      src={imageUrl}
      alt={visualKey}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
