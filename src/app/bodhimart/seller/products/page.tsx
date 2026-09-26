'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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
  created_at: string;
  updated_at: string;
};

type Category = {
  id: string;
  name: string;
};

type Seller = {
  id: string;
  seller_id: string;
  shop_name: string;
  owner_name: string;
  status: string;
};

export default function SellerProductsPage() {
  const supabase = createClient();

  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  async function loadProducts() {
    setLoading(true);
    setMessage('');

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href =
          '/login?redirect=/bodhimart/seller/products';
        return;
      }

      const { data: sellerData, error: sellerError } = await supabase
        .from('marketplace_sellers')
        .select(
          'id, seller_id, shop_name, owner_name, status'
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (sellerError) {
        throw sellerError;
      }

      if (!sellerData) {
        setMessage(
          'Seller profile not found. Please contact BodhiMart administration.'
        );
        return;
      }

      setSeller(sellerData);

      if (sellerData.status !== 'ACTIVE') {
        setMessage(
          `Your seller account is currently ${sellerData.status}.`
        );
        return;
      }

      const [productsResult, categoriesResult] = await Promise.all([
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
              category_id,
              created_at,
              updated_at
            `
          )
          .eq('seller_id', sellerData.id)
          .order('created_at', { ascending: false }),

        supabase
          .from('marketplace_categories')
          .select('id, name')
          .order('name', { ascending: true }),
      ]);

      if (productsResult.error) {
        throw productsResult.error;
      }

      if (categoriesResult.error) {
        throw categoriesResult.error;
      }

      setProducts((productsResult.data || []) as Product[]);
      setCategories((categoriesResult.data || []) as Category[]);
    } catch (error: any) {
      console.error(error);
      setMessage(
        error?.message ||
          'Unable to load your products. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};

    categories.forEach((category) => {
      map[category.id] = category.name;
    });

    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !keyword ||
        product.name.toLowerCase().includes(keyword) ||
        product.product_id.toLowerCase().includes(keyword) ||
        (product.sku || '').toLowerCase().includes(keyword) ||
        (product.brand || '').toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === 'ALL' ||
        product.status === statusFilter;

      const matchesCategory =
        categoryFilter === 'ALL' ||
        product.category_id === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    products,
    search,
    statusFilter,
    categoryFilter,
  ]);

  const activeCount = products.filter(
    (p) => p.status === 'ACTIVE'
  ).length;

  const inactiveCount = products.filter(
    (p) => p.status !== 'ACTIVE'
  ).length;

  const deliveryCount = products.filter(
    (p) => p.delivery_available
  ).length;

  function formatMoney(value: number | null | undefined) {
    return `₹${Number(value || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;
  }

  function getCategoryName(categoryId: string | null) {
    if (!categoryId) return 'Uncategorized';
    return categoryMap[categoryId] || 'Uncategorized';
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
          maxWidth: 1200,
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
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
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
                  fontWeight: 800,
                }}
              >
                My Products
              </h1>

              {seller && (
                <p
                  style={{
                    margin: '8px 0 0',
                    opacity: 0.9,
                  }}
                >
                  {seller.shop_name} • {seller.seller_id}
                </p>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/bodhimart/seller/dashboard"
                style={{
                  background: 'rgba(255,255,255,0.14)',
                  color: '#fff',
                  padding: '10px 16px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Dashboard
              </Link>

              <Link
                href="/bodhimart/seller/products/add"
                style={{
                  background: '#fff',
                  color: '#145c2b',
                  padding: '10px 16px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                + Add Product
              </Link>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              color: '#9a3412',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}
          >
            {message}
          </div>
        )}

        {/* Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(190px,1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <SummaryCard
            title="Total Products"
            value={products.length}
          />

          <SummaryCard
            title="Active"
            value={activeCount}
          />

          <SummaryCard
            title="Inactive"
            value={inactiveCount}
          />

          <SummaryCard
            title="Delivery Enabled"
            value={deliveryCount}
          />
        </div>

        {/* Filters */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            border: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'minmax(220px,1fr) 180px 220px',
              gap: 12,
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, ID, SKU or brand..."
              style={inputStyle}
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              style={inputStyle}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DRAFT">Draft</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value)
              }
              style={inputStyle}
            >
              <option value="ALL">All Categories</option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products */}
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '18px 20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                }}
              >
                Product Catalogue
              </h2>

              <p
                style={{
                  margin: '4px 0 0',
                  color: '#6b7280',
                  fontSize: 14,
                }}
              >
                {filteredProducts.length} product
                {filteredProducts.length !== 1
                  ? 's'
                  : ''}{' '}
                displayed
              </p>
            </div>

            <button
              onClick={loadProducts}
              style={{
                border: '1px solid #d1d5db',
                background: '#fff',
                padding: '9px 14px',
                borderRadius: 9,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div
              style={{
                padding: 50,
                textAlign: 'center',
                color: '#6b7280',
              }}
            >
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              style={{
                padding: 60,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 42,
                  marginBottom: 12,
                }}
              >
                📦
              </div>

              <h3 style={{ margin: '0 0 8px' }}>
                No products found
              </h3>

              <p
                style={{
                  color: '#6b7280',
                  marginBottom: 20,
                }}
              >
                {products.length === 0
                  ? 'You have not added any products yet.'
                  : 'Try changing your search or filters.'}
              </p>

              {products.length === 0 && (
                <Link
                  href="/bodhimart/seller/products/add"
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
                  + Add Your First Product
                </Link>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: 1050,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: '#f8faf8',
                      textAlign: 'left',
                    }}
                  >
                    <th style={thStyle}>Product</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>SKU</th>
                    <th style={thStyle}>MRP</th>
                    <th style={thStyle}>Selling Price</th>
                    <th style={thStyle}>Tax</th>
                    <th style={thStyle}>Delivery</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td style={tdStyle}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: '#111827',
                          }}
                        >
                          {product.name}
                        </div>

                        <div
                          style={{
                            color: '#6b7280',
                            fontSize: 12,
                            marginTop: 3,
                          }}
                        >
                          {product.product_id}
                        </div>

                        {product.brand && (
                          <div
                            style={{
                              color: '#6b7280',
                              fontSize: 12,
                            }}
                          >
                            Brand: {product.brand}
                          </div>
                        )}
                      </td>

                      <td style={tdStyle}>
                        {getCategoryName(
                          product.category_id
                        )}
                      </td>

                      <td style={tdStyle}>
                        {product.sku || '—'}
                      </td>

                      <td style={tdStyle}>
                        {formatMoney(product.mrp)}
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {formatMoney(
                            product.selling_price
                          )}
                        </strong>

                        {product.mrp >
                          product.selling_price && (
                          <div
                            style={{
                              fontSize: 11,
                              color: '#15803d',
                            }}
                          >
                            Save{' '}
                            {formatMoney(
                              product.mrp -
                                product.selling_price
                            )}
                          </div>
                        )}
                      </td>

                      <td style={tdStyle}>
                        {product.tax_percent}%
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            background:
                              product.delivery_available
                                ? '#dcfce7'
                                : '#f3f4f6',
                            color:
                              product.delivery_available
                                ? '#166534'
                                : '#6b7280',
                          }}
                        >
                          {product.delivery_available
                            ? 'Available'
                            : 'Not Available'}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <StatusBadge
                          status={product.status}
                        />
                      </td>

                      <td style={tdStyle}>
                        <Link
                          href={`/bodhimart/seller/products/${product.id}`}
                          style={{
                            display: 'inline-block',
                            padding: '7px 11px',
                            borderRadius: 8,
                            background: '#eef6ef',
                            color: '#145c2b',
                            textDecoration: 'none',
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          View / Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginTop: 20,
          }}
        >
          <Link
            href="/bodhimart/seller/dashboard"
            style={{
              color: '#145c2b',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ← Back to Seller Dashboard
          </Link>

          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/bodhimart/seller/inventory"
              style={bottomLinkStyle}
            >
              Inventory
            </Link>

            <Link
              href="/bodhimart/seller/orders"
              style={bottomLinkStyle}
            >
              Orders
            </Link>

            <Link
              href="/bodhimart/seller/sales"
              style={bottomLinkStyle}
            >
              Sales
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: 20,
        border: '1px solid #e5e7eb',
      }}
    >
      <div
        style={{
          color: '#6b7280',
          fontSize: 13,
          marginBottom: 7,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#145c2b',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const active = status === 'ACTIVE';

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '5px 9px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        background: active ? '#dcfce7' : '#f3f4f6',
        color: active ? '#166534' : '#6b7280',
      }}
    >
      {status}
    </span>
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

const thStyle: React.CSSProperties = {
  padding: '13px 14px',
  fontSize: 12,
  color: '#4b5563',
  borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '14px',
  borderBottom: '1px solid #f0f2f0',
  fontSize: 13,
  verticalAlign: 'middle',
};

const bottomLinkStyle: React.CSSProperties = {
  color: '#145c2b',
  textDecoration: 'none',
  fontWeight: 600,
};
