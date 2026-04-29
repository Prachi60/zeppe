import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Gift, Trophy, Clock, Info, AlertCircle } from 'lucide-react';
import { customerApi } from '../services/customerApi';
import ScratchCard from '@shared/components/ui/ScratchCard';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const MyScratchCards = () => {
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState(null);

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            setIsLoading(true);
            const res = await customerApi.getMyScratchCards();
            if (res.data.success) {
                setCards(res.data.result || []);
            }
        } catch (error) {
            toast.error("Failed to load scratch cards");
        } finally {
            setIsLoading(false);
        }
    };

    const handleScratchComplete = async (cardId) => {
        try {
            const res = await customerApi.scratchCard(cardId);
            if (res.data.success) {
                const updatedCard = res.data.result;
                if (updatedCard.isWinner) {
                    toast.success(`You won ₹${updatedCard.rewardValue}!`, {
                        description: "Reward credited to your wallet."
                    });
                } else {
                    toast.info("Better luck next time!");
                }
                // Refresh cards after a short delay
                setTimeout(fetchCards, 2000);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to process scratch card");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans">
            <div className="bg-white px-4 pt-6 pb-4 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
                >
                    <ChevronLeft size={24} className="text-slate-900 stroke-[2.5]" />
                </button>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">My Scratch Cards</h1>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-bold text-slate-400">Loading your rewards...</p>
                    </div>
                ) : cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-6">
                            <Gift size={40} className="text-slate-200" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900">No Scratch Cards</h2>
                        <p className="text-sm font-bold text-slate-400 mt-2">
                            Place more orders to earn exciting scratch cards and rewards!
                        </p>
                        <button 
                            onClick={() => navigate('/')}
                            className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all"
                        >
                            Shop Now
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {cards.map((card) => (
                            <motion.div 
                                key={card._id}
                                layout
                                className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 group active:scale-[0.98] transition-all cursor-pointer"
                                onClick={() => card.status === 'unused' && setSelectedCard(card)}
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                                    card.status === 'unused' ? 'bg-indigo-50 text-indigo-600' : 
                                    card.status === 'scratched' || card.status === 'claimed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                                }`}>
                                    {card.status === 'unused' ? <Gift size={32} /> : <Trophy size={32} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-black text-slate-900 tracking-tight truncate">{card.campaign?.title}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                            <Clock size={12} />
                                            <span>Expires: {new Date(card.expiresAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                                            card.status === 'unused' ? 'bg-indigo-100 text-indigo-700' : 
                                            card.status === 'scratched' || card.status === 'claimed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                                        }`}>
                                            {card.status === 'unused' ? 'Scratch Now' : card.status === 'claimed' ? `Won ₹${card.rewardValue}` : card.status}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Scratch Modal */}
            <AnimatePresence>
                {selectedCard && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-sm"
                        >
                            <div className="flex justify-end mb-4">
                                <button 
                                    onClick={() => setSelectedCard(null)}
                                    className="w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                            </div>

                            <div className="bg-white rounded-[40px] p-8 text-center shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
                                
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{selectedCard.campaign?.title}</h2>
                                <p className="text-sm font-bold text-slate-400 mb-8">{selectedCard.campaign?.description}</p>

                                <div className="flex justify-center mb-8">
                                    <ScratchCard
                                        width={280}
                                        height={160}
                                        onComplete={() => handleScratchComplete(selectedCard._id)}
                                    >
                                        <div className="text-center p-6">
                                            {selectedCard.isWinner ? (
                                                <div className="animate-bounce">
                                                    <Trophy size={48} className="text-amber-500 mx-auto mb-2" />
                                                    <p className="text-3xl font-black text-slate-900">WINNER!</p>
                                                    <p className="text-sm font-bold text-slate-400">Revealing your reward...</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <AlertCircle size={48} className="text-slate-300 mx-auto mb-2" />
                                                    <p className="text-xl font-black text-slate-400 uppercase tracking-widest">Better luck next time</p>
                                                </div>
                                            )}
                                        </div>
                                    </ScratchCard>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">
                                    <Info size={14} />
                                    <span>Terms & Conditions Apply</span>
                                </div>
                                <p className="text-[9px] text-slate-300 line-clamp-1">{selectedCard.campaign?.termsAndConditions}</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyScratchCards;
