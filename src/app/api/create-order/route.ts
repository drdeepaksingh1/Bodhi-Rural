import { getPayableOrder, razorpayTestClient } from '../../../lib/razorpay-test';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const order = await getPayableOrder(body?.order_id);
  if ('error' in order) return Response.json({ error: order.error }, { status: order.status });
  const razorpay = razorpayTestClient();
  if (!razorpay) return Response.json({ error: 'Test payments are unavailable.' }, { status: 503 });

  try {
    const { id, amount, currency } = await razorpay.api.orders.create(order);
    return Response.json({ order_id: id, amount, currency, key_id: razorpay.key_id });
  } catch {
    return Response.json({ error: 'Could not start the Razorpay test payment.' }, { status: 500 });
  }
}
