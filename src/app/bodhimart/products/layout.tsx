import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Rural Products | BodhiMart",
  description:
    "Browse the BodhiMart catalogue for agricultural inputs, livestock supplies, groceries and rural essentials from approved sellers.",
  alternates: { canonical: "/bodhimart/products" },
  openGraph: {
    type: "website",
    title: "Shop Rural Products | BodhiMart",
    description:
      "Browse the BodhiMart catalogue for agricultural inputs, livestock supplies, groceries and rural essentials from approved sellers.",
    url: "/bodhimart/products",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Rural Products | BodhiMart",
    description:
      "Browse the BodhiMart catalogue for agricultural inputs, livestock supplies, groceries and rural essentials from approved sellers.",
  },
};

export default function MarketplaceProductsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
