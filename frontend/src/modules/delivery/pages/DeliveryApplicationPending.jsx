import React from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, ShieldAlert, Bike } from "lucide-react";
import { useAuth } from "@core/context/AuthContext";
import { useSettings } from "@core/context/SettingsContext";

const DeliveryApplicationPending = () => {
  const location = useLocation();
  const { isAuthenticated, role, user, isLoading } = useAuth();
  const { settings } = useSettings();

  const appName = settings?.appName || "Zeppe";
  const logoUrl = settings?.logoUrl || "";

  const applicationStatus =
    location.state?.applicationStatus ||
    user?.applicationStatus ||
    (user?.isVerified ? "approved" : "pending");
  const rejectionReason = location.state?.rejectionReason || user?.rejectionReason || "";

  if (!isLoading && isAuthenticated && role === "delivery") {
    const isApproved =
      user?.isVerified === true &&
      applicationStatus === "approved";

    if (isApproved) {
      return <Navigate to="/delivery/dashboard" replace />;
    }
  }

  const isRejected = applicationStatus === "rejected";

  return (
    <div className="min-h-screen bg-[#F8F9FB] relative overflow-hidden font-['Outfit'] flex flex-col items-center justify-center p-6">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] h-[300px] w-[300px] rounded-full bg-cyan-400/5 blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[300px] w-[300px] rounded-full bg-blue-400/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center text-center relative z-10"
      >
        {/* Icon Header */}
        <div className="mb-8 relative">
          <div className={`h-24 w-24 rounded-full flex items-center justify-center ${
            isRejected ? 'bg-red-50' : 'bg-cyan-50'
          }`}>
             {isRejected ? (
               <ShieldAlert className="h-12 w-12 text-red-500" />
             ) : (
               <Clock3 className="h-12 w-12 text-cyan-500" />
             )}
          </div>
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-4 border-white flex items-center justify-center ${
              isRejected ? 'bg-red-500' : 'bg-cyan-500'
            }`}
          >
            <Bike className="h-4 w-4 text-white" />
          </motion.div>
        </div>

        {/* Status Tag */}
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-6 ${
          isRejected ? 'bg-red-100 text-red-600' : 'bg-cyan-100 text-cyan-600'
        }`}>
          {isRejected ? "Action Required" : "Application Pending"}
        </div>

        <h1 className="text-2xl font-black text-gray-900 leading-tight mb-4">
          {isRejected 
            ? "Your application needs attention." 
            : "We're reviewing your application!"}
        </h1>

        <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8">
          {isRejected 
            ? "Unfortunately, your application was not approved this time. Please check the reason below and contact support."
            : "Our team is currently verifying your documents. You'll get full access to the delivery partner dashboard once approved."}
        </p>

        {rejectionReason && (
          <div className="w-full bg-red-50 rounded-2xl p-4 text-left border border-red-100 mb-8">
            <span className="text-[10px] font-black text-red-500 uppercase tracking-wider block mb-1">Reason for Rejection</span>
            <p className="text-red-700 text-xs font-semibold">{rejectionReason}</p>
          </div>
        )}

        {!isRejected && (
          <div className="w-full bg-cyan-50 rounded-2xl p-4 flex items-start gap-3 mb-8">
            <CheckCircle2 className="h-5 w-5 text-cyan-500 shrink-0" />
            <p className="text-left text-xs font-bold text-cyan-700 leading-tight">
              Verification usually takes 12-24 hours. Keep your app updated!
            </p>
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          <Link
            to="/delivery/auth"
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-gray-200 active:scale-95 transition-all"
          >
            Back to Login
          </Link>
          <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-[0.2em]">
            {appName} Delivery Partner
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default DeliveryApplicationPending;
