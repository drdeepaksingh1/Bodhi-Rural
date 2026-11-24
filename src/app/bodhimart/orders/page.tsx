'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

type CustomerOrder = {
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
  created_at: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_name_snapshot: string;
  sku_snapshot: string | null;
  unit: string | null;
  quantity: number;
  unit_price: number;
  tax_amount: number;
  line_total: number;
};

type SellerPackage = {
  id: string;
  order_id: string;
  status: string;
  updated_at: string;
};

function currency(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function label(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(value: string) {
  const normalized = value.toUpperCase();
  if (['DELIVERED', 'COMPLETED', 'PICKED_UP'].includes(normalized)) return 'bg-green-100 text-green-800';
  if (['CANCELLED', 'REJECTED', 'FAILED'].includes(normalized)) return 'bg-red-100 text-red-800';
  if (normalized === 'DISPATCHED') return 'bg-blue-100 text-blue-800';
  if (['PENDING', 'PLACED', 'PROCESSING', 'ACCEPTED', 'PACKED', 'READY', 'READY_FOR_DISPATCH'].includes(normalized)) return 'bg-amber-100 text-amber-800';
  return 'bg-gray-100 text-gray-700';
}

function fulfillmentStep(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === 'DELIVERED') return 4;
  if (['READY', 'READY_FOR_DISPATCH', 'DISPATCHED'].includes(normalized)) return 3;
  if (['PROCESSING', 'PACKED'].includes(normalized)) return 2;
  if (normalized === 'ACCEPTED') return 1;
  if (normalized === 'PLACED') return 0;
  return -1;
}

function SellerPackageProgress({
  status,
  deliveryMethod,
}: {
  status: string;
  deliveryMethod: string;
}) {
  const normalized = status.toUpperCase();
  if (['CANCELLED', 'RETURNED'].includes(normalized)) {
    return (
      <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
        This package was {label(normalized).toLowerCase()}.
      </p>
    );
  }

  const activeStep = fulfillmentStep(normalized);
  if (activeStep < 0) return null;

  const steps = [
    'Placed',
    'Accepted',
    'Preparing',
    normalized === 'DISPATCHED'
      ? 'Dispatched'
      : deliveryMethod === 'PICKUP'
        ? 'Ready for pickup'
        : 'Ready for dispatch',
    'Complete',
  ];

  return (
    <ol
      aria-label={`Fulfilment progress: ${label(normalized)}`}
      className="mt-4 grid grid-cols-5 gap-1"
    >
      {steps.map((step, index) => {
        const complete = index < activeStep;
        const current = index === activeStep;
        const reached = complete || current;
        return (
          <li key={step} className="relative text-center">
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-3 h-0.5 w-full ${index < activeStep ? 'bg-green-600' : 'bg-gray-200'}`}
              />
            )}
            <span
              className={`relative z-10 mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${reached ? 'bg-green-700 text-white' : 'border border-gray-300 bg-white text-gray-400'}`}
            >
              {complete ? '✓' : index + 1}
            </span>
            <span className={`mt-1 block px-0.5 text-[9px] leading-tight sm:text-[10px] ${reached ? 'font-semibold text-green-900' : 'text-gray-400'}`}>
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function BodhiMartOrdersPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItem[]>>({});
  const [packagesByOrder, setPackagesByOrder] = useState<Record<string, SellerPackage[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (!user && authError?.message === 'Auth session missing!') {
        router.replace('/login?account=buyer&redirect=%2Fbodhimart%2Forders');
        return;
      }
      if (authError) throw authError;
      if (!user) {
        router.replace('/login?account=buyer&redirect=%2Fbodhimart%2Forders');
        return;
      }

      const { data: orderRows, error: ordersError } = await supabase
        .from('marketplace_orders')
        .select('id, order_number, subtotal, discount_amount, delivery_charge, tax_amount, total_amount, payment_status, payment_method, order_status, delivery_method, created_at')
        .eq('customer_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (ordersError) throw ordersError;
      const customerOrders = (orderRows || []) as CustomerOrder[];
      setOrders(customerOrders);

      if (customerOrders.length === 0) {
        setItemsByOrder({});
        setPackagesByOrder({});
        return;
      }

      const orderIds = customerOrders.map((order) => order.id);
      const [itemResult, packageResult] = await Promise.all([
        supabase
          .from('marketplace_order_items')
          .select('id, order_id, product_name_snapshot, sku_snapshot, unit, quantity, unit_price, tax_amount, line_total')
          .in('order_id', orderIds),
        supabase
          .from('marketplace_seller_orders')
          .select('id, order_id, status, updated_at')
          .in('order_id', orderIds),
      ]);

      if (itemResult.error) throw itemResult.error;
      if (packageResult.error) throw packageResult.error;
      const grouped: Record<string, OrderItem[]> = {};
      for (const item of (itemResult.data || []) as OrderItem[]) {
        grouped[item.order_id] ||= [];
        grouped[item.order_id].push(item);
      }
      setItemsByOrder(grouped);

      const packages: Record<string, SellerPackage[]> = {};
      for (const sellerPackage of (packageResult.data || []) as SellerPackage[]) {
        packages[sellerPackage.order_id] ||= [];
        packages[sellerPackage.order_id].push(sellerPackage);
      }
      setPackagesByOrder(packages);
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load your orders.'
      );
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  const cancelOrder = useCallback(async (order: CustomerOrder) => {
    const confirmed = window.confirm(
      `Cancel order ${order.order_number}? You can cancel only before a seller accepts it.`
    );
    if (!confirmed) return;

    setCancellingOrderId(order.id);
    setError('');
    try {
      const { error: cancelError } = await supabase.rpc(
        'customer_cancel_marketplace_order',
        { p_order_id: order.id }
      );
      if (cancelError) throw cancelError;
      await loadOrders();
    } catch (cancelError: unknown) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : 'Unable to cancel this order. Refresh the page and try again.'
      );
    } finally {
      setCancellingOrderId(null);
    }
  }, [loadOrders, supabase]);

  useEffect(() => {
    // This page loads the authenticated shopper's order history from Supabase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOrders();
  }, [loadOrders]);

  return (
    <main className="min-h-screen bg-[#f6f8f5] text-[#183426]">
      <section className="bg-green-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-200">BodhiMart</p>
            <h1 className="mt-2 text-3xl font-bold">My orders</h1>
            <p className="mt-2 text-sm text-green-100">Review order details, payment status, and fulfilment progress.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void loadOrders()} disabled={loading} className="rounded-xl border border-white/40 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60">{loading ? 'Refreshing…' : 'Refresh'}</button>
            <Link href="/bodhimart/products" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-green-900 hover:bg-green-50">Continue shopping</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center text-gray-600 shadow-sm">Loading your orders…</div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm">
            <div className="text-5xl" aria-hidden="true">📦</div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">No orders yet</h2>
            <p className="mt-2 text-sm text-gray-600">Your BodhiMart orders will appear here after checkout.</p>
            <Link href="/bodhimart/products" className="mt-6 inline-flex rounded-xl bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900">Browse products</Link>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-gray-600">{orders.length} order{orders.length === 1 ? '' : 's'}</p>
            {orders.map((order) => {
              const sellerPackages = packagesByOrder[order.id] || [];
              const canCancel =
                order.order_status.toUpperCase() === 'PLACED' &&
                order.payment_status.toUpperCase() === 'PENDING' &&
                sellerPackages.length > 0 &&
                sellerPackages.every((sellerPackage) => sellerPackage.status.toUpperCase() === 'PLACED');

              return (
              <article key={order.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 bg-[#fbfcfa] p-5 sm:p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Order number</p>
                    <h2 className="mt-1 text-lg font-bold text-gray-900">{order.order_number}</h2>
                    <p className="mt-1 text-sm text-gray-500">Placed {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusClass(order.order_status)}`}>{label(order.order_status)}</span>
                    <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusClass(order.payment_status)}`}>Payment: {label(order.payment_status)}</span>
                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900">
                      {order.payment_status === 'PAID' ? 'Paid' : order.payment_method === 'PAY_AT_PICKUP' ? 'Pay at pickup' : 'Pay on delivery'}
                    </span>
                    <Link href={`/bodhimart/orders/${order.id}`} className="rounded-full border border-green-700 px-3 py-1.5 text-xs font-bold text-green-800 hover:bg-green-50">View / print summary</Link>
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => void cancelOrder(order)}
                        disabled={cancellingOrderId !== null}
                        className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                      >
                        {cancellingOrderId === order.id ? 'Cancelling…' : 'Cancel order'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_250px]">
                  <div className="divide-y divide-gray-100">
                    {(itemsByOrder[order.id] || []).map((item) => (
                      <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <div>
                          <p className="font-semibold text-gray-900">{item.product_name_snapshot}</p>
                          <p className="mt-1 text-xs text-gray-500">{item.quantity} {item.unit || 'unit'} × {currency(item.unit_price)}{item.sku_snapshot ? ` · SKU ${item.sku_snapshot}` : ''}</p>
                        </div>
                        <p className="font-semibold text-gray-800">{currency(item.line_total)}</p>
                      </div>
                    ))}
                    {sellerPackages.length > 0 && (
                      <div className="mt-5 border-t border-gray-100 pt-4">
                        <h3 className="mb-3 text-sm font-bold text-gray-800">Seller fulfilment</h3>
                        <div className="space-y-2">
                          {sellerPackages.map((sellerPackage, index) => (
                            <div key={sellerPackage.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-800">Package {index + 1}</p>
                                <p className="mt-1 text-xs text-gray-500">Updated {new Date(sellerPackage.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                <SellerPackageProgress status={sellerPackage.status} deliveryMethod={order.delivery_method} />
                              </div>
                              <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusClass(sellerPackage.status)}`}>
                                {label(sellerPackage.status)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <dl className="rounded-xl bg-gray-50 p-4 text-sm">
                    <div className="flex justify-between gap-3 py-1"><dt className="text-gray-500">Items</dt><dd className="font-medium">{currency(order.subtotal)}</dd></div>
                    {Number(order.discount_amount) > 0 && <div className="flex justify-between gap-3 py-1"><dt className="text-gray-500">Discount</dt><dd className="font-medium text-green-700">−{currency(order.discount_amount)}</dd></div>}
                    <div className="flex justify-between gap-3 py-1"><dt className="text-gray-500">Delivery</dt><dd className="font-medium">{currency(order.delivery_charge)}</dd></div>
                    <div className="flex justify-between gap-3 py-1"><dt className="text-gray-500">Tax</dt><dd className="font-medium">{currency(order.tax_amount)}</dd></div>
                    <div className="mt-2 flex justify-between gap-3 border-t border-gray-200 pt-3 text-base"><dt className="font-bold">Total</dt><dd className="font-bold text-green-900">{currency(order.total_amount)}</dd></div>
                    <p className="mt-3 text-xs text-gray-500">{label(order.delivery_method)} fulfilment</p>
                  </dl>
                </div>
              </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
