'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

type Farmer = {
  id: string;
  farmer_id: string;
  full_name: string;
  status?: string | null;
};

type Farm = {
  id: string;
  farmer_id: string;
  shed_capacity?: number | null;
  status?: string | null;
};

type Batch = {
  id: string;
  farmer_id: string;
  farm_id?: string | null;
  batch_code?: string | null;
  breed?: string | null;
  initial_quantity?: number | null;
  current_quantity?: number | null;
  mortality_quantity?: number | null;
  status?: string | null;
};

type Egg = {
  id: string;
  farmer_id: string;
  production_date: string;
  total_eggs?: number | null;
  saleable_eggs?: number | null;
};

type Vet = {
  id: string;
  farmer_id: string;
  record_date?: string | null;
  record_type?: string | null;
  mortality_quantity?: number | null;
  cause?: string | null;
};

type Payment = {
  id: string;
  farmer_id: string;
  payment_date: string;
  amount: number;
  status: string;
};

type FinanceSummary = {
  farmer_id: string;
  farmer_code: string | null;
  full_name: string | null;
  egg_earnings: number | null;
  expenses: number | null;
  payments: number | null;
  outstanding_balance: number | null;
};

export default function BodhiFarmDashboardPage() {
  const supabase = createClient();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [eggs, setEggs] = useState<Egg[]>([]);
  const [veterinary, setVeterinary] = useState<Vet[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [finance, setFinance] = useState<FinanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');

    const [
      farmersRes,
      farmsRes,
      batchesRes,
      eggsRes,
      veterinaryRes,
      paymentsRes,
      financeRes,
    ] = await Promise.all([
      supabase
        .from('farmers')
        .select('id, farmer_id, full_name, status')
        .order('farmer_id'),
      supabase
        .from('farms')
        .select('id, farmer_id, shed_capacity, status')
        .order('created_at', { ascending: false }),
      supabase
        .from('bird_batches')
        .select(
          'id, farmer_id, farm_id, batch_code, breed, initial_quantity, current_quantity, mortality_quantity, status'
        )
        .order('created_at', { ascending: false }),
      supabase
        .from('egg_production')
        .select('id, farmer_id, production_date, total_eggs, saleable_eggs')
        .order('production_date', { ascending: false }),
      supabase
        .from('veterinary_records')
        .select(
          'id, farmer_id, record_date, record_type, mortality_quantity, cause'
        )
        .order('record_date', { ascending: false }),
      supabase
        .from('farmer_payments')
        .select('id, farmer_id, payment_date, amount, status')
        .order('payment_date', { ascending: false }),
      supabase
        .from('farmer_finance_summary')
        .select('*')
        .order('outstanding_balance', { ascending: false }),
    ]);

    const firstError =
      farmersRes.error ||
      farmsRes.error ||
      batchesRes.error ||
      eggsRes.error ||
      veterinaryRes.error ||
      paymentsRes.error ||
      financeRes.error;

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    setFarmers((farmersRes.data || []) as Farmer[]);
    setFarms((farmsRes.data || []) as Farm[]);
    setBatches((batchesRes.data || []) as Batch[]);
    setEggs((eggsRes.data || []) as Egg[]);
    setVeterinary((veterinaryRes.data || []) as Vet[]);
    setPayments((paymentsRes.data || []) as Payment[]);
    setFinance((financeRes.data || []) as FinanceSummary[]);
    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const farmerMap = useMemo(() => {
    const map = new Map<string, Farmer>();
    farmers.forEach((f) => map.set(f.id, f));
    return map;
  }, [farmers]);

  const activeFarmers = farmers.filter(
    (f) => !f.status || f.status === 'ACTIVE'
  ).length;

  const activeFarms = farms.filter(
    (f) => !f.status || f.status === 'ACTIVE'
  ).length;

  const activeBatches = batches.filter(
    (b) => !b.status || b.status === 'ACTIVE'
  ).length;

  const initialBirds = batches.reduce(
    (sum, b) => sum + Number(b.initial_quantity || 0),
    0
  );

  const liveBirds = batches.reduce(
    (sum, b) => sum + Number(b.current_quantity || 0),
    0
  );

  const mortality = batches.reduce(
    (sum, b) => sum + Number(b.mortality_quantity || 0),
    0
  );

  const mortalityRate = initialBirds
    ? (mortality / initialBirds) * 100
    : 0;

  const today = new Date().toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);

  const eggsToday = eggs
    .filter((e) => e.production_date === today)
    .reduce((sum, e) => sum + Number(e.saleable_eggs || 0), 0);

  const eggsThisMonth = eggs
    .filter((e) => e.production_date.startsWith(monthPrefix))
    .reduce((sum, e) => sum + Number(e.saleable_eggs || 0), 0);

  const mortalityThisMonth = veterinary
    .filter((v) => (v.record_date || '').startsWith(monthPrefix))
    .reduce((sum, v) => sum + Number(v.mortality_quantity || 0), 0);

  const paymentsThisMonth = payments
    .filter(
      (p) =>
        p.status === 'PAID' &&
        p.payment_date.startsWith(monthPrefix)
    )
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalEarnings = finance.reduce(
    (sum, f) => sum + Number(f.egg_earnings || 0),
    0
  );

  const totalExpenses = finance.reduce(
    (sum, f) => sum + Number(f.expenses || 0),
    0
  );

  const totalPayments = finance.reduce(
    (sum, f) => sum + Number(f.payments || 0),
    0
  );

  const outstanding = finance.reduce(
    (sum, f) => sum + Number(f.outstanding_balance || 0),
    0
  );

  const attentionFarmers = finance
    .filter((f) => Number(f.outstanding_balance || 0) > 0)
    .slice(0, 8);

  const recentEggs = eggs.slice(0, 6);
  const recentVet = veterinary.slice(0, 6);
  const recentPayments = payments.slice(0, 6);

  function money(value: number) {
    return `₹${value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return '—';
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const modules = [
    ['/bodhifarm/farmers', 'Farmers', 'Farmer profiles and Farmer 360°'],
    ['/bodhifarm/farms', 'Farms', 'Farm and shed management'],
    ['/bodhifarm', 'Bird Batches', 'Bird placement and flock management'],
    ['/bodhifarm/egg-production', 'Egg Production', 'Daily egg collection'],
    ['/bodhifarm/feed', 'Feed', 'Feed consumption and cost'],
    ['/bodhifarm/veterinary', 'Veterinary', 'Health and mortality records'],
    ['/bodhifarm/performance', 'Performance', 'Production and flock KPIs'],
    ['/bodhifarm/payments', 'Payments', 'Procurement and settlements'],
    ['/bodhifarm/ledger', 'Ledger', 'Farmer financial ledger'],
    ['/bodhifarm/finance', 'Finance', 'Finance dashboard'],
    [
      '/bodhifarm/farmer-statement',
      'Farmer Statement',
      'Printable farmer statement',
    ],
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold text-green-700">
              Bodhi Rural Livelihood & Agri Private Limited
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              BodhiFarm Management Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Central operational view of farmers, farms, birds, production,
              health and finance.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Refresh Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
            Loading BodhiFarm dashboard...
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
              {[
                ['Farmers', activeFarmers],
                ['Farms', activeFarms],
                ['Batches', activeBatches],
                ['Initial Birds', initialBirds],
                ['Live Birds', liveBirds],
                ['Mortality', mortality],
                ['Eggs Today', eggsToday],
                ['Eggs This Month', eggsThisMonth],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border bg-white p-4 shadow-sm"
                >
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    {label}
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {Number(value).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </section>

            <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Mortality Rate
                </div>
                <div className="mt-2 text-2xl font-bold text-red-600">
                  {mortalityRate.toFixed(2)}%
                </div>
              </div>
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Egg Earnings
                </div>
                <div className="mt-2 text-2xl font-bold text-green-700">
                  {money(totalEarnings)}
                </div>
              </div>
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Payments Made
                </div>
                <div className="mt-2 text-2xl font-bold text-blue-700">
                  {money(totalPayments)}
                </div>
              </div>
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Outstanding Payable
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {money(outstanding)}
                </div>
              </div>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-xl border bg-white p-5 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Farmer Performance
                    </h2>
                    <p className="text-sm text-slate-500">
                      Farmers with current financial outstanding.
                    </p>
                  </div>
                  <Link
                    href="/bodhifarm/farmers"
                    className="text-sm font-semibold text-green-700"
                  >
                    View Farmers →
                  </Link>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-slate-500">
                        <th className="px-3 py-3">Farmer</th>
                        <th className="px-3 py-3 text-right">Earnings</th>
                        <th className="px-3 py-3 text-right">Expenses</th>
                        <th className="px-3 py-3 text-right">Payments</th>
                        <th className="px-3 py-3 text-right">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attentionFarmers.length ? (
                        attentionFarmers.map((f) => (
                          <tr
                            key={f.farmer_id}
                            className="border-b last:border-0"
                          >
                            <td className="px-3 py-3">
                              <div className="font-semibold">
                                {f.farmer_code || '—'}
                              </div>
                              <div className="text-xs text-slate-500">
                                {f.full_name || '—'}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right text-green-700">
                              {money(Number(f.egg_earnings || 0))}
                            </td>
                            <td className="px-3 py-3 text-right text-red-600">
                              {money(Number(f.expenses || 0))}
                            </td>
                            <td className="px-3 py-3 text-right text-blue-700">
                              {money(Number(f.payments || 0))}
                            </td>
                            <td className="px-3 py-3 text-right font-bold">
                              {money(Number(f.outstanding_balance || 0))}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-8 text-center text-slate-500"
                          >
                            No farmer has an outstanding payable balance.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">
                  Monthly Snapshot
                </h2>
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg bg-green-50 p-4">
                    <div className="text-xs font-semibold uppercase text-green-700">
                      Saleable Eggs
                    </div>
                    <div className="mt-1 text-xl font-bold text-green-800">
                      {eggsThisMonth.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4">
                    <div className="text-xs font-semibold uppercase text-red-700">
                      Mortality
                    </div>
                    <div className="mt-1 text-xl font-bold text-red-800">
                      {mortalityThisMonth.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4">
                    <div className="text-xs font-semibold uppercase text-blue-700">
                      Payments
                    </div>
                    <div className="mt-1 text-xl font-bold text-blue-800">
                      {money(paymentsThisMonth)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-4">
                    <div className="text-xs font-semibold uppercase text-slate-600">
                      Expenses / Recoveries
                    </div>
                    <div className="mt-1 text-xl font-bold text-slate-900">
                      {money(totalExpenses)}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Management Modules
                  </h2>
                  <p className="text-sm text-slate-500">
                    Quick access to the BodhiFarm operational system.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {modules.map(([href, title, description]) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-xl border p-4 transition hover:border-green-500 hover:bg-green-50"
                  >
                    <div className="font-bold text-slate-900">{title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {description}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Egg Production
                </h2>
                <div className="mt-4 space-y-3">
                  {recentEggs.map((egg) => {
                    const farmer = farmerMap.get(egg.farmer_id);
                    return (
                      <div
                        key={egg.id}
                        className="flex items-center justify-between border-b pb-3"
                      >
                        <div>
                          <div className="font-semibold">
                            {farmer?.farmer_id || '—'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatDate(egg.production_date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-700">
                            {Number(egg.saleable_eggs || 0)} saleable
                          </div>
                          <div className="text-xs text-slate-500">
                            {Number(egg.total_eggs || 0)} total
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {!recentEggs.length && (
                    <div className="text-sm text-slate-500">
                      No egg records found.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Veterinary
                </h2>
                <div className="mt-4 space-y-3">
                  {recentVet.map((record) => {
                    const farmer = farmerMap.get(record.farmer_id);
                    return (
                      <div
                        key={record.id}
                        className="border-b pb-3"
                      >
                        <div className="font-semibold">
                          {farmer?.farmer_id || '—'} —{' '}
                          {record.record_type || 'RECORD'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDate(record.record_date)} ·{' '}
                          {record.cause || 'No cause recorded'}
                        </div>
                        {Number(record.mortality_quantity || 0) > 0 && (
                          <div className="mt-1 text-xs font-semibold text-red-600">
                            Mortality: {record.mortality_quantity}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!recentVet.length && (
                    <div className="text-sm text-slate-500">
                      No veterinary records found.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Payments
                </h2>
                <div className="mt-4 space-y-3">
                  {recentPayments.map((payment) => {
                    const farmer = farmerMap.get(payment.farmer_id);
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between border-b pb-3"
                      >
                        <div>
                          <div className="font-semibold">
                            {farmer?.farmer_id || '—'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatDate(payment.payment_date)} ·{' '}
                            {payment.status}
                          </div>
                        </div>
                        <div className="font-bold text-blue-700">
                          {money(Number(payment.amount || 0))}
                        </div>
                      </div>
                    );
                  })}
                  {!recentPayments.length && (
                    <div className="text-sm text-slate-500">
                      No payment records found.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
