import React from 'react';
import { ChevronLeft, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@core/context/SettingsContext';

const ShippingPolicyPage = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-10">
            {/* Header */}
            <div className="bg-white sticky top-0 z-30 px-4 py-3 flex items-center gap-1 shadow-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                    <ChevronLeft size={24} className="text-slate-600" />
                </button>
                <h1 className="text-lg font-black text-slate-800">Shipping Policy</h1>
            </div>

            <div className="p-5 max-w-3xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-12 w-12 rounded-2xl bg-brand-50 flex items-center justify-center text-[#45B0E2]">
                            <Truck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Shipping & Delivery</h2>
                            <p className="text-xs text-slate-500 font-medium">Last updated: April 2026</p>
                        </div>
                    </div>

                    <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-6 leading-relaxed">
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
                            <p className="m-0">
                                The orders for the user are shipped through registered domestic courier companies and/or speed post only.
                            </p>
                            
                            <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-50">
                                <div className="h-10 w-10 shrink-0 rounded-lg bg-brand-50 flex items-center justify-center text-[#45B0E2]">
                                    <Truck size={20} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-slate-800 m-0">Shipping Timeline</h4>
                                    <p className="m-0 text-xs">
                                        Orders are shipped within <span className="font-bold text-[#45B0E2]">1 day</span> from the date of the order and/or payment or as per the delivery date agreed at the time of order confirmation.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 px-2">
                            <div className="space-y-2">
                                <h3 className="text-slate-800 font-bold text-base m-0">Delivery Terms</h3>
                                <p>
                                    Delivery of the shipment is subject to courier company / post office norms. <span className="font-semibold text-slate-700">Platform Owner shall not be liable for any delay in delivery</span> by the courier company / postal authority.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-slate-800 font-bold text-base m-0">Address & Confirmation</h3>
                                <p>
                                    Delivery of all orders will be made to the address provided by the buyer at the time of purchase. Delivery of our services will be confirmed on your email ID as specified at the time of registration.
                                </p>
                            </div>

                            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-xs">
                                <p className="m-0 text-amber-800">
                                    <span className="font-bold uppercase tracking-wider block mb-1">Non-Refundable Costs</span>
                                    If there are any shipping cost(s) levied by the seller or the Platform Owner (as the case be), the same is not refundable.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShippingPolicyPage;
