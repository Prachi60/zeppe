# Frontend Codebase - Brand Logos & Images Audit

## Summary
This document details all components, pages, and sections in the frontend codebase that display brand logos, product images, and related visual content.

---

## 1. TOP BRANDS CAROUSEL/SECTION

### File: [modules/customer/pages/Home.jsx](modules/customer/pages/Home.jsx#L2218-L2250)
**Location:** Between "Special" and "Dry Fruits" sections
**Component Type:** Hardcoded carousel
**Status:** ⚠️ Using external API (Clearbit Logo API)

**Brands Displayed:**
- Amul
- Nestle
- Lays
- Pepsi
- Dove

**Image Source Method:**
```javascript
{
  name: "Amul", 
  image: "https://logo.clearbit.com/amul.com"
},
{
  name: "Nestle", 
  image: "https://logo.clearbit.com/nestle.com"
},
{
  name: "Lays", 
  image: "https://logo.clearbit.com/lays.com"
},
{
  name: "Pepsi", 
  image: "https://logo.clearbit.com/pepsi.com"
},
{
  name: "Dove", 
  image: "https://logo.clearbit.com/dove.com"
}
```

**Issues:**
- ⚠️ Depends on external Clearbit API for logo URLs
- No fallback if Clearbit API is unavailable or rate-limited
- Hardcoded brand list - not configurable from admin panel
- Could break if external API changes or goes down

**HTML Rendering:**
```html
<img src={brand.image} alt={brand.name} className="w-full h-full object-contain mix-blend-multiply" />
```

---

## 2. EXPERIENCE BANNER CAROUSEL

### File: [modules/customer/components/experience/ExperienceBannerCarousel.jsx](modules/customer/components/experience/ExperienceBannerCarousel.jsx)

**Purpose:** Displays promotional banners in carousel format
**Image Source:** `banner.imageUrl` from API or config

**Image Properties:**
- Path: `banner.imageUrl`
- Display: Full width, object-cover
- Carousel Type: Auto-sliding every 4 seconds
- Loop enabled with seamless transition

**Used By:**
- SectionRenderer component (for admin-configurable experience sections)
- Home page (multiple banner sections)

---

## 3. SECTION RENDERER COMPONENT

### File: [modules/customer/components/experience/SectionRenderer.jsx](modules/customer/components/experience/SectionRenderer.jsx)

**Supported Section Types with Images:**

#### a. **Categories Display**
- Source: `cat.image` from API
- Renders category icons with gradient background
- Hover effect: Scale 1.05, drop shadow

#### b. **Subcategories Display**
- Source: `cat.image` from API
- Similar to categories, displays subcategory icons
- Includes fallback: `<div className="h-6 w-6 rounded-full bg-slate-100" />`

#### c. **Products Display**
- Source: Product card images
- Renders via ProductCard component

---

## 4. CATEGORY IMAGE MAPPING

### File: [shared/constants/categoryImageMap.js](shared/constants/categoryImageMap.js)

**Purpose:** Maps category names to Unsplash image URLs for fallback/default images

**Categories with Images:**

