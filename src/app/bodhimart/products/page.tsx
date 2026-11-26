"use client";

import { Copy, useBodhiMartLanguage } from '../language';
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

const marketplacePhotoLoader = ({ src }: { src: string }) => src;

type Product = {
  id: string;
  product_id: string;
  sku: string | null;
  category_id: string | null;
  name: string;
  slug: string | null;
  image_url: string | null;
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
  available_quantity: number;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

const categoryHindi: Record<string, string> = {
  "seeds": "बीज और फसल देखभाल",
  "crop-seeds": "फसल के बीज",
  "vegetable-seeds": "सब्ज़ियों के बीज",
  "agriculture": "कृषि",
  "farm-inputs": "कृषि सामग्री",
  "fertilisers": "उर्वरक और मिट्टी का पोषण",
  "crop-protection": "फसल सुरक्षा",
  "soil-testing": "मिट्टी की जाँच",
  "poultry": "पशुपालन और मुर्गीपालन",
  "birds": "पक्षी",
  "goat": "बकरी",
  "poultry-chicks": "चूज़े",
  "poultry-supplies": "मुर्गीपालन सामग्री",
  "veterinary": "पशु चिकित्सा",
  "veterinary-medicines": "पशु दवाएँ",
  "animal-health-supplies": "पशु स्वास्थ्य सामग्री",
  "livestock-care": "पशु देखभाल और उपकरण",
  "feed": "पशु आहार",
  "poultry-feed": "मुर्गियों का चारा",
  "livestock-feed": "पशुओं का चारा",
  "feed-supplements": "पूरक आहार",
  "equipment": "उपकरण",
  "farm-tools": "खेती के औज़ार",
  "farm-equipment": "खेती के उपकरण",
  "irrigation-equipment": "सिंचाई उपकरण",
  "groceries": "किराना",
  "grocery-grains": "अनाज और दालें",
  "grocery-dairy": "दूध और डेयरी उत्पाद",
  "grocery-spices": "मसाले",
  "grocery-oils": "खाद्य तेल",
  "grocery-beverages": "चाय और पेय",
  "fresh-produce": "ताज़ी सब्ज़ियाँ और फल",
  "fresh-vegetables": "सब्ज़ियाँ",
  "fresh-fruit": "फल",
  "leafy-greens": "हरी पत्तेदार सब्ज़ियाँ",
  "fresh-herbs": "ताज़ी जड़ी-बूटियाँ",
  "clothing-footwear": "कपड़े और जूते-चप्पल",
  "clothing-everyday": "रोज़मर्रा के कपड़े",
  "clothing-footwear-items": "जूते और चप्पल",
  "clothing-accessories": "पहनावे के सामान",
  "household-personal-care": "घरेलू सामान और व्यक्तिगत देखभाल",
  "household-cleaning": "सफ़ाई का सामान",
  "household-kitchen": "रसोई का सामान",
  "personal-care": "व्यक्तिगत देखभाल",
  "home-storage": "घरेलू भंडारण",
  "hardware-electrical": "हार्डवेयर और बिजली का सामान",
  "hardware-tools": "हार्डवेयर औज़ार",
  "hardware-lighting": "रोशनी और बिजली का सामान",
  "hardware-plumbing": "प्लंबिंग का सामान",
  "hardware-fasteners": "फास्टनर और फिटिंग",
  "made-locally": "स्थानीय उत्पाद",
  "local-food": "स्थानीय खाद्य उत्पाद",
  "local-crafts": "स्थानीय हस्तशिल्प",
  "shg-products": "स्वयं सहायता समूहों के उत्पाद",
  "hotels-restaurants": "होटल और रेस्तराँ",
  "vegetarian-meals": "शाकाहारी भोजन",
  "non-vegetarian-meals": "मांसाहारी भोजन",
  "restaurant-snacks": "नाश्ता",
  "restaurant-beverages": "पेय",
  "restaurant-desserts": "मिठाइयाँ",
  "school-stationery": "स्कूल और स्टेशनरी",
  "school-notebooks": "कॉपी और कागज़",
  "school-writing": "पेन और पेंसिल",
  "school-art": "कला और शिल्प सामग्री",
  "school-bags": "स्कूल बैग",
  "school-uniforms": "स्कूल यूनिफ़ॉर्म"
};

function belongsToCategory(id: string | null, root: string, byId: Map<string, Category>) {
  const visited = new Set<string>();
  while (id && !visited.has(id)) {
    if (id === root) return true;
    visited.add(id);
    id = byId.get(id)?.parent_id ?? null;
  }
  return false;
}

function getProductPlaceholder(product: Product, categoryName = "") {
  const name = product.name.toLowerCase();
  const normalizedCategory = categoryName.toLowerCase();

  if (/biscuit|cookie|cracker/.test(name)) return "🍪";
  if (/rice|grain|cereal/.test(name)) return "🍚";
  if (/milk|dairy|cheese|butter/.test(name)) return "🥛";
  if (/fruit|vegetable|produce/.test(name)) return "🥬";
  if (normalizedCategory.includes("grocer")) return "🛍️";
  if (/seed/.test(name)) return "🌱";
  if (/feed|poultry|layer/.test(name)) return "🐓";

  return "🌾";
}

export default function BodhiMartProductsPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("DEFAULT");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [addingProduct, setAddingProduct] = useState<string | null>(null);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [wishlistUpdating, setWishlistUpdating] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareMessage, setCompareMessage] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [productsResult, inventoryResult, categoriesResult] =
        await Promise.all([
          supabase
            .from("marketplace_public_products")
            .select("id, product_id, sku, category_id, name, slug, image_url, description, brand, unit, weight, mrp, selling_price, tax_percent, minimum_order_quantity, maximum_order_quantity, delivery_available, status, created_at")
            .eq("status", "ACTIVE")
            .order("created_at", { ascending: false }),

          supabase
            .from("marketplace_public_inventory")
            .select("product_id, available_quantity"),

          supabase
            .from("marketplace_categories")
            .select("id, name, slug, parent_id")
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

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: savedItems, error: wishlistError } = await supabase
            .from("marketplace_wishlist_items")
            .select("product_id")
            .eq("user_id", user.id);
          if (wishlistError) throw wishlistError;
          setSavedProductIds((savedItems || []).map((item) => item.product_id));
        } else {
          setSavedProductIds([]);
        }
      } catch (wishlistLoadError) {
        console.warn("Unable to load saved product markers.", wishlistLoadError);
        setSavedProductIds([]);
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
  }, [supabase]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSearch = params.get("search");
    const initialAvailability = params.get("availability");
    const initialCategory = params.get("category");
    const initialSort = params.get("sort");

    // The URL initializes the controlled search field once on page load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialSearch) setSearch(initialSearch);
    if (initialAvailability === "in_stock") setStockFilter("IN_STOCK");
    if (initialAvailability === "out_of_stock") setStockFilter("OUT_OF_STOCK");
    if (initialCategory) setCategory(initialCategory);
    else if (initialSearch === "hotels & restaurants") {
      setCategory("hotels-restaurants");
      setSearch("");
    }
    if (["PRICE_LOW", "PRICE_HIGH", "SAVINGS", "NAME"].includes(initialSort || "")) {
      setSort(initialSort || "DEFAULT");
    }
    void loadProducts();
  }, [loadProducts]);

  function productDetailsHref(product: Product) {
    const returnParams = new URLSearchParams();
    if (search.trim()) returnParams.set("search", search.trim());
    if (category !== "ALL") returnParams.set("category", category);
    if (sort !== "DEFAULT") returnParams.set("sort", sort);
    if (stockFilter !== "ALL") {
      returnParams.set("availability", stockFilter.toLowerCase());
    }

    const returnTo = `/bodhimart/products${returnParams.size ? `?${returnParams.toString()}` : ""}`;
    const detailsParams = new URLSearchParams({ from: returnTo });
    return `/bodhimart/products/${encodeURIComponent(product.product_id)}?${detailsParams.toString()}`;
  }

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

  const language = useBodhiMartLanguage();
  const categoriesById = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);
  const selected = categoriesById.get(category) ?? categories.find((item) => item.slug === category);
  const parent = categoriesById.get(selected?.parent_id ?? "") ?? selected;
  const subcategories = parent ? categories.filter((item) => item.parent_id === parent.id) : [];
  const categoryLabel = (item: Category) => language === "hi" ? categoryHindi[item.slug] ?? item.name : item.name;

  const filteredProducts = useMemo(() => {
    let result = [...products];

    const normalizeSearchText = (value: string) =>
      value.trim().toLowerCase().replace(/\bgroceries\b/g, "grocery").replace(/चीनी/g, "sugar");
    const searchText = normalizeSearchText(search);

    const hospitalitySearch = searchText === 'hotels & restaurants' || searchText === 'होटल और रेस्तराँ';

    if (searchText) {
      result = result.filter((product) => {
        const categoryName = product.category_id
          ? categoryMap[product.category_id] || ""
          : "";

        if (hospitalitySearch) {
          return /hotel|restaurant|prepared food|ready.to.eat|होटल|रेस्तराँ|रेस्टोरेंट/.test(
            normalizeSearchText(categoryName)
          );
        }

        return (
          normalizeSearchText(product.name).includes(searchText) ||
          normalizeSearchText(product.product_id || "").includes(searchText) ||
          normalizeSearchText(product.sku || "").includes(searchText) ||
          normalizeSearchText(product.brand || "").includes(searchText) ||
          normalizeSearchText(categoryName).includes(searchText)
        );
      });
    }

    if (selected) {
      result = result.filter((product) => belongsToCategory(product.category_id, selected.id, categoriesById));
    } else if (category !== "ALL") {
      result = [];
    }

    if (stockFilter !== "ALL") {
      result = result.filter((product) => {
        const available = Number(
          inventoryMap[product.id]?.available_quantity || 0
        );
        return stockFilter === "IN_STOCK" ? available > 0 : available <= 0;
      });
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
          b.mrp -
          b.selling_price -
          (a.mrp - a.selling_price)
      );
    }

    return result;
  }, [products, search, category, selected, categoriesById, sort, stockFilter, categoryMap, inventoryMap]);

  const comparedProducts = useMemo(
    () => compareIds
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is Product => Boolean(product)),
    [compareIds, products]
  );

  function toggleCompare(product: Product) {
    setCompareMessage("");
    if (compareIds.includes(product.id)) {
      setCompareIds(compareIds.filter((id) => id !== product.id));
      return;
    }

    if (compareIds.length >= 3) {
      setCompareMessage("Compare up to 3 products at a time. Remove one to add another.");
      return;
    }

    setCompareIds([...compareIds, product.id]);
  }

  function getAvailableStock(productId: string) {
    const item = inventoryMap[productId];

    if (!item) return 0;

    return Math.max(0, Number(item.available_quantity || 0));
  }

  function getSavings(product: Product) {
    return Math.max(
      0,
      Number(product.mrp) -
        Number(product.selling_price)
    );
  }

  function getSavingsPercent(product: Product) {
    if (!product.mrp || product.mrp <= 0) return 0;

    return Math.round(
      ((product.mrp - product.selling_price) /
        product.mrp) *
        100
    );
  }

  async function toggleWishlist(product: Product) {
    if (wishlistUpdating) return;
    setWishlistUpdating(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?account=buyer&redirect=%2Fbodhimart%2Fproducts");
        return;
      }

      const isSaved = savedProductIds.includes(product.id);
      if (isSaved) {
        const { error: removeError } = await supabase
          .from("marketplace_wishlist_items")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product.id);
        if (removeError) throw removeError;
        setSavedProductIds((current) => current.filter((id) => id !== product.id));
      } else {
        const { error: saveError } = await supabase
          .from("marketplace_wishlist_items")
          .insert({ user_id: user.id, product_id: product.id });
        if (saveError) throw saveError;
        setSavedProductIds((current) => [...current, product.id]);
      }
    } catch (wishlistError: any) {
      setError(wishlistError?.message || "Unable to update your saved items.");
    } finally {
      setWishlistUpdating(false);
    }
  }

  async function handleAddToCart(product: Product) {
    setAddingProduct(product.id);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert(
          "Please login before adding products to your cart."
        );

        router.push("/login?account=buyer&redirect=%2Fbodhimart%2Fproducts");
        return;
      }

      const stock = getAvailableStock(product.id);

      if (stock <= 0) {
        setError("This product is currently out of stock. Refresh the catalogue to see the latest availability.");
        return;
      }

      const minimumQuantity = Math.max(
        1,
        Number(product.minimum_order_quantity) || 1
      );
      const maximumQuantity = product.maximum_order_quantity
        ? Math.min(
            stock,
            Number(product.maximum_order_quantity)
          )
        : stock;

      /*
       * Find customer's existing cart.
       */
      let { data: cart, error: cartError } =
        await supabase
          .from("marketplace_carts")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

      if (cartError) {
        throw cartError;
      }

      /*
       * Create cart if customer does not have one.
       */
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

      /*
       * Check whether product is already in cart.
       */
      const {
        data: existingItem,
        error: existingItemError,
      } = await supabase
        .from("marketplace_cart_items")
        .select("id, quantity")
        .eq("cart_id", cart.id)
        .eq("product_id", product.id)
        .maybeSingle();

      if (existingItemError) {
        throw existingItemError;
      }

      /*
       * Product already exists in cart.
       */
      if (existingItem) {
        const currentQuantity = Number(
          existingItem.quantity || 0
        );

        const newQuantity = currentQuantity + 1;

        if (newQuantity > maximumQuantity) {
          setError(
            `Maximum order quantity is ${maximumQuantity} unit${
              maximumQuantity === 1 ? "" : "s"
            }.`
          );

          return;
        }

        const { error: updateError } =
          await supabase
            .from("marketplace_cart_items")
            .update({
              quantity: newQuantity,
              price_snapshot: product.selling_price,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingItem.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        /*
         * Start at the seller's minimum order quantity and
         * refuse the add if current stock cannot satisfy it.
         */
        if (minimumQuantity > maximumQuantity) {
          setError(
            `This product requires a minimum order of ${minimumQuantity} units, but only ${stock} are available.`
          );
          return;
        }

        const { error: insertError } =
          await supabase
            .from("marketplace_cart_items")
            .insert({
              cart_id: cart.id,
              product_id: product.id,
              quantity: minimumQuantity,
              price_snapshot: product.selling_price,
            });

        if (insertError) {
          throw insertError;
        }
      }

      router.push("/bodhimart/cart");
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to add this product to your cart."
      );
    } finally {
      setAddingProduct(null);
    }
  }

  return (
    <main className={`min-h-screen bg-gray-50 ${comparedProducts.length ? "pb-24" : ""}`}>
      {/* Hero */}
      <section className="bg-green-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-green-200">
              BODHI MART
            </p>

            <h1 className="text-3xl font-bold sm:text-4xl">
              <Copy en="Shop Rural Products" hi="ग्रामीण उत्पाद खरीदें" />
            </h1>

            <p className="mt-3 text-green-100">
              Discover products from approved BodhiMart
              sellers and support rural livelihoods.
            </p>
          </div>
        </div>
      </section>

      {/* Main */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and filters */}
        <div className="mb-8 rounded-2xl bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                <Copy en="Search Products" hi="उत्पाद खोजें" />
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search product, SKU or brand..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                <Copy en="Category" hi="श्रेणी" />
              </label>

              <select
                aria-label={language === "hi" ? "श्रेणी" : "Category"}
                value={parent?.id ?? "ALL"}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
              >
                <option value="ALL">{language === "hi" ? "सभी श्रेणियाँ" : "All categories"}</option>
                {categories.filter((item) => !item.parent_id).map((item) => (
                  <option key={item.id} value={item.id}>{categoryLabel(item)}</option>
                ))}
              </select>
              {subcategories.length > 0 && (
                <label className="mt-3 block text-sm font-medium text-gray-700">
                  <Copy en="Subcategory" hi="उपश्रेणी" />
                  <select
                    value={selected?.id === parent?.id ? "" : selected?.id ?? ""}
                    onChange={(event) => setCategory(event.target.value || parent?.id || "ALL")}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3"
                  >
                    <option value="">{language === "hi" ? "सभी उपश्रेणियाँ" : "All subcategories"}</option>
                    {subcategories.map((item) => (
                      <option key={item.id} value={item.id}>{categoryLabel(item)}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                <Copy en="Sort By" hi="क्रम चुनें" />
              </label>

              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
              >
                <option value="DEFAULT">
                  <Copy en="Latest" hi="सबसे नए" />
                </option>

                <option value="PRICE_LOW">
                  Price: Low to High
                </option>

                <option value="PRICE_HIGH">
                  Price: High to Low
                </option>

                <option value="SAVINGS">
                  <Copy en="Highest Savings" hi="सबसे ज़्यादा बचत" />
                </option>

                <option value="NAME">
                  <Copy en="Product Name" hi="उत्पाद का नाम" />
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                <Copy en="Availability" hi="उपलब्धता" />
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
              >
                <option value="ALL"><Copy en="All products" hi="सभी उत्पाद" /></option>
                <option value="IN_STOCK"><Copy en="In stock" hi="स्टॉक में" /></option>
                <option value="OUT_OF_STOCK"><Copy en="Out of stock" hi="स्टॉक खत्म" /></option>
              </select>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              <Copy en="Products" hi="उत्पाद" />
            </h2>

            {!loading && (
              <p className="mt-1 text-sm text-gray-500">
                {filteredProducts.length} product
                {filteredProducts.length !== 1
                  ? "s"
                  : ""}{" "}
                available
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/bodhimart/orders"
              className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-50"
            >
              <Copy en="My orders" hi="मेरे ऑर्डर" />
            </Link>
            <Link
              href="/bodhimart/wishlist"
              className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-50"
            >
              ♡ Saved
            </Link>
            <Link
              href="/bodhimart/addresses"
              className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-50"
            >
              <Copy en="Delivery addresses" hi="डिलीवरी के पते" />
            </Link>
            <a
              href="/bodhimart/cart"
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              🛒 Cart
            </a>

            <button
              onClick={loadProducts}
              className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
            >
              <Copy en="Refresh" hi="फिर से लोड करें" />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <strong>Unable to complete the request:</strong>{" "}
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
        {!loading &&
          !error &&
          filteredProducts.length === 0 && (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
              <div className="text-5xl">🛒</div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {products.length === 0
                  ? "No active products are listed yet"
                  : stockFilter !== "ALL"
                    ? stockFilter === "IN_STOCK"
                      ? "No in-stock products match these filters"
                      : "No out-of-stock products match these filters"
                    : search.trim()
                      ? `No products match “${search.trim()}” yet`
                      : "No products found"}
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {products.length === 0
                  ? "Our sellers are preparing the next listings. New products will appear after BodhiMart admin review."
                  : stockFilter !== "ALL"
                    ? "Try another availability option or clear the category and search filters."
                    : search.trim()
                      ? "The current catalogue has no matching items. Matching products will appear here once sellers list them."
                      : "Try changing your search or category filter."}
              </p>
              {products.length > 0 && (search.trim() || category !== "ALL" || stockFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("ALL");
                    setSort("DEFAULT");
                    setStockFilter("ALL");
                    window.history.replaceState(null, "", window.location.pathname);
                  }}
                  className="mt-5 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                >
                  <Copy en="Clear filters" hi="फ़िल्टर हटाएँ" />
                </button>
              )}
            </div>
          )}

        {/* Products */}
        {!loading &&
          !error &&
          filteredProducts.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const availableStock =
                  getAvailableStock(product.id);

                const savings =
                  getSavings(product);

                const savingsPercent =
                  getSavingsPercent(product);

                const categoryName =
                  product.category_id
                    ? categoryMap[
                        product.category_id
                      ] || "Product"
                    : "Product";

                const outOfStock =
                  availableStock <= 0;

                const isAdding =
                  addingProduct === product.id;

                return (
                  <article
                    key={product.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* Product image area */}
                    <div className="group/image relative flex h-52 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_38%,#fffdf5_0%,#f3f7ed_60%,#e8f0e5_100%)]">
                      <div
                        aria-hidden="true"
                        className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/70 blur-2xl"
                      />
                      <div className="relative flex h-full w-full items-center justify-center p-5">
                        <div className="flex h-36 w-36 items-center justify-center rounded-[2rem] border border-white/80 bg-white/75 shadow-[0_16px_38px_rgba(28,72,45,0.12)] transition duration-300 group-hover/image:scale-105">
                          <span
                            role="img"
                            aria-label={`${product.name} product image`}
                            className="text-7xl drop-shadow-sm"
                          >
                            {getProductPlaceholder(product, categoryName)}
                          </span>
                        </div>
                        {product.image_url && (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            loader={marketplacePhotoLoader}
                            unoptimized
                            loading="lazy"
                            className="absolute inset-0 h-full w-full bg-white object-contain p-3 transition duration-300 group-hover/image:scale-[1.03]"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                      </div>
                      <span className="absolute bottom-3 right-3 rounded-full border border-white/80 bg-white/85 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#55735d] shadow-sm">
                        BODHI MART
                      </span>

                      {savingsPercent > 0 && (
                        <span className="absolute left-3 top-3 rounded-full bg-green-700 px-3 py-1 text-xs font-bold text-white">
                          {savingsPercent}% OFF
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => void toggleWishlist(product)}
                        disabled={wishlistUpdating}
                        aria-pressed={savedProductIds.includes(product.id)}
                        aria-label={savedProductIds.includes(product.id)
                          ? `Remove ${product.name} from saved items`
                          : `Save ${product.name} to wishlist`}
                        title={savedProductIds.includes(product.id)
                          ? "Remove from saved items"
                          : "Save to wishlist"}
                        className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-2xl leading-none text-rose-600 shadow-sm transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-green-700 disabled:cursor-wait disabled:opacity-60"
                      >
                        <span aria-hidden="true">
                          {savedProductIds.includes(product.id) ? "♥" : "♡"}
                        </span>
                      </button>
                    </div>

                    {/* Product content */}
                    <div className="p-5">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                          {categoryName}
                        </span>

                        {product.delivery_available ? (
                          <span className="text-xs font-medium text-green-700">
                            <Copy en="Delivery" hi="डिलीवरी" />
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            <Copy en="Pickup" hi="खुद ले जाएँ" />
                          </span>
                        )}
                      </div>

                      <h3 className="min-h-[48px] text-lg font-bold text-gray-900">
                        <Link
                          href={productDetailsHref(product)}
                          className="rounded-sm transition hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-700"
                        >
                          {product.name}
                        </Link>
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

                      <button
                        type="button"
                        onClick={() => toggleCompare(product)}
                        aria-pressed={compareIds.includes(product.id)}
                        className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-green-800 transition hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-700"
                      >
                        <span aria-hidden="true" className="text-base">
                          {compareIds.includes(product.id) ? "☑" : "□"}
                        </span>
                        {compareIds.includes(product.id) ? "Added to compare" : "Compare"}
                      </button>

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
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          )}
                        </div>

                        {savings > 0 && (
                          <p className="mt-1 text-sm font-medium text-green-600">
                            Save ₹
                            {savings.toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        )}
                      </div>

                      {/* Stock */}
                      <div className="mt-4">
                        {outOfStock ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            <Copy en="Out of Stock" hi="स्टॉक खत्म" />
                          </span>
                        ) : availableStock <=
                          (5) ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Only {availableStock}{" "}
                            available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            <Copy en="In Stock" hi="स्टॉक में" />
                          </span>
                        )}
                      </div>

                      {/* Product ID */}
                      <p className="mt-2 text-xs text-gray-400">
                        Product ID:{" "}
                        {product.product_id}
                      </p>

                      <Link
                        href={productDetailsHref(product)}
                        className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-green-700 px-4 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-700"
                      >
                        <Copy en="View product details" hi="उत्पाद की जानकारी देखें" />
                      </Link>

                      {/* Add to cart */}
                      <button
                        disabled={
                          outOfStock || isAdding
                        }
                        onClick={() =>
                          handleAddToCart(product)
                        }
                        className={`mt-5 w-full rounded-xl px-4 py-3 font-semibold transition ${
                          outOfStock
                            ? "cursor-not-allowed bg-gray-200 text-gray-500"
                            : isAdding
                            ? "cursor-wait bg-green-500 text-white"
                            : "bg-green-700 text-white hover:bg-green-800"
                        }`}
                      >
                        {outOfStock
                          ? "Out of Stock"
                          : isAdding
                          ? "Adding..."
                          : "Add to Cart"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </section>

      {compareMessage && (
        <div role="status" className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-xl bg-[#183426] px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {compareMessage}
        </div>
      )}

      {comparedProducts.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-green-900/15 bg-white/95 p-4 shadow-[0_-12px_40px_rgba(20,60,38,0.12)] backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#183426]">
                <Copy en="Compare products" hi="उत्पादों की तुलना करें" /> <span className="text-gray-500">({comparedProducts.length}/3)</span>
              </p>
              <p className="mt-1 truncate text-xs text-gray-600">
                {comparedProducts.map((product) => product.name).join(" · ")}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCompareIds([]);
                  setCompareMessage("");
                  setCompareOpen(false);
                }}
                className="min-h-10 rounded-xl px-4 text-sm font-semibold text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-700"
              >
                <Copy en="Clear" hi="हटाएँ" />
              </button>
              <button
                type="button"
                onClick={() => setCompareOpen(true)}
                disabled={comparedProducts.length < 2}
                className="min-h-10 rounded-xl bg-green-800 px-5 text-sm font-bold text-white transition hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Compare {comparedProducts.length} products
              </button>
            </div>
          </div>
        </div>
      )}

      {compareOpen && comparedProducts.length > 1 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#102b1d]/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCompareOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="bodhimart-compare-title"
            className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5 sm:p-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">BodhiMart</p>
                <h2 id="bodhimart-compare-title" className="mt-1 text-2xl font-bold text-gray-950"><Copy en="Compare products" hi="उत्पादों की तुलना करें" /></h2>
                <p className="mt-1 text-sm text-gray-500">Review current listing details side by side.</p>
              </div>
              <button
                type="button"
                onClick={() => setCompareOpen(false)}
                aria-label="Close product comparison"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-700"
              >
                ×
              </button>
            </div>
            <div className="max-h-[calc(90vh-110px)] overflow-auto p-4 sm:p-7">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="sticky left-0 bg-white p-3 text-xs font-bold uppercase tracking-wide text-gray-500">Product detail</th>
                    {comparedProducts.map((product) => (
                      <th scope="col" key={product.id} className="min-w-44 border-b border-gray-100 p-3 align-top">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-gray-950">{product.name}</p>
                            <p className="mt-1 text-xs font-normal text-gray-500">{product.brand || "BodhiMart seller"}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleCompare(product)}
                            aria-label={`Remove ${product.name} from comparison`}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600"
                          >
                            <Copy en="Remove" hi="हटाएँ" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Category", value: (product: Product) => product.category_id ? categoryMap[product.category_id] || "Product" : "Product" },
                    { label: "Price", value: (product: Product) => `₹${Number(product.selling_price).toLocaleString("en-IN")}` },
                    { label: "MRP", value: (product: Product) => `₹${Number(product.mrp).toLocaleString("en-IN")}` },
                    { label: "Unit / pack", value: (product: Product) => product.unit || "Not provided" },
                    { label: "Availability", value: (product: Product) => getAvailableStock(product.id) > 0 ? `${getAvailableStock(product.id)} available` : "Out of stock" },
                    { label: "Fulfilment", value: (product: Product) => product.delivery_available ? "Delivery available" : "Pickup only" },
                    { label: "Minimum order", value: (product: Product) => `${Math.max(1, Number(product.minimum_order_quantity) || 1)} ${product.unit || "unit(s)"}` },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-gray-100 last:border-0">
                      <th scope="row" className="sticky left-0 bg-white p-3 font-semibold text-gray-600">{row.label}</th>
                      {comparedProducts.map((product) => (
                        <td key={product.id} className="p-3 font-medium text-gray-900">{row.value(product)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
