
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import LogoutButton from '../../../components/LogoutButton';

const ALLOWED_ROLES = ['SUPER_ADMIN'];

type Inventory = {
  id: string;
  product_id: string;
  stock_quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  updated_at: string;
};

type Product = {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  seller_id: string;
  mrp: number;
  selling_price: number;
  status: string;
};

type Seller = {
  id: string;
  seller_id: string;
  shop_name: string;
};

type Movement = {
  id: string;
  marketplace_product_id: string;
  seller_id: string;
  movement_type: string;
  previous_quantity: number;
  change_quantity: number;
  new_quantity: number;
  order_id: string | null;
  reason: string | null;
  remarks: string | null;
  performed_by: string | null;
  created_at: string;
};

type Adjustment = {
  id: string;
  adjustment_number: string;
  adjustment_type: string;
  seller_id: string | null;
  marketplace_product_id: string | null;
  previous_quantity: number;
  adjusted_quantity: number;
  adjustment_difference: number | null;
  adjustment_reason: string;
  remarks: string | null;
  status: string;
  requested_by: string | null;
  approved_by: string | null;
  created_at: string;
  posted_at: string;
};

async function getAuthorizedAdmin() {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect('/login');

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

function number(value: number | null | undefined) {
  return Number(value || 0);
}

function formatDate(value: string | null) {
  if (!value) return '—';

  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

function statusStyle(status: string) {
  const value = status.toUpperCase();

  if (value === 'ACTIVE' || value === 'POSTED') {
    return 'bg-green-100 text-green-800';
  }

  if (
    value === 'PENDING' ||
    value === 'SUBMITTED'
  ) {
    return 'bg-orange-100 text-orange-800';
  }

  if (value === 'REJECTED' || value === 'CANCELLED') {
    return 'bg-red-100 text-red-800';
  }

  return 'bg-gray-100 text-gray-700';
}

export default async function InventoryManagementPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    seller?: string;
    stock?: string;
  };
}) {
  const { supabase, user, profile, role } =
    await getAuthorizedAdmin();

  const search = (searchParams?.q || '').trim().slice(0, 80);
  const selectedSeller = searchParams?.seller || 'ALL';
  const selectedStock = (
    searchParams?.stock || 'ALL'
  ).toUpperCase();

  const validStockFilters = [
    'ALL',
    'LOW',
    'OUT',
    'AVAILABLE',
  ];

  const stockFilter = validStockFilters.includes(selectedStock)
    ? selectedStock
    : 'ALL';

  // INVENTORY
  const { data: inventoryData, error: inventoryError } =
    await supabase
      .from('marketplace_inventory')
      .select(
        'id, product_id, stock_quantity, reserved_quantity, low_stock_threshold, updated_at'
      )
      .order('updated_at', { ascending: false });

  // PRODUCTS
  const { data: productData, error: productError } =
    await supabase
      .from('marketplace_products')
      .select(
        'id, product_id, name, sku, seller_id, mrp, selling_price, status'
      )
      .order('name', { ascending: true });

  // SELLERS
  const { data: sellerData, error: sellerError } =
    await supabase
      .from('marketplace_sellers')
      .select('id, seller_id, shop_name')
      .order('shop_name', { ascending: true });

  // MOVEMENTS - Existing admin read policy
  const { data: movementData, error: movementError } =
    await supabase
      .from('bodhi_marketplace_stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

  // ADJUSTMENT AUDIT - Existing admin read policy
  const { data: adjustmentData, error: adjustmentError } =
    await supabase
      .from('bodhi_stock_adjustment_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

  const inventory = (inventoryData || []) as Inventory[];
  const products = (productData || []) as Product[];
  const sellers = (sellerData || []) as Seller[];
  const movements = (movementData || []) as Movement[];
  const adjustments = (adjustmentData || []) as Adjustment[];

  const productMap = new Map(
    products.map((product) => [product.id, product])
  );

  const sellerMap = new Map(
    sellers.map((seller) => [seller.id, seller])
  );

  const inventoryRows = inventory
    .map((item) => {
      const product = productMap.get(item.product_id);
      const seller = product
        ? sellerMap.get(product.seller_id)
        : undefined;

      const physical = number(item.stock_quantity);
      const reserved = number(item.reserved_quantity);
      const available = physical - reserved;
      const threshold = number(item.low_stock_threshold);

      return {
        ...item,
        product,
        seller,
        physical,
        reserved,
        available,
        threshold,
        isOut: available <= 0,
        isLow: available > 0 && available <= threshold,
      };
    })
    .filter((item) => {
      if (selectedSeller !== 'ALL' &&
          item.product?.seller_id !== selectedSeller) {
        return false;
      }

      if (stockFilter === 'OUT' && !item.isOut) return false;
      if (stockFilter === 'LOW' && !item.isLow) return false;
      if (stockFilter === 'AVAILABLE' && item.available <= 0) {
        return false;
      }

      if (search) {
        const term = search.toLowerCase();

        const searchable = [
          item.product?.name,
          item.product?.product_id,
          item.product?.sku,
          item.seller?.seller_id,
          item.seller?.shop_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchable.includes(term)) return false;
      }

      return true;
    });

  const totalPhysical = inventoryRows.reduce(
    (sum, item) => sum + item.physical,
    0
  );

  const totalReserved = inventoryRows.reduce(
    (sum, item) => sum + item.reserved,
    0
  );

  const totalAvailable = inventoryRows.reduce(
    (sum, item) => sum + item.available,
    0
  );

  const lowStockCount = inventoryRows.filter(
    (item) => item.isLow
  ).length;

  const outOfStockCount = inventoryRows.filter(
    (item) => item.isOut
  ).length;

  const hasLoadError =
    inventoryError ||
    productError ||
    sellerError ||
    movementError ||
    adjustmentError;

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
              Inventory Management
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Monitor stock, reservations, movements and adjustments.
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

        {/* ADMIN */}
        <section className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-900">
            <strong>Administrator:</strong>{' '}
            {profile.full_name || user.email}
          </p>

          <p className="mt-1 text-sm text-green-800">
            <strong>Role:</strong> {role.name} ({role.code})
          </p>
        </section>

        {/* ERROR SUMMARY */}
        {hasLoadError && (
          <section className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            <strong>One or more inventory data sources could not load.</strong>

            {inventoryError && (
              <p className="mt-2">
                Inventory: {inventoryError.message}
              </p>
            )}

            {productError && (
              <p className="mt-2">
                Products: {productError.message}
              </p>
            )}

            {sellerError && (
              <p className="mt-2">
                Sellers: {sellerError.message}
              </p>
            )}

            {movementError && (
              <p className="mt-2">
                Stock movements: {movementError.message}
              </p>
            )}

            {adjustmentError && (
              <p className="mt-2">
                Adjustment audit: {adjustmentError.message}
              </p>
            )}
          </section>
        )}

        {/* SUMMARY CARDS */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard
            title="Inventory Records"
            value={inventoryRows.length}
          />

          <SummaryCard
            title="Physical Stock"
            value={formatQuantity(totalPhysical)}
          />

          <SummaryCard
            title="Reserved Stock"
            value={formatQuantity(totalReserved)}
          />

          <SummaryCard
            title="Available Stock"
            value={formatQuantity(totalAvailable)}
          />

          <SummaryCard
            title="Low / Out of Stock"
            value={`${lowStockCount} / ${outOfStockCount}`}
          />
        </section>

        {/* SEARCH AND SELLER FILTER */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">
            Search Inventory
          </h2>

          <form method="GET" className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="search"
              name="q"
              defaultValue={search}
              maxLength={80}
              placeholder="Search product, SKU or seller"
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900"
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

            {stockFilter !== 'ALL' && (
              <input
                type="hidden"
                name="stock"
                value={stockFilter}
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
                href="/dashboard/marketplace/inventory"
                className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700"
              >
                Reset
              </Link>
            </div>
          </form>
        </section>

        {/* STOCK FILTERS */}
        <nav className="mb-5 flex flex-wrap gap-2">
          {validStockFilters.map((filter) => {
            const params = new URLSearchParams();

            if (search) params.set('q', search);
            if (selectedSeller !== 'ALL') {
              params.set('seller', selectedSeller);
            }
            if (filter !== 'ALL') params.set('stock', filter);

            const href = params.toString()
              ? `/dashboard/marketplace/inventory?${params.toString()}`
              : '/dashboard/marketplace/inventory';

            return (
              <Link
                key={filter}
                href={href}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  stockFilter === filter
                    ? 'bg-green-700 text-white'
                    : 'border border-gray-300 bg-white text-gray-700'
                }`}
              >
                {filter === 'ALL' ? 'All Stock' : filter}
              </Link>
            );
          })}
        </nav>

        {/* INVENTORY DIRECTORY */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Inventory Directory
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Read-only administrative view
              </p>
            </div>

            <span className="text-sm text-gray-500">
              {inventoryRows.length} records displayed
            </span>
          </div>

          {inventoryRows.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                No inventory records found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                No records match the selected filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {inventoryRows.map((item) => (
                <article key={item.id} className="p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Product ID
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-green-800">
                        {item.product?.product_id || item.product_id}
                      </h3>

                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {item.product?.name || 'Product not found'}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        SKU: {item.product?.sku || 'Not assigned'}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${
                        item.isOut
                          ? 'bg-red-100 text-red-800'
                          : item.isLow
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {item.isOut
                        ? 'OUT OF STOCK'
                        : item.isLow
                          ? 'LOW STOCK'
                          : 'AVAILABLE'}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoItem
                      label="Seller ID"
                      value={item.seller?.seller_id || '—'}
                    />

                    <InfoItem
                      label="Seller Business"
                      value={item.seller?.shop_name || '—'}
                    />

                    <InfoItem
                      label="Product Status"
                      value={item.product?.status || '—'}
                    />

                    <InfoItem
                      label="Physical Stock"
                      value={formatQuantity(item.physical)}
                    />

                    <InfoItem
                      label="Reserved Stock"
                      value={formatQuantity(item.reserved)}
                    />

                    <InfoItem
                      label="Available Stock"
                      value={formatQuantity(item.available)}
                    />

                    <InfoItem
                      label="Low Stock Threshold"
                      value={formatQuantity(item.threshold)}
                    />

                    <InfoItem
                      label="MRP"
                      value={
                        item.product
                          ? formatCurrency(number(item.product.mrp))
                          : '—'
                      }
                    />

                    <InfoItem
                      label="Selling Price"
                      value={
                        item.product
                          ? formatCurrency(number(item.product.selling_price))
                          : '—'
                      }
                    />

                    <InfoItem
                      label="Last Updated"
                      value={formatDate(item.updated_at)}
                    />
                  </div>

                  <p className="mt-5 border-t border-gray-100 pt-3 text-xs text-gray-500">
                    Inventory record is displayed in read-only mode.
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* STOCK MOVEMENTS */}
        <section className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-bold text-gray-900">
              Recent Stock Movements
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Latest 50 records
            </p>
          </div>

          {movements.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              No stock movement records found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <TableHead>Movement Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>New Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {movements.map((movement) => (
                    <tr key={movement.id}>
                      <TableCell>{formatDate(movement.created_at)}</TableCell>
                      <TableCell>
                        {productMap.get(movement.marketplace_product_id)?.product_id
                          || movement.marketplace_product_id}
                      </TableCell>
                      <TableCell>{movement.movement_type}</TableCell>
                      <TableCell>
                        {formatQuantity(number(movement.previous_quantity))}
                      </TableCell>
                      <TableCell>
                        {formatQuantity(number(movement.change_quantity))}
                      </TableCell>
                      <TableCell>
                        {formatQuantity(number(movement.new_quantity))}
                      </TableCell>
                      <TableCell>{movement.reason || '—'}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ADJUSTMENT AUDIT */}
        <section className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-bold text-gray-900">
              Stock Adjustment Audit
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Latest 50 adjustment records
            </p>
          </div>

          {adjustments.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              No stock adjustment records found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <TableHead>Adjustment Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>Adjusted</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {adjustments.map((adjustment) => (
                    <tr key={adjustment.id}>
                      <TableCell>{adjustment.adjustment_number}</TableCell>
                      <TableCell>{adjustment.adjustment_type}</TableCell>
                      <TableCell>
                        {adjustment.marketplace_product_id
                          ? productMap.get(adjustment.marketplace_product_id)?.product_id
                            || adjustment.marketplace_product_id
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {formatQuantity(number(adjustment.previous_quantity))}
                      </TableCell>
                      <TableCell>
                        {formatQuantity(number(adjustment.adjusted_quantity))}
                      </TableCell>
                      <TableCell>
                        {formatQuantity(number(adjustment.adjustment_difference))}
                      </TableCell>
                      <TableCell>{adjustment.adjustment_reason}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusStyle(adjustment.status)}`}>
                          {adjustment.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(adjustment.created_at)}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* SECURITY */}
        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">
            Inventory Security
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            This module is restricted to SUPER_ADMIN and operates
            in read-only mode. Stock adjustments remain controlled
            by the existing authenticated database RPC. Inventory
            quantities, reservations, checkout operations and audit
            records are not modified by this page.
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
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
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

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
}

function TableCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
      {children}
    </td>
  );
}

const validStockFilters = [
  'ALL',
  'LOW',
  'OUT',
  'AVAILABLE',
];