| Category | Image URL | Source |
|----------|-----------|--------|
| Vegetables | https://images.unsplash.com/photo-1512621776951-a57141f2eefd | Unsplash |
| Fresh Fruit | https://images.unsplash.com/photo-1557804506-669714d2e9d8 | Unsplash |
| Rice | https://images.unsplash.com/photo-1586985289688-cacf35b67f47 | Unsplash |
| Dal | https://images.unsplash.com/photo-1596040759373-e20eb36c6101 | Unsplash |
| Atta | https://images.unsplash.com/photo-1649293471588-32cbe84a6a81 | Unsplash |
| Masala | https://images.unsplash.com/photo-1596040759373-e20eb36c6101 | Unsplash |
| Oil/Ghee/Masala | https://images.unsplash.com/photo-1447627320907-c6f4ee3dbbe1 | Unsplash |
| Oil | https://images.unsplash.com/photo-1447627320907-c6f4ee3dbbe1 | Unsplash |
| Ghee | https://images.unsplash.com/photo-1599599810694-b5ac4dd64e1d | Unsplash |
| Milk | https://images.unsplash.com/photo-1563636619-f9b94b56447d | Unsplash |
| Dairy | https://images.unsplash.com/photo-1563636619-f9b94b56447d | Unsplash |
| Bakery | https://images.unsplash.com/photo-1509042239860-f550ce710b93 | Unsplash |
| Eggs | https://images.unsplash.com/photo-1582722872805-0fd4dfc96aac | Unsplash |
| Biscuits | https://images.unsplash.com/photo-1590959375944-abd7e991d971 | Unsplash |
| Cookies | https://images.unsplash.com/photo-1590959375944-abd7e991d971 | Unsplash |
| Cereals | https://images.unsplash.com/photo-1590080875513-0b6ec1b37f6b | Unsplash |
| Nuts | https://images.unsplash.com/photo-1585239852251-5a264af6f1c5 | Unsplash |
| Dry Fruits | https://images.unsplash.com/photo-1585239852251-5a264af6f1c5 | Unsplash |
| Puja Samagri | https://images.unsplash.com/photo-1576493504200-41c08d1b8cf8 | Unsplash |
| Kitchen Tools | https://images.unsplash.com/photo-1578500494198-246f612d03b3 | Unsplash |
| Electronics | https://images.unsplash.com/photo-1505740420928-5e560c06d30e | Unsplash |
| Home | https://images.unsplash.com/photo-1556909114-f6e7ad7d3136 | Unsplash |
| Fashion | https://images.unsplash.com/photo-1491553895911-0055eca6402d | Unsplash |
| Beauty | https://images.unsplash.com/photo-1596462502278-af0128a40f33 | Unsplash |
| Health | https://images.unsplash.com/photo-1587854692152-cbe660dbde0d | Unsplash |

**Usage:**
```javascript
import { getCategoryImage } from "@/shared/constants/categoryImageMap";

// In components
const imageUrl = getCategoryImage(categoryName);
// Falls back to default vegetable image if not found
```

---

## 5. BESTSELLER CATEGORY IMAGES (TILES)

### File: [modules/customer/pages/Home.jsx](modules/customer/pages/Home.jsx#L337-L401)

**Categories:**

| ID | Category | Image Count | Source |
|----|----------|-------------|--------|
| 1 | Chips & Namkeen | 4 | Unsplash |
| 2 | Bakery & Biscuits | 4 | Unsplash |
| 3 | Vegetable & Fruits | 4 | Unsplash |
| 4 | Oil, Ghee & Masala | 4 | Unsplash |
| 5 | Sweet & Chocolates | 4 | Unsplash |
| 6 | Drinks & Juices | 4 | Unsplash |

**All image URLs are from Unsplash with `auto=format&fit=crop&q=80&w=200&h=200` parameters**

---

## 6. OFFER SECTION OPTIONS

### File: [shared/constants/offerSectionOptions.js](shared/constants/offerSectionOptions.js)

**Purpose:** Defines side images and styling for offer/banner sections

**Side Image Options:**

| Key | Label | Image URL |
|-----|-------|-----------|
| hair-care | Hair Care | https://images.unsplash.com/photo-1522338242762-594f63bcf581?w=200&h=200&fit=crop |
| grocery | Grocery | https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop |
| electronics | Electronics | https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop |
| beauty | Beauty | https://images.unsplash.com/photo-1596459052278-27bfdc403348?w=200&h=200&fit=crop |
| kitchen | Kitchen | https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop |
| fashion | Fashion | https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop |

---

## 7. SVG GENERATED PRODUCT SHOWCASE IMAGES

### File: [modules/customer/pages/Home.jsx](modules/customer/pages/Home.jsx#L484-L550)

**Function:** `buildShowcaseProductImage()`

**Purpose:** Dynamically generates SVG images for product tiles with brand names

