"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";
import PayMarketplaceOrderButton from "../../../components/bodhimart/PayMarketplaceOrderButton";

type MarketplaceOrder = {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: string;
  order_status: string;
  delivery_method: string;
  created_at: string;
};
const supabase = createClient();

export default function BodhiMartOrdersPage() {
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { void loadOrders(); }, []);

  async function loadOrders() {
    setLoading(true);
    setError("");
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setError("Sign in to view your orders.");
      setLoading(false);
      return;
    }
    const { data, error: orderError } = await supabase
      .from("marketplace_orders")
      .select("id, order_number, total_amount, payment_status, order_status, delivery_method, created_at")
      .eq("customer_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (orderError) setError("Unable to load your orders. Please refresh the page.");
    else setOrders((data || []) as MarketplaceOrder[]);
    setLoading(false);
  }

  function money(value: number) {
    return "₹" + Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/bodhimart/products" className="text-sm font-semibold text-green-800 hover:underline">← Continue shopping</Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-wide text-green-700">BodhiMart</p><h1 className="text-3xl font-bold">My orders</h1></div>
          <button onClick={() => void loadOrders()} className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-800">Refresh</button>
        </div>
        {error && <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</p>}
        {loading ? <div className="mt-8 rounded-2xl bg-white p-10 text-center text-gray-600">Loading your orders…</div>
          : orders.length === 0 ? <div className="mt-8 rounded-2xl bg-white p-10 text-center text-gray-600">You do not have any BodhiMart orders yet.</div>
          : <div className="mt-8 space-y-4">{orders.map((order) => (
            <article key={order.id} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><h2 className="font-bold text-gray-900">{order.order_number}</h2><p className="mt-1 text-sm text-gray-500">{new Date(order.created_at).toLocaleString("en-IN")}</p></div>
                <strong className="text-lg text-green-800">{money(order.total_amount)}</strong>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span>Order: <strong>{order.order_status}</strong></span>
                <span>Payment: <strong>{order.payment_status}</strong></span>
                <span>Method: {order.delivery_method}</span>
              </div>
              {order.payment_status === "PENDING" && order.order_status !== "CANCELLED" && (
                <div className="mt-5 max-w-sm">
                  <PayMarketplaceOrderButton marketplaceOrderId={order.id} orderNumber={order.order_number} onPaid={() => {
                    setOrders((current) => current.map((item) => item.id === order.id ? { ...item, payment_status: "PAID" } : item));
                  }} />
                </div>
              )}
            </article>
          ))}</div>}
      </div>
    </main>
  );
}
