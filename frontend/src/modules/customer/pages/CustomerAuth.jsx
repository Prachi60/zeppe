import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, LoaderCircle, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@core/context/AuthContext";
import { useSettings } from "@core/context/SettingsContext";
import { customerApi } from "../services/customerApi";

// ── Local product images
import imgChips from "@/assets/login/Chips.png";
import imgChocolates from "@/assets/login/Chocolates.png";
import imgDryfruits from "@/assets/login/Dryfruits.png";
import imgFreshFruits from "@/assets/login/Fresh_fruits.png";
import imgFrozenFood from "@/assets/login/Frozen_food.png";
import imgHomeDecor from "@/assets/login/Home_decor.png";
import imgIceCreams from "@/assets/login/Ice_creams_desserts.png";
import imgKitchen from "@/assets/login/Kitchen_tools_appliances.png";
import imgMilk from "@/assets/login/Milk_bakery_eggs.png";
import imgPuja from "@/assets/login/Puja_samagri.png";
import imgRice from "@/assets/login/Rice_dals_aata.png";
import imgSweets from "@/assets/login/Sweets.png";
import imgVegetables from "@/assets/login/Vegetables.png";
import imgBiscuits from "@/assets/login/biscuits.png";
import imgCereals from "@/assets/login/cereals.png";
import imgMasala from "@/assets/login/masala_oil.png";

const PRODUCT_ROWS = [
  [imgFreshFruits, imgMasala, imgIceCreams, imgVegetables, imgSweets],
  [imgCereals, imgKitchen, imgBiscuits, imgChocolates, imgRice],
  [imgChips, imgFrozenFood, imgDryfruits, imgMilk, imgPuja, imgHomeDecor],
];

const SIGNUP_HINT_PATTERNS = [
  "signup", "sign up", "register", "create account",
  "new user", "not found", "does not exist",
];

