import React from 'react';
import { X, MessageCircle, Phone, ChevronRight, AlertCircle, PackageX, Truck, PlusCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const HelpModal = ({ isOpen, onClose, order }) => {
    const navigate = useNavigate();

    const issues = [
        { 
            icon: PackageX, 
            label: 'Items missing or incorrect', 
            sub: 'Get a refund or replacement',
            onClick: () => navigate('/support', { 
                state: { 
                    subject: `Items missing/incorrect: Order #${order?.orderId}`,
                    description: `Order ID: ${order?.orderId}\nItems: ${order?.items?.map(i => i.name).join(', ')}\n\nPlease describe the issue...`,
                    autoOpen: true
                } 
            })
        },
        { 
            icon: AlertCircle, 
            label: 'Item quality issue', 
            sub: 'Report damaged or expired items',
            onClick: () => navigate('/support', { 
                state: { 
                    subject: `Quality Issue: Order #${order?.orderId}`,
                    description: `Order ID: ${order?.orderId}\nItems: ${order?.items?.map(i => i.name).join(', ')}\n\nPlease describe the quality issue...`,
                    autoOpen: true
                } 
            })
        },
        { 
            icon: Truck, 
            label: 'Delivery delay', 
            sub: 'Track your order status',
            onClick: () => {
                onClose();
                // If it's on OrderDetailPage, it will just scroll to top or tracking map
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },
    ];

    const handleCall = () => {
        window.location.href = "tel:+916203858268";
    };

    const handleRaiseTicket = () => {
        navigate('/support', { 
            state: { 
                subject: `Support Request: Order #${order?.orderId}`,
                description: `Order ID: ${order?.orderId}\n`,
                autoOpen: true
            } 
        });
    };

    const handleChat = () => {
        navigate('/chat', { 
            state: { 
                orderId: order?.orderId,
                initialMessage: `Hi, I need help with my order #${order?.orderId}`
            } 
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-t-[2rem] sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                        >

                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800">Need Help?</h2>
                                        <p className="text-sm text-slate-500 font-medium">Select an issue with your order</p>
                                    </div>
                                    <button onClick={onClose} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                                        <X size={20} className="text-slate-500" />
                                    </button>
                                </div>

                                <div className="space-y-3 mb-8">
                                    {issues.map((item, idx) => (
                                        <button 
                                            key={idx} 
                                            onClick={item.onClick}
                                            className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/50 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:text-[#45B0E2] transition-colors">
                                                    <item.icon size={20} />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#45B0E2] transition-colors">{item.label}</h3>
                                                    <p className="text-xs text-slate-400 font-medium">{item.sub}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-slate-300 group-hover:text-[#45B0E2] transition-colors" />
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={handleRaiseTicket}
                                        className="col-span-2 py-3.5 rounded-xl border-2 border-[#45B0E2] text-[#45B0E2] font-bold flex items-center justify-center gap-2 hover:bg-brand-50 transition-colors shadow-lg shadow-brand-50"
                                    >
                                        <PlusCircle size={18} /> Raise a Ticket
                                    </button>
                                    <button 
                                        onClick={handleChat}
                                        className="py-3.5 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                                    >
                                        <MessageCircle size={18} /> Chat Us
                                    </button>
                                    <button 
                                        onClick={handleCall}
                                        className="py-3.5 rounded-xl border border-slate-200 text-slate-700 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                                    >
                                        <Phone size={18} /> Call Us
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default HelpModal;

