
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import LogoutButton from '../../../components/LogoutButton';

const ALLOWED_ROLES = ['SUPER_ADMIN'];

type MarketplaceOrder = {
  id: string;
  order_number: string;
  customer_user_id: string;
  delivery_address_id: string | null;
  subtotal: number;
  discount_amount: number;
  delivery_charge: number;
  tax_amount: number;
  total_amount: number;
  payment_status: string;
  order_status: string;
  delivery_method: string | null;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
  delivery_address_snapshot: unknown;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  seller_id: string;
  product_name_snapshot: string;
  sku_snapshot: string | null;
  unit: string | null;
  quantity: number;
  unit_price: number;
  tax_amount: number;
  discount_amount: number;
  line_total: number;
};

type SellerOrder = {
  id: string;
  order_id: string;
  seller_id: string;
  seller_order_number: string;
  subtotal: number;
  commission_amount: number;
  seller_amount: number;
  status: string;
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

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value));
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

function statusStyle(status: string) {
  switch (status.toUpperCase()) {
    case 'DELIVERED':
    case 'COMPLETED':
    case 'PAID':
    case 'ACCEPTED':
      return 'bg-green-100 text-green-800';

    case 'PLACED':
    case 'PENDING':
    case 'PROCESSING':
    case 'READY':
    case 'PACKED':
      return 'bg-orange-100 text-orange-800';

    case 'PICKED_UP':
    case 'SHIPPED':
    case 'IN_TRANSIT':
      return 'bg-blue-100 text-blue-800';

    case 'CANCELLED':
    case 'REJECTED':
    case 'FAILED':
    case 'REFUNDED':
      return 'bg-red-100 text-red-800';

    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-gray-900">
        {value === null || value === undefined || value === ''
          ? '—'
          : String(value)}
      </p>
    </div>
  );
}

