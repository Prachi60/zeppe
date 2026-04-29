import React from 'react';
import { ChevronLeft, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@core/context/SettingsContext';

const ShippingPolicyPage = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const appName = settings?.appName || 'Zeppe';

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

                    <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4">
                        <p>
                            At {appName}, we are committed to delivering your orders as quickly and efficiently as possible. Learn more about our shipping procedures below.
                        </p>

                        <h3 className="text-slate-800 font-bold text-base mt-6">1. Delivery Timelines</h3>
                        <p>
                            We offer instant delivery for most items:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Standard Delivery:</strong> 15-30 minutes depending on your location and distance from the store.</li>
                            <li><strong>Scheduled Delivery:</strong> You can choose a convenient time slot during checkout.</li>
                        </ul>

                        <h3 className="text-slate-800 font-bold text-base mt-6">2. Shipping & Delivery Charges</h3>
                        <p>
                            Delivery fees are calculated based on distance and order value:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Free delivery on orders above ₹499.</li>
                            <li>A nominal delivery fee applies to smaller orders (calculated at checkout).</li>
                            <li>Surge pricing may apply during peak hours or heavy rain.</li>
                        </ul>

                        <h3 className="text-slate-800 font-bold text-base mt-6">3. Real-Time Tracking</h3>
                        <p>
                            Once your order is placed, you can track the delivery partner's location in real-time from the "Live Tracking" screen in the app.
                        </p>

                        <h3 className="text-slate-800 font-bold text-base mt-6">4. Delivery Areas</h3>
                        <p>
                            We currently operate in selected cities and pin codes. If we do not service your area yet, you will be notified when entering your address.
                        </p>

                        <h3 className="text-slate-800 font-bold text-base mt-6">5. Contactless Delivery</h3>
                        <p>
                            For your safety, you can opt for contactless delivery. Instruct the partner via the "Delivery Instructions" block on the checkout screen.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShippingPolicyPage;
