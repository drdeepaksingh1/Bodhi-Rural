'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../../../lib/supabase/client';

type Seller = { id: string; shop_name: string; status: string };
type SellerOrder = {
  id: string;
  order_id: string;
  seller_order_number: string | null;
  status: string;
  subtotal: number | null;
  seller_amount: number | null;
  created_at: string;
};
type MarketplaceOrder = {
  id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  delivery_method: string;
  customer_notes: string | null;
  total_amount: number;
  created_at: string;
};
type OrderItem = {
  order_id: string;
  product_name_snapshot: string;
  sku_snapshot: string | null;
  unit: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
};

const supabase = createClient();
const money = (value: number | null | undefined) =>
  '₹' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const readable = (value: string | null | undefined) =>
  (value || '—').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function SellerOrdersPage() {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [marketOrders, setMarketOrders] = useState<Record<string, MarketplaceOrder>>({});
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError('');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setError('Please sign in with your seller account to view orders.');
        return;
      }

      const { data: sellerData, error: sellerError } = await supabase
        .from('marketplace_sellers')
        .select('id, shop_name, status')
        .eq('user_id', user.id)
        .maybeSingle();
      if (sellerError) throw sellerError;
      if (!sellerData) {
        setError('There is no seller account linked to this sign-in.');
        return;
      }
      if (sellerData.status !== 'ACTIVE') {
        setError('This seller account is not active. Contact BodhiMart administration for help.');
        return;
      }
      setSeller(sellerData);

      const { data: sellerOrderRows, error: ordersError } = await supabase
        .from('marketplace_seller_orders')
        .select('id, order_id, seller_order_number, status, subtotal, seller_amount, created_at')
        .eq('seller_id', sellerData.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (ordersError) throw ordersError;

      const orderRows = (sellerOrderRows || []) as SellerOrder[];
      setOrders(orderRows);
      const ids = [...new Set(orderRows.map((order) => order.order_id))];
      if (ids.length === 0) {
        setMarketOrders({});
        setItemsByOrder({});
        return;
      }

      const [marketResult, itemResult] = await Promise.all([
        supabase
          .from('marketplace_orders')
          .select('id, order_number, order_status, payment_status, delivery_method, customer_notes, total_amount, created_at')
          .in('id', ids),
        supabase
          .from('marketplace_order_items')
          .select('order_id, product_name_snapshot, sku_snapshot, unit, quantity, unit_price, line_total')
          .eq('seller_id', sellerData.id)
          .in('order_id', ids),
      ]);
      if (marketResult.error) throw marketResult.error;
      if (itemResult.error) throw itemResult.error;

      const marketMap: Record<string, MarketplaceOrder> = {};
      for (const row of (marketResult.data || []) as MarketplaceOrder[]) marketMap[row.id] = row;
      const itemMap: Record<string, OrderItem[]> = {};
      for (const row of (itemResult.data || []) as OrderItem[]) {
        itemMap[row.order_id] ||= [];
        itemMap[row.order_id].push(row);
      }
      setMarketOrders(marketMap);
      setItemsByOrder(itemMap);
    } catch (cause) {
      console.error('Unable to load seller orders.', cause);
      setError('Orders could not be loaded. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  }

  const statuses = useMemo(() => [...new Set(orders.map((order) => order.status))].sort(), [orders]);
  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const market = marketOrders[order.order_id];
      const matchesStatus = filter === 'ALL' || order.status === filter;
      const itemText = (itemsByOrder[order.order_id] || [])
        .map((item) => [item.product_name_snapshot, item.sku_snapshot].join(' '))
        .join(' ')
        .toLowerCase();
      const matchesSearch = !term
        || (order.seller_order_number || '').toLowerCase().includes(term)
        || (market?.order_number || '').toLowerCase().includes(term)
        || itemText.includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [orders, marketOrders, itemsByOrder, filter, search]);

  return (
    <main className="orders-page">
      <div className="orders-shell">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/bodhimart/seller/dashboard">Seller dashboard</Link>
          <span aria-hidden="true">/</span>
          <span>Orders</span>
        </nav>

        <header className="page-header">
          <div>
            <p className="eyebrow">BODHIMART SELLER CENTER</p>
            <h1>Customer orders</h1>
            <p>{seller ? seller.shop_name : 'View orders placed for your products.'}</p>
          </div>
          <div className="header-actions">
            <Link className="secondary" href="/bodhimart/seller/dashboard">Dashboard</Link>
            <button className="primary" type="button" onClick={() => void loadOrders()} disabled={loading}>
              {loading ? 'Refreshing…' : '↻ Refresh'}
            </button>
          </div>
        </header>

        {error ? (
          <section className="message-card" role="alert">
            <h2>Orders unavailable</h2>
            <p>{error}</p>
            <button className="primary" type="button" onClick={() => void loadOrders()}>Try again</button>
          </section>
        ) : loading ? (
          <section className="message-card" aria-live="polite">
            <p>Loading your orders…</p>
          </section>
        ) : orders.length === 0 ? (
          <section className="message-card">
            <div className="empty-icon" aria-hidden="true">🛍️</div>
            <h2>No orders yet</h2>
            <p>When customers order your products, they will appear here.</p>
            <Link className="secondary" href="/bodhimart/seller/inventory">Check inventory</Link>
          </section>
        ) : (
          <>
            <section className="filters" aria-label="Filter orders">
              <label>
                <span>Search orders</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Order number or product"
                />
              </label>
              <label>
                <span>Order status</span>
                <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                  <option value="ALL">All statuses</option>
                  {statuses.map((status) => <option key={status} value={status}>{readable(status)}</option>)}
                </select>
              </label>
              <p className="result-count">{filteredOrders.length} of {orders.length} orders</p>
            </section>

            {filteredOrders.length === 0 ? (
              <section className="message-card">
                <h2>No matching orders</h2>
                <p>Try a different search or status filter.</p>
              </section>
            ) : (
              <section className="order-list" aria-label="Seller orders">
                {filteredOrders.map((order) => {
                  const market = marketOrders[order.order_id];
                  const items = itemsByOrder[order.order_id] || [];
                  return (
                    <article className="order-card" key={order.id}>
                      <div className="order-heading">
                        <div>
                          <p className="eyebrow">SELLER ORDER</p>
                          <h2>{order.seller_order_number || order.id.slice(0, 8)}</h2>
                          <p className="muted">
                            Customer order {market?.order_number || '—'} ·{' '}
                            {new Date(order.created_at).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="status-stack">
                          <span className="status-pill">{readable(order.status)}</span>
                          <span className="muted">Payment: {readable(market?.payment_status)}</span>
                        </div>
                      </div>

                      <div className="order-meta">
                        <div><span>Fulfilment</span><strong>{readable(market?.delivery_method)}</strong></div>
                        <div><span>Items subtotal</span><strong>{money(order.subtotal)}</strong></div>
                        <div><span>Seller amount</span><strong>{money(order.seller_amount)}</strong></div>
                        <div><span>Order total</span><strong>{money(market?.total_amount)}</strong></div>
                      </div>

                      <div className="items">
                        <h3>Items</h3>
                        {items.length ? (
                          <ul>
                            {items.map((item, index) => (
                              <li key={item.order_id + ':' + item.sku_snapshot + ':' + index}>
                                <span>
                                  <strong>{item.product_name_snapshot}</strong>
                                  <small>{item.sku_snapshot || 'No SKU'} · {item.quantity} {item.unit || 'unit'} × {money(item.unit_price)}</small>
                                </span>
                                <strong>{money(item.line_total)}</strong>
                              </li>
                            ))}
                          </ul>
                        ) : <p className="muted">Item details are not available for this order.</p>}
                      </div>

                      {market?.customer_notes && (
                        <div className="seller-note">
                          <strong>Note for seller</strong>
                          <p>{market.customer_notes}</p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .orders-page { min-height: 75vh; background: #f5f8f5; padding: 34px 20px 60px; }
        .orders-shell { max-width: 1100px; margin: 0 auto; }
        .breadcrumbs { display:flex; gap:9px; color:#728075; font-size:13px; margin-bottom:18px; }
        .breadcrumbs a { color:#145c2b; text-decoration:none; font-weight:700; }
        .page-header { display:flex; justify-content:space-between; align-items:flex-end; gap:20px; margin-bottom:22px; }
        .eyebrow { color:#145c2b; font-size:11px; font-weight:800; letter-spacing:1.3px; margin:0 0 6px; }
        h1 { color:#173d24; font-size:32px; margin:0; }
        .page-header p:not(.eyebrow) { color:#667267; margin:7px 0 0; }
        .header-actions { display:flex; gap:9px; flex-wrap:wrap; }
        .primary,.secondary { display:inline-flex; justify-content:center; align-items:center; border:0; border-radius:9px; padding:11px 16px; font-weight:700; font-size:14px; text-decoration:none; cursor:pointer; }
        .primary { background:#145c2b; color:white; }
        .primary:disabled { opacity:.65; cursor:wait; }
        .secondary { background:white; color:#145c2b; border:1px solid #dce6dd; }
        .message-card { background:white; border:1px solid #e2e9e3; border-radius:16px; padding:42px 24px; text-align:center; box-shadow:0 4px 18px rgba(0,0,0,.04); }
        .message-card h2 { color:#173d24; margin:8px 0; }
        .message-card p { color:#68736b; margin:8px 0 18px; }
        .empty-icon { font-size:38px; }
        .filters { display:grid; grid-template-columns:minmax(240px,1fr) 220px auto; gap:14px; align-items:end; background:white; border:1px solid #e2e9e3; border-radius:14px; padding:16px; margin-bottom:16px; }
        .filters label span { display:block; color:#546157; font-size:12px; font-weight:700; margin-bottom:6px; }
        input,select { width:100%; height:42px; border:1px solid #d8e2d9; border-radius:8px; padding:0 11px; background:white; color:#26372b; font:inherit; }
        .result-count { color:#68736b; font-size:13px; margin:0; padding-bottom:12px; white-space:nowrap; }
        .order-list { display:grid; gap:15px; }
        .order-card { background:white; border:1px solid #e2e9e3; border-radius:15px; padding:20px; box-shadow:0 4px 18px rgba(0,0,0,.035); }
        .order-heading { display:flex; justify-content:space-between; gap:16px; padding-bottom:15px; border-bottom:1px solid #edf1ed; }
        .order-heading h2 { color:#173d24; font-size:19px; margin:0; }
        .muted { color:#778078; font-size:12px; margin:6px 0 0; }
        .status-stack { display:flex; flex-direction:column; align-items:flex-end; gap:7px; text-align:right; }
        .status-pill { display:inline-flex; border-radius:99px; background:#eaf4ec; color:#145c2b; padding:6px 10px; font-size:11px; font-weight:800; }
        .order-meta { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; padding:16px 0; }
        .order-meta div { background:#f7faf7; border-radius:9px; padding:11px; }
        .order-meta span,.order-meta strong { display:block; }
        .order-meta span { color:#778078; font-size:11px; margin-bottom:5px; }
        .order-meta strong { color:#26372b; font-size:14px; }
        .items h3 { color:#26372b; font-size:14px; margin:5px 0 8px; }
        .items ul { list-style:none; margin:0; padding:0; }
        .items li { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:10px 0; border-top:1px solid #edf1ed; color:#26372b; font-size:13px; }
        .items li small { display:block; color:#778078; margin-top:4px; font-size:11px; }
        .items li > strong { white-space:nowrap; }
        .seller-note { margin-top:12px; padding:12px; border-radius:9px; background:#fff9e8; color:#554719; font-size:13px; }
        .seller-note p { margin:5px 0 0; white-space:pre-wrap; }
        @media(max-width:700px) {
          .orders-page { padding:24px 12px 42px; }
          .page-header { align-items:flex-start; flex-direction:column; }
          h1 { font-size:27px; }
          .filters { grid-template-columns:1fr; }
          .result-count { padding-bottom:0; }
          .order-meta { grid-template-columns:repeat(2,1fr); }
        }
        @media(max-width:440px) {
          .order-heading { flex-direction:column; }
          .status-stack { align-items:flex-start; text-align:left; }
          .order-meta { grid-template-columns:1fr 1fr; gap:8px; }
          .order-meta div { padding:9px; }
        }
      `}</style>
    </main>
  );
}
