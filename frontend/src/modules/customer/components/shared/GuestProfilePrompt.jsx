import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Lock, LogIn, X } from "lucide-react";
import { useSettings } from "@core/context/SettingsContext";

const GuestProfilePrompt = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const appName = settings?.appName || "App";

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  const handleLogin = () => {
    onClose?.();
    navigate("/login");
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 px-5 backdrop-blur-[6px]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-[340px] rounded-[28px] bg-white px-4 pb-4 pt-6 text-center shadow-[0_35px_80px_rgba(0,0,0,0.24)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-profile-prompt-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close login popup"
            >
              <X size={16} />
            </button>

            <div className="absolute left-1/2 top-0 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-black text-white shadow-lg">
              <Lock size={18} />
            </div>

            <h2
              id="guest-profile-prompt-title"
              className="mt-2 text-[1.35rem] font-black tracking-tight text-slate-900"
            >
              Welcome to {appName}!
            </h2>
            <p className="mt-3 px-4 text-sm font-medium leading-6 text-slate-500">
              Please log in or sign up to continue with your account.
            </p>

            <button
              type="button"
              onClick={handleLogin}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(15,23,42,0.2)] transition-transform duration-200 hover:scale-[1.01] active:scale-[0.98]"
            >
              <LogIn size={16} />
              Login to Your Account
            </button>

            <p className="mt-4 text-[10px] font-medium leading-4 text-slate-400">
              By continuing, you agree to our{" "}
              <Link
                to="/terms"
                className="font-semibold text-slate-500 underline underline-offset-2"
                onClick={onClose}
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="font-semibold text-slate-500 underline underline-offset-2"
                onClick={onClose}
              >
                Privacy Policy
              </Link>
              .
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};

export default GuestProfilePrompt;
