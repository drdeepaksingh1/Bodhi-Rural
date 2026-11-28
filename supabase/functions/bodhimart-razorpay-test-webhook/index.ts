// @ts-nocheck — compiled by the Supabase Edge Runtime.
import { createClient } from 'npm:@supabase/supabase-js@2.57.0';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response(null, { status: 405 });
  const secret = Deno.env.get('RAZORPAY_TEST_WEBHOOK_SECRET');
  const keyId = Deno.env.get('RAZORPAY_TEST_KEY_ID');
  const keySecret = Deno.env.get('RAZORPAY_TEST_KEY_SECRET');
  if (!secret || !keyId?.startsWith('rzp_test_') || !keySecret) {
    return new Response('Sandbox webhook is not configured.', { status: 503 });
  }
  const signature = request.headers.get('x-razorpay-signature') ?? '';
  if (!/^[a-f0-9]{64}$/i.test(signature)) return new Response(null, { status: 401 });
  const raw = await request.text();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const digest = Uint8Array.from(signature.match(/../g)!, (byte) => parseInt(byte, 16));
  if (!await crypto.subtle.verify('HMAC', key, digest, encoder.encode(raw))) return new Response(null, { status: 401 });

  let event;
  try { event = JSON.parse(raw); } catch { return new Response(null, { status: 400 }); }
  if (event?.event !== 'payment.captured') return Response.json({ received: true });
  const id = event.payload?.payment?.entity?.id;
  if (typeof id !== 'string' || !/^pay_[a-z0-9]+$/i.test(id)) return new Response(null, { status: 400 });

  async function fetchRazorpay(path: string) {
    const response = await fetch('https://api.razorpay.com/v1/' + path, {
      headers: { Authorization: 'Basic ' + btoa(keyId + ':' + keySecret) },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error('Provider request failed.');
    return response.json();
  }

  try {
    const payment = await fetchRazorpay('payments/' + id);
    if (payment.id !== id || payment.status !== 'captured' || payment.currency !== 'INR'
      || typeof payment.order_id !== 'string' || !/^order_[a-z0-9]+$/i.test(payment.order_id)) {
      return new Response(null, { status: 409 });
    }
    const providerOrder = await fetchRazorpay('orders/' + payment.order_id);
    const receipt = providerOrder.receipt;
    if (typeof receipt !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(receipt)) {
      return Response.json({ received: true });
    }
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data, error } = await db.from('marketplace_orders').select('id,total_amount').eq('id', receipt).maybeSingle();
    if (error) throw error;
    if (!data) return Response.json({ received: true });
    const amount = Math.round(Number(data.total_amount) * 100);
    if (!Number.isSafeInteger(amount) || amount < 100 || providerOrder.id !== payment.order_id
      || providerOrder.currency !== 'INR' || Number(providerOrder.amount) !== amount || Number(payment.amount) !== amount) {
      return new Response(null, { status: 409 });
    }
    const { error: writeError } = await db.from('bodhimart_razorpay_test_captures').upsert({
      payment_id: id, razorpay_order_id: providerOrder.id, order_id: data.id, amount_paise: amount,
    }, { onConflict: 'payment_id', ignoreDuplicates: true });
    if (writeError) throw writeError;
    return Response.json({ received: true, test_mode: true });
  } catch {
    return new Response('Sandbox reconciliation failed.', { status: 500 });
  }
});
