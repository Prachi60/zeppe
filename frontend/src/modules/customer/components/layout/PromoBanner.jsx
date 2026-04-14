import React from 'react';
import { motion } from 'framer-motion';
import { buildHeaderGradient } from '../../utils/headerTheme';
import { getCategoryImage } from '@/shared/constants/categoryImageMap';

const PromoBanner = ({ activeCategory }) => {
    const isAllCategory =
        activeCategory?.id === 'all' ||
        activeCategory?._id === 'all' ||
        String(activeCategory?.name || '').toLowerCase() === 'all';

    const gradientColor = activeCategory?.headerColor || '#45B0E2';
    const categoryName = String(activeCategory?.name || 'All');
    const activeCategoryKey = activeCategory?.id || activeCategory?._id || categoryName;
    const bannerHref = isAllCategory
        ? '/category/Grocery'
        : `/category/${encodeURIComponent(activeCategoryKey)}`;

    const bannerTitle = isAllCategory ? 'Sugar' : categoryName;
    const bannerPrimaryText = isAllCategory ? 'Rs. 1 per Kg*' : `${categoryName} Deals`;
    const bannerSecondaryText = isAllCategory ? 'On Order above 399' : 'Top picks for you';
    const bannerImage = isAllCategory
        ? '/FortuneSugarPack.png'
        : (activeCategory?.image || getCategoryImage(categoryName) || '/FortuneSugarPack.png');
    const bannerImageAlt = isAllCategory ? 'Fortune sugar pack' : `${categoryName} banner`;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full"
            style={{
                background: isAllCategory
                    ? '#000000'
                    : buildHeaderGradient(gradientColor),
            }}
        >
            <a
                href={bannerHref}
                className="mx-auto block w-full max-w-341.25 overflow-hidden"
            >
                <div
                    className="grid w-full grid-cols-[1.15fr_auto_1.35fr] items-center px-3 py-2 sm:px-4 sm:py-2.5 md:min-h-52 md:px-10 md:py-4"
                    style={{
                        background: isAllCategory
                            ? '#000000'
                            : buildHeaderGradient(gradientColor),
                    }}
                >
                    <div className="pr-2 text-white">
                        <h2
                            className="text-[28px] font-black leading-none sm:text-[40px] md:text-[86px]"
                            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
                        >
                            {bannerTitle}
                        </h2>
                    </div>

                    <div className="flex items-center justify-center px-1 sm:px-2 md:px-6">
                        <img
                            src={bannerImage}
                            alt={bannerImageAlt}
                            className="h-20.5 w-auto object-contain sm:h-27.5 md:h-72.5"
                            loading="eager"
                        />
                    </div>

                    <div className="pl-2 text-white">
                        <p
                            className="text-right text-[14px] font-black leading-none sm:text-[24px] md:text-[62px]"
                            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
                        >
                            {bannerPrimaryText}
                        </p>
                        <p
                            className="mt-1 text-right text-[9px] font-bold leading-tight sm:text-[13px] md:mt-2 md:text-[34px]"
                            style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
                        >
                            {bannerSecondaryText}
                        </p>
                    </div>
                </div>
            </a>
        </motion.div>
    );
};

export default PromoBanner;
