import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import LogoutButton from '../components/LogoutButton';

type RoleCode =
  | 'SUPER_ADMIN'
  | 'CEO'
  | 'CORPORATE_ADMIN'
  | 'STATE_MANAGER'
  | 'DISTRICT_MANAGER'
  | 'BLOCK_MANAGER'
  | 'CLUSTER_SUPERVISOR'
  | 'FARMER_LEADER'
  | 'FARMER'
  | 'FINANCE'
  | 'HR'
  | 'MIS'
  | 'PROCUREMENT'
  | 'VETERINARY'
  | 'MARKETING'
  | 'MARKETPLACE_ADMIN'
  | 'SHOPKEEPER'
  | 'WAREHOUSE'
  | 'DELIVERY'
  | 'CUSTOMER';

type NavItem = {
  label: string;
  href: string;
  description: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function hasRole(
  roleCode: string,
  roles: RoleCode[]
) {
  return roles.includes(roleCode as RoleCode);
}

function getDashboardTitle(
  roleCode: string,
  roleName: string
) {
  switch (roleCode) {
    case 'SUPER_ADMIN':
      return 'Chairman / MD Dashboard';

    case 'CEO':
      return 'CEO Dashboard';

    case 'CORPORATE_ADMIN':
      return 'Corporate Administration Dashboard';

    case 'HR':
      return 'HR Dashboard';

    case 'FINANCE':
      return 'Finance Dashboard';

    case 'MIS':
      return 'MIS / Data Dashboard';

    case 'STATE_MANAGER':
      return 'State Manager Dashboard';

    case 'DISTRICT_MANAGER':
      return 'District Manager Dashboard';

    case 'BLOCK_MANAGER':
      return 'Block Manager Dashboard';

    case 'CLUSTER_SUPERVISOR':
      return 'Cluster Supervisor Dashboard';

    case 'FARMER_LEADER':
      return 'Farmer Leader Dashboard';

    case 'FARMER':
      return 'Farmer Dashboard';

    case 'VETERINARY':
      return 'Veterinary Dashboard';

    case 'PROCUREMENT':
      return 'Procurement Dashboard';

    case 'MARKETING':
      return 'Marketing Dashboard';

    case 'MARKETPLACE_ADMIN':
      return 'BodhiMart Admin Dashboard';

    case 'SHOPKEEPER':
      return 'Shopkeeper Dashboard';

    case 'WAREHOUSE':
      return 'Warehouse Dashboard';

    case 'DELIVERY':
      return 'Delivery Dashboard';

    case 'CUSTOMER':
      return 'Customer Dashboard';

    default:
      return `${roleName} Dashboard`;
  }
}

function getNavigation(
  roleCode: string
): NavItem[] {
  const items: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      description:
        'Company overview and operational KPIs',
    },
  ];

  const farmRoles: RoleCode[] = [
    'SUPER_ADMIN',
    'CEO',
    'CORPORATE_ADMIN',
    'STATE_MANAGER',
    'DISTRICT_MANAGER',
    'BLOCK_MANAGER',
    'CLUSTER_SUPERVISOR',
    'FARMER_LEADER',
    'FARMER',
  ];

  const financeRoles: RoleCode[] = [
    'SUPER_ADMIN',
    'CEO',
    'CORPORATE_ADMIN',
    'FINANCE',
  ];

  const hrRoles: RoleCode[] = [
    'SUPER_ADMIN',
    'CEO',
    'CORPORATE_ADMIN',
    'HR',
  ];

  const misRoles: RoleCode[] = [
    'SUPER_ADMIN',
    'CEO',
    'CORPORATE_ADMIN',
    'MIS',
  ];

  const marketplaceRoles: RoleCode[] = [
    'SUPER_ADMIN',
    'CEO',
    'CORPORATE_ADMIN',
    'MARKETPLACE_ADMIN',
  ];

  if (hasRole(roleCode, farmRoles)) {
    items.push({
      label: 'BodhiFarm',
      href: '/bodhifarm',
      description:
        'Farmers, birds, eggs, feed and veterinary operations',
    });
  }

  if (hasRole(roleCode, financeRoles)) {
    items.push({
      label: 'Finance',
      href: '/dashboard/finance',
      description:
        'Payments, expenses and financial records',
    });
  }

  if (hasRole(roleCode, hrRoles)) {
    items.push({
      label: 'HR',
      href: '/dashboard/hr',
      description:
        'Human resources and staff management',
    });
  }

  if (hasRole(roleCode, misRoles)) {
    items.push({
      label: 'MIS & Reports',
      href: '/dashboard/mis',
      description:
        'Management information and reports',
    });
  }

  if (hasRole(roleCode, marketplaceRoles)) {
    items.push({
      label: 'BodhiMart Admin',
      href: '/dashboard/marketplace',
      description:
        'Marketplace products, sellers, orders and inventory',
    });
  }

  if (
    [
      'SUPER_ADMIN',
      'CEO',
      'CORPORATE_ADMIN',
      'STATE_MANAGER',
      'DISTRICT_MANAGER',
      'BLOCK_MANAGER',
      'CLUSTER_SUPERVISOR',
      'FARMER_LEADER',
    ].includes(roleCode)
  ) {
    items.push({
      label: 'Farmer Applications',
      href: '/dashboard/farmer-applications',
      description:
        'Review and process farmer registrations',
    });
  }

  if (
    roleCode === 'SUPER_ADMIN' ||
    roleCode === 'CEO'
  ) {
    items.push({
      label: 'Register Farmer',
      href: '/farmer/register',
      description:
        'Create a farmer record',
    });
  }

  return items;
}

