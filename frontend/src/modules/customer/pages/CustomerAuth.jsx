import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, LoaderCircle, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@core/context/AuthContext";
import { useSettings } from "@core/context/SettingsContext";
import { customerApi } from "../services/customerApi";

// Real product image URLs for the animated ribbons (verified working Unsplash IDs)
const PRODUCT_ROWS = [
  [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=120&h=120&fit=crop&q=80",  // veggies
    "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=120&h=120&fit=crop&q=80",  // fruit bowl
    "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=120&h=120&fit=crop&q=80",  // milk
    "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=120&h=120&fit=crop&q=80",  // bread
    "https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=120&h=120&fit=crop&q=80",  // eggs
    "https://images.unsplash.com/photo-1559181567-c3190bafec14?w=120&h=120&fit=crop&q=80",  // cherries
  ],
  [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=120&fit=crop&q=80",  // dal/lentils
    "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=120&h=120&fit=crop&q=80",  // rice
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=120&h=120&fit=crop&q=80",  // coffee
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=120&h=120&fit=crop&q=80",  // biscuits
    "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=120&h=120&fit=crop&q=80",  // oil
    "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=120&h=120&fit=crop&q=80",  // yogurt
  ],
  [
    "https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?w=120&h=120&fit=crop&q=80",  // chocolate
    "https://images.unsplash.com/photo-1563291074-2bf8677ac0e5?w=120&h=120&fit=crop&q=80",  // dry fruits
    "https://images.unsplash.com/photo-1477308806442-e5bce33b0595?w=120&h=120&fit=crop&q=80",  // cereal
    "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=120&h=120&fit=crop&q=80",  // chips
    "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=120&h=120&fit=crop&q=80",  // juice
    "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=120&h=120&fit=crop&q=80",  // grocery
  ],
];

const SIGNUP_HINT_PATTERNS = [
  "signup",
  "sign up",
  "register",
  "create account",
  "new user",
  "not found",
  "does not exist",
];

