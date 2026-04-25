import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { buildHeaderGradient } from '../../utils/headerTheme';
import { getCategoryImage } from '@/shared/constants/categoryImageMap';
import { getCategoryLocation } from '../../utils/categoryNavigation';

const PromoBanner = ({ activeCategory }) => {
    const isAllCategory =
        activeCategory?.id === 'all' ||
        activeCategory?._id === 'all' ||
        String(activeCategory?.name || '').toLowerCase() === 'all';

    const gradientColor = activeCategory?.headerColor || '#45B0E2';
    const categoryName = String(activeCategory?.name || 'All');
    const activeCategoryKey = activeCategory?._id || activeCategory?.id || 'all';
    const bannerLocation = getCategoryLocation(activeCategoryKey || 'all');

    // Use backend promo fields if available, else fallback to defaults
    const bannerTitle = activeCategory?.promoBannerTitle || (isAllCategory ? 'Sugar' : categoryName);
    const bannerPrimaryText = activeCategory?.promoBannerSubtitle || (isAllCategory ? 'Rs. 1 per Kg*' : `${categoryName} Deals`);
    const bannerSecondaryText = activeCategory?.promoBannerDescription || (isAllCategory ? 'On Order above 399' : '');
    const bannerImage = activeCategory?.promoBannerImage ||
        (isAllCategory
            ? '/FortuneSugarPack.png'
            : (activeCategory?.image || getCategoryImage(categoryName) || '/FortuneSugarPack.png'));
    const bannerImageAlt = isAllCategory ? 'Fortune sugar pack' : `${categoryName} banner`;

    // Color: if admin set headerColor use it, else "All" defaults to black, others use their headerColor
    const bannerBackground = (isAllCategory && !activeCategory?.headerColor)
        ? '#FFE100'
        : buildHeaderGradient(gradientColor);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full"
            style={{ background: bannerBackground }}
        >
            <Link
                to={bannerLocation}
                className="block w-full overflow-hidden"
            >
                <div
                    className="grid w-full grid-cols-[1fr_auto_1fr] items-center py-4 sm:py-6 md:min-h-52 md:px-6 md:py-8"
                    style={{ background: bannerBackground }}
                >
                    {/* Left Column: Title */}
                    <div className="flex items-center justify-center pr-2 text-black">
                        <h2
                            className="text-[26px] font-extrabold italic leading-none sm:text-[38px] md:text-[64px] tracking-tight"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            {bannerTitle}
                        </h2>
                    </div>

                    {/* Center Column: Image */}
                    <div className="flex items-center justify-center">
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            src={bannerImage}
                            alt={bannerImageAlt}
                            className="h-24 w-auto object-contain sm:h-36 md:h-80 drop-shadow-2xl"
                            loading="eager"
                        />
                    </div>

                    {/* Right Column: Subtitle & Description */}
                    <div className="flex flex-col items-center justify-center pl-2 text-black">
                        <p
                            className="text-center text-[18px] font-extrabold italic leading-none sm:text-[28px] md:text-[48px] tracking-tighter"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            {bannerPrimaryText}
                        </p>
                        <p
                            className="mt-1 text-center text-[9px] font-semibold italic leading-tight sm:text-[13px] md:mt-3 md:text-[24px]"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            {bannerSecondaryText}
                        </p>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default PromoBanner;
