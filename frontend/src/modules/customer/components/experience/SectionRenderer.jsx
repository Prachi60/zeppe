import React from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../shared/ProductCard";
import { cn } from "@/lib/utils";
import ExperienceBannerCarousel from "./ExperienceBannerCarousel";
import { motion } from "framer-motion";
import { mixHexColors } from "../../utils/headerTheme";
import { navigateToCategory } from "../../utils/categoryNavigation";

const SectionRenderer = ({
  sections = [],
  productsById = {},
  categoriesById = {},
  subcategoriesById = {},
  themeColor = "#45B0E2",
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {sections.map((section) => {
        const heading = section.title;

        if (section.displayType === "banners") {
          const items = section.config?.items || section.config?.banners?.items || [];
          if (!items.length) return null;
          return (
            <div key={section._id} className="px-1 md:px-0 mb-6">
              <ExperienceBannerCarousel section={section} items={items} fullWidth={true} />
            </div>
          );
        }

        if (section.displayType === "categories") {
          const ids = section.config?.categories?.categoryIds || [];
          const rows = section.config?.categories?.rows || 1;
          const visibleCount = rows * 4;
          const items = ids
            .map((id) => categoriesById[id])
            .filter(Boolean)
            .slice(0, visibleCount);

          if (!items.length) return null;

          return (
            <div
              key={section._id}
              id={`section-${section._id}`}
              className="px-1 md:px-0"
            >
              {heading && (
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[17px] font-black tracking-tight text-[#111111]">
                    {heading}
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {items.length} categories
                  </span>
                </div>
              )}
              <div className="mt-4">
                <div className="grid grid-cols-4 gap-y-7 gap-x-3">
                  {items.map((cat) => (
                    <button
                      key={cat._id}
                      className="group flex flex-col items-center gap-1.5 focus:outline-none"
                      onClick={() => {
                        // Remember the header & section so back navigation can restore context
                        window.sessionStorage.setItem(
                          "experienceReturn",
                          JSON.stringify({
                            headerId: section.headerId || null,
                            sectionId: section._id,
                          }),
                        );
                        navigateToCategory(navigate, cat._id);
                      }}>
                      <motion.div
                        animate={{
                          background: `radial-gradient(circle at center, ${mixHexColors("#FFFFFF", themeColor, 0.3)} 0%, ${themeColor} 65%, ${mixHexColors(themeColor, "#000000", 0.15)} 100%)`,
                        }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="relative aspect-square w-full rounded-2xl border border-white/30 flex items-center justify-center overflow-hidden p-3 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]">

                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-[85%] h-[85%] object-contain object-center block mx-auto transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-slate-100" />
                        )}
                      </motion.div>
                      <motion.div
                        animate={{ color: "#1A1A1A" }}
                        className="text-[11px] font-semibold text-center leading-snug line-clamp-2 transition-colors duration-500">
                        {cat.name}
                      </motion.div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        if (section.displayType === "subcategories") {
          const ids = section.config?.subcategories?.subcategoryIds || [];
          const rows = section.config?.subcategories?.rows || 1;
          const visibleCount = rows * 4;
          const items = ids
            .map((id) => subcategoriesById[id])
            .filter(Boolean)
            .slice(0, visibleCount);
          if (!items.length) return null;

          return (
            <div
              key={section._id}
              id={`section-${section._id}`}
              className="px-1 md:px-0"
            >
              {heading && (
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[17px] font-black tracking-tight text-[#111111]">
                    {heading}
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {items.length} picks
                  </span>
                </div>
              )}
              <div className="mt-4">
                <div className="grid grid-cols-4 gap-y-7 gap-x-3">
                  {items.map((cat) => {
                    return (
                      <button
                        key={cat._id}
                        className="group flex flex-col items-center gap-1.5 focus:outline-none"
                        onClick={() => {
                          window.sessionStorage.setItem(
                            "experienceReturn",
                            JSON.stringify({
                              headerId: section.headerId || null,
                              sectionId: section._id,
                            }),
                          );
                          const parentId =
                            cat.parentId?._id ||
                            cat.parentId ||
                            cat.categoryId?._id ||
                            cat.categoryId ||
                            null;

                          if (parentId) {
                            navigateToCategory(navigate, parentId, {
                              activeSubcategoryId: cat._id,
                            });
                          } else {
                            // Fallback to previous behavior if we can't resolve parent
                            navigateToCategory(navigate, cat._id);
                          }
                        }}>
                        <motion.div
                          animate={{
                            background: `radial-gradient(circle at center, ${mixHexColors("#FFFFFF", themeColor, 0.3)} 0%, ${themeColor} 65%, ${mixHexColors(themeColor, "#000000", 0.15)} 100%)`,
                          }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className="relative aspect-square w-full rounded-2xl border border-white/30 flex items-center justify-center overflow-hidden p-3 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]">

                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="w-[85%] h-[85%] object-contain object-center block mx-auto transition-transform duration-500 group-hover:scale-110 drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-slate-100" />
                          )}
                        </motion.div>
                        <motion.div
                          animate={{ color: "#1A1A1A" }}
                          className="text-[11px] font-semibold text-center leading-snug line-clamp-2 transition-colors duration-500">
                          {cat.name}
                        </motion.div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

        if (section.displayType === "products") {
          const productConfig = section.config?.products || {};
          const ids = productConfig.productIds || [];
          const rows = productConfig.rows || 3;
          const columns = productConfig.columns || 3;
          const singleRowScrollable = !!productConfig.singleRowScrollable;

          let allProducts;

          if (ids.length) {
            allProducts = ids.map((id) => productsById[id]).filter(Boolean);
          } else {
            const categoryFilter = productConfig.categoryIds || [];
            const subcategoryFilter = productConfig.subcategoryIds || [];
            const hasCategoryFilter = categoryFilter.length > 0;
            const hasSubcategoryFilter = subcategoryFilter.length > 0;

            const all = Object.values(productsById);
            allProducts = all.filter((p) => {
              const catId = p.categoryId?._id || p.categoryId;
              const subId = p.subcategoryId?._id || p.subcategoryId;

              const matchesCategory = hasCategoryFilter
                ? categoryFilter.includes(catId)
                : true;
              const matchesSubcategory = hasSubcategoryFilter
                ? subcategoryFilter.includes(subId)
                : true;

              return matchesCategory && matchesSubcategory;
            });
          }

          if (!allProducts.length) return null;

          if (singleRowScrollable) {
            return (
              <div
                key={section._id}
                id={`section-${section._id}`}
                className="px-1 md:px-0 mt-6 mb-2"
              >
                <div className="flex items-center justify-between mb-4">
                  {heading && (
                    <h2 className="text-[17px] font-black tracking-tight text-[#111111]">
                      {heading}
                    </h2>
                  )}
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {allProducts.length} items
                  </span>
                </div>
                <div className="relative z-10 flex overflow-x-auto gap-3 pb-4 no-scrollbar">
                  {allProducts.map((product) => (
                    <div
                      key={product._id || product.id}
                      className="w-[110px] shrink-0"
                    >
                      <ProductCard product={product} compact={true} quickComm={true} />
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          const visibleCount = rows * columns;
          const items = allProducts.slice(0, visibleCount);

          return (
            <div
              key={section._id}
              id={`section-${section._id}`}
              className="px-1 md:px-0 mt-8 mb-4"
            >
              <div className="flex items-center justify-between mb-4">
                {heading && (
                  <h2 className="text-[17px] font-black tracking-tight text-[#111111]">
                    {heading}
                  </h2>
                )}
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {allProducts.length} items
                </span>
              </div>
              <div
                className={cn(
                  "grid gap-x-3 gap-y-6",
                  columns === 1
                    ? "grid-cols-1"
                    : "grid-cols-3"
                )}
              >
                {items.map((product) => (
                  <div key={product._id || product.id} className="flex justify-center">
                    <ProductCard product={product} compact={true} quickComm={true} />
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (section.displayType === "brands") {
          const items = section.config?.brands?.items || section.config?.items || [];
          if (!items.length) return null;

          return (
            <div key={section._id} className="py-2 mt-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[17px] font-black tracking-tight text-[#111111]">
                  {heading || "Top Brands"}
                </h2>
                <span
                  onClick={() => navigate("/offers")}
                  className="text-[12px] font-bold text-[#111111] cursor-pointer hover:underline"
                >
                  See All
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1 mb-2">
                {items.map((brand, i) => (
                  <div
                    key={i}
                    onClick={() =>
                      navigate("/search", {
                        state: { query: brand.linkValue || brand.name },
                      })
                    }
                    className="flex-shrink-0 w-[85px] h-[85px] sm:w-[110px] sm:h-[110px] rounded-[14px] border border-[#e8e8e8] bg-white flex items-center justify-center p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <img
                      src={brand.image}
                      alt={brand.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default SectionRenderer;
