import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const StoreCategorySidebar = ({ categories, activeCategoryId, onCategoryChange }) => {
  return (
    <div className="flex flex-col items-center w-full py-2">
      {categories.map((category) => {
        const isActive = activeCategoryId === category.id;
        
        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 py-3 px-1 w-full relative transition-all duration-300",
              isActive ? "bg-orange-50/50" : "hover:bg-slate-50"
            )}
          >
            {/* Active Indicator Line */}
            {isActive && (
              <motion.div
                layoutId="activeCategory"
                className="absolute left-0 top-0 bottom-0 w-1 bg-[#f59931] rounded-r-full"
              />
            )}

            <div className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center mb-1.5 transition-all duration-300 overflow-hidden bg-slate-50 border border-slate-100",
              isActive ? "shadow-md scale-105 border-[#f59931]/20" : "grayscale opacity-70 scale-95"
            )}>
              <img 
                src={category.image} 
                alt={category.name}
                className="w-10 h-10 object-cover"
                onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3081/3081840.png"; }}
              />
            </div>

            <span className={cn(
              "text-[9px] font-black text-center leading-[1.1] uppercase tracking-normal transition-colors duration-300 px-1 max-w-full break-words",
              isActive ? "text-[#f59931]" : "text-slate-500"
            )}>
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default StoreCategorySidebar;