export default async function Dashboard() {
  const supabase = createClient();

  /*
   * AUTH
   */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  /*
   * PROFILE
   */

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'full_name, role_id, is_active'
    )
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) {
    redirect('/login');
  }

  /*
   * ROLE
   */

  let roleCode = 'CUSTOMER';
  let roleName = 'User';

  if (profile.role_id) {
    const { data: role } = await supabase
      .from('roles')
      .select('code, name')
      .eq('id', profile.role_id)
      .single();

    if (role?.code) {
      roleCode = role.code;
    }

    if (role?.name) {
      roleName = role.name;
    }
  }

  const dashboardTitle =
    getDashboardTitle(
      roleCode,
      roleName
    );

  const navigation =
    getNavigation(roleCode);

  /*
   * SPECIALIZED DASHBOARDS
   */

  const isExecutive =
    roleCode === 'SUPER_ADMIN' ||
    roleCode === 'CEO' ||
    roleCode === 'CORPORATE_ADMIN';

  const isHR =
    roleCode === 'HR';

  /*
   * DATE
   */

  const indiaDate =
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
    }).format(new Date());

  const tomorrow =
    new Date(
      `${indiaDate}T00:00:00+05:30`
    );

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  const tomorrowDate =
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
    }).format(tomorrow);

  /*
   * OPERATIONAL DATA
   *
   * These queries are still protected
   * by Supabase RLS.
   */

  let totalFarmers = 0;
  let totalBirds = 0;
  let todayEggs = 0;
  let todaySales = 0;
  let pendingApplicationCount = 0;

  let recentFarmers: Array<{
    farmer_id: string;
    full_name: string;
    status: string;
    joining_date: string | null;
    created_at: string;
  }> = [];

  /*
   * Only load farming KPIs for
   * executive / farming roles.
   */

  const farmingRoles: RoleCode[] = [
    'SUPER_ADMIN',
    'CEO',
    'CORPORATE_ADMIN',
    'STATE_MANAGER',
    'DISTRICT_MANAGER',
    'BLOCK_MANAGER',
    'CLUSTER_SUPERVISOR',
    'FARMER_LEADER',
    'FARMER',
  ];

  const canSeeFarmData =
    hasRole(
      roleCode,
      farmingRoles
    );

  if (canSeeFarmData) {
    const {
      count: farmerCount,
      error: farmerCountError,
    } = await supabase
      .from('farmers')
      .select('*', {
        count: 'exact',
        head: true,
      });

    totalFarmers =
      farmerCountError
        ? 0
        : farmerCount ?? 0;

    const {
      data: birdRows,
      error: birdError,
    } = await supabase
      .from('bird_batches')
      .select('current_quantity');

    totalBirds =
      birdError
        ? 0
        : (birdRows ?? []).reduce(
            (sum, row) =>
              sum +
              Number(
                row.current_quantity ?? 0
              ),
            0
          );

    const {
      data: eggRows,
      error: eggError,
    } = await supabase
      .from('egg_production')
      .select('total_eggs')
      .eq(
        'production_date',
        indiaDate
      );

    todayEggs =
      eggError
        ? 0
        : (eggRows ?? []).reduce(
            (sum, row) =>
              sum +
              Number(
                row.total_eggs ?? 0
              ),
            0
          );

    const {
      data: orderRows,
      error: orderError,
    } = await supabase
      .from('orders')
      .select(
        'total_amount, status, order_date'
      )
      .gte(
        'order_date',
        `${indiaDate}T00:00:00+05:30`
      )
      .lt(
        'order_date',
        `${tomorrowDate}T00:00:00+05:30`
      );

    todaySales =
      orderError
        ? 0
        : (orderRows ?? [])
            .filter(
              (order) =>
                order.status?.toUpperCase() !==
                'CANCELLED'
            )
            .reduce(
              (sum, order) =>
                sum +
                Number(
                  order.total_amount ?? 0
                ),
              0
            );

    const {
      count: pendingCount,
    } = await supabase
      .from('farmer_applications')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq(
        'status',
        'PENDING'
      );

    pendingApplicationCount =
      pendingCount ?? 0;

    const {
      data: farmers,
    } = await supabase
      .from('farmers')
      .select(
        'farmer_id, full_name, status, joining_date, created_at'
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      )
      .limit(10);

    recentFarmers =
      farmers ?? [];
  }

  /*
   * HR DATA
   *
   * We deliberately do not show
   * irrelevant farming KPIs to HR.
   */

  let hrStaffCount = 0;

  if (isHR) {
    /*
     * We do not assume a staff table exists.
     * Therefore HR dashboard currently
     * provides HR navigation without
     * inventing database data.
     */
    hrStaffCount = 0;
  }

  /*
   * RENDER
   */

  return (
    <main className="min-h-screen bg-slate-50">

      {/* IMPORTANT:
          No logo here.
          The global site header already
          provides the Bodhi Rural logo.
      */}

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* PAGE HEADER */}

        <div className="mb-8 flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <div className="flex flex-wrap gap-2">

              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                {roleCode}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Active
              </span>

            </div>

            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              {dashboardTitle}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Welcome,{' '}
              {profile.full_name ??
                user.email}
            </p>

          </div>

          <LogoutButton />

        </div>

        {/* ACCESS NOTICE */}

        <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

          <p className="text-sm font-semibold text-emerald-800">
            Current Access
          </p>

          <p className="mt-1 text-sm text-emerald-700">
            {roleName} ({roleCode})
          </p>

          <p className="mt-1 text-xs text-emerald-600">
            Data access is enforced by
            Supabase Row Level Security.
          </p>

        </div>

        {/* ==================================================
            EXECUTIVE DASHBOARD
           ================================================== */}

        {isExecutive && (
          <>
            <div className="mb-5">

              <h2 className="text-xl font-bold text-slate-900">
                Executive Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current operational snapshot
              </p>

            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  Total Farmers
                </p>

                <p className="mt-3 text-4xl font-bold text-emerald-700">
                  {formatNumber(
                    totalFarmers
                  )}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Farmers visible to your role
                </p>

              </div>

              <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  Live Birds
                </p>

                <p className="mt-3 text-4xl font-bold text-emerald-700">
                  {formatNumber(
                    totalBirds
                  )}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Current bird quantity
                </p>

              </div>

              <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  Eggs Today
                </p>

                <p className="mt-3 text-4xl font-bold text-emerald-700">
                  {formatNumber(
                    todayEggs
                  )}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Total eggs recorded today
                </p>

              </div>

              <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  Sales Today
                </p>

                <p className="mt-3 text-4xl font-bold text-emerald-700">
                  {formatCurrency(
                    todaySales
                  )}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Non-cancelled orders
                </p>

              </div>

            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-2xl border bg-white p-5 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  Pending Applications
                </p>

                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {pendingApplicationCount}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Awaiting review
                </p>

              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  Farmer Network
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-700">
                  {formatNumber(
                    totalFarmers
                  )}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Visible farmer records
                </p>

              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  Today's Production
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-700">
                  {formatNumber(
                    todayEggs
                  )}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Eggs recorded
                </p>

              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  System Status
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-700">
                  LIVE
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Supabase connected
                </p>

              </div>

            </div>
          </>
        )}

        {/* ==================================================
            HR DASHBOARD
           ================================================== */}

        {isHR && (
          <>
            <div className="mb-5">

              <h2 className="text-xl font-bold text-slate-900">
                Human Resources
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                HR management and employee workflows
              </p>

            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              <div className="rounded-2xl border bg-white p-6 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  HR Access
                </p>

                <p className="mt-3 text-3xl font-bold text-emerald-700">
                  ACTIVE
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  HR account is active
                </p>

              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  Staff Management
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  HR
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Manage staff and employee workflows
                </p>

              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">

                <p className="text-sm font-medium text-slate-500">
                  System
                </p>

                <p className="mt-3 text-3xl font-bold text-emerald-700">
                  LIVE
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Supabase connected
                </p>

              </div>

            </div>
          </>
        )}

        {/* ==================================================
            OTHER ROLE DASHBOARD
           ================================================== */}

        {!isExecutive &&
          !isHR && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                {dashboardTitle}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Your role-specific modules are available below.
              </p>

            </div>
          )}

        {/* ==================================================
            MODULES
           ================================================== */}

        <div className="mt-10">

          <div className="mb-5">

            <h2 className="text-xl font-bold text-slate-900">
              Your Modules
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Modules available for your current role
            </p>

          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {navigation.map(
              (item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >

                  <h3 className="text-lg font-bold text-slate-900">
                    {item.label}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>

                  <div className="mt-4 text-sm font-semibold text-emerald-700">
                    Open →
                  </div>

                </Link>
              )
            )}

          </div>

        </div>

        {/* ==================================================
            RECENT FARMERS
           ================================================== */}

        {isExecutive && (
          <div className="mt-10 overflow-hidden rounded-2xl border bg-white shadow-sm">

            <div className="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Recent Farmers
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Latest farmers visible to management
                </p>

              </div>

              <Link
                href="/farmer/register"
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
              >
                + Add Farmer
              </Link>

            </div>

            <div className="overflow-x-auto">

              <table className="min-w-full text-sm">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Farmer ID
                    </th>

                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Name
                    </th>

                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left font-semibold text-slate-600">
                      Joining Date
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y">

                  {recentFarmers.map(
                    (farmer) => (
                      <tr
                        key={
                          farmer.farmer_id
                        }
                        className="hover:bg-slate-50"
                      >

                        <td className="px-6 py-4 font-semibold text-emerald-700">
                          {farmer.farmer_id}
                        </td>

                        <td className="px-6 py-4 font-medium text-slate-900">
                          {farmer.full_name}
                        </td>

                        <td className="px-6 py-4">

                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {farmer.status}
                          </span>

                        </td>

                        <td className="px-6 py-4 text-slate-600">

                          {farmer.joining_date
                            ? new Date(
                                farmer.joining_date
                              ).toLocaleDateString(
                                'en-IN'
                              )
                            : '—'}

                        </td>

                      </tr>
                    )
                  )}

                  {recentFarmers.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-center text-slate-500"
                      >
                        No farmers found.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </section>

    </main>
  );
}
