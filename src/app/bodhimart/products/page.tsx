"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type Product = {
  id: string;
  product_id: string;
  sku: string | null;
  seller_id: string;
  category_id: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  brand: string | null;
  unit: string | null;
  weight: number | null;
  mrp: number;
  selling_price: number;
  tax_percent: number;
  minimum_order_quantity: number;
  maximum_order_quantity: number | null;
  delivery_available: boolean;
  status: string;
};

type Inventory = {
  product_id: string;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
};

type Category = {
  id: string;
  name: string;
};

export default function BodhiMartProductsPage() {
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("DEFAULT");

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const [productsResult, inventoryResult, categoriesResult] =
        await Promise.all([
          supabase
            .from("marketplace_products")
            .select("*")
            .eq("status", "ACTIVE")
            .order("created_at", { ascending: false }),

          supabase
            .from("marketplace_inventory")
            .select(
              "product_id, stock_quantity, reserved_quantity, low_stock_threshold"
            ),

          supabase
            .from("marketplace_categories")
            .select("id, name")
            .order("name", { ascending: true }),
        ]);

      if (productsResult.error) {
        throw productsResult.error;
      }

      if (inventoryResult.error) {
        throw inventoryResult.error;
      }

      if (categoriesResult.error) {
        throw categoriesResult.error;
      }

      setProducts((productsResult.data || []) as Product[]);
      setInventory((inventoryResult.data || []) as Inventory[]);
      setCategories((categoriesResult.data || []) as Category[]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const inventoryMap = useMemo(() => {
    const map: Record<string, Inventory> = {};

    for (const item of inventory) {
      map[item.product_id] = item;
    }

    return map;
  }, [inventory]);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};

    for (const item of categories) {
      map[item.id] = item.name;
    }

    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    const searchText = search.trim().toLowerCase();

    if (searchText) {
      result = result.filter((product) => {
        const categoryName = product.category_id
          ? categoryMap[product.category_id] || ""
          : "";

        return (
          product.name.toLowerCase().includes(searchText) ||
          (product.product_id || "").toLowerCase().includes(searchText) ||
          (product.sku || "").toLowerCase().includes(searchText) ||
          (product.brand || "").toLowerCase().includes(searchText) ||
          categoryName.toLowerCase().includes(searchText)
        );
      });
    }

    if (category !== "ALL") {
      result = result.filter(
        (product) => product.category_id === category
      );
    }

    if (sort === "PRICE_LOW") {
      result.sort((a, b) => a.selling_price - b.selling_price);
    }

    if (sort === "PRICE_HIGH") {
      result.sort((a, b) => b.selling_price - a.selling_price);
    }

    if (sort === "NAME") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sort === "SAVINGS") {
      result.sort(
        (a, b) =>
          (b.mrp - b.selling_price) -
          (a.mrp - a.selling_price)
      );
    }

    return result;
  }, [products, search, category, sort, categoryMap]);

  function getAvailableStock(productId: string) {
    const item = inventoryMap[productId];

    if (!item) return 0;

    return Math.max(
      0,
      Number(item.stock_quantity || 0) -
        Number(item.reserved_quantity || 0)
    );
  }

  function getSavings(product: Product) {
    return Math.max(0, Number(product.mrp) - Number(product.selling_price));
  }

  function getSavingsPercent(product: Product) {
    if (!product.mrp || product.mrp <= 0) return 0;

    return Math.round(
      ((product.mrp - product.selling_price) / product.mrp) * 100
    );
  }

  function handleAddToCart(product: Product) {
    const stock = getAvailableStock(product.id);

    if (stock <= 0) {
      alert("This product is currently out of stock.");
      return;
    }

    alert(
      `${product.name} is ready to be added to the cart.`
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-green-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-green-200">
              BODHI MART
            </p>

            <h1 className="text-3xl font-bold sm:text-4xl">
              Shop Rural Products
            </h1>

            <p className="mt-3 text-green-100">
              Discover products from approved BodhiMart sellers
              and support rural livelihoods.
            </p>
          </div>
        </div>
      </section>

      {/* Main */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search + filters */}
        <div className="mb-8 rounded-2xl bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="md:col-span-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Search Products
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product, SKU or brand..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Category
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
              >
                <option value="ALL">All Categories</option>

                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Sort By
              </label>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
              >
                <option value="DEFAULT">Latest</option>
                <option value="PRICE_LOW">
                  Price: Low to High
                </option>
                <option value="PRICE_HIGH">
                  Price: High to Low
                </option>
                <option value="SAVINGS">
                  Highest Savings
                </option>
                <option value="NAME">Product Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Products
            </h2>

            {!loading && (
              <p className="mt-1 text-sm text-gray-500">
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""} available
              </p>
            )}
          </div>

          <button
            onClick={loadProducts}
            className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
          >
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <strong>Unable to load products:</strong>{" "}
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-green-700" />

            <p className="text-gray-600">
              Loading BodhiMart products...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <div className="text-5xl">🛒</div>

            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No products found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Try changing your search or category filter.
            </p>
          </div>
        )}

        {/* Product grid */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const availableStock = getAvailableStock(product.id);
              const savings = getSavings(product);
              const savingsPercent =
                getSavingsPercent(product);

              const categoryName = product.category_id
                ? categoryMap[product.category_id] || "Product"
                : "Product";

              const outOfStock = availableStock <= 0;

              return (
                <article
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Product image placeholder */}
                  <div className="flex h-48 items-center justify-center bg-gradient-to-br from-green-50 to-amber-50">
                    <div className="text-center">
                      <div className="text-5xl">🌾</div>

                      <p className="mt-2 text-xs font-medium text-gray-500">
                        BODHI MART
                      </p>
                    </div>

                    {savingsPercent > 0 && (
                      <span className="absolute ml-[-180px] mt-[-150px] rounded-full bg-green-700 px-3 py-1 text-xs font-bold text-white">
                        {savingsPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        {categoryName}
                      </span>

                      {product.delivery_available ? (
                        <span className="text-xs font-medium text-green-700">
                          Delivery
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">
                          Pickup
                        </span>
                      )}
                    </div>

                    <h3 className="line-clamp-2 min-h-[48px] text-lg font-bold text-gray-900">
                      {product.name}
                    </h3>

                    {product.brand && (
                      <p className="mt-1 text-sm text-gray-500">
                        Brand: {product.brand}
                      </p>
                    )}

                    {product.unit && (
                      <p className="mt-1 text-sm text-gray-500">
                        Unit: {product.unit}
                      </p>
                    )}

                    {/* Price */}
                    <div className="mt-4">
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-green-800">
                          ₹
                          {Number(
                            product.selling_price
                          ).toLocaleString("en-IN")}
                        </span>

                        {product.mrp >
                          product.selling_price && (
                          <span className="text-sm text-gray-400 line-through">
                            ₹
                            {Number(
                              product.mrp
                            ).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      {savings > 0 && (
                        <p className="mt-1 text-sm font-medium text-green-600">
                          Save ₹
                          {savings.toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>

                    {/* Stock */}
                    <div className="mt-4">
                      {outOfStock ? (
                        <span className="font-semibold text-red-600">
                          Out of Stock
                        </span>
                      ) : availableStock <=
                        (inventoryMap[product.id]
                          ?.low_stock_threshold || 5) ? (
                        <span className="font-medium text-orange-600">
                          Only {availableStock} available
                        </span>
                      ) : (
                        <span className="font-medium text-green-600">
                          In Stock
                        </span>
                      )}
                    </div>

                    {/* Product ID */}
                    <p className="mt-2 text-xs text-gray-400">
                      Product ID: {product.product_id}
                    </p>

                    {/* Button */}
                    <button
                      disabled={outOfStock}
                      onClick={() =>
                        handleAddToCart(product)
                      }
                      className={`mt-5 w-full rounded-xl px-4 py-3 font-semibold transition ${
                        outOfStock
                          ? "cursor-not-allowed bg-gray-200 text-gray-500"
                          : "bg-green-700 text-white hover:bg-green-800"
                      }`}
                    >
                      {outOfStock
                        ? "Out of Stock"
                        : "Add to Cart"}
                    </button>
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
