/**
 * Reusable service to open Razorpay Checkout
 */
export const openRazorpayCheckout = ({
  orderId,
  amount,
  currency,
  name = "Zeppe",
  description = "Subscription Payment",
  prefill = {},
  onSuccess,
  onError,
}) => {
  if (typeof window.Razorpay === "undefined") {
    console.error("Razorpay SDK not loaded");
    if (onError) onError(new Error("Razorpay SDK not loaded"));
    return;
  }

  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID || "", // Public key from env
    amount: amount,
    currency: currency,
    name: name,
    description: description,
    order_id: orderId,
    prefill: {
      name: prefill.name || "",
      email: prefill.email || "",
      contact: prefill.contact || "",
    },
    theme: {
      color: "#10b981", // Emerald-600 to match Zeppe theme
    },
    handler: function (response) {
      if (onSuccess) {
        onSuccess({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        });
      }
    },
    modal: {
      ondismiss: function () {
        if (onError) onError(new Error("Payment cancelled by user"));
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};
