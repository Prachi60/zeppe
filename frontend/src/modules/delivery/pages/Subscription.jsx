import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Shield, Zap, ArrowRight, Package, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '@shared/components/ui/Button';

const PlanCard = ({ 
  title, 
  price, 
  label, 
  features, 
  icon: Icon, 
  isRecommended, 
  isSelected, 
  onSelect 
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      className={`relative cursor-pointer rounded-2xl p-6 transition-all duration-300 ${
        isSelected 
          ? 'bg-white border-2 border-primary-600 shadow-xl ring-1 ring-primary-600' 
          : 'bg-white border border-gray-100 shadow-md hover:shadow-lg'
      } ${isRecommended && !isSelected ? 'border-primary-200 shadow-primary-100 shadow-lg' : ''} ${isRecommended ? 'md:scale-105' : ''}`}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-4 py-1 text-xs font-bold text-white shadow-lg animate-pulse">
          {label}
        </div>
      )}
      {!isRecommended && label && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gray-100 px-4 py-1 text-xs font-bold text-gray-600 shadow-sm">
          {label}
        </div>
      )}

      <div className="mb-6 flex justify-center">
        <div className={`rounded-full p-4 ${isRecommended ? 'bg-primary-50 text-primary-600' : 'bg-gray-50 text-gray-600'}`}>
          <Icon size={32} />
        </div>
      </div>

      <div className="text-center">
        <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
        <div className="mb-6 flex items-baseline justify-center">
          <span className="text-4xl font-extrabold text-gray-900">₹{price}</span>
          <span className="ml-1 text-sm text-gray-500">/one-time</span>
        </div>
      </div>

      <ul className="mb-8 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start text-sm text-gray-600">
            <div className={`mr-3 rounded-full p-1 ${isRecommended ? 'bg-primary-50 text-primary-600' : 'bg-green-50 text-green-600'}`}>
              <Check size={14} />
            </div>
            {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className={`w-full rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
          isSelected
            ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
        }`}
      >
        Select Plan
      </button>
    </motion.div>
  );
};

const Subscription = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const navigate = useNavigate();

  const plans = [
    {
      id: 'basic',
      title: 'Basic Plan',
      price: '399',
      label: 'One-time',
      icon: Shield,
      features: [
        'Delivery partner access',
        'Order handling',
        'Basic support',
      ],
      isRecommended: false,
    },
    {
      id: 'premium',
      title: 'Premium Plan',
      price: '599',
      label: 'Recommended',
      icon: Zap,
      features: [
        'Delivery partner access',
        'Free bag & dress kit',
        'Priority support',
      ],
      isRecommended: true,
    },
  ];

  const handleContinue = () => {
    if (selectedPlan) {
      // Logic for payment or redirect
      navigate('/delivery/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4FF] px-4 py-12 font-sans sm:px-6 lg:px-8 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background blobs to match Auth theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-4xl font-extrabold text-gray-900 sm:text-5xl"
          >
            Choose Your Plan
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600"
          >
            One-time subscription to start your delivery journey
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:px-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * (index + 1) }}
            >
              <PlanCard
                {...plan}
                isSelected={selectedPlan === plan.id}
                onSelect={() => setSelectedPlan(plan.id)}
              />
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="mb-6 text-sm text-gray-500 italic">
            * This is a one-time payment. No hidden charges.
          </p>
          <div className="flex justify-center">
            <Button
              onClick={handleContinue}
              disabled={!selectedPlan}
              className={`group flex items-center gap-2 px-12 py-4 text-lg font-bold shadow-xl transition-all duration-300 ${
                !selectedPlan ? 'cursor-not-allowed opacity-50' : 'hover:translate-x-1'
              }`}
            >
              Continue
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
