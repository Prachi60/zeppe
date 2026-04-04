import React from "react";
import { FaAppleWhole, FaShirt, FaLaptop, FaPumpSoap } from "react-icons/fa6";
import { GiLargeDress, GiLipstick, GiSofa, GiBabyBottle } from "react-icons/gi";
import { MdOutlinePets, MdOutlineSportsBasketball } from "react-icons/md";

const VISUAL_COMPONENTS = {
  grocery: FaAppleWhole,
  fashion: FaShirt,
  electronics: FaLaptop,
  beauty: FaPumpSoap,
  wedding: GiLargeDress,
  home: GiSofa,
  kids: GiBabyBottle,
  pets: MdOutlinePets,
  sports: MdOutlineSportsBasketball,
  cosmetics: GiLipstick,
};

export const headerCategoryVisuals = [
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
];

export function getHeaderCategoryVisualMeta(id) {
  return headerCategoryVisuals.find((item) => item.id === id) || null;
}

export function HeaderCategoryVisual({
  visualKey,
  className = "",
  size = 28,
  color,
}) {
  const Component = VISUAL_COMPONENTS[visualKey];
  if (!Component) return null;

  const meta = getHeaderCategoryVisualMeta(visualKey);
  return (
    <Component
      className={className}
      size={size}
      color={color || meta?.color || "#111827"}
    />
  );
}
