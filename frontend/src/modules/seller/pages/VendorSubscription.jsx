import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@core/context/AuthContext';
import { 
  FileText, 
  CheckCircle, 
  Download, 
  ArrowRight, 
  ShieldCheck, 
  Info, 
  IndianRupee,
  Store,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '@shared/components/ui/Button';
import { toast } from 'sonner';

const AgreementSection = ({ title, children, icon: Icon }) => (
  <div className="mb-8 border-b border-gray-100 pb-8 last:border-0 last:pb-0">
    <div className="mb-4 flex items-center gap-2">
      {Icon && <Icon className="text-emerald-600" size={20} />}
      <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">{title}</h3>
    </div>
    <div className="text-gray-600 space-y-3 text-sm leading-relaxed">
      {children}
    </div>
  </div>
);

const PricingTable = () => (
  <div className="my-6 overflow-hidden rounded-xl border border-gray-100 bg-emerald-50/30">
    <table className="w-full text-left text-sm">
      <thead className="bg-emerald-50 text-emerald-800">
        <tr>
          <th className="px-6 py-3 font-bold uppercase tracking-wider">Service Component</th>
          <th className="px-6 py-3 text-right font-bold uppercase tracking-wider">Fee (One-time)</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        <tr>
          <td className="px-6 py-4 font-medium text-gray-700">Product Addition Fee</td>
          <td className="px-6 py-4 text-right font-bold text-gray-900">₹8,000</td>
        </tr>
        <tr>
          <td className="px-6 py-4 font-medium text-gray-700">Documentation & Banking Charge</td>
          <td className="px-6 py-4 text-right font-bold text-gray-900">₹399</td>
        </tr>
        <tr className="bg-emerald-600 text-white">
          <td className="px-6 py-4 font-black uppercase tracking-widest">Total Investment</td>
          <td className="px-6 py-4 text-right text-xl font-black">₹8,399</td>
        </tr>
      </tbody>
    </table>
    <div className="bg-white p-4 flex items-start gap-3 border-t border-gray-100">
      <Info className="text-emerald-600 shrink-0" size={18} />
      <p className="text-xs text-gray-500 italic">
        Additional operational fee of <span className="font-bold text-emerald-700">₹35 per order</span> will be deducted automatically from order payouts for delivery logistics.
      </p>
    </div>
  </div>
);

const VendorSubscription = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [storeName, setStoreName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    if (!storeName.trim() || !agreed) {
      toast.error('Please enter store name and agree to the terms.');
      return;
    }
    
    setIsProcessing(true);
    // Simulate payment process
    setTimeout(() => {
      setIsProcessing(false);
      
      // Update local subscription status
      if (user) {
        const updatedUser = { ...user, subscriptionStatus: 'active' };
        login(updatedUser);
        // Persist for demo purposes across refreshes
        localStorage.setItem('demo_subscription_active', 'true');
      }
      
      toast.success('Payment Successful! Welcome to Zeppe Partner Network.');
      navigate('/seller'); // Redirect to seller dashboard
    }, 2000);
  };

  const handleDownloadPDF = () => {
    toast.info('Generating agreement PDF...');
    // Mock download
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
              <Store className="text-emerald-600" size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight sm:text-4xl">
            Service Partnership Agreement
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-xl mx-auto font-medium">
            Review your partnership terms and complete the one-time integration payment to activate your vendor dashboard.
          </p>
        </div>

        {/* Main Document */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-white shadow-2xl shadow-emerald-900/5 rounded-[2rem] border border-gray-100 overflow-hidden"
        >
          {/* Document Top Accent */}
          <div className="h-2 bg-linear-to-r from-emerald-500 to-emerald-600" />
          
          <div className="p-8 md:p-12">
            <div className="flex justify-between items-start mb-10 border-b border-gray-50 pb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  Partner Document #ZP-2024
                </span>
                <p className="mt-2 text-xs text-gray-400 font-bold">Generated on: {new Date().toLocaleDateString()}</p>
              </div>
              <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-emerald-600 transition-colors"
              >
                <Download size={14} /> Download PDF
              </button>
            </div>

            {/* Section 1: Plan & Fees */}
            <AgreementSection title="1. Service Plan & Fees" icon={IndianRupee}>
              <p>The vendor agrees to pay a one-time non-refundable integration and documentation fee for platform onboarding.</p>
              <PricingTable />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-black text-gray-400 uppercase mb-1">Product Listing Charges</h4>
                  <p className="text-lg font-bold text-gray-900">₹4,000</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-black text-gray-400 uppercase mb-1">Platform Setup</h4>
                  <p className="text-lg font-bold text-gray-900">₹4,000</p>
                </div>
              </div>
            </AgreementSection>

            {/* Section 2: Scope of Work */}
            <AgreementSection title="2. Scope of Work" icon={CheckCircle}>
              <ul className="space-y-2 list-none p-0">
                {[
                  'Complete platform technical integration',
                  'Initial product inventory setup and cataloging',
                  'Dedicated technical support for the first 90 days',
                  'Access to vendor mobile & web dashboards'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <ChevronRight className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </AgreementSection>

            {/* Section 3: Merchant Commitments */}
            <AgreementSection title="3. Merchant Commitments" icon={ShieldCheck}>
              <p>The Merchant hereby commits to providing accurate store information, maintaining high-quality service standards, and ensuring timely response to customer orders.</p>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mt-4 rounded-r-xl">
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  <strong>Important:</strong> A recurring logistics fee of ₹35 will be applied to every successful order processed through the platform.
                </p>
              </div>
            </AgreementSection>

            {/* Confirmation Section */}
            <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="text-emerald-600" size={20} />
                Agreement Confirmation
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Store / Business Name</label>
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="text" 
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Enter legal store name"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Agreement Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="text" 
                      disabled
                      value={new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      className="w-full pl-12 pr-4 py-4 bg-gray-100 border border-gray-100 rounded-2xl text-sm font-bold text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-1">
                  <input 
                    type="checkbox" 
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="peer hidden"
                  />
                  <div className="w-5 h-5 border-2 border-gray-200 rounded-md transition-all peer-checked:bg-emerald-600 peer-checked:border-emerald-600 flex items-center justify-center text-white">
                    <CheckCircle size={14} />
                  </div>
                </div>
                <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors">
                  I hereby confirm that I have read and agree to all terms of the Service Partnership Agreement and authorize the one-time integration payment.
                </span>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Action Button */}
        <div className="mt-10 flex flex-col items-center">
          <Button
            onClick={handlePayment}
            disabled={!agreed || !storeName.trim() || isProcessing}
            className={`w-full sm:w-[400px] py-5 rounded-2xl text-lg font-black tracking-widest uppercase shadow-2xl shadow-emerald-600/20 transition-all ${
              !agreed || !storeName.trim() ? 'opacity-50 grayscale' : 'hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                Proceed to Payment <span className="text-emerald-300">₹8399</span> <ArrowRight size={20} />
              </div>
            )}
          </Button>
          <p className="mt-4 text-xs text-gray-400 font-bold flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" /> Secure Payment Gateway • PCI DSS Compliant
          </p>
        </div>
      </div>

      {/* Sticky Bottom for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
        <Button
          onClick={handlePayment}
          disabled={!agreed || !storeName.trim() || isProcessing}
          className="w-full py-4 rounded-xl text-sm font-black tracking-widest uppercase"
        >
          {isProcessing ? 'Processing...' : 'Pay ₹8399 & Activate'}
        </Button>
      </div>
    </div>
  );
};

export default VendorSubscription;
