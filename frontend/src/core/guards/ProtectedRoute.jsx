import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@core/context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        if (location.pathname.startsWith('/admin')) {
            return <Navigate to="/admin/auth" state={{ from: location }} replace />;
        }
        if (location.pathname.startsWith('/seller') || location.pathname.startsWith('/vendor')) {
            return <Navigate to="/seller/auth" state={{ from: location }} replace />;
        }
        if (location.pathname.startsWith('/delivery')) {
            return <Navigate to="/delivery/auth" state={{ from: location }} replace />;
        }
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (location.pathname.startsWith('/seller') || location.pathname.startsWith('/vendor')) {
        // Only redirect if we have a user object to inspect. 
        // If user is null but authenticated, it's a profile sync error, not a pending status.
        if (!user) {
            return (
                <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-900 p-6 text-center font-outfit">
                    <div className="mb-6 h-16 w-16 animate-bounce rounded-full bg-rose-500/20 flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full bg-rose-500"></div>
                    </div>
                    <h2 className="mb-2 text-xl font-black text-white">Account Sync Error</h2>
                    <p className="mb-8 max-w-xs text-sm font-medium text-slate-400">
                        We couldn't load your seller profile. This usually happens during temporary server maintenance.
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="rounded-2xl bg-white px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-900 shadow-xl transition-all active:scale-95"
                    >
                        Retry Connection
                    </button>
                </div>
            );
        }

        const applicationStatus =
            user?.applicationStatus || (user?.isVerified ? 'approved' : 'pending');
        const isApprovedSeller =
            user.isVerified === true &&
            user.isActive === true &&
            applicationStatus === 'approved';

        const isSubscriptionPage = location.pathname.includes('subscription');

        if (!isApprovedSeller && !isSubscriptionPage) {
            return (
                <Navigate
                    to="/seller/pending-approval"
                    state={{
                        approvalRequired: true,
                        applicationStatus,
                        rejectionReason: user?.rejectionReason || '',
                    }}
                    replace
                />
            );
        }
    }

    if (location.pathname.startsWith('/delivery')) {
        if (!user) {
            return (
                <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 p-6 text-center font-outfit">
                    <div className="mb-6 h-16 w-16 animate-pulse rounded-full bg-amber-500/20 flex items-center justify-center">
                        <div className="h-8 w-8 rounded-full bg-amber-500"></div>
                    </div>
                    <h2 className="mb-2 text-xl font-black text-white">Rider Sync Failed</h2>
                    <p className="mb-8 max-w-xs text-sm font-medium text-slate-400">
                        The delivery network is currently unreachable. Please check your internet or try again.
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="rounded-2xl bg-amber-500 px-8 py-4 text-xs font-black uppercase tracking-widest text-black shadow-xl transition-all active:scale-95"
                    >
                        Reconnect
                    </button>
                </div>
            );
        }

        const applicationStatus =
            user?.applicationStatus || (user?.isVerified ? 'approved' : 'pending');
        const isApprovedDelivery =
            user.isVerified === true &&
            applicationStatus === 'approved';

        if (!isApprovedDelivery && location.pathname !== '/delivery/pending-approval') {
            return (
                <Navigate
                    to="/delivery/pending-approval"
                    state={{
                        approvalRequired: true,
                        applicationStatus,
                        rejectionReason: user?.rejectionReason || '',
                    }}
                    replace
                />
            );
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
