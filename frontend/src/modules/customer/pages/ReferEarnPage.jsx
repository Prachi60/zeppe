import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    ChevronLeft, 
    Gift, 
    Sparkles, 
    Bell, 
    ChevronRight,
    Share2,
    Trophy,
    Stars
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ReferEarnPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            {/* Header */}
            <div className="px-4 py-4 flex items-center gap-3 border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors active:scale-90"
                >
                    <ChevronLeft size={24} className="text-slate-900 stroke-[2.5]" />
                </button>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Refer & Earn</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center text-center">
                {/* Hero Section */}
                <div className="relative mb-10 mt-4">
                    {/* Background Sparkles */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="absolute -top-6 -right-6 text-indigo-400"
                    >
                        <Sparkles size={32} />
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="absolute -bottom-4 -left-8 text-indigo-300"
                    >
                        <Stars size={48} fill="currentColor" className="opacity-40" />
                    </motion.div>

                    {/* Main Gift Box */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-44 h-44 rounded-[40px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-200 relative z-1"
                    >
                        <Gift size={80} className="text-white stroke-[1.5]" />
                    </motion.div>
                </div>

                {/* Stay Tuned Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-50 rounded-full mb-6 border border-indigo-100"
                >
                    <motion.div
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                        <Bell size={16} className="text-indigo-600 fill-indigo-600" />
                    </motion.div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Stay Tuned</span>
                </motion.div>

                {/* Main Heading */}
                <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-4xl font-black tracking-tight text-slate-900 mb-4"
                >
                    COMING <span className="text-indigo-600">SOON</span>
                </motion.h2>

                {/* Description */}
                <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-slate-500 font-medium leading-relaxed max-w-[280px] mb-12"
                >
                    Our rewarding referral program is almost ready. Prepare to share the love and earn exclusive perks!
                </motion.p>

                {/* Features List */}
                <div className="w-full space-y-4 max-w-sm">
                    <FeatureItem 
                        delay={0.7}
                        icon={Gift}
                        iconColor="text-indigo-600"
                        iconBg="bg-indigo-50"
                        title="Invite Friends"
                        description="Share your unique code with others."
                    />
                    <FeatureItem 
                        delay={0.8}
                        icon={Trophy}
                        iconColor="text-emerald-600"
                        iconBg="bg-emerald-50"
                        title="Earn Rewards"
                        description="Get points and money for every referral."
                    />
                </div>
            </div>

            {/* Bottom Contact (Optional) */}
            <div className="p-6 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Powered by Zeppe Rewards</p>
            </div>
        </div>
    );
};

const FeatureItem = ({ icon: Icon, title, description, iconColor, iconBg, delay }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay }}
        className="flex items-center gap-4 p-5 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer"
    >
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0", iconBg)}>
            <Icon size={24} className={iconColor} strokeWidth={2} />
        </div>
        <div className="flex-1 text-left">
            <h4 className="text-sm font-black text-slate-900">{title}</h4>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{description}</p>
        </div>
        <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
    </motion.div>
);

export default ReferEarnPage;
