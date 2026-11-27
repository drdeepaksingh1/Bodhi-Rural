import type { ReactNode } from 'react';
import { ShopNavigation } from './ShopNavigation';

export default function BodhiMartLayout({ children }: { children: ReactNode }) {
  return <ShopNavigation>{children}</ShopNavigation>;
}
