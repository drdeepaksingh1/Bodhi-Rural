import Link from 'next/link';
import Image from 'next/image';

export default function SiteHeader() {
  return (
    <header
      className="nav"
      style={{
        background: '#145c2b',
        color: '#ffffff',
      }}
    >
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

        <nav
          className="navlinks"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '22px',
          }}
        >
          <Link href="/about" style={navLinkStyle}>
            About
          </Link>

          <Link href="/bodhifarm" style={navLinkStyle}>
            BodhiFarm
          </Link>

          <Link href="/bodhimart" style={navLinkStyle}>
            BodhiMart
          </Link>

          <Link href="/farmer-network" style={navLinkStyle}>
            Farmers
          </Link>

          <Link href="/projects" style={navLinkStyle}>
            Projects
          </Link>

          <Link href="/contact" style={navLinkStyle}>
            Contact
          </Link>

          <Link
            className="btn"
            href="/login"
            style={{
              background: '#ffffff',
              color: '#145c2b',
              fontWeight: 700,
              padding: '9px 18px',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            Login
          </Link>
        </nav>

        <span
          className="mobile"
          style={{
            color: '#ffffff',
          }}
        >
          ☰
        </span>
      </div>
    </header>
  );
}

const navLinkStyle = {
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: 500,
};
