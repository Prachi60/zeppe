import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import MainLocationHeader from '../components/shared/MainLocationHeader';
import { customerApi } from '../services/customerApi';

const COLORS = [
    "#F2EEE4", "#EFE7E2", "#EAF1F4", "#F0E8F2",
    "#EAF4EC", "#F5F1E6", "#EEF2F6", "#F2EEF5"
];

const CategoriesPage = () => {
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [columnsPerRow, setColumnsPerRow] = useState(() => {
        if (typeof window === 'undefined') return 4;
        if (window.innerWidth >= 1024) return 8;
        if (window.innerWidth >= 768) return 6;
        return 4;
    });
    const [flippedCategoryId, setFlippedCategoryId] = useState(null);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await customerApi.getCategories({ tree: true });
            if (res.data.success) {
                const tree = res.data.results || res.data.result || [];
                const formattedGroups = tree
                    .filter((header) => (header.name || '').trim().toLowerCase() !== 'all')
                    .map((header, idx) => {
                        const categories = (header.children || []).map((cat, cIdx) => ({
                            id: cat._id,
                            name: cat.name,
                            image: cat.image || "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/layout-engine/2022-11/Slice-1_9.png",
                            color: COLORS[(idx + cIdx) % COLORS.length]
                        }));

                        return {
                            title: header.name,
                            categories,
                        };
                    })
                    .filter((group) => group.categories.length > 0);
                setGroups(formattedGroups);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const updateColumnsPerRow = () => {
            if (window.innerWidth >= 1024) setColumnsPerRow(8);
            else if (window.innerWidth >= 768) setColumnsPerRow(6);
            else setColumnsPerRow(4);
        };
        updateColumnsPerRow();
        window.addEventListener('resize', updateColumnsPerRow);
        return () => window.removeEventListener('resize', updateColumnsPerRow);
    }, []);

    const flipRows = useMemo(() => {
        const rows = [];
        groups.forEach((group, groupIndex) => {
            const cats = group.categories || [];
            const isLeftToRightGroup = groupIndex % 2 === 0;
            for (let rowStart = 0; rowStart < cats.length; rowStart += columnsPerRow) {
                const row = cats.slice(rowStart, rowStart + columnsPerRow);
                const rowSequence = isLeftToRightGroup ? row : [...row].reverse();
                const rowIds = rowSequence.map((category) => category.id).filter(Boolean);
                if (rowIds.length) rows.push(rowIds);
            }
        });
        return rows;
    }, [groups, columnsPerRow]);

    useEffect(() => {
        if (!flipRows.length) {
            setFlippedCategoryId(null);
            return;
        }

        let isCancelled = false;
        let activeTimer = null;
        let settleTimer = null;
        let rowCursor = 0;
        const itemCursorByRow = new Array(flipRows.length).fill(0);

        const FLIP_VISIBLE_MS = 620;
        const GAP_BETWEEN_FLIPS_MS = 220;

        const getNextFromRows = () => {
            const totalRows = flipRows.length;
            for (let tries = 0; tries < totalRows; tries += 1) {
                const rowIndex = (rowCursor + tries) % totalRows;
                const rowItems = flipRows[rowIndex] || [];
                if (!rowItems.length) continue;
                const itemIndex = itemCursorByRow[rowIndex] % rowItems.length;
                const nextId = rowItems[itemIndex];
                itemCursorByRow[rowIndex] = (itemIndex + 1) % rowItems.length;
                rowCursor = (rowIndex + 1) % totalRows; // alternate to next row
                return nextId;
            }
            return null;
        };

        const scheduleNextFlip = () => {
            if (isCancelled) return;
            activeTimer = setTimeout(() => {
                if (isCancelled) return;
                const nextId = getNextFromRows();
                if (!nextId) return;
                setFlippedCategoryId(nextId);

                settleTimer = setTimeout(() => {
                    if (isCancelled) return;
                    setFlippedCategoryId(null);
                    scheduleNextFlip();
                }, FLIP_VISIBLE_MS);
            }, GAP_BETWEEN_FLIPS_MS);
        };

        scheduleNextFlip();

        return () => {
            isCancelled = true;
            if (activeTimer) clearTimeout(activeTimer);
            if (settleTimer) clearTimeout(settleTimer);
        };
    }, [flipRows]);

    return (
        <div className="min-h-screen bg-white max-w-md mx-auto">
            <MainLocationHeader />
            <div className="px-3 pt-[130px] pb-24">
                {groups.map((group, groupIdx) => (
                    <div key={groupIdx} className="mb-8" style={{ animationDelay: `${groupIdx * 100}ms` }}>
                        {/* Group Title */}
                        <h2 className="text-[17px] font-black text-[#1A1A1A] mb-3 px-1">
                            {group.title}
                        </h2>

                        {/* Categories Grid — forced 4 cols */}
                        <div className="grid grid-cols-4 gap-x-2 gap-y-3">
                            {group.categories.map((category) => (
                                <Link
                                    key={category.id}
                                    to={`/category/${category.id}`}
                                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                                >
                                    {/* Square image box */}
                                    <div
                                        className="w-full aspect-square rounded-2xl flex items-center justify-center overflow-hidden relative [perspective:800px]"
                                        style={{ backgroundColor: category.color }}
                                    >
                                        <div
                                            className="relative w-full h-full transition-transform duration-500"
                                            style={{
                                                transformStyle: 'preserve-3d',
                                                WebkitTransformStyle: 'preserve-3d',
                                                transform: flippedCategoryId === category.id ? 'rotateY(180deg)' : 'rotateY(0deg)'
                                            }}
                                        >
                                            {/* Front */}
                                            <div
                                                className="absolute inset-0 flex items-center justify-center p-2"
                                                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                                            >
                                                <img
                                                    src={category.image}
                                                    alt={category.name}
                                                    crossOrigin="anonymous"
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent && !parent.querySelector('.cat-fallback')) {
                                                            const fb = document.createElement('div');
                                                            fb.className = 'cat-fallback';
                                                            fb.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:rgba(0,0,0,0.25);';
                                                            fb.textContent = (category.name || '?')[0].toUpperCase();
                                                            parent.appendChild(fb);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            {/* Back (flip) */}
                                            <div
                                                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#F6EFE4] via-[#EEE7F8] to-[#E7F1FB] text-slate-700 flex items-center justify-center p-1.5 text-center"
                                                style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                                            >
                                                <span className="text-[9px] font-bold leading-tight">
                                                    {category.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Name below */}
                                    <span className="text-[11px] font-semibold text-[#1A1A1A] text-center leading-tight line-clamp-2 px-0.5 group-hover:text-[#45B0E2] transition-colors">
                                        {category.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoriesPage;
