import React from 'react';
import { ChevronLeft, PackageCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@core/context/SettingsContext';

const ReturnPolicyPage = () => {
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
                <h1 className="text-lg font-black text-slate-800">Return Policy</h1>
            </div>

            <div className="p-5 max-w-3xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-12 w-12 rounded-2xl bg-brand-50 flex items-center justify-center text-[#45B0E2]">
                            <PackageCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Product Returns</h2>
                            <p className="text-xs text-slate-500 font-medium">Last updated: April 2026</p>
                        </div>
                    </div>

                    <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-4">
                        <p>
                            We want you to love what you ordered from {appName}. If something isn't right, our return policy is designed to make things easy for you.
                        </p>

                        <h3 className="text-slate-800 font-bold text-base mt-6">1. Return Guidelines</h3>
                        <p>
                            To be eligible for a return, your item must be:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>In the same condition that you received it.</li>
                            <li>Unused, unopened, and in its original packaging.</li>
                            <li>Accompanied by the receipt or proof of purchase.</li>
                        </ul>

                        <h3 className="text-slate-800 font-bold text-base mt-6">2. Non-Returnable Items</h3>
                        <p>
                            Certain types of items cannot be returned due to hygiene and safety reasons:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Perishable goods (e.g., fresh food, dairy, vegetables).</li>
                            <li>Personal care items (e.g., cosmetics, grooming products).</li>
                            <li>Items marked as "Non-Returnable" on the product page.</li>
                        </ul>

                        <h3 className="text-slate-800 font-bold text-base mt-6">3. How to Initiate a Return</h3>
                        <p>
                            1. Go to your <strong>Orders</strong> tab.<br />
                            2. Select the order containing the item you wish to return.<br />
                            3. Click on <strong>Return & Refund</strong>.<br />
                            4. Follow the on-screen instructions to upload photos and select a reason.
                        </p>

                        <h3 className="text-slate-800 font-bold text-base mt-6">4. Quality Check (QC)</h3>
                        <p>
                            Once our delivery partner picks up the item, it will undergo a quality check.
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>QC Passed:</strong> Your refund will be processed immediately.</li>
                            <li><strong>QC Failed:</strong> The item will be returned to you, and no refund will be issued.</li>
                        </ul>

                        <h3 className="text-slate-800 font-bold text-base mt-6">5. Exchanges</h3>
                        <p>
                            We only replace items if they are defective or damaged. If you need to exchange an item for the same product, please contact support.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnPolicyPage;
