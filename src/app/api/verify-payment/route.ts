import { createHmac, timingSafeEqual } from 'node:crypto';
import { getPayableOrder, razorpayTestClient } from '../../../lib/razorpay-test';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const order = await getPayableOrder(body?.order_id);
  if ('error' in order) return Response.json({ error: order.error }, { status: order.status });

  const providerOrder = body?.razorpay_order_id;
  const paymentId = body?.razorpay_payment_id;
  const signature = body?.razorpay_signature;
  if (typeof providerOrder !== 'string' || !/^order_[A-Za-z0-9]{1,64}$/.test(providerOrder)
    || typeof paymentId !== 'string' || !/^pay_[A-Za-z0-9]{1,64}$/.test(paymentId)
    || typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) {
    return Response.json({ error: 'Required payment fields are missing or invalid.' }, { status: 400 });
  }
  const razorpay = razorpayTestClient();
  if (!razorpay) return Response.json({ error: 'Test payments are unavailable.' }, { status: 503 });

  try {
    const providerRecord = await razorpay.api.orders.fetch(providerOrder);
    if (providerRecord.receipt !== order.receipt || Number(providerRecord.amount) !== order.amount
      || providerRecord.currency !== order.currency) {
      return Response.json({ error: 'Payment does not match your order.' }, { status: 400 });
    }
    const expected = createHmac('sha256', razorpay.key_secret)
      .update(providerRecord.id + '|' + paymentId).digest();
    if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) {
      return Response.json({ error: 'Payment signature did not match.' }, { status: 400 });
    }
    const payment = await razorpay.api.payments.fetch(paymentId);
    if (payment.status !== 'captured' || payment.order_id !== providerRecord.id
      || Number(payment.amount) !== order.amount || payment.currency !== order.currency) {
      return Response.json({ error: 'Payment capture is not confirmed.' }, { status: 409 });
    }
    return Response.json({ success: true, test_mode: true });
  } catch {
    return Response.json({ error: 'Could not verify the Razorpay test payment.' }, { status: 500 });
  }
}
