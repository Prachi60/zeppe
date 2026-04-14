# Sugar Promo Banner - Setup Instructions

## ✅ What's Been Done:
1. Created new `PromoBanner.jsx` component in `src/modules/customer/components/layout/`
2. Integrated the banner into `CustomerLayout.jsx` - it now displays below the header on both mobile and desktop
3. Banner is fully responsive and clickable (links to Grocery category)

## 🖼️ How to Add the Banner Image:

### Option 1: Save from Browser (Recommended)
1. Right-click on the banner image shown in the chat
2. Select "Save image as..." (or similar option in your browser)
3. Name it: `SugarPromo.png`
4. Save it to: `c:\Users\DELL\Desktop\Project\zeppe\frontend\public\`

### Option 2: Place in Public Folder
- If you already have the image file, place it in the `public/` folder at the root of your frontend project
- Make sure it's named exactly: `SugarPromo.png`

## 📱 Display Information:
- **Desktop**: Full-width banner below navbar
- **Mobile**: Full-width banner below navbar (responsive)
- **Hover Effect**: Subtle shadow effect on hover
- **Click Action**: Links to the Grocery category

## ✨ Features:
- Smooth fade-in animation when page loads
- Responsive design (scales perfectly on all screen sizes)
- Graceful fallback if image is missing
- Optimized image loading with lazy loading

## 🚀 Next Steps:
1. Add `SugarPromo.png` to the `public/` folder
2. Start your dev server: `npm run dev`
3. Navigate to the home page to see the banner display below the header

---
**Note**: The banner will only display when images are properly placed. Once you add the image file, refresh the page to see it live!
