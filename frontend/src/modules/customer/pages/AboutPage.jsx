import React, { useState, useRef } from 'react';
import { ChevronLeft, Truck, Clock, MapPin, Package, Users, Zap, CheckCircle2, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@core/context/SettingsContext';

const AboutPage = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const appName = settings?.appName || 'Zeppe'
    const [openFaq, setOpenFaq] = useState(null);
    const howItWorksRef = useRef(null);

    const scrollToHowItWorks = () => {
        howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const faqs = [
        {
            q: "Which is the best 10 minute delivery app in Pupri?",
            a: "Zeppe is a hyperlocal 10 minute grocery delivery app in Pupri that focuses exclusively on fast and reliable local delivery."
        },
        {
            q: "How does Zeppe deliver groceries in 10 minutes?",
            a: "Zeppe uses nearby dark stores, trained pick-pack staff, and dedicated delivery partners to ensure fast delivery."
        },
        {
            q: "What products can I order on Zeppe?",
            a: "You can order groceries, daily essentials, household items, and frequently used products."
        },
        {
            q: "Is Zeppe available across all areas in Pupri?",
            a: "Zeppe currently serves major areas in Pupri and is expanding rapidly."
        },
        {
            q: "Is Zeppe a local Pupri startup?",
            a: "Yes. Zeppe is a Pupri-focused hyperlocal quick commerce platform built to serve local customers."
        }
    ];
    return (
        <div className="min-h-screen bg-white font-sans pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white px-4 py-3 border-b flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} className="text-slate-900" />
                </button>
                <h1 className="text-xl font-bold text-slate-900">About Zeppe</h1>
            </div>

            <div className="max-w-2xl mx-auto">
                {/* Hero Section */}
                <div className="relative py-8 px-6 text-center bg-gradient-to-b from-blue-50/50 to-white overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center mb-6 relative">
                            <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center shadow-xl">
                                <Truck size={32} className="text-white" />
                            </div>
                        </div>
                        
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-4 leading-tight max-w-sm">
                            10 Minute Grocery Delivery in Pupri
                        </h2>
                        
                        <p className="text-slate-600 text-base mb-6 leading-relaxed max-w-md">
                            Zeppe is a hyperlocal 10 minute grocery delivery app in Pupri that delivers fresh groceries and daily essentials in just 10 minutes using nearby dark stores, optimized inventory, and trained pick-pack staff.
                        </p>

                        <div className="flex flex-wrap justify-center gap-2 mb-6 text-slate-900 font-bold text-sm">
                            <span>Pupri-focused</span>
                            <span>•</span>
                            <span>Hyperlocal</span>
                            <span>•</span>
                            <span>Lightning Fast</span>
                        </div>

                        <button 
                            onClick={scrollToHowItWorks}
                            className="flex items-center gap-1 text-slate-500 text-sm font-medium hover:text-slate-800 transition-colors"
                        >
                            Learn More <ChevronDown size={16} />
                        </button>
                    </div>
                </div>

                {/* Why Choose Zeppe? */}
                <div className="px-6 py-8 bg-slate-50/50">
                    <h3 className="text-2xl font-bold text-center text-slate-900 mb-6">Why Choose Zeppe?</h3>
                    
                    <div className="space-y-4">
                        {[
                            {
                                icon: <Clock className="text-blue-600" size={24} />,
                                title: "10 Minutes Delivery",
                                desc: "Lightning-fast delivery from nearby dark stores",
                                bgColor: "bg-blue-50"
                            },
                            {
                                icon: <MapPin className="text-green-600" size={24} />,
                                title: "Hyperlocal Focus",
                                desc: "Pupri-exclusive operations for better service",
                                bgColor: "bg-green-50"
                            },
                            {
                                icon: <Package className="text-orange-600" size={24} />,
                                title: "Fresh Groceries",
                                desc: "Quality-checked daily essentials and groceries",
                                bgColor: "bg-orange-50"
                            },
                            {
                                icon: <Users className="text-purple-600" size={24} />,
                                title: "Local Support",
                                desc: "Dedicated Pupri-based customer service team",
                                bgColor: "bg-purple-50"
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4">
                                <div className={`${item.bgColor} p-3 rounded-xl flex-shrink-0`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h4>
                                    <p className="text-slate-500 text-sm">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* How Zeppe Delivers */}
                <div ref={howItWorksRef} className="px-6 py-8 text-center scroll-mt-20">
                    <h3 className="text-2xl font-extrabold text-slate-900 mb-4 leading-tight">
                        How Zeppe Delivers in 10 Minutes
                    </h3>
                    <p className="text-slate-500 mb-8 max-w-xs mx-auto leading-relaxed">
                        Our hyperlocal quick commerce model makes 10 minute delivery possible
                    </p>

                    <div className="space-y-8">
                        {[
                            {
                                num: "1",
                                title: "Dark Stores Nearby",
                                desc: "Within 2-3 km of your location",
                                icon: <MapPin size={24} />
                            },
                            {
                                num: "2",
                                title: "Pre-sorted Inventory",
                                desc: "Daily essentials ready to pack",
                                icon: <Package size={24} />
                            },
                            {
                                num: "3",
                                title: "Trained Staff",
                                desc: "Quick pick & pack process",
                                icon: <Users size={24} />
                            },
                            {
                                num: "4",
                                title: "Fast Dispatch",
                                desc: "Dedicated delivery partners",
                                icon: <Zap size={24} />
                            }
                        ].map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                                <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold shadow-lg mb-4">
                                    {step.num}
                                </div>
                                <div className="mb-2 text-slate-900">
                                    {step.icon}
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 mb-1">{step.title}</h4>
                                <p className="text-slate-500 text-sm">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comparison Section */}
                <div className="px-6 py-8">
                    <h3 className="text-2xl font-bold text-center text-slate-900 mb-6">Zeppe vs Other Apps</h3>
                    
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="p-4 text-sm font-bold text-slate-900">Feature</th>
                                    <th className="p-4 text-sm font-bold text-slate-900">Zeppe</th>
                                    <th className="p-4 text-sm font-bold text-slate-500">Other Apps</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[
                                    { f: "Delivery Time", z: "10 Minutes", o: "10-20 Minutes", zClass: "text-green-600 font-bold" },
                                    { f: "Local Focus", z: "Pupri Only", o: "Multi-city", zClass: "text-slate-900 font-bold" },
                                    { f: "Dark Stores", z: "Hyperlocal", o: "Centralized", zClass: "text-slate-900 font-bold" },
                                    { f: "Customer Support", z: "Local Team", o: "Central Support", zClass: "text-slate-900 font-bold" },
                                    { f: "Availability", z: "Area-specific", o: "Limited", zClass: "text-slate-900 font-bold" }
                                ].map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="p-4 text-sm font-medium text-slate-900">{row.f}</td>
                                        <td className={`p-4 text-sm ${row.zClass}`}>{row.z}</td>
                                        <td className="p-4 text-sm text-slate-400">{row.o}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="px-6 py-8">
                    <h3 className="text-2xl font-bold text-center text-slate-900 mb-6">Benefits of Using Zeppe</h3>
                    
                    <div className="space-y-4">
                        {[
                            "Save time on daily grocery shopping",
                            "Get fresh products at your doorstep",
                            "Support local dark stores and economy",
                            "Experience lightning-fast hyperlocal delivery",
                            "Dedicated support for Pupri residents"
                        ].map((benefit, idx) => (
                            <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="bg-black rounded-full p-1 flex-shrink-0">
                                    <CheckCircle2 size={16} className="text-white" />
                                </div>
                                <span className="text-slate-700 font-medium text-sm">{benefit}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="px-6 py-8 bg-slate-50/50">
                    <h3 className="text-2xl font-extrabold text-center text-slate-900 mb-6 leading-tight">
                        Frequently Asked Questions
                    </h3>
                    
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                                <button 
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
                                >
                                    <span className="text-lg font-bold text-slate-900 pr-4">{faq.q}</span>
                                    {openFaq === idx ? (
                                        <ChevronUp size={24} className="text-slate-400 flex-shrink-0" />
                                    ) : (
                                        <ChevronDown size={24} className="text-slate-400 flex-shrink-0" />
                                    )}
                                </button>
                                {openFaq === idx && (
                                    <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <p className="text-slate-500 leading-relaxed">
                                            {faq.a}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Download Section */}
                <div className="px-6 py-10 text-center bg-gradient-to-b from-white to-blue-50/30">
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                            <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center shadow-lg">
                                <ShoppingBag size={24} className="text-white" />
                            </div>
                        </div>

                        <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Download Zeppe Today</h3>
                        <p className="text-slate-500 text-base mb-8">Experience true hyperlocal quick commerce in Pupri</p>

                        <div className="w-full max-w-sm space-y-4">
                            <button className="w-full bg-black text-white py-4 px-6 rounded-2xl font-bold text-lg hover:bg-slate-900 transition-all shadow-xl active:scale-[0.98]">
                                Download for iOS
                            </button>
                            <button className="w-full bg-black text-white py-4 px-6 rounded-2xl font-bold text-lg hover:bg-slate-900 transition-all shadow-xl active:scale-[0.98]">
                                Download for Android
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8 border-t border-slate-100 mx-6 pb-12">
                    <p className="text-xs text-slate-400">© {new Date().getFullYear()} {appName}. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
