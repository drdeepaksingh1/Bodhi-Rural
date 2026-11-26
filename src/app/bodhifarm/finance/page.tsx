'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
type FarmFinanceRecord = { id: string; record_type: string; activity_date: string; amount: number; quantity: number | null; unit: string | null; item_name: string };
type MarketplaceOverview = { order_count: number; gross_order_value: number; paid_order_count: number; paid_order_value: number; pending_order_count: number; pending_order_value: number; buyer_count: number; seller_count: number };
type MarketplaceSellerTotal = { seller_id: string; seller_name: string; seller_order_count: number; seller_order_value: number; paid_order_value: number; unpaid_order_value: number };
type StaffIdentifier = { id: string; staff_code: string; full_name: string; designation: string | null; department: string | null; employment_status: string };
type StaffPayroll = { id: string; staff_id: string; staff_code: string; full_name: string; designation: string | null; department: string | null; pay_period: string; base_pay: number; allowances: number; deductions: number; net_pay: number; status: string; payment_method: string | null; transaction_reference: string | null; paid_at: string | null };

export default function FinanceDashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const todayISO = new Date().toLocaleDateString('en-CA');
  const monthISO = `${todayISO.slice(0, 7)}-01`;

  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [farmFinanceRecords, setFarmFinanceRecords] = useState<FarmFinanceRecord[]>([]);
  const [marketplaceOverview, setMarketplaceOverview] = useState<MarketplaceOverview | null>(null);
  const [marketplaceSellers, setMarketplaceSellers] = useState<MarketplaceSellerTotal[]>([]);
  const [staff, setStaff] = useState<StaffIdentifier[]>([]);
  const [staffPayroll, setStaffPayroll] = useState<StaffPayroll[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [payPeriod, setPayPeriod] = useState(monthISO.slice(0, 7));
  const [basePay, setBasePay] = useState('');
  const [allowances, setAllowances] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('NEFT');
  const [paymentReference, setPaymentReference] = useState('');
  const [printPayrollId, setPrintPayrollId] = useState<string | null>(null);
  const [printSellerId, setPrintSellerId] = useState<string | null>(null);
  const [printIdentity, setPrintIdentity] = useState<{ kind: 'farmer' | 'staff'; id: string } | null>(null);
  const [payrollMessage, setPayrollMessage] = useState('');
  const [payrollError, setPayrollError] = useState('');
  const [payrollSaving, setPayrollSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<'ALL' | 'MONTH'>('ALL');
  const [farmerSearch, setFarmerSearch] = useState('');
  const [expandedFarmerId, setExpandedFarmerId] = useState<string | null>(null);
  const [printFarmerId, setPrintFarmerId] = useState<string | null>(null);
  const [statementFrom, setStatementFrom] = useState(monthISO);
  const [statementTo, setStatementTo] = useState(todayISO);

  const loadData = useCallback(async () => {

    const [summaryRes, farmersRes, procurementRes, expenseRes, paymentRes, farmActivityRes, marketplaceRes, marketplaceSellersRes, staffRes, payrollRes] =
      await Promise.all([
        supabase
          .from('farmer_finance_summary')
          .select('*')
          .order('farmer_code'),
        supabase
          .rpc('finance_farmer_identifiers'),
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
        supabase
          .from('farm_activity_records')
          .select('id, record_type, activity_date, amount, quantity, unit, item_name')
          .order('activity_date', { ascending: false }),
        supabase.rpc('finance_marketplace_overview'),
        supabase.rpc('finance_marketplace_seller_totals'),
        supabase.rpc('finance_staff_identifiers'),
        supabase.rpc('finance_staff_payroll_list'),
      ]);

    const firstError =
      summaryRes.error ||
      farmersRes.error ||
      procurementRes.error ||
      expenseRes.error ||
      paymentRes.error ||
      farmActivityRes.error ||
      marketplaceRes.error ||
      marketplaceSellersRes.error ||
      staffRes.error ||
      payrollRes.error;

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    setSummaries((summaryRes.data || []) as Summary[]);
    setFarmers((farmersRes.data || []).map((row: { id: string; farmer_code: string; full_name: string }) => ({ id: row.id, farmer_id: row.farmer_code, full_name: row.full_name })) as Farmer[]);
    setProcurements((procurementRes.data || []) as Procurement[]);
    setExpenses((expenseRes.data || []) as Expense[]);
    setPayments((paymentRes.data || []) as Payment[]);
    setFarmFinanceRecords((farmActivityRes.data || []) as FarmFinanceRecord[]);
    setMarketplaceOverview(((marketplaceRes.data || [])[0] || null) as MarketplaceOverview | null);
    setMarketplaceSellers((marketplaceSellersRes.data || []) as MarketplaceSellerTotal[]);
    setStaff((staffRes.data || []) as StaffIdentifier[]);
    setStaffPayroll((payrollRes.data || []) as StaffPayroll[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    if (!printFarmerId && !printPayrollId && !printSellerId && !printIdentity) return;
    const timer = window.setTimeout(() => window.print(), 300);
    const clearPrintSelection = () => { setPrintFarmerId(null); setPrintPayrollId(null); setPrintSellerId(null); setPrintIdentity(null); };
    window.addEventListener('afterprint', clearPrintSelection);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', clearPrintSelection);
    };
  }, [printFarmerId, printPayrollId, printSellerId, printIdentity]);

  const farmerMap = useMemo(() => {
    const map = new Map<string, Farmer>();
    farmers.forEach((farmer) => map.set(farmer.id, farmer));
    return map;
  }, [farmers]);

  const monthStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);

  const inPeriod = useCallback((date: string) => {
    if (period === 'ALL') return true;
    return new Date(`${date}T00:00:00`) >= monthStart;
  }, [period, monthStart]);

  const approvedProcurements = useMemo(
    () =>
      procurements.filter(
        (x) => x.status === 'APPROVED' && inPeriod(x.collection_date)
      ),
    [procurements, inPeriod]
  );

  const approvedExpenses = useMemo(
    () =>
      expenses.filter(
        (x) => x.status === 'APPROVED' && inPeriod(x.expense_date)
      ),
    [expenses, inPeriod]
  );

  const paidPayments = useMemo(
    () =>
      payments.filter(
        (x) => x.status === 'PAID' && inPeriod(x.payment_date)
      ),
    [payments, inPeriod]
  );

  const pendingPayments = useMemo(
    () =>
      payments.filter(
        (x) =>
          (x.status === 'PENDING' || x.status === 'APPROVED') &&
          inPeriod(x.payment_date)
      ),
    [payments, inPeriod]
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

  const enterpriseActivity = useMemo(() => {
    const rows = farmFinanceRecords.filter((row) => inPeriod(row.activity_date));
    return {
      records: rows.length,
      inputCost: rows.filter((row) => row.record_type === 'INPUT').reduce((sum, row) => sum + Number(row.amount || 0), 0),
      sales: rows.filter((row) => row.record_type === 'SALE').reduce((sum, row) => sum + Number(row.amount || 0), 0),
      otherCosts: rows.filter((row) => row.record_type === 'EXPENSE').reduce((sum, row) => sum + Number(row.amount || 0), 0),
      productionEntries: rows.filter((row) => row.record_type === 'PRODUCTION').length,
    };
  }, [farmFinanceRecords, inPeriod]);

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

  const farmerPositionCounts = useMemo(
    () => ({
      positivePayable: summaries.filter((row) => Number(row.available_payable || 0) > 0).length,
      negativeLedger: summaries.filter((row) => Number(row.outstanding_balance || 0) < 0).length,
    }),
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

  async function createPayroll(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPayrollError('');
    setPayrollMessage('');
    if (!selectedStaffId || !payPeriod || !basePay) {
      setPayrollError('Select an active staff member, pay month and base salary.');
      return;
    }
    const gross = Number(basePay) + Number(allowances || 0);
    const deductionsValue = Number(deductions || 0);
    if (![Number(basePay), Number(allowances || 0), deductionsValue].every(Number.isFinite) || Number(basePay) < 0 || Number(allowances || 0) < 0 || deductionsValue < 0 || deductionsValue > gross) {
      setPayrollError('Enter valid non-negative salary amounts. Deductions cannot exceed gross pay.');
      return;
    }
    setPayrollSaving(true);
    const { error: saveError } = await supabase.rpc('finance_create_staff_payroll', {
      p_staff_id: selectedStaffId,
      p_pay_period: `${payPeriod}-01`,
      p_base_pay: Number(basePay),
      p_allowances: Number(allowances || 0),
      p_deductions: deductionsValue,
    });
    if (saveError) {
      setPayrollError(saveError.message);
    } else {
      setPayrollMessage('Payroll record created. Print the payslip, then record payment only after the transfer is verified.');
      setBasePay('');
      setAllowances('0');
      setDeductions('0');
      await loadData();
    }
    setPayrollSaving(false);
  }

  async function markPayrollPaid(payrollId: string) {
    setPayrollError('');
    setPayrollMessage('');
    if (paymentMethod !== 'CASH' && !paymentReference.trim()) {
      setPayrollError('Enter the verified transfer reference before recording payment.');
      return;
    }
    const { error: paidError } = await supabase.rpc('finance_mark_staff_payroll_paid', {
      p_payroll_id: payrollId,
      p_payment_method: paymentMethod,
      p_transaction_reference: paymentReference.trim() || null,
    });
    if (paidError) {
      setPayrollError(paidError.message);
      return;
    }
    setPaymentReference('');
    setPayrollMessage('Verified salary payment recorded.');
    await loadData();
  }

  function exportFarmerStatement() {
    const headers = [
      'Farmer Code', 'Farmer Name', 'Egg Earnings', 'Approved Expenses',
      'Paid Payments', 'Credit Recovered', 'Outstanding Feed Credit',
      'Available Credit Capacity', 'Available Farmer Payable', 'Ledger Balance',
    ];
    const rows = summaries.map((row) => [
      row.farmer_code || '', row.full_name || '', row.egg_earnings || 0,
      row.expenses || 0, row.payments || 0, row.total_credit_recovered || 0,
      row.outstanding_credit || 0, row.available_credit || 0,
      row.available_payable || 0, row.outstanding_balance || 0,
    ]);
    const csvCell = (value: string | number) => {
      const text = String(value);
      const safe = /^[=+@-]/.test(text) && typeof value === 'string' ? `'${text}` : text;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bodhifarm-farmer-finance-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const printFarmer = summaries.find((row) => row.farmer_id === printFarmerId) || null;
  const printPayroll = staffPayroll.find((row) => row.id === printPayrollId) || null;
  const printSeller = marketplaceSellers.find((row) => row.seller_id === printSellerId) || null;
  const printFarmerIdentity = printIdentity?.kind === 'farmer' ? farmers.find((row) => row.id === printIdentity.id) || null : null;
  const printStaffIdentity = printIdentity?.kind === 'staff' ? staff.find((row) => row.id === printIdentity.id) || null : null;
  const withinStatementRange = (value: string) => value >= statementFrom && value <= statementTo;
  const printProcurements = printFarmerId
    ? procurements.filter((row) => row.farmer_id === printFarmerId && row.status === 'APPROVED' && withinStatementRange(row.collection_date))
    : [];
  const printExpenses = printFarmerId
    ? expenses.filter((row) => row.farmer_id === printFarmerId && row.status === 'APPROVED' && withinStatementRange(row.expense_date))
    : [];
  const printPayments = printFarmerId
    ? payments.filter((row) => row.farmer_id === printFarmerId && row.status === 'PAID' && withinStatementRange(row.payment_date))
    : [];
  const printPeriodTotals = {
    eggs: printProcurements.reduce((sum, row) => sum + Number(row.saleable_eggs || 0), 0),
    earnings: printProcurements.reduce((sum, row) => sum + Number(row.net_amount || 0), 0),
    expenses: printExpenses.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    payments: printPayments.reduce((sum, row) => sum + Number(row.amount || 0), 0),
  };

  function date(value: string) {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return (
    <>
    <style jsx global>{`
      @media print {
        body * { visibility: hidden !important; }
        .farmer-print-report, .farmer-print-report *, .payroll-print-report, .payroll-print-report *, .id-card-print-report, .id-card-print-report * { visibility: visible !important; }
        .farmer-print-report, .payroll-print-report { display: block !important; position: absolute; inset: 0; width: 100%; padding: 24px; background: white; color: #111827; }
        @page { size: A4; margin: 12mm; }
        .farmer-print-report table, .payroll-print-report table { width: 100%; border-collapse: collapse; }
        .farmer-print-report th, .farmer-print-report td, .payroll-print-report th, .payroll-print-report td { border: 1px solid #d1d5db; padding: 6px; font-size: 10px; text-align: left; }
        .payroll-print-report .print-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .farmer-print-report .print-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .payroll-print-report .print-metric { border: 1px solid #d1d5db; padding: 8px; }
        .farmer-print-report .print-metric { border: 1px solid #d1d5db; padding: 8px; }
        .payroll-print-report .print-section { margin-top: 18px; page-break-inside: avoid; }
        .id-card-print-report { display: block !important; position: absolute; inset: 0; }
        .farmer-id-card, .staff-id-card { width: 86mm; height: 54mm; border: 2px solid #14532d; border-radius: 12px; padding: 9mm; margin: 12mm auto; color: #111827; }
        .farmer-print-report .print-section { margin-top: 18px; page-break-inside: avoid; }
      }
      @media screen { .farmer-print-report, .payroll-print-report, .id-card-print-report { display: none; } }
    `}</style>
    {printFarmer && (
      <div className="farmer-print-report">
        <header style={{ borderBottom: '3px solid #15803d', paddingBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', letterSpacing: 2 }}>BODHIFARM</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0' }}>Farmer Financial Statement</h1>
          <div style={{ fontSize: 11, color: '#4b5563' }}>Generated on {new Date().toLocaleDateString('en-IN')} · Statement period: {date(statementFrom)} to {date(statementTo)}</div>
        </header>
        <section className="print-section">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Farmer Details</h2>
          <div className="print-grid">
            <div className="print-metric"><b>Farmer Code</b><div>{printFarmer.farmer_code || '—'}</div></div>
            <div className="print-metric"><b>Farmer Name</b><div>{printFarmer.full_name || '—'}</div></div>
            <div className="print-metric"><b>Farmer ID</b><div>{farmerMap.get(printFarmer.farmer_id)?.farmer_id || printFarmer.farmer_code || '—'}</div></div>
          </div>
        </section>
        <section className="print-section">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Selected Period Activity</h2>
          <div className="print-grid">
            {[
              ['Saleable eggs', printPeriodTotals.eggs], ['Egg earnings', printPeriodTotals.earnings],
              ['Approved expenses', printPeriodTotals.expenses], ['Paid payments', printPeriodTotals.payments],
            ].map(([label, value]) => <div className="print-metric" key={String(label)}><b>{label}</b><div>{typeof value === 'number' && String(label) === 'Saleable eggs' ? value.toLocaleString('en-IN') : money(Number(value || 0))}</div></div>)}
          </div>
        </section>
        <section className="print-section">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Current All-time Account Position</h2>
          <div className="print-grid">
            {[
              ['Egg earnings', printFarmer.egg_earnings], ['Approved expenses', printFarmer.expenses],
              ['Paid payments', printFarmer.payments], ['Credit recovered', printFarmer.total_credit_recovered],
              ['Outstanding feed credit', printFarmer.outstanding_credit], ['Available credit capacity', printFarmer.available_credit],
              ['Available farmer payable', printFarmer.available_payable], ['Ledger balance', printFarmer.outstanding_balance],
            ].map(([label, value]) => (
              <div className="print-metric" key={String(label)}><b>{label}</b><div>{money(Number(value || 0))}</div></div>
            ))}
          </div>
          <p style={{ fontSize: 10, marginTop: 8 }}>Note: Feed-credit recovery is maintained separately and is not deducted a second time from egg earnings in the farmer ledger. Available farmer payable is shown separately from credit capacity.</p>
        </section>
        <section className="print-section">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Approved Egg Procurement ({printProcurements.length})</h2>
          <table><thead><tr><th>Date</th><th>Saleable eggs</th><th>Rate / egg</th><th>Net amount</th></tr></thead><tbody>
            {printProcurements.map((row) => <tr key={row.id}><td>{date(row.collection_date)}</td><td>{row.saleable_eggs}</td><td>{money(row.rate_per_egg)}</td><td>{money(row.net_amount)}</td></tr>)}
            {printProcurements.length === 0 && <tr><td colSpan={4}>No approved procurement records</td></tr>}
          </tbody></table>
        </section>
        <section className="print-section">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Approved Expenses ({printExpenses.length})</h2>
          <table><thead><tr><th>Date</th><th>Expense type</th><th>Description</th><th>Amount</th></tr></thead><tbody>
            {printExpenses.map((row) => <tr key={row.id}><td>{date(row.expense_date)}</td><td>{row.expense_type}</td><td>{row.description || '—'}</td><td>{money(row.amount)}</td></tr>)}
            {printExpenses.length === 0 && <tr><td colSpan={4}>No approved expense records</td></tr>}
          </tbody></table>
        </section>
        <section className="print-section">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Paid Settlements ({printPayments.length})</h2>
          <table><thead><tr><th>Date</th><th>Payment mode</th><th>Status</th><th>Amount</th></tr></thead><tbody>
            {printPayments.map((row) => <tr key={row.id}><td>{date(row.payment_date)}</td><td>{row.payment_mode}</td><td>{row.status}</td><td>{money(row.amount)}</td></tr>)}
            {printPayments.length === 0 && <tr><td colSpan={4}>No paid settlement records</td></tr>}
          </tbody></table>
        </section>
        <footer style={{ marginTop: 24, borderTop: '1px solid #9ca3af', paddingTop: 10, fontSize: 10, color: '#4b5563' }}>BodhiFarm · System-generated financial statement · Verify against the official farmer ledger before payment or settlement.</footer>
      </div>
    )}
    {printPayroll && (
      <div className="payroll-print-report">
        <header style={{ borderBottom: '3px solid #15803d', paddingBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', letterSpacing: 2 }}>BODHI RURAL</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0' }}>Staff Payslip</h1>
          <div style={{ fontSize: 11, color: '#4b5563' }}>Pay period: {new Date(`${printPayroll.pay_period}T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} · Generated {new Date().toLocaleDateString('en-IN')}</div>
        </header>
        <section className="print-section"><h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Staff Details</h2>
          <div className="print-grid">
            <div className="print-metric"><b>Staff ID</b><div>{printPayroll.staff_code}</div></div>
            <div className="print-metric"><b>Name</b><div>{printPayroll.full_name}</div></div>
            <div className="print-metric"><b>Department / Designation</b><div>{printPayroll.department || '—'} · {printPayroll.designation || '—'}</div></div>
          </div>
        </section>
        <section className="print-section"><h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Earnings and Deductions</h2>
          <table><tbody>
            <tr><th>Base pay</th><td>{money(printPayroll.base_pay)}</td></tr>
            <tr><th>Allowances</th><td>{money(printPayroll.allowances)}</td></tr>
            <tr><th>Deductions</th><td>{money(printPayroll.deductions)}</td></tr>
            <tr><th>Net pay</th><td><b>{money(printPayroll.net_pay)}</b></td></tr>
            <tr><th>Payment status</th><td>{printPayroll.status === 'PAID' ? `Paid via ${printPayroll.payment_method || '—'} · Ref ${printPayroll.transaction_reference || '—'}` : 'Pending'}</td></tr>
          </tbody></table>
        </section>
        <footer style={{ marginTop: 24, borderTop: '1px solid #9ca3af', paddingTop: 10, fontSize: 10, color: '#4b5563' }}>System-generated payroll record. This payslip is not proof of a bank transfer unless the status is Paid and the transfer reference has been verified.</footer>
      </div>
    )}
    {printSeller && (
      <div className="payroll-print-report">
        <header style={{ borderBottom: '3px solid #15803d', paddingBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d', letterSpacing: 2 }}>BODHIMART</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0' }}>Seller Order-Value Statement</h1>
          <div style={{ fontSize: 11, color: '#4b5563' }}>Generated on {new Date().toLocaleDateString('en-IN')} · All recorded order history</div>
        </header>
        <section className="print-section"><h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Seller Details</h2><div className="print-grid">
          <div className="print-metric"><b>Seller / Shop</b><div>{printSeller.seller_name}</div></div>
          <div className="print-metric"><b>Seller ID</b><div>{printSeller.seller_id}</div></div>
          <div className="print-metric"><b>Order count</b><div>{Number(printSeller.seller_order_count).toLocaleString('en-IN')}</div></div>
        </div></section>
        <section className="print-section"><h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Order Values</h2><table><tbody>
          <tr><th>Total seller order value</th><td>{money(printSeller.seller_order_value)}</td></tr>
          <tr><th>Order value for buyer-paid orders</th><td>{money(printSeller.paid_order_value)}</td></tr>
          <tr><th>Order value for pending buyer payments</th><td>{money(printSeller.unpaid_order_value)}</td></tr>
        </tbody></table></section>
        <footer style={{ marginTop: 24, borderTop: '1px solid #9ca3af', paddingTop: 10, fontSize: 10, color: '#4b5563' }}>This is an order-value statement, not a tax invoice or proof that a seller payout was made. Reconcile it with order details and bank settlements.</footer>
      </div>
    )}
    {(printFarmerIdentity || printStaffIdentity) && (
      <div className="id-card-print-report">
        {printFarmerIdentity && <article className="farmer-id-card"><div style={{ color: '#15803d', fontWeight: 800, letterSpacing: 1 }}>BODHI RURAL · FARMER</div><h1 style={{ marginTop: 14, fontSize: 20, fontWeight: 800 }}>{printFarmerIdentity.full_name}</h1><p style={{ marginTop: 8, fontSize: 12 }}>Farmer ID: <b>{printFarmerIdentity.farmer_id}</b></p><p style={{ marginTop: 12, fontSize: 10, color: '#4b5563' }}>Identity card · Verify against the registered farmer record.</p></article>}
        {printStaffIdentity && <article className="staff-id-card"><div style={{ color: '#15803d', fontWeight: 800, letterSpacing: 1 }}>BODHI RURAL · STAFF</div><h1 style={{ marginTop: 14, fontSize: 20, fontWeight: 800 }}>{printStaffIdentity.full_name}</h1><p style={{ marginTop: 8, fontSize: 12 }}>Staff ID: <b>{printStaffIdentity.staff_code}</b></p><p style={{ marginTop: 6, fontSize: 11 }}>{printStaffIdentity.department || 'Team'} · {printStaffIdentity.designation || 'Staff'}</p><p style={{ marginTop: 12, fontSize: 10, color: '#4b5563' }}>Identity card · Return if found to Bodhi Rural.</p></article>}
      </div>
    )}
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold text-green-700">BodhiFarm</div>
            <h1 className="text-3xl font-bold text-slate-900">
              Enterprise-wide Finance Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Farm activity, marketplace buyers and sellers, farmer settlements, credit recovery and operating costs.
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
            <button
              type="button"
              onClick={exportFarmerStatement}
              disabled={loading || summaries.length === 0}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Download Farmer Statement
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
            <section className="mt-6 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900">All Enterprise & Marketplace Finance</h2>
                <p className="mt-1 text-sm text-slate-600">Includes farm inputs, production, sales and costs across crops, livestock, dairy, fisheries, mushrooms, poultry and allied activities. Marketplace figures cover buyer orders and seller order values.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-semibold uppercase text-slate-600">Farm input costs</p><p className="mt-2 text-2xl font-bold text-emerald-800">{money(enterpriseActivity.inputCost)}</p><p className="mt-1 text-xs text-slate-500">Seeds, fertilizer, feed, medicine and other inputs</p></div>
                <div className="rounded-xl bg-blue-50 p-4"><p className="text-xs font-semibold uppercase text-slate-600">Farm sales recorded</p><p className="mt-2 text-2xl font-bold text-blue-800">{money(enterpriseActivity.sales)}</p><p className="mt-1 text-xs text-slate-500">Across all registered farm enterprises</p></div>
                <div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-semibold uppercase text-slate-600">Other farm costs</p><p className="mt-2 text-2xl font-bold text-amber-800">{money(enterpriseActivity.otherCosts)}</p><p className="mt-1 text-xs text-slate-500">Operating expenses entered by farmers</p></div>
                <div className="rounded-xl bg-purple-50 p-4"><p className="text-xs font-semibold uppercase text-slate-600">Activity records</p><p className="mt-2 text-2xl font-bold text-purple-800">{enterpriseActivity.records}</p><p className="mt-1 text-xs text-slate-500">{enterpriseActivity.productionEntries} production entries in this period</p></div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border p-4"><p className="text-xs font-semibold uppercase text-slate-500">Marketplace orders</p><p className="mt-2 text-xl font-bold text-slate-900">{Number(marketplaceOverview?.order_count || 0).toLocaleString('en-IN')}</p><p className="text-xs text-slate-500">Gross order value {money(Number(marketplaceOverview?.gross_order_value || 0))}</p></div>
                <div className="rounded-xl border p-4"><p className="text-xs font-semibold uppercase text-slate-500">Buyer payments recorded</p><p className="mt-2 text-xl font-bold text-green-700">{money(Number(marketplaceOverview?.paid_order_value || 0))}</p><p className="text-xs text-slate-500">{Number(marketplaceOverview?.paid_order_count || 0)} orders marked paid</p></div>
                <div className="rounded-xl border p-4"><p className="text-xs font-semibold uppercase text-slate-500">Awaiting buyer payment</p><p className="mt-2 text-xl font-bold text-amber-700">{money(Number(marketplaceOverview?.pending_order_value || 0))}</p><p className="text-xs text-slate-500">{Number(marketplaceOverview?.pending_order_count || 0)} orders unpaid or pending</p></div>
                <div className="rounded-xl border p-4"><p className="text-xs font-semibold uppercase text-slate-500">Marketplace participants</p><p className="mt-2 text-xl font-bold text-slate-900">{Number(marketplaceOverview?.buyer_count || 0)} buyers · {Number(marketplaceOverview?.seller_count || 0)} sellers</p><p className="text-xs text-slate-500">Counts from recorded marketplace orders</p></div>
              </div>
              <div className="mt-6 overflow-x-auto">
                <h3 className="mb-3 font-bold text-slate-900">Seller order activity</h3>
                <table className="min-w-full text-sm">
                  <thead><tr className="border-b text-left text-xs uppercase text-slate-500"><th className="px-3 py-2">Seller</th><th className="px-3 py-2 text-right">Orders</th><th className="px-3 py-2 text-right">Order value</th><th className="px-3 py-2 text-right">Paid order value</th><th className="px-3 py-2 text-right">Unpaid order value</th><th className="px-3 py-2">Statement</th></tr></thead>
                  <tbody>
                    {marketplaceSellers.length ? marketplaceSellers.map((seller) => <tr key={seller.seller_id} className="border-b"><td className="px-3 py-3 font-medium">{seller.seller_name}</td><td className="px-3 py-3 text-right">{Number(seller.seller_order_count).toLocaleString('en-IN')}</td><td className="px-3 py-3 text-right">{money(seller.seller_order_value)}</td><td className="px-3 py-3 text-right text-green-700">{money(seller.paid_order_value)}</td><td className="px-3 py-3 text-right text-amber-700">{money(seller.unpaid_order_value)}</td><td className="px-3 py-3"><button type="button" onClick={() => setPrintSellerId(seller.seller_id)} className="rounded border px-2 py-1 text-xs font-semibold">Print statement</button></td></tr>) : <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">No seller orders recorded yet.</td></tr>}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-slate-500">Seller amounts are marketplace order values, not payout confirmations. A seller settlement is only complete after the transfer is verified and recorded.</p>
              </div>
              <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50 p-4">
                <h3 className="font-bold text-sky-950">Online payments and settlements</h3>
                <p className="mt-1 text-sm text-sky-900">The current checkout records manual / pay-on-delivery payments. Online UPI, cards and netbanking, plus automated farmer, seller and staff payouts, need an activated payment provider and secured production credentials before these can be enabled.</p>
                <p className="mt-2 text-xs text-sky-800">No card, UPI PIN, netbanking password or bank-account credentials are collected by this dashboard.</p>
              </div>
            </section>

            <section className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
              <div className="mb-4"><h2 className="text-xl font-bold text-slate-900">Staff payroll, payslips & identity cards</h2><p className="mt-1 text-sm text-slate-600">Create monthly payroll records, print payslips, and print basic farmer or staff ID cards. Record a salary as paid only after verifying the transfer.</p></div>
              {payrollMessage && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{payrollMessage}</div>}
              {payrollError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{payrollError}</div>}
              <form onSubmit={createPayroll} className="grid gap-4 md:grid-cols-5">
                <label className="text-xs font-semibold text-slate-600">Staff member<select value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">Select active staff</option>{staff.map((person) => <option key={person.id} value={person.id}>{person.staff_code} · {person.full_name}</option>)}</select></label>
                <label className="text-xs font-semibold text-slate-600">Pay month<input type="month" value={payPeriod} onChange={(e) => setPayPeriod(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required /></label>
                <label className="text-xs font-semibold text-slate-600">Base pay (₹)<input type="number" min="0" step="0.01" value={basePay} onChange={(e) => setBasePay(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" required /></label>
                <label className="text-xs font-semibold text-slate-600">Allowances (₹)<input type="number" min="0" step="0.01" value={allowances} onChange={(e) => setAllowances(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
                <label className="text-xs font-semibold text-slate-600">Deductions (₹)<input type="number" min="0" step="0.01" value={deductions} onChange={(e) => setDeductions(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
                <div className="md:col-span-5"><button type="submit" disabled={payrollSaving} className="rounded-lg bg-green-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{payrollSaving ? 'Saving…' : 'Create payroll record'}</button></div>
              </form>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">Farmer ID card<select id="farmer-card-select" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">Select farmer</option>{farmers.map((person) => <option key={person.id} value={person.id}>{person.farmer_id} · {person.full_name}</option>)}</select></label>
                <label className="text-xs font-semibold text-slate-600">Staff ID card<select id="staff-card-select" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">Select staff</option>{staff.map((person) => <option key={person.id} value={person.id}>{person.staff_code} · {person.full_name}</option>)}</select></label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => { const el = document.getElementById('farmer-card-select') as HTMLSelectElement | null; if (el?.value) setPrintIdentity({ kind: 'farmer', id: el.value }); }} className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-800">Print farmer ID card</button>
                <button type="button" onClick={() => { const el = document.getElementById('staff-card-select') as HTMLSelectElement | null; if (el?.value) setPrintIdentity({ kind: 'staff', id: el.value }); }} className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-800">Print staff ID card</button>
                <Link href="/bodhimart/orders" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Buyer order receipts</Link>
                <Link href="/bodhifarm/seller/orders" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Seller orders</Link>
              </div>
              <div className="mt-5 overflow-x-auto">
                <h3 className="mb-2 font-bold text-slate-900">Monthly payroll records</h3>
                <p className="mb-3 text-xs text-slate-500">Payslips are internal payroll records, not proof of transfer. Online salary payment is not enabled; record payment only after confirming it through your bank.</p>
                <table className="min-w-full text-sm">
                  <thead><tr className="border-b text-left text-xs uppercase text-slate-500"><th className="px-3 py-2">Pay period · Staff</th><th className="px-3 py-2 text-right">Base + allowances</th><th className="px-3 py-2 text-right">Deductions</th><th className="px-3 py-2 text-right">Net pay</th><th className="px-3 py-2">Status / reference</th><th className="px-3 py-2">Actions</th></tr></thead>
                  <tbody>{staffPayroll.length ? staffPayroll.map((record) => <tr key={record.id} className="border-b"><td className="px-3 py-3"><b>{record.staff_code} · {record.full_name}</b><div className="text-xs text-slate-500">{new Date(`${record.pay_period}T00:00:00`).toLocaleDateString('en-IN',{month:'long',year:'numeric'})} · {record.department || '—'}</div></td><td className="px-3 py-3 text-right">{money(Number(record.base_pay)+Number(record.allowances))}</td><td className="px-3 py-3 text-right">{money(record.deductions)}</td><td className="px-3 py-3 text-right font-semibold">{money(record.net_pay)}</td><td className="px-3 py-3">{record.status}{record.transaction_reference && <div className="text-xs text-slate-500">{record.payment_method} · {record.transaction_reference}</div>}</td><td className="px-3 py-3"><button type="button" onClick={() => setPrintPayrollId(record.id)} className="rounded border px-2 py-1 text-xs font-semibold">Print payslip</button>{record.status === 'PENDING' && <div className="mt-2 flex flex-wrap gap-1"><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="rounded border px-2 py-1 text-xs"><option>NEFT</option><option>RTGS</option><option>IMPS</option><option>UPI</option><option>CHEQUE</option><option>CASH</option><option>OTHER</option></select><input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Verified ref." className="w-28 rounded border px-2 py-1 text-xs" /><button type="button" onClick={() => void markPayrollPaid(record.id)} className="rounded bg-green-700 px-2 py-1 text-xs font-semibold text-white">Record paid</button></div>}</td></tr>) : <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">No payroll records yet.</td></tr>}</tbody>
                </table>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Poultry · Saleable Eggs
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {kpis.eggs.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Poultry · Egg Procurement
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

            <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-lg font-bold text-slate-900">Farmer Balance Alerts</h2>
              <p className="mt-1 text-sm text-slate-600">
                These are all-time farmer-level indicators. A negative ledger balance means ledger debits exceed credits; available payable is separately calculated after payment reservations.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-white p-4">
                  <div className="text-xs font-semibold uppercase text-slate-500">Farmers with positive payable</div>
                  <div className="mt-1 text-2xl font-bold text-green-700">{farmerPositionCounts.positivePayable.toLocaleString('en-IN')}</div>
                </div>
                <div className="rounded-lg bg-white p-4">
                  <div className="text-xs font-semibold uppercase text-slate-500">Farmers with negative ledger balance</div>
                  <div className="mt-1 text-2xl font-bold text-red-700">{farmerPositionCounts.negativeLedger.toLocaleString('en-IN')}</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-600">
                Feed-credit outstanding is a separate credit account balance. It is not deducted a second time from egg earnings in the farmer ledger.
              </p>
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
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-600">Statement from
                    <input type="date" value={statementFrom} max={statementTo} onChange={(event) => setStatementFrom(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">Statement to
                    <input type="date" value={statementTo} min={statementFrom} max={todayISO} onChange={(event) => setStatementTo(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                </div>
                <p className="mt-2 text-xs text-slate-500">Print / Save PDF uses this date range for procurement, expenses and paid settlements. The account-position figures remain current all-time balances.</p>
                <button
                  type="button"
                  onClick={exportFarmerStatement}
                  className="mt-3 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                >
                  Download Farmer-wise CSV
                </button>
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
                      ) : farmerRows.flatMap((row) => [
                        <tr key={row.farmer_id} className="border-b last:border-0">
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => setExpandedFarmerId(expandedFarmerId === row.farmer_id ? null : row.farmer_id)}
                              className="text-left font-semibold text-green-800 underline decoration-dotted underline-offset-2"
                            >
                              {row.farmer_code || '—'}
                            </button>
                            <div className="text-xs text-slate-500">{row.full_name || '—'}</div>
                            <button type="button" onClick={() => setPrintFarmerId(row.farmer_id)} disabled={!statementFrom || !statementTo || statementFrom > statementTo} className="mt-1 rounded border border-green-700 px-2 py-1 text-[11px] font-semibold text-green-800 hover:bg-green-50 disabled:opacity-50">Print / Save PDF</button>
                            {row.outstanding < 0 && (
                              <span className="mt-1 inline-block rounded bg-red-50 px-2 py-1 text-[10px] font-bold uppercase text-red-700">Negative ledger</span>
                            )}
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
                        </tr>,
                      expandedFarmerId === row.farmer_id ? (
                        <tr key={`${row.farmer_id}-details`} className="bg-slate-50">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              <div>
                                <div className="mb-2 text-xs font-bold uppercase text-slate-600">Approved procurement</div>
                                {procurements.filter((item) => item.farmer_id === row.farmer_id && item.status === 'APPROVED').slice(0, 5).map((item) => (
                                  <div key={item.id} className="border-b py-1 text-xs text-slate-600">{date(item.collection_date)} · {Number(item.saleable_eggs || 0)} eggs · {money(item.net_amount)}</div>
                                ))}
                                {procurements.filter((item) => item.farmer_id === row.farmer_id && item.status === 'APPROVED').length === 0 && <div className="text-xs text-slate-400">No approved procurement</div>}
                              </div>
                              <div>
                                <div className="mb-2 text-xs font-bold uppercase text-slate-600">Approved expenses</div>
                                {expenses.filter((item) => item.farmer_id === row.farmer_id && item.status === 'APPROVED').slice(0, 5).map((item) => (
                                  <div key={item.id} className="border-b py-1 text-xs text-slate-600">{date(item.expense_date)} · {item.expense_type} · {money(item.amount)}</div>
                                ))}
                                {expenses.filter((item) => item.farmer_id === row.farmer_id && item.status === 'APPROVED').length === 0 && <div className="text-xs text-slate-400">No approved expenses</div>}
                              </div>
                              <div>
                                <div className="mb-2 text-xs font-bold uppercase text-slate-600">Paid payments</div>
                                {payments.filter((item) => item.farmer_id === row.farmer_id && item.status === 'PAID').slice(0, 5).map((item) => (
                                  <div key={item.id} className="border-b py-1 text-xs text-slate-600">{date(item.payment_date)} · {item.payment_mode} · {money(item.amount)}</div>
                                ))}
                                {payments.filter((item) => item.farmer_id === row.farmer_id && item.status === 'PAID').length === 0 && <div className="text-xs text-slate-400">No paid payments</div>}
                              </div>
                            </div>
                            <p className="mt-3 text-[11px] text-slate-500">Showing up to five records per category. These are existing source transactions; this view does not modify them.</p>
                          </td>
                        </tr>
                      ) : null,
                      ])}
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
                Recent Egg Procurement (Poultry Specialist)
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
                  Recent Farmer Payments
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
    </>
  );
}

