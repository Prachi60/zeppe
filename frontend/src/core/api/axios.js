import axios from 'axios';
import { resolveApiBaseUrl } from './resolveApiBaseUrl';

const ROLE_STORAGE_KEYS = {
    seller: 'auth_seller',
    admin: 'auth_admin',
    delivery: 'auth_delivery',
    customer: 'auth_customer',
};

const LEGACY_TOKEN_KEY = 'token';
const AUTH_ROUTE_BY_ROLE = {
    seller: '/seller/auth',
    admin: '/admin/auth',
    delivery: '/delivery/auth',
    customer: '/login',
};

const AUTH_ENDPOINT_PATTERNS = [
    '/admin/login',
    '/admin/signup',
    '/admin/bootstrap',
    '/seller/login',
    '/seller/signup',
    '/seller/verification/send-otp',
    '/seller/verification/verify-otp',
    '/delivery/send-login-otp',
    '/delivery/send-signup-otp',
    '/delivery/verify-otp',
    '/customer/send-login-otp',
    '/customer/send-signup-otp',
    '/customer/verify-otp',
    '/auth/otp/send',
    '/auth/otp/verify',
];

function getStoredToken(storageKey) {
    const rawValue = localStorage.getItem(storageKey);
    if (!rawValue) return null;

    const normalizedValue = String(rawValue).trim();
    if (!normalizedValue) return null;

    if (normalizedValue.startsWith('{')) {
        try {
            const parsed = JSON.parse(normalizedValue);
            return typeof parsed?.token === 'string' ? parsed.token.trim() : null;
        } catch {
            return null;
        }
    }

    return normalizedValue;
}

function getRoleFromPath(pathname = '') {
    if (pathname.startsWith('/seller')) return 'seller';
    if (pathname.startsWith('/admin')) return 'admin';
    if (pathname.startsWith('/delivery')) return 'delivery';
    return 'customer';
}

function getRoleFromRequestUrl(url = '') {
    const normalizedUrl = String(url || '').trim().toLowerCase();

    if (normalizedUrl.startsWith('/seller') || normalizedUrl.startsWith('seller')) return 'seller';
    if (normalizedUrl.startsWith('/admin') || normalizedUrl.startsWith('admin')) return 'admin';
    if (normalizedUrl.startsWith('/delivery') || normalizedUrl.startsWith('delivery')) return 'delivery';
    if (
        normalizedUrl.startsWith('/customer') ||
        normalizedUrl.startsWith('customer') ||
        normalizedUrl.includes('/cart') ||
        normalizedUrl.includes('/wishlist') ||
        normalizedUrl.includes('/payments')
    ) {
        return 'customer';
    }

    return null;
}

function getCandidateRoles(url = '', pathname = '') {
    const currentRole = getRoleFromPath(pathname);
    const requestRole = getRoleFromRequestUrl(url);

    if (requestRole) {
        return [...new Set([requestRole, currentRole === requestRole ? currentRole : null].filter(Boolean))];
    }

    return [currentRole];
}

function resolveAuthToken(url = '', pathname = '') {
    const candidates = getCandidateRoles(url, pathname);

    for (const role of candidates) {
        const token = getStoredToken(ROLE_STORAGE_KEYS[role]);
        if (token) {
            return { token, role };
        }
    }

    const legacyToken = getStoredToken(LEGACY_TOKEN_KEY);
    return legacyToken ? { token: legacyToken, role: getRoleFromPath(pathname) } : { token: null, role: null };
}

function isAuthEndpoint(url = '') {
    const normalizedUrl = String(url || '').trim().toLowerCase();
    return AUTH_ENDPOINT_PATTERNS.some((pattern) => normalizedUrl.startsWith(pattern));
}

function clearStoredAuth(role, token) {
    if (role && ROLE_STORAGE_KEYS[role]) {
        localStorage.removeItem(ROLE_STORAGE_KEYS[role]);
        sessionStorage.removeItem(`push:registered:${role}`);
        localStorage.removeItem(`push:fcm-token:${role}`);
    }

    if (token && localStorage.getItem(LEGACY_TOKEN_KEY) === token) {
        localStorage.removeItem(LEGACY_TOKEN_KEY);
    }
}

function redirectToLogin(role) {
    const targetRole = role || getRoleFromPath(window.location.pathname);
    const authRoute = AUTH_ROUTE_BY_ROLE[targetRole] || '/login';
    const currentPath = window.location.pathname;

    if (currentPath === authRoute) return;
    if (sessionStorage.getItem('auth_redirect_in_progress') === authRoute) return;

    sessionStorage.setItem('auth_redirect_in_progress', authRoute);
    window.location.replace(authRoute);
}

const axiosInstance = axios.create({
    baseURL: resolveApiBaseUrl(),
});

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
    (config) => {
        const url = config.url || '';
        const pagePath = window.location.pathname;
        const activeRedirect = sessionStorage.getItem('auth_redirect_in_progress');
        const isMultipartRequest =
            typeof FormData !== 'undefined' && config.data instanceof FormData;

        if (activeRedirect && pagePath !== activeRedirect) {
            sessionStorage.removeItem('auth_redirect_in_progress');
        }

        if (isMultipartRequest) {
            // Let the browser set the multipart boundary for FormData uploads.
            if (typeof config.headers?.delete === 'function') {
                config.headers.delete('Content-Type');
            } else if (config.headers) {
                delete config.headers['Content-Type'];
            }
        }

        const { token } = resolveAuthToken(url, pagePath);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else if (config.headers?.Authorization) {
            if (typeof config.headers.delete === 'function') {
                config.headers.delete('Authorization');
            } else {
                delete config.headers.Authorization;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        if (
            status === 401 &&
            originalRequest &&
            !originalRequest.__handled401 &&
            !originalRequest.skipAuthRedirect &&
            !isAuthEndpoint(originalRequest.url)
        ) {
            originalRequest.__handled401 = true;

            const { token, role } = resolveAuthToken(
                originalRequest.url,
                window.location.pathname
            );

            clearStoredAuth(role, token);
            window.dispatchEvent(
                new CustomEvent('auth:unauthorized', {
                    detail: {
                        role,
                        url: originalRequest.url,
                        status,
                    },
                })
            );
            redirectToLogin(role);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
