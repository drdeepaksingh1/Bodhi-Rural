
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import LogoutButton from '../../../components/LogoutButton';

const ALLOWED_ROLES = [
  'SUPER_ADMIN',
  'CEO',
  'CORPORATE_ADMIN',
];

type Seller = {
  id: string;
  seller_id: string;
  shop_name: string;
  owner_name: string;
  mobile: string | null;
  email: string | null;
  address: string | null;
  business_type: string | null;
  gstin: string | null;
  status: string;
  created_at: string;
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

function formatDate(value: string) {
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
    case 'SUSPENDED':
      return 'bg-red-100 text-red-800';
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-orange-100 text-orange-800';
  }
}

export default async function SellerManagementPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    status?: string;
  };
}) {
  const { supabase, user, profile, role } =
    await getAuthorizedAdmin();

  const search = (searchParams?.q || '').trim().slice(0, 80);

  const requestedStatus = (
    searchParams?.status || 'ALL'
  ).toUpperCase();

  const validStatuses = [
    'ALL',
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
  ];

  const selectedStatus = validStatuses.includes(requestedStatus)
    ? requestedStatus
    : 'ALL';

  let query = supabase
    .from('marketplace_sellers')
    .select(
      'id, seller_id, shop_name, owner_name, mobile, email, address, business_type, gstin, status, created_at'
    )
    .order('created_at', { ascending: false });

  if (selectedStatus !== 'ALL') {
    query = query.eq('status', selectedStatus);
  }

  if (search) {
    const safeSearch = search.replace(/[,%()]/g, ' ');
    query = query.or(
      `shop_name.ilike.%${safeSearch}%,owner_name.ilike.%${safeSearch}%,seller_id.ilike.%${safeSearch}%`
    );
  }

  const { data, error } = await query;

  const sellers = (data || []) as Seller[];

  const statusLinks = validStatuses.map((status) => ({
    status,
    href: `/dashboard/marketplace/sellers?${new URLSearchParams({
      ...(search ? { q: search } : {}),
      ...(status !== 'ALL' ? { status } : {}),
    }).toString()}`,
  }));

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
              Seller Management
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              View and monitor registered marketplace sellers.
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
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Sellers displayed"
            value={sellers.length}
          />

          <SummaryCard
            title="Active sellers displayed"
            value={
              sellers.filter(
                (seller) => seller.status.toUpperCase() === 'ACTIVE'
              ).length
            }
          />

          <SummaryCard
            title="Other statuses displayed"
            value={
              sellers.filter(
                (seller) => seller.status.toUpperCase() !== 'ACTIVE'
              ).length
            }
          />
        </section>

        {/* SEARCH */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">
            Search Sellers
          </h2>

          <form
            method="GET"
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="search"
              name="q"
              defaultValue={search}
              maxLength={80}
              placeholder="Search shop name, owner name or seller ID"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-600"
            />

            {selectedStatus !== 'ALL' && (
              <input
                type="hidden"
                name="status"
                value={selectedStatus}
              />
            )}

            <button
              type="submit"
              className="rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800"
            >
              Search
            </button>

            <Link
              href="/dashboard/marketplace/sellers"
              className="rounded-lg border border-gray-300 px-6 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Reset
            </Link>
          </form>
        </section>

        {/* STATUS FILTERS */}
        <nav className="mb-5 flex flex-wrap gap-2">
          {statusLinks.map(({ status, href }) => (
            <Link
              key={status}
              href={href}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                selectedStatus === status
                  ? 'bg-green-700 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status === 'ALL' ? 'All Sellers' : status}
            </Link>
          ))}
        </nav>

        {/* DATABASE ERROR */}
        {error && (
          <section className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            <strong>Unable to load sellers:</strong>{' '}
            {error.message}
            <p className="mt-2">
              Check the existing marketplace_sellers SELECT
              permission and Supabase Row Level Security policies.
            </p>
          </section>
        )}

        {/* SELLER DIRECTORY */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Registered Seller Directory
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Read-only administrative view
              </p>
            </div>

            <span className="text-sm text-gray-500">
              {sellers.length} records displayed
            </span>
          </div>

          {error ? null : sellers.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                No sellers found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Try another search or status filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sellers.map((seller) => (
                <article
                  key={seller.id}
                  className="p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Seller ID
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-green-800">
                        {seller.seller_id}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        Registered: {formatDate(seller.created_at)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyle(seller.status)}`}
                    >
                      {seller.status}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoItem
                      label="Business / Shop Name"
                      value={seller.shop_name}
                    />

                    <InfoItem
                      label="Owner Name"
                      value={seller.owner_name}
                    />

                    <InfoItem
                      label="Mobile"
                      value={seller.mobile}
                    />

                    <InfoItem
                      label="Email"
                      value={seller.email}
                    />

                    <InfoItem
                      label="Business Type"
                      value={seller.business_type}
                    />

                    <InfoItem
                      label="GSTIN"
                      value={seller.gstin}
                    />

                    <InfoItem
                      label="Address"
                      value={seller.address}
                    />
                  </div>

                  <p className="mt-5 border-t border-gray-100 pt-3 text-xs text-gray-500">
                    Seller record is displayed in read-only mode.
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* SECURITY NOTICE */}
        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">
            Seller Data Security
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            This module does not create, edit, suspend or delete seller
            records. Seller data is retrieved through the authenticated
            Supabase client and remains subject to existing Row Level
            Security policies.
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

