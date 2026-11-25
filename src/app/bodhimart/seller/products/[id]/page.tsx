'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/client';
import {
  marketplaceProductPhotoPathFromUrl,
  removeMarketplaceProductPhotos,
  uploadMarketplaceProductPhoto,
} from '../../../../../lib/marketplace/product-photos';
import { validateProductListingDetails } from '../../../../../lib/marketplace/product-listing-validation';

const marketplacePhotoLoader = ({ src }: { src: string }) => src;

type Product = {
  id: string;
  product_id: string;
  sku: string | null;
  name: string;
  slug: string | null;
  image_url: string | null;
  external_url: string | null;
  image_gallery: string[];
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
  category_id: string | null;
};

type Category = {
  id: string;
  name: string;
};

type Seller = {
  id: string;
  seller_id: string;
  shop_name: string;
  status: string;
};

export default function EditProductPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();

  const productId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [seller, setSeller] = useState<Seller | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviewUrls, setGalleryPreviewUrls] = useState<string[]>([]);
  const [galleryInputKey, setGalleryInputKey] = useState(0);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category_id: '',
    image_url: '',
    external_url: '',
    description: '',
    brand: '',
    unit: '',
    weight: '',
    mrp: '',
    selling_price: '',
    tax_percent: '0',
    minimum_order_quantity: '1',
    maximum_order_quantity: '',
    delivery_available: true,
  });

  useEffect(() => {
    return () => {
      if (imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    return () => {
      galleryPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [galleryPreviewUrls]);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(
          `/login?account=seller&redirect=${encodeURIComponent(`/bodhimart/seller/products/${productId}`)}`
        );
        return;
      }

      const { data: sellerData, error: sellerError } =
        await supabase
          .from('marketplace_sellers')
          .select(
            'id, seller_id, shop_name, status'
          )
          .eq('user_id', user.id)
          .maybeSingle();

      if (sellerError) {
        throw sellerError;
      }

      if (!sellerData) {
        throw new Error(
          'Seller profile not found.'
        );
      }

      if (sellerData.status !== 'ACTIVE') {
        throw new Error(
          `Your seller account is currently ${sellerData.status}.`
        );
      }

      setSeller(sellerData);

      const [productResult, categoriesResult] =
        await Promise.all([
          supabase
            .from('marketplace_products')
            .select(
              `
                id,
                product_id,
                sku,
                name,
                slug,
                image_url,
                external_url,
                image_gallery,
                description,
                brand,
                unit,
                weight,
                mrp,
                selling_price,
                tax_percent,
                minimum_order_quantity,
                maximum_order_quantity,
                delivery_available,
                status,
                category_id
              `
            )
            .eq('id', productId)
            .eq('seller_id', sellerData.id)
            .maybeSingle(),

          supabase
            .from('marketplace_categories')
            .select('id, name')
            .order('name', {
              ascending: true,
            }),
        ]);

      if (productResult.error) {
        throw productResult.error;
      }

      if (categoriesResult.error) {
        throw categoriesResult.error;
      }

      if (!productResult.data) {
        throw new Error(
          'Product not found or you do not have access to this product.'
        );
      }

      const p = productResult.data as Product;

      setProduct(p);
      setGalleryUrls(Array.isArray(p.image_gallery) ? p.image_gallery : []);
      setCategories(
        (categoriesResult.data || []) as Category[]
      );

      setForm({
        name: p.name || '',
        sku: p.sku || '',
        category_id: p.category_id || '',
        image_url: p.image_url || '',
        external_url: p.external_url || '',
        description: p.description || '',
        brand: p.brand || '',
        unit: p.unit || '',
        weight:
          p.weight !== null &&
          p.weight !== undefined
            ? String(p.weight)
            : '',
        mrp:
          p.mrp !== null &&
          p.mrp !== undefined
            ? String(p.mrp)
            : '',
        selling_price:
          p.selling_price !== null &&
          p.selling_price !== undefined
            ? String(p.selling_price)
            : '',
        tax_percent:
          p.tax_percent !== null &&
          p.tax_percent !== undefined
            ? String(p.tax_percent)
            : '0',
        minimum_order_quantity:
          p.minimum_order_quantity !== null &&
          p.minimum_order_quantity !== undefined
            ? String(p.minimum_order_quantity)
            : '1',
        maximum_order_quantity:
          p.maximum_order_quantity !== null &&
          p.maximum_order_quantity !== undefined
            ? String(
                p.maximum_order_quantity
              )
            : '',
        delivery_available:
          p.delivery_available,
      });
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          'Unable to load the product.'
      );
    } finally {
      setLoading(false);
    }
  }, [productId, router, supabase]);

  useEffect(() => {
    // Loading uses async Supabase requests; state updates happen after those requests resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (productId) void loadProduct();
  }, [loadProduct, productId]);

  function updateField(
    field: keyof typeof form,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handlePhotoSelection(file: File | null) {
    setError('');

    if (!file) {
      setImageFile(null);
      setImagePreviewUrl('');
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP product photo.');
      setImageFile(null);
      setImagePreviewUrl('');
      setPhotoInputKey((current) => current + 1);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Product photos must be 5 MB or smaller.');
      setImageFile(null);
      setImagePreviewUrl('');
      setPhotoInputKey((current) => current + 1);
      return;
    }

    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function handleGallerySelection(fileList: FileList | null) {
    setError('');
    const files = Array.from(fileList || []);

    if (galleryUrls.length + files.length > 4) {
      setError('A product can have up to four additional photos. Remove an existing photo first.');
      setGalleryFiles([]);
      setGalleryPreviewUrls([]);
      setGalleryInputKey((current) => current + 1);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidFile = files.find(
      (file) => !allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024
    );

    if (invalidFile) {
      setError(
        !allowedTypes.includes(invalidFile.type)
          ? 'Choose JPG, PNG, or WebP product photos.'
          : 'Each product photo must be 5 MB or smaller.'
      );
      setGalleryFiles([]);
      setGalleryPreviewUrls([]);
      setGalleryInputKey((current) => current + 1);
      return;
    }

    setGalleryFiles(files);
    setGalleryPreviewUrls(files.map((file) => URL.createObjectURL(file)));
  }

  function validateForm() {
    if (!form.name.trim()) {
      return 'Product name is required.';
    }

    const listingDetailsError = validateProductListingDetails(
      form.description,
      form.unit
    );
    if (listingDetailsError) return listingDetailsError;

    if (!form.category_id) {
      return 'Please select a category.';
    }

    if (form.image_url.trim()) {
      try {
        const imageUrl = new URL(form.image_url.trim());
        if (imageUrl.protocol !== 'https:') {
          return 'Product photo links must use HTTPS.';
        }
      } catch {
        return 'Please enter a valid product photo URL.';
      }
    }

    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      return 'Product photos must be 5 MB or smaller.';
    }

    if (form.external_url.trim()) {
      try { const referenceUrl = new URL(form.external_url.trim()); if (referenceUrl.protocol !== 'https:') return 'Product or reference links must use HTTPS.'; }
      catch { return 'Please enter a valid product or reference URL.'; }
    }

    if (galleryUrls.length + galleryFiles.length > 4) {
      return 'A product can have up to four additional photos.';
    }

    const mrp = Number(form.mrp);
    const sellingPrice = Number(
      form.selling_price
    );
    const tax = Number(form.tax_percent);
    const minimumQty = Number(
      form.minimum_order_quantity
    );

    if (
      !form.mrp ||
      Number.isNaN(mrp) ||
      mrp <= 0
    ) {
      return 'Please enter a valid MRP.';
    }

    if (
      !form.selling_price ||
      Number.isNaN(sellingPrice) ||
      sellingPrice <= 0
    ) {
      return 'Please enter a valid selling price.';
    }

    if (sellingPrice > mrp) {
      return 'Selling price cannot be greater than MRP.';
    }

    if (
      Number.isNaN(tax) ||
      tax < 0 ||
      tax > 100
    ) {
      return 'Tax percentage must be between 0 and 100.';
    }

    if (
      Number.isNaN(minimumQty) ||
      minimumQty <= 0
    ) {
      return 'Minimum order quantity must be greater than 0.';
    }

    if (form.maximum_order_quantity) {
      const maximumQty = Number(
        form.maximum_order_quantity
      );

      if (
        Number.isNaN(maximumQty) ||
        maximumQty < minimumQty
      ) {
        return 'Maximum order quantity must be greater than or equal to minimum quantity.';
      }
    }

    return '';
  }

  async function handleSave(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError('');
    setMessage('');

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!seller || !product) {
      setError(
        'Product information is not available.'
      );
      return;
    }

    setSaving(true);
    const uploadedPhotoPaths: string[] = [];

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          'Your session has expired. Please login again.'
        );
      }

      let productImageUrl = form.image_url.trim() || null;
      const nextGalleryUrls = [...galleryUrls];

      if (imageFile) {
        const uploadedPhoto = await uploadMarketplaceProductPhoto(
          supabase,
          user.id,
          imageFile
        );
        uploadedPhotoPaths.push(uploadedPhoto.path);
        productImageUrl = uploadedPhoto.publicUrl;
      }

      for (const file of galleryFiles) {
        const uploadedPhoto = await uploadMarketplaceProductPhoto(
          supabase,
          user.id,
          file
        );
        uploadedPhotoPaths.push(uploadedPhoto.path);
        nextGalleryUrls.push(uploadedPhoto.publicUrl);
      }

      if (!productImageUrl && nextGalleryUrls.length > 0) {
        productImageUrl = nextGalleryUrls.shift() || null;
      }

      const { error: updateError } =
        await supabase
          .from('marketplace_products')
          .update({
            sku: form.sku.trim() || null,
            category_id: form.category_id,
            name: form.name.trim(),
            image_url: productImageUrl,
            external_url: form.external_url.trim() || null,
            image_gallery: nextGalleryUrls,
            description:
              form.description.trim() || null,
            brand: form.brand.trim() || null,
            unit: form.unit.trim() || null,
            weight: form.weight
              ? Number(form.weight)
              : null,
            mrp: Number(form.mrp),
            selling_price: Number(
              form.selling_price
            ),
            tax_percent: Number(
              form.tax_percent || 0
            ),
            minimum_order_quantity: Number(
              form.minimum_order_quantity || 1
            ),
            maximum_order_quantity:
              form.maximum_order_quantity
                ? Number(
                    form.maximum_order_quantity
                  )
                : null,
            delivery_available:
              form.delivery_available,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id)
          .eq('seller_id', seller.id);

      if (updateError) {
        throw updateError;
      }

      uploadedPhotoPaths.length = 0;

      const retainedPhotoUrls = new Set([
        productImageUrl,
        ...nextGalleryUrls,
      ].filter((url): url is string => Boolean(url)));
      const removedPhotoPaths = [
        product.image_url,
        ...(product.image_gallery || []),
      ]
        .filter(
          (url): url is string =>
            url !== null && !retainedPhotoUrls.has(url)
        )
        .map((url) => marketplaceProductPhotoPathFromUrl(url, user.id))
        .filter((path): path is string => Boolean(path));

      let photoCleanupFailed = false;
      try {
        await removeMarketplaceProductPhotos(supabase, removedPhotoPaths);
      } catch (cleanupError) {
        photoCleanupFailed = true;
        console.error('Product was saved, but removed photo files could not be cleaned up.', cleanupError);
      }

      setImageFile(null);
      setImagePreviewUrl('');
      setPhotoInputKey((current) => current + 1);
      setGalleryFiles([]);
      setGalleryPreviewUrls([]);
      setGalleryInputKey((current) => current + 1);

      const wasLiveListing = product.status === 'ACTIVE';
      await loadProduct();
      setMessage(
        photoCleanupFailed
          ? 'Product updated. A removed photo could not be deleted from storage; please contact support.'
          : wasLiveListing
            ? 'Changes saved and sent for admin review. Customers will see the listing again after approval.'
            : 'Product updated successfully.'
      );
    } catch (err: any) {
      if (uploadedPhotoPaths.length > 0) {
        try {
          await removeMarketplaceProductPhotos(supabase, uploadedPhotoPaths);
        } catch (cleanupError) {
          console.error('Unable to remove unused product photos.', cleanupError);
        }
      }

      console.error(err);

      setError(
        err?.message ||
          'Unable to update the product.'
      );
    } finally {
      setSaving(false);
    }
  }


  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#f5f8f5',
          padding: 40,
          textAlign: 'center',
        }}
      >
        Loading product...
      </main>
    );
  }

  if (!product) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#f5f8f5',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            maxWidth: 700,
            margin: '0 auto',
            background: '#fff',
            borderRadius: 16,
            padding: 30,
            textAlign: 'center',
          }}
        >
          <h2>Product not found</h2>

          <p
            style={{
              color: '#6b7280',
            }}
          >
            {error ||
              'The requested product could not be found.'}
          </p>

          <Link
            href="/bodhimart/seller/products"
            style={{
              display: 'inline-block',
              background: '#145c2b',
              color: '#fff',
              padding: '11px 18px',
              borderRadius: 9,
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Back to My Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f8f5',
        padding: '32px 20px 60px',
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#145c2b',
            color: '#fff',
            borderRadius: 18,
            padding: '24px 28px',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.8,
                  marginBottom: 6,
                }}
              >
                BODHI MART SELLER PORTAL
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 30,
                }}
              >
                View / Edit Product
              </h1>

              <p
                style={{
                  margin: '8px 0 0',
                  opacity: 0.9,
                }}
              >
                {product.product_id}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/bodhimart/seller/products"
                style={headerButton}
              >
                My Products
              </Link>

              <Link
                href="/bodhimart/seller/dashboard"
                style={headerButton}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: 12,
              padding: 15,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              background: '#ecfdf5',
              color: '#166534',
              border: '1px solid #bbf7d0',
              borderRadius: 12,
              padding: 15,
              marginBottom: 20,
            }}
          >
            {message}
          </div>
        )}

        {/* Product identity */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 16,
            padding: 22,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(180px,1fr))',
              gap: 18,
            }}
          >
            <Info
              label="Product ID"
              value={product.product_id}
            />

            <Info
              label="Seller"
              value={
                seller
                  ? seller.seller_id
                  : '—'
              }
            />

            <Info
              label="Current Status"
              value={product.status}
            />
          </div>
        </div>

        <form onSubmit={handleSave}>
          {/* Basic information */}
          <Section title="Basic Product Information">
            <div className="form-grid">
              <Field
                label="Product Name"
                required
              >
                <input
                  value={form.name}
                  onChange={(e) =>
                    updateField(
                      'name',
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </Field>

              <Field label="SKU">
                <input
                  value={form.sku}
                  onChange={(e) =>
                    updateField(
                      'sku',
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </Field>

              <Field
                label="Category"
                required
              >
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    updateField(
                      'category_id',
                      e.target.value
                    )
                  }
                  style={inputStyle}
                >
                  <option value="">
                    Select Category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Brand">
                <input
                  value={form.brand}
                  onChange={(e) =>
                    updateField(
                      'brand',
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </Field>
            </div>

            <Field label="Change photo from this device">
              <input
                key={photoInputKey}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) =>
                  handlePhotoSelection(e.currentTarget.files?.[0] || null)
                }
                style={inputStyle}
              />
              <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 12 }}>
                Choose a JPG, PNG, or WebP photo up to 5 MB.
              </p>
            </Field>

            <Field label="Or use a photo URL">
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => {
                  setImageFile(null);
                  setImagePreviewUrl('');
                  setPhotoInputKey((current) => current + 1);
                  updateField('image_url', e.target.value);
                }}
                placeholder="https://example.com/product-photo.jpg"
                style={inputStyle}
              />
              <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 12 }}>
                Leave blank to remove the current photo.
              </p>
              {(imagePreviewUrl || form.image_url.trim().startsWith('https://')) && (
                <Image
                  src={imagePreviewUrl || form.image_url.trim()}
                  alt="Product photo preview"
                  width={160}
                  height={120}
                  loader={marketplacePhotoLoader}
                  unoptimized
                  loading="lazy"
                  style={{
                    display: 'block',
                    width: 160,
                    height: 120,
                    objectFit: 'contain',
                    marginTop: 10,
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    background: '#f8faf7',
                  }}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </Field>

            <Field label={`More product photos (${galleryUrls.length}/4)`}>
              <input
                key={galleryInputKey}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) =>
                  handleGallerySelection(e.currentTarget.files)
                }
                style={inputStyle}
              />
              <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 12 }}>
                Add up to four extra JPG, PNG, or WebP photos. Each can be up to 5 MB.
              </p>
              {(galleryUrls.length > 0 || galleryPreviewUrls.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {galleryUrls.map((url, index) => (
                    <div key={url} className="relative">
                      <Image
                        src={url}
                        alt={`Additional product photo ${index + 1}`}
                        width={88}
                        height={72}
                        loader={marketplacePhotoLoader}
                        unoptimized
                        className="h-[72px] w-[88px] rounded-lg border border-gray-200 bg-white object-contain p-1"
                      />
                      <button
                        type="button"
                        aria-label={`Remove additional photo ${index + 1}`}
                        onClick={() =>
                          setGalleryUrls((current) =>
                            current.filter((photoUrl) => photoUrl !== url)
                          )
                        }
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {galleryPreviewUrls.map((url, index) => (
                    <Image
                      key={url}
                      src={url}
                      alt={`New additional photo ${index + 1}`}
                      width={88}
                      height={72}
                      loader={marketplacePhotoLoader}
                      unoptimized
                      className="h-[72px] w-[88px] rounded-lg border border-dashed border-green-400 bg-white object-contain p-1"
                    />
                  ))}
                </div>
              )}
            </Field>

            <Field label="Product or reference link">
              <input type="url" value={form.external_url} onChange={(e) => updateField('external_url', e.target.value)} placeholder="https://your-site.example/product" maxLength={2000} style={inputStyle} />
              <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 12 }}>Optional HTTPS link to product details, a demonstration video, or supporting information. It will appear on the public listing.</p>
            </Field>

            <Field label="Description *">
              <textarea
                value={form.description}
                onChange={(e) =>
                  updateField(
                    'description',
                    e.target.value
                  )
                }
                placeholder="Include contents, pack size, quality and intended use."
                rows={5}
                minLength={20}
                maxLength={1000}
                required
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                }}
              />
              <p className="mt-1 text-xs text-gray-500">
                {form.description.trim().length}/1,000 characters · at least 20 required
              </p>
            </Field>
          </Section>

          {/* Measurement */}
          <Section title="Product Measurement">
            <div className="form-grid">
              <Field label="Pack or measurement unit *">
                <input
                  value={form.unit}
                  onChange={(e) =>
                    updateField(
                      'unit',
                      e.target.value
                    )
                  }
                  placeholder="kg, piece, pack, bag or litre"
                  maxLength={30}
                  required
                  style={inputStyle}
                />
              </Field>

              <Field label="Weight">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.weight}
                  onChange={(e) =>
                    updateField(
                      'weight',
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </Field>

              <Field
                label="Minimum Order Quantity"
                required
              >
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={
                    form.minimum_order_quantity
                  }
                  onChange={(e) =>
                    updateField(
                      'minimum_order_quantity',
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </Field>

              <Field label="Maximum Order Quantity">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={
                    form.maximum_order_quantity
                  }
                  onChange={(e) =>
                    updateField(
                      'maximum_order_quantity',
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </Field>
            </div>
          </Section>

          {/* Pricing */}
          <Section title="Pricing">
            <div className="form-grid">
              <Field
                label="MRP"
                required
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.mrp}
                  onChange={(e) =>
                    updateField(
                      'mrp',
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </Field>

              <Field
                label="Selling Price"
                required
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.selling_price}
                  onChange={(e) =>
                    updateField(
                      'selling_price',
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </Field>

              <Field label="Tax Percentage">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.tax_percent}
                  onChange={(e) =>
                    updateField(
                      'tax_percent',
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </Field>
            </div>

            {Number(form.mrp) >
              Number(form.selling_price) &&
              Number(form.selling_price) > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    background: '#f0fdf4',
                    color: '#166534',
                    borderRadius: 9,
                    padding: 12,
                  }}
                >
                  Customer saving:{' '}
                  <strong>
                    ₹
                    {(
                      Number(form.mrp) -
                      Number(
                        form.selling_price
                      )
                    ).toLocaleString('en-IN', {
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </div>
              )}
          </Section>

          {/* Delivery and status */}
          <Section title="Delivery & Status">
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 20,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={form.delivery_available}
                onChange={(e) =>
                  updateField(
                    'delivery_available',
                    e.target.checked
                  )
                }
                style={{
                  width: 18,
                  height: 18,
                }}
              />

              <span
                style={{
                  fontWeight: 600,
                }}
              >
                Delivery available
              </span>
            </label>

            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 10,
                background: '#f8faf8',
                color: '#4b5563',
                fontSize: 14,
              }}
            >
              <strong>Listing status:</strong> {product.status}
              <p style={{ marginTop: 6 }}>
                {product.status === 'ACTIVE'
                  ? 'Changes to a live product return it to pending review, and customers will not see the updated listing until an administrator approves it.'
                  : product.status === 'PENDING'
                    ? 'This product stays hidden from customers while it awaits administrator review.'
                    : 'Listing status is controlled by the marketplace administrator.'}
              </p>
            </div>
          </Section>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              marginTop: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/bodhimart/seller/products"
                style={cancelButton}
              >
                ← My Products
              </Link>


            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                border: 0,
                background: saving
                  ? '#9ca3af'
                  : '#145c2b',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: 10,
                fontWeight: 700,
                cursor: saving
                  ? 'not-allowed'
                  : 'pointer',
              }}
            >
              {saving
                ? 'Saving...'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .form-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        @media (max-width: 700px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        padding: 24,
        marginBottom: 20,
      }}
    >
      <h2
        style={{
          margin: '0 0 20px',
          fontSize: 19,
          color: '#145c2b',
        }}
      >
        {title}
      </h2>

      {children}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: 'block',
          marginBottom: 7,
          fontSize: 13,
          fontWeight: 700,
          color: '#374151',
        }}
      >
        {label}

        {required && (
          <span
            style={{
              color: '#dc2626',
              marginLeft: 3,
            }}
          >
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: '#6b7280',
          marginBottom: 5,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: 700,
          color: '#111827',
        }}
      >
        {value}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #d1d5db',
  borderRadius: 9,
  padding: '11px 12px',
  fontSize: 14,
  background: '#fff',
};

const headerButton: React.CSSProperties = {
  background: 'rgba(255,255,255,0.14)',
  color: '#fff',
  padding: '10px 16px',
  borderRadius: 10,
  textDecoration: 'none',
  fontWeight: 600,
};

const cancelButton: React.CSSProperties = {
  display: 'inline-block',
  border: '1px solid #d1d5db',
  background: '#fff',
  color: '#374151',
  padding: '11px 18px',
  borderRadius: 10,
  textDecoration: 'none',
  fontWeight: 600,
};


