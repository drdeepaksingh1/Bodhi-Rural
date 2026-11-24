'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

type AccountSummary = {
  email: string;
  orders: number;
  savedItems: number;
  addresses: number;
};

const quickLinks = [
  {
    href: '/bodhimart/orders',
    title: 'Order history',
    description: 'Check order details, status and fulfilment progress.',
    icon: '📦',
    count: 'orders' as const,
  },
  {
    href: '/bodhimart/wishlist',
    title: 'Saved products',
    description: 'Return to products you have saved for later.',
    icon: '♡',
    count: 'savedItems' as const,
  },
  {
    href: '/bodhimart/addresses',
    title: 'Delivery addresses',
    description: 'Manage the addresses used for your orders.',
    icon: '⌖',
    count: 'addresses' as const,
  },
];

export default function BodhiMartAccountPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError?.message === 'Auth session missing!' || !user) {
        router.replace('/login?account=buyer&redirect=%2Fbodhimart%2Faccount');
        return;
      }
      if (authError) throw authError;

      const [orders, savedItems, addresses] = await Promise.all([
        supabase.from('marketplace_orders').select('id', { count: 'exact', head: true }).eq('customer_user_id', user.id),
        supabase.from('marketplace_wishlist_items').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('marketplace_customer_addresses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      const failedQuery = [orders, savedItems, addresses].find((result) => result.error);
      if (failedQuery?.error) throw failedQuery.error;

      setSummary({
        email: user.email || 'Your BodhiMart account',
        orders: orders.count || 0,
        savedItems: savedItems.count || 0,
        addresses: addresses.count || 0,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your account summary.');
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    // Load the signed-in customer's own marketplace summary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAccount();
  }, [loadAccount]);

  async function handleSignOut() {
    setError('');
    setSigningOut(true);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      router.replace('/bodhimart/login');
      router.refresh();
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Unable to sign out. Please try again.');
      setSigningOut(false);
    }
  }

  if (loading) {
    return <main className="flex min-h-[60vh] items-center justify-center bg-[#f5f7f2] px-5 text-gray-600">Loading your account…</main>;
  }

  return (
    <main className="min-h-[70vh] bg-[#f5f7f2] px-5 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <Link href="/bodhimart" className="text-sm font-semibold text-[#27623b] hover:underline">← Back to BodhiMart</Link>
        <header className="mt-8 rounded-3xl bg-[#173f2b] p-7 text-white shadow-sm sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e1bd59]">Buyer account</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">My BodhiMart</h1>
          <p className="mt-3 text-sm text-white/80">{summary?.email || 'Your account overview'}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/bodhimart/products" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#e1bd59] px-5 py-3 text-sm font-bold text-[#183426] transition hover:bg-[#edd17e]">Continue shopping</Link>
            <button type="button" onClick={handleSignOut} disabled={signingOut} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </header>

        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}

        <section aria-label="Account links" className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href} className="group rounded-2xl border border-[#e3e8df] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#bfd2c1] hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <span aria-hidden="true" className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf4eb] text-xl text-[#27623b]">{item.icon}</span>
                {summary && <span className="rounded-full bg-[#f0f4ee] px-3 py-1 text-xs font-bold text-[#27623b]">{summary[item.count]}</span>}
              </div>
              <h2 className="mt-5 text-lg font-semibold text-[#203d2c] group-hover:text-[#27623b]">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#69766d]">{item.description}</p>
            </Link>
          ))}
        </section>

        <p className="mt-8 text-center text-sm text-[#69766d]">Selling on BodhiMart? <Link href="/bodhimart/seller/dashboard" className="font-semibold text-[#27623b] underline">Open seller workspace</Link></p>
      </div>
    </main>
  );
}
