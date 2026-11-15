import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

type Order = {
  id: string;
  order_number: string;
  subtotal: number;
  tax_amount: number;
  delivery_charge: number;
  total_amount: number;
  payment_status: string;
  order_status: string;
  delivery_method: string | null;
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
  line_total: number;
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function statusClass(value: string) {
  const status = value.toUpperCase();
  if (["DELIVERED", "PAID", "COMPLETED"].includes(status)) return "bg-green-100 text-green-800";
  if (["CANCELLED", "FAILED", "REFUNDED", "RETURNED"].includes(status)) return "bg-red-100 text-red-800";
  if (["DISPATCHED", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(status)) return "bg-blue-100 text-blue-800";
  return "bg-amber-100 text-amber-900";
}

export default async function BodhiMartMyOrdersPage() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  // Explicit customer filter plus existing database RLS; this page does not
  // introduce or bypass any database permissions.
  const { data, error } = await supabase
    .from("marketplace_orders")
    .select("id, order_number, subtotal, tax_amount, delivery_charge, total_amount, payment_status, order_status, delivery_method, created_at")
    .eq("customer_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const orders = (data || []) as Order[];
  let items: OrderItem[] = [];
  let itemError = "";

  if (!error && orders.length) {
    const { data: itemRows, error: itemsQueryError } = await supabase
      .from("marketplace_order_items")
      .select("id, order_id, product_name_snapshot, sku_snapshot, unit, quantity, unit_price, line_total")
      .in("order_id", orders.map((order) => order.id));
    if (itemsQueryError) itemError = itemsQueryError.message;
    else items = (itemRows || []) as OrderItem[];
  }

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const item of items) {
    const current = itemsByOrder.get(item.order_id) || [];
    current.push(item);
    itemsByOrder.set(item.order_id, current);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">BodhiMart</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="mt-2 text-gray-600">View your order history, items and current status.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/bodhimart/products" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700">Shop products</Link>
            <Link href="/bodhimart/cart" className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white">My cart</Link>
          </div>
        </div>

        {error ? (
          <section role="alert" className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
            <h2 className="font-bold">Order history is not available</h2>
            <p className="mt-2">Please try again. Your order data and account permissions have not been changed.</p>
          </section>
        ) : itemError ? (
          <section role="alert" className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
            Order records loaded, but item details could not be displayed. No database permissions were changed.
          </section>
        ) : orders.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <div className="text-4xl">📦</div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">No orders yet</h2>
            <p className="mt-2 text-gray-600">Your BodhiMart orders will appear here.</p>
            <Link href="/bodhimart/products" className="mt-6 inline-block rounded-lg bg-green-700 px-5 py-3 font-semibold text-white">Explore products</Link>
          </section>
        ) : (
          <section className="mt-8 space-y-5">
            {orders.map((order) => (
              <article key={order.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <header className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Order number</p>
                    <h2 className="mt-1 text-lg font-bold text-gray-900">{order.order_number}</h2>
                    <p className="mt-1 text-sm text-gray-500">{new Date(order.created_at).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.order_status)}`}>{order.order_status.replaceAll("_", " ")}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.payment_status)}`}>Payment: {order.payment_status.replaceAll("_", " ")}</span>
                  </div>
                </header>
                <div className="divide-y divide-gray-100 px-5">
                  {(itemsByOrder.get(order.id) || []).map((item) => (
                    <div key={item.id} className="flex flex-wrap justify-between gap-3 py-4 text-sm">
                      <div>
                        <p className="font-semibold text-gray-900">{item.product_name_snapshot}</p>
                        <p className="mt-1 text-gray-500">{item.sku_snapshot ? `SKU: ${item.sku_snapshot} · ` : ""}{item.quantity} {item.unit || "unit"} × {money(item.unit_price)}</p>
                      </div>
                      <p className="font-semibold text-gray-900">{money(item.line_total)}</p>
                    </div>
                  ))}
                </div>
                <footer className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-5">
                  <div className="text-sm text-gray-600">Fulfilment: {order.delivery_method || "To be confirmed"}</div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Order total</p>
                    <p className="text-xl font-bold text-gray-900">{money(order.total_amount)}</p>
                  </div>
                </footer>
              </article>
            ))}
          </section>
        )}
        <p className="mt-6 text-xs text-gray-500">Showing up to 100 recent orders. Order and item details are read-only.</p>
      </div>
    </main>
  );
}
