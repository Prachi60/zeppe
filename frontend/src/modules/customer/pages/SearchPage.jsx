import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { Search, Mic, ArrowLeft, X, TrendingUp, ChevronRight, History, Bell, Sparkles, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { customerApi } from '../services/customerApi';
import ProductCard from '../components/shared/ProductCard';
import { useProductDetail } from '../context/ProductDetailContext';
import { useSettings } from '@core/context/SettingsContext';
import { cn } from '@/lib/utils';
import { useLocation as useAppLocation } from '../context/LocationContext';
import { navigateToCategory } from '../utils/categoryNavigation';
import Lottie from 'lottie-react';
import noServiceAnimation from '@/assets/lottie/animation.json';

/* ─── Empty State Component ─────────────────────────────────────────────── */
const EmptySearchView = ({ query }) => {
    const navigate = useNavigate();
    return (
        <div className="w-full flex-1 flex flex-col items-center justify-center py-10 px-4 text-center">
            {/* Main Graphic Container */}
            <div className="relative mb-8 mt-2">
                {/* Outer soft glow */}
                <div className="absolute inset-0 bg-[#5E17EB] opacity-10 blur-3xl rounded-full scale-150" />
                
                {/* Purple Box */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="relative w-28 h-28 md:w-36 md:h-36 bg-gradient-to-br from-[#6b48ff] to-[#501dee] rounded-[28px] md:rounded-[36px] shadow-[0_20px_40px_rgba(94,23,235,0.25)] flex items-center justify-center z-10"
                >
                    <Search size={52} className="text-white" strokeWidth={3} />
                    
                    {/* Top Right Yellow Sparkle */}
                    <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4 z-20">
                        <Sparkles size={32} className="text-[#FFC107] fill-[#FFC107] rotate-12" />
                    </div>
                    {/* Bottom Left Blue Sparkle */}
                    <div className="absolute -bottom-2 -left-2 md:-bottom-3 md:-left-3 z-20">
                        <Sparkles size={24} className="text-[#E0E7FF] fill-[#E0E7FF] -rotate-12" />
                    </div>
                </motion.div>
            </div>

            {/* Pill */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#F0EDFF] rounded-full px-4 py-1.5 flex items-center gap-2 mb-4 border border-[#EBE5FF]"
            >
                <Bell size={12} className="text-[#5E17EB]" strokeWidth={3} />
                <span className="text-[10px] font-black text-[#5E17EB] tracking-[0.1em] uppercase">STAY TUNED</span>
            </motion.div>

            {/* Headings */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-4"
            >
                <h2 className="text-[28px] md:text-[32px] font-black tracking-tighter leading-none flex gap-[6px] justify-center">
                    <span className="text-[#1A1A1A]">NO ITEMS</span>
                    <span className="text-[#5E17EB]">FOUND</span>
                </h2>
            </motion.div>

            {/* Description */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-[#64748B] font-bold text-[13px] md:text-[14px] leading-relaxed max-w-[260px] md:max-w-[300px] mx-auto mb-8"
            >
                We couldn't find anything for "{query}". Try different keywords or browse our categories.
            </motion.p>

            {/* Action Cards */}
            <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.4 }}
                 className="w-full max-w-[280px] flex flex-col gap-3 mx-auto"
            >
                {/* Card 1 */}
                <button onClick={() => navigateToCategory(navigate, 'all')} className="bg-white border border-[#F1F3F5] rounded-2xl p-4 flex items-center gap-4 hover:border-[#E2E8F0] active:scale-[0.98] transition-all text-left shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="w-10 h-10 bg-[#F9FAFB] rounded-[12px] flex items-center justify-center flex-shrink-0 border border-[#F1F5F9]">
                         <LayoutGrid size={18} className="text-[#5E17EB]" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-[#1A1A1A] font-black text-[12px] tracking-tight">Browse Categories</h4>
                        <p className="text-[#888] font-bold text-[10px] mt-0.5 select-none">Explore all our products.</p>
                    </div>
                    <div className="text-[#CBD5E1]">
                        <ChevronRight size={16} strokeWidth={3} />
                    </div>
                </button>
            </motion.div>
        </div>
    );
};

const SearchPage = () => {
    const navigate = useNavigate();
    const location = useRouterLocation();
    const { isOpen: isProductDetailOpen } = useProductDetail();
    const { settings } = useSettings();
    const { currentLocation } = useAppLocation();
    const appName = settings?.appName || 'App';

    // Get initial query from URL state or params
    const initialQuery = location.state?.query || new URLSearchParams(location.search).get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

    // Manage Recent Searches with LocalStorage
    const [pastSearches, setPastSearches] = useState(() => {
        const saved = localStorage.getItem('appzeto_recent_searches');
        return saved ? JSON.parse(saved) : [];
    });

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Debounce Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 400); 
        return () => clearTimeout(timer);
    }, [query]);

    // Voice Search Logic (Enhanced)
    const handleVoiceSearch = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice search is not supported in your browser. Please try Chrome.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN'; 
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
            setIsListening(true);
            setQuery(''); // Clear previous search if starting fresh
        };
        
        recognition.onend = () => setIsListening(false);
        
        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }

            if (transcript) {
                setQuery(transcript);
                // Save to history only if it's the final result
                if (event.results[event.results.length - 1].isFinal) {
                    saveSearch(transcript);
                }
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                alert('Microphone access denied. Please enable it in your browser settings.');
            } else {
                console.warn('Voice recognition stopped due to error:', event.error);
            }
        };

        try {
            recognition.start();
        } catch (e) {
            console.error('Recognition start error:', e);
            setIsListening(false);
        }
    };

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            const hasValidLocation =
                Number.isFinite(currentLocation?.latitude) &&
                Number.isFinite(currentLocation?.longitude);
            if (!hasValidLocation) {
                setAllProducts([]);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const response = await customerApi.getProducts({
                    limit: 100,
                    lat: currentLocation.latitude,
                    lng: currentLocation.longitude,
                });
                if (response.data.success) {
                    const rawResult = response.data.result;
                    const dbProds = Array.isArray(response.data.results)
                        ? response.data.results
                        : Array.isArray(rawResult?.items)
                        ? rawResult.items
                        : Array.isArray(rawResult)
                        ? rawResult
                        : [];
                    const formattedProds = dbProds.map(p => ({
                        ...p,
                        id: p._id,
                        image: p.mainImage || p.image || 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2',
                        price: p.salePrice || p.price,
                        originalPrice: p.price,
                        weight: p.weight || '1 unit',
                        deliveryTime: '8-15 mins'
                    }));
                    setAllProducts(formattedProds);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [currentLocation?.latitude, currentLocation?.longitude]);

    // Save search term to history
    const saveSearch = (term) => {
        if (!term.trim()) return;
        const updated = [term, ...pastSearches.filter(s => s !== term)].slice(0, 10);
        setPastSearches(updated);
        localStorage.setItem('appzeto_recent_searches', JSON.stringify(updated));
    };

    // Remove specific search term
    const handleRemoveSearch = (e, term) => {
        e.stopPropagation();
        const updated = pastSearches.filter(s => s !== term);
        setPastSearches(updated);
        localStorage.setItem('appzeto_recent_searches', JSON.stringify(updated));
    };

    // Trigger save on Enter or clicking a result
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && query.trim()) {
            saveSearch(query);
        }
    };

    // Real-time filtering logic
    const filteredResults = useMemo(() => {
        if (!debouncedQuery.trim()) return [];
        return allProducts.filter(p =>
            p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            p.categoryId?.name?.toLowerCase().includes(debouncedQuery.toLowerCase())
        );
    }, [debouncedQuery, allProducts]);

    useEffect(() => {
        setResults(filteredResults);
    }, [filteredResults]);

    // Lowest Price Section
    const lowestPriceProducts = useMemo(() => {
        return [...allProducts]
            .sort((a, b) => a.price - b.price)
            .slice(0, 10);
    }, [allProducts]);

    const handleClear = () => {
        setQuery('');
        setResults([]);
    };

    return (
        <div className="min-h-screen bg-white font-outfit">
            {/* Header / Search Input */}
            <div className={cn(
                "sticky top-0 z-50 bg-linear-to-r from-[#45B0E2] to-[#38bdf8] shadow-[0_4px_20px_rgba(0,0,0,0.12)] relative overflow-hidden",
                isProductDetailOpen && "hidden md:block"
            )}>
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-xl pointer-events-none" />

                <div className="px-4 pt-5 pb-6 flex items-center md:justify-center gap-3 relative z-10">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center justify-center w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md border border-white/10 transition-all flex-shrink-0 shadow-sm active:scale-90"
                        >
                            <ArrowLeft size={22} strokeWidth={2.5} />
                        </button>

                        <div className="flex-1 relative md:flex-none md:w-[500px] lg:w-[600px]">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                <Search size={18} strokeWidth={3} className="text-slate-400" />
                            </div>
                            <input
                                autoFocus
                                type="text"
                                placeholder='Search items, categories...'
                                value={query}
                                onKeyDown={handleKeyDown}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full h-12 bg-white rounded-2xl pl-11 pr-14 shadow-xl shadow-black/10 border-none outline-none text-slate-800 font-bold placeholder:text-slate-400 placeholder:font-medium focus:ring-4 focus:ring-white/20 transition-all"
                            />
                            
                            {/* Integrated Actions inside Search Input */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1">
                                {query && (
                                    <button
                                        onClick={handleClear}
                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                                    >
                                        <X size={12} strokeWidth={3} className="text-slate-600" />
                                    </button>
                                )}
                                <div className="w-[1px] h-6 bg-slate-100 mx-1" />
                                <button 
                                    onClick={handleVoiceSearch}
                                    className={cn(
                                        "p-2 transition-all rounded-full relative",
                                        isListening ? "text-red-500 bg-red-50 scale-110" : "text-slate-400 hover:text-[#45B0E2] hover:bg-slate-50"
                                    )}
                                >
                                    <Mic size={20} strokeWidth={2.5} className={cn(isListening && "animate-pulse")} />
                                    {isListening && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-10 pb-24">
                {/* Search Results List */}
                {query ? (
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                Search Results
                            </h2>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{results.length} found</span>
                        </div>

                        {results.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 md:gap-x-4 gap-y-6 md:gap-y-10">
                                {results.map((product) => (
                                    <div key={product.id} onClick={() => saveSearch(query)} className="flex justify-center">
                                        <ProductCard product={product} compact={isMobile} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptySearchView query={query} />
                        )}
                    </section>
                ) : (
                    <>
                        {/* 1. Recently Searched Item Section */}
                        {pastSearches.length > 0 && (
                            <section>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Recently Searched</h3>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                    {pastSearches.map((term) => (
                                        <div
                                            key={term}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 shadow-sm rounded-full whitespace-nowrap active:scale-95 transition-transform cursor-pointer"
                                            onClick={() => setQuery(term)}
                                        >
                                            <div className="h-5 w-5 rounded flex items-center justify-center" style={{ backgroundColor: (settings?.primaryColor || 'var(--primary)') + '20' }}>
                                                <History size={12} style={{ color: settings?.primaryColor || 'var(--primary)' }} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{term}</span>
                                            <button
                                                onClick={(e) => handleRemoveSearch(e, term)}
                                                className="ml-1 p-0.5 hover:bg-slate-100 rounded-full transition-colors"
                                            >
                                                <X size={12} className="text-slate-400 hover:text-red-500" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 2. Lowest Price Ever Section */}
                        <section>
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">Lowest Price Ever!</h2>
                                <button 
                                    className="flex items-center gap-1 md:gap-1.5 px-3 py-1 md:px-4 md:py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-xs md:text-sm font-black transition-all" 
                                    style={{ color: settings?.primaryColor || 'var(--primary)' }}
                                    onClick={() => navigateToCategory(navigate, 'all')}
                                >
                                    See All <ChevronRight size={14} strokeWidth={3} />
                                </button>
                            </div>
                            <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 pb-4 snap-x">
                                {isLoading && allProducts.length === 0 ? (
                                    [...Array(4)].map((_, i) => (
                                        <div key={i} className="min-w-[130px] md:min-w-[170px] h-52 md:h-64 bg-slate-50 rounded-2xl animate-pulse" />
                                    ))
                                ) : lowestPriceProducts.map((product) => (
                                    <div key={product.id} className="min-w-[130px] md:min-w-[180px] snap-start">
                                        <ProductCard product={product} compact={isMobile} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
