'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header
      style={{
        background: '#145c2b',
        color: '#ffffff',
        width: '100%',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          minHeight: '82px',
          gap: '20px',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          onClick={closeMenu}
          style={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Image
            src="/branding/bodhi-rural-logo.png"
            alt="BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED"
            width={302}
            height={90}
            priority
            style={{
              width: '220px',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="desktopNav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <NavLink href="/about">About</NavLink>
          <NavLink href="/bodhifarm">BodhiFarm</NavLink>
          <NavLink href="/bodhimart">BodhiMart</NavLink>
          <NavLink href="/farmer-network">Farmers</NavLink>
          <NavLink href="/projects">Projects</NavLink>
          <NavLink href="/contact">Contact</NavLink>

          <Link
            href="/login"
            style={{
              background: '#ffffff',
              color: '#145c2b',
              fontWeight: 700,
              padding: '9px 18px',
              borderRadius: '6px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Login
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="mobileMenuButton"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          style={{
            display: 'none',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.5)',
            color: '#ffffff',
            borderRadius: '6px',
            padding: '7px 11px',
            fontSize: '24px',
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          {menuOpen ? '×' : '☰'}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div
          className="mobileMenu"
          style={{
            background: '#145c2b',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            padding: '10px 20px 18px',
          }}
        >
          <MobileLink href="/about" onClick={closeMenu}>
            About
          </MobileLink>

          <MobileLink href="/bodhifarm" onClick={closeMenu}>
            BodhiFarm
          </MobileLink>

          <MobileLink href="/bodhimart" onClick={closeMenu}>
            BodhiMart
          </MobileLink>

          <MobileLink href="/farmer-network" onClick={closeMenu}>
            Farmers
          </MobileLink>

          <MobileLink href="/projects" onClick={closeMenu}>
            Projects
          </MobileLink>

          <MobileLink href="/contact" onClick={closeMenu}>
            Contact
          </MobileLink>

          <Link
            href="/login"
            onClick={closeMenu}
            style={{
              display: 'block',
              marginTop: '8px',
              padding: '11px 14px',
              background: '#ffffff',
              color: '#145c2b',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            Login
          </Link>
        </div>
      )}

      {/* Responsive CSS */}
      <style jsx>{`
        .desktopNav {
          display: flex !important;
        }

        .mobileMenuButton {
          display: none !important;
        }

        @media (max-width: 900px) {
          .desktopNav {
            display: none !important;
          }

          .mobileMenuButton {
            display: block !important;
          }
        }

        @media (max-width: 600px) {
          .container {
            padding-left: 15px;
            padding-right: 15px;
          }

          img {
            width: 180px !important;
          }
        }
      `}</style>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        color: '#ffffff',
        textDecoration: 'none',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'block',
        color: '#ffffff',
        textDecoration: 'none',
        padding: '11px 4px',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        fontWeight: 500,
      }}
    >
      {children}
    </Link>
  );
}
