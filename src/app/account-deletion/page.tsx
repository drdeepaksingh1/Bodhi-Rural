import type { Metadata } from 'next';
import Link from 'next/link';
import { Copy } from '../bodhimart/language';

export const metadata: Metadata = { title: 'Request Bodhi Rural account deletion' };

export default function AccountDeletionPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-5 px-5 py-12">
      <h1 className="text-3xl font-bold text-green-950"><Copy en="Request account deletion" hi="खाता हटाने का अनुरोध करें" /></h1>
      <p><Copy en="For a BodhiFarm or BodhiMart account, email Bodhi Rural from the address registered with your account. Include which account you want deleted. We may ask you to verify ownership." hi="BodhiFarm या BodhiMart खाता हटाने के लिए अपने पंजीकृत ईमेल से बोधि रूरल को लिखें। बताएं कि कौन-सा खाता हटाना है। हम खाते के स्वामित्व की पुष्टि कर सकते हैं।" /></p>
      <a className="inline-flex rounded-lg bg-green-800 px-4 py-3 font-semibold text-white"
        href="mailto:bodhirural@gmail.com?subject=Bodhi%20Rural%20account%20deletion">
        <Copy en="Email a deletion request" hi="खाता हटाने का अनुरोध ईमेल करें" />
      </a>
      <p><Copy en="This sends a request for manual review. Please keep passwords, verification codes, and bank details out of your email." hi="इस ईमेल से समीक्षा के लिए अनुरोध भेजा जाता है। ईमेल में पासवर्ड, सत्यापन कोड या बैंक विवरण साझा न करें।" /></p>
      <Link className="text-green-800 underline" href="/privacy-policy"><Copy en="Privacy policy" hi="गोपनीयता नीति" /></Link>
    </main>
  );
}
