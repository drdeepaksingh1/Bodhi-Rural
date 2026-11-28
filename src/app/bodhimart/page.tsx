import { Copy } from './language';
import ShopProducts from './ShopProducts';
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import printStyles from "./bodhimart-print.module.css";
import {
  ArrowRight,
  Search,
  Carrot,
  Droplets,
  Leaf,
  PackageSearch,
  ShoppingBasket,
  Wheat,
  Utensils,
} from "lucide-react";

export const metadata: Metadata = {
  title: "BodhiMart | Farm & Rural Marketplace",
  description:
    "Explore BodhiMart, the farm and rural marketplace for agricultural inputs, livestock supplies, groceries and everyday essentials.",
  alternates: { canonical: "/bodhimart" },
  openGraph: {
    type: "website",
    title: "BodhiMart | Farm & Rural Marketplace",
    description:
      "Explore BodhiMart, the farm and rural marketplace for agricultural inputs, livestock supplies, groceries and everyday essentials.",
    url: "/bodhimart",
  },
  twitter: {
    card: "summary_large_image",
    title: "BodhiMart | Farm & Rural Marketplace",
    description:
      "Explore BodhiMart, the farm and rural marketplace for agricultural inputs, livestock supplies, groceries and everyday essentials.",
  },
};

const categories = [
  {
    name: "Hotels & restaurants",
    detail: "Browse meals and snacks listed by local hotels and restaurants.",
    icon: Utensils,
    color: "bg-[#f8efd9] text-[#8b651d]",
    href: "/bodhimart/products?category=hotels-restaurants",
    action: "Browse meals",
    hindi: { name: "होटल और रेस्तराँ", detail: "स्थानीय होटलों और रेस्तराँ के भोजन और नाश्ते देखें।", action: "भोजन देखें" },
  },
  {
    name: "Seeds & crop care",
    hindi: { name: "बीज और फसल देखभाल", detail: "मौसम के अनुसार खेती के बीज और ज़रूरी सामान।", action: "बीज देखें" },
    detail: "Seeds and essentials for the growing season.",
    icon: Leaf,
    color: "bg-[#e8f1e8] text-[#27623b]",
    href: "/bodhimart/products?category=seeds",
    action: "Shop seeds",
  },
  {
    name: "Feed & nutrition",
    hindi: { name: "चारा और पोषण", detail: "मुर्गियों और पशुओं के लिए रोज़ाना का आहार।", action: "चारा देखें" },
    detail: "Poultry and livestock feed for daily operations.",
    icon: Wheat,
    color: "bg-[#f8efd9] text-[#8b651d]",
    href: "/bodhimart/products?category=feed",
    action: "Shop feed",
  },
  {
    name: "Livestock & poultry",
    hindi: { name: "पशुपालन और मुर्गीपालन", detail: "पशुओं और मुर्गियों की देखभाल का सामान।", action: "पशुपालन का सामान देखें" },
    detail: "Products and supplies for healthier farm routines.",
    icon: PackageSearch,
    color: "bg-[#f7e9df] text-[#9a5831]",
    href: "/bodhimart/products?category=poultry",
    action: "Shop livestock supplies",
  },
  {
    name: "Groceries & daily essentials",
    hindi: { name: "किराना और रोज़मर्रा का सामान", detail: "घर और खेत के लिए किराना और ज़रूरी सामान।", action: "किराना देखें" },
    detail: "Everyday food and household essentials for home and farm.",
    icon: ShoppingBasket,
    color: "bg-[#e8f1e8] text-[#27623b]",
    href: "/bodhimart/products?category=groceries",
    action: "Shop groceries",
  },
  {
    name: "Fresh produce",
    hindi: { name: "ताज़ी सब्ज़ियाँ और फल", detail: "मौसमी सब्ज़ियाँ, फल और साग।", action: "ताज़े उत्पाद देखें" },
    detail: "Seasonal vegetables, fruit and leafy greens.",
    icon: Carrot,
    color: "bg-[#e8f1e8] text-[#27623b]",
    href: "/bodhimart/products?category=fresh-produce",
    action: "Shop fresh produce",
  },
  {
    name: "Household & personal care",
    hindi: { name: "घरेलू सामान और व्यक्तिगत देखभाल", detail: "सफ़ाई का सामान, बर्तन और देखभाल के उत्पाद।", action: "घरेलू सामान देखें" },
    detail: "Cleaning products, cookware and personal care essentials.",
    icon: Droplets,
    color: "bg-[#e8f1e8] text-[#27623b]",
    href: "/bodhimart/products?category=household-personal-care",
    action: "Shop household essentials",
  },
];

