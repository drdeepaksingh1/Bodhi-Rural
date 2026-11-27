'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid2X2, House, ShoppingCart, UserRound } from 'lucide-react';
import { Copy } from './language';

const items = [
  { href: '/bodhimart', path: '/bodhimart', en: 'Shop', hi: 'खरीदारी', Icon: House },
  { href: '/bodhimart/products', path: '/bodhimart/products', en: 'Categories', hi: 'श्रेणियाँ', Icon: Grid2X2 },
  { href: '/bodhimart/account', path: '/bodhimart/account', en: 'Account', hi: 'खाता', Icon: UserRound },
  { href: '/bodhimart/cart', path: '/bodhimart/cart', en: 'Cart', hi: 'टोकरी', Icon: ShoppingCart },
];

export function ShopNavigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = items.find(({ path }) => pathname === path
    || (path === '/bodhimart/products' && pathname.startsWith(path + '/')));
  if (!active) return children;

  return (
    <div className="pb-20 md:pb-0 print:pb-0">
      {children}
      <nav aria-label="BodhiMart" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[#dce8dd] bg-white px-2 pt-1 shadow-lg pb-[max(0.25rem,env(safe-area-inset-bottom))] md:hidden print:hidden">
        {items.map(({ href, en, hi, Icon }) => (
          <Link key={href} href={href} aria-current={active.href === href ? 'page' : undefined}
            className={'flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold ' + (active.href === href ? 'bg-[#e7f2e7] text-[#124531]' : 'text-[#385345]')}>
            <Icon size={21} aria-hidden="true" /><Copy en={en} hi={hi} />
          </Link>
        ))}
      </nav>
    </div>
  );
}
