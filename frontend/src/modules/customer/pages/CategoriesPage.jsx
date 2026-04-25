import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MainLocationHeader from "../components/shared/MainLocationHeader";
import axiosInstance from "@core/api/axios";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { getCategoryImage } from "@/shared/constants/categoryImageMap";

const DEFAULT_DISCOVERY_TILE_IMAGE = "/FortuneSugarPack.png";

const MANUAL_SUBCAT_ORDER = [
  "Vegetables",
  "Fresh Fruits",
  "Rice, Dals & Atta",
  "Masala, Oil & Ghee",
  "Frozen Food",
  "Milk, Bakery & Eggs",
  "Biscuits & Cookies",
  "Cereals & Nuts",
  "Dry Fruits",
  "Sweets",
  "Puja Samagri",
  "Kitchen Tools & Appliances"
];

const CATEGORIES_ANCHOR = {
  id: "categories-anchor",
  _id: "categories-anchor",
  name: "Categories",
  slug: "categories",
  image: "/assets/categories-icon.png", // Placeholder
};

const CategoriesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [categorizedSections, setCategorizedSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [catRes] = await Promise.all([
        axiosInstance.get("/admin/categories"),
      ]);

      if (catRes.data.success) {
        const dbCats = catRes.data.results || [];
        const mainCategories = dbCats.filter((cat) => cat.type === "category");
        const subCategories = dbCats.filter((cat) => cat.type === "subcategory");
        const headerCategories = dbCats.filter((cat) => cat.type === "header" || cat.isHeader);

        // Find or create "All" category
        const allCategoryFromDb = headerCategories.find(
          (c) => String(c.name || "").trim().toLowerCase() === "all",
        );
        const mergedAllCategory = {
          _id: "all",
          id: "all",
          name: "All",
          slug: "all",
          ...(allCategoryFromDb || {}),
        };

        const sortedHeaders = headerCategories
          .filter((c) => String(c.name || "").trim().toLowerCase() !== "all")
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        const hierarchy = mainCategories
          .map((mc) => {
            const parentId = mc.parentId?._id || mc.parentId || mc.categoryId?._id || mc.categoryId;
            const parentHeader = headerCategories.find(h => h._id === parentId);
            
            return {
              ...mc,
              headerColor: mc.headerColor || parentHeader?.headerColor,
              subcategories: subCategories
                .filter((sc) => {
                  const pId = sc.parentId?._id || sc.parentId || sc.categoryId?._id || sc.categoryId;
                  return pId === mc._id;
                })
                .sort((a, b) => {
                  const idxA = MANUAL_SUBCAT_ORDER.indexOf(a.name);
                  const idxB = MANUAL_SUBCAT_ORDER.indexOf(b.name);
                  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                  if (idxA !== -1) return -1;
                  if (idxB !== -1) return 1;
                  return new Date(b.createdAt) - new Date(a.createdAt);
                }),
            };
          })
          .filter((section) => section.subcategories.length > 0)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        setCategorizedSections(hierarchy);
        setCategories([
          mergedAllCategory,
          CATEGORIES_ANCHOR,
          ...sortedHeaders
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const mobileDiscoverySections = useMemo(() => {
    return categorizedSections.map((section) => {
      const sectionTiles = (section.subcategories || []).map((sub) => ({
        id: sub._id,
        name: sub.name,
        image: sub.image || getCategoryImage(sub.name) || DEFAULT_DISCOVERY_TILE_IMAGE,
        fallbackImage: DEFAULT_DISCOVERY_TILE_IMAGE,
        targetPath: `/category/${section._id}`,
        targetState: { activeSubcategoryId: sub._id },
      }));

      return {
        id: section._id,
        title: section.name,
        headerColor: section.headerColor,
        tiles: sectionTiles,
      };
    });
  }, [categorizedSections]);

  return (
    <div className="min-h-screen bg-[#d2e2fc]">
      {/* Reusable Header */}
      <MainLocationHeader 
        categories={categories}
        activeCategory={{ id: "categories-anchor", name: "Categories", _id: "categories-anchor" }}
        onCategorySelect={(cat) => {
          if (cat.slug === "all") navigate("/");
          else if (cat._id === "categories-anchor" || cat.id === "categories-anchor") return; // stay here
          else navigate(`/category/${cat._id}`);
        }}
      />

      <div className="pb-24 pt-2">
        {/* CATEGORY DISCOVERY (TILES) */}
        {mobileDiscoverySections.length > 0 ? (
          <div id="mobile-category-discovery" className="relative z-20 md:hidden">
            {mobileDiscoverySections.map((section, sectionIndex) => (
              <div key={`${section.id}-tiles-group`}>
                <section className={cn("px-4", sectionIndex === 0 ? "pb-6 pt-8" : "pb-6 pt-2")}>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="tracking-tight text-[#3f3f3f] text-[15px] font-extrabold leading-none">
                      {section.title}
                    </h2>
                  </div>

                  <div className="grid grid-cols-4 gap-x-3 gap-y-6">
                    {section.tiles.map((tile) => (
                      <motion.button
                        key={tile.id}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => navigate(tile.targetPath, { state: tile.targetState })}
                        className="flex flex-col items-center">
                        <div 
                          className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-[18px] border p-2.5 shadow-md transition-all duration-300"
                          style={{
                            borderColor: "#e67e22",
                            background: `radial-gradient(circle at center, rgba(255,255,255,0.65) 0%, transparent 80%), linear-gradient(160deg, #FF9F1C 0%, #e67e22 100%)`,
                            boxShadow: `inset 0 8px 16px rgba(255,255,255,0.25), 0 4px 10px rgba(0,0,0,0.12)`
                          }}
                        >
                          <img
                            src={tile.image}
                            alt={tile.name}
                            className="h-full w-full object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,0.15)]"
                          />
                        </div>
                        <span className="mt-2 line-clamp-2 text-center text-[#1f1f1f] min-h-[24px] text-[10px] font-semibold leading-[1.15]">
                          {tile.name}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </section>
              </div>
            ))}
          </div>
        ) : (
          !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
               <p className="text-lg font-bold">No categories found</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