export default async function OrderManagementPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    status?: string;
    payment?: string;
    date?: string;
  };
}) {
  const { supabase, user, profile, role } =
    await getAuthorizedAdmin();

  const search = (searchParams?.q || '').trim().slice(0, 80);

  const validOrderStatuses = [
    'ALL',
    'PLACED',
    'PROCESSING',
    'READY',
    'PACKED',
    'PICKED_UP',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
  ];

  const validPaymentStatuses = [
    'ALL',
    'PENDING',
    'PAID',
    'FAILED',
    'REFUNDED',
  ];

  const requestedStatus = (
    searchParams?.status || 'ALL'
  ).toUpperCase();

  const requestedPayment = (
    searchParams?.payment || 'ALL'
  ).toUpperCase();

  const selectedStatus = validOrderStatuses.includes(requestedStatus)
    ? requestedStatus
    : 'ALL';

  const selectedPayment = validPaymentStatuses.includes(requestedPayment)
    ? requestedPayment
    : 'ALL';

  const selectedDate = searchParams?.date || '';

  // Load master customer orders.
  let orderQuery = supabase
    .from('marketplace_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (selectedStatus !== 'ALL') {
    orderQuery = orderQuery.eq('order_status', selectedStatus);
  }

  if (selectedPayment !== 'ALL') {
    orderQuery = orderQuery.eq('payment_status', selectedPayment);
  }

  if (selectedDate) {
    orderQuery = orderQuery
      .gte('created_at', `${selectedDate}T00:00:00`)
      .lt('created_at', `${selectedDate}T23:59:59.999`);
  }

  if (search) {
    const safeSearch = search.replace(/[,%()]/g, ' ');
    orderQuery = orderQuery.or(
      `order_number.ilike.%${safeSearch}%`
    );
  }

  const [
    { data: orderData, error: orderError },
    { data: itemData, error: itemError },
    { data: sellerOrderData, error: sellerOrderError },
    { data: sellerData, error: sellerError },
  ] = await Promise.all([
    orderQuery,
    supabase
      .from('marketplace_order_items')
      .select('*'),
    supabase
      .from('marketplace_seller_orders')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('marketplace_sellers')
      .select('id, seller_id, shop_name'),
  ]);

  const orders = (orderData || []) as MarketplaceOrder[];
  const items = (itemData || []) as OrderItem[];
  const sellerOrders = (sellerOrderData || []) as SellerOrder[];
  const sellers = (sellerData || []) as Seller[];

  const orderIds = new Set(orders.map((order) => order.id));

  const visibleItems = items.filter((item) =>
    orderIds.has(item.order_id)
  );

  const visibleSellerOrders = sellerOrders.filter((sellerOrder) =>
    orderIds.has(sellerOrder.order_id)
  );

  const sellerMap = new Map(
    sellers.map((seller) => [seller.id, seller])
  );

  const itemMap = new Map<string, OrderItem[]>();
  visibleItems.forEach((item) => {
    const current = itemMap.get(item.order_id) || [];
    current.push(item);
    itemMap.set(item.order_id, current);
  });

  const sellerOrderMap = new Map<string, SellerOrder[]>();
  visibleSellerOrders.forEach((sellerOrder) => {
    const current = sellerOrderMap.get(sellerOrder.order_id) || [];
    current.push(sellerOrder);
    sellerOrderMap.set(sellerOrder.order_id, current);
  });

  // Dashboard figures are based on the currently selected order set.
  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0
  );

  const pendingOrders = orders.filter(
    (order) => order.order_status.toUpperCase() === 'PLACED'
  ).length;

  const deliveredOrders = orders.filter(
    (order) =>
      ['DELIVERED', 'COMPLETED'].includes(
        order.order_status.toUpperCase()
      )
  ).length;

  const paidOrders = orders.filter(
    (order) => order.payment_status.toUpperCase() === 'PAID'
  ).length;

  const filterHref = (
    status: string,
    payment: string
  ) => {
    const params = new URLSearchParams();

    if (search) params.set('q', search);
    if (status !== 'ALL') params.set('status', status);
    if (payment !== 'ALL') params.set('payment', payment);
    if (selectedDate) params.set('date', selectedDate);

    return params.toString()
      ? `/dashboard/marketplace/orders?${params.toString()}`
      : '/dashboard/marketplace/orders';
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
              Order Management
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Monitor customer orders, seller fulfilment and payment status.
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

        {/* DATABASE ERRORS */}
        {(orderError || itemError || sellerOrderError || sellerError) && (
          <section className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            <strong>Database loading warning</strong>

            {orderError && (
              <p className="mt-2">
                Orders: {orderError.message}
              </p>
            )}

            {itemError && (
              <p className="mt-2">
                Order items: {itemError.message}
              </p>
            )}

            {sellerOrderError && (
              <p className="mt-2">
                Seller orders: {sellerOrderError.message}
              </p>
            )}

            {sellerError && (
              <p className="mt-2">
                Seller directory: {sellerError.message}
              </p>
            )}

            <p className="mt-3">
              Check the relevant table SELECT policies and database permissions.
            </p>
          </section>
        )}

        {/* SUMMARY */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Orders displayed"
            value={orders.length}
            description="Master customer orders"
          />

          <SummaryCard
            title="Order value"
            value={formatCurrency(totalRevenue)}
            description="Total value of displayed orders"
          />

          <SummaryCard
            title="Pending orders"
            value={pendingOrders}
            description="Orders currently placed"
          />

          <SummaryCard
            title="Delivered / completed"
            value={deliveredOrders}
            description="Successfully fulfilled orders"
          />
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SummaryCard
            title="Paid orders"
            value={paidOrders}
            description="Payment status marked PAID"
          />

          <SummaryCard
            title="Seller order records"
            value={visibleSellerOrders.length}
            description="Seller-specific fulfilment records"
          />
        </section>

        {/* SEARCH AND FILTERS */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">
            Search and Filter Orders
          </h2>

          <form method="GET" className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              type="search"
              name="q"
              defaultValue={search}
              maxLength={80}
              placeholder="Search order number"
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-600"
            />

            <select
              name="status"
              defaultValue={selectedStatus}
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900"
            >
              {validOrderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All Order Statuses' : status}
                </option>
              ))}
            </select>

            <select
              name="payment"
              defaultValue={selectedPayment}
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900"
            >
              {validPaymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All Payment Statuses' : status}
                </option>
              ))}
            </select>

            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900"
            />

            <div className="flex flex-wrap gap-2 md:col-span-4">
              <button
                type="submit"
                className="rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800"
              >
                Apply Filters
              </button>

              <Link
                href="/dashboard/marketplace/orders"
                className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Reset
              </Link>
            </div>
          </form>
        </section>

        {/* ORDER STATUS FILTERS */}
        <nav className="mb-5 flex flex-wrap gap-2">
          {validOrderStatuses.map((status) => (
            <Link
              key={status}
              href={filterHref(status, selectedPayment)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                selectedStatus === status
                  ? 'bg-green-700 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status === 'ALL' ? 'All Orders' : status}
            </Link>
          ))}
        </nav>

        {/* PAYMENT FILTERS */}
        <nav className="mb-6 flex flex-wrap gap-2">
          {validPaymentStatuses.map((payment) => (
            <Link
              key={payment}
              href={filterHref(selectedStatus, payment)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                selectedPayment === payment
                  ? 'bg-gray-800 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {payment === 'ALL' ? 'All Payments' : payment}
            </Link>
          ))}
        </nav>

        {/* ORDER DIRECTORY */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Customer Order Directory
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Read-only administrative view
              </p>
            </div>

            <span className="text-sm text-gray-500">
              {orders.length} records displayed
            </span>
          </div>

          {orderError ? null : orders.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                No orders found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                No orders match the selected filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order) => {
                const orderItems = itemMap.get(order.id) || [];
                const orderSellerRecords =
                  sellerOrderMap.get(order.id) || [];

                return (
                  <article key={order.id} className="p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Order Number
                        </p>

                        <h3 className="mt-1 text-xl font-bold text-green-800">
                          {order.order_number}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          Placed: {formatDate(order.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(order.order_status)}`}>
                          {order.order_status}
                        </span>

                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(order.payment_status)}`}>
                          PAYMENT: {order.payment_status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <InfoItem
                        label="Customer User ID"
                        value={order.customer_user_id}
                      />

                      <InfoItem
                        label="Total Amount"
                        value={formatCurrency(order.total_amount)}
                      />

                      <InfoItem
                        label="Subtotal"
                        value={formatCurrency(order.subtotal)}
                      />

                      <InfoItem
                        label="Discount"
                        value={formatCurrency(order.discount_amount)}
                      />

                      <InfoItem
                        label="Delivery Charge"
                        value={formatCurrency(order.delivery_charge)}
                      />

                      <InfoItem
                        label="Tax Amount"
                        value={formatCurrency(order.tax_amount)}
                      />

                      <InfoItem
                        label="Delivery Method"
                        value={order.delivery_method}
                      />

                      <InfoItem
                        label="Delivery Address ID"
                        value={order.delivery_address_id}
                      />

                      <InfoItem
                        label="Last Updated"
                        value={formatDate(order.updated_at)}
                      />

                      <InfoItem
                        label="Order Items"
                        value={orderItems.length}
                      />

                      <InfoItem
                        label="Seller Order Records"
                        value={orderSellerRecords.length}
                      />
                    </div>

                    {order.customer_notes && (
                      <div className="mt-5 rounded-lg bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Customer Notes
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                          {order.customer_notes}
                        </p>
                      </div>
                    )}

                    {order.delivery_address_snapshot && (
                      <details className="mt-5 rounded-lg border border-gray-200 p-4">
                        <summary className="cursor-pointer text-sm font-semibold text-gray-800">
                          View Delivery Address Snapshot
                        </summary>

                        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                          {JSON.stringify(
                            order.delivery_address_snapshot,
                            null,
                            2
                          )}
                        </pre>
                      </details>
                    )}

                    {/* ORDER ITEMS */}
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900">
                        Order Items ({orderItems.length})
                      </h4>

                      {orderItems.length === 0 ? (
                        <p className="mt-3 text-sm text-gray-500">
                          No order item records were returned for this order.
                        </p>
                      ) : (
                        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
                          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 font-semibold text-gray-600">
                                  Product
                                </th>
                                <th className="px-4 py-3 font-semibold text-gray-600">
                                  SKU
                                </th>
                                <th className="px-4 py-3 font-semibold text-gray-600">
                                  Quantity
                                </th>
                                <th className="px-4 py-3 font-semibold text-gray-600">
                                  Unit Price
                                </th>
                                <th className="px-4 py-3 font-semibold text-gray-600">
                                  Tax
                                </th>
                                <th className="px-4 py-3 font-semibold text-gray-600">
                                  Discount
                                </th>
                                <th className="px-4 py-3 font-semibold text-gray-600">
                                  Line Total
                                </th>
                              </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                              {orderItems.map((item) => {
                                const seller = sellerMap.get(item.seller_id);

                                return (
                                  <tr key={item.id}>
                                    <td className="px-4 py-3">
                                      <p className="font-medium text-gray-900">
                                        {item.product_name_snapshot}
                                      </p>
                                      <p className="mt-1 text-xs text-gray-500">
                                        Seller: {seller?.seller_id || item.seller_id}
                                      </p>
                                    </td>

                                    <td className="px-4 py-3 text-gray-600">
                                      {item.sku_snapshot || '—'}
                                    </td>

                                    <td className="px-4 py-3 text-gray-700">
                                      {item.quantity} {item.unit || ''}
                                    </td>

                                    <td className="px-4 py-3 text-gray-700">
                                      {formatCurrency(item.unit_price)}
                                    </td>

                                    <td className="px-4 py-3 text-gray-700">
                                      {formatCurrency(item.tax_amount)}
                                    </td>

                                    <td className="px-4 py-3 text-gray-700">
                                      {formatCurrency(item.discount_amount)}
                                    </td>

                                    <td className="px-4 py-3 font-semibold text-gray-900">
                                      {formatCurrency(item.line_total)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* SELLER ORDERS */}
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900">
                        Seller Fulfilment ({orderSellerRecords.length})
                      </h4>

                      {orderSellerRecords.length === 0 ? (
                        <p className="mt-3 text-sm text-gray-500">
                          No seller order records found.
                        </p>
                      ) : (
                        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                          {orderSellerRecords.map((sellerOrder) => {
                            const seller = sellerMap.get(sellerOrder.seller_id);

                            return (
                              <div
                                key={sellerOrder.id}
                                className="rounded-lg border border-gray-200 p-4"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Seller Order Number
                                    </p>

                                    <p className="mt-1 font-bold text-green-800">
                                      {sellerOrder.seller_order_number}
                                    </p>
                                  </div>

                                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(sellerOrder.status)}`}>
                                    {sellerOrder.status}
                                  </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                  <InfoItem
                                    label="Seller ID"
                                    value={seller?.seller_id || sellerOrder.seller_id}
                                  />

                                  <InfoItem
                                    label="Seller Business"
                                    value={seller?.shop_name || 'Not available'}
                                  />

                                  <InfoItem
                                    label="Subtotal"
                                    value={formatCurrency(sellerOrder.subtotal)}
                                  />

                                  <InfoItem
                                    label="Commission"
                                    value={formatCurrency(sellerOrder.commission_amount)}
                                  />

                                  <InfoItem
                                    label="Seller Amount"
                                    value={formatCurrency(sellerOrder.seller_amount)}
                                  />

                                  <InfoItem
                                    label="Created"
                                    value={formatDate(sellerOrder.created_at)}
                                  />

                                  <InfoItem
                                    label="Last Updated"
                                    value={formatDate(sellerOrder.updated_at)}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <p className="mt-6 border-t border-gray-100 pt-3 text-xs text-gray-500">
                      Order and fulfilment information is displayed in read-only mode.
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
            Order Data Security
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            This module is restricted to SUPER_ADMIN. It reads customer
            orders, order items and seller fulfilment records using the
            authenticated Supabase client. Existing customer and seller
            access policies remain unchanged. No order, payment, delivery,
            inventory or stock records are modified by this page.
          </p>
        </section>

      </div>
    </main>
  );
}

