'use client';

import Link from 'next/link';
import { Copy } from '../app/bodhimart/language';
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
            <Copy en="About" hi="हमारे बारे में" />
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
            <Copy en="Rural Network" hi="ग्रामीण नेटवर्क" />
          </NavLink>

          <NavLink
            href="/projects"
            active={isActive('/projects')}
          >
            <Copy en="Projects" hi="परियोजनाएँ" />
          </NavLink>

          <NavLink
            href="/careers"
            active={isActive('/careers')}
          >
            <Copy en="Careers" hi="करियर" />
          </NavLink>

          <NavLink
            href="/contact"
            active={isActive('/contact')}
          >
            <Copy en="Contact" hi="संपर्क" />
          </NavLink>

          <NavLink href="/skills-training" active={isActive('/skills-training')}>
            <Copy en="Skills & Training" hi="कौशल और प्रशिक्षण" />
          </NavLink>


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
            <Copy en={loginLabel} hi={isBodhiMartPage ? 'खरीदार / विक्रेता लॉग इन' : loginAccount === 'seller' ? 'विक्रेता लॉग इन' : loginAccount === 'buyer' ? 'खरीदार लॉग इन' : 'लॉग इन'} />
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
            <Copy en="About" hi="हमारे बारे में" />
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
            <Copy en="Rural Network" hi="ग्रामीण नेटवर्क" />
          </MobileLink>

          <MobileLink
            href="/projects"
            onClick={closeMenu}
            active={isActive('/projects')}
          >
            <Copy en="Projects" hi="परियोजनाएँ" />
          </MobileLink>

          <MobileLink
            href="/careers"
            onClick={closeMenu}
            active={isActive('/careers')}
          >
            <Copy en="Careers" hi="करियर" />
          </MobileLink>

          <MobileLink
            href="/contact"
            onClick={closeMenu}
            active={isActive('/contact')}
          >
            <Copy en="Contact" hi="संपर्क" />
          </MobileLink>

          <MobileLink href="/skills-training" onClick={closeMenu} active={isActive('/skills-training')}>
            <Copy en="Skills & Training" hi="कौशल और प्रशिक्षण" />
          </MobileLink>

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
            <Copy en={loginLabel} hi={isBodhiMartPage ? 'खरीदार / विक्रेता लॉग इन' : loginAccount === 'seller' ? 'विक्रेता लॉग इन' : loginAccount === 'buyer' ? 'खरीदार लॉग इन' : 'लॉग इन'} />
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
