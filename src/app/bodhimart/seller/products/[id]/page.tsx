'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/client';

type Product = {
  id: string;
  product_id: string;
  sku: string | null;
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
  const supabase = createClient();
  const params = useParams();

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

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category_id: '',
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
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  async function loadProduct() {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href =
          `/login?redirect=/bodhimart/seller/products/${productId}`;
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
      setCategories(
        (categoriesResult.data || []) as Category[]
      );

      setForm({
        name: p.name || '',
        sku: p.sku || '',
        category_id: p.category_id || '',
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
        status: p.status || 'ACTIVE',
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
  }

  function updateField(
    field: keyof typeof form,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateForm() {
    if (!form.name.trim()) {
      return 'Product name is required.';
    }

    if (!form.category_id) {
      return 'Please select a category.';
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

    try {
      const { error: updateError } =
        await supabase
          .from('marketplace_products')
          .update({
            sku: form.sku.trim() || null,
            category_id: form.category_id,
            name: form.name.trim(),
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
            status: form.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id)
          .eq('seller_id', seller.id);

      if (updateError) {
        throw updateError;
      }

      setMessage(
        'Product updated successfully.'
      );

      await loadProduct();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          'Unable to update the product.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    if (!seller || !product) return;

    const newStatus =
      product.status === 'ACTIVE'
        ? 'INACTIVE'
        : 'ACTIVE';

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { error: updateError } =
        await supabase
          .from('marketplace_products')
          .update({
            status: newStatus,
            updated_at:
              new Date().toISOString(),
          })
          .eq('id', product.id)
          .eq('seller_id', seller.id);

      if (updateError) {
        throw updateError;
      }

      setMessage(
        `Product ${
          newStatus === 'ACTIVE'
            ? 'activated'
            : 'deactivated'
        } successfully.`
      );

      await loadProduct();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          'Unable to change product status.'
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

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) =>
                  updateField(
                    'description',
                    e.target.value
                  )
                }
                rows={5}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                }}
              />
            </Field>
          </Section>

          {/* Measurement */}
          <Section title="Product Measurement">
            <div className="form-grid">
              <Field label="Unit">
                <input
                  value={form.unit}
                  onChange={(e) =>
                    updateField(
                      'unit',
                      e.target.value
                    )
                  }
                  placeholder="kg / piece / pack / litre"
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

            <Field label="Product Status">
              <select
                value={form.status}
                onChange={(e) =>
                  updateField(
                    'status',
                    e.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="ACTIVE">
                  ACTIVE
                </option>

                <option value="INACTIVE">
                  INACTIVE
                </option>

                <option value="DRAFT">
                  DRAFT
                </option>
              </select>
            </Field>
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

              <button
                type="button"
                onClick={toggleStatus}
                disabled={saving}
                style={{
                  ...statusButton,
                  background:
                    product.status === 'ACTIVE'
                      ? '#fff7ed'
                      : '#ecfdf5',
                  color:
                    product.status === 'ACTIVE'
                      ? '#9a3412'
                      : '#166534',
                }}
              >
                {product.status === 'ACTIVE'
                  ? 'Deactivate Product'
                  : 'Activate Product'}
              </button>
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

const statusButton: React.CSSProperties = {
  border: '1px solid #fed7aa',
  padding: '11px 18px',
  borderRadius: 10,
  fontWeight: 700,
  cursor: 'pointer',
};
