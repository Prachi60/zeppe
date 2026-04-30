import React, { useState } from 'react';
import { ChevronLeft, Trash2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@core/context/AuthContext';
import { customerApi } from '../services/customerApi';
import { toast } from 'sonner';

const AccountPrivacyPage = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const response = await customerApi.deleteAccount();
            if (response.data.success) {
                toast.success('Account deleted successfully');
                setShowDeleteModal(false);
                // Clear local session
                logout();
                // Redirect to login or home
                navigate('/');
            } else {
                toast.error(response.data.message || 'Failed to delete account');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error deleting account');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white px-4 py-4 border-b flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} className="text-slate-900" />
                </button>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Account Privacy</h1>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Account privacy and policy</h2>
                    <div className="space-y-4 text-slate-500 leading-relaxed text-[15px]">
                        <p>
                            Deleting your account will permanently remove all your personal information, order history, saved addresses, and wishlist items.
                        </p>
                        <p>
                            You will no longer be able to access previous orders, returns, or invoices.
                        </p>
                        <p>
                            Any active subscriptions or store credits will be lost.
                        </p>
                        <p className="pt-2">
                            This action is permanent and cannot be undone. Please proceed only if you're sure you want to delete your account.
                        </p>
                    </div>
                </div>

                {/* Request Card */}
                <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                            <Trash2 size={24} className="text-slate-900" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">Request to delete account</h3>
                            <p className="text-slate-400 text-sm font-medium">Request to closure of your account</p>
                        </div>
                    </div>
                    <div className="p-2 rounded-lg group-hover:bg-slate-200/50 transition-colors">
                        <ChevronRight size={20} className="text-slate-900" />
                    </div>
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setShowDeleteModal(false)}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
                                <Trash2 size={36} className="text-red-500" />
                            </div>
                            
                            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Delete Account?</h3>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                Are you sure you want to delete your account? All your data will be permanently removed. This action <span className="text-red-500 font-bold underline">cannot</span> be undone.
                            </p>
                            
                            <div className="w-full space-y-3">
                                <button 
                                    disabled={isDeleting}
                                    onClick={handleDeleteAccount}
                                    className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-600 transition-all shadow-lg shadow-red-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
                                </button>
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="w-full bg-white text-slate-500 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all border border-slate-200 active:scale-[0.98]"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountPrivacyPage;
