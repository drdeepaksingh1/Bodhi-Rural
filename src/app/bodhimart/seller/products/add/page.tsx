'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '../../../../../../lib/supabase/client';

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

export default function AddProductPage() {
  const supabase = createClient();

  const [seller, setSeller] = useState<Seller | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
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
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href =
          '/login?redirect=/bodhimart/seller/products/add';
        return;
      }

      const [sellerResult, categoryResult] =
        await Promise.all([
          supabase
            .from('marketplace_sellers')
            .select(
              'id, seller_id, shop_name, status'
            )
            .eq('user_id', user.id)
            .maybeSingle(),

          supabase
            .from('marketplace_categories')
            .select('id, name')
            .order('name', { ascending: true }),
        ]);

      if (sellerResult.error) {
        throw sellerResult.error;
      }

      if (categoryResult.error) {
        throw categoryResult.error;
      }

      if (!sellerResult.data) {
        setError(
          'Seller profile not found. Please contact BodhiMart administration.'
        );
        return;
      }

      if (sellerResult.data.status !== 'ACTIVE') {
        setError(
          `Your seller account is currently ${sellerResult.data.status}.`
        );
        return;
      }

      setSeller(sellerResult.data);
      setCategories(categoryResult.data || []);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          'Unable to load the product form.'
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
    const sellingPrice = Number(form.selling_price);
    const tax = Number(form.tax_percent);
    const minimumQty = Number(
      form.minimum_order_quantity
    );

    if (!form.mrp || Number.isNaN(mrp) || mrp <= 0) {
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

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setMessage('');
    setError('');

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!seller) {
      setError('Seller profile is not available.');
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          'Your session has expired. Please login again.'
        );
      }

      const slug =
        form.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') +
        '-' +
        Date.now();

      const { data, error: insertError } =
        await supabase
          .from('marketplace_products')
          .insert({
            sku: form.sku.trim() || null,
            seller_id: seller.id,
            category_id: form.category_id,
            name: form.name.trim(),
            slug,
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
            status: 'ACTIVE',
            created_by: user.id,
          })
          .select(
            'id, product_id, name'
          )
          .single();

      if (insertError) {
        throw insertError;
      }

      setMessage(
        `Product created successfully. Product ID: ${data.product_id}`
      );

      setForm({
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
      });
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          'Unable to create the product.'
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
        Loading product form...
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
                Add Product
              </h1>

              {seller && (
                <p
                  style={{
                    margin: '8px 0 0',
                    opacity: 0.9,
                  }}
                >
                  {seller.shop_name} •{' '}
                  {seller.seller_id}
                </p>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
              }}
            >
              <Link
                href="/bodhimart/seller/products"
                style={{
                  background:
                    'rgba(255,255,255,0.14)',
                  color: '#fff',
                  padding: '10px 16px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                My Products
              </Link>

              <Link
                href="/bodhimart/seller/dashboard"
                style={{
                  background: '#fff',
                  color: '#145c2b',
                  padding: '10px 16px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Messages */}
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

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
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
                  placeholder="Example: Layer Poultry Feed"
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
                  placeholder="Example: LAYER-FEED-001"
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
                  placeholder="Example: Bodhi"
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
                placeholder="Describe the product, quality, usage and other important information."
                rows={5}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                }}
              />
            </Field>
          </Section>

          {/* Quantity */}
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
                  placeholder="Example: 50"
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
                  placeholder="Optional"
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
                  placeholder="₹ 0.00"
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
                  placeholder="₹ 0.00"
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
                  placeholder="0"
                  style={inputStyle}
                />
              </Field>
            </div>

            {form.mrp &&
              form.selling_price &&
              Number(form.mrp) >
                Number(form.selling_price) && (
                <div
                  style={{
                    marginTop: 12,
                    background: '#f0fdf4',
                    color: '#166534',
                    borderRadius: 9,
                    padding: 12,
                    fontSize: 14,
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

          {/* Delivery */}
          <Section title="Delivery">
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
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
                Delivery available for this
                product
              </span>
            </label>

            <p
              style={{
                color: '#6b7280',
                fontSize: 13,
                marginTop: 8,
              }}
            >
              Delivery availability can be
              controlled for each product.
            </p>
          </Section>

          {/* Product Status */}
          <Section title="Product Status">
            <div
              style={{
                background: '#f8faf8',
                borderRadius: 10,
                padding: 14,
                color: '#4b5563',
                fontSize: 14,
              }}
            >
              New products are created as{' '}
              <strong>ACTIVE</strong> and can
              appear in the seller catalogue.
            </div>
          </Section>

          {/* Submit */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              marginTop: 24,
            }}
          >
            <Link
              href="/bodhimart/seller/products"
              style={{
                border: '1px solid #d1d5db',
                background: '#fff',
                color: '#374151',
                padding: '12px 20px',
                borderRadius: 10,
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Cancel
            </Link>

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
                ? 'Saving Product...'
                : 'Create Product'}
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #d1d5db',
  borderRadius: 9,
  padding: '11px 12px',
  fontSize: 14,
  background: '#fff',
  outline: 'none',
};
