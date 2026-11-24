'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Share2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';

const marketplacePhotoLoader = ({ src }: { src: string }) => src;

type Product = {
  id: string;
  product_id: string;
  sku: string | null;
  category_id: string | null;
  name: string;
  slug: string | null;
  image_url: string | null;
  image_gallery: string[] | null;
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

type PendingProductAction = {
  productId: string;
  action: 'addToCart' | 'saveToWishlist';
  createdAt: number;
};

function productPlaceholder(product: Product) {
  const name = product.name.toLowerCase();
  if (/biscuit|cookie|cracker/.test(name)) return '🍪';
  if (/rice|grain|cereal/.test(name)) return '🍚';
  if (/milk|dairy|cheese|butter/.test(name)) return '🥛';
  if (/fruit|vegetable|produce/.test(name)) return '🥬';
  if (/seed/.test(name)) return '🌱';
  if (/feed|poultry|layer/.test(name)) return '🐓';
  return '📦';
}

function formatCurrency(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function ProductDetailsPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const productId = Array.isArray(params.productId)
    ? params.productId[0]
    : params.productId;

  const [product, setProduct] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState('Marketplace product');
  const [availableStock, setAvailableStock] = useState(0);
  const [availableAlternatives, setAvailableAlternatives] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [wishlistMessage, setWishlistMessage] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [wishlistSaved, setWishlistSaved] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [catalogueHref, setCatalogueHref] = useState('/bodhimart/products');
  const autoActionHandled = useRef(false);

  useEffect(() => {
    const returnTo = new URLSearchParams(window.location.search).get('from');
    if (!returnTo) return;

    try {
      const destination = new URL(returnTo, window.location.origin);
      if (
        destination.origin === window.location.origin &&
        destination.pathname === '/bodhimart/products'
      ) {
        // The URL restores the shopper's last catalogue filters on initial load.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCatalogueHref(`${destination.pathname}${destination.search}`);
      }
    } catch {
      // Ignore an invalid return path and keep the catalogue default.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setError('');

      try {
        const { data: productData, error: productError } = await supabase
          .from('marketplace_public_products')
          .select('id, product_id, sku, category_id, name, slug, image_url, image_gallery, description, brand, unit, weight, mrp, selling_price, tax_percent, minimum_order_quantity, maximum_order_quantity, delivery_available, status')
          .eq('product_id', productId)
          .eq('status', 'ACTIVE')
          .maybeSingle();

        if (productError) throw productError;
        if (!productData) {
          throw new Error('This product is not available in the public catalogue.');
        }

        let alternatives: Product[] = [];
        try {
          const { data: alternativeProducts, error: alternativesError } = await supabase
            .from('marketplace_public_products')
            .select('id, product_id, sku, category_id, name, slug, image_url, image_gallery, description, brand, unit, weight, mrp, selling_price, tax_percent, minimum_order_quantity, maximum_order_quantity, delivery_available, status')
            .eq('status', 'ACTIVE')
            .neq('id', productData.id)
            .order('created_at', { ascending: false })
            .limit(30);

          if (alternativesError) throw alternativesError;

          const alternativeRows = (alternativeProducts || []) as Product[];
          if (alternativeRows.length > 0) {
            const { data: alternativeInventory, error: alternativeInventoryError } = await supabase
              .from('marketplace_public_inventory')
              .select('product_id, available_quantity')
              .in('product_id', alternativeRows.map((item) => item.id));

            if (alternativeInventoryError) throw alternativeInventoryError;

            const stockByProduct = new Map(
              (alternativeInventory || []).map((item) => [
                item.product_id,
                Number(item.available_quantity || 0),
              ])
            );

            alternatives = alternativeRows
              .filter((item) => (stockByProduct.get(item.id) || 0) > 0)
              .sort((first, second) => {
                const firstMatchesCategory = first.category_id === productData.category_id;
                const secondMatchesCategory = second.category_id === productData.category_id;
                return Number(secondMatchesCategory) - Number(firstMatchesCategory);
              })
              .slice(0, 4);
          }
        } catch (alternativesError) {
          console.warn('Unable to load available alternatives.', alternativesError);
        }

        const [inventoryResult, categoryResult] = await Promise.all([
          supabase
            .from('marketplace_public_inventory')
            .select('available_quantity')
            .eq('product_id', productData.id)
            .maybeSingle(),
          productData.category_id
            ? supabase
                .from('marketplace_categories')
                .select('name')
                .eq('id', productData.category_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (inventoryResult.error) throw inventoryResult.error;
        if (categoryResult.error) throw categoryResult.error;

        let saved = false;
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          const { data: savedItem, error: savedItemError } = await supabase
            .from('marketplace_wishlist_items')
            .select('id')
            .eq('user_id', authData.user.id)
            .eq('product_id', productData.id)
            .maybeSingle();

          if (savedItemError) throw savedItemError;
          saved = Boolean(savedItem);
        }

        if (!cancelled) {
          setProduct(productData as Product);
          setWishlistSaved(saved);
          setSelectedImageUrl(productData.image_url || productData.image_gallery?.[0] || '');
          setAvailableStock(
            Math.max(0, Number(inventoryResult.data?.available_quantity || 0))
          );
          setAvailableAlternatives(alternatives);
          setCategoryName(categoryResult.data?.name || 'Marketplace product');
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load this product.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (productId) void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productId, supabase]);

  const continueAfterLogin = useCallback((action: 'addToCart' | 'saveToWishlist') => {
    if (!product) return;

    const pendingAction: PendingProductAction = {
      productId: product.product_id,
      action,
      createdAt: Date.now(),
    };
    try {
      sessionStorage.setItem('bodhimart.pending-product-action', JSON.stringify(pendingAction));
    } catch {
      setError('Sign in, then return to this product and try again.');
    }

    const returnTo = new URL(
      `/bodhimart/products/${encodeURIComponent(product.product_id)}`,
      window.location.origin
    );
    const cataloguePath = new URLSearchParams(window.location.search).get('from');
    if (cataloguePath) returnTo.searchParams.set('from', cataloguePath);
    returnTo.searchParams.set('resume', '1');
    router.push(`/login?account=buyer&redirect=${encodeURIComponent(`${returnTo.pathname}${returnTo.search}`)}`);
  }, [product, router]);

  const toggleWishlist = useCallback(async () => {
    if (!product || wishlistBusy) return;

    setWishlistBusy(true);
    setWishlistMessage('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        continueAfterLogin('saveToWishlist');
        return;
      }

      if (wishlistSaved) {
        const { error: removeError } = await supabase
          .from('marketplace_wishlist_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        if (removeError) throw removeError;
        setWishlistSaved(false);
        setWishlistMessage('Removed from your saved items.');
      } else {
        const { error: saveError } = await supabase
          .from('marketplace_wishlist_items')
          .insert({ user_id: user.id, product_id: product.id });
        if (saveError) throw saveError;
        setWishlistSaved(true);
        setWishlistMessage('Saved to your list.');
      }
    } catch (wishlistError: unknown) {
      setWishlistMessage(
        wishlistError instanceof Error
          ? wishlistError.message
          : 'Unable to update your saved items.'
      );
    } finally {
      setWishlistBusy(false);
    }
  }, [supabase, wishlistBusy, product, wishlistSaved, continueAfterLogin]);

  async function shareProduct() {
    if (!product) return;

    setShareMessage('');
    const url = `${window.location.origin}/bodhimart/products/${encodeURIComponent(product.product_id)}`;
    const shareData = {
      title: `${product.name} | BodhiMart`,
      text: `View ${product.name} on BodhiMart.`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareMessage('Product shared.');
        return;
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const temporaryInput = document.createElement('textarea');
        temporaryInput.value = url;
        temporaryInput.setAttribute('readonly', '');
        temporaryInput.style.position = 'fixed';
        temporaryInput.style.opacity = '0';
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        const copied = document.execCommand('copy');
        temporaryInput.remove();
        if (!copied) throw new Error('Clipboard access is unavailable.');
      }
      setShareMessage('Product link copied. Paste it into a message to share.');
    } catch {
      setShareMessage('Unable to share this product from this browser.');
    }
  }

  const addToCart = useCallback(async () => {
    if (!product || availableStock <= 0) return;

    setAdding(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        continueAfterLogin('addToCart');
        return;
      }

      let { data: cart, error: cartError } = await supabase
        .from('marketplace_carts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cartError) throw cartError;

      if (!cart) {
        const { data: newCart, error: createCartError } = await supabase
          .from('marketplace_carts')
          .insert({ user_id: user.id })
          .select('id')
          .single();

        if (createCartError) throw createCartError;
        cart = newCart;
      }

      const { data: existingItem, error: existingItemError } = await supabase
        .from('marketplace_cart_items')
        .select('id, quantity')
        .eq('cart_id', cart.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existingItemError) throw existingItemError;

      const minimumQuantity = Math.max(
        1,
        Number(product.minimum_order_quantity) || 1
      );
      const maximumQuantity = Math.min(
        availableStock,
        product.maximum_order_quantity
          ? Number(product.maximum_order_quantity)
          : availableStock
      );
      const nextQuantity = existingItem
        ? Number(existingItem.quantity || 0) + 1
        : minimumQuantity;

      if (nextQuantity > maximumQuantity) {
        throw new Error(
          `Only ${availableStock} unit${availableStock === 1 ? '' : 's'} are available.`
        );
      }

      if (existingItem) {
        const { error: updateError } = await supabase
          .from('marketplace_cart_items')
          .update({
            quantity: nextQuantity,
            price_snapshot: product.selling_price,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingItem.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('marketplace_cart_items')
          .insert({
            cart_id: cart.id,
            product_id: product.id,
            quantity: minimumQuantity,
            price_snapshot: product.selling_price,
          });

        if (insertError) throw insertError;
      }

      router.push('/bodhimart/cart');
    } catch (addError: unknown) {
      setError(
        addError instanceof Error
          ? addError.message
          : 'Unable to add this product to your cart.'
      );
    } finally {
      setAdding(false);
    }
  }, [product, availableStock, supabase, router, continueAfterLogin]);

  const resumePendingAction = useEffectEvent(() => {
    if (loading || !product || autoActionHandled.current) return;

    const returnUrl = new URL(window.location.href);
    if (returnUrl.searchParams.get('resume') !== '1') return;

    autoActionHandled.current = true;
    returnUrl.searchParams.delete('resume');
    router.replace(`${returnUrl.pathname}${returnUrl.search}${returnUrl.hash}`, { scroll: false });

    let pendingAction: PendingProductAction | null = null;
    try {
      const storedAction = sessionStorage.getItem('bodhimart.pending-product-action');
      if (storedAction) pendingAction = JSON.parse(storedAction) as PendingProductAction;
      sessionStorage.removeItem('bodhimart.pending-product-action');
    } catch {
      return;
    }

    if (
      !pendingAction ||
      pendingAction.productId !== product.product_id ||
      Date.now() - pendingAction.createdAt > 30 * 60 * 1000
    ) return;

    if (pendingAction.action === 'addToCart') {
      void addToCart();
    } else if (pendingAction.action === 'saveToWishlist' && wishlistSaved) {
      setWishlistMessage('This product is already saved to your list.');
    } else if (pendingAction.action === 'saveToWishlist') {
      void toggleWishlist();
    }
  });

  useEffect(() => {
    const timer = window.setTimeout(() => resumePendingAction(), 0);
    return () => window.clearTimeout(timer);
  }, [loading, product]);
  const saving = product
    ? Math.max(0, Number(product.mrp) - Number(product.selling_price))
    : 0;
  const savingPercent = product?.mrp
    ? Math.round((saving / Number(product.mrp)) * 100)
    : 0;
  const productImages = product
    ? [product.image_url, ...(product.image_gallery || [])].filter(
        (url): url is string => Boolean(url)
      )
    : [];

  return (
    <main className="min-h-screen bg-[#f6f8f5] text-[#183426]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
          <Link href="/bodhimart" className="hover:text-green-800">BodhiMart</Link>
          <span aria-hidden="true">/</span>
          <Link href={catalogueHref} className="hover:text-green-800">Products</Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-gray-700">{product?.name || 'Product details'}</span>
        </nav>

        {loading ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-gray-600">Loading product details…</p>
          </div>
        ) : error && !product ? (
          <section className="rounded-3xl border border-red-100 bg-white p-10 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Product unavailable</h1>
            <p className="mt-3 text-gray-600">{error}</p>
            <Link href="/bodhimart/products" className="mt-6 inline-flex rounded-xl bg-green-800 px-5 py-3 font-semibold text-white hover:bg-green-900">
              Back to products
            </Link>
          </section>
        ) : product ? (
          <>
            <section className="grid overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
              <div className="flex flex-col bg-[radial-gradient(circle_at_50%_40%,#fffdf5_0%,#f3f7ed_62%,#e7efe4_100%)]">
                <div className="relative flex min-h-[340px] flex-1 items-center justify-center overflow-hidden p-6 sm:min-h-[480px] sm:p-10">
                  {selectedImageUrl ? (
                    <Image
                      key={selectedImageUrl}
                      src={selectedImageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 52vw"
                      loader={marketplacePhotoLoader}
                      unoptimized
                      priority
                      className="bg-white object-contain p-6"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex h-52 w-52 items-center justify-center rounded-[2.5rem] border border-white/80 bg-white/75 text-[104px] shadow-[0_20px_50px_rgba(28,72,45,0.13)]">
                      <span role="img" aria-label={`${product.name} product image`}>
                        {productPlaceholder(product)}
                      </span>
                    </div>
                  )}
                  {savingPercent > 0 && (
                    <span className="absolute left-5 top-5 rounded-full bg-green-800 px-4 py-2 text-sm font-bold text-white shadow-sm">
                      {savingPercent}% off
                    </span>
                  )}
                </div>

                {productImages.length > 1 && (
                  <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 bg-white p-4 sm:px-6" aria-label="Product photos">
                  {productImages.map((url, index) => (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => setSelectedImageUrl(url)}
                      aria-label={`View product photo ${index + 1}`}
                      aria-pressed={selectedImageUrl === url}
                      className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 bg-gray-50 p-1 transition focus:outline-none focus:ring-2 focus:ring-green-700 ${selectedImageUrl === url ? 'border-green-700' : 'border-gray-200 hover:border-green-400'}`}
                    >
                      <Image src={url} alt={`${product.name} photo ${index + 1}`} fill sizes="80px" loader={marketplacePhotoLoader} unoptimized className="object-contain p-1" />
                    </button>
                  ))}
                  <span className="self-center text-xs text-gray-500">{productImages.length} product photos</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col p-6 sm:p-9 lg:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                    {categoryName}
                  </span>
                  <span className="text-xs text-gray-400">ID: {product.product_id}</span>
                </div>

                <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                  {product.name}
                </h1>
                {product.brand && (
                  <p className="mt-2 text-sm text-gray-500">Brand: {product.brand}</p>
                )}

                <div className="mt-7 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-4xl font-bold text-green-900">
                    {formatCurrency(product.selling_price)}
                  </span>
                  {product.mrp > product.selling_price && (
                    <span className="text-lg text-gray-400 line-through">
                      {formatCurrency(product.mrp)}
                    </span>
                  )}
                </div>
                {saving > 0 && (
                  <p className="mt-2 text-sm font-semibold text-green-700">
                    You save {formatCurrency(saving)}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {availableStock > 0 ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-sm font-bold text-green-800">
                      <span className="h-2 w-2 rounded-full bg-green-600" />
                      {availableStock <= 5
                        ? `Only ${availableStock} available`
                        : 'In stock'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-bold text-red-700">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Out of stock
                    </span>
                  )}
                  <span className="text-sm text-gray-600">
                    {product.delivery_available ? 'Delivery available' : 'Pickup only'}
                  </span>
                </div>

                {error && (
                  <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={addToCart}
                  disabled={adding || availableStock <= 0}
                  className={`mt-7 min-h-12 w-full rounded-xl px-5 py-3 text-sm font-bold text-white transition focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 ${
                    availableStock <= 0
                      ? 'cursor-not-allowed bg-gray-300'
                      : adding
                        ? 'cursor-wait bg-green-600'
                        : 'bg-green-800 hover:bg-green-900'
                  }`}
                >
                  {availableStock <= 0
                    ? 'Currently unavailable'
                    : adding
                      ? 'Adding to cart…'
                      : 'Add to cart'}
                </button>

                {availableStock <= 0 && (
                  <Link
                    href="/bodhimart/products?availability=in_stock"
                    className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-green-50 px-5 py-3 text-sm font-bold text-green-900 transition hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
                  >
                    Browse available products
                  </Link>
                )}

                <button
                  type="button"
                  onClick={toggleWishlist}
                  disabled={wishlistBusy}
                  aria-pressed={wishlistSaved}
                  className="mt-3 min-h-12 w-full rounded-xl border border-green-800 px-5 py-3 text-sm font-bold text-green-900 transition hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                >
                  {wishlistBusy
                    ? 'Updating saved items…'
                    : wishlistSaved
                      ? '♥ Saved to your list'
                      : '♡ Save to wishlist'}
                </button>
                {wishlistMessage && (
                  <p role="status" className="mt-2 text-sm text-gray-600">
                    {wishlistMessage}
                  </p>
                )}
                <button
                  type="button"
                  onClick={shareProduct}
                  className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 transition hover:border-green-700 hover:bg-green-50 hover:text-green-900 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2"
                >
                  <Share2 aria-hidden="true" size={18} />
                  Share product
                </button>
                {shareMessage && (
                  <p role="status" className="mt-2 text-sm text-gray-600">
                    {shareMessage}
                  </p>
                )}

                <div className="mt-8 grid grid-cols-2 gap-3 border-t border-gray-100 pt-6 text-sm">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Pack / unit</p>
                    <p className="mt-1 font-semibold text-gray-800">{product.unit || '—'}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Minimum order</p>
                    <p className="mt-1 font-semibold text-gray-800">{product.minimum_order_quantity}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 md:grid-cols-[1fr_0.8fr]">
              <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-bold text-gray-900">About this product</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-600">
                  {product.description || 'The seller has not added a product description yet.'}
                </p>
              </article>

              <article className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-bold text-gray-900">Product details</h2>
                <dl className="mt-4 divide-y divide-gray-100 text-sm">
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-gray-500">Category</dt>
                    <dd className="text-right font-medium text-gray-800">{categoryName}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-gray-500">Unit</dt>
                    <dd className="text-right font-medium text-gray-800">{product.unit || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-gray-500">Weight</dt>
                    <dd className="text-right font-medium text-gray-800">{product.weight ? `${product.weight} kg` : '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-gray-500">Tax</dt>
                    <dd className="text-right font-medium text-gray-800">{product.tax_percent}%</dd>
                  </div>
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-gray-500">Fulfilment</dt>
                    <dd className="text-right font-medium text-gray-800">
                      {product.delivery_available ? 'Delivery or pickup where offered' : 'Pickup only'}
                    </dd>
                  </div>
                </dl>
              </article>
            </section>

            {availableAlternatives.length > 0 && (
              <section className="mt-10" aria-labelledby="available-alternatives-title">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Ready to order</p>
                    <h2 id="available-alternatives-title" className="mt-1 text-2xl font-bold text-gray-950">
                      Available alternatives
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">These listings currently have stock available.</p>
                  </div>
                  <Link href="/bodhimart/products?availability=in_stock" className="text-sm font-semibold text-green-800 hover:underline">
                    See all in-stock products →
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {availableAlternatives.map((alternative) => (
                    <article key={alternative.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex h-32 items-center justify-center bg-[radial-gradient(circle_at_50%_38%,#fffdf5_0%,#f3f7ed_60%,#e8f0e5_100%)]">
                        <span role="img" aria-label={`${alternative.name} product`} className="text-6xl">
                          {productPlaceholder(alternative)}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="line-clamp-2 min-h-12 font-bold text-gray-900">{alternative.name}</h3>
                        {alternative.unit && <p className="mt-1 text-xs text-gray-500">{alternative.unit}</p>}
                        <p className="mt-3 text-xl font-bold text-green-900">{formatCurrency(alternative.selling_price)}</p>
                        <p className="mt-1 text-xs font-semibold text-green-700">In stock</p>
                        <Link href={`/bodhimart/products/${encodeURIComponent(alternative.product_id)}`} className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-green-800 px-3 py-2 text-sm font-semibold text-green-900 transition hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-700">
                          View product
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-7">
              <Link href={catalogueHref} className="text-sm font-semibold text-green-800 hover:text-green-950">
                ← Back to the catalogue
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
