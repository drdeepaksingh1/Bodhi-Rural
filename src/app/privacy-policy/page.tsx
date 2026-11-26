import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Bodhi Rural privacy policy' };

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-5 py-12">
      <h1 className="text-3xl font-bold text-green-950">Bodhi Rural privacy policy</h1>
      <p>Bodhi Rural Livelihood &amp; Agri Private Limited operates the Bodhi Rural app, BodhiFarm and BodhiMart.</p>
      <h2 className="text-xl font-semibold">Information used to provide the service</h2>
      <p>Depending on your role and the features you use, we process account and contact details, farm or shop applications, shop location, delivery addresses, orders and operational records. We use this information for account access, application review, order fulfilment and farm operations.</p>
      <p>The Android app stores your language preference on your device. The Android app displays Bodhi Rural account forms and shop location capture in an in-app web view. Shop location is used for seller onboarding when you choose to provide it.</p>
      <h2 className="text-xl font-semibold">Account deletion and records</h2>
      <p>You can request deletion of your account and associated personal information. Some transaction and audit records may be retained where required for accounting, dispute resolution or legal obligations.</p>
      <p><Link href="/account-deletion" className="text-green-800 underline">Request account deletion</Link></p>
      <h2 className="text-xl font-semibold">Contact</h2>
      <p>For privacy questions, email <a href="mailto:bodhirural@gmail.com" className="text-green-800 underline">bodhirural@gmail.com</a>.</p>
    </main>
  );
}
