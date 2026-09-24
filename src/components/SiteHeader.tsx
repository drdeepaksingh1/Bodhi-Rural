import Link from 'next/link';
import Image from 'next/image';

export default function SiteHeader() {
  return (
    <header className="nav">
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Image
            src="/branding/bodhi-rural-logo.png"
            alt="BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED"
            width={302}
            height={90}
            priority
            style={{
              width: '240px',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        </Link>

        <nav className="navlinks">
          <Link href="/about">About</Link>
          <Link href="/bodhifarm">BodhiFarm</Link>
          <Link href="/bodhimart">BodhiMart</Link>
          <Link href="/farmer-network">Farmers</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/contact">Contact</Link>
          <Link className="btn" href="/login">Login</Link>
        </nav>

        <span className="mobile">☰</span>
      </div>
    </header>
  );
}
