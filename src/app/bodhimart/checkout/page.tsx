"use client";

import RazorpayTestButton from './RazorpayTestButton';
import { Copy } from '../language';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

type Product = {
  id: string; product_id: string; name: string; sku: string | null; unit: string | null;
  mrp: number; selling_price: number; tax_percent: number;
  minimum_order_quantity: number; maximum_order_quantity: number | null; status: string;
};
type CartItem = { id: string; product_id: string; quantity: number; price_snapshot: number };
type Line = CartItem & { product: Product | null; availableStock: number };
type Address = {
  id: string; address_name: string | null; recipient_name: string; mobile: string;
  address_line1: string; address_line2: string | null; landmark: string | null;
  pincode: string | null; is_default: boolean;
};
type Order = { order_id: string; order_number: string; total_amount: number; delivery_method: "STANDARD" | "PICKUP" };
type AddressForm = {
  address_name: string; recipient_name: string; mobile: string; address_line1: string;
  address_line2: string; landmark: string; pincode: string;
};
const blankAddress: AddressForm = {
  address_name: "", recipient_name: "", mobile: "", address_line1: "",
  address_line2: "", landmark: "", pincode: "",
};
const supabase = createClient();

export default function BodhiMartCheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<Line[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState("NEW");
  const [addressForm, setAddressForm] = useState<AddressForm>(blankAddress);
  const [deliveryMethod, setDeliveryMethod] = useState<"STANDARD" | "PICKUP">("STANDARD");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const requestId = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!user && authError?.message === 'Auth session missing!') {
        router.replace('/login?account=buyer&redirect=%2Fbodhimart%2Fcheckout');
        return;
      }
      if (authError) throw authError;
      if (!user) { router.replace('/login?account=buyer&redirect=%2Fbodhimart%2Fcheckout'); return; }

      const [{ data: cartRow, error: cartError }, { data: addressRows, error: addressError }] =
        await Promise.all([
          supabase.from("marketplace_carts").select("id").eq("user_id", user.id).maybeSingle(),
          supabase.from("marketplace_customer_addresses")
            .select("id, address_name, recipient_name, mobile, address_line1, address_line2, landmark, pincode, is_default")
            .eq("user_id", user.id).order("is_default", { ascending: false }).order("created_at", { ascending: false }),
        ]);
      if (cartError) throw cartError;
      if (addressError) throw addressError;
      const saved = (addressRows || []) as Address[];
      setAddresses(saved);
      setAddressId(saved.find((item) => item.is_default)?.id || saved[0]?.id || "NEW");
      if (!cartRow) { setItems([]); return; }

      const { data: cartRows, error: cartItemsError } = await supabase
        .from("marketplace_cart_items").select("id, product_id, quantity, price_snapshot")
        .eq("cart_id", cartRow.id).order("created_at", { ascending: true });
      if (cartItemsError) throw cartItemsError;
      const cartItems = (cartRows || []) as CartItem[];
      if (!cartItems.length) { setItems([]); return; }

      const ids = cartItems.map((item) => item.product_id);
      const [{ data: productRows, error: productError }, { data: stocks, error: stockError }] =
        await Promise.all([
          supabase.from("marketplace_products")
            .select("id, product_id, name, sku, unit, mrp, selling_price, tax_percent, minimum_order_quantity, maximum_order_quantity, status")
            .in("id", ids),
          supabase.from("marketplace_public_inventory").select("product_id, available_quantity").in("product_id", ids),
        ]);
      if (productError) throw productError;
      if (stockError) throw stockError;

      const byId: Record<string, Product> = {};
      for (const product of (productRows || []) as Product[]) byId[product.id] = product;
      const normalized = await Promise.all(cartItems.map(async (item) => {
        const price = Number(byId[item.product_id]?.selling_price);
        if (byId[item.product_id] && Number.isFinite(price) && price !== Number(item.price_snapshot)) {
          const { error: updateError } = await supabase.from("marketplace_cart_items")
            .update({ price_snapshot: price, updated_at: new Date().toISOString() }).eq("id", item.id);
          if (updateError) throw updateError;
          return { ...item, price_snapshot: price };
        }
        return item;
      }));
      const stockById: Record<string, number> = {};
      for (const row of stocks || []) stockById[row.product_id] = Number(row.available_quantity || 0);
      setItems(normalized.map((item) => ({
        ...item, product: byId[item.product_id] || null, availableStock: stockById[item.product_id] || 0,
      })));
    } catch (cause: unknown) {
      console.error(cause);
      setError(cause instanceof Error ? cause.message : "Unable to prepare checkout.");
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    // Checkout setup loads the signed-in shopper's cart and delivery addresses.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const subtotal = useMemo(() => items.reduce(
    (sum, item) => sum + Math.round(Number(item.product?.selling_price || 0) * Number(item.quantity) * 100) / 100, 0
  ), [items]);
  const tax = useMemo(() => items.reduce((sum, item) => {
    const base = Number(item.product?.selling_price || 0) * Number(item.quantity);
    return sum + Math.round(base * Number(item.product?.tax_percent || 0)) / 100;
  }, 0), [items]);
  const total = subtotal + tax;
  const invalidItems = items.some((item) => {
    const product = item.product;
    if (!product || product.status !== "ACTIVE") return true;
    const minimum = Math.max(1, Number(product.minimum_order_quantity) || 1);
    const maximum = product.maximum_order_quantity
      ? Math.min(item.availableStock, Number(product.maximum_order_quantity))
      : item.availableStock;
    return item.quantity < minimum || item.quantity > maximum || item.availableStock < item.quantity
      || Number(item.price_snapshot) !== Number(product.selling_price);
  });

  function money(value: number) {
    return "₹" + Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function setAddress<K extends keyof AddressForm>(key: K, value: AddressForm[K]) {
    setAddressForm((current) => ({ ...current, [key]: value }));
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || invalidItems || !items.length) return;
    setSubmitting(true);
    setError("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!user && authError?.message === 'Auth session missing!') {
        router.push('/login?account=buyer&redirect=%2Fbodhimart%2Fcheckout');
        return;
      }
      if (authError) throw authError;
      if (!user) { router.push("/login?account=buyer&redirect=%2Fbodhimart%2Fcheckout"); return; }

      let selectedAddress: string | null = null;
      if (deliveryMethod !== "PICKUP") {
        selectedAddress = addressId;
        if (addressId === "NEW") {
          const { data, error: addressError } = await supabase.from("marketplace_customer_addresses")
            .insert({
              user_id: user.id,
              address_name: addressForm.address_name.trim() || "Delivery address",
              recipient_name: addressForm.recipient_name.trim(),
              mobile: addressForm.mobile.trim(),
              address_line1: addressForm.address_line1.trim(),
              address_line2: addressForm.address_line2.trim() || null,
              landmark: addressForm.landmark.trim() || null,
              pincode: addressForm.pincode.trim() || null,
              is_default: addresses.length === 0,
            }).select("id").single();
          if (addressError) throw addressError;
          selectedAddress = data.id;
          setAddressId(data.id);
        }
      }

      requestId.current ||= crypto.randomUUID();
      const { data, error: orderError } = await supabase.rpc("place_marketplace_order", {
        p_checkout_request_id: requestId.current,
        p_delivery_address_id: selectedAddress,
        p_delivery_method: deliveryMethod,
        p_customer_notes: notes.trim() || null,
      });
      if (orderError) throw orderError;
      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.order_id || !result?.order_number) throw new Error("Order confirmation was not returned.");
      setOrder({
        order_id: result.order_id,
        order_number: result.order_number,
        total_amount: Number(result.total_amount || 0),
        delivery_method: deliveryMethod,
      });
      setItems([]);
    } catch (cause: unknown) {
      console.error(cause);
      setError(cause instanceof Error ? cause.message : "Unable to place this order.");
    } finally { setSubmitting(false); }
  }

  if (loading) return <main className="min-h-screen bg-gray-50 p-12 text-center text-gray-600"><Copy en="Preparing checkout…" hi="चेकआउट तैयार हो रहा है…" /></main>;

  if (order) return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <section className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="text-5xl text-green-700">✓</div>
        <h1 className="mt-4 text-2xl font-bold"><Copy en="Order placed" hi="ऑर्डर हो गया" /></h1>
        <p className="mt-3 text-gray-600"><Copy en="Order number:" hi="ऑर्डर संख्या:" /> <strong>{order.order_number}</strong></p>
        <p className="mt-2">Total: {money(order.total_amount)}</p>
        <p className="mt-3 text-sm text-amber-800">
          {order.delivery_method === "PICKUP"
            ? <Copy en="Pay the seller when you collect your order." hi="ऑर्डर लेते समय विक्रेता को भुगतान करें।" />
            : <Copy en="Pay the seller when your order is delivered." hi="ऑर्डर मिलने पर विक्रेता को भुगतान करें।" />}
          {" "}<Copy en="Payment remains pending until an administrator confirms it was received." hi="प्रशासक की पुष्टि तक भुगतान लंबित रहेगा।" />
        </p>
        <RazorpayTestButton orderId={order.order_id} />
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link className="inline-block rounded-lg border border-green-700 px-5 py-3 font-semibold text-green-800" href={`/bodhimart/orders/${order.order_id}`}><Copy en="View / print summary" hi="सारांश देखें या प्रिंट करें" /></Link>
          <Link className="inline-block rounded-lg bg-green-700 px-5 py-3 font-semibold text-white" href="/bodhimart/orders"><Copy en="View my orders" hi="मेरे ऑर्डर देखें" /></Link>
          <Link className="inline-block rounded-lg border border-green-700 px-5 py-3 font-semibold text-green-800" href="/bodhimart/products"><Copy en="Continue shopping" hi="खरीदारी जारी रखें" /></Link>
        </div>
      </section>
    </main>
  );

  if (!items.length) return (
    <main className="min-h-screen bg-gray-50 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold"><Copy en="Your cart is empty" hi="आपकी टोकरी खाली है" /></h1>
      {error && <p className="mt-3 text-red-700">{error}</p>}
      <Link className="mt-6 inline-block rounded-lg bg-green-700 px-5 py-3 text-white" href="/bodhimart/cart"><Copy en="Return to cart" hi="टोकरी पर लौटें" /></Link>
    </main>
  );

  const selectedAddress = addresses.find((item) => item.id === addressId);
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/bodhimart/cart" className="text-sm font-semibold text-green-800 hover:underline">← Back to cart</Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900"><Copy en="Checkout" hi="चेकआउट" /></h1>
        <p className="mt-2 text-gray-600"><Copy en="Confirm delivery details and current prices." hi="डिलीवरी की जानकारी और मौजूदा कीमतों की पुष्टि करें।" /></p>
        {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        {invalidItems && <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Some items no longer meet the seller’s quantity, stock, or price requirements. Review your cart before ordering.</div>}

        <form onSubmit={(event) => void placeOrder(event)} className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <section className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold"><Copy en="Delivery method" hi="डिलीवरी का तरीका" /></h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer gap-3 rounded-xl border p-4">
                  <input type="radio" name="delivery" checked={deliveryMethod === "STANDARD"} onChange={() => setDeliveryMethod("STANDARD")} />
                  <span><strong><Copy en="Standard delivery" hi="सामान्य डिलीवरी" /></strong><small className="mt-1 block text-gray-500"><Copy en="Pay the seller when the order is delivered. Current delivery charge: ₹0." hi="ऑर्डर मिलने पर विक्रेता को भुगतान करें। वर्तमान डिलीवरी शुल्क ₹0 है।" /></small></span>
                </label>
                <label className="flex cursor-pointer gap-3 rounded-xl border p-4">
                  <input type="radio" name="delivery" checked={deliveryMethod === "PICKUP"} onChange={() => setDeliveryMethod("PICKUP")} />
                  <span><strong><Copy en="Pickup" hi="खुद ले जाएँ" /></strong><small className="mt-1 block text-gray-500"><Copy en="Pay the seller when you collect the order." hi="ऑर्डर लेते समय विक्रेता को भुगतान करें।" /></small></span>
                </label>
              </div>
            </div>

            {deliveryMethod !== "PICKUP" && <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-bold"><Copy en="Delivery address" hi="डिलीवरी का पता" /></h2>
                  <Link href="/bodhimart/addresses" className="text-sm font-semibold text-green-800 hover:underline"><Copy en="Manage saved addresses" hi="सहेजे गए पते बदलें" /></Link>
                </div>
              {addresses.length > 0 && <label className="mt-4 block text-sm font-medium">
                <Copy en="Saved address" hi="सहेजा गया पता" />
                <select value={addressId} onChange={(event) => setAddressId(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-3">
                  {addresses.map((item) => <option key={item.id} value={item.id}>{(item.address_name || item.recipient_name) + " — " + item.address_line1}</option>)}
                  <option value="NEW"><Copy en="Add a new address" hi="नया पता जोड़ें" /></option>
                </select>
              </label>}
              {addressId === "NEW" ? <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium"><Copy en="Recipient name" hi="प्राप्तकर्ता का नाम" /><input required value={addressForm.recipient_name} onChange={(e) => setAddress("recipient_name", e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-3" /></label>
                <label className="text-sm font-medium"><Copy en="Mobile number" hi="मोबाइल नंबर" /><input required inputMode="tel" value={addressForm.mobile} onChange={(e) => setAddress("mobile", e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-3" /></label>
                <label className="text-sm font-medium sm:col-span-2"><Copy en="Address line 1" hi="पते की पहली पंक्ति" /><input required value={addressForm.address_line1} onChange={(e) => setAddress("address_line1", e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-3" /></label>
                <label className="text-sm font-medium"><Copy en="Address line 2" hi="पते की दूसरी पंक्ति" /><input value={addressForm.address_line2} onChange={(e) => setAddress("address_line2", e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-3" /></label>
                <label className="text-sm font-medium"><Copy en="Landmark" hi="नज़दीकी पहचान" /><input value={addressForm.landmark} onChange={(e) => setAddress("landmark", e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-3" /></label>
                <label className="text-sm font-medium"><Copy en="PIN code" hi="पिन कोड" /><input inputMode="numeric" value={addressForm.pincode} onChange={(e) => setAddress("pincode", e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-3" /></label>
              </div> : selectedAddress && <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm">
                <strong>{selectedAddress.recipient_name}</strong><div>{selectedAddress.mobile}</div><div>{selectedAddress.address_line1}</div>
                {selectedAddress.address_line2 && <div>{selectedAddress.address_line2}</div>}
                {selectedAddress.landmark && <div>{selectedAddress.landmark}</div>}
                {selectedAddress.pincode && <div>PIN: {selectedAddress.pincode}</div>}
              </div>}
            </div>}

            <label className="block rounded-2xl bg-white p-6 text-sm font-semibold shadow-sm">Notes for seller (optional)
              <textarea maxLength={500} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-3 font-normal" />
            </label>
          </section>

          <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold"><Copy en="Order summary" hi="ऑर्डर का सारांश" /></h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => <div key={item.id} className="flex justify-between gap-4 text-sm">
                <span>{item.product?.name || "Unavailable product"} × {item.quantity}</span>
                <span>{money(Number(item.product?.selling_price || 0) * Number(item.quantity))}</span>
              </div>)}
              <div className="flex justify-between border-t pt-3 text-sm"><span><Copy en="Subtotal" hi="उप-योग" /></span><span>{money(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span><Copy en="Tax" hi="कर" /></span><span>{money(tax)}</span></div>
              <div className="flex justify-between text-sm"><span><Copy en="Delivery" hi="डिलीवरी" /></span><span>{money(0)}</span></div>
              <div className="flex justify-between border-t pt-3 text-lg font-bold"><span><Copy en="Total" hi="कुल" /></span><span className="text-green-800">{money(total)}</span></div>
            </div>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              {deliveryMethod === "PICKUP"
                ? <Copy en="Pay at pickup." hi="ऑर्डर लेते समय भुगतान करें।" />
                : <Copy en="Pay on delivery." hi="डिलीवरी पर भुगतान करें।" />}{' '}
              <Copy en="Payment remains pending until BodhiMart confirms receipt." hi="BodhiMart की पुष्टि तक भुगतान लंबित रहेगा।" />
            </p>
            <button type="submit" disabled={submitting || invalidItems || !items.length} className="mt-5 w-full rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600">
              {submitting ? <Copy en="Placing order…" hi="ऑर्डर भेजा जा रहा है…" /> : <Copy en="Place order" hi="ऑर्डर करें" />}
            </button>
          </aside>
        </form>
      </div>
    </main>
  );
}
