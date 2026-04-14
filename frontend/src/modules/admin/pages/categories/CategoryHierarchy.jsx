import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  List,
  ChevronRight,
  Search,
  FolderOpen,
  Folder,
  Tag,
  Layers,
  ArrowRight,
  Package,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import Card from "@shared/components/ui/Card";
import Badge from "@shared/components/ui/Badge";
import { toast } from "sonner";

const CategoryHierarchy = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Selection State for Miller Columns
  const [selectedHeader, setSelectedHeader] = useState(null);
  const [selectedLevel2, setSelectedLevel2] = useState(null);

  // Stats
  const stats = useMemo(() => {
    let headers = 0;
    let l2 = 0;
    let subs = 0;

    const traverse = (items) => {
      items.forEach((item) => {
        if (item.type === "header") headers++;
        if (item.type === "category") l2++;
        if (item.type === "subcategory") subs++;
        if (item.children) traverse(item.children);
      });
    };
    traverse(categories);
    return { headers, l2, subs, total: headers + l2 + subs };
  }, [categories]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getCategoryTree();
      if (res.data.success) {
        setCategories(res.data.results || res.data.result || []);
      }
    } catch (error) {
      toast.error("Failed to fetch category hierarchy");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter Logic
  const filteredHeaders = useMemo(() => {
    if (!searchTerm) return categories.filter((c) => c.type === "header");

    // If searching, we want to show path to matches
    // But for Miller columns, simple filtering of top level might be confusing
    // So we'll just filter the current list being viewed
    return categories.filter(
      (c) =>
        c.type === "header" &&
        c.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [categories, searchTerm]);

  const activeLevel2 = useMemo(() => {
    if (!selectedHeader) return [];
    return selectedHeader.children || [];
  }, [selectedHeader]);

  const activeSubs = useMemo(() => {
    if (!selectedLevel2) return [];
    return selectedLevel2.children || [];
  }, [selectedLevel2]);

  // Handle Selection
  const handleHeaderSelect = (header) => {
    setSelectedHeader(header);
    setSelectedLevel2(null);
  };

  const handleLevel2Select = (l2) => {
    setSelectedLevel2(l2);
  };

  const handleHeaderColorChange = async (categoryId, newColor) => {
    try {
      const res = await adminApi.updateCategory(categoryId, {
        headerColor: newColor,
      });
      if (res.data.success) {
        toast.success("Color updated successfully");
        // Update local state
        setCategories((prev) =>
          prev.map((header) =>
            header._id === categoryId || header.id === categoryId
              ? { ...header, headerColor: newColor }
              : header
          )
        );
        // Update selected header if it's the one being changed
        if (
          selectedHeader &&
          (selectedHeader._id === categoryId || selectedHeader.id === categoryId)
        ) {
          setSelectedHeader({ ...selectedHeader, headerColor: newColor });
        }
        // Notify home page to refresh categories
        window.localStorage.setItem('categoriesRefresh', Date.now().toString());
      }
    } catch (error) {
      toast.error("Failed to update color");
    }
  };

  const handleLevel2ColorChange = async (categoryId, newColor) => {
    try {
      const res = await adminApi.updateCategory(categoryId, {
        headerColor: newColor,
      });
      if (res.data.success) {
        toast.success("Color updated successfully");
        // Update local state
        setCategories((prev) =>
          prev.map((header) => ({
            ...header,
            children: header.children?.map((l2) =>
              l2._id === categoryId || l2.id === categoryId
                ? { ...l2, headerColor: newColor }
                : l2
            ),
          }))
        );
        // Update selected level2 if it's the one being changed
        if (
          selectedLevel2 &&
          (selectedLevel2._id === categoryId || selectedLevel2.id === categoryId)
        ) {
          setSelectedLevel2({ ...selectedLevel2, headerColor: newColor });
        }
        // Notify home page to refresh categories
        window.localStorage.setItem('categoriesRefresh', Date.now().toString());
      }
    } catch (error) {
      toast.error("Failed to update color");
    }
  };

  // Components
  const ColumnHeader = ({ title, icon: Icon, count, color }) => (
    <div
      className={`p-4 border-b border-gray-100 bg-white sticky top-0 z-10 flex items-center justify-between ${color}`}>
      <div className="flex items-center gap-2 font-bold text-gray-700">
        <Icon className="w-4 h-4" />
        <span>{title}</span>
      </div>
      <Badge variant="neutral" className="bg-gray-100 text-gray-600 font-mono">
        {count}
      </Badge>
    </div>
  );

  const ListItem = ({ item, isSelected, onClick, hasChildren, type, onColorChange }) => {
    const activeClass = isSelected
      ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm z-10"
      : "hover:bg-gray-50 border-transparent text-gray-600";

    const iconColor = isSelected ? "text-indigo-500" : "text-gray-400";

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`
                    group flex items-center justify-between p-3 mx-2 my-1 rounded-lg border cursor-pointer transition-all duration-200
                    ${activeClass}
                `}>
        <div className="flex items-center gap-3 overflow-hidden flex-1" onClick={onClick}>
          <div
            className={`
                        w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
                        ${isSelected ? "bg-white shadow-sm" : "bg-gray-100 group-hover:bg-white group-hover:shadow-sm"}
                    `}>
            {item.image?.url || item.image ? (
              <img
                src={item.image?.url || item.image}
                alt=""
                className="w-full h-full object-cover rounded-lg"
              />
            ) : type === "header" ? (
              <FolderOpen className={`w-4 h-4 ${iconColor}`} />
            ) : type === "category" ? (
              <Folder className={`w-4 h-4 ${iconColor}`} />
            ) : (
              <Tag className={`w-4 h-4 ${iconColor}`} />
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-semibold text-sm truncate">{item.name}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-60 truncate">
              {item.slug}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {(type === "category" || type === "header") && onColorChange && (
            <>
              <div
                className="h-6 w-6 rounded-lg shadow-sm ring-1 ring-gray-200 cursor-pointer hover:ring-indigo-300 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${item.headerColor || '#7B4419'} 0%, ${item.headerColor || '#7B4419'}dd 100%)`
                }}
                title="Click to change color"
                onClick={(e) => {
                  document.getElementById(`color-input-${item._id || item.id}`).click();
                  e.stopPropagation();
                }}
              />
              <input
                id={`color-input-${item._id || item.id}`}
                type="color"
                value={item.headerColor || '#7B4419'}
                onChange={(e) => {
                  onColorChange(item._id || item.id, e.target.value);
                  e.stopPropagation();
                }}
                className="hidden"
              />
            </>
          )}
        </div>

        {hasChildren && type !== "category" && (
          <ChevronRight
            className={`w-4 h-4 shrink-0 ${isSelected ? "text-indigo-400" : "text-gray-300"}`}
          />
        )}
      </motion.div>
    );
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4 animate-in fade-in duration-500">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            Category Hierarchy Explorer
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Visual overview of your catalog structure ({stats.total} items)
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>
                Headers: <b>{stats.headers}</b>
              </span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span>
                Level 2: <b>{stats.l2}</b>
              </span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span>
              <span>
                Subcategories: <b>{stats.subs}</b>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Miller Columns View */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 md:grid-rows-[minmax(0,1fr)] gap-4 overflow-hidden">
        {/* Column 1: Headers */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden min-h-0 h-full">
          <ColumnHeader
            title="Header Categories"
            icon={LayoutGrid}
            count={filteredHeaders.length}
            color="border-l-4 border-l-indigo-500"
          />

          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter headers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          <div
            className="flex-1 min-h-0 overflow-y-auto py-2 custom-scrollbar overscroll-contain touch-pan-y"
            tabIndex={0}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {isLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Loading structure...
              </div>
            ) : filteredHeaders.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No headers found
              </div>
            ) : (
              filteredHeaders.map((header) => (
                <ListItem
                  key={header._id || header.id}
                  item={header}
                  type="header"
                  isSelected={
                    selectedHeader &&
                    (selectedHeader._id || selectedHeader.id) ===
                    (header._id || header.id)
                  }
                  onClick={() => handleHeaderSelect(header)}
                  hasChildren={header.children && header.children.length > 0}
                  onColorChange={handleHeaderColorChange}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: Level 2 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden min-h-0 h-full transition-all duration-300">
          <ColumnHeader
            title="Level 2 Categories"
            icon={Folder}
            count={activeLevel2.length}
            color="border-l-4 border-l-purple-500"
          />

          {!selectedHeader ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50">
              <ArrowRight className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">
                Select a Header Category
                <br />
                to view its contents
              </p>
            </div>
          ) : (
            <div
              className="flex-1 min-h-0 overflow-y-auto py-2 custom-scrollbar overscroll-contain touch-pan-y"
              tabIndex={0}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {activeLevel2.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No Level 2 categories in <br />
                  <span className="font-bold text-gray-600">
                    "{selectedHeader.name}"
                  </span>
                </div>
              ) : (
                activeLevel2.map((l2) => (
                  <ListItem
                    key={l2._id || l2.id}
                    item={l2}
                    type="category"
                    isSelected={
                      selectedLevel2 &&
                      (selectedLevel2._id || selectedLevel2.id) ===
                      (l2._id || l2.id)
                    }
                    onClick={() => handleLevel2Select(l2)}
                    hasChildren={l2.children && l2.children.length > 0}
                    onColorChange={handleLevel2ColorChange}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Column 3: Subcategories */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden min-h-0 h-full">
          <ColumnHeader
            title="Subcategories"
            icon={Tag}
            count={activeSubs.length}
            color="border-l-4 border-l-brand-500"
          />

          {!selectedLevel2 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50">
              <ArrowRight className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">
                Select a Level 2 Category
                <br />
                to view subcategories
              </p>
            </div>
          ) : (
            <div
              className="flex-1 min-h-0 overflow-y-auto py-2 custom-scrollbar overscroll-contain touch-pan-y"
              tabIndex={0}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {activeSubs.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No subcategories in <br />
                  <span className="font-bold text-gray-600">
                    "{selectedLevel2.name}"
                  </span>
                </div>
              ) : (
                activeSubs.map((sub) => (
                  <ListItem
                    key={sub._id || sub.id}
                    item={sub}
                    type="subcategory"
                    isSelected={false}
                    onClick={() => { }}
                    hasChildren={false}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryHierarchy;
