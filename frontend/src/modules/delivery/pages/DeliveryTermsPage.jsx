import React from "react";
import { ChevronLeft, ScrollText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@core/context/SettingsContext";

const DeliveryTermsPage = () => {
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
        <h1 className="text-lg font-black text-slate-800">Partner Terms of Service</h1>
      </div>

      <div className="p-5 max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ScrollText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Delivery Partner Agreement</h2>
              <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider">
                Last updated: May 2026
              </p>
            </div>
          </div>

          <div className="prose prose-slate prose-sm max-w-none text-slate-600 space-y-5 leading-relaxed">
            <p>
              This Delivery Partner Agreement ("Agreement") constitutes a legally binding electronic agreement between you ("Partner", "you", "your") and <span className="font-bold text-slate-800">{appName}</span> ("we", "us", "our"), governing your onboarding, registration, subscription (if applicable), and execution of delivery services on our Platform.
            </p>

            <p className="font-black text-indigo-600 uppercase text-xs tracking-wide border-l-4 border-indigo-600 pl-4 py-2 bg-indigo-50/50">
              BY REGISTERING AS A DELIVERY PARTNER, YOU ACKNOWLEDGE AND AGREE TO BE BOUND BY ALL TERMS AND CONDITIONS LISTED HEREIN. PLEASE READ THEM CAREFULLY.
            </p>

            <h3 className="font-bold text-slate-800 pt-2 text-base">
              Key Terms & Operational Requirements:
            </h3>

            <ol className="list-decimal pl-5 space-y-4 text-slate-600">
              <li>
                <span className="font-bold text-slate-800">Eligibility & Verification:</span> You must be at least 18 years of age and possess a valid Driving License (DL), Aadhaar Card, PAN Card, and a registered vehicle to serve as a motorized delivery partner. All documents submitted during sign-up are verified by our operations team. Any false, forged, or invalid document will lead to immediate termination and legal action.
              </li>
              <li>
                <span className="font-bold text-slate-800">Independent Contractor Status:</span> You agree that you are operating as an independent delivery contractor. This Agreement does not create an employer-employee relationship, partnership, or joint venture of any kind between you and {appName}. You are free to choose your own log-in hours and accept or decline orders.
              </li>
              <li>
                <span className="font-bold text-slate-800">Service Standards & Conduct:</span> When delivering orders, you must handle all products with care, especially fresh vegetables, groceries, and perishables. You are expected to behave professionally, politely, and respectfully with store partners, merchants, and customers. Customer harassment, unsafe riding, or inappropriate conduct will result in immediate suspension.
              </li>
              <li>
                <span className="font-bold text-slate-800">Device & Location Services:</span> Active delivery requires continuous GPS/Location services, internet access, and a working smartphone. You agree to keep your location services set to "Always Allow" during shift hours so we can accurately assign orders and allow customers to track their delivery in real-time.
              </li>
              <li>
                <span className="font-bold text-slate-800">Payouts & Wallet System:</span> Earnings per delivery, bonuses, and incentives are credited directly to your partner wallet. Settlements to your verified bank account are processed on a weekly or daily cycle depending on your partner tier. All transactions are subject to tax deduction at source (TDS) as per government guidelines.
              </li>
              <li>
                <span className="font-bold text-slate-800">Cash on Delivery (COD) Remittance:</span> For COD orders, you are fully responsible for collecting the correct amount from the customer and safely depositing/remitting the cash to {appName} through the online partner app or designated drop centers. Failure to remit collected cash within 24 hours will lead to account suspension.
              </li>
              <li>
                <span className="font-bold text-slate-800">Subscription & Account Access:</span> If subscription features are enabled, maintaining an active partner plan is required to receive higher order allocation and platform access. Account sharing or allowing another individual to perform deliveries under your profile is strictly prohibited.
              </li>
              <li>
                <span className="font-bold text-slate-800">Governing Law:</span> This Agreement and any operational disputes are governed by and construed in accordance with the laws of India. All disputes shall be subject to the exclusive jurisdiction of the courts of Bihar.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTermsPage;
