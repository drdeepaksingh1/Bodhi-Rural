import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import LogoutButton from '../components/LogoutButton';

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

export default async function Dashboard() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  /*
   * ---------------------------------------------------------
   * CURRENT USER / ROLE
   * ---------------------------------------------------------
   */

const { data: profile } = await supabase
  .from('profiles')
  .select('full_name, role_id')
  .eq('id', user.id)
  .single();

let roleName = 'User';

if (profile?.role_id) {
  const { data: role } = await supabase
    .from('roles')
    .select('name')
    .eq('id', profile.role_id)
    .single();

  if (role?.name) {
    roleName = role.name;
  }
}

  /*
   * ---------------------------------------------------------
   * DATE RANGE
   * ---------------------------------------------------------
   *
   * Use India date for today's operational dashboard.
   */

  const indiaDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  const tomorrow = new Date(`${indiaDate}T00:00:00+05:30`);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(tomorrow);

  /*
   * ---------------------------------------------------------
   * FARMER COUNT
   * ---------------------------------------------------------
   */

  const { count: farmerCount, error: farmerCountError } =
    await supabase
      .from('farmers')
      .select('*', {
        count: 'exact',
        head: true,
      });

  const totalFarmers = farmerCountError
    ? 0
    : farmerCount ?? 0;

  /*
   * ---------------------------------------------------------
   * BIRD COUNT
   * ---------------------------------------------------------
   *
   * Current live birds = SUM(current_quantity)
   */

  const { data: birdRows, error: birdError } = await supabase
    .from('bird_batches')
    .select('current_quantity');

  const totalBirds = birdError
    ? 0
    : (birdRows ?? []).reduce(
        (sum, row) => sum + (row.current_quantity ?? 0),
        0
      );

  /*
   * ---------------------------------------------------------
   * TODAY'S EGGS
   * ---------------------------------------------------------
   */

  const { data: eggRows, error: eggError } = await supabase
    .from('egg_production')
    .select('total_eggs')
    .eq('production_date', indiaDate);

  const todayEggs = eggError
    ? 0
    : (eggRows ?? []).reduce(
        (sum, row) => sum + (row.total_eggs ?? 0),
        0
      );

  /*
   * ---------------------------------------------------------
   * TODAY'S SALES
   * ---------------------------------------------------------
   *
   * Cancelled orders are excluded.
   */

  const { data: orderRows, error: orderError } = await supabase
    .from('orders')
    .select('total_amount, status, order_date')
    .gte('order_date', `${indiaDate}T00:00:00+05:30`)
    .lt('order_date', `${tomorrowDate}T00:00:00+05:30`);

  const todaySales = orderError
    ? 0
    : (orderRows ?? [])
        .filter(
          (order) =>
            order.status?.toUpperCase() !== 'CANCELLED'
        )
        .reduce(
          (sum, order) => sum + Number(order.total_amount ?? 0),
          0
        );

  /*
   * ---------------------------------------------------------
   * PENDING APPLICATIONS
   * ---------------------------------------------------------
   */

  const {
    count: pendingApplicationCount,
  } = await supabase
    .from('farmer_applications')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .eq('status', 'PENDING');

  /*
   * ---------------------------------------------------------
   * RECENT FARMERS
   * ---------------------------------------------------------
   */

  const { data: recentFarmers } = await supabase
    .from('farmers')
    .select(
      'farmer_id, full_name, status, joining_date, created_at'
    )
    .order('created_at', {
      ascending: false,
    })
    .limit(10);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HEADER */}

      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-2xl font-bold tracking-tight">
                <span className="text-emerald-700">
                  BODHI
                </span>{' '}
                <span className="text-amber-500">
                  RURAL
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-bold text-slate-900">
                {roleName} Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Welcome, {profile?.full_name ?? user.email}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-200"
              >
                Dashboard
              </Link>

              <Link
                href="/bodhifarm"
                className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-200"
              >
                BodhiFarm
              </Link>

              <Link
                href="/bodhimart"
                className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-200"
              >
                BodhiMart
              </Link>

              <Link
                href="/dashboard/farmer-applications"
                className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-200"
              >
                Farmer Applications
              </Link>

              <Link
                href="/farmer/register"
                className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Register Farmer
              </Link>

              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* DASHBOARD */}

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* LIVE KPI CARDS */}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Farmers
            </p>

            <p className="mt-3 text-4xl font-bold text-emerald-700">
              {formatNumber(totalFarmers)}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Registered farmers
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
              {formatNumber(todayEggs)}
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
              {formatCurrency(todaySales)}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Non-cancelled orders
            </p>
          </div>
        </div>

        {/* SECONDARY KPI */}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <Link
            href="/dashboard/farmer-applications"
            className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-500">
              Pending Applications
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-600">
              {pendingApplicationCount ?? 0}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Applications awaiting review
            </p>
          </Link>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Farmer Network
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {formatNumber(totalFarmers)}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Active platform records
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Today's Production
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {formatNumber(todayEggs)}
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

        {/* RECENT FARMERS */}

        <div className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Recent Farmers
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest farmers registered in Bodhi Rural
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
                {(recentFarmers ?? []).map((farmer) => (
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
                          ).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                  </tr>
                ))}

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

        {/* QUICK ACCESS */}

        <div className="mt-8 grid gap-5 md:grid-cols-3">

          <Link
            href="/dashboard/farmer-applications"
            className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md"
          >
            <h3 className="text-lg font-bold text-slate-900">
              Farmer Applications
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Review new farmer registrations,
              approve or reject applications and
              generate Farmer IDs.
            </p>
          </Link>

          <Link
            href="/bodhifarm"
            className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md"
          >
            <h3 className="text-lg font-bold text-slate-900">
              BodhiFarm
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Manage farmers, bird batches, egg
              production, feed and veterinary
              operations.
            </p>
          </Link>

          <Link
            href="/bodhimart"
            className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md"
          >
            <h3 className="text-lg font-bold text-slate-900">
              BodhiMart
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Manage products, inventory, orders,
              payments and farmer purchases.
            </p>
          </Link>

        </div>
      </section>
    </main>
  );
}
