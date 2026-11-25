'use client';

import { FormEvent, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

type RecordKind = 'INPUT' | 'PRODUCTION' | 'SALE' | 'EXPENSE';

type ActivityRecord = {
  id: string;
  farm_id: string;
  record_type: RecordKind;
  activity_date: string;
  category: string | null;
  item_name: string;
  quantity: number | null;
  unit: string | null;
  unit_rate: number | null;
  amount: number;
  buyer_name: string | null;
  notes: string | null;
};

const kindLabels: Record<RecordKind, string> = {
  INPUT: 'Input used',
  PRODUCTION: 'Production',
  SALE: 'Sale',
  EXPENSE: 'Other cost',
};

const units = ['kg', 'g', 'litre', 'ml', 'piece', 'bag', 'packet', 'quintal', 'tonne', 'dozen', 'crate', 'box'];

function getInputCategories(farmType: string) {
  const type = farmType.toLowerCase();
  if (type.includes('mushroom')) return ['Spawn / seed', 'Substrate', 'Supplement', 'Fertilizer / compost', 'Disinfectant / medicine', 'Packaging', 'Labour', 'Other'];
  if (type.includes('fish') || type.includes('aquaculture')) return ['Fingerlings / seed', 'Fish feed', 'Fertilizer / lime', 'Medicine', 'Water testing', 'Fuel / electricity', 'Labour', 'Other'];
  if (/dairy|cattle|cow|buffalo|goat|sheep|pig|piggery|duck|poultry|beekeep|sericulture/.test(type)) return ['Animal / chicks / colony', 'Feed', 'Fodder', 'Seed', 'Fertilizer', 'Medicine / vaccine', 'Breeding', 'Equipment', 'Labour', 'Other'];
  return ['Seed / seedling', 'Fertilizer', 'Manure / compost', 'Pesticide', 'Medicine', 'Feed', 'Fingerlings / seed', 'Irrigation', 'Labour', 'Machinery / fuel', 'Packaging', 'Other'];
}

function getActivityLabels(farmType: string) {
  const type = farmType.toLowerCase();
  if (type.includes('mushroom')) return { production: 'Mushroom harvest', sale: 'Mushroom sales', productionHint: 'Record fresh or processed mushrooms produced.' };
  if (type.includes('fish') || type.includes('aquaculture')) return { production: 'Fish harvest', sale: 'Fish sales', productionHint: 'Record fish or other aquaculture output.' };
  if (/dairy|cow|buffalo/.test(type)) return { production: 'Milk / dairy production', sale: 'Milk / dairy sales', productionHint: 'Record milk, ghee, or other dairy output.' };
  if (/goat|sheep|pig|piggery|cattle/.test(type)) return { production: 'Livestock production', sale: 'Livestock sales', productionHint: 'Record animals, manure, or other livestock output.' };
  if (/poultry|duckery/.test(type)) return { production: 'Bird / egg production', sale: 'Bird / egg sales', productionHint: 'Record eggs, birds, or other poultry and duckery output.' };
  return { production: 'Harvest / production', sale: 'Produce sales', productionHint: 'Record crop, horticulture, or allied production.' };
}

function money(value: number) {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function FarmActivityTracker({ farmId, farmType }: { farmId: string; farmType: string }) {
  const supabase = createClient();
  const labels = getActivityLabels(farmType);
  const inputCategories = useMemo(() => getInputCategories(farmType), [farmType]);
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [recordType, setRecordType] = useState<RecordKind>('INPUT');
  const [activityDate, setActivityDate] = useState('');
  const [category, setCategory] = useState(inputCategories[0] || 'Other');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [unitRate, setUnitRate] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [notes, setNotes] = useState('');

  async function loadRecords() {
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from('farm_activity_records')
      .select('id, farm_id, record_type, activity_date, category, item_name, quantity, unit, unit_rate, amount, buyer_name, notes')
      .eq('farm_id', farmId)
      .order('activity_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (queryError) setError(`Could not load farm activity records: ${queryError.message}`);
    else {
      setRecords((data || []) as ActivityRecord[]);
      setError('');
    }
    setLoading(false);
  }

  const loadFromEffect = useEffectEvent(() => { void loadRecords(); });
  useEffect(() => {
    const timer = window.setTimeout(() => loadFromEffect(), 0);
    return () => window.clearTimeout(timer);
  }, [farmId]);

  const totalInputs = records.filter((record) => record.record_type === 'INPUT' || record.record_type === 'EXPENSE').reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const totalSales = records.filter((record) => record.record_type === 'SALE').reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const productionEntries = records.filter((record) => record.record_type === 'PRODUCTION').length;
  const productionByUnit = records.filter((record) => record.record_type === 'PRODUCTION' && record.quantity != null).reduce<Record<string, number>>((totals, record) => {
    const unit = record.unit || 'unit';
    totals[unit] = (totals[unit] || 0) + Number(record.quantity || 0);
    return totals;
  }, {});
  const productionSummary = Object.entries(productionByUnit).map(([unit, total]) => `${total.toLocaleString('en-IN')} ${unit}`).join(' · ') || `${productionEntries} entries`;
  const totalMargin = totalSales - totalInputs;
  const calculatedAmount = Number(quantity || 0) * Number(unitRate || 0);

  function resetForm() {
    setActivityDate('');
    setCategory(inputCategories[0] || 'Other');
    setItemName('');
    setQuantity('');
    setUnit('kg');
    setUnitRate('');
    setBuyerName('');
    setNotes('');
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    const enteredQuantity = quantity ? Number(quantity) : null;
    const enteredRate = unitRate ? Number(unitRate) : null;
    const amount = recordType === 'EXPENSE'
      ? Number(unitRate || 0)
      : recordType === 'INPUT' || recordType === 'SALE'
        ? Number(enteredQuantity || 0) * Number(enteredRate || 0)
        : 0;

    const { error: insertError } = await supabase.from('farm_activity_records').insert({
      farm_id: farmId,
      record_type: recordType,
      activity_date: activityDate,
      category: recordType === 'INPUT' || recordType === 'EXPENSE' ? category : null,
      item_name: itemName.trim(),
      quantity: recordType === 'EXPENSE' ? null : enteredQuantity,
      unit: recordType === 'EXPENSE' ? null : unit,
      unit_rate: recordType === 'PRODUCTION' ? null : enteredRate,
      amount,
      buyer_name: recordType === 'SALE' ? buyerName.trim() || null : null,
      notes: notes.trim() || null,
    });

    if (insertError) {
      setError(`Could not save this record: ${insertError.message}`);
      setSaving(false);
      return;
    }

    resetForm();
    setNotice(`${kindLabels[recordType]} saved.`);
    await loadRecords();
    setSaving(false);
  }

  async function removeRecord(record: ActivityRecord) {
    if (!window.confirm(`Delete the ${kindLabels[record.record_type].toLowerCase()} record for “${record.item_name}”?`)) return;
    const { error: deleteError } = await supabase.from('farm_activity_records').delete().eq('id', record.id).eq('farm_id', farmId);
    if (deleteError) {
      setError(`Could not delete this record: ${deleteError.message}`);
      return;
    }
    setNotice('Activity record deleted.');
    await loadRecords();
  }

  const typeOptions: { value: RecordKind; label: string }[] = [
    { value: 'INPUT', label: 'Input used' },
    { value: 'PRODUCTION', label: labels.production },
    { value: 'SALE', label: labels.sale },
    { value: 'EXPENSE', label: 'Other cost' },
  ];

  return (
    <section className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">{farmType || 'Farm activity'}</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Activity, production & sales</h2>
            <p className="mt-1 text-sm text-slate-600">Track inputs, output, sales and operating costs for this farm.</p>
          </div>
          <button type="button" onClick={() => void loadRecords()} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Refresh records</button>
        </div>
      </div>

      <div className="grid gap-3 border-b border-slate-200 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Production recorded" value={productionSummary} detail={`${productionEntries.toLocaleString('en-IN')} harvest / output records`} />
        <SummaryCard label="Input & other costs" value={money(totalInputs)} detail="Seeds, fertilizer, medicine and costs" />
        <SummaryCard label="Sales value" value={money(totalSales)} detail="Recorded sale proceeds" />
        <SummaryCard label="Sales less recorded costs" value={money(totalMargin)} detail="Operating view; excludes unrecorded costs" />
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.4fr)] lg:p-6">
        <form onSubmit={saveRecord} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div>
            <h3 className="font-bold text-slate-900">Add activity record</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">Keep one record per input, production event, sale, or cost.</p>
          </div>
          <label className="block text-sm font-semibold text-slate-700">Record type
            <select value={recordType} onChange={(event) => setRecordType(event.target.value as RecordKind)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">
              {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">Date
            <input type="date" required value={activityDate} onChange={(event) => setActivityDate(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal" />
          </label>
          {(recordType === 'INPUT' || recordType === 'EXPENSE') && <label className="block text-sm font-semibold text-slate-700">Cost category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">
              {(recordType === 'INPUT' ? inputCategories : ['Labour', 'Irrigation / water', 'Fuel / electricity', 'Machinery', 'Transport', 'Packaging', 'Repair', 'Other']).map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>}
          <label className="block text-sm font-semibold text-slate-700">{recordType === 'INPUT' ? 'Input or material name' : recordType === 'PRODUCTION' ? 'Product / output' : recordType === 'SALE' ? 'Product sold' : 'Cost description'}
            <input required maxLength={140} value={itemName} onChange={(event) => setItemName(event.target.value)} placeholder={recordType === 'INPUT' ? 'e.g. Oyster mushroom spawn' : recordType === 'PRODUCTION' ? 'e.g. Fresh oyster mushrooms' : recordType === 'SALE' ? 'e.g. Fresh oyster mushrooms' : 'e.g. Market transport'} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal" />
          </label>
          {recordType !== 'EXPENSE' && <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
            <label className="block text-sm font-semibold text-slate-700">Quantity
              <input type="number" min="0.001" step="0.001" required value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="0" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">Unit
              <select value={unit} onChange={(event) => setUnit(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">
                {units.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
          </div>}
          {(recordType === 'INPUT' || recordType === 'SALE' || recordType === 'EXPENSE') && <label className="block text-sm font-semibold text-slate-700">{recordType === 'SALE' ? `Selling price per ${unit}` : recordType === 'INPUT' ? `Cost per ${unit}` : 'Cost amount'}
            <input type="number" min="0" step="0.01" required value={unitRate} onChange={(event) => setUnitRate(event.target.value)} placeholder="0.00" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal" />
          </label>}
          {recordType === 'PRODUCTION' && <p className="rounded-lg bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">{labels.productionHint}</p>}
          {(recordType === 'INPUT' || recordType === 'SALE') && <p className="text-xs text-slate-600">Calculated value: <strong>{money(calculatedAmount)}</strong></p>}
          {recordType === 'SALE' && <label className="block text-sm font-semibold text-slate-700">Buyer / market (optional)
            <input maxLength={120} value={buyerName} onChange={(event) => setBuyerName(event.target.value)} placeholder="Buyer or market name" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal" />
          </label>}
          <label className="block text-sm font-semibold text-slate-700">Notes (optional)
            <textarea rows={2} maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Details, quality, or other useful information" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal" />
          </label>
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-emerald-800 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-900 disabled:opacity-60">{saving ? 'Saving…' : 'Save activity record'}</button>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        </form>

        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">Farm activity history</h3>
              <p className="mt-1 text-xs text-slate-500">Inputs, output, sales and costs recorded for this enterprise.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{records.length} records</span>
          </div>
          {loading ? <p className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">Loading activity records…</p> : records.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center"><p className="font-semibold text-slate-800">No activity records yet</p><p className="mt-1 text-sm text-slate-500">Start with the first input used, harvest, sale, or operating cost.</p></div> : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Date / type</th><th className="px-4 py-3">Activity</th><th className="px-4 py-3 text-right">Quantity</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">Value</th><th className="px-4 py-3">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {records.map((record) => <tr key={record.id} className="align-top hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3"><p className="font-medium text-slate-800">{new Date(`${record.activity_date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p><span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{record.record_type === 'PRODUCTION' ? labels.production : record.record_type === 'SALE' ? labels.sale : kindLabels[record.record_type]}</span></td>
                    <td className="px-4 py-3"><p className="font-semibold text-slate-900">{record.item_name}</p>{record.category && <p className="mt-1 text-xs text-slate-500">{record.category}</p>}{record.buyer_name && <p className="mt-1 text-xs text-slate-500">Buyer: {record.buyer_name}</p>}{record.notes && <p className="mt-1 max-w-xs whitespace-pre-wrap text-xs text-slate-500">{record.notes}</p>}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">{record.quantity == null ? '—' : `${Number(record.quantity).toLocaleString('en-IN')} ${record.unit || ''}`}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">{record.unit_rate == null ? '—' : money(Number(record.unit_rate))}</td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${record.record_type === 'SALE' ? 'text-emerald-800' : 'text-slate-800'}`}>{money(Number(record.amount || 0))}</td>
                    <td className="px-4 py-3"><button type="button" onClick={() => void removeRecord(record)} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-red-300 hover:text-red-700">Delete</button></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-slate-900">{value}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div>;
}
