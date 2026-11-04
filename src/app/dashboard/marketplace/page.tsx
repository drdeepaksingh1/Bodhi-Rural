import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import LogoutButton from '../../../../components/LogoutButton';

type Seller = {
  id: string;
  seller_id: string;
  application_id: string | null;
  user_id: string | null;
  shop_name: string;
  owner_name: string;
  mobile: string | null;
  email: string | null;
  address: string | null;
  pan_number: string | null;
  gstin: string | null;
  business_type: string | null;
  status: string;
  created_at: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  const style =
    normalized === 'ACTIVE'
      ? 'bg-emerald-100 text-emerald-700'
      : normalized === 'SUSPENDED'
        ? 'bg-red-100 text-red-700'
        : 'bg-amber-100 text-amber-700';

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}
    >
      {normalized}
    </span>
  );
}

export default async function SellerManagementPage() {
  const supabase = createClient();

  // 1. AUTHENTICATION
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 2. ACTIVE PROFILE
  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select('full_name, role_id, is_active')
      .eq('id', user.id)
      .single();

  if (profileError || !profile || !profile.is_active) {
    redirect('/login');
  }

  // 3. ROLE VERIFICATION
  if (!profile.role_id) {
    redirect('/dashboard');
  }

  const { data: role, error: roleError } =
    await supabase
      .from('roles')
      .select('code, name')
      .eq('id', profile.role_id)
      .single();

  if (roleError || role?.code !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  // 4. LOAD SELLERS
  const {
    data: sellers,
    error: sellerError,
    count,
  } = await supabase
    .from('marketplace_sellers')
    .select(
      `
        id,
        seller_id,
        application_id,
        user_id,
        shop_name,
        owner_name,
        mobile,
        email,
        address,
        pan_number,
        gstin,
        business_type,
        status,
        created_at
      `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (sellerError) {
    console.error('SELLER MANAGEMENT ERROR:', sellerError);

    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-white p-6">
          <h1 className="text-xl font-bold text-red-700">
            Unable to load seller records
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            {sellerError.message}
          </p>

          <Link
            href="/dashboard/marketplace"
            className="mt-5 inline-block text-emerald-700"
          >
            ← Back to Marketplace
          </Link>
        </div>
      </main>
    );
  }

  const sellerList = (sellers || []) as Seller[];

  const totalSellers = count ?? sellerList.length;

  const activeSellers = sellerList.filter(
    (seller) => seller.status === 'ACTIVE'
  ).length;

  const inactiveSellers = sellerList.filter(
    (seller) => seller.status === 'INACTIVE'
  ).length;

  const suspendedSellers = sellerList.filter(
    (seller) => seller.status === 'SUSPENDED'
  ).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-5 py-8">

        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-5 border-b pb-6 md:flex-row md:items-end">

          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                SUPER_ADMIN
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                Read Only Administration
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              Seller Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              BodhiMart seller directory and business information.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Welcome, {profile.full_name || user.email}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/marketplace"
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800"
            >
              Marketplace
            </Link>

            <Link
              href="/dashboard"
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800"
            >
              Main Dashboard
            </Link>

            <LogoutButton />
          </div>
        </div>

        {/* SUMMARY */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            title="Total Sellers"
            value={totalSellers}
            color="text-slate-900"
          />

          <SummaryCard
            title="Active Sellers"
            value={activeSellers}
            color="text-emerald-700"
          />

          <SummaryCard
            title="Inactive Sellers"
            value={inactiveSellers}
            color="text-amber-600"
          />

          <SummaryCard
            title="Suspended Sellers"
            value={suspendedSellers}
            color="text-red-600"
          />

        </div>

        {/* SELLER DIRECTORY */}
        <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          <div className="flex flex-col justify-between gap-3 border-b p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Registered Sellers
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Showing up to 200 most recently registered sellers.
              </p>
            </div>

            <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {sellerList.length} records loaded
            </span>
          </div>

          {sellerList.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl">🏪</div>

              <h3 className="mt-4 font-bold text-slate-800">
                No sellers found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                No registered marketplace sellers are available.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1150px] w-full text-sm">

                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Seller ID</th>
                    <th className="px-5 py-4">Business Name</th>
                    <th className="px-5 py-4">Owner</th>
                    <th className="px-5 py-4">Mobile</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Business Type</th>
                    <th className="px-5 py-4">GSTIN</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Registered</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {sellerList.map((seller) => (
                    <tr
                      key={seller.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-bold text-emerald-700">
                        {seller.seller_id}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {seller.shop_name}
                      </td>

                      <td className="px-5 py-4">
                        {seller.owner_name}
                      </td>

                      <td className="px-5 py-4">
                        {seller.mobile || '—'}
                      </td>

                      <td className="px-5 py-4">
                        {seller.email || '—'}
                      </td>

                      <td className="px-5 py-4">
                        {seller.business_type || '—'}
                      </td>

                      <td className="px-5 py-4">
                        {seller.gstin || '—'}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={seller.status} />
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {formatDate(seller.created_at)}
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          )}

        </section>

        {/* SECURITY INFORMATION */}
        <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-5">
          <h3 className="font-bold text-emerald-800">
            Administrative Security
          </h3>

          <p className="mt-2 text-sm leading-6 text-emerald-700">
            Seller records are retrieved using the authenticated
            SUPER_ADMIN session and Supabase Row Level Security.
            This page does not modify seller ownership, status,
            applications or inventory.
          </p>
        </div>

      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className={`mt-3 text-4xl font-bold ${color}`}>
        {value.toLocaleString('en-IN')}
      </p>
    </div>
  );
}
