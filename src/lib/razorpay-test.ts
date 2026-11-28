import Razorpay from 'razorpay';
import { createClient } from './supabase/server';

export function razorpayTestClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id?.startsWith('rzp_test_') || !key_secret) return null;
  return { api: new Razorpay({ key_id, key_secret }), key_id, key_secret };
}

export async function getPayableOrder(orderId: unknown) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 401, error: 'Sign in to pay for your order.' } as const;
  if (typeof orderId !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(orderId)) {
    return { status: 400, error: 'A valid order ID is required.' } as const;
  }
  const { data, error } = await supabase.from('marketplace_orders')
    .select('id,total_amount,payment_status,order_status')
    .eq('id', orderId).eq('customer_user_id', user.id).maybeSingle();
  if (error) return { status: 500, error: 'Could not load the order.' } as const;
  if (!data) return { status: 404, error: 'Order not found.' } as const;
  if (data.payment_status !== 'PENDING' || ['CANCELLED', 'RETURNED', 'REFUNDED', 'DELIVERED'].includes(data.order_status)) {
    return { status: 409, error: 'This order cannot accept a test payment.' } as const;
  }
  const amount = Math.round(Number(data.total_amount) * 100);
  if (!Number.isSafeInteger(amount) || amount < 100) {
    return { status: 400, error: 'The minimum payment is ₹1.' } as const;
  }
  return { amount, receipt: data.id as string, currency: 'INR' } as const;
}
