'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';
import { Copy } from './language';
import { ProductCardSummary } from './ProductCardSummary';

type Listing = { product_id: string; name: string; image_url: string | null; selling_price: number; unit: string | null; weight: number | null; brand: string | null; description: string | null };
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const photoLoader = ({ src }: { src: string }) => src;

export default function ShopProducts() {
  const client = useMemo(() => createClient(), []);
  const [products, setProducts] = useState<Listing[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const { data, error } = await client.from('marketplace_public_products')
          .select('product_id,name,image_url,selling_price,unit,weight,brand,description')
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(8)
          .abortSignal(controller.signal);
        if (error) throw error;
        if (!controller.signal.aborted) setProducts(data ?? []);
      } catch {
        if (!controller.signal.aborted) { setFailed(true); setProducts([]); }
      }
    })();
    return () => controller.abort();
  }, [client]);

  return (
    <section aria-labelledby="shop-products-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="shop-products-heading" className="text-xl font-bold"><Copy en="Browse products" hi="उत्पाद देखें" /></h2>
        <Link href="/bodhimart/products" className="text-sm font-semibold underline"><Copy en="View all" hi="सभी देखें" /></Link>
      </div>
      {products === null ? <p role="status"><Copy en="Loading products…" hi="उत्पाद लोड हो रहे हैं…" /></p>
        : failed ? <p role="status"><Copy en="Products could not load. Try the full catalogue." hi="उत्पाद लोड नहीं हुए। पूरा कैटलॉग खोलें।" /></p>
        : products.length === 0 ? <p><Copy en="New products will appear here when available." hi="नए उत्पाद उपलब्ध होने पर यहाँ दिखेंगे।" /></p>
        : <ul className="m-0 list-none [display:grid] grid-cols-2 gap-2 p-0 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((item) => (
            <li key={item.product_id} className="min-w-0">
              <Link href={'/bodhimart/products/' + encodeURIComponent(item.product_id) + '?from=%2Fbodhimart'}
                className="block h-full overflow-hidden rounded-xl border border-[#e2e8dd] bg-white shadow-sm">
                <div className="relative flex h-24 items-center justify-center sm:h-44 bg-[#edf2e8]">
                  <Package size={28} aria-hidden="true" />
                  {item.image_url?.startsWith('https://') && <Image src={item.image_url} loader={photoLoader} unoptimized
                    alt="" fill sizes="(max-width: 1024px) 50vw, 25vw" className="bg-white object-contain p-2"
                    onError={(event) => { event.currentTarget.hidden = true; }} />}
                </div>
                <div className="space-y-1 p-2 sm:p-3">
                  <p className="line-clamp-2 text-sm font-semibold">{item.name}</p>
                  <p className="text-sm font-bold">{money.format(item.selling_price)}{item.unit ? ' / ' + item.unit : ''}</p>
                  <ProductCardSummary product={item} />
                </div>
              </Link>
            </li>
          ))}
        </ul>}
    </section>
  );
}
