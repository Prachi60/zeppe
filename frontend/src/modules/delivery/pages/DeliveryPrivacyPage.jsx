import React from "react";
import { ChevronLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@core/context/SettingsContext";

const DeliveryPrivacyPage = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const appName = settings?.appName || "Zeppe";

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
        <h1 className="text-lg font-black text-slate-800">Partner Privacy Policy</h1>
      </div>

      <div className="p-5 max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Partner Privacy Policy</h2>
              <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider">
                Last updated: May 2026
              </p>
            </div>
          </div>

          <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-6 leading-relaxed">
            <div className="space-y-3">
              <h3 className="text-slate-800 font-bold text-lg">1. Introduction</h3>
              <p>
                This Partner Privacy Policy describes how <span className="font-bold text-slate-800">{appName}</span> ("we", "our", "us") collects, stores, processes, and protects the personal and location data of our delivery partners ("Partner", "you", "your") who onboard and operate on the partner network.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-slate-800 font-bold text-lg">2. Information We Collect</h3>
              <p>
                To onboard you and process payouts, we collect the following personal identification and operational records:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>
                  <span className="font-bold text-slate-800">Identity Details:</span> Full Name, email address, phone number, physical address, and profile photo.
                </li>
                <li>
                  <span className="font-bold text-slate-800">Government Verification Documents:</span> Aadhaar Card, PAN Card, and Driving License (DL) copies and numbers for background verification.
                </li>
                <li>
                  <span className="font-bold text-slate-800">Vehicle Info:</span> Vehicle type (bike, scooter, cycle) and license plate number.
                </li>
                <li>
                  <span className="font-bold text-slate-800">Financial Information:</span> Verified bank account holder name, account number, and IFSC code to deposit your delivery earnings and incentives.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-slate-800 font-bold text-lg">3. Location Data & Real-Time Tracking</h3>
              <p className="bg-indigo-50/50 p-4 rounded-2xl border-l-4 border-indigo-600 text-xs">
                <span className="font-bold text-indigo-700 block mb-1 uppercase">Continuous Location Policy</span>
                We collect your precise or approximate location details ("Location Data") to facilitate order allocations and active tracking. When you log on as online or while you have an active order assigned, {appName} tracks your device's geographical location in the foreground and background. This enables customers to track their order delivery, helps store managers prepare items for your arrival, and calculates accurate delivery payouts.
              </p>
              <p>
                We do NOT track your device location when you toggle your status to offline or close the partner application completely.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-slate-800 font-bold text-lg">4. Device Permissions</h3>
              <p>
                The partner application requires the following smartphone permissions to operate correctly:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>
                  <span className="font-bold text-slate-800">Fine/Coarse Location:</span> Required continuously for background dispatching and customer tracking.
                </li>
                <li>
                  <span className="font-bold text-slate-800">Camera & Storage:</span> Required for uploading document verification files during signup, and taking photos of orders as proof of delivery when required.
                </li>
                <li>
                  <span className="font-bold text-slate-800">Notifications:</span> Required to alert you to incoming order assignments, system payouts, and emergency broadcasts.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-slate-800 font-bold text-lg">5. How We Share Your Information</h3>
              <p>
                Your personal details are processed securely and shared only in the following scenarios:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>
                  <span className="font-bold text-slate-800">With Store Partners:</span> Your name and phone number may be shared so stores can coordinate order pickup.
                </li>
                <li>
                  <span className="font-bold text-slate-800">With Customers:</span> Your name, photo, and real-time live location are shared with the customer assigned to your delivery for order receipt tracking.
                </li>
                <li>
                  <span className="font-bold text-slate-800">With Security & Law Enforcement:</span> We may disclose your data if required by legal authorities or to resolve safety, theft, or transit incidents.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-slate-800 font-bold text-lg">6. Data Security</h3>
              <p>
                We execute standard encryption, access control guidelines, and industry-standard security precautions to safeguard all identity documents, bank records, and coordinates from unauthorised disclosure, loss, or misuse.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPrivacyPage;
