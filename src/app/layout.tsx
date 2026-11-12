import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '../components/SiteHeader';
import Footer from '../components/Footer';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Corporation',
  '@id': 'https://bodhi-rural.vercel.app/#organization',
  name: 'Bodhi Rural',
  legalName: 'BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED',
  url: 'https://bodhi-rural.vercel.app',
  logo: 'https://bodhi-rural.vercel.app/branding/bodhi-rural-logo.png',
  email: 'ceo@brlps.co.in',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Islampur, Nalanda',
    addressRegion: 'Bihar',
    postalCode: '801303',
    addressCountry: 'IN',
  },
};

export const metadata: Metadata = {
  metadataBase: new URL('https://bodhi-rural.vercel.app'),
  title: {
    default: 'Bodhi Rural | Rural Livelihood & Agriculture',
    template: '%s | Bodhi Rural',
  },
  description: 'Bodhi Rural Livelihood & Agri Private Limited connects agriculture, rural livelihoods, farm operations, services and market access across India.',
  applicationName: 'Bodhi Rural',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Bodhi Rural',
    title: 'Bodhi Rural | Rural Livelihood & Agriculture',
    description: 'Bodhi Rural Livelihood & Agri Private Limited connects agriculture, rural livelihoods, farm operations, services and market access across India.',
    images: [
      {
        url: 'https://bodhi-rural.vercel.app/branding/bodhi-rural-hero-v2.webp',
        width: 1200,
        height: 675,
        alt: 'Rural fields and village landscape in India',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bodhi Rural | Rural Livelihood & Agriculture',
    description: 'Bodhi Rural Livelihood & Agri Private Limited connects agriculture, rural livelihoods, farm operations, services and market access across India.',
    images: ['https://bodhi-rural.vercel.app/branding/bodhi-rural-hero-v2.webp'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <SiteHeader />
        {children}
        <Footer />
      </body>
    </html>
  );
}
