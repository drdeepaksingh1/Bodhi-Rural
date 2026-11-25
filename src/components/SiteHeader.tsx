'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useEffectEvent, useState } from 'react';

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [loginAccount, setLoginAccount] = useState<'buyer' | 'seller' | null>(null);

  const syncRedirectPath = useEffectEvent(() => {
    if (pathname === '/login') {
      const params = new URLSearchParams(window.location.search);
      setRedirectPath(params.get('redirect'));
      const account = params.get('account');
      setLoginAccount(account === 'buyer' || account === 'seller' ? account : null);
    } else {
      setRedirectPath(null);
      setLoginAccount(null);
    }
  });

  useEffect(() => {
    const timer = window.setTimeout(() => syncRedirectPath(), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  function closeMenu() {
    setMenuOpen(false);
  }

  const isBodhiMartPage = pathname.startsWith('/bodhimart');
  const loginHref = isBodhiMartPage
    ? '/bodhimart/login'
    : loginAccount
      ? `/login?account=${loginAccount}${redirectPath ? `&redirect=${encodeURIComponent(redirectPath)}` : ''}`
      : '/login';
  const loginLabel = isBodhiMartPage
    ? 'Buyer / Seller Login'
    : loginAccount === 'seller'
      ? 'Seller Login'
      : loginAccount === 'buyer'
        ? 'Buyer Login'
        : 'Login';
  const loginPageIsActive = pathname === '/login' || pathname === '/bodhimart/login';

  function isActive(href: string) {
    // Normal page URL
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      return true;
    }

    // Login page reached through a protected page
    if (pathname === '/login' && redirectPath) {
      if (
        redirectPath === href ||
        redirectPath.startsWith(`${href}/`)
      ) {
        return true;
      }
    }

    // Home
    if (href === '/') {
      return pathname === '/';
    }

    return false;
  }

  return (
    <header
      style={{
        background: 'var(--green2)',
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
          <NavLink
            href="/about"
            active={isActive('/about')}
          >
            About
          </NavLink>

          <NavLink
            href="/bodhifarm"
            active={isActive('/bodhifarm')}
          >
            BodhiFarm
          </NavLink>

          <NavLink
            href="/bodhimart"
            active={isActive('/bodhimart')}
          >
            BodhiMart
          </NavLink>

          <NavLink
            href="/farmer-network"
            active={isActive('/farmer-network')}
          >
            Rural Network
          </NavLink>

          <NavLink
            href="/projects"
            active={isActive('/projects')}
          >
            Projects
          </NavLink>

          <NavLink
            href="/careers"
            active={isActive('/careers')}
          >
            Careers
          </NavLink>

          <NavLink
            href="/contact"
            active={isActive('/contact')}
          >
            Contact
          </NavLink>

          <NavLink href="/skills-training" active={isActive('/skills-training')}>
            Skills &amp; Training
          </NavLink>

          <details style={{ position: 'relative' }}>
            <summary style={{ cursor: 'pointer', color: '#fff', fontWeight: 600, padding: '8px 10px', whiteSpace: 'nowrap' }}>Quick links</summary>
            <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, display: 'grid', gap: 2, minWidth: 240, padding: 10, borderRadius: 10, background: '#fff', boxShadow: '0 12px 30px rgba(0,0,0,.18)' }}>
              <HeaderQuickLink href="/about">About</HeaderQuickLink>
              <HeaderQuickLink href="/bodhifarm">BodhiFarm</HeaderQuickLink>
              <HeaderQuickLink href="/bodhimart">BodhiMart</HeaderQuickLink>
              <HeaderQuickLink href="/farmer-network">Rural Network</HeaderQuickLink>
              <HeaderQuickLink href="/projects">Projects</HeaderQuickLink>
              <HeaderQuickLink href="/careers">Careers</HeaderQuickLink>
              <HeaderQuickLink href="/contact">Contact</HeaderQuickLink>
              <HeaderQuickLink href="/skills-training">Skills &amp; Training</HeaderQuickLink>
              <a href="mailto:bodhirural@gmail.com" style={{ color: 'var(--green2)', padding: '8px 10px', textDecoration: 'none', fontSize: 13 }}>bodhirural@gmail.com</a>
              <a href="mailto:ceo@brlps.co.in" style={{ color: 'var(--green2)', padding: '8px 10px', textDecoration: 'none', fontSize: 13 }}>ceo@brlps.co.in</a>
            </div>
          </details>

          <Link
            href={loginHref}
            aria-current={loginPageIsActive ? 'page' : undefined}
            style={{
              background: '#ffffff',
              color: 'var(--green2)',
              fontWeight: 700,
              padding: '9px 18px',
              borderRadius: '6px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              marginLeft: '4px',
            }}
          >
            {loginLabel}
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="mobileMenuButton"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={
            menuOpen ? 'Close menu' : 'Open menu'
          }
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
            background: 'var(--green2)',
            borderTop:
              '1px solid rgba(255,255,255,0.2)',
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
            Rural Network
          </MobileLink>

          <MobileLink
            href="/projects"
            onClick={closeMenu}
            active={isActive('/projects')}
          >
            Projects
          </MobileLink>

          <MobileLink
            href="/careers"
            onClick={closeMenu}
            active={isActive('/careers')}
          >
            Careers
          </MobileLink>

          <MobileLink
            href="/contact"
            onClick={closeMenu}
            active={isActive('/contact')}
          >
            Contact
          </MobileLink>

          <MobileLink href="/skills-training" onClick={closeMenu} active={isActive('/skills-training')}>
            Skills &amp; Training
          </MobileLink>
          <a href="mailto:bodhirural@gmail.com" onClick={closeMenu} className="mobileQuickEmail">bodhirural@gmail.com</a>
          <a href="mailto:ceo@brlps.co.in" onClick={closeMenu} className="mobileQuickEmail">ceo@brlps.co.in</a>

          <Link
            href={loginHref}
            onClick={closeMenu}
            aria-current={loginPageIsActive ? 'page' : undefined}
            style={{
              display: 'block',
              marginTop: '8px',
              padding: '11px 14px',
              background: '#ffffff',
              color: 'var(--green2)',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            {loginLabel}
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

        @media (max-width: 1260px) {
          .desktopNav {
            display: none !important;
          }

          .mobileMenuButton {
            display: block !important;
          }
        }

        @media (max-width: 600px) {
          .mobileQuickEmail { display:block; padding:9px 8px; color:#fff; text-decoration:underline; text-underline-offset:3px; font-size:14px; }
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

function HeaderQuickLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} style={{ color: 'var(--green2)', padding: '8px 10px', borderRadius: 6, textDecoration: 'none', fontSize: 13 }}>{children}</Link>;
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
      aria-current={active ? 'page' : undefined}
      style={{
        color: '#ffffff',
        textDecoration: 'none',
        fontWeight: active ? 700 : 500,
        whiteSpace: 'nowrap',
        padding: '8px 10px',
        borderRadius: '5px',
        background: active
          ? 'rgba(255,255,255,0.16)'
          : 'transparent',
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
      aria-current={active ? 'page' : undefined}
      style={{
        display: 'block',
        color: '#ffffff',
        textDecoration: 'none',
        padding: '11px 8px',
        borderBottom:
          '1px solid rgba(255,255,255,0.15)',
        fontWeight: active ? 700 : 500,
        background: active
          ? 'rgba(255,255,255,0.12)'
          : 'transparent',
        borderRadius: '4px',
      }}
    >
      {children}
    </Link>
  );
}
