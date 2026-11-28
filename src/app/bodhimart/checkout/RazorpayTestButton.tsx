'use client';

import Script from 'next/script';
import { useState } from 'react';

type PaymentResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type Checkout = {
  open(): void;
  on(event: 'payment.failed', handler: () => void): void;
};

type CheckoutOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  handler: (payment: PaymentResult) => Promise<void>;
  modal: { ondismiss: () => void };
};

async function post(path: string, body: object) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'The payment request failed.');
  return result;
}

export default function RazorpayTestButton({ orderId }: { orderId: string }) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState('');
  if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_test_')) return null;

  async function pay() {
    if (busy || verified) return;
    setBusy(true);
    setMessage('');
    try {
      const Razorpay = (window as Window & { Razorpay?: new (options: CheckoutOptions) => Checkout }).Razorpay;
      if (!Razorpay) throw new Error('Checkout did not load. Refresh the page and try again.');
      const order = await post('/api/create-order', { order_id: orderId });
      let verifying = false;
      let failed = false;
      const checkout = new Razorpay({
        key: order.key_id,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        name: 'BodhiMart',
        handler: async (payment) => {
          verifying = true;
          setMessage('Verifying test payment…');
          try {
            await post('/api/verify-payment', { ...payment, order_id: orderId });
            setVerified(true);
            setMessage('Test payment verified. Your order balance is unchanged.');
          } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Could not verify test payment.');
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => {
          if (verifying) return;
          setBusy(false);
          if (!failed) setMessage('Test payment cancelled.');
        } },
      });
      checkout.on('payment.failed', () => {
        failed = true;
        setMessage('Test payment failed. Retry in the payment window or close it.');
      });
      checkout.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not open checkout.');
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 space-y-2">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onReady={() => setReady(true)}
        onError={() => setMessage('Razorpay checkout could not load.')} />
      <button type="button" onClick={pay} disabled={!ready || busy || verified}
        className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white disabled:opacity-50">
        Pay with Razorpay (Test Mode)
      </button>
      {message && <p role="status" className="text-sm">{message}</p>}
    </div>
  );
}
