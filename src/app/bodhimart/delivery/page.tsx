import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { Copy } from '../language';

type Delivery = { order_number: string; order_status: string; assigned_at: string };

export default async function DeliveryPartnerPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/login?redirect=%2Fbodhimart%2Fdelivery');

  const { data, error } = await client.rpc('bodhimart_my_deliveries');
  const deliveries: Delivery[] = data ?? [];

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/bodhimart" className="text-sm font-semibold text-green-800 underline">
        <Copy en="Back to BodhiMart" hi="BodhiMart पर लौटें" />
      </Link>
      <h1 className="mt-4 text-3xl font-bold text-green-950">
        <Copy en="Delivery partner" hi="डिलीवरी पार्टनर" />
      </h1>
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
