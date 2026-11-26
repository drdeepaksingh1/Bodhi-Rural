import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import { Copy } from '../../language';

const route = '/bodhimart/admin/delivery';
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

type Options = {
  orders: { id: string; order_number: string; order_status: string; partner_id: string | null }[];
  partners: { id: string; name: string }[];
};

async function assign(form: FormData) {
  'use server';

  const order = form.get('order');
  const partner = form.get('partner');
  if (typeof order !== 'string' || !uuid.test(order)
    || typeof partner !== 'string' || !uuid.test(partner)) redirect(route + '?result=failed');

  const client = await createClient();
  const { error } = await client.rpc('bodhimart_assign_delivery', {
    p_order_id: order,
    p_partner_id: partner,
  });

  redirect(route + (error ? '?result=failed' : '?result=saved'));
}

export default async function DispatchPage({ searchParams }: {
  searchParams: Promise<{ result?: string }>;
}) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/login?redirect=%2Fbodhimart%2Fadmin%2Fdelivery');

  const { data, error } = await client.rpc('bodhimart_delivery_dispatch_options');
  const options = data as Options | null;
  const { result } = await searchParams;

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-5 py-10">
      <Link href="/bodhimart/admin/sellers" className="text-green-800 underline">
        <Copy en="Seller administration" hi="विक्रेता प्रबंधन" />
      </Link>
      <h1 className="text-3xl font-bold text-green-950">
        <Copy en="Assign deliveries" hi="डिलीवरी सौंपें" />
      </h1>
      {error || !options ? (
        <p role="status"><Copy en="Delivery assignment is unavailable for this account." hi="इस खाते के लिए डिलीवरी असाइनमेंट उपलब्ध नहीं है।" /></p>
      ) : <>
        {result === 'saved' && <p role="status"><Copy en="Delivery assignment saved." hi="डिलीवरी असाइनमेंट सहेजा गया।" /></p>}
        {result === 'failed' && <p role="alert"><Copy en="Could not assign this delivery. Check the order and partner and try again." hi="डिलीवरी नहीं सौंपी जा सकी। ऑर्डर और पार्टनर जाँचकर फिर कोशिश करें।" /></p>}
        {options.orders.length === 0 && <p><Copy en="No delivery orders are available for assignment." hi="सौंपने के लिए कोई डिलीवरी ऑर्डर उपलब्ध नहीं है।" /></p>}
        {options.partners.length === 0 && <p><Copy en="There are no active delivery partners." hi="कोई सक्रिय डिलीवरी पार्टनर नहीं है।" /></p>}
        <ul className="grid gap-3">
          {options.orders.map((order) => (
            <li key={order.id} className="rounded-xl border bg-white p-4">
              <p className="font-semibold">{order.order_number}</p>
              <p className="text-sm text-gray-600">{order.order_status.replaceAll('_', ' ')}</p>
              {options.partners.length > 0 && (
                <form action={assign} className="mt-3 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="order" value={order.id} />
                  <label className="grid gap-1 text-sm">
                    <Copy en="Delivery partner" hi="डिलीवरी पार्टनर" />
                    <select name="partner" required defaultValue={options.partners.some((p) => p.id === order.partner_id) ? order.partner_id! : ''} className="rounded-lg border p-2">
                      <option value="">—</option>
                      {options.partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
                    </select>
                  </label>
                  <button className="rounded-lg bg-green-800 px-4 py-2 font-semibold text-white">
                    <Copy en="Save assignment" hi="असाइनमेंट सहेजें" />
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </>}
    </main>
  );
}
