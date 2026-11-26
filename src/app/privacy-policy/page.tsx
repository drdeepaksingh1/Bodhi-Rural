import type { Metadata } from 'next';
import Link from 'next/link';
import { Copy } from '../bodhimart/language';

export const metadata: Metadata = { title: 'Bodhi Rural Privacy Policy' };

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-5 px-5 py-12">
      <h1 className="text-3xl font-bold text-green-950"><Copy en="Bodhi Rural Privacy Policy" hi="बोधि रूरल गोपनीयता नीति" /></h1>
      <p><Copy en="Choose the service you use. The Android app stores your language preference on your device." hi="अपनी सेवा चुनें। Android ऐप आपकी भाषा की पसंद आपके डिवाइस पर सहेजता है।" /></p>
      <nav className="grid gap-3 sm:grid-cols-2">
        <Link className="rounded-lg border border-green-800 p-4 font-semibold text-green-900" href="/privacy-policy/bodhifarm">BodhiFarm</Link>
        <Link className="rounded-lg border border-green-800 p-4 font-semibold text-green-900" href="/privacy-policy/bodhimart">BodhiMart</Link>
      </nav>
      <Link className="text-green-800 underline" href="/account-deletion"><Copy en="Request account deletion" hi="खाता हटाने का अनुरोध करें" /></Link>
    </main>
  );
}
