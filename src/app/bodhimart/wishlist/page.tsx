'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

const marketplacePhotoLoader = ({ src }: { src: string }) => src;

type SavedItem = {
  id: string;
  product_id: string;
  created_at: string;
};

type Product = {
  id: string;
  product_id: string;
  name: string;
  image_url: string | null;
  selling_price: number;
  mrp: number;
  unit: string | null;
};

type WishlistEntry = SavedItem & { product: Product | null };

function productEmoji(name: string) {
  if (/biscuit|cookie|cracker/i.test(name)) return '🍪';
  if (/rice|grain|cereal/i.test(name)) return '🍚';
  if (/milk|dairy|cheese|butter/i.test(name)) return '🥛';
  if (/fruit|vegetable|produce/i.test(name)) return '🥬';
  if (/seed/i.test(name)) return '🌱';
  if (/feed|poultry|layer/i.test(name)) return '🐓';
  return '📦';
}

export default function BodhiMartWishlistPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [items, setItems] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!user && authError?.message === 'Auth session missing!') {
        router.replace('/login?account=buyer&redirect=%2Fbodhimart%2Fwishlist');
        return;
      }
      if (authError) throw authError;
      if (!user) {
        router.replace('/login?account=buyer&redirect=%2Fbodhimart%2Fwishlist');
        return;
      }

      const { data: savedItems, error: savedError } = await supabase
        .from('marketplace_wishlist_items')
        .select('id, product_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (savedError) throw savedError;
      const saved = (savedItems || []) as SavedItem[];

      if (saved.length === 0) {
        setItems([]);
        return;
      }

      const { data: products, error: productsError } = await supabase
        .from('marketplace_public_products')
        .select('id, product_id, name, image_url, selling_price, mrp, unit')
        .in('id', saved.map((item) => item.product_id));

      if (productsError) throw productsError;
      const productMap = new Map(
        ((products || []) as Product[]).map((product) => [product.id, product])
      );
      setItems(saved.map((item) => ({
        ...item,
        product: productMap.get(item.product_id) || null,
      })));
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load your saved items.'
      );
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    // Wishlist data is fetched from the signed-in user's private database rows.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadWishlist();
  }, [loadWishlist]);

  async function removeItem(item: WishlistEntry) {
    if (removingId) return;
    setRemovingId(item.id);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login?account=buyer&redirect=%2Fbodhimart%2Fwishlist');
        return;
      }

      const { error: removeError } = await supabase
        .from('marketplace_wishlist_items')
        .delete()
        .eq('id', item.id)
        .eq('user_id', user.id);

      if (removeError) throw removeError;
      setItems((current) => current.filter((saved) => saved.id !== item.id));
    } catch (removeError: unknown) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : 'Unable to remove this saved item.'
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5] text-[#183426]">
      <section className="bg-green-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-200">BodhiMart</p>
            <h1 className="mt-2 text-3xl font-bold">Your saved items</h1>
            <p className="mt-2 text-sm text-green-100">Keep products here while you compare and plan your next order.</p>
          </div>
          <Link href="/bodhimart/products" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-green-900 hover:bg-green-50">
            Continue shopping
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center text-gray-600 shadow-sm">Loading your saved items…</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm">
            <div className="text-5xl" aria-hidden="true">♡</div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">Your saved list is empty</h2>
            <p className="mt-2 text-sm text-gray-600">Save a product from its details page and it will appear here.</p>
            <Link href="/bodhimart/products" className="mt-6 inline-flex rounded-xl bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900">Browse products</Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-600">{items.length} saved item{items.length === 1 ? '' : 's'}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <div className="relative flex h-48 items-center justify-center overflow-hidden bg-[#f1f6ee]">
                    {item.product?.image_url ? (
                      <Image src={item.product.image_url} alt={item.product.name} fill sizes="(max-width: 640px) 100vw, 33vw" loader={marketplacePhotoLoader} unoptimized className="bg-white object-contain p-4" />
                    ) : (
                      <span className="text-6xl" aria-hidden="true">{productEmoji(item.product?.name || 'product')}</span>
                    )}
                    {!item.product && <span className="absolute bottom-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-600">Currently unavailable</span>}
                  </div>
                  <div className="p-5">
                    {item.product ? (
                      <>
                        <h2 className="text-lg font-bold text-gray-900">{item.product.name}</h2>
                        {item.product.unit && <p className="mt-1 text-sm text-gray-500">{item.product.unit}</p>}
                        <p className="mt-3 text-2xl font-bold text-green-900">₹{Number(item.product.selling_price).toLocaleString('en-IN')}</p>
                        {item.product.mrp > item.product.selling_price && <p className="mt-1 text-xs text-gray-500">MRP <span className="line-through">₹{Number(item.product.mrp).toLocaleString('en-IN')}</span></p>}
                        <Link href={`/bodhimart/products/${item.product.product_id}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-900">View product</Link>
                      </>
                    ) : (
                      <>
                        <h2 className="text-lg font-bold text-gray-900">Saved product</h2>
                        <p className="mt-1 text-sm text-gray-500">This item is no longer in the public catalogue.</p>
                      </>
                    )}
                    <button type="button" onClick={() => void removeItem(item)} disabled={removingId === item.id} className="mt-3 min-h-10 w-full rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                      {removingId === item.id ? 'Removing…' : 'Remove from saved items'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
