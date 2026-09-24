'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  function isActive(href: string) {
    if (href === '/') {
      return pathname === '/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
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
            gap: '12px',
          }}
        >
          <NavLink href="/about" active={isActive('/about')}>
            About
          </NavLink>

          <NavLink href="/bodhifarm" active={isActive('/bodhifarm')}>
            BodhiFarm
          </NavLink>

          <NavLink href="/bodhimart" active={isActive('/bodhimart')}>
            BodhiMart
          </NavLink>

          <NavLink
            href="/farmer-network"
            active={isActive('/farmer-network')}
          >
            Farmers
          </NavLink>

          <NavLink href="/projects" active={isActive('/projects')}>
            Projects
          </NavLink>

          <NavLink href="/contact" active={isActive('/contact')}>
            Contact
          </NavLink>

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
              marginLeft: '4px',
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
          <MobileLink
            href="/about"
            onClick={closeMenu}
            active={isActive('/about')}
          >
            About
          </MobileLink>

          <MobileLink
            href="/bodhifarm"
            onClick={closeMenu}
            active={isActive('/bodhifarm')}
          >
            BodhiFarm
          </MobileLink>

          <MobileLink
            href="/bodhimart"
            onClick={closeMenu}
            active={isActive('/bodhimart')}
          >
            BodhiMart
          </MobileLink>

          <MobileLink
            href="/farmer-network"
            onClick={closeMenu}
            active={isActive('/farmer-network')}
          >
            Farmers
          </MobileLink>

          <MobileLink
            href="/projects"
            onClick={closeMenu}
            active={isActive('/projects')}
          >
            Projects
          </MobileLink>

          <MobileLink
            href="/contact"
            onClick={closeMenu}
            active={isActive('/contact')}
          >
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
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        color: '#ffffff',
        textDecoration: 'none',
        fontWeight: active ? 700 : 500,
        whiteSpace: 'nowrap',
        padding: '8px 10px',
        borderRadius: '5px',
        background: active ? 'rgba(255,255,255,0.16)' : 'transparent',
        borderBottom: active
          ? '2px solid #ffffff'
          : '2px solid transparent',
      }}
    >
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  onClick,
  active,
  children,
}: {
  href: string;
  onClick: () => void;
  active: boolean;
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
        padding: '11px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        fontWeight: active ? 700 : 500,
        background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
        borderRadius: '4px',
      }}
    >
      {children}
    </Link>
  );
}
