import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import LogoutButton from '../../components/LogoutButton';

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

export default async function CEODashboard() {
  const supabase = createClient();

  /*
   * -------------------------------------------------------
   * AUTHENTICATION
   * -------------------------------------------------------
   */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  /*
   * -------------------------------------------------------
   * PROFILE
   * -------------------------------------------------------
   */

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role_id, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) {
    redirect('/login');
  }

  /*
   * -------------------------------------------------------
   * ROLE
   * -------------------------------------------------------
   */

  const { data: role } = await supabase
    .from('roles')
    .select('code, name')
    .eq('id', profile.role_id)
    .single();

  const roleCode = role?.code ?? '';

  /*
   * CEO AND SUPER ADMIN ONLY
   */

  if (
    roleCode !== 'CEO' &&
    roleCode !== 'SUPER_ADMIN'
  ) {
    redirect('/dashboard');
  }

  /*
   * -------------------------------------------------------
   * FARMER NETWORK
   * -------------------------------------------------------
   */

  const {
    count: farmerCount,
    error: farmerError,
  } = await supabase
    .from('farmers')
    .select('*', {
      count: 'exact',
      head: true,
    });

  const totalFarmers = farmerError
    ? 0
    : farmerCount ?? 0;

  /*
   * -------------------------------------------------------
   * LIVE BIRDS
   * -------------------------------------------------------
   */

  const {
    data: birdRows,
    error: birdError,
  } = await supabase
    .from('bird_batches')
    .select('current_quantity');

  const totalBirds = birdError
    ? 0
    : (birdRows ?? []).reduce(
        (sum, row) =>
          sum +
          Number(row.current_quantity ?? 0),
        0
      );

  /*
   * -------------------------------------------------------
   * TODAY'S EGGS
   * -------------------------------------------------------
   */

  const indiaDate =
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
    }).format(new Date());

  const {
    data: eggRows,
    error: eggError,
  } = await supabase
    .from('egg_production')
    .select('total_eggs, saleable_eggs')
    .eq(
      'production_date',
      indiaDate
    );

  const totalEggsToday = eggError
    ? 0
    : (eggRows ?? []).reduce(
        (sum, row) =>
          sum +
          Number(row.total_eggs ?? 0),
        0
      );

  const saleableEggsToday = eggError
    ? 0
    : (eggRows ?? []).reduce(
        (sum, row) =>
          sum +
          Number(row.saleable_eggs ?? 0),
        0
      );

  /*
   * -------------------------------------------------------
   * PENDING FARMER APPLICATIONS
   * -------------------------------------------------------
   */

  const {
    count: pendingApplications,
  } = await supabase
    .from('farmer_applications')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .eq('status', 'PENDING');

  /*
   * -------------------------------------------------------
   * FARMER STATUS
   * -------------------------------------------------------
   */

  const {
    count: activeFarmers,
  } = await supabase
    .from('farmers')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .eq('status', 'ACTIVE');

  /*
   * -------------------------------------------------------
   * RECENT FARMERS
   * -------------------------------------------------------
   */

  const {
    data: recentFarmers,
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
    .limit(8);

  /*
   * -------------------------------------------------------
   * DASHBOARD
   * -------------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-slate-50">

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* HEADER */}

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
              CEO Management Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Welcome,{' '}
              {profile.full_name ??
                user.email}
            </p>

          </div>

          <div className="flex gap-3">

            <Link
              href="/dashboard"
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200"
            >
              Main Dashboard
            </Link>

            <LogoutButton />

          </div>

        </div>

        {/* EXECUTIVE SUMMARY */}

        <div className="mb-8">

          <h2 className="text-xl font-bold text-slate-900">
            Executive Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current company and BodhiFarm operational indicators
          </p>

        </div>

        {/* KPI CARDS */}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Total Farmers
            </p>

            <p className="mt-3 text-4xl font-bold text-emerald-700">
              {formatNumber(totalFarmers)}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Registered farmer network
            </p>

          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Active Farmers
            </p>

            <p className="mt-3 text-4xl font-bold text-emerald-700">
              {formatNumber(activeFarmers ?? 0)}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Currently active
            </p>

          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Live Birds
            </p>

            <p className="mt-3 text-4xl font-bold text-emerald-700">
              {formatNumber(totalBirds)}
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
              {formatNumber(totalEggsToday)}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Total production today
            </p>

          </div>

        </div>

        {/* SECONDARY KPIs */}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Saleable Eggs
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {formatNumber(
                saleableEggsToday
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Saleable production today
            </p>

          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Pending Farmer Applications
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-600">
              {formatNumber(
                pendingApplications ?? 0
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Awaiting management review
            </p>

          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Production Date
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {new Date(
                `${indiaDate}T00:00:00`
              ).toLocaleDateString(
                'en-IN'
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              India Standard Time
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

        {/* MANAGEMENT MODULES */}

        <div className="mt-10">

          <h2 className="text-xl font-bold text-slate-900">
            Management Modules
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            CEO access to major Bodhi Rural operations
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            <Link
              href="/bodhifarm"
              className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <h3 className="text-lg font-bold text-slate-900">
                BodhiFarm
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Farmers, farms, bird batches, egg production,
                feed and veterinary operations.
              </p>

              <div className="mt-4 font-semibold text-emerald-700">
                Open BodhiFarm →
              </div>

            </Link>

            <Link
              href="/dashboard/farmer-applications"
              className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <h3 className="text-lg font-bold text-slate-900">
                Farmer Applications
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Review farmer registration applications
                and management decisions.
              </p>

              <div className="mt-4 font-semibold text-emerald-700">
                Review Applications →
              </div>

            </Link>

            <Link
              href="/farmer/register"
              className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <h3 className="text-lg font-bold text-slate-900">
                Register Farmer
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create and onboard a new farmer into
                the BodhiFarm network.
              </p>

              <div className="mt-4 font-semibold text-emerald-700">
                Add Farmer →
              </div>

            </Link>

            <Link
              href="/dashboard/hr"
              className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <h3 className="text-lg font-bold text-slate-900">
                Human Resources
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Staff management, HR workflows and
                employee administration.
              </p>

              <div className="mt-4 font-semibold text-emerald-700">
                Open HR →
              </div>

            </Link>

            <Link
              href="/dashboard/finance"
              className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <h3 className="text-lg font-bold text-slate-900">
                Finance
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Farmer finance, payments, expenses and
                company financial operations.
              </p>

              <div className="mt-4 font-semibold text-emerald-700">
                Open Finance →
              </div>

            </Link>

            <Link
              href="/bodhimart"
              className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >

              <h3 className="text-lg font-bold text-slate-900">
                BodhiMart
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Marketplace products, sellers, inventory
                and customer orders.
              </p>

              <div className="mt-4 font-semibold text-emerald-700">
                Open BodhiMart →
              </div>

            </Link>

          </div>

        </div>

        {/* RECENT FARMERS */}

        <div className="mt-10 overflow-hidden rounded-2xl border bg-white shadow-sm">

          <div className="border-b px-6 py-5">

            <h2 className="text-xl font-bold text-slate-900">
              Recent Farmers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest farmer registrations
            </p>

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

                {(recentFarmers ?? []).map(
                  (farmer) => (
                    <tr
                      key={farmer.farmer_id}
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

                {(!recentFarmers ||
                  recentFarmers.length === 0) && (
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

      </section>

    </main>
  );
}
