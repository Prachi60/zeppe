import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Calendar, 
  CreditCard, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/shared/components/ui/Button';

const SubscriptionStatus = () => {
  const navigate = useNavigate();

  const subscriptionData = {
    status: 'Active',
    planName: 'Premium Partner Plan',
    amount: '₹599',
    activatedOn: '23 April 2026',
    expiresOn: '23 April 2027',
    transactionId: 'TXN_99210455',
    features: [
      'Priority order assignments',
      'Lower platform commission',
      'Free accidental insurance',
      'Weekly bonus eligibility'
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Outfit']">
      {/* Header */}
      <div className="bg-primary pt-12 pb-6 px-6 text-white flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Subscription Status</h1>
      </div>

      <div className="px-6 -mt-4 pb-12">
        {/* Status Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-6 shadow-xl border border-white"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck size={40} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">{subscriptionData.planName}</h2>
            <div className="mt-2 inline-flex items-center gap-1.5 px-4 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
              <CheckCircle2 size={12} />
              {subscriptionData.status}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                  <Calendar size={18} />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Activated On</span>
              </div>
              <span className="text-sm font-black text-slate-900">{subscriptionData.activatedOn}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-500">
                  <Clock size={18} />
                </div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Valid Until</span>
              </div>
              <span className="text-sm font-black text-emerald-900">{subscriptionData.expiresOn}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                  <CreditCard size={18} />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Amount</span>
              </div>
              <span className="text-sm font-black text-slate-900">{subscriptionData.amount}</span>
            </div>
          </div>
        </motion.div>

        {/* Features list */}
        <div className="mt-8">
          <h3 className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Plan Benefits</h3>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
            {subscriptionData.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Help Banner */}
        <div className="mt-8 p-6 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-lg font-black mb-2">Need to upgrade?</h4>
            <p className="text-xs text-white/60 leading-relaxed mb-4">
              Explore higher tier plans for even better earnings and insurance coverage.
            </p>
            <Button className="bg-white text-slate-900 rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              View Plans <ArrowRight size={14} />
            </Button>
          </div>
          <div className="absolute top-[-20%] right-[-10%] h-40 w-40 bg-white/5 rounded-full blur-2xl" />
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatus;
