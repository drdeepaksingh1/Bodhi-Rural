'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

type Summary = {
  farmer_id: string;
  farmer_code: string | null;
  full_name: string | null;
  egg_earnings: number | null;
  expenses: number | null;
  payments: number | null;
  outstanding_balance: number | null;
  total_credit_recovered: number | null;
  outstanding_credit: number | null;
  available_credit: number | null;
  available_payable: number | null;
};

type Procurement = {
  id: string;
  farmer_id: string;
  collection_date: string;
  saleable_eggs: number;
  rate_per_egg: number;
  net_amount: number;
  status: string;
};

type Expense = {
  id: string;
  farmer_id: string;
  expense_date: string;
  expense_type: string;
  description: string | null;
  amount: number;
  status: string;
};

type Payment = {
  id: string;
  farmer_id: string;
  payment_date: string;
  amount: number;
  payment_mode: string;
  status: string;
};

type Farmer = {
  id: string;
  farmer_id: string;
  full_name: string;
};

export default function FinanceDashboardPage() {
  const supabase = createClient();

  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<'ALL' | 'MONTH'>('ALL');
  const [farmerSearch, setFarmerSearch] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');

    const [summaryRes, farmersRes, procurementRes, expenseRes, paymentRes] =
      await Promise.all([
        supabase
          .from('farmer_finance_summary')
          .select('*')
          .order('farmer_code'),
        supabase
          .from('farmers')
          .select('id, farmer_id, full_name')
          .order('farmer_id'),
        supabase
          .from('egg_procurement')
          .select(
            'id, farmer_id, collection_date, saleable_eggs, rate_per_egg, net_amount, status'
          )
          .order('collection_date', { ascending: false }),
        supabase
          .from('farmer_expenses')
          .select(
            'id, farmer_id, expense_date, expense_type, description, amount, status'
          )
          .order('expense_date', { ascending: false }),
        supabase
          .from('farmer_payments')
          .select('id, farmer_id, payment_date, amount, payment_mode, status')
          .order('payment_date', { ascending: false }),
      ]);

    const firstError =
      summaryRes.error ||
      farmersRes.error ||
      procurementRes.error ||
      expenseRes.error ||
      paymentRes.error;

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    setSummaries((summaryRes.data || []) as Summary[]);
    setFarmers((farmersRes.data || []) as Farmer[]);
    setProcurements((procurementRes.data || []) as Procurement[]);
    setExpenses((expenseRes.data || []) as Expense[]);
    setPayments((paymentRes.data || []) as Payment[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const farmerMap = useMemo(() => {
    const map = new Map<string, Farmer>();
    farmers.forEach((farmer) => map.set(farmer.id, farmer));
    return map;
  }, [farmers]);

  const monthStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);

  function inPeriod(date: string) {
    if (period === 'ALL') return true;
    return new Date(`${date}T00:00:00`) >= monthStart;
  }

  const approvedProcurements = useMemo(
    () =>
      procurements.filter(
        (x) => x.status === 'APPROVED' && inPeriod(x.collection_date)
      ),
    [procurements, period, monthStart]
  );

  const approvedExpenses = useMemo(
    () =>
      expenses.filter(
        (x) => x.status === 'APPROVED' && inPeriod(x.expense_date)
      ),
    [expenses, period, monthStart]
  );

  const paidPayments = useMemo(
    () =>
      payments.filter(
        (x) => x.status === 'PAID' && inPeriod(x.payment_date)
      ),
    [payments, period, monthStart]
  );

  const pendingPayments = useMemo(
    () =>
      payments.filter(
        (x) =>
          (x.status === 'PENDING' || x.status === 'APPROVED') &&
          inPeriod(x.payment_date)
      ),
    [payments, period, monthStart]
  );

  const pendingPaymentTotal = useMemo(
    () => pendingPayments.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [pendingPayments]
  );

  const kpis = useMemo(() => {
    const eggs = approvedProcurements.reduce(
      (sum, x) => sum + Number(x.saleable_eggs || 0),
      0
    );
    const procurement = approvedProcurements.reduce(
      (sum, x) => sum + Number(x.net_amount || 0),
      0
    );
    const expense = approvedExpenses.reduce(
      (sum, x) => sum + Number(x.amount || 0),
      0
    );
    const paymentsMade = paidPayments.reduce(
      (sum, x) => sum + Number(x.amount || 0),
      0
    );

    return { eggs, procurement, expense, paymentsMade };
  }, [approvedProcurements, approvedExpenses, paidPayments]);

  const financeTotals = useMemo(
    () =>
      summaries.reduce(
        (totals, row) => ({
          ledgerBalance:
            totals.ledgerBalance + Number(row.outstanding_balance || 0),
          creditRecovered:
            totals.creditRecovered + Number(row.total_credit_recovered || 0),
          outstandingCredit:
            totals.outstandingCredit + Number(row.outstanding_credit || 0),
          availableCredit:
            totals.availableCredit + Number(row.available_credit || 0),
          availablePayable:
            totals.availablePayable + Number(row.available_payable || 0),
        }),
        {
          ledgerBalance: 0,
          creditRecovered: 0,
          outstandingCredit: 0,
          availableCredit: 0,
          availablePayable: 0,
        }
      ),
    [summaries]
  );

  const farmerRows = useMemo(
    () =>
      summaries
        .map((x) => ({
          ...x,
          outstanding: Number(x.outstanding_balance || 0),
        }))
        .filter((row) => {
          const query = farmerSearch.trim().toLowerCase();
          if (!query) return true;
          return `${row.farmer_code || ''} ${row.full_name || ''}`
            .toLowerCase()
            .includes(query);
        })
        .sort((a, b) => b.outstanding - a.outstanding),
    [summaries, farmerSearch]
  );

  function money(value: number | null | undefined) {
    return `₹${Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function date(value: string) {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold text-green-700">BodhiFarm</div>
            <h1 className="text-3xl font-bold text-slate-900">
              Finance Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Procurement, expenses, credit recovery, farmer payments and outstanding liability.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('ALL')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                period === 'ALL'
                  ? 'bg-green-700 text-white'
                  : 'border border-slate-300 bg-white text-slate-700'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setPeriod('MONTH')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                period === 'MONTH'
                  ? 'bg-green-700 text-white'
                  : 'border border-slate-300 bg-white text-slate-700'
              }`}
            >
              This Month
            </button>
            <button
              onClick={loadData}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
            Loading finance dashboard...
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Saleable Eggs
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {kpis.eggs.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Egg Procurement
                </div>
                <div className="mt-2 text-2xl font-bold text-green-700">
                  {money(kpis.procurement)}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Approved Expenses
                </div>
                <div className="mt-2 text-2xl font-bold text-red-600">
                  {money(kpis.expense)}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Payments Made
                </div>
                <div className="mt-2 text-2xl font-bold text-blue-700">
                  {money(kpis.paymentsMade)}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Pending / Approved Settlements
                </div>
                <div className="mt-2 text-2xl font-bold text-amber-700">
                  {money(pendingPaymentTotal)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {pendingPayments.length.toLocaleString('en-IN')} payment requests awaiting payment
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Net Farmer Ledger Balance
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {money(financeTotals.ledgerBalance)}
                </div>
              </div>
            </section>

            <section className="mt-6">
              <div className="mb-3">
                <h2 className="text-xl font-bold text-slate-900">
                  Farmer Credit & Payable Position
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  All-time balances from the finance summary. Credit capacity is separate from farmer payable.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Credit Recovered
                  </div>
                  <div className="mt-2 text-2xl font-bold text-green-700">
                    {money(financeTotals.creditRecovered)}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Outstanding Feed Credit
                  </div>
                  <div className="mt-2 text-2xl font-bold text-red-600">
                    {money(financeTotals.outstandingCredit)}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Available Credit Capacity
                  </div>
                  <div className="mt-2 text-2xl font-bold text-blue-700">
                    {money(financeTotals.availableCredit)}
                  </div>
                </div>
                <div className="rounded-xl border bg-white p-5 shadow-sm">
                  <div className="text-xs font-semibold uppercase text-slate-500">
                    Available Farmer Payable
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {money(financeTotals.availablePayable)}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">
                  Farmer-wise Outstanding
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  All-time balances from the finance summary; search by farmer code or name.
                </p>
                <input
                  type="search"
                  value={farmerSearch}
                  onChange={(event) => setFarmerSearch(event.target.value)}
                  placeholder="Search farmer code or name"
                  className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
                />

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-slate-500">
                        <th className="px-3 py-3">Farmer</th>
                        <th className="px-3 py-3 text-right">Earnings</th>
                        <th className="px-3 py-3 text-right">Expenses</th>
                        <th className="px-3 py-3 text-right">Payments</th>
                        <th className="px-3 py-3 text-right">Credit Recovered</th>
                        <th className="px-3 py-3 text-right">Credit Outstanding</th>
                        <th className="px-3 py-3 text-right">Available Payable</th>
                        <th className="px-3 py-3 text-right">Ledger Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {farmerRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                            No matching farmer records found.
                          </td>
                        </tr>
                      ) : farmerRows.map((row) => (
                        <tr key={row.farmer_id} className="border-b last:border-0">
                          <td className="px-3 py-3">
                            <div className="font-semibold text-slate-800">
                              {row.farmer_code || '—'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {row.full_name || '—'}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right text-green-700">
                            {money(row.egg_earnings)}
                          </td>
                          <td className="px-3 py-3 text-right text-red-600">
                            {money(row.expenses)}
                          </td>
                          <td className="px-3 py-3 text-right text-blue-700">
                            {money(row.payments)}
                          </td>
                          <td className="px-3 py-3 text-right text-green-700">
                            {money(row.total_credit_recovered)}
                          </td>
                          <td className="px-3 py-3 text-right text-red-600">
                            {money(row.outstanding_credit)}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold">
                            {money(row.available_payable)}
                          </td>
                          <td className="px-3 py-3 text-right font-bold">
                            {money(row.outstanding)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">
                  Reconciliation
                </h2>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-green-50 p-4">
                    <span className="font-medium text-green-800">
                      Procurement credited
                    </span>
                    <span className="font-bold text-green-800">
                      {money(kpis.procurement)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-red-50 p-4">
                    <span className="font-medium text-red-800">
                      Approved expenses
                    </span>
                    <span className="font-bold text-red-800">
                      {money(kpis.expense)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-green-50 p-4">
                    <span className="font-medium text-green-800">
                      Feed credit recovered (all time)
                    </span>
                    <span className="font-bold text-green-800">
                      {money(financeTotals.creditRecovered)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-red-50 p-4">
                    <span className="font-medium text-red-800">
                      Outstanding feed credit
                    </span>
                    <span className="font-bold text-red-800">
                      {money(financeTotals.outstandingCredit)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4">
                    <span className="font-medium text-blue-800">
                      Payments released
                    </span>
                    <span className="font-bold text-blue-800">
                      {money(kpis.paymentsMade)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-slate-100 p-4">
                    <span className="font-medium text-slate-700">
                      Available farmer payable
                    </span>
                    <span className="font-bold text-slate-900">
                      {money(financeTotals.availablePayable)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Recent Egg Procurement
              </h2>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-slate-500">
                      <th className="px-3 py-3">Date</th>
                      <th className="px-3 py-3">Farmer</th>
                      <th className="px-3 py-3 text-right">Eggs</th>
                      <th className="px-3 py-3 text-right">Rate</th>
                      <th className="px-3 py-3 text-right">Net</th>
                      <th className="px-3 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedProcurements.slice(0, 20).map((row) => {
                      const farmer = farmerMap.get(row.farmer_id);
                      return (
                        <tr key={row.id} className="border-b last:border-0">
                          <td className="px-3 py-3">{date(row.collection_date)}</td>
                          <td className="px-3 py-3 font-semibold">
                            {farmer?.farmer_id || '—'} — {farmer?.full_name || '—'}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {Number(row.saleable_eggs).toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {money(row.rate_per_egg)}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-green-700">
                            {money(row.net_amount)}
                          </td>
                          <td className="px-3 py-3">{row.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">
                  Recent Expenses
                </h2>
                <div className="mt-4 space-y-3">
                  {approvedExpenses.slice(0, 10).map((row) => {
                    const farmer = farmerMap.get(row.farmer_id);
                    return (
                      <div
                        key={row.id}
                        className="flex items-center justify-between border-b pb-3"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">
                            {farmer?.farmer_id || '—'} — {row.expense_type}
                          </div>
                          <div className="text-xs text-slate-500">
                            {date(row.expense_date)} · {row.description || '—'}
                          </div>
                        </div>
                        <div className="font-bold text-red-600">
                          {money(row.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">
                  Recent Payments
                </h2>
                <div className="mt-4 space-y-3">
                  {paidPayments.slice(0, 10).map((row) => {
                    const farmer = farmerMap.get(row.farmer_id);
                    return (
                      <div
                        key={row.id}
                        className="flex items-center justify-between border-b pb-3"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">
                            {farmer?.farmer_id || '—'} — {row.payment_mode}
                          </div>
                          <div className="text-xs text-slate-500">
                            {date(row.payment_date)} · {row.status}
                          </div>
                        </div>
                        <div className="font-bold text-blue-700">
                          {money(row.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Finance Workflow
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                {[
                  ['01', 'Egg Procurement', 'Approved egg collection creates farmer earnings.'],
                  ['02', 'Expenses & Credit Recovery', 'Approved expenses debit the ledger. Feed-credit recovery is recorded separately against outstanding farmer credit.'],
                  ['03', 'Payment', 'Paid farmer settlements debit the ledger; pending and approved requests remain reserved, not paid.'],
                  ['04', 'Reconciliation', 'Credit minus debit gives outstanding balance.'],
                ].map(([no, title, text]) => (
                  <div key={no} className="rounded-lg bg-slate-50 p-4">
                    <div className="text-sm font-bold text-green-700">{no}</div>
                    <div className="mt-2 font-bold text-slate-900">{title}</div>
                    <div className="mt-1 text-xs text-slate-500">{text}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

