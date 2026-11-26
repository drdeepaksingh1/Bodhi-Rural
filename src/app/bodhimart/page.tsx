import { Copy } from './language';
import type { Metadata } from "next";
import Link from "next/link";

import printStyles from "./bodhimart-print.module.css";
import {
  ArrowRight,
  BadgeCheck,
  Carrot,
  Droplets,
  Hammer,
  HeartHandshake,
  NotebookPen,
  Shirt,
  Leaf,
  PackageSearch,
  ShoppingBasket,
  Truck,
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
    name: "Seeds & crop care",
    hindi: { name: "बीज और फसल देखभाल", detail: "मौसम के अनुसार खेती के बीज और ज़रूरी सामान।", action: "बीज देखें" },
    detail: "Seeds and essentials for the growing season.",
    icon: Leaf,
    color: "bg-[#e8f1e8] text-[#27623b]",
    href: "/bodhimart/products?search=seeds",
    action: "Shop seeds",
  },
  {
    name: "Feed & nutrition",
    hindi: { name: "चारा और पोषण", detail: "मुर्गियों और पशुओं के लिए रोज़ाना का आहार।", action: "चारा देखें" },
    detail: "Poultry and livestock feed for daily operations.",
    icon: Wheat,
    color: "bg-[#f8efd9] text-[#8b651d]",
    href: "/bodhimart/products?search=feed",
    action: "Shop feed",
  },
  {
    name: "Livestock & poultry",
    hindi: { name: "पशुपालन और मुर्गीपालन", detail: "पशुओं और मुर्गियों की देखभाल का सामान।", action: "पशुपालन का सामान देखें" },
    detail: "Products and supplies for healthier farm routines.",
    icon: PackageSearch,
    color: "bg-[#f7e9df] text-[#9a5831]",
    href: "/bodhimart/products?search=poultry",
    action: "Shop livestock supplies",
  },
  {
    name: "Tools & equipment",
    hindi: { name: "औज़ार और उपकरण", detail: "खेती और ग्रामीण व्यवसायों के औज़ार।", action: "उपकरण देखें" },
    detail: "Practical equipment for farms and rural businesses.",
    icon: Truck,
    color: "bg-[#e5edf2] text-[#3f6174]",
    href: "/bodhimart/products?search=equipment",
    action: "Shop equipment",
  },
  {
    name: "Groceries & daily essentials",
    hindi: { name: "किराना और रोज़मर्रा का सामान", detail: "घर और खेत के लिए किराना और ज़रूरी सामान।", action: "किराना देखें" },
    detail: "Everyday food and household essentials for home and farm.",
    icon: ShoppingBasket,
    color: "bg-[#e8f1e8] text-[#27623b]",
    href: "/bodhimart/products?search=grocery",
    action: "Shop groceries",
  },
  {
    name: "Fresh produce",
    hindi: { name: "ताज़ी सब्ज़ियाँ और फल", detail: "मौसमी सब्ज़ियाँ, फल और साग।", action: "ताज़े उत्पाद देखें" },
    detail: "Seasonal vegetables, fruit and leafy greens.",
    icon: Carrot,
    color: "bg-[#e8f1e8] text-[#27623b]",
    href: "/bodhimart/products?search=vegetable",
    action: "Shop fresh produce",
  },
  {
    name: "Clothing & footwear",
    hindi: { name: "कपड़े और जूते-चप्पल", detail: "रोज़ के कपड़े, स्कूल यूनिफ़ॉर्म और जूते-चप्पल।", action: "कपड़े देखें" },
    detail: "Everyday clothing, school uniforms and footwear.",
    icon: Shirt,
    color: "bg-[#e8f1e8] text-[#27623b]",
    href: "/bodhimart/products?search=clothing",
    action: "Shop clothing",
  },
  {
    name: "Stationery & school supplies",
    hindi: { name: "स्टेशनरी और स्कूल का सामान", detail: "कॉपी, पेन, स्कूल बैग और पढ़ाई का सामान।", action: "स्टेशनरी देखें" },
    detail: "Notebooks, pens, school bags and classroom supplies.",
    icon: NotebookPen,
    color: "bg-[#e8f1e8] text-[#27623b]",
    href: "/bodhimart/products?search=stationery",
    action: "Shop stationery",
  },
  {
    name: "Household & personal care",
    hindi: { name: "घरेलू सामान और व्यक्तिगत देखभाल", detail: "सफ़ाई का सामान, बर्तन और देखभाल के उत्पाद।", action: "घरेलू सामान देखें" },
    detail: "Cleaning products, cookware and personal care essentials.",
    icon: Droplets,
    color: "bg-[#e8f1e8] text-[#27623b]",
    href: "/bodhimart/products?search=household",
    action: "Shop household essentials",
  },
  {
    name: "Hardware & electrical",
    hindi: { name: "हार्डवेयर और बिजली का सामान", detail: "बल्ब, स्विच, फिटिंग और औज़ार।", action: "हार्डवेयर देखें" },
    detail: "Bulbs, switches, fittings and tools.",
    icon: Hammer,
    color: "bg-[#e8f1e8] text-[#27623b]",
    href: "/bodhimart/products?search=hardware",
    action: "Shop hardware",
  },
  {
    name: "Made locally",
    hindi: { name: "स्थानीय उत्पाद", detail: "स्थानीय किसानों, स्वयं सहायता समूहों और कारीगरों के उत्पाद।", action: "स्थानीय उत्पाद देखें" },
    detail: "Products from local farmers, self-help groups and artisans.",
    icon: HeartHandshake,
    color: "bg-[#e8f1e8] text-[#27623b]",
    href: "/bodhimart/products?search=local",
    action: "Shop local products",
  },
  {
    name: "Hotels & restaurants",
    detail: "Browse meals and snacks listed by local hotels and restaurants.",
    icon: Utensils,
    color: "bg-[#f8efd9] text-[#8b651d]",
    href: "/bodhimart/products?search=hotels+%26+restaurants",
    action: "Browse meals",
    hindi: { name: "होटल और रेस्तराँ", detail: "स्थानीय होटलों और रेस्तराँ के भोजन और नाश्ते देखें।", action: "भोजन देखें" },
  },
];

