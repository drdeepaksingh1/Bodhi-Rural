import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import LogoutButton from '../../components/LogoutButton';

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value);
}

export default async function HRDashboard() {
  const supabase = createClient();

  // --------------------------------------------------
  // AUTHENTICATION
  // --------------------------------------------------

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // --------------------------------------------------
  // PROFILE
  // --------------------------------------------------

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role_id, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) {
    redirect('/login');
  }

  // --------------------------------------------------
  // ROLE
  // --------------------------------------------------

  const { data: role } = await supabase
    .from('roles')
    .select('code, name')
    .eq('id', profile.role_id)
    .single();

  const roleCode = role?.code ?? '';

  // HR and senior management only
  const allowedRoles = [
    'HR',
    'CEO',
    'SUPER_ADMIN',
    'CORPORATE_ADMIN',
  ];

  if (!allowedRoles.includes(roleCode)) {
    redirect('/dashboard');
  }

  // --------------------------------------------------
  // ACTIVE STAFF / USER COUNT
  // --------------------------------------------------

  const { count: activeStaff } = await supabase
    .from('profiles')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .eq('is_active', true);

  // --------------------------------------------------
  // ROLE COUNTS
  // --------------------------------------------------

  const { data: roleRows } = await supabase
    .from('profiles')
    .select(`
      role_id,
      roles (
        code,
        name
      )
    `)
    .eq('is_active', true);

  const roleCounts: Record<string, number> = {};

  for (const row of roleRows ?? []) {
    const roleData = Array.isArray(row.roles)
      ? row.roles[0]
      : row.roles;

    const code = roleData?.code;

    if (code) {
      roleCounts[code] =
        (roleCounts[code] ?? 0) + 1;
    }
  }

  // --------------------------------------------------
  // CURRENT HR USERS
  // --------------------------------------------------

  const { data: hrUsers } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      is_active,
      created_at,
      roles (
        code,
        name
      )
    `)
    .eq('is_active', true)
    .order('created_at', {
      ascending: false,
    })
    .limit(20);

  // --------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------

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
              HR Management Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Welcome, {profile.full_name ?? user.email}
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

        {/* ACCESS */}

        <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

          <p className="text-sm font-semibold text-emerald-800">
            HR Access
          </p>

          <p className="mt-1 text-sm text-emerald-700">
            Human Resources ({roleCode})
          </p>

          <p className="mt-1 text-xs text-emerald-600">
            HR data access remains protected by Supabase
            Row Level Security.
          </p>

        </div>

        {/* HR KPIs */}

        <div className="mb-8">

          <h2 className="text-xl font-bold text-slate-900">
            Workforce Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current active user and role information
          </p>

        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Active Staff
            </p>

            <p className="mt-3 text-4xl font-bold text-emerald-700">
              {formatNumber(activeStaff ?? 0)}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Active platform profiles
            </p>

          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              HR Users
            </p>

            <p className="mt-3 text-4xl font-bold text-emerald-700">
              {formatNumber(roleCounts.HR ?? 0)}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Active HR accounts
            </p>

          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              Management
            </p>

            <p className="mt-3 text-4xl font-bold text-emerald-700">
              {formatNumber(
                (roleCounts.SUPER_ADMIN ?? 0) +
                (roleCounts.CEO ?? 0) +
                (roleCounts.CORPORATE_ADMIN ?? 0)
              )}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Senior management accounts
            </p>

          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-slate-500">
              System Status
            </p>

            <p className="mt-3 text-4xl font-bold text-emerald-700">
              LIVE
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Supabase connected
            </p>

          </div>

        </div>

        {/* HR MODULES */}

        <div className="mt-10">

          <h2 className="text-xl font-bold text-slate-900">
            HR Modules
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Human resource management functions
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            <Link
              href="/dashboard/hr"
              className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm"
            >

              <h3 className="text-lg font-bold text-slate-900">
                Staff Management
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                View active staff accounts, roles and
                organizational access.
              </p>

              <div className="mt-4 font-semibold text-emerald-700">
                Current Staff →
              </div>

            </Link>

            <Link
              href="/dashboard/farmer-applications"
              className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md"
            >

              <h3 className="text-lg font-bold text-slate-900">
                Farmer Applications
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Farmer registration workflow available
                to authorized management roles.
              </p>

              <div className="mt-4 font-semibold text-emerald-700">
                Open Applications →
              </div>

            </Link>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">

              <h3 className="text-lg font-bold text-slate-900">
                HR Applications
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Staff recruitment and application workflow
                can be connected here.
              </p>

              <div className="mt-4 font-semibold text-slate-400">
                HR Workflow →
              </div>

            </div>

          </div>

        </div>

        {/* ACTIVE STAFF */}

        <div className="mt-10 overflow-hidden rounded-2xl border bg-white shadow-sm">

          <div className="border-b px-6 py-5">

            <h2 className="text-xl font-bold text-slate-900">
              Active Staff Accounts
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current active profiles in the Bodhi Rural platform
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="min-w-full text-sm">

              <thead className="bg-slate-50">

                <tr>

                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Name
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Email
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Role
                  </th>

                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y">

                {(hrUsers ?? []).map(
                  (staff) => {

                    const staffRole =
                      Array.isArray(staff.roles)
                        ? staff.roles[0]
                        : staff.roles;

                    return (
                      <tr
                        key={staff.id}
                        className="hover:bg-slate-50"
                      >

                        <td className="px-6 py-4 font-medium text-slate-900">
                          {staff.full_name ?? '—'}
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {staff.email ?? '—'}
                        </td>

                        <td className="px-6 py-4">

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {staffRole?.code ?? '—'}
                          </span>

                        </td>

                        <td className="px-6 py-4">

                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            ACTIVE
                          </span>

                        </td>

                      </tr>
                    );
                  }
                )}

                {(!hrUsers ||
                  hrUsers.length === 0) && (
                  <tr>

                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-slate-500"
                    >
                      No active staff profiles found.
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
