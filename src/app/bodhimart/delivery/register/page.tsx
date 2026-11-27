import Link from 'next/link';
import { ApplicationTerms, applicationTermsVersion } from '../../ApplicationTerms';
import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import { Copy } from '../../language';

const route = '/bodhimart/delivery/register';
const login = '/login?redirect=' + encodeURIComponent(route);

async function submit(form: FormData) {
  'use server';
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect(login);
  if (form.get('application_terms') !== applicationTermsVersion) redirect(route + '?failed=1');
  const full_name = String(form.get('name') ?? '').trim();
  const phone = String(form.get('phone') ?? '').trim();
  const service_area = String(form.get('area') ?? '').trim();
  if (full_name.length < 2 || full_name.length > 100 || !/^[0-9]{10}$/.test(phone)
    || service_area.length < 2 || service_area.length > 160) redirect(route + '?failed=1');
  const { error } = await client.from('bodhimart_delivery_partner_applications')
    .insert({ user_id: user.id, full_name, phone, service_area, application_terms_version: applicationTermsVersion });
  redirect(route + (error && error.code !== '23505' ? '?failed=1' : ''));
}

export default async function DeliveryRegistration({ searchParams }: { searchParams: Promise<{ failed?: string }> }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  const { failed } = await searchParams;
  const application = user ? await client.from('bodhimart_delivery_partner_applications')
    .select('submitted_at').eq('user_id', user.id).maybeSingle() : null;
  return (
    <main className="mx-auto max-w-lg space-y-5 px-5 py-8">
      <h1 className="text-3xl font-bold"><Copy en="Apply as a delivery partner" hi="डिलीवरी पार्टनर के लिए आवेदन करें" /></h1>
      <p><Copy en="BodhiMart reviews applications before granting delivery access." hi="डिलीवरी की अनुमति मिलने से पहले BodhiMart आवेदन की समीक्षा करता है।" /></p>
      {!user ? <div className="flex flex-wrap gap-4">
        <Link className="underline" href={login}><Copy en="Sign in" hi="लॉग इन करें" /></Link>
        <Link className="underline" href={'/bodhimart/register?redirect=' + encodeURIComponent(route)}><Copy en="Create account" hi="खाता बनाएँ" /></Link>
      </div> : application?.error ? <p role="alert"><Copy en="Applications are temporarily unavailable." hi="आवेदन अभी उपलब्ध नहीं हैं।" /></p>
        : application?.data ? <p role="status"><Copy en="Your application was received." hi="आपका आवेदन प्राप्त हो गया है।" /></p> : (
          <form action={submit} className="space-y-4 rounded-2xl border p-5">
            {failed && <p role="alert"><Copy en="Could not submit. Check your details and try again." hi="आवेदन नहीं भेजा जा सका। जानकारी जाँचकर फिर कोशिश करें।" /></p>}
            <label className="grid gap-1"><Copy en="Full name" hi="पूरा नाम" /><input name="name" autoComplete="name" minLength={2} maxLength={100} required className="rounded-lg border p-3" /></label>
            <label className="grid gap-1"><Copy en="Mobile number" hi="मोबाइल नंबर" /><input name="phone" autoComplete="tel-national" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required className="rounded-lg border p-3" /></label>
            <label className="grid gap-1"><Copy en="Village, block or town" hi="गाँव, प्रखंड या शहर" /><input name="area" minLength={2} maxLength={160} required className="rounded-lg border p-3" /></label>
            <ApplicationTerms role="delivery" />
            <button className="min-h-11 rounded-lg bg-green-800 px-4 font-semibold text-white"><Copy en="Submit application" hi="आवेदन जमा करें" /></button>
          </form>
        )}
    </main>
  );
}
