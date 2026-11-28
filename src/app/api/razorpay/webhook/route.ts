import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { razorpayTestClient } from '../../../../lib/razorpay-test';

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_TEST_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const razorpay = razorpayTestClient();
  if (!secret || !razorpay || !supabaseUrl || !serviceKey) {
    return Response.json({ error: 'Test payment reconciliation is unavailable.' }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';
  const expected = createHmac('sha256', secret).update(body).digest();
  if (!/^[a-f0-9]{64}$/i.test(signature) || !timingSafeEqual(expected, Buffer.from(signature, 'hex'))) {
    return Response.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return Response.json({ error: 'Invalid event.' }, { status: 400 });
  }
  if (event?.event !== 'payment.captured') return Response.json({ received: true });
  const paymentId = event.payload?.payment?.entity?.id;
  if (typeof paymentId !== 'string' || !/^pay_[A-Za-z0-9]{1,64}$/.test(paymentId)) {
    return Response.json({ error: 'Invalid payment ID.' }, { status: 400 });
  }

  try {
    const payment = await razorpay.api.payments.fetch(paymentId);
    if (payment.status !== 'captured' || !payment.order_id || payment.currency !== 'INR') {
      return Response.json({ error: 'Capture is not confirmed.' }, { status: 409 });
    }
    const providerOrder = await razorpay.api.orders.fetch(payment.order_id);
    const orderId = providerOrder.receipt;
    if (!orderId || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(orderId)) {
      return Response.json({ received: true });
    }

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: order, error: readError } = await supabase.from('marketplace_orders')
      .select('id,total_amount').eq('id', orderId).maybeSingle();
    if (readError) throw readError;
    if (!order) return Response.json({ received: true });

    const amount = Math.round(Number(order.total_amount) * 100);
    if (!Number.isSafeInteger(amount) || amount < 100 || Number(payment.amount) !== amount
      || Number(providerOrder.amount) !== amount || providerOrder.currency !== payment.currency) {
      return Response.json({ error: 'The captured amount does not match the order.' }, { status: 409 });
    }

    const { error: saveError } = await supabase.from('bodhimart_razorpay_test_captures').upsert({
      payment_id: paymentId,
      razorpay_order_id: providerOrder.id,
      order_id: order.id,
      amount_paise: amount,
    }, { onConflict: 'payment_id', ignoreDuplicates: true });
    if (saveError) throw saveError;
    return Response.json({ received: true, test_mode: true });
  } catch {
    return Response.json({ error: 'Could not reconcile the test payment.' }, { status: 500 });
  }
}
