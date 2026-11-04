import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';
import LogoutButton from '../../components/LogoutButton';

const ALLOWED_ROLES = [
  'SUPER_ADMIN',
  'CEO',
  'CORPORATE_ADMIN',
  'MARKETPLACE_ADMIN',
];

const modules = [
  {
    title: 'Seller Management',
    description: 'Manage registered marketplace sellers and their business profiles.',
    icon: '🏪',
    status: 'Next implementation',
  },
  {
    title: 'Seller Applications',
    description: 'Review seller applications and approval status.',
    icon: '📋',
    status: 'Next implementation',
  },
  {
    title: 'Product Management',
    description: 'Monitor marketplace products and product approvals.',
    icon: '📦',
    status: 'Next implementation',
  },
  {
    title: 'Inventory Management',
    description: 'Monitor seller-wise stock, reserved stock and available inventory.',
    icon: '📊',
    status: 'Next implementation',
  },
  {
    title: 'Order Management',
    description: 'Monitor marketplace orders and order processing.',
    icon: '🛒',
    status: 'Next implementation',
  },
  {
    title: 'Sales & Reports',
    description: 'Review marketplace sales and business performance.',
    icon: '📈',
    status: 'Next implementation',
  },
  {
    title: 'Stock Audit',
    description: 'Review stock adjustments and inventory movement history.',
    icon: '🧾',
    status: 'Next implementation',
  },
];

export default async function MarketplaceDashboard() {
  const supabase = createClient();

  // 1. AUTHENTICATION
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 2. ACTIVE USER PROFILE
  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select('full_name, role_id, is_active')
      .eq('id', user.id)
      .single();

  if (profileError || !profile || !profile.is_active) {
    redirect('/login');
  }

  // 3. USER ROLE
  if (!profile.role_id) {
    redirect('/dashboard');
  }

  const { data: role, error: roleError } =
    await supabase
      .from('roles')
      .select('code, name')
      .eq('id', profile.role_id)
      .single();

  if (roleError || !role?.code) {
    redirect('/dashboard');
  }

  const roleCode = role.code;

  // 4. AUTHORIZATION
  if (!ALLOWED_ROLES.includes(roleCode)) {
    redirect('/dashboard');
  }

  const isSuperAdmin = roleCode === 'SUPER_ADMIN';

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 border-b pb-6 md:flex-row md:items-end md:justify-between">

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
              BodhiMart Control Panel
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Welcome, {profile.full_name || user.email}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Chairman / MD Marketplace Administration
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200"
            >
              Main Dashboard
            </Link>

            <LogoutButton />
          </div>
        </div>

        {/* ACCESS CONTROL */}
        <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <h2 className="font-semibold text-emerald-800">
            Marketplace Administrative Access
          </h2>

          <p className="mt-2 text-sm text-emerald-700">
            Your authenticated role is {role.name} ({roleCode}).
          </p>

          <p className="mt-1 text-sm text-emerald-700">
            {isSuperAdmin
              ? 'SUPER_ADMIN access is authorized for the Marketplace Control Panel.'
              : 'Your role is authorized for the Marketplace Control Panel.'}
          </p>

          <p className="mt-2 text-xs text-emerald-600">
            Database access remains subject to Supabase Row Level Security.
          </p>
        </div>

        {/* MARKETPLACE OVERVIEW */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            Marketplace Administration
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Centralized management of BodhiMart operations.
          </p>
        </div>

        {/* MODULES */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {modules.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="text-3xl">
                {item.icon}
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                {item.description}
              </p>

              <div className="mt-5 border-t pt-4">
                <span className="text-xs font-semibold text-amber-700">
                  {item.status}
                </span>
              </div>
            </div>
          ))}

        </div>

        {/* STOREFRONT */}
        <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Marketplace Storefront
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Open the public BodhiMart marketplace.
          </p>

          <Link
            href="/bodhimart"
            className="mt-5 inline-block rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Open BodhiMart →
          </Link>
        </div>

      </section>
    </main>
  );
}
