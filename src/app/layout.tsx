import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '../components/SiteHeader';
import Footer from '../components/Footer';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Corporation',
  '@id': 'https://www.brlps.co.in/#organization',
  name: 'Bodhi Rural',
  legalName: 'BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED',
  url: 'https://www.brlps.co.in',
  logo: 'https://www.brlps.co.in/branding/bodhi-rural-logo.png',
  email: 'ceo@brlps.co.in',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Islampur',
    addressLocality: 'Nalanda',
    addressRegion: 'Bihar',
    postalCode: '801303',
    addressCountry: 'IN',
  },
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.brlps.co.in'),
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
        url: 'https://www.brlps.co.in/branding/bodhi-rural-hero-v2.webp',
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
    images: ['https://www.brlps.co.in/branding/bodhi-rural-hero-v2.webp'],
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
