import React from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@core/context/SettingsContext';

const RefundPolicyPage = () => {
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
                <h1 className="text-lg font-black text-slate-800">Refund Policy</h1>
            </div>

            <div className="p-5 max-w-3xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-12 w-12 rounded-2xl bg-brand-50 flex items-center justify-center text-[#45B0E2]">
                            <RotateCcw size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Refunds & Returns</h2>
                            <p className="text-xs text-slate-500 font-medium">Last updated: April 2026</p>
                        </div>
                    </div>

                    <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-6 leading-relaxed">
                        <p>
                            This refund and cancellation policy outlines how you can cancel or seek a refund for a product / service that you have purchased through the Platform.
                        </p>

                        <div className="space-y-4">
                            <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#45B0E2]">
                                    <span className="font-bold">01</span>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-slate-800 font-bold text-base m-0">Cancellations</h3>
                                    <p className="m-0">
                                        Cancellations will only be considered if the request is made <span className="font-bold text-slate-800">1 day</span> of placing the order. However, cancellation requests may not be entertained if the orders have been communicated to such sellers / merchant(s) listed on the Platform and they have initiated the process of shipping them, or the product is out for delivery. In such an event, you may choose to reject the product at the doorstep.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-white shadow-sm flex items-center justify-center text-rose-500">
                                    <span className="font-bold">02</span>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-slate-800 font-bold text-base m-0">Perishable Items</h3>
                                    <p className="m-0">
                                        Zeppe does not accept cancellation requests for perishable items like flowers, eatables, etc. However, the refund / replacement can be made if the user establishes that the quality of the product delivered is not good.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-white shadow-sm flex items-center justify-center text-amber-500">
                                    <span className="font-bold">03</span>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-slate-800 font-bold text-base m-0">Damaged or Defective Items</h3>
                                    <p className="m-0">
                                        In case of receipt of damaged or defective items, please report to our customer service team. The request would be entertained once the seller/ merchant listed on the Platform, has checked and determined the same at its own end. This should be reported within <span className="font-bold text-slate-800">1 day</span> of receipt of products.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-500">
                                    <span className="font-bold">04</span>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-slate-800 font-bold text-base m-0">Expectations Mismatch</h3>
                                    <p className="m-0">
                                        In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within <span className="font-bold text-slate-800">1 day</span> of receiving the product. The customer service team after looking into your complaint will take an appropriate decision.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-500">
                                    <span className="font-bold">05</span>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-slate-800 font-bold text-base m-0">Manufacturer Warranty</h3>
                                    <p className="m-0">
                                        In case of complaints regarding the products that come with a warranty from the manufacturers, please refer the issue to them.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-2xl bg-[#45B0E2]/5 border border-[#45B0E2]/10">
                                <div className="h-10 w-10 shrink-0 rounded-xl bg-[#45B0E2] shadow-sm flex items-center justify-center text-white">
                                    <span className="font-bold">06</span>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-[#45B0E2] font-bold text-base m-0">Refund Processing</h3>
                                    <p className="m-0 text-slate-700">
                                        In case of any refunds approved by Zeppe, it will take <span className="font-bold">7 days</span> for the refund to be processed to you.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicyPage;
