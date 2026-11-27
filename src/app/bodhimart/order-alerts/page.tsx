import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import { Copy } from '../language';

const path = '/bodhimart/order-alerts';
const signIn = '/login?redirect=' + encodeURIComponent(path);

async function savePreferences(form: FormData) {
  'use server';

  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect(signIn);

  const { error } = await client.rpc('bodhimart_order_alert_settings', {
    p_sms: form.get('sms') === 'on',
    p_whatsapp: form.get('whatsapp') === 'on',
  });
  redirect(path + (error ? '?result=error' : '?result=saved'));
}

export default async function OrderAlerts({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect(signIn);
  const { result } = await searchParams;
  const { data, error } = await client.rpc('bodhimart_order_alert_settings');

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <Link href="/bodhimart/account" className="text-green-800 underline"><Copy en="Account" hi="खाता" /></Link>
      <h1 className="text-2xl font-bold"><Copy en="Order notifications" hi="ऑर्डर सूचनाएँ" /></h1>
      <p><Copy en="Order emails go to your verified email address when delivery is enabled." hi="सेवा चालू होने पर ऑर्डर ईमेल आपके सत्यापित ईमेल पते पर भेजे जाएँगे।" /></p>
      {result === 'saved' && <p role="status"><Copy en="Preferences saved." hi="पसंद सहेजी गई।" /></p>}
      {(error || result === 'error') && <p role="alert"><Copy en="Notification preferences could not be loaded or saved." hi="सूचना की पसंद लोड या सहेजी नहीं जा सकी।" /></p>}
      {!error && data?.hasPhone === false && <p><Copy en="Verify a mobile number on your account before enabling SMS or WhatsApp order updates." hi="एसएमएस या व्हाट्सऐप पर ऑर्डर की जानकारी पाने से पहले खाते का मोबाइल नंबर सत्यापित करें।" /></p>}
      {!error && data?.hasPhone === true && (
        <form action={savePreferences} className="space-y-3 rounded-xl border bg-white p-4">
          <p><Copy en="Choose where BodhiMart can send order updates to your verified mobile number." hi="चुनें कि BodhiMart आपके सत्यापित मोबाइल नंबर पर ऑर्डर की जानकारी कैसे भेजे।" /></p>
          <label className="flex items-center gap-3"><input type="checkbox" name="sms" defaultChecked={data.sms} style={{ width: 18, margin: 0 }} /><Copy en="SMS" hi="एसएमएस" /></label>
          <label className="flex items-center gap-3"><input type="checkbox" name="whatsapp" defaultChecked={data.whatsapp} style={{ width: 18, margin: 0 }} /><Copy en="WhatsApp" hi="व्हाट्सऐप" /></label>
          <button className="min-h-11 rounded-lg bg-green-800 px-4 font-semibold text-white"><Copy en="Save preferences" hi="पसंद सहेजें" /></button>
        </form>
      )}
    </main>
  );
}
