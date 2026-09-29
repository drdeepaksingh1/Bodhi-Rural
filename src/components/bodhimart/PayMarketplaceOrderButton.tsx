"use client";

import { useEffect, useRef, useState } from "react";

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayInstance = {
  open: () => void;
  on: (event: string, callback: (response: unknown) => void) => void;
};
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

export default function PayMarketplaceOrderButton({
  marketplaceOrderId,
  orderNumber,
  autoStart = false,
  onPaid,
}: {
  marketplaceOrderId: string;
  orderNumber: string;
  autoStart?: boolean;
  onPaid: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      void beginPayment();
    }
  }, [autoStart]);

  async function beginPayment() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const attemptId = crypto.randomUUID();
      const response = await fetch("/api/bodhimart/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketplaceOrderId, attemptId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to start online payment.");

      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Secure payment checkout could not be loaded."));
          document.body.appendChild(script);
        });
      }
      if (!window.Razorpay) throw new Error("Secure payment checkout could not be loaded.");

      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "Bodhi Rural Marketplace",
        description: "Order " + orderNumber,
        order_id: data.razorpayOrderId,
        theme: { color: "#15803d" },
        handler: async (payment: RazorpaySuccess) => {
          try {
            const verificationResponse = await fetch("/api/bodhimart/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                marketplaceOrderId,
                razorpayOrderId: payment.razorpay_order_id,
                razorpayPaymentId: payment.razorpay_payment_id,
                razorpaySignature: payment.razorpay_signature,
              }),
            });
            const verification = await verificationResponse.json();
            if (verification.paymentStatus === "PAID") {
              setError("");
              onPaid();
            } else {
              setError(verification.message || "Payment is being confirmed. Check your order status shortly.");
            }
          } catch {
            setError("Payment is being confirmed. Check your order status shortly.");
          }
        },
      });
      checkout.on("payment.failed", () => {
        setError("Payment did not complete. You can retry securely.");
      });
      checkout.open();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start online payment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" disabled={busy} onClick={() => void beginPayment()}
        className="w-full rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-wait disabled:opacity-60">
        {busy ? "Opening secure payment…" : "Pay online"}
      </button>
      {error && <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
    </div>
  );
}
