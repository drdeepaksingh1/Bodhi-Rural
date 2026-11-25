import type { ReactNode } from 'react';
import { BodhiMartLanguage } from './language';

export default function BodhiMartLayout({ children }: { children: ReactNode }) {
  return <BodhiMartLanguage>{children}</BodhiMartLanguage>;
}
