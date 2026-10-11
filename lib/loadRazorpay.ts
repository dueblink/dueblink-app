// Loads Razorpay's checkout.js only when a payment is about to start.
//
// Usage, right before `new window.Razorpay(options)`:
//
//   const ok = await loadRazorpay();
//   if (!ok) { /* show "Payment could not load, please try again" */ return; }
//   const rzp = new (window as any).Razorpay(options);
//   rzp.open();

const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let loading: Promise<boolean> | null = null;

export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);
  if (loading) return loading;

  loading = new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SRC;
    script.async = true;
    script.onload = () => resolve(!!(window as any).Razorpay);
    script.onerror = () => {
      // Allow a retry on the next click instead of caching the failure.
      loading = null;
      script.remove();
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return loading;
}