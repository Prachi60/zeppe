import React from 'react';
import { ChevronLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@core/context/SettingsContext';

const PrivacyPage = () => {
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
                <h1 className="text-lg font-black text-slate-800">Privacy Policy</h1>
            </div>

            <div className="p-5 max-w-3xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-12 w-12 rounded-2xl bg-brand-50 flex items-center justify-center text-[#45B0E2]">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Privacy Policy</h2>
                            <p className="text-xs text-slate-500 font-medium">Last updated: Oct 2025</p>
                        </div>
                    </div>

                    <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-6 leading-relaxed">
                        <div className="space-y-3">
                            <h3 className="text-slate-800 font-bold text-lg">Introduction</h3>
                            <p>
                                This Privacy Policy describes how Zeppe and its affiliates (collectively "Zeppe, we, our, us") collect, use, share, protect or otherwise process your information/ personal data through our website <span className="font-bold text-slate-800">https://zeppe.in/</span> (hereinafter referred to as Platform).
                            </p>
                            <p>
                                Please note that you may be able to browse certain sections of the Platform without registering with us. We do not offer any product/service under this Platform outside India and your personal data will primarily be stored and processed in India. By visiting this Platform, providing your information or availing any product/service offered on the Platform, you expressly agree to be bound by the terms and conditions of this Privacy Policy, the Terms of Use and the applicable service/product terms and conditions, and agree to be governed by the laws of India including but not limited to the laws applicable to data protection and privacy. If you do not agree please do not use or access our Platform.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-slate-800 font-bold text-lg">Collection</h3>
                            <p>
                                We collect your personal data when you use our Platform, services or otherwise interact with us during the course of our relationship and related information provided from time to time. Some of the information that we may collect includes but is not limited to personal data / information provided to us during sign-up/registering or using our Platform such as name, date of birth, address, telephone/mobile number, email ID and/or any such information shared as proof of identity or address.
                            </p>
                            <p>
                                Some of the sensitive personal data may be collected with your consent, such as your bank account or credit or debit card or other payment instrument information or biometric information such as your facial features or physiological information (in order to enable use of certain features when opted for, available on the Platform) etc all of the above being in accordance with applicable law(s).
                            </p>
                            <p>
                                You always have the option to not provide information, by choosing not to use a particular service or feature on the Platform. We may track your behaviour, preferences, and other information that you choose to provide on our Platform. This information is compiled and analysed on an aggregated basis. We will also collect your information related to your transactions on Platform and such third-party business partner platforms.
                            </p>
                            <p className="bg-slate-50 p-4 rounded-2xl border-l-4 border-amber-400 text-xs">
                                <span className="font-bold text-slate-800 block mb-1 uppercase">Warning</span>
                                If you receive an email, a call from a person/association claiming to be Zeppe seeking any personal data like debit/credit card PIN, net-banking or mobile banking password, we request you to never provide such information. If you have already revealed such information, report it immediately to an appropriate law enforcement agency.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-slate-800 font-bold text-lg">Usage</h3>
                            <p>
                                We use personal data to provide the services you request. To the extent we use your personal data to market to you, we will provide you the ability to opt-out of such uses. We use your personal data to assist sellers and business partners in handling and fulfilling orders; enhancing customer experience; to resolve disputes; troubleshoot problems; inform you about online and offline offers, products, services, and updates; customise your experience; detect and protect us against error, fraud and other criminal activity; enforce our terms and conditions; conduct marketing research, analysis and surveys; and as otherwise described to you at the time of collection of information.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-slate-800 font-bold text-lg">Sharing</h3>
                            <p>
                                We may share your personal data internally within our group entities, our other corporate entities, and affiliates to provide you access to the services and products offered by them. These entities and affiliates may market to you as a result of such sharing unless you explicitly opt-out.
                            </p>
                            <p>
                                We may disclose personal data to third parties such as sellers, business partners, third party service providers including logistics partners, prepaid payment instrument issuers, third-party reward programs and other payment opted by you. These disclosure may be required for us to provide you access to our services and products offered to you, to comply with our legal obligations, to enforce our user agreement, to facilitate our marketing and advertising activities, to prevent, detect, mitigate, and investigate fraudulent or illegal activities related to our services.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-slate-800 font-bold text-lg">Security Precautions</h3>
                            <p>
                                To protect your personal data from unauthorised access or disclosure, loss or misuse we adopt reasonable security practices and procedures. Once your information is in our possession or whenever you access your account information, we adhere to our security guidelines to protect it against unauthorised access and offer the use of a secure server. However, the transmission of information is not completely secure for reasons beyond our control.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-slate-800 font-bold text-lg">Data Deletion and Retention</h3>
                            <p>
                                You have an option to delete your account by visiting your profile and settings on our Platform, this action would result in you losing all information related to your account. You may also write to us at the contact information provided below to assist you with these requests.
                            </p>
                            <p>
                                We retain your personal data information for a period no longer than is required for the purpose for which it was collected or as required under any applicable law. However, we may retain data related to you if we believe it may be necessary to prevent fraud or future abuse or for other legitimate purposes.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-slate-800 font-bold text-lg">Your Rights</h3>
                            <p>
                                You may access, rectify, and update your personal data directly through the functionalities provided on the Platform.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-slate-800 font-bold text-lg">Consent</h3>
                            <p>
                                By visiting our Platform or by providing your information, you consent to the collection, use, storage, disclosure and otherwise processing of your information on the Platform in accordance with this Privacy Policy.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-slate-800 font-bold text-lg">Changes to this Privacy Policy</h3>
                            <p>
                                Please check our Privacy Policy periodically for changes. We may update this Privacy Policy to reflect changes to our information practices. We may alert / notify you about the significant changes to the Privacy Policy, in the manner as may be required under applicable laws.
                            </p>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mt-10">
                            <h3 className="text-slate-800 font-bold text-lg mb-4">Grievance Officer</h3>
                            <div className="space-y-2 text-sm">
                                <p><span className="font-semibold text-slate-700">Name:</span> Anurag Kumar</p>
                                <p><span className="font-semibold text-slate-700">Designation:</span> CEO</p>
                                <p><span className="font-semibold text-slate-700">Company:</span> Zeppe</p>
                                <p><span className="font-semibold text-slate-700">Phone:</span> 6203858268</p>
                                <p><span className="font-semibold text-slate-700">Time:</span> Monday - Friday (9:00 - 18:00)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;

