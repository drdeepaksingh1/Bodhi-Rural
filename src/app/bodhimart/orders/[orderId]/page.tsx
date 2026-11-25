'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';

type Order = {
  id: string;
  order_number: string;
  subtotal: number;
  discount_amount: number;
  delivery_charge: number;
  tax_amount: number;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  order_status: string;
  delivery_method: string;
  delivery_address_snapshot: {
    recipient_name?: string;
    address_line1?: string;
    address_line2?: string | null;
    landmark?: string | null;
    pincode?: string | null;
  } | null;
  created_at: string;
};

type OrderItem = {
  id: string;
  product_name_snapshot: string;
  sku_snapshot: string | null;
  unit: string | null;
  quantity: number;
  unit_price: number;
  tax_amount: number;
  discount_amount: number;
  line_total: number;
};

type SellerPackage = { id: string; status: string; updated_at: string };

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function title(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function BodhiMartOrderReceiptPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [packages, setPackages] = useState<SellerPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (!user && authError?.message === 'Auth session missing!') {
        router.replace(`/login?account=buyer&redirect=${encodeURIComponent(`/bodhimart/orders/${orderId}`)}`);
        return;
      }
      if (authError) throw authError;
      if (!user) {
        router.replace(`/login?account=buyer&redirect=${encodeURIComponent(`/bodhimart/orders/${orderId}`)}`);
        return;
      }

      const { data: orderRow, error: orderError } = await supabase
        .from('marketplace_orders')
        .select('id, order_number, subtotal, discount_amount, delivery_charge, tax_amount, total_amount, payment_status, payment_method, order_status, delivery_method, delivery_address_snapshot, created_at')
        .eq('id', orderId)
        .eq('customer_user_id', user.id)
        .maybeSingle();
      if (orderError) throw orderError;
      if (!orderRow) throw new Error('This order could not be found in your account.');

      const [itemsResult, packagesResult] = await Promise.all([
        supabase
          .from('marketplace_order_items')
          .select('id, product_name_snapshot, sku_snapshot, unit, quantity, unit_price, tax_amount, discount_amount, line_total')
          .eq('order_id', orderRow.id),
        supabase
          .from('marketplace_seller_orders')
          .select('id, status, updated_at')
          .eq('order_id', orderRow.id),
      ]);
      if (itemsResult.error) throw itemsResult.error;
      if (packagesResult.error) throw packagesResult.error;

      setOrder(orderRow as Order);
      setItems((itemsResult.data || []) as OrderItem[]);
      setPackages((packagesResult.data || []) as SellerPackage[]);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load this order.');
    } finally {
      setLoading(false);
    }
  }, [orderId, router, supabase]);

  useEffect(() => {
    // This page reads a single order scoped to the current shopper.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOrder();
  }, [loadOrder]);

  const address = order?.delivery_address_snapshot;

  return (
    <main className="receipt-root min-h-screen bg-[#f6f8f5] px-4 py-8 text-[#183426] sm:px-6">
      <div className="receipt-page mx-auto max-w-3xl">
        <div className="print-controls mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/bodhimart/orders" className="text-sm font-semibold text-green-800 hover:underline">← Back to my orders</Link>
          <button type="button" onClick={() => window.print()} disabled={!order} className="rounded-xl bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900 disabled:opacity-50">Print order summary</button>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center text-gray-600 shadow-sm">Loading order details…</div>
        ) : error || !order ? (
          <section className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h1 className="text-xl font-bold text-gray-900">Order unavailable</h1>
            <p className="mt-2 text-sm text-gray-600">{error || 'This order could not be found in your account.'}</p>
            <Link href="/bodhimart/orders" className="mt-6 inline-flex rounded-xl bg-green-800 px-5 py-3 text-sm font-bold text-white">Back to my orders</Link>
          </section>
        ) : (
          <article className="receipt-card overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <header className="border-b border-gray-200 bg-[#f7faf5] p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-800">BodhiMart · Order summary</p>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-950">{order.order_number}</h1>
                  <p className="mt-1 text-sm text-gray-600">Placed {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                <div className="text-sm sm:text-right">
                  <p><span className="text-gray-500">Order status:</span> <strong>{title(order.order_status)}</strong></p>
                  <p className="mt-1"><span className="text-gray-500">Payment:</span> <strong>{title(order.payment_status)}</strong></p>
                  <p className="mt-1"><span className="text-gray-500">Payment method:</span> <strong>{order.payment_status === 'PAID' ? 'Paid' : order.payment_method === 'PAY_AT_PICKUP' ? 'Pay at pickup' : 'Pay on delivery'}</strong></p>
                </div>
              </div>
            </header>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4 text-sm sm:px-8">
              <p className="text-gray-600">Need help with delivery or payment?</p>
              <a
                href={`mailto:bodhirural@gmail.com?subject=${encodeURIComponent(`BodhiMart order ${order.order_number}`)}`}
                className="font-semibold text-green-800 underline underline-offset-2 hover:text-green-950"
              >
                Contact Bodhi Rural about this order
              </a>
            </div>

            <div className="space-y-7 p-6 sm:p-8">
              {order.payment_status.toUpperCase() === 'PENDING' && (
                <section role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <h2 className="font-bold">Payment is due {order.payment_method === 'PAY_AT_PICKUP' ? 'at pickup' : 'when your order is delivered'}</h2>
                  <p className="mt-1">Pay the seller directly. Your order will show as paid after BodhiMart confirms the collection.</p>
                </section>
              )}
              {order.payment_status.toUpperCase() === 'PAID' && (
                <section role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                  <h2 className="font-bold">Payment confirmed</h2>
                  <p className="mt-1">BodhiMart has recorded payment for this order.</p>
                </section>
              )}
              {order.delivery_method !== 'PICKUP' && address && (
                <section>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Delivery address</h2>
                  <div className="mt-2 text-sm leading-6 text-gray-800">
                    {address.recipient_name && <p className="font-semibold">{address.recipient_name}</p>}
                    {address.address_line1 && <p>{address.address_line1}</p>}
                    {address.address_line2 && <p>{address.address_line2}</p>}
                    {address.landmark && <p>Near {address.landmark}</p>}
                    {address.pincode && <p>{address.pincode}</p>}
                  </div>
                </section>
              )}

              <section>
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Items</h2>
                <div className="mt-3 divide-y divide-gray-100 border-y border-gray-100">
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto] gap-4 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{item.product_name_snapshot}</p>
                        <p className="mt-1 text-sm text-gray-500">{item.quantity} {item.unit || 'unit'} × {money(item.unit_price)}{item.sku_snapshot ? ` · SKU ${item.sku_snapshot}` : ''}</p>
                      </div>
                      <p className="font-semibold text-gray-900">{money(item.line_total)}</p>
                    </div>
                  ))}
                  {items.length === 0 && <p className="py-4 text-sm text-gray-500">No item details were returned for this order.</p>}
                </div>
              </section>

              {packages.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Seller fulfilment</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {packages.map((sellerPackage, index) => (
                      <div key={sellerPackage.id} className="rounded-xl border border-gray-200 p-4">
                        <p className="font-semibold text-gray-900">Package {index + 1}: {title(sellerPackage.status)}</p>
                        <p className="mt-1 text-xs text-gray-500">Updated {new Date(sellerPackage.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="ml-auto max-w-sm border-t border-gray-200 pt-4 text-sm">
                <div className="flex justify-between gap-4 py-1"><span className="text-gray-600">Items</span><span>{money(order.subtotal)}</span></div>
                {Number(order.discount_amount) > 0 && <div className="flex justify-between gap-4 py-1"><span className="text-gray-600">Discount</span><span>−{money(order.discount_amount)}</span></div>}
                <div className="flex justify-between gap-4 py-1"><span className="text-gray-600">Delivery</span><span>{money(order.delivery_charge)}</span></div>
                <div className="flex justify-between gap-4 py-1"><span className="text-gray-600">Tax</span><span>{money(order.tax_amount)}</span></div>
                <div className="mt-2 flex justify-between gap-4 border-t border-gray-200 pt-3 text-lg font-bold"><span>Total</span><span className="text-green-900">{money(order.total_amount)}</span></div>
                <p className="mt-3 text-right text-xs text-gray-500">{title(order.delivery_method)} fulfilment</p>
              </section>
            </div>

            <footer className="border-t border-gray-100 px-6 py-4 text-center text-xs text-gray-500 sm:px-8">
              This is an order summary, not a tax invoice. Payment status: {title(order.payment_status)}.
            </footer>
          </article>
        )}
      </div>

      <style jsx global>{`
        @page { size: A4 portrait; margin: 14mm; }
        @media print {
          body { background: #fff !important; }
          .receipt-root { min-height: 0 !important; background: #fff !important; padding: 0 !important; }
          .receipt-page { max-width: none !important; margin: 0 !important; }
          .print-controls { display: none !important; }
          .receipt-card { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
          .receipt-card section, .receipt-card header, .receipt-card footer { break-inside: avoid; }
        }
      `}</style>
    </main>
  );
}