**Supported Product Types (SVG Art):**
- `lighter` - Shows lighter product
- `knives` - Shows knife set
- `knifebox` - Shows knife box set
- `foil` - Shows foil wrap
- `wrap` - Shows wrap/cover
- `ricebag` - Shows rice bag
- `drinkbox` - Shows drink/beverage box
- `platter` - Shows serving platter
- `chilli` - Shows whole chilli peppers
- `sweetbox` - Shows sweets box
- `cerealbox` - Shows cereal box
- `chocos` - Shows chocolate products
- `oatspack` - Shows oats package
- `daliyabox` - Shows daliya box
- `jar` - Shows jar product
- `default` - Generic product box

**SVG Color Palettes:** 4 different palettes with custom colors for each product type

**SVG Data URI Format:**
```javascript
`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarkup)}`
```

---

## 8. CATEGORICAL STAPLE TILE IMAGES

### File: [modules/customer/pages/Home.jsx](modules/customer/pages/Home.jsx#L445-L470)

**Function:** `buildStapleTileImage()`

**Purpose:** Generates SVG-based category tile images with brand names

**Color Palettes:** 4 predefined color schemes
```javascript
[
  ["#c63f2f", "#f3d8c5", "#9f2d1f"],  // Red
  ["#f0a12c", "#f8e1a8", "#b96e00"],  // Orange
  ["#3e3a39", "#e8ddd1", "#1f1a18"],  // Brown
  ["#2d8a4d", "#d6edd4", "#1f6136"],  // Green
]
```

---

## 9. PRODUCT DETAIL SHEET - IMAGE GALLERY

### File: [modules/customer/components/shared/ProductDetailSheet.jsx](modules/customer/components/shared/ProductDetailSheet.jsx#L45-L54)

**Image Sources (Priority Order):**
1. `selectedProduct.mainImage` (primary)
2. `selectedProduct.image` (fallback)
3. `selectedProduct.galleryImages[]` (additional)
4. `"https://images.unsplash.com/photo-1550989460-0adf9ea622e2"` (default placeholder)

**Gallery Features:**
- Image carousel with dot indicators
- Multiple images support
- Thumbnail navigation
- Object-cover display

---

## 10. CATEGORY ICON COMPONENT

### File: [shared/components/CategoryIcon.jsx](shared/components/CategoryIcon.jsx)

**Purpose:** Reusable component for displaying category icons

**Props:**
- `iconId` - ID for icon lookup
- `imageUrl` - Direct image URL
- `alt` - Alt text
- `className` - Tailwind classes (default: 'w-6 h-6')
- `fallbackClassName` - Fallback icon size

**Fallback:** Uses Material-UI icon if no image available

---

## 11. ADMIN - HEADER CATEGORY VISUALS

### File: [shared/constants/headerCategoryVisuals.jsx](shared/constants/headerCategoryVisuals.jsx#L73-L78)

**Purpose:** Maps category visual keys to base64 or local images

**Usage in Components:**
- Used in admin settings for category customization
- Displayed as preview images

---

## 12. PRODUCT IMAGES IN SELLER MODULES

### Files:
- [modules/seller/pages/ProductManagement.jsx](modules/seller/pages/ProductManagement.jsx)
- [modules/seller/pages/AddProduct.jsx](modules/seller/pages/AddProduct.jsx)
- [modules/seller/pages/StockManagement.jsx](modules/seller/pages/StockManagement.jsx)

**Image Properties:**
- `mainImage` - Primary product image
- `galleryImages[]` - Additional product images
- All stored as URLs in database

**Display Method:**
```html
<img src={formData.mainImage} alt="Main Preview" className="w-full h-full object-cover" />
```

---

## 13. ADMIN - SETTINGS LOGOS

### File: [modules/admin/pages/AdminSettings.jsx](modules/admin/pages/AdminSettings.jsx#L384-L417)

**App Logo:**
- Path: `settings.logoUrl`
- Max height: 24 (Tailwind)
- Display: `object-contain`

