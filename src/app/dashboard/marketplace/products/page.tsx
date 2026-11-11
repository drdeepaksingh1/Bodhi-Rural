
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import LogoutButton from '../../../components/LogoutButton';

const ALLOWED_ROLES = [
  'SUPER_ADMIN',
];

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
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

type Seller = {
  id: string;
  seller_id: string;
  shop_name: string;
};

async function getAuthorizedAdmin() {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role_id, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.is_active !== true) {
    redirect('/dashboard');
  }

  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('code, name')
    .eq('id', profile.role_id)
    .single();

  if (
    roleError ||
    !role ||
    !ALLOWED_ROLES.includes(role.code)
  ) {
    redirect('/dashboard');
  }

  return { supabase, user, profile, role };
}

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return '—';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDate(value: string | null) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusStyle(status: string) {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'APPROVED':
      return 'bg-blue-100 text-blue-800';
    case 'PENDING':
    case 'SUBMITTED':
      return 'bg-orange-100 text-orange-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'INACTIVE':
    case 'SUSPENDED':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-purple-100 text-purple-800';
  }
}

export default async function ProductManagementPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    status?: string;
    seller?: string;
  };
}) {
  const { supabase, user, profile, role } =
    await getAuthorizedAdmin();

  const search = (searchParams?.q || '').trim().slice(0, 80);
  const selectedStatus = (searchParams?.status || 'ALL').toUpperCase();
  const selectedSeller = searchParams?.seller || 'ALL';

  const validStatuses = [
    'ALL',
    'ACTIVE',
    'PENDING',
    'SUBMITTED',
    'APPROVED',
    'INACTIVE',
    'REJECTED',
    'SUSPENDED',
  ];

  const filterStatus = validStatuses.includes(selectedStatus)
    ? selectedStatus
    : 'ALL';

  // Load seller directory for displaying seller names.
  const { data: sellerData, error: sellerError } = await supabase
    .from('marketplace_sellers')
    .select('id, seller_id, shop_name')
    .order('shop_name', { ascending: true });

  const sellers = (sellerData || []) as Seller[];

  // Load all product statuses for SUPER_ADMIN.
  let query = supabase
    .from('marketplace_products')
    .select('*')
    .order('created_at', { ascending: false });

  if (filterStatus !== 'ALL') {
    query = query.eq('status', filterStatus);
  }

  if (selectedSeller !== 'ALL') {
    query = query.eq('seller_id', selectedSeller);
  }

  if (search) {
    const safeSearch = search.replace(/[,%()]/g, ' ');
    query = query.or(
      `name.ilike.%${safeSearch}%,product_id.ilike.%${safeSearch}%,sku.ilike.%${safeSearch}%`
    );
  }

  const { data: productData, error: productError } = await query;

  const products = (productData || []) as Product[];

  const sellerMap = new Map(
    sellers.map((seller) => [
      seller.id,
      seller,
    ])
  );

  const statusCounts = {
    all: products.length,
    active: products.filter(
      (p) => p.status.toUpperCase() === 'ACTIVE'
    ).length,
    pending: products.filter(
      (p) =>
        ['PENDING', 'SUBMITTED'].includes(p.status.toUpperCase())
    ).length,
    rejected: products.filter(
      (p) => p.status.toUpperCase() === 'REJECTED'
    ).length,
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* HEADER */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
              BodhiMart Administration
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Product Management
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              View and monitor all marketplace product listings.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/marketplace"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Marketplace
            </Link>

            <Link
              href="/dashboard"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Main Dashboard
            </Link>

            <LogoutButton />
          </div>
        </header>

        {/* ADMIN INFORMATION */}
        <section className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-900">
            <strong>Administrator:</strong>{' '}
            {profile.full_name || user.email}
          </p>

          <p className="mt-1 text-sm text-green-800">
            <strong>Role:</strong> {role.name} ({role.code})
          </p>
        </section>

        {/* SUMMARY */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Products displayed"
            value={statusCounts.all}
          />

          <SummaryCard
            title="Active products displayed"
            value={statusCounts.active}
          />

          <SummaryCard
            title="Pending products displayed"
            value={statusCounts.pending}
          />

          <SummaryCard
            title="Rejected products displayed"
            value={statusCounts.rejected}
          />
        </section>

        {/* SEARCH AND SELLER FILTER */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">
            Search Products
          </h2>

          <form
            method="GET"
            className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3"
          >
            <input
              type="search"
              name="q"
              defaultValue={search}
              maxLength={80}
              placeholder="Search product name, SKU or product ID"
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-600"
            />

            <select
              name="seller"
              defaultValue={selectedSeller}
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900"
            >
              <option value="ALL">All Sellers</option>

              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.seller_id} - {seller.shop_name}
                </option>
              ))}
            </select>

            {filterStatus !== 'ALL' && (
              <input
                type="hidden"
                name="status"
                value={filterStatus}
              />
            )}

            <div className="flex flex-wrap gap-2 md:col-span-3">
              <button
                type="submit"
                className="rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800"
              >
                Search
              </button>

              <Link
                href="/dashboard/marketplace/products"
                className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Reset
              </Link>
            </div>
          </form>
        </section>

        {/* STATUS FILTERS */}
        <nav className="mb-5 flex flex-wrap gap-2">
          {validStatuses.map((status) => {
            const params = new URLSearchParams();

            if (search) params.set('q', search);
            if (selectedSeller !== 'ALL') {
              params.set('seller', selectedSeller);
            }
            if (status !== 'ALL') {
              params.set('status', status);
            }

            const href = params.toString()
              ? `/dashboard/marketplace/products?${params.toString()}`
              : '/dashboard/marketplace/products';

            return (
              <Link
                key={status}
                href={href}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  filterStatus === status
                    ? 'bg-green-700 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status === 'ALL' ? 'All Products' : status}
              </Link>
            );
          })}
        </nav>

        {/* DATABASE ERRORS */}
        {productError && (
          <section className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            <strong>Product loading error:</strong>{' '}
            {productError.message}
          </section>
        )}

        {sellerError && (
          <section className="mb-6 rounded-lg border border-orange-300 bg-orange-50 p-4 text-sm text-orange-800">
            <strong>Seller information warning:</strong>{' '}
            {sellerError.message}
          </section>
        )}

        {/* PRODUCT DIRECTORY */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Marketplace Product Directory
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Read-only administrative view
              </p>
            </div>

            <span className="text-sm text-gray-500">
              {products.length} records displayed
            </span>
          </div>

          {productError ? null : products.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                No products found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                No products match the selected search or filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {products.map((product) => {
                const seller = sellerMap.get(product.seller_id);

                return (
                  <article
                    key={product.id}
                    className="p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Product ID
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-green-800">
                          {product.product_id}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          SKU: {product.sku || 'Not assigned'}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyle(product.status)}`}
                      >
                        {product.status}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <InfoItem
                        label="Product Name"
                        value={product.name}
                      />

                      <InfoItem
                        label="Brand"
                        value={product.brand}
                      />

                      <InfoItem
                        label="Category ID"
                        value={product.category_id}
                      />

                      <InfoItem
                        label="Seller ID"
                        value={seller?.seller_id || product.seller_id}
                      />

                      <InfoItem
                        label="Seller Business"
                        value={seller?.shop_name || 'Seller information unavailable'}
                      />

                      <InfoItem
                        label="Unit"
                        value={product.unit}
                      />

                      <InfoItem
                        label="Weight"
                        value={
                          product.weight !== null
                            ? String(product.weight)
                            : null
                        }
                      />

                      <InfoItem
                        label="MRP"
                        value={formatCurrency(product.mrp)}
                      />

                      <InfoItem
                        label="Selling Price"
                        value={formatCurrency(product.selling_price)}
                      />

                      <InfoItem
                        label="GST"
                        value={`${product.tax_percent}%`}
                      />

                      <InfoItem
                        label="Minimum Order Quantity"
                        value={String(product.minimum_order_quantity)}
                      />

                      <InfoItem
                        label="Maximum Order Quantity"
                        value={
                          product.maximum_order_quantity !== null
                            ? String(product.maximum_order_quantity)
                            : 'No maximum specified'
                        }
                      />

                      <InfoItem
                        label="Delivery Available"
                        value={
                          product.delivery_available ? 'Yes' : 'No'
                        }
                      />

                      <InfoItem
                        label="Created Date"
                        value={formatDate(product.created_at)}
                      />

                      <InfoItem
                        label="Last Updated"
                        value={formatDate(product.updated_at)}
                      />

                      <InfoItem
                        label="Approval Date"
                        value={formatDate(product.approved_at)}
                      />

                      <InfoItem
                        label="Approved By (User ID)"
                        value={product.approved_by}
                      />
                    </div>

                    {product.description && (
                      <div className="mt-5 rounded-lg bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Description
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                          {product.description}
                        </p>
                      </div>
                    )}

                    <p className="mt-5 border-t border-gray-100 pt-3 text-xs text-gray-500">
                      Product record is displayed in read-only mode.
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* SECURITY NOTICE */}
        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">
            Product Data Security
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            This module is restricted to SUPER_ADMIN. Product records
            are retrieved using the authenticated Supabase client.
            Existing seller policies, product ownership, inventory
            and checkout operations remain unchanged. No product
            records are modified by this page.
          </p>
        </section>

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
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-gray-900">
        {value || '—'}
      </p>
    </div>
  );
}

