'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';

type Farmer = { id: string; farmer_id: string | null; full_name: string | null; mobile: string | null; status: string | null; village?: string | null; district?: string | null };
type Farm = { id: string; farm_name: string | null; farm_type: string | null; land_area: number | null; land_unit: string | null; status: string | null };
type Activity = { id: string; farm_id: string; record_type: string; activity_date: string; category: string | null; item_name: string; quantity: number | null; unit: string | null; amount: number | null; buyer_name: string | null };

const money = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export default function Farmer360Page() {
  const params = useParams();
  const farmerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const supabase = createClient();
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadFarmer() {
    if (!farmerId) { setError('Farmer ID is missing.'); setLoading(false); return; }
    setLoading(true);
    setError('');
    const farmerResult = await supabase.from('farmers').select('id, farmer_id, full_name, mobile, status, village, district').eq('id', farmerId).maybeSingle();
    if (farmerResult.error) { setError(farmerResult.error.message); setLoading(false); return; }
    if (!farmerResult.data) { setError('Farmer record was not found or is not available to your account.'); setLoading(false); return; }
    setFarmer(farmerResult.data as Farmer);

    const farmsResult = await supabase.from('farms').select('id, farm_name, farm_type, land_area, land_unit, status').eq('farmer_id', farmerId).order('created_at', { ascending: false });
    if (farmsResult.error) { setError(`Could not load the farmer's farms: ${farmsResult.error.message}`); setLoading(false); return; }
    const farmRows = (farmsResult.data || []) as Farm[];
    setFarms(farmRows);
    const farmIds = farmRows.map((farm) => farm.id);
    if (!farmIds.length) { setActivities([]); setLoading(false); return; }
    const activityResult = await supabase.from('farm_activity_records').select('id, farm_id, record_type, activity_date, category, item_name, quantity, unit, amount, buyer_name').in('farm_id', farmIds).order('activity_date', { ascending: false }).order('created_at', { ascending: false });
    if (activityResult.error) setError(`Farm profiles loaded, but activity history could not be loaded: ${activityResult.error.message}`);
    else setActivities((activityResult.data || []) as Activity[]);
    setLoading(false);
  }

  const loadFromEffect = useEffectEvent(() => { void loadFarmer(); });
  useEffect(() => {
    const timer = window.setTimeout(() => loadFromEffect(), 0);
    return () => window.clearTimeout(timer);
  }, [farmerId]);

  const sales = activities.filter((row) => row.record_type === 'SALE').reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const costs = activities.filter((row) => row.record_type === 'INPUT' || row.record_type === 'EXPENSE').reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const productionRows = activities.filter((row) => row.record_type === 'PRODUCTION');
  const productionEntries = productionRows.length;
  const productionByUnit = productionRows.reduce<Record<string, number>>((totals, row) => {
    const unit = row.unit || 'unit';
    if (row.quantity != null) totals[unit] = (totals[unit] || 0) + Number(row.quantity);
    return totals;
  }, {});
  const productionSummary = Object.entries(productionByUnit).map(([unit, total]) => `${total.toLocaleString('en-IN')} ${unit}`).join(' · ') || `${productionEntries} entries`;

  return <main className="min-h-screen bg-[#f5f7f2] px-4 py-8 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <Link href="/bodhifarm/farmers" className="text-sm font-semibold text-emerald-800 hover:underline">← All farmers</Link>
      <header className="mt-5 rounded-3xl bg-emerald-950 p-7 text-white sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Farmer profile · 360°</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div><h1 className="text-3xl font-bold sm:text-4xl">{farmer?.full_name || (loading ? 'Loading farmer…' : 'Farmer profile')}</h1><p className="mt-2 text-emerald-100">{farmer?.farmer_id || 'Farmer ID pending'}{farmer?.mobile ? ` · ${farmer.mobile}` : ''}</p></div>
          {farmer && <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">{farmer.status || 'ACTIVE'}</span>}
        </div>
        {(farmer?.village || farmer?.district) && <p className="mt-4 text-sm text-emerald-100">{[farmer.village, farmer.district].filter(Boolean).join(', ')}</p>}
      </header>

      {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {loading ? <div className="mt-6 rounded-2xl bg-white p-10 text-center text-slate-600 shadow-sm">Loading farmer farms and records…</div> : farmer && <>
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Farm activities" value={farms.length} hint="Registered farm enterprises" />
          <SummaryCard label="Production recorded" value={productionSummary} hint={`${productionEntries} harvests and farm outputs`} />
          <SummaryCard label="Recorded sales" value={money(sales)} hint="Across all farm activities" />
          <SummaryCard label="Recorded input & costs" value={money(costs)} hint="Across all farm activities" />
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-2xl font-bold text-slate-900">All farm activities</h2><p className="mt-1 text-sm text-slate-600">Each enterprise keeps its own inputs, production, sales and cost records.</p></div><span className="text-sm text-slate-500">{farms.length} farms</span></div>
          {farms.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{farms.map((farm) => <article key={farm.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">{farm.farm_type || 'Agriculture & allied'}</p><h3 className="mt-1 text-xl font-bold text-slate-900">{farm.farm_name || 'Farm enterprise'}</h3></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{farm.status || 'ACTIVE'}</span></div>
            <p className="mt-3 text-sm text-slate-600">{farm.land_area != null ? `${farm.land_area} ${farm.land_unit || 'acres'}` : 'Area not recorded'}</p>
            <Link href={`/bodhifarm/farms/${farm.id}`} className="mt-5 inline-flex rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900">Open farm records →</Link>
          </article>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-semibold text-slate-800">No farms registered yet</p><p className="mt-1 text-sm text-slate-500">Add an enterprise such as crops, mushroom, dairy, fishery, poultry or another allied activity.</p></div>}
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 p-5"><h2 className="text-xl font-bold text-slate-900">Farmer activity history</h2><p className="mt-1 text-sm text-slate-600">A combined timeline from every registered farm.</p></div>
          {!activities.length ? <p className="p-8 text-center text-sm text-slate-500">No farm activity records have been added yet.</p> : <div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Farm</th><th className="px-5 py-3">Activity</th><th className="px-5 py-3 text-right">Quantity</th><th className="px-5 py-3 text-right">Value</th></tr></thead><tbody className="divide-y divide-slate-200">{activities.map((row) => { const farm = farms.find((item) => item.id === row.farm_id); return <tr key={row.id}><td className="whitespace-nowrap px-5 py-3">{new Date(`${row.activity_date}T00:00:00`).toLocaleDateString('en-IN')}</td><td className="px-5 py-3">{farm?.farm_name || farm?.farm_type || 'Farm'}</td><td className="px-5 py-3"><span className="font-semibold">{row.item_name}</span><span className="ml-2 text-xs text-slate-500">{row.record_type.toLowerCase().replace('_', ' ')}{row.category ? ` · ${row.category}` : ''}</span>{row.buyer_name && <p className="text-xs text-slate-500">Buyer: {row.buyer_name}</p>}</td><td className="whitespace-nowrap px-5 py-3 text-right">{row.quantity == null ? '—' : `${Number(row.quantity).toLocaleString('en-IN')} ${row.unit || ''}`}</td><td className="whitespace-nowrap px-5 py-3 text-right">{money(Number(row.amount || 0))}</td></tr>; })}</tbody></table></div>}
        </section>
      </>}
    </div>
  </main>;
}

function SummaryCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{hint}</p></article>;
}
