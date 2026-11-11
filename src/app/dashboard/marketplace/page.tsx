
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import LogoutButton from '../../components/LogoutButton';

const ALLOWED_ROLES = [
  'SUPER_ADMIN',
  'CEO',
  'CORPORATE_ADMIN',
];

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

  return { user, profile, role };
}

// MARKETPLACE MODULES
const modules = [
  {
    number: '01',
    title: 'Seller Applications',
    description:
      'Review applications, verify business details, and approve or reject seller registrations.',
    href: '/dashboard/marketplace/applications',
    status: 'Available',
    available: true,
  },
  {
    number: '02',
    title: 'Seller Management',
    description:
      'View registered sellers, seller profiles, business information, and account status.',
    href: '/dashboard/marketplace/sellers',
    status: 'Available',
    available: true,
  },
  {
    number: '03',
    title: 'Product Management',
    description:
      'Review product listings, manage categories, and control product approval.',
    href: '',
    status: 'Coming Soon',
    available: false,
  },
  {
    number: '04',
    title: 'Inventory Management',
    description:
      'Monitor stock levels, inventory movements, and stock adjustment records.',
    href: '',
    status: 'Coming Soon',
    available: false,
  },
  {
    number: '05',
    title: 'Order Management',
    description:
      'Monitor customer orders, seller orders, payment status, and fulfilment.',
    href: '',
    status: 'Coming Soon',
    available: false,
  },
  {
    number: '06',
    title: 'Marketplace Reports',
    description:
      'View marketplace performance, seller activity, sales, and operational reports.',
    href: '',
    status: 'Coming Soon',
    available: false,
  },
];

export default async function MarketplacePage() {
  const { user, profile, role } = await getAuthorizedAdmin();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* HEADER */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
              Bodhi Rural Livelihood & Agri Pvt. Ltd.
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Marketplace Control Panel
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Central administration for the BodhiMart marketplace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
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
        <section className="mb-8 rounded-xl border border-green-200 bg-green-50 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-green-900">
                <strong>Administrator:</strong>{' '}
                {profile.full_name || user.email}
              </p>

              <p className="mt-1 text-sm text-green-800">
                <strong>Role:</strong> {role.name} ({role.code})
              </p>
            </div>

            <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
              Authorized Administrator
            </span>
          </div>
        </section>

        {/* MODULE INTRODUCTION */}
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Marketplace Modules
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Select a module to manage its marketplace operations.
          </p>
        </section>

        {/* MODULE CARDS */}
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <article
              key={module.number}
              className={`flex flex-col rounded-xl border bg-white p-5 shadow-sm transition ${
                module.available
                  ? 'border-green-200 hover:border-green-400 hover:shadow-md'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-bold text-gray-400">
                  MODULE {module.number}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    module.available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {module.status}
                </span>
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                {module.title}
              </h3>

              <p className="mt-2 flex-1 text-sm leading-6 text-gray-600">
                {module.description}
              </p>

              {module.available ? (
                <Link
                  href={module.href}
                  className="mt-6 inline-flex w-fit items-center rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
                >
                  Open Module
                  <span className="ml-2" aria-hidden="true">
                    →
                  </span>
                </Link>
              ) : (
                <span className="mt-6 inline-flex w-fit cursor-not-allowed rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-500">
                  Under Development
                </span>
              )}
            </article>
          ))}
        </section>

        {/* SECURITY INFORMATION */}
        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">
            Security and Access Control
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Marketplace administration requires an authenticated
            administrator account with an authorized role. Database
            access continues to be governed by the existing Supabase
            authorization functions and Row Level Security policies.
          </p>
        </section>

      </div>
    </main>
  );
}
