import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Landmark, CreditCard, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import Button from "@/shared/components/ui/Button";
import Card from "@/shared/components/ui/Card";
import Input from "@/shared/components/ui/Input";
import { useAuth } from "@core/context/AuthContext";
import axiosInstance from "@core/api/axios";
import { toast } from "sonner";

const BankAccount = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const [formData, setFormData] = useState({
    accountNumber: "",
    confirmAccountNumber: "",
    ifsc: user?.ifsc || "",
    accountHolder: user?.accountHolder || user?.name || "",
  });

  const maskAccountNumber = (number) => {
    if (!number) return "XXXXXXXXXXXX";
    if (number.length < 4) return number;
    const last4 = number.slice(-4);
    return `XXXXXXXX${last4}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!formData.accountNumber || !formData.confirmAccountNumber || !formData.ifsc || !formData.accountHolder) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.accountNumber !== formData.confirmAccountNumber) {
      toast.error("Account numbers do not match");
      return;
    }

    try {
      setIsUpdating(true);
      await axiosInstance.put("/delivery/profile", {
        accountNumber: formData.accountNumber,
        accountHolder: formData.accountHolder,
        ifsc: formData.ifsc,
      });
      
      await refreshUser();
      toast.success("Bank details updated successfully");
      setFormData(prev => ({
        ...prev,
        accountNumber: "",
        confirmAccountNumber: "",
      }));
    } catch (error) {
      console.error("Failed to update bank details:", error);
      toast.error(error.response?.data?.message || "Failed to update bank details");
    } finally {
      setIsUpdating(false);
    }
  };

  const currentBankDetails = {
    accountHolder: user?.accountHolder || user?.name || "Not Set",
    accountNumber: maskAccountNumber(user?.accountNumber),
    ifsc: user?.ifsc || "Not Set",
    bankName: "Primary Account",
    status: user?.isVerified ? "Verified" : "Pending",
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-full hover:bg-gray-100 transition-colors mr-2"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="ds-h3 text-gray-900">Bank Account</h1>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Bank Card Visual */}
        <div className="bg-gradient-to-br from-indigo-900 to-blue-800 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <Landmark size={32} className="text-white/80" />
            <span className="bg-brand-500/20 text-brand-300 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-brand-500/30 flex items-center">
              <CheckCircle2 size={12} className="mr-1" /> {currentBankDetails.status}
            </span>
          </div>

          <div className="space-y-1 relative z-10">
            <p className="text-indigo-200 text-xs uppercase tracking-wider">Account Number</p>
            <p className="font-mono text-2xl tracking-widest">{currentBankDetails.accountNumber}</p>
          </div>

          <div className="flex justify-between items-end mt-8 relative z-10">
            <div>
              <p className="text-indigo-200 text-xs uppercase tracking-wider mb-1">Account Holder</p>
              <p className="font-bold text-lg uppercase">{currentBankDetails.accountHolder}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold">{currentBankDetails.bankName}</p>
              <p className="text-indigo-200 text-xs">{currentBankDetails.ifsc}</p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex items-start">
          <AlertTriangle size={20} className="text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-yellow-800 font-bold text-sm mb-1">Payment Information</h4>
            <p className="text-xs text-yellow-700 leading-relaxed">
              Your weekly earnings will be deposited to this account every Tuesday. 
              Changes to bank details may delay your next payout by up to 7 days.
            </p>
          </div>
        </div>

        {/* Change Request Form */}
        <div className="pt-4">
          <h3 className="ds-h4 text-gray-900 mb-4">Request Change</h3>
          <div className="space-y-4">
            <Input 
              label="Account Holder Name" 
              name="accountHolder"
              value={formData.accountHolder}
              onChange={handleInputChange}
              placeholder="Enter account holder name" 
              icon={Landmark}
            />
            <Input 
              label="New Account Number" 
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleInputChange}
              placeholder="Enter account number" 
              icon={CreditCard}
              type="password"
            />
            <Input 
              label="Confirm Account Number" 
              name="confirmAccountNumber"
              value={formData.confirmAccountNumber}
              onChange={handleInputChange}
              placeholder="Re-enter account number" 
              icon={CreditCard}
            />
            <Input 
              label="IFSC Code" 
              name="ifsc"
              value={formData.ifsc}
              onChange={handleInputChange}
              placeholder="Enter IFSC code" 
              icon={Landmark}
            />
            <Button 
              className="w-full mt-2" 
              variant="primary"
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Verify & Update"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankAccount;

