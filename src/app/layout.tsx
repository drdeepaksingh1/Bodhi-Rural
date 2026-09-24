import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '../components/SiteHeader';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Bodhi Rural | Livelihood & Agri',
  description: 'Bodhi Rural farmer and agriculture digital platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <Footer />
      </body>
    </html>
  );
}
