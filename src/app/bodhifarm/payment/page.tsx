'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

type Farmer = {
  id: string;
  farmer_id: string | null;
  full_name: string | null;
};

type Batch = {
  id: string;
  farmer_id: string;
  batch_code: string | null;
  current_quantity: number | null;
  status: string | null;
};

type Procurement = {
  id: string;
  farmer_id: string;
  batch_id: string | null;
  collection_date: string;
  saleable_eggs: number;
  rate_per_egg: number;
  gross_amount: number;
  quality_deduction: number;
  other_deduction: number;
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
  reference_number: string | null;
  status: string;
};

function getIndiaDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(new Date());
}

export default function FarmerPaymentsPage() {
  const supabase = createClient();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [procurementFarmer, setProcurementFarmer] = useState('');
  const [procurementBatch, setProcurementBatch] = useState('');
  const [collectionDate, setCollectionDate] = useState(getIndiaDate());
  const [saleableEggs, setSaleableEggs] = useState('');
  const [ratePerEgg, setRatePerEgg] = useState('6.50');
  const [qualityDeduction, setQualityDeduction] = useState('0');
  const [otherDeduction, setOtherDeduction] = useState('0');
  const [procurementRemarks, setProcurementRemarks] = useState('');

  const [expenseFarmer, setExpenseFarmer] = useState('');
  const [expenseBatch, setExpenseBatch] = useState('');
  const [expenseDate, setExpenseDate] = useState(getIndiaDate());
  const [expenseType, setExpenseType] = useState('FEED');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const [paymentFarmer, setPaymentFarmer] = useState('');
  const [paymentDate, setPaymentDate] = useState(getIndiaDate());
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('BANK');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentLast4, setPaymentLast4] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedProcurementBatches = useMemo(
    () => batches.filter((b) => b.farmer_id === procurementFarmer),
    [batches, procurementFarmer]
  );

  const selectedExpenseBatches = useMemo(
    () => batches.filter((b) => b.farmer_id === expenseFarmer),
    [batches, expenseFarmer]
  );

  const farmerName = (id: string) =>
    farmers.find((f) => f.id === id)?.full_name ||
    farmers.find((f) => f.id === id)?.farmer_id ||
    'Unknown Farmer';

  const procurementGross =
    Number(saleableEggs || 0) * Number(ratePerEgg || 0);

  const procurementNet =
    procurementGross -
    Number(qualityDeduction || 0) -
    Number(otherDeduction || 0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');

    const [farmerResult, batchResult, procurementResult, expenseResult, paymentResult] =
      await Promise.all([
        supabase
          .from('farmers')
          .select('id, farmer_id, full_name')
          .eq('status', 'ACTIVE')
          .order('farmer_id'),
        supabase
          .from('bird_batches')
          .select('id, farmer_id, batch_code, current_quantity, status')
          .order('placement_date', { ascending: false }),
        supabase
          .from('egg_procurement')
          .select(
            'id, farmer_id, batch_id, collection_date, saleable_eggs, rate_per_egg, gross_amount, quality_deduction, other_deduction, net_amount, status'
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
          .select(
            'id, farmer_id, payment_date, amount, payment_mode, reference_number, status'
          )
          .order('payment_date', { ascending: false }),
      ]);

    const firstError =
      farmerResult.error ||
      batchResult.error ||
      procurementResult.error ||
      expenseResult.error ||
      paymentResult.error;

    if (firstError) {
      setError(firstError.message);
    } else {
      setFarmers(farmerResult.data || []);
      setBatches(batchResult.data || []);
      setProcurements(procurementResult.data || []);
      setExpenses(expenseResult.data || []);
      setPayments(paymentResult.data || []);
    }

    setLoading(false);
  }

  async function currentUserId() {
    const { data } = await supabase.auth.getUser();
    return data.user?.id || null;
  }

  async function saveProcurement() {
    setMessage('');
    setError('');

    const eggs = Number(saleableEggs);
    const rate = Number(ratePerEgg);
    const quality = Number(qualityDeduction || 0);
    const other = Number(otherDeduction || 0);

    if (!procurementFarmer || !eggs || eggs < 1 || rate < 0) {
      setError('Select a farmer and enter valid saleable eggs and rate.');
      return;
    }

    if (procurementNet < 0) {
      setError('Deductions cannot exceed the gross procurement amount.');
      return;
    }

    setSaving(true);

    const userId = await currentUserId();

    const { error: insertError } = await supabase
      .from('egg_procurement')
      .insert({
        farmer_id: procurementFarmer,
        batch_id: procurementBatch || null,
        collection_date: collectionDate,
        saleable_eggs: eggs,
        rate_per_egg: rate,
        quality_deduction: quality,
        other_deduction: other,
        remarks: procurementRemarks || null,
        status: 'PENDING',
        created_by: userId,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setMessage('Egg procurement saved as PENDING.');
      setSaleableEggs('');
      setQualityDeduction('0');
      setOtherDeduction('0');
      setProcurementRemarks('');
      await loadData();
    }

    setSaving(false);
  }

  async function approveProcurement(id: string) {
    setMessage('');
    setError('');
    const userId = await currentUserId();

    const { error: updateError } = await supabase
      .from('egg_procurement')
      .update({
        status: 'APPROVED',
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'PENDING');

    if (updateError) setError(updateError.message);
    else {
      setMessage('Procurement approved and posted to farmer ledger.');
      await loadData();
    }
  }

  async function saveExpense() {
    setMessage('');
    setError('');

    const amount = Number(expenseAmount);

    if (!expenseFarmer || !amount || amount <= 0) {
      setError('Select a farmer and enter a valid expense amount.');
      return;
    }

    setSaving(true);
    const userId = await currentUserId();

    const { error: insertError } = await supabase
      .from('farmer_expenses')
      .insert({
        farmer_id: expenseFarmer,
        batch_id: expenseBatch || null,
        expense_date: expenseDate,
        expense_type: expenseType,
        description: expenseDescription || null,
        amount,
        status: 'APPROVED',
        created_by: userId,
        approved_by: userId,
        approved_at: new Date().toISOString(),
      });

    if (insertError) setError(insertError.message);
    else {
      setMessage('Farmer expense saved and posted to ledger.');
      setExpenseAmount('');
      setExpenseDescription('');
      await loadData();
    }

    setSaving(false);
  }

  async function savePayment() {
    setMessage('');
    setError('');

    const amount = Number(paymentAmount);

    if (!paymentFarmer || !amount || amount <= 0) {
      setError('Select a farmer and enter a valid payment amount.');
      return;
    }

    if ((paymentMode === 'BANK' || paymentMode === 'UPI') && !paymentReference) {
      setError('Enter the bank/UPI reference number.');
      return;
    }

    setSaving(true);
    const userId = await currentUserId();

    const { error: insertError } = await supabase
      .from('farmer_payments')
      .insert({
        farmer_id: paymentFarmer,
        payment_date: paymentDate,
        amount,
        payment_mode: paymentMode,
        reference_number: paymentReference || null,
        bank_account_last4: paymentLast4 || null,
        remarks: paymentRemarks || null,
        status: 'PENDING',
        created_by: userId,
      });

    if (insertError) setError(insertError.message);
    else {
      setMessage('Payment instruction saved as PENDING.');
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentLast4('');
      setPaymentRemarks('');
      await loadData();
    }

    setSaving(false);
  }

  async function markPaymentPaid(id: string) {
    setMessage('');
    setError('');
    const userId = await currentUserId();

    const { error: updateError } = await supabase
      .from('farmer_payments')
      .update({
        status: 'PAID',
        approved_by: userId,
        approved_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
      })
      .eq('id', id)
      .in('status', ['PENDING', 'APPROVED']);

    if (updateError) setError(updateError.message);
    else {
      setMessage('Payment marked PAID and posted to farmer ledger.');
      await loadData();
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl rounded-2xl bg-white p-10 text-center shadow-sm">
          Loading Farmer Payments & Settlement...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-sm font-semibold text-green-700">BodhiFarm</p>
            <h1 className="text-3xl font-bold text-slate-900">
              Farmer Payment & Settlement
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Egg procurement, recoveries, farmer ledger and payments.
            </p>
          </div>

          <button
            onClick={loadData}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {(message || error) && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              error
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-700'
            }`}
          >
            {error || message}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Pending Procurement" value={procurements.filter(p => p.status === 'PENDING').length} />
          <Metric label="Pending Payments" value={payments.filter(p => p.status === 'PENDING').length} />
          <Metric label="Paid Payments" value={`₹${payments.filter(p => p.status === 'PAID').reduce((s,p) => s + Number(p.amount || 0), 0).toFixed(2)}`} />
          <Metric label="Active Farmers" value={farmers.length} />
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">1. Egg Procurement</h2>
          <p className="mt-1 text-sm text-slate-500">
            Record farmer egg collection. Approval posts the net amount to the farmer ledger.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Farmer"
              value={procurementFarmer}
              onChange={(v) => {
                setProcurementFarmer(v);
                setProcurementBatch('');
              }}
              options={farmers.map(f => ({
                value: f.id,
                label: `${f.farmer_id || 'No ID'} — ${f.full_name || 'Unnamed'}`,
              }))}
            />

            <Select
              label="Batch"
              value={procurementBatch}
              onChange={setProcurementBatch}
              options={selectedProcurementBatches.map(b => ({
                value: b.id,
                label: b.batch_code || b.id,
              }))}
              allowBlank
            />

            <Input label="Collection Date" type="date" value={collectionDate} onChange={setCollectionDate} />
            <Input label="Saleable Eggs" type="number" value={saleableEggs} onChange={setSaleableEggs} />
            <Input label="Rate / Egg (₹)" type="number" value={ratePerEgg} onChange={setRatePerEgg} />
            <Input label="Quality Deduction (₹)" type="number" value={qualityDeduction} onChange={setQualityDeduction} />
            <Input label="Other Deduction (₹)" type="number" value={otherDeduction} onChange={setOtherDeduction} />
            <Input label="Remarks" value={procurementRemarks} onChange={setProcurementRemarks} />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Metric label="Gross" value={`₹${procurementGross.toFixed(2)}`} />
            <Metric label="Deductions" value={`₹${(Number(qualityDeduction || 0) + Number(otherDeduction || 0)).toFixed(2)}`} />
            <Metric label="Net Payable" value={`₹${Math.max(0, procurementNet).toFixed(2)}`} />
          </div>

          <button
            disabled={saving}
            onClick={saveProcurement}
            className="mt-5 rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Procurement'}
          </button>

          <div className="mt-6 overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th><Th>Farmer</Th><Th>Eggs</Th><Th>Rate</Th><Th>Net</Th><Th>Status</Th><Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {procurements.map(p => (
                  <tr key={p.id} className="border-t">
                    <Td>{p.collection_date}</Td>
                    <Td>{farmerName(p.farmer_id)}</Td>
                    <Td>{p.saleable_eggs}</Td>
                    <Td>₹{Number(p.rate_per_egg).toFixed(2)}</Td>
                    <Td>₹{Number(p.net_amount).toFixed(2)}</Td>
                    <Td>{p.status}</Td>
                    <Td>
                      {p.status === 'PENDING' ? (
                        <button
                          onClick={() => approveProcurement(p.id)}
                          className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Approve
                        </button>
                      ) : '—'}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">2. Farmer Expenses / Recoveries</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Farmer"
              value={expenseFarmer}
              onChange={(v) => {
                setExpenseFarmer(v);
                setExpenseBatch('');
              }}
              options={farmers.map(f => ({
                value: f.id,
                label: `${f.farmer_id || 'No ID'} — ${f.full_name || 'Unnamed'}`,
              }))}
            />
            <Select
              label="Batch"
              value={expenseBatch}
              onChange={setExpenseBatch}
              options={selectedExpenseBatches.map(b => ({
                value: b.id,
                label: b.batch_code || b.id,
              }))}
              allowBlank
            />
            <Input label="Date" type="date" value={expenseDate} onChange={setExpenseDate} />
            <Select
              label="Expense Type"
              value={expenseType}
              onChange={setExpenseType}
              options={[
                'FEED','BIRDS_CHICKS','MEDICINE','VETERINARY',
                'EQUIPMENT','ADVANCE_RECOVERY','OTHER'
              ].map(x => ({ value: x, label: x.replace('_', ' ') }))}
            />
            <Input label="Description" value={expenseDescription} onChange={setExpenseDescription} />
            <Input label="Amount (₹)" type="number" value={expenseAmount} onChange={setExpenseAmount} />
          </div>

          <button
            disabled={saving}
            onClick={saveExpense}
            className="mt-5 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Save Expense / Recovery
          </button>

          <div className="mt-6 overflow-x-auto">
            <Table>
              <thead>
                <tr><Th>Date</Th><Th>Farmer</Th><Th>Type</Th><Th>Description</Th><Th>Amount</Th><Th>Status</Th></tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id} className="border-t">
                    <Td>{e.expense_date}</Td>
                    <Td>{farmerName(e.farmer_id)}</Td>
                    <Td>{e.expense_type}</Td>
                    <Td>{e.description || '—'}</Td>
                    <Td>₹{Number(e.amount).toFixed(2)}</Td>
                    <Td>{e.status}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">3. Farmer Payment</h2>
          <p className="mt-1 text-sm text-slate-500">
            Save payment instruction as PENDING. Marking it PAID posts the payment to the farmer ledger.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Farmer"
              value={paymentFarmer}
              onChange={setPaymentFarmer}
              options={farmers.map(f => ({
                value: f.id,
                label: `${f.farmer_id || 'No ID'} — ${f.full_name || 'Unnamed'}`,
              }))}
            />
            <Input label="Payment Date" type="date" value={paymentDate} onChange={setPaymentDate} />
            <Input label="Amount (₹)" type="number" value={paymentAmount} onChange={setPaymentAmount} />
            <Select
              label="Payment Mode"
              value={paymentMode}
              onChange={setPaymentMode}
              options={['BANK','UPI','CASH'].map(x => ({ value: x, label: x }))}
            />
            <Input label="Reference / UTR" value={paymentReference} onChange={setPaymentReference} />
            <Input label="Bank A/C Last 4" value={paymentLast4} onChange={setPaymentLast4} maxLength={4} />
            <Input label="Remarks" value={paymentRemarks} onChange={setPaymentRemarks} />
          </div>

          <button
            disabled={saving}
            onClick={savePayment}
            className="mt-5 rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Save Payment Instruction
          </button>

          <div className="mt-6 overflow-x-auto">
            <Table>
              <thead>
                <tr><Th>Date</Th><Th>Farmer</Th><Th>Amount</Th><Th>Mode</Th><Th>Reference</Th><Th>Status</Th><Th>Action</Th></tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-t">
                    <Td>{p.payment_date}</Td>
                    <Td>{farmerName(p.farmer_id)}</Td>
                    <Td>₹{Number(p.amount).toFixed(2)}</Td>
                    <Td>{p.payment_mode}</Td>
                    <Td>{p.reference_number || '—'}</Td>
                    <Td>{p.status}</Td>
                    <Td>
                      {p.status === 'PENDING' || p.status === 'APPROVED' ? (
                        <button
                          onClick={() => markPaymentPaid(p.id)}
                          className="rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Mark PAID
                        </button>
                      ) : '—'}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </section>

        <section className="rounded-2xl bg-slate-900 p-6 text-white">
          <h2 className="text-xl font-bold">Settlement workflow</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              ['01', 'Egg Procurement', 'Record saleable eggs and rate'],
              ['02', 'Approval', 'Approve the earning'],
              ['03', 'Ledger', 'Automatic farmer credit'],
              ['04', 'Payment', 'Record and mark payment PAID'],
            ].map(([n, title, text]) => (
              <div key={n} className="rounded-xl bg-white/10 p-4">
                <div className="text-sm font-bold text-green-300">{n}</div>
                <div className="mt-1 font-semibold">{title}</div>
                <div className="mt-1 text-xs text-slate-300">{text}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  allowBlank = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allowBlank?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-600"
      >
        <option value="">
          {allowBlank ? 'Not linked' : `Select ${label}`}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return <table className="min-w-full text-left text-sm">{children}</table>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-3 font-semibold text-slate-500">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-3 text-slate-700">{children}</td>;
}

