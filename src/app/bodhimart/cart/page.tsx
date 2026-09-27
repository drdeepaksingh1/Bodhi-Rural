"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type Product = {
  id: string;
  product_id: string;
  name: string;
  brand: string | null;
  unit: string | null;
  mrp: number;
  selling_price: number;
  delivery_available: boolean;
  status: string;
};

type CartItem = {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  price_snapshot: number;
  created_at: string;
  updated_at: string;
};

type CartLine = CartItem & {
  product: Product | null;
  availableStock: number;
};

type Inventory = {
  product_id: string;
  stock_quantity: number;
  reserved_quantity: number;
};

export default function BodhiMartCartPage() {
  const supabase = createClient();

  const [cartId, setCartId] = useState<string | null>(null);
  const [items, setItems] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  async function loadCart() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please login to view your shopping cart.");
        setLoading(false);
        return;
      }

      setUserEmail(user.email || "");

      let { data: cart, error: cartError } = await supabase
        .from("marketplace_carts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cartError) {
        throw cartError;
      }

      if (!cart) {
        const { data: newCart, error: createCartError } =
          await supabase
            .from("marketplace_carts")
            .insert({
              user_id: user.id,
            })
            .select("id")
            .single();

        if (createCartError) {
          throw createCartError;
        }

        cart = newCart;
      }

      setCartId(cart.id);

      const { data: cartItems, error: itemsError } =
        await supabase
          .from("marketplace_cart_items")
          .select("*")
          .eq("cart_id", cart.id)
          .order("created_at", { ascending: true });

      if (itemsError) {
        throw itemsError;
      }

      const rawItems = (cartItems || []) as CartItem[];

      if (rawItems.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const productIds = rawItems.map(
        (item) => item.product_id
      );

      const { data: products, error: productsError } =
        await supabase
          .from("marketplace_products")
          .select(
            "id, product_id, name, brand, unit, mrp, selling_price, delivery_available, status"
          )
          .in("id", productIds);

      if (productsError) {
        throw productsError;
      }

      const { data: inventory, error: inventoryError } =
        await supabase
          .from("marketplace_inventory")
          .select(
            "product_id, stock_quantity, reserved_quantity"
          )
          .in("product_id", productIds);

      if (inventoryError) {
        throw inventoryError;
      }

      const productMap: Record<string, Product> = {};

      for (const product of (products || []) as Product[]) {
        productMap[product.id] = product;
      }

      const inventoryMap: Record<string, Inventory> = {};

      for (const stock of (inventory || []) as Inventory[]) {
        inventoryMap[stock.product_id] = stock;
      }

      const lines: CartLine[] = rawItems.map((item) => {
        const stock = inventoryMap[item.product_id];

        const availableStock = stock
          ? Math.max(
              0,
              Number(stock.stock_quantity || 0) -
                Number(stock.reserved_quantity || 0)
            )
          : 0;

        return {
          ...item,
          product: productMap[item.product_id] || null,
          availableStock,
        };
      });

      setItems(lines);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message || "Unable to load your shopping cart."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  async function updateQuantity(
    item: CartLine,
    newQuantity: number
  ) {
    if (newQuantity < 1) {
      await removeItem(item);
      return;
    }

    if (newQuantity > item.availableStock) {
      alert(
        `Only ${item.availableStock} unit${
          item.availableStock === 1 ? "" : "s"
        } available.`
      );
      return;
    }

    setUpdating(item.id);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("marketplace_cart_items")
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (updateError) {
        throw updateError;
      }

      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                quantity: newQuantity,
              }
            : currentItem
        )
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message || "Unable to update cart quantity."
      );
    } finally {
      setUpdating(null);
    }
  }

  async function removeItem(item: CartLine) {
    setUpdating(item.id);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("marketplace_cart_items")
        .delete()
        .eq("id", item.id);

      if (deleteError) {
        throw deleteError;
      }

      setItems((current) =>
        current.filter(
          (currentItem) => currentItem.id !== item.id
        )
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message || "Unable to remove item."
      );
    } finally {
      setUpdating(null);
    }
  }

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total +
        Number(item.price_snapshot || 0) *
          Number(item.quantity || 0),
      0
    );
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );
  }, [items]);

  const mrpTotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total +
        Number(item.product?.mrp || item.price_snapshot || 0) *
          Number(item.quantity || 0),
      0
    );
  }, [items]);

  const savings = Math.max(0, mrpTotal - subtotal);

  function formatPrice(value: number) {
    return `₹${Number(value || 0).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-green-700" />

            <p className="text-gray-600">
              Loading your cart...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !cartId) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">🛒</div>

            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              BodhiMart Cart
            </h1>

            <p className="mt-3 text-red-600">
              {error}
            </p>

            <a
              href="/login"
              className="mt-6 inline-block rounded-xl bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800"
            >
              Login
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
            BODHI MART
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            Shopping Cart
          </h1>

          {userEmail && (
            <p className="mt-2 text-sm text-gray-500">
              Cart for {userEmail}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty Cart */}
        {items.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <div className="text-6xl">🛒</div>

            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              Your cart is empty
            </h2>

            <p className="mt-2 text-gray-500">
              Browse BodhiMart and add products to your cart.
            </p>

            <a
              href="/bodhimart/products"
              className="mt-7 inline-block rounded-xl bg-green-700 px-7 py-3 font-semibold text-white hover:bg-green-800"
            >
              Continue Shopping
            </a>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="space-y-4 lg:col-span-2">
              {items.map((item) => {
                const product = item.product;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row">
                      {/* Product Icon */}
                      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-50 to-amber-50 text-4xl">
                        🌾
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row">
                          <div>
                            <h2 className="text-lg font-bold text-gray-900">
                              {product?.name ||
                                "Product unavailable"}
                            </h2>

                            {product?.brand && (
                              <p className="mt-1 text-sm text-gray-500">
                                Brand: {product.brand}
                              </p>
                            )}

                            {product?.unit && (
                              <p className="text-sm text-gray-500">
                                Unit: {product.unit}
                              </p>
                            )}

                            <p className="mt-1 text-xs text-gray-400">
                              Product ID:{" "}
                              {product?.product_id ||
                                item.product_id}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-xl font-bold text-green-800">
                              {formatPrice(
                                Number(
                                  item.price_snapshot
                                )
                              )}
                            </p>

                            {product &&
                              product.mrp >
                                item.price_snapshot && (
                                <p className="text-sm text-gray-400 line-through">
                                  {formatPrice(
                                    product.mrp
                                  )}
                                </p>
                              )}
                          </div>
                        </div>

                        {/* Stock warning */}
                        {item.availableStock <= 0 ? (
                          <p className="mt-3 text-sm font-semibold text-red-600">
                            Currently out of stock
                          </p>
                        ) : item.quantity >
                          item.availableStock ? (
                          <p className="mt-3 text-sm font-semibold text-orange-600">
                            Only{" "}
                            {item.availableStock} available
                          </p>
                        ) : (
                          <p className="mt-3 text-sm text-green-600">
                            {item.availableStock} available
                          </p>
                        )}

                        {/* Controls */}
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center overflow-hidden rounded-lg border border-gray-300">
                            <button
                              disabled={
                                updating === item.id
                              }
                              onClick={() =>
                                updateQuantity(
                                  item,
                                  item.quantity - 1
                                )
                              }
                              className="px-4 py-2 text-lg font-semibold hover:bg-gray-100 disabled:opacity-50"
                            >
                              −
                            </button>

                            <span className="min-w-[50px] border-x border-gray-300 px-4 py-2 text-center font-semibold">
                              {item.quantity}
                            </span>

                            <button
                              disabled={
                                updating === item.id ||
                                item.quantity >=
                                  item.availableStock
                              }
                              onClick={() =>
                                updateQuantity(
                                  item,
                                  item.quantity + 1
                                )
                              }
                              className="px-4 py-2 text-lg font-semibold hover:bg-gray-100 disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>

                          <button
                            disabled={
                              updating === item.id
                            }
                            onClick={() =>
                              removeItem(item)
                            }
                            className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <a
                href="/bodhimart/products"
                className="inline-block rounded-xl border border-green-700 px-5 py-3 font-semibold text-green-700 hover:bg-green-50"
              >
                ← Continue Shopping
              </a>
            </div>

            {/* Summary */}
            <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Items
                  </span>

                  <span className="font-medium">
                    {totalItems}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    MRP Total
                  </span>

                  <span>
                    {formatPrice(mrpTotal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Product Discount
                  </span>

                  <span className="font-medium text-green-600">
                    − {formatPrice(savings)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Delivery
                  </span>

                  <span className="font-medium text-gray-500">
                    Calculated at checkout
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      Subtotal
                    </span>

                    <span className="text-xl font-bold text-green-800">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                disabled
                className="mt-7 w-full cursor-not-allowed rounded-xl bg-gray-300 px-5 py-3 font-bold text-gray-600"
              >
                Proceed to Checkout
              </button>

              <p className="mt-3 text-center text-xs text-gray-500">
                Checkout and payment will be enabled in
                the next module.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
