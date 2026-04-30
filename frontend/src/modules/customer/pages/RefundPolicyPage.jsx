import React from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@core/context/SettingsContext';

const RefundPolicyPage = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const appName = settings?.appName || 'Zeppe';
    const companyName = settings?.companyName || appName;

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

                    <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4">
                        <p>
                            At Zeppe, we strive to ensure your satisfaction with every order. If you are not entirely satisfied with your purchase, we are here to help.
                        </p>

                        <h3 className="text-slate-800 font-bold text-base mt-6">1. Eligibility for Refunds</h3>
                        <p>
                            You may be eligible for a refund or replacement if:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>The items received are damaged or defective.</li>
                            <li>The items received do not match your order.</li>
                            <li>Items are missing from your delivery.</li>
                        </ul>
                        <p>
                            Issues must be reported within 24 hours of delivery.
                        </p>

                        <h3 className="text-slate-800 font-bold text-base mt-6">2. Return Process</h3>
                        <p>
                            To initiate a return, please go to your Orders page, select the relevant order, and click on "Return & Refund". You will be asked to provide details and photos of the items.
                        </p>

                        <h3 className="text-slate-800 font-bold text-base mt-6">3. Refund Timeline</h3>
                        <p>
                            Once your return is approved, refunds are processed immediately.
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Online Payments:</strong> Refunded to your original payment method within 5-7 business days.</li>
                            <li><strong>Cash on Delivery:</strong> Refunded to your {appName} Wallet instantly.</li>
                        </ul>

                        <h3 className="text-slate-800 font-bold text-base mt-6">4. Cancellation Policy</h3>
                        <p>
                            Orders cannot be cancelled once they have been packed for delivery. If you need to cancel before packing, you can do so from the order tracking screen.
                        </p>

                        <h3 className="text-slate-800 font-bold text-base mt-6">5. Contact Us</h3>
                        <p>
                            If you have any questions about our Refund Policy, please visit our Support page or contact customer service.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicyPage;
