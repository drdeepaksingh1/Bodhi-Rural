import { Copy } from '../language';
import Link from 'next/link';

const paths = {
  buyer: '/login?account=buyer&redirect=%2Fbodhimart%2Fproducts',
  seller: '/login?account=seller&redirect=%2Fbodhimart%2Fseller%2Fdashboard',
};

export default function BodhiMartLoginChoicePage() {
  return (
    <main className="min-h-screen bg-[#f5f7f2] px-5 py-16 text-[#203d2c] sm:py-24">
      <div className="mx-auto max-w-4xl">
        <Link href="/bodhimart" className="text-sm font-semibold text-[#27623b] hover:underline">
          ← Back to BodhiMart
        </Link>
        <header className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6c8a6f]">BodhiMart account</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"><Copy en="Choose your sign in" hi="लॉग इन का प्रकार चुनें" /></h1>
          <p className="mt-4 text-base leading-7 text-[#69766d]"><Copy en="Select the account area you want to access." hi="वह खाता चुनें जिसे आप खोलना चाहते हैं।" /></p>
        </header>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <article className="flex flex-col rounded-3xl border border-[#e3e8df] bg-white p-7 shadow-sm sm:p-9">
            <div className="text-3xl" aria-hidden="true">🛒</div>
            <h2 className="mt-5 text-2xl font-semibold"><Copy en="Buyer login" hi="खरीदार लॉग इन" /></h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-[#69766d]">Shop products, manage your cart and addresses, and view your orders.</p>
            <Link href={paths.buyer} className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#173f2b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#20563a]"><Copy en="Continue as buyer" hi="खरीदार के रूप में आगे बढ़ें" /></Link>
            <p className="mt-4 text-center text-sm text-[#69766d]">New to BodhiMart? <Link href="/bodhimart/register" className="font-semibold text-[#27623b] underline"><Copy en="Create a buyer account" hi="खरीदार खाता बनाएँ" /></Link></p>
          </article>
          <article className="flex flex-col rounded-3xl border border-[#d9e2d5] bg-[#173f2b] p-7 text-white shadow-sm sm:p-9">
            <div className="text-3xl" aria-hidden="true">🏪</div>
            <h2 className="mt-5 text-2xl font-semibold"><Copy en="Seller login" hi="विक्रेता लॉग इन" /></h2>
            <p className="mt-3 flex-1 text-sm leading-6 text-white/75">Manage your approved shop, listings and orders. Seller tools are enabled after admin approval.</p>
            <Link href={paths.seller} className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#e1bd59] px-5 py-3 text-sm font-bold text-[#183426] transition hover:bg-[#edd17e]"><Copy en="Continue as seller" hi="विक्रेता के रूप में आगे बढ़ें" /></Link>
            <p className="mt-4 text-center text-sm text-white/80">New to selling? <Link href="/bodhimart/seller/register" className="font-semibold text-white underline"><Copy en="Apply to sell" hi="विक्रेता बनने के लिए आवेदन करें" /></Link></p>
          </article>
        </div>
      </div>
    </main>
  );
}
