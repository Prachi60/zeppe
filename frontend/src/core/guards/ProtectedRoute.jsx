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
        const applicationStatus =
            user?.applicationStatus || (user?.isVerified ? 'approved' : 'pending');
        const isApprovedSeller =
            Boolean(user) &&
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

    return <>{children}</>;
};

export default ProtectedRoute;
