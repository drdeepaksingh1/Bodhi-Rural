import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { Copy } from '../language';

type Delivery = { order_number: string; order_status: string; assigned_at: string };

type Offer = { order_id: string; order_number: string; expires_at: string };

async function acceptOffer(form: FormData) {
  'use server';

  const id = form.get('order');
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) {
    redirect('/bodhimart/delivery?offer=error');
  }
  const client = await createClient();
  const { data, error } = await client.rpc('bodhimart_accept_delivery_offer', { p_order_id: id });
  const result = error ? 'error' : data === true ? 'accepted' : 'closed';
  redirect('/bodhimart/delivery?offer=' + result);
}

export default async function DeliveryPartnerPage({ searchParams }: { searchParams: Promise<{ offer?: string }> }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/login?redirect=%2Fbodhimart%2Fdelivery');

  const { data, error } = await client.rpc('bodhimart_my_deliveries');
  const deliveries: Delivery[] = data ?? [];

  const { offer } = await searchParams;
  const { data: offerData, error: offerError } = error
    ? { data: null, error: null }
    : await client.rpc('bodhimart_my_delivery_offers');
  const offers: Offer[] = offerData ?? [];

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/bodhimart" className="text-sm font-semibold text-green-800 underline">
        <Copy en="Back to BodhiMart" hi="BodhiMart पर लौटें" />
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-green-950">
        <Copy en="Delivery partner" hi="डिलीवरी पार्टनर" />
      </h1>
      {offer === 'accepted' && <p role="status"><Copy en="Delivery assigned to you." hi="डिलीवरी आपको सौंपी गई है।" /></p>}
      {offer === 'closed' && <p role="status"><Copy en="This offer expired or is already assigned." hi="ऑफ़र समाप्त हो गया है या डिलीवरी किसी को सौंपी जा चुकी है।" /></p>}
      {offer === 'error' && <p role="alert"><Copy en="Could not accept the offer. Please try again." hi="ऑफ़र स्वीकार नहीं हुआ। फिर कोशिश करें।" /></p>}
      {offerError && <p role="status"><Copy en="Delivery offers are temporarily unavailable." hi="डिलीवरी ऑफ़र अभी उपलब्ध नहीं हैं।" /></p>}
      {offers.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold"><Copy en="Delivery offers" hi="डिलीवरी ऑफ़र" /></h2>
          <ul className="mt-3 grid gap-3">
            {offers.map((item) => (
              <li key={item.order_id} className="rounded-xl border bg-white p-4">
                <strong>{item.order_number}</strong>
                <form action={acceptOffer} className="mt-2">
                  <input type="hidden" name="order" value={item.order_id} />
                  <button className="rounded-lg bg-green-800 px-4 py-2 font-semibold text-white">
                    <Copy en="Accept delivery" hi="डिलीवरी स्वीकार करें" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
      {error ? (
        <p role="status" className="mt-5 rounded-xl bg-amber-50 p-4">
          {error.code === '42501'
            ? <Copy en="Sign in with an approved delivery partner account." hi="स्वीकृत डिलीवरी पार्टनर खाते से लॉग इन करें।" />
            : <Copy en="Delivery assignments are temporarily unavailable." hi="डिलीवरी असाइनमेंट अभी उपलब्ध नहीं हैं।" />}
        </p>
      ) : (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">
            <Copy en="Your assigned orders" hi="आपको सौंपे गए ऑर्डर" />
          </h2>
          {deliveries.length === 0 ? (
            <p className="mt-3 text-gray-700">
              <Copy en="You have no assigned orders." hi="अभी आपको कोई ऑर्डर नहीं सौंपा गया है।" />
            </p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {deliveries.map((order) => (
                <li key={order.order_number} className="rounded-xl border bg-white p-4">
                  <strong>{order.order_number}</strong>
                  <p>{order.order_status.replaceAll('_', ' ')}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
