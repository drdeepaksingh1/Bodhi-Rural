import type { Metadata } from "next";
import Link from "next/link";

import printStyles from "./bodhimart-print.module.css";
import {
  ArrowRight,
  BadgeCheck,
  Leaf,
  PackageSearch,
  ShoppingBasket,
  Truck,
  Wheat,
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
    detail: "Seeds and essentials for the growing season.",
    icon: Leaf,
    color: "bg-[#e8f1e8] text-[#27623b]",
  },
  {
    name: "Feed & nutrition",
    detail: "Poultry and livestock feed for daily operations.",
    icon: Wheat,
    color: "bg-[#f8efd9] text-[#8b651d]",
  },
  {
    name: "Livestock & poultry",
    detail: "Products and supplies for healthier farm routines.",
    icon: PackageSearch,
    color: "bg-[#f7e9df] text-[#9a5831]",
  },
  {
    name: "Tools & equipment",
    detail: "Practical equipment for farms and rural businesses.",
    icon: Truck,
    color: "bg-[#e5edf2] text-[#3f6174]",
  },
  {
    name: "Groceries & daily essentials",
    detail: "Everyday food and household essentials for home and farm.",
    icon: ShoppingBasket,
    color: "bg-[#e8f1e8] text-[#27623b]",
    href: "/bodhimart/products?search=grocery",
    action: "Shop groceries",
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
              Source smarter.
              <span className="block text-[#e5c56d]">Grow together.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              A marketplace for farmers, households and rural businesses to
              discover agricultural essentials and connect with approved sellers.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/bodhimart/products"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#e1bd59] px-6 py-3 text-sm font-bold text-[#183426] shadow-lg shadow-black/10 transition hover:bg-[#edd17e] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#103a27]"
              >
                Explore the marketplace
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/75">
              <span className="inline-flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-[#e5c56d]" aria-hidden="true" />
                Seller-reviewed catalogue
              </span>
              <span className="inline-flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#e5c56d]" aria-hidden="true" />
                Delivery or pickup where available
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
              Shop by need
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Essentials for work on the land
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#69766d]">
              Explore the catalogue for products that support farms and rural
              enterprises at every stage.
            </p>
          </div>
          <Link
            href="/bodhimart/products"
            className="inline-flex items-center gap-2 self-start text-sm font-bold text-[#27623b] hover:text-[#173f2b] sm:self-auto"
          >
            View all products
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className={`${printStyles.categoryGrid} mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-5`}>
          {categories.map(
            ({
              name,
              detail,
              icon: Icon,
              color,
              href = "/bodhimart/products",
              action = "Browse products",
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
                  {name}
                </h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-[#6a776d]">
                  {detail}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#27623b]">
                  {action}
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