**Favicon:**
- Path: `settings.faviconUrl`
- Max height: 16 (Tailwind)
- Display: `object-contain`

---

## 14. LOCAL ASSETS

### Directory: [assets/](assets/)

**Available Assets:**
- `Logo.png` - App logo
- `CardBanner.jpg` - Card banner image
- `Catagorysection_bg.png` - Category section background
- `deliveryIcon.png` - Delivery icon
- `store-pin.png` - Store pin marker
- `customer-pin.png` - Customer location pin
- `category-icons/` - Folder (likely containing category icons)
- Lottie animation files:
  - `Backend Icon.json`
  - `Delivery Riding.json`
  - `INSTANT_6.json`

---

## POTENTIAL ISSUES & BROKEN IMAGE PATHS

### ⚠️ **Critical Issues:**

1. **Top Brands using External API**
   - Location: [Home.jsx](modules/customer/pages/Home.jsx#L2235)
   - Issue: Depends on Clearbit logo API
   - Impact: HIGH - Will fail if API is unavailable
   - Solution: Store brand logos locally or in CDN

2. **Unsplash Rate Limiting**
   - Issue: Many components use Unsplash CDN
   - URLs use `auto=format&fit=crop&q=80&w=200&h=200` parameters
   - Impact: MEDIUM - Could hit rate limits during high traffic
   - Solution: Mirror images to local CDN

3. **SVG Data URI Generation**
   - Locations: `buildShowcaseProductImage()`, `buildStapleTileImage()`
   - Impact: LOW - But complex and not easily cacheable
   - Solution: Pre-generate SVGs or use static image server

4. **No Fallback for Missing Category Images**
   - Location: [SectionRenderer.jsx](modules/customer/components/experience/SectionRenderer.jsx#L171-L173)
   - Issue: Falls back to empty div if `cat.image` is undefined
   - Solution: Use `getCategoryImage()` fallback

### 📋 **Missing or Unconfigurable:**

1. Store brand section - Not implemented in current codebase
2. No local brand logo storage (all external)
3. No admin panel for managing brand logos
4. No easy way to update brand list

---

## RECOMMENDATIONS

### Immediate Actions:
1. ✅ Cache Clearbit logo API responses
2. ✅ Add fallback logos for top brands
3. ✅ Mirror critical images to CDN
4. ✅ Add error boundaries for image failures

### Long-term Improvements:
1. Store brand logos in database/CDN
2. Create admin panel for brand management
3. Implement local image caching strategy
4. Replace Unsplash URLs with optimized CDN URLs
5. Add image compression and optimization pipeline

---

## External Dependencies

| Service | Usage | URLs |
|---------|-------|------|
| **Clearbit** | Brand logos | `https://logo.clearbit.com/*` |
| **Unsplash** | Generic images | `https://images.unsplash.com/photo-*` |

---

## Files Summary

**Component Files:**
- ✅ [ExperienceBannerCarousel.jsx](modules/customer/components/experience/ExperienceBannerCarousel.jsx)
- ✅ [SectionRenderer.jsx](modules/customer/components/experience/SectionRenderer.jsx)
- ✅ [ProductDetailSheet.jsx](modules/customer/components/shared/ProductDetailSheet.jsx)
- ✅ [CategoryIcon.jsx](shared/components/CategoryIcon.jsx)

**Page Files:**
- ✅ [Home.jsx](modules/customer/pages/Home.jsx) - **Major image hub**
- ✅ [ProductManagement.jsx](modules/seller/pages/ProductManagement.jsx)
- ✅ [AdminSettings.jsx](modules/admin/pages/AdminSettings.jsx)

**Constants Files:**
- ✅ [categoryImageMap.js](shared/constants/categoryImageMap.js)
- ✅ [offerSectionOptions.js](shared/constants/offerSectionOptions.js)
- ✅ [headerCategoryVisuals.jsx](shared/constants/headerCategoryVisuals.jsx)

---

**Last Updated:** April 13, 2026
**Audit Status:** Complete - 14 sections identified