const features = [
  {
    title: "Approved sellers",
    text: "Discover products from reviewed marketplace sellers.",
    icon: BadgeCheck,
  },
  {
    title: "Clear product details",
    text: "See pricing, units and availability before you order.",
    icon: PackageSearch,
  },
  {
    title: "Flexible fulfilment",
    text: "Check delivery and pickup options on each product.",
    icon: Truck,
  },
];

export default function BodhiMartPage() {
  return (
    <main className={`${printStyles.root} min-h-screen bg-[#f7f8f4] text-[#183426]`}>
      <section className={`${printStyles.hero} relative isolate overflow-hidden bg-[#103a27] text-white`}>
        <div
          aria-hidden="true"
          className={`${printStyles.heroArtwork} absolute inset-0 -z-20 bg-cover bg-center`}
          style={{ backgroundImage: "url('/branding/bodhi-rural-hero-v2.webp')" }}
        />
        <div
          aria-hidden="true"
          className={`${printStyles.heroArtwork} absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(10,38,25,0.96)_0%,rgba(10,38,25,0.88)_48%,rgba(10,38,25,0.5)_100%)]`}
        />
        <div className={`${printStyles.heroContent} mx-auto flex min-h-[480px] max-w-[1320px] items-center px-5 py-16 sm:px-8 lg:px-12 lg:py-24`}>
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#e5d29a]">
              <span className="h-2 w-2 rounded-full bg-[#d8b44e]" />
              Bodhi Rural marketplace
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[64px]">
              <Copy en="Shop for home," hi="घर, स्कूल और" />
              <span className="block text-[#e5c56d]"><Copy en="school and farm." hi="खेत के लिए खरीदारी" /></span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              Find groceries, clothing, school supplies, farm essentials and products
              made by local producers.
            </p>
            <form action="/bodhimart/products" className="mt-6 flex max-w-xl flex-wrap gap-2 sm:flex-nowrap">
              <label htmlFor="mart-search" className="sr-only">Search BodhiMart products</label>
              <input
                id="mart-search"
                name="search"
                type="search"
                maxLength={100}
                placeholder="Sugar, notebooks, seeds"
                className="min-h-12 min-w-0 flex-1 rounded-xl bg-white px-4 text-[#183426]"
              />
              <button className="min-h-12 rounded-xl bg-[#e1bd59] px-5 text-sm font-bold text-[#183426]"><Copy en="Search" hi="खोजें" /></button>
            </form>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/bodhimart/products"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#e1bd59] px-6 py-3 text-sm font-bold text-[#183426] shadow-lg shadow-black/10 transition hover:bg-[#edd17e] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#103a27]"
              >
                <Copy en="Explore the marketplace" hi="बाज़ार देखें" />
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/75">
              <span className="inline-flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-[#e5c56d]" aria-hidden="true" />
                <Copy en="Seller-reviewed catalogue" hi="स्वीकृत विक्रेताओं के उत्पाद" />
              </span>
              <span className="inline-flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#e5c56d]" aria-hidden="true" />
                <Copy en="Delivery or pickup where available" hi="जहाँ उपलब्ध हो, डिलीवरी या खुद ले जाएँ" />
              </span>
            </div>
          </div>


        </div>
      </section>

      <section className={`${printStyles.features} border-b border-[#e6e9e2] bg-white`}>
        <div className="mx-auto grid max-w-[1320px] gap-4 px-5 py-6 sm:grid-cols-3 sm:px-8 lg:px-12">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className={`${printStyles.featureCard} flex gap-3 rounded-2xl px-2 py-3`}>
              <div className="mt-0.5 rounded-xl bg-[#eff4ed] p-2.5 text-[#27623b]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-[#6a776d]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={`${printStyles.shop} mx-auto max-w-[1320px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20`}>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8a6f]">
              <Copy en="Shop by need" hi="ज़रूरत के अनुसार खरीदें" />
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              <Copy en="Essentials for village life" hi="गाँव की रोज़मर्रा की ज़रूरतें" />
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#69766d]">
              Browse the catalogue by what you need for your home, school or farm.
            </p>
          </div>
          <Link
            href="/bodhimart/products"
            className="inline-flex items-center gap-2 self-start text-sm font-bold text-[#27623b] hover:text-[#173f2b] sm:self-auto"
          >
            <Copy en="View all products" hi="सभी उत्पाद देखें" />
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className={`${printStyles.categoryGrid} mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
          {categories.map(({
              name,
              detail,
              icon: Icon,
              color,
              href = "/bodhimart/products",
              action = "Browse products",
              hindi,
            }) => (
              <Link
                key={name}
                href={href}
                className={`${printStyles.categoryCard} group rounded-3xl border border-[#e3e8df] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#bfd2c1] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#458454]`}
              >
                <div className={"inline-flex rounded-2xl p-3 " + color}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#203d2c]">
                  <Copy en={name} hi={hindi.name} />
                </h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-[#6a776d]">
                  <Copy en={detail} hi={hindi.detail} />
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#27623b]">
                  <Copy en={action} hi={hindi.action} />
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            )
          )}
        </div>
      </section>

      

      
    </main>
  );
}