function ProductRibbon({ items, reverse = false, duration = 18 }) {
  const repeatedItems = [...items, ...items];

  return (
    <div className="overflow-hidden">
      <motion.div
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
        className="flex w-max gap-4"
      >
        {repeatedItems.map((imgUrl, index) => (
          <div
            key={`${imgUrl}-${index}`}
            className="flex h-[85px] w-[85px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-[#eef1f5] bg-[#f7f7f8] shadow-[0_10px_18px_rgba(15,23,42,0.05)] sm:h-[100px] sm:w-[100px]"
          >
            <img
              src={imgUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                // Hide the entire tile if image fails to load
                const tile = e.currentTarget.parentElement;
                if (tile) tile.style.display = 'none';
              }}
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
  const appName = settings?.appName || "Zeppe";
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);

  // Detect desktop viewport
  useEffect(() => {
    const handleResize = () => setIsDesktopViewport(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // When accessed directly on route (not via header prop), show as modal on desktop
  const shouldShowAsModal = isModal || (isDesktopViewport && (routeLocation.pathname === "/login" || routeLocation.pathname === "/signup"));
  const actualIsSignup = isModal ? isSignup : routeLocation.pathname === "/signup";

  const isSignupRoute = actualIsSignup;
  const [isSignupMode, setIsSignupMode] = useState(isSignupRoute);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [timer, setTimer] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    name: "",
  });
  const otpRefs = useRef([]);

  useEffect(() => {
    setIsSignupMode(isSignupRoute);
    setShowOtp(false);
    setFormData((prev) => ({ ...prev, otp: "" }));
  }, [isSignupRoute]);

  useEffect(() => {
    if (timer <= 0) return undefined;
    const interval = setInterval(() => setTimer((current) => current - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Disable scroll when login page is open - comprehensive approach
  useEffect(() => {
    // Store original scroll position
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    // Prevent all scroll mechanisms
    const preventScroll = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Apply styles to disable scrolling
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.height = "100%";
    document.documentElement.style.position = "fixed";
    document.documentElement.style.width = "100%";
    document.documentElement.style.top = `-${scrollTop}px`;
    document.documentElement.style.left = `-${scrollLeft}px`;

    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = "0";
    document.body.style.left = "0";
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    // Disable scroll events
    document.addEventListener("wheel", preventScroll, { passive: false });
    document.addEventListener("touchmove", preventScroll, { passive: false });
    document.addEventListener("scroll", preventScroll, { passive: false });

    return () => {
      // Remove event listeners
      document.removeEventListener("wheel", preventScroll);
      document.removeEventListener("touchmove", preventScroll);
      document.removeEventListener("scroll", preventScroll);

      // Restore styles
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
      document.documentElement.style.position = "";
      document.documentElement.style.width = "";
      document.documentElement.style.top = "";
      document.documentElement.style.left = "";

      document.body.style.overflow = "";
      document.body.style.height = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.paddingRight = "";

      // Restore scroll position
      window.scrollTo(scrollLeft, scrollTop);
    };
  }, []);

  const updateFormField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAuthMode = (mode) => {
    if (mode === "signup") {
      navigate("/signup");
      return;
    }
    navigate("/login");
  };

  const sendOtpRequest = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Enter a valid email address");
      return;
    }

    if (isSignupMode && !formData.name.trim()) {
      toast.error("Enter your full name to create account");
      return;
    }

    setIsLoading(true);
    try {
      if (isSignupMode) {
        await customerApi.sendSignupOtp({
          name: formData.name.trim(),
          email: formData.email,
        });
      } else {
        try {
          await customerApi.sendLoginOtp({ email: formData.email });
        } catch (error) {
          const apiMessage = String(
            error?.response?.data?.message || error?.message || "",
          ).toLowerCase();

          if (SIGNUP_HINT_PATTERNS.some((pattern) => apiMessage.includes(pattern))) {
            setIsSignupMode(true);
            toast.info("New account ke liye name add karke continue karo");
            return;
          }

          throw error;
        }
      }

      setShowOtp(true);
      setTimer(30);
      toast.success("OTP sent to your email");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (formData.otp.length < 4) {
      toast.error("Enter the valid OTP");
      return;
    }

    setIsLoading(true);
    try {
      const response = await customerApi.verifyOtp({
        email: formData.email,
        otp: formData.otp,
      });
      const { token, customer } = response.data.result;
      login({ ...customer, token, role: "customer" });
      toast.success("Successfully logged in");
      navigate("/");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpInput = (index, value) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    const otpArray = formData.otp.padEnd(4, " ").split("");
    otpArray[index] = nextValue || " ";
    updateFormField("otp", otpArray.join("").replace(/\s/g, ""));

    if (nextValue && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace" && !formData.otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className={`${shouldShowAsModal ? 'fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-[9999]' : 'min-h-screen'} bg-[#f3f4f6] px-0 py-0 overflow-hidden ${!shouldShowAsModal ? 'md:fixed md:inset-0 md:bg-black/50 md:backdrop-blur-md md:flex md:items-center md:justify-center md:p-4 md:z-[9999]' : ''}`}>
      <div className={`relative bg-white ${shouldShowAsModal ? 'h-auto w-[400px] rounded-2xl shadow-2xl overflow-y-auto' : 'min-h-screen w-full overflow-hidden md:min-h-fit md:w-fit md:max-w-[400px] md:rounded-2xl md:shadow-2xl md:overflow-y-auto'}`}>
        <button
          type="button"
          onClick={() => {
            if (shouldShowAsModal) {
              if (onClose) {
                onClose();
              } else {
                navigate("/");
              }
            } else {
              navigate("/");
            }
          }}
          className={`absolute z-20 ${shouldShowAsModal ? 'right-2 top-2 h-8 w-8 flex items-center justify-center rounded-full bg-black px-0 py-0 text-[16px] font-bold text-white shadow-sm hover:bg-gray-800' : 'right-4 top-4 rounded-full bg-black px-3 py-1.5 text-[11px] font-bold text-white shadow-sm md:hidden'}`}
        >
          {shouldShowAsModal ? '✕' : 'Skip'}
        </button>

        <div className="relative overflow-hidden px-4 pb-4 pt-2 md:hidden">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#f9fbff] to-transparent" />
          <div className="relative space-y-3 pt-2">
            <ProductRibbon items={PRODUCT_ROWS[0]} duration={18} />
            <ProductRibbon items={PRODUCT_ROWS[1]} reverse duration={20} />
            <ProductRibbon items={PRODUCT_ROWS[2]} duration={22} />
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col px-5 pb-8 pt-2 overflow-hidden md:flex-none md:px-6 md:py-6 md:justify-center">
          <div className="mt-0 flex flex-col items-center text-center">
            <div className="flex min-h-[0px] items-center justify-center">
              <h2 className="text-6xl font-semibold italic tracking-tight text-gray-800 md:text-4xl" style={{ letterSpacing: "-0.02em" }}>
                zeppe
              </h2>
            </div>
            <h1 className="mt-2 text-[1.9rem] font-semibold tracking-tight text-gray-900 md:text-xl">
              India&apos;s Quickest App
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Log In or Sign Up
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!showOtp ? (
              <motion.form
                key="auth-entry"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendOtpRequest();
                }}
                className="mt-2 md:mt-3"
              >
                {isSignupMode && (
                  <div className="mb-3 rounded-xl border border-[#d9dde5] bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <User size={18} className="text-slate-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(event) => updateFormField("name", event.target.value)}
                        placeholder="Enter full name"
                        className="w-full border-0 bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                )}

                <div className="flex overflow-hidden rounded-xl border border-[#d9dde5] bg-white">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      updateFormField("email", event.target.value)
                    }
                    placeholder="Enter your email address"
                    className="h-12 w-full border-0 bg-transparent px-4 text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-black text-sm font-black text-white transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 md:mt-2 md:h-11 md:text-xs"
                >
                  {isLoading ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    "Continue"
                  )}
                </button>

                <div className="mt-4 text-center md:mt-2">
                  {isSignupMode ? (
                    <button
                      type="button"
                      onClick={() => toggleAuthMode("login")}
                      className="text-xs font-semibold text-slate-500 underline underline-offset-2"
                    >
                      Already have an account? Log in
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleAuthMode("signup")}
                      className="text-xs font-semibold text-slate-500 underline underline-offset-2"
                    >
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
                onSubmit={handleVerifyOtp}
                className="mt-7"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowOtp(false);
                    updateFormField("otp", "");
                  }}
                  className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
                >
                  <ChevronLeft size={16} />
                  Change email
                </button>

                <div className="mb-5 text-center md:mb-3">
                  <h2 className="text-xl font-black tracking-tight text-[#111827] md:text-lg">
                    Verify your email address
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-500 md:text-xs">
                    OTP sent to {formData.email}
                  </p>
                </div>

                <div className="flex justify-center gap-3 md:gap-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        otpRefs.current[index] = element;
                      }}
                      type="tel"
                      inputMode="numeric"
                      maxLength={1}
                      value={formData.otp[index] || ""}
                      onChange={(event) => handleOtpInput(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      className="h-14 w-14 rounded-2xl border border-[#d9dde5] bg-white text-center text-xl font-black text-slate-900 outline-none focus:border-black md:h-12 md:w-12 md:text-lg md:rounded-xl"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-black text-sm font-black text-white transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 md:mt-3 md:h-11 md:text-xs"
                >
                  {isLoading ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <>
                      Verify & Continue
                      <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 md:mt-2 md:text-[11px]">
                  <span>Didn&apos;t receive OTP?</span>
                  <button
                    type="button"
                    disabled={timer > 0 || isLoading}
                    onClick={() => {
                      void sendOtpRequest();
                    }}
                    className="font-bold text-slate-700 underline underline-offset-2 disabled:text-slate-300"
                  >
                    {timer > 0 ? `Resend in ${timer}s` : "Resend"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-[10px] font-medium leading-4 text-slate-400 md:mt-3">
            By continuing, you agree to our{" "}
            <Link
              to="/terms"
              className="font-semibold text-slate-500 underline underline-offset-2"
            >
              Terms of service
            </Link>{" "}
            &{" "}
            <Link
              to="/privacy"
              className="font-semibold text-slate-500 underline underline-offset-2"
            >
              Privacy policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;