function ProductRibbon({ items, reverse = false, duration = 20 }) {
  const repeatedItems = [...items, ...items, ...items];

  return (
    <div className="overflow-hidden py-2">
      <motion.div
        animate={{ x: reverse ? ["-33.33%", "0%"] : ["0%", "-33.33%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
        className="flex w-max gap-6 px-4"
      >
        {repeatedItems.map((imgSrc, index) => (
          <div
            key={`${index}`}
            className="flex h-[80px] w-[80px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-[#F5F5F5] shadow-sm sm:h-[90px] sm:w-[90px]"
          >
            <img
              src={imgSrc}
              alt=""
              className="h-[75%] w-[75%] object-contain"
              loading="lazy"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

const CustomerAuth = ({ isModal = false, isSignup = false, onClose = null }) => {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const { login } = useAuth();
  const { settings } = useSettings();

  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktopViewport(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const shouldShowAsModal = isModal || (
    isDesktopViewport && (routeLocation.pathname === "/login" || routeLocation.pathname === "/signup")
  );
  const actualIsSignup = isModal ? isSignup : routeLocation.pathname === "/signup";

  const [isSignupMode, setIsSignupMode] = useState(actualIsSignup);
  const [isLoading, setIsLoading]       = useState(false);
  const [showOtp, setShowOtp]           = useState(false);
  const [timer, setTimer]               = useState(0);
  const [formData, setFormData]         = useState({ email: "", otp: "", name: "" });
  const otpRefs = useRef([]);

  useEffect(() => {
    setIsSignupMode(actualIsSignup);
    setShowOtp(false);
    setFormData(p => ({ ...p, otp: "" }));
  }, [actualIsSignup]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // Lock scroll only in full-page mode
  useEffect(() => {
    if (shouldShowAsModal) return;
    const sw = window.innerWidth - document.documentElement.clientWidth;
    const st = window.scrollY || 0;
    const sl = window.scrollX || 0;
    const stop = e => { e.preventDefault(); e.stopPropagation(); };
    document.documentElement.style.cssText += ";overflow:hidden;height:100%;position:fixed;width:100%";
    document.body.style.cssText += ";overflow:hidden;height:100vh;position:fixed;width:100%";
    document.body.style.paddingRight = `${sw}px`;
    document.addEventListener("wheel",     stop, { passive: false });
    document.addEventListener("touchmove", stop, { passive: false });
    document.addEventListener("scroll",    stop, { passive: false });
    return () => {
      document.removeEventListener("wheel",     stop);
      document.removeEventListener("touchmove", stop);
      document.removeEventListener("scroll",    stop);
      ["overflow","height","position","width","top","left"].forEach(k => {
        document.documentElement.style[k] = "";
        document.body.style[k] = "";
      });
      document.body.style.paddingRight = "";
      window.scrollTo(sl, st);
    };
  }, [shouldShowAsModal]);

  const update = (field, val) => setFormData(p => ({ ...p, [field]: val }));

  const toggleMode = mode => navigate(mode === "signup" ? "/signup" : "/login");

  const sendOtp = async () => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(formData.email)) { toast.error("Enter a valid email address"); return; }
    if (isSignupMode && !formData.name.trim()) { toast.error("Enter your full name"); return; }
    setIsLoading(true);
    try {
      if (isSignupMode) {
        await customerApi.sendSignupOtp({ name: formData.name.trim(), email: formData.email });
      } else {
        try {
          await customerApi.sendLoginOtp({ email: formData.email });
        } catch (err) {
          const msg = String(err?.response?.data?.message || err?.message || "").toLowerCase();
          if (SIGNUP_HINT_PATTERNS.some(p => msg.includes(p))) {
            setIsSignupMode(true);
            toast.info("New account ke liye name add karke continue karo");
            return;
          }
          throw err;
        }
      }
      setShowOtp(true);
      setTimer(30);
      toast.success("OTP sent to your email");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async e => {
    e.preventDefault();
    if (formData.otp.length < 4) { toast.error("Enter the 4-digit OTP"); return; }
    setIsLoading(true);
    try {
      const res = await customerApi.verifyOtp({ email: formData.email, otp: formData.otp });
      const { token, customer } = res.data.result;
      login({ ...customer, token, role: "customer" });
      toast.success("Successfully logged in");
      navigate("/");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpInput = (i, val) => {
    const next = val.replace(/\D/g, "").slice(-1);
    const arr = formData.otp.padEnd(4, " ").split("");
    arr[i] = next || " ";
    update("otp", arr.join("").replace(/\s/g, ""));
    if (next && i < 3) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i, e) => {
    if (e.key === "Backspace" && !formData.otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleClose = () => {
    if (onClose) { onClose(); return; }
    navigate("/");
  };

  // ── Shared inner card ──────────────────────────────────────────────────────
  const card = (
    <div
      className="relative flex flex-col overflow-hidden bg-white"
      style={shouldShowAsModal
        ? { width: 400, maxHeight: "90vh", borderRadius: 20, boxShadow: "0 25px 60px rgba(0,0,0,0.25)" }
        : { width: "100%", height: "100%" }
      }
    >
      {/* ── PRODUCT MARQUEE ─────────────────────────────────────────── */}
      <div
        className="relative flex-shrink-0 overflow-hidden pt-6"
        style={{
          background: "white",
          height: shouldShowAsModal ? 300 : "48vh",
        }}
      >
        {/* Skip / Close */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 bg-black text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-md hover:bg-gray-800 transition-colors"
        >
          Skip
        </button>

        {/* Marquee Ribbons */}
        <div className="flex flex-col gap-4">
          <ProductRibbon items={PRODUCT_ROWS[0]} duration={18} />
          <ProductRibbon items={PRODUCT_ROWS[1]} reverse duration={22} />
          <ProductRibbon items={PRODUCT_ROWS[2]} duration={20} />
        </div>

        {/* Gradient Fade */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* ── FORM PANEL ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-white px-6 pt-2 pb-8">
        {/* App name */}
        <div className="mb-6 text-center">
          <h2
            className="text-6xl font-black italic tracking-tight text-gray-900"
            style={{ letterSpacing: "-0.04em" }}
          >
            zeppe
          </h2>
          <h1 className="mt-1 text-[22px] font-black tracking-tight text-gray-900">
            India&apos;s Quickest App
          </h1>
          <p className="mt-1 text-sm font-bold text-slate-500">Log In or Sign Up</p>
        </div>

        {/* ── AUTH FORM ───────────────────────────── */}
        <AnimatePresence mode="wait">
          {!showOtp ? (
            <motion.form
              key="auth-entry"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onSubmit={e => { e.preventDefault(); void sendOtp(); }}
            >
              {isSignupMode && (
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#d9dde5] bg-white px-4 py-3">
                  <User size={18} className="text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => update("name", e.target.value)}
                    placeholder="Enter full name"
                    className="w-full border-0 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
              )}

              <div className="flex overflow-hidden rounded-xl border border-[#d9dde5] bg-white">
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => update("email", e.target.value)}
                  placeholder="Enter your email address"
                  className="h-12 w-full border-0 bg-transparent px-4 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-black text-sm font-black text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <LoaderCircle size={18} className="animate-spin" /> : "Continue"}
              </button>

              <div className="mt-4 text-center">
                {isSignupMode ? (
                  <button type="button" onClick={() => toggleMode("login")} className="text-xs font-semibold text-slate-500 underline underline-offset-2">
                    Already have an account? Log in
                  </button>
                ) : (
                  <button type="button" onClick={() => toggleMode("signup")} className="text-xs font-semibold text-slate-500 underline underline-offset-2">
                    New here? Create account
                  </button>
                )}
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="otp-entry"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onSubmit={verifyOtp}
            >
              <button
                type="button"
                onClick={() => { setShowOtp(false); update("otp", ""); }}
                className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500"
              >
                <ChevronLeft size={16} /> Change email
              </button>

              <div className="mb-5 text-center">
                <h2 className="text-xl font-black tracking-tight text-gray-900">Verify your email</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">OTP sent to {formData.email}</p>
              </div>

              <div className="flex justify-center gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={formData.otp[i] || ""}
                    onChange={e => handleOtpInput(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    className="h-14 w-14 rounded-2xl border border-[#d9dde5] bg-white text-center text-xl font-black text-slate-900 outline-none focus:border-black"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black text-sm font-black text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? <LoaderCircle size={18} className="animate-spin" />
                  : <><span>Verify &amp; Continue</span><ArrowRight size={16} /></>
                }
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                <span>Didn&apos;t receive OTP?</span>
                <button
                  type="button"
                  disabled={timer > 0 || isLoading}
                  onClick={() => void sendOtp()}
                  className="font-bold text-slate-700 underline underline-offset-2 disabled:text-slate-300"
                >
                  {timer > 0 ? `Resend in ${timer}s` : "Resend"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-[10px] font-medium leading-4 text-slate-400">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="font-semibold text-slate-500 underline underline-offset-2">Terms of service</Link>
          {" "}&amp;{" "}
          <Link to="/privacy" className="font-semibold text-slate-500 underline underline-offset-2">Privacy policy</Link>
        </p>
      </div>
    </div>
  );

  // ── Full-page (mobile) wrapper
  if (!shouldShowAsModal) {
    return (
      <div className="fixed inset-0 overflow-hidden">
        {card}
      </div>
    );
  }

  // ── Modal (desktop) wrapper
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      {card}
    </div>
  );
};

export default CustomerAuth;