export default function BodhiMartPage() {
  return (
    <main className="bg-[#f5f4eb] text-[#173b2b]">
      <section className={`${printStyles.hero} bg-[#173e2e] text-white`}>
        <div className="mx-auto max-w-6xl px-4 pb-5 pt-6 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <h1 className="flex items-center gap-2 text-3xl font-bold"><Image src="/branding/bodhi-mart-mark.jpg" width={36} height={36} alt="" className="size-9 shrink-0 rounded-md bg-white object-contain" /> BodhiMart</h1>
            <Link href="/bodhimart/addresses" className="rounded-xl border border-white/35 px-3 py-2 text-sm">
              <Copy en="Delivery address" hi="डिलीवरी पता" />
            </Link>
          </div>
          <form action="/bodhimart/products" className="mt-4 flex items-center gap-2 rounded-2xl bg-white p-2 text-[#173b2b]">
            <label htmlFor="mart-search" className="sr-only"><Copy en="Search products" hi="उत्पाद खोजें" /></label>
            <Search size={20} className="ml-2 shrink-0" aria-hidden="true" />
            <input id="mart-search" name="search" type="search" maxLength={100}
              className="min-w-0 flex-1 bg-white px-1 py-2" placeholder="Search rice, seeds, notebooks…" />
            <button className="min-h-11 rounded-xl bg-[#f5c65a] px-3 font-semibold"><Copy en="Search" hi="खोजें" /></button>
          </form>
          <nav aria-label="Shop by category" className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {categories.map(({ name, hindi, href, icon: Icon, color }) => (
              <Link key={href} href={href} className="flex w-24 shrink-0 flex-col items-center gap-2 rounded-xl px-1 py-2 text-center text-xs font-semibold hover:bg-white/10">
                <span className={`rounded-2xl p-2.5 ${color}`}><Icon size={22} aria-hidden="true" /></span>
                <Copy en={name} hi={hindi.name} />
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-5 sm:px-8">
        <section className="relative isolate overflow-hidden rounded-3xl bg-[#284c36] p-6 text-white sm:p-10">
          <Image src="/branding/bodhi-rural-village-hero.png" alt="" fill sizes="(max-width: 768px) 100vw, 1100px" className="-z-20 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#102d20] via-[#102d20]/85 to-[#102d20]/30" />
          <h2 className="max-w-xs text-3xl font-bold sm:text-4xl"><Copy en="Shop for home, school and farm" hi="घर, स्कूल और खेत के लिए खरीदारी" /></h2>
          <Link href="/bodhimart/products" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#f5c65a] px-4 text-sm font-bold text-[#173b2b]">
            <Copy en="Browse all products" hi="सभी उत्पाद देखें" /><ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>

        <ShopProducts />

        <section aria-labelledby="departments-title" className="hidden md:block">
          <h2 id="departments-title" className="mb-3 text-xl font-bold"><Copy en="Explore departments" hi="श्रेणियाँ देखें" /></h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map(({ name, hindi, href, icon: Icon, color }) => (
              <li key={href}><Link href={href} className="flex h-full items-center gap-2 rounded-2xl border border-[#e2e8dd] bg-white p-3 text-sm font-semibold">
                <span className={`shrink-0 rounded-xl p-2 ${color}`}><Icon size={19} aria-hidden="true" /></span>
                <Copy en={name} hi={hindi.name} />
              </Link></li>
            ))}
          </ul>
        </section>

        <nav aria-label="BodhiMart services" className="flex flex-wrap gap-x-5 gap-y-3 pb-2 text-sm font-semibold underline underline-offset-4">
          <Link href="/bodhimart/account"><Copy en="My account" hi="मेरा खाता" /></Link>
          <Link href="/bodhimart/cart"><Copy en="Shopping cart" hi="खरीदारी की टोकरी" /></Link>
          <Link href="/bodhimart/seller/register"><Copy en="Sell on BodhiMart" hi="BodhiMart पर बेचें" /></Link>
        </nav>
      </div>
    </main>
  );
}
