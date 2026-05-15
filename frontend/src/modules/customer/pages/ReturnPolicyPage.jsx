import React from 'react';
import { ChevronLeft, PackageCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@core/context/SettingsContext';

const ReturnPolicyPage = () => {
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
                            <p className="text-xs text-slate-500 font-medium">Last updated: May 2026</p>
                        </div>
                    </div>

                    <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-6 leading-relaxed">
                        <div className="bg-[#45B0E2]/5 border border-[#45B0E2]/10 rounded-2xl p-5 mb-8">
                            <p className="m-0 text-slate-700 font-medium italic">
                                "We offer refund / exchange within first <span className="text-[#45B0E2] font-bold">7 days</span> from the date of your purchase. If 7 days have passed since your purchase, you will not be offered a return, exchange or refund of any kind."
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-slate-800 font-bold text-lg">Eligibility for Return or Exchange</h3>
                                <p>In order to become eligible for a return or an exchange:</p>
                                <ul className="space-y-3 list-none pl-0">
                                    <li className="flex gap-3 items-start">
                                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold shrink-0">I</div>
                                        <span>The purchased item should be <span className="font-semibold text-slate-800">unused</span> and in the same condition as you received it.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold shrink-0">II</div>
                                        <span>The item must have <span className="font-semibold text-slate-800">original packaging</span>.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold shrink-0">III</div>
                                        <span>If the item was purchased on a <span className="font-semibold text-slate-800">sale</span>, it may not be eligible for a return / exchange.</span>
                                    </li>
                                </ul>
                                <p className="pt-2 text-xs text-slate-500 border-t border-slate-100 mt-4">
                                    <span className="font-bold">Note:</span> Only such items are replaced by us (based on an exchange request), if such items are found defective or damaged.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-slate-800 font-bold text-lg">Exempted Categories</h3>
                                <p>
                                    You agree that there may be a certain category of products / items that are exempted from returns or refunds. Such categories of the products would be identified to you at the item of purchase.
                                </p>
                            </div>

                            <div className="space-y-3 border-l-4 border-slate-200 pl-4 py-2">
                                <h3 className="text-slate-800 font-bold text-lg">Processing of Requests</h3>
                                <p>
                                    For exchange / return accepted request(s) (as applicable), once your returned product / item is received and inspected by us, we will send you an email to notify you about receipt of the returned / exchanged product.
                                </p>
                                <p>
                                    If the same has been approved after the quality check at our end, your request (i.e. return / exchange) will be processed in accordance with our policies.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnPolicyPage;
