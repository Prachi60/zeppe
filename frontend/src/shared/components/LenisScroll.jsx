import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const LenisScroll = () => {
    useEffect(() => {
        // Check if we're on login/signup page
        const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/signup';
        
        // Disable Lenis on mobile/tablet for better native performance and to avoid scroll-blocking issues
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isAuthPage || isMobile) {
            return;
        }

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false, // Ensure native touch is preserved
            touchMultiplier: 2,
        });

        let rafId;

        function raf(time) {
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        }

        rafId = requestAnimationFrame(raf);

        // Listen for route changes
        const handleNavigation = () => {
            const isNowAuthPage = window.location.pathname === '/login' || window.location.pathname === '/signup';
            if (isNowAuthPage) {
                lenis.destroy();
                cancelAnimationFrame(rafId);
            }
        };

        window.addEventListener('popstate', handleNavigation);

        return () => {
            cancelAnimationFrame(rafId);
            lenis.destroy();
            window.removeEventListener('popstate', handleNavigation);
        };
    }, []);

    return null;
};

export default LenisScroll;
