'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

type Farmer = {
  id: string;
  farmer_id: string;
  full_name: string;
  mobile?: string | null;
  address?: string | null;
};

type LedgerEntry = {
  id: string;
  entry_date: string;
  entry_type: string;
  description: string | null;
  debit: number | null;
  credit: number | null;
};

export default function FarmerStatementPage() {
  const supabase = createClient();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statementLoading, setStatementLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadFarmers() {
      setLoading(true);
      const { data, error } = await supabase
        .from('farmers')
        .select('id, farmer_id, full_name, mobile, address')
        .eq('status', 'ACTIVE')
        .order('farmer_id');

      if (error) setError(error.message);
      else {
        setFarmers((data || []) as Farmer[]);
        if (data?.length) setSelectedFarmer(data[0].id);
      }
      setLoading(false);
    }

    loadFarmers();
  }, []);

  async function loadStatement() {
    if (!selectedFarmer) return;

    setStatementLoading(true);
    setError('');

    let query = supabase
      .from('farmer_ledger_entries')
      .select('id, entry_date, entry_type, description, debit, credit')
      .eq('farmer_id', selectedFarmer)
      .order('entry_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (fromDate) query = query.gte('entry_date', fromDate);
    if (toDate) query = query.lte('entry_date', toDate);

    const { data, error } = await query;

    if (error) {
      setError(error.message);
      setEntries([]);
    } else {
      setEntries((data || []) as LedgerEntry[]);
    }

    setStatementLoading(false);
  }

  useEffect(() => {
    if (selectedFarmer) loadStatement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFarmer]);

  const farmer = useMemo(
    () => farmers.find((f) => f.id === selectedFarmer),
    [farmers, selectedFarmer]
  );

  const rows = useMemo(() => {
    let balance = 0;

    return entries.map((entry) => {
      const credit = Number(entry.credit || 0);
      const debit = Number(entry.debit || 0);
      balance += credit - debit;
      return { ...entry, balance };
    });
  }, [entries]);

  const totals = useMemo(() => {
    const credit = entries.reduce((s, e) => s + Number(e.credit || 0), 0);
    const debit = entries.reduce((s, e) => s + Number(e.debit || 0), 0);
    return { credit, debit, closing: credit - debit };
  }, [entries]);

  function money(value: number) {
    return `₹${value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(value: string) {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function statementNo() {
    const today = new Date();
    return `BODHI-FS-${today.getFullYear()}${String(
      today.getMonth() + 1
    ).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${String(
      selectedFarmer || ''
    ).slice(0, 6).toUpperCase()}`;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 no-print flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold text-green-700">BodhiFarm</div>
            <h1 className="text-3xl font-bold text-slate-900">
              Farmer Statement
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Official farmer earnings, recoveries and payment statement.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadStatement}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Refresh
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="no-print mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="no-print mb-6 rounded-xl border bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Farmer
              </label>
              <select
                value={selectedFarmer}
                onChange={(e) => setSelectedFarmer(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
              >
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.farmer_id} — {f.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
              />
            </div>
          </div>

          <button
            onClick={loadStatement}
            className="mt-4 rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white"
          >
            Generate Statement
          </button>
        </section>

        {loading || statementLoading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-slate-500">
            Generating farmer statement...
          </div>
        ) : (
          <section className="statement rounded-xl border bg-white p-6 shadow-sm md:p-10">
            <header className="border-b pb-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src="/branding/bodhi-rural-logo.png"
                    alt="Bodhi Rural Livelihood and Agri Private Limited"
                    className="h-16 w-auto object-contain"
                  />
                </div>

                <div className="text-left md:text-right">
                  <h2 className="text-2xl font-bold text-slate-900">
                    FARMER STATEMENT
                  </h2>
                  <div className="mt-1 text-xs text-slate-500">
                    Statement No.: {statementNo()}
                  </div>
                  <div className="text-xs text-slate-500">
                    Generated: {formatDate(new Date().toISOString().slice(0, 10))}
                  </div>
                </div>
              </div>
            </header>

            <section className="mt-6 grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-5 md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Farmer ID
                </div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {farmer?.farmer_id || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Farmer Name
                </div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {farmer?.full_name || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Mobile
                </div>
                <div className="mt-1 text-sm text-slate-700">
                  {farmer?.mobile || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Statement Period
                </div>
                <div className="mt-1 text-sm text-slate-700">
                  {fromDate ? formatDate(fromDate) : 'Beginning'} —{' '}
                  {toDate ? formatDate(toDate) : 'Current'}
                </div>
              </div>
            </section>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b-2 text-left text-xs uppercase text-slate-500">
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Transaction</th>
                    <th className="px-3 py-3">Description</th>
                    <th className="px-3 py-3 text-right">Credit</th>
                    <th className="px-3 py-3 text-right">Debit</th>
                    <th className="px-3 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b">
                      <td className="px-3 py-3">{formatDate(row.entry_date)}</td>
                      <td className="px-3 py-3 font-semibold">
                        {row.entry_type.replaceAll('_', ' ')}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {row.description || '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-green-700">
                        {Number(row.credit || 0) > 0
                          ? money(Number(row.credit))
                          : '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-red-600">
                        {Number(row.debit || 0) > 0
                          ? money(Number(row.debit))
                          : '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-bold">
                        {money(row.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2">
                    <td colSpan={3} className="px-3 py-4 font-bold">
                      TOTAL
                    </td>
                    <td className="px-3 py-4 text-right font-bold text-green-700">
                      {money(totals.credit)}
                    </td>
                    <td className="px-3 py-4 text-right font-bold text-red-600">
                      {money(totals.debit)}
                    </td>
                    <td className="px-3 py-4 text-right font-bold">
                      {money(totals.closing)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-green-50 p-4">
                <div className="text-xs font-semibold uppercase text-green-700">
                  Total Earnings
                </div>
                <div className="mt-1 text-xl font-bold text-green-800">
                  {money(totals.credit)}
                </div>
              </div>
              <div className="rounded-lg bg-red-50 p-4">
                <div className="text-xs font-semibold uppercase text-red-700">
                  Total Debit / Recovery
                </div>
                <div className="mt-1 text-xl font-bold text-red-800">
                  {money(totals.debit)}
                </div>
              </div>
              <div className="rounded-lg bg-slate-100 p-4">
                <div className="text-xs font-semibold uppercase text-slate-600">
                  Closing Balance
                </div>
                <div className="mt-1 text-xl font-bold text-slate-900">
                  {money(totals.closing)}
                </div>
              </div>
            </section>

            <footer className="mt-12 border-t pt-6">
              <div className="flex flex-col gap-10 md:flex-row md:justify-between">
                <div className="text-xs text-slate-500">
                  This statement is generated from the BodhiFarm farmer ledger.
                </div>
                <div className="w-56 text-center">
                  <div className="border-t border-slate-400 pt-2 text-xs font-semibold text-slate-600">
                    Authorized Signatory
                  </div>
                </div>
              </div>
            </footer>
          </section>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .statement {
            border: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>
    </main>
  );
}

