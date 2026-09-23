'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';

type Farmer = {
  id: string;
  farmer_id: string;
  full_name: string;
  mobile: string | null;
  status: string | null;
};

type Farm = {
  id: string;
  farmer_id: string;
  farm_name: string | null;
  farm_type: string | null;
  shed_capacity: number | null;
  status: string | null;
};

type BirdBatch = {
  id: string;
  farmer_id: string;
  farm_id: string | null;
  batch_code: string;
  breed: string;
  bird_type: string | null;
  placement_date: string;
  initial_quantity: number | null;
  current_quantity: number | null;
  mortality_quantity: number | null;
  status: string | null;
};

type EggRecord = {
  id: string;
  production_date: string;
  total_eggs: number | null;
  saleable_eggs: number | null;
  cracked_eggs: number | null;
  damaged_eggs: number | null;
};

type FeedRecord = {
  id: string;
  record_date: string;
  feed_type: string | null;
  quantity_kg: number | null;
  total_cost: number | null;
};

type VeterinaryRecord = {
  id: string;
  record_date: string | null;
  record_type: string | null;
  mortality_quantity: number | null;
  cause: string | null;
  diagnosis: string | null;
  treatment: string | null;
  veterinary_name: string | null;
};

type Application = {
  state_id: string | null;
  district_id: string | null;
  block_id: string | null;
  panchayat_id: string | null;
  village_id: string | null;
  aadhaar_number: string | null;
  aadhaar_document_url: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_account_number: string | null;
  ifsc_code: string | null;
  bank_passbook_url: string | null;
  farmer_photo_url: string | null;
  created_at: string | null;
};

type LocationRow = {
  id: string;
  name: string;
  location_type: string;
};

type Credit = {
  credit_limit: number | null;
  outstanding: number | null;
  available_credit: number | null;
  status: string | null;
};

type Activity = {
  date: string;
  title: string;
  detail: string;
};

export default function Farmer360ProfilePage() {
  const params = useParams();
  const farmerUuid = Array.isArray(params.id) ? params.id[0] : params.id;
  const supabase = createClient();

  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [batches, setBatches] = useState<BirdBatch[]>([]);
  const [eggs, setEggs] = useState<EggRecord[]>([]);
  const [feeds, setFeeds] = useState<FeedRecord[]>([]);
  const [veterinary, setVeterinary] = useState<VeterinaryRecord[]>([]);
  const [application, setApplication] = useState<Application | null>(null);
  const [locations, setLocations] = useState<Record<string, string>>({});
  const [credit, setCredit] = useState<Credit | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (farmerUuid) loadFarmerProfile();
  }, [farmerUuid]);

  async function loadFarmerProfile() {
    setLoading(true);
    setError('');

    try {
      const [
        farmerResult,
        farmsResult,
        batchesResult,
        eggsResult,
        feedsResult,
        veterinaryResult,
        applicationResult,
        creditResult,
      ] = await Promise.all([
        supabase.from('farmers').select('id, farmer_id, full_name, mobile, status').eq('id', farmerUuid).single(),
        supabase.from('farms').select('id, farmer_id, farm_name, farm_type, shed_capacity, status').eq('farmer_id', farmerUuid).order('farm_name'),
        supabase.from('bird_batches').select('id, farmer_id, farm_id, batch_code, breed, bird_type, placement_date, initial_quantity, current_quantity, mortality_quantity, status').eq('farmer_id', farmerUuid).order('placement_date', { ascending: false }),
        supabase.from('egg_production').select('id, production_date, total_eggs, saleable_eggs, cracked_eggs, damaged_eggs').eq('farmer_id', farmerUuid).order('production_date', { ascending: false }),
        supabase.from('feed_records').select('id, record_date, feed_type, quantity_kg, total_cost').eq('farmer_id', farmerUuid).order('record_date', { ascending: false }),
        supabase.from('veterinary_records').select('id, record_date, record_type, mortality_quantity, cause, diagnosis, treatment, veterinary_name').eq('farmer_id', farmerUuid).order('record_date', { ascending: false }),
        supabase.from('farmer_applications').select('state_id, district_id, block_id, panchayat_id, village_id, aadhaar_number, aadhaar_document_url, bank_name, bank_branch, bank_account_number, ifsc_code, bank_passbook_url, farmer_photo_url, created_at').eq('farmer_id', farmerUuid).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('farmer_credit').select('credit_limit, outstanding, available_credit, status').eq('farmer_id', farmerUuid).maybeSingle(),
      ]);

      if (farmerResult.error) throw new Error(farmerResult.error.message);
      if (farmsResult.error) throw new Error(farmsResult.error.message);
      if (batchesResult.error) throw new Error(batchesResult.error.message);
      if (eggsResult.error) throw new Error(eggsResult.error.message);
      if (feedsResult.error) throw new Error(feedsResult.error.message);
      if (veterinaryResult.error) throw new Error(veterinaryResult.error.message);
      if (applicationResult.error) throw new Error(applicationResult.error.message);
      if (creditResult.error && creditResult.error.code !== 'PGRST116') throw new Error(creditResult.error.message);

      setFarmer(farmerResult.data);
      setFarms(farmsResult.data || []);
      setBatches(batchesResult.data || []);
      setEggs(eggsResult.data || []);
      setFeeds(feedsResult.data || []);
      setVeterinary(veterinaryResult.data || []);
      setApplication(applicationResult.data || null);
      setCredit(creditResult.data || null);

      const ids = [
        applicationResult.data?.state_id,
        applicationResult.data?.district_id,
        applicationResult.data?.block_id,
        applicationResult.data?.panchayat_id,
        applicationResult.data?.village_id,
      ].filter(Boolean) as string[];

      if (ids.length) {
        const locationResult = await supabase.from('locations').select('id, name, location_type').in('id', ids);
        if (locationResult.error) throw new Error(locationResult.error.message);
        const map: Record<string, string> = {};
        (locationResult.data || []).forEach((row: LocationRow) => { map[row.id] = row.name; });
        setLocations(map);
      }

      const nextActivities: Activity[] = [];

      if (applicationResult.data?.created_at) {
        nextActivities.push({
          date: applicationResult.data.created_at,
          title: 'Farmer registration',
          detail: 'Farmer application record created.',
        });
      }

      (farmsResult.data || []).forEach((farm) => {
        nextActivities.push({
          date: new Date().toISOString(),
          title: 'Farm registered',
          detail: farm.farm_name || 'Unnamed farm',
        });
      });

      (batchesResult.data || []).forEach((batch) => {
        nextActivities.push({
          date: batch.placement_date,
          title: `Batch ${batch.batch_code} placed`,
          detail: `${Number(batch.initial_quantity || 0).toLocaleString('en-IN')} birds · ${batch.breed}`,
        });
      });

      (eggsResult.data || []).forEach((egg) => {
        nextActivities.push({
          date: egg.production_date,
          title: 'Egg production',
          detail: `${Number(egg.total_eggs || 0).toLocaleString('en-IN')} eggs recorded.`,
        });
      });

      (feedsResult.data || []).forEach((feed) => {
        nextActivities.push({
          date: feed.record_date,
          title: 'Feed entry',
          detail: `${Number(feed.quantity_kg || 0).toFixed(2)} kg ${feed.feed_type || 'feed'}.`,
        });
      });

      (veterinaryResult.data || []).forEach((record) => {
        if (record.record_date) {
          nextActivities.push({
            date: record.record_date,
            title: record.record_type || 'Veterinary record',
            detail: `Mortality: ${Number(record.mortality_quantity || 0)}${record.cause ? ` · ${record.cause}` : ''}`,
          });
        }
      });

      setActivities(
        nextActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load farmer profile.');
    } finally {
      setLoading(false);
    }
  }

  const totalInitialBirds = batches.reduce((s, b) => s + Number(b.initial_quantity || 0), 0);
  const totalLiveBirds = batches.reduce((s, b) => s + Number(b.current_quantity || 0), 0);
  const totalMortality = batches.reduce((s, b) => s + Number(b.mortality_quantity || 0), 0);
  const mortalityRate = totalInitialBirds > 0 ? (totalMortality / totalInitialBirds) * 100 : 0;
  const totalEggs = eggs.reduce((s, e) => s + Number(e.total_eggs || 0), 0);
  const totalSaleableEggs = eggs.reduce((s, e) => s + Number(e.saleable_eggs || 0), 0);
  const totalCracked = eggs.reduce((s, e) => s + Number(e.cracked_eggs || 0), 0);
  const totalDamaged = eggs.reduce((s, e) => s + Number(e.damaged_eggs || 0), 0);
  const saleableRate = totalEggs > 0 ? (totalSaleableEggs / totalEggs) * 100 : 0;
  const totalFeedKg = feeds.reduce((s, f) => s + Number(f.quantity_kg || 0), 0);
  const totalFeedCost = feeds.reduce((s, f) => s + Number(f.total_cost || 0), 0);
  const feedPerLiveBird = totalLiveBirds > 0 ? totalFeedKg / totalLiveBirds : 0;
  const feedCostPerEgg = totalEggs > 0 ? totalFeedCost / totalEggs : 0;

  const kyc = useMemo(() => ({
    aadhaar: Boolean(application?.aadhaar_document_url || application?.aadhaar_number),
    bank: Boolean(application?.bank_name && application?.bank_account_number && application?.ifsc_code),
    passbook: Boolean(application?.bank_passbook_url),
    photo: Boolean(application?.farmer_photo_url),
  }), [application]);

  if (loading) {
    return <main className="min-h-screen bg-slate-50"><div className="mx-auto max-w-7xl px-4 py-12"><div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">Loading Farmer 360° Profile...</div></div></main>;
  }

  if (error || !farmer) {
    return <main className="min-h-screen bg-slate-50"><div className="mx-auto max-w-3xl px-4 py-12"><div className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 className="font-bold text-red-800">Farmer Profile Not Found</h1><p className="mt-2 text-sm text-red-700">{error || 'The requested farmer could not be found.'}</p><Link href="/bodhifarm/farmers" className="mt-5 inline-block rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white">← Back to Farmers</Link></div></div></main>;
  }

  const locationItems = [
    ['State', application?.state_id ? locations[application.state_id] : null],
    ['District', application?.district_id ? locations[application.district_id] : null],
    ['Block', application?.block_id ? locations[application.block_id] : null],
    ['Panchayat', application?.panchayat_id ? locations[application.panchayat_id] : null],
    ['Village', application?.village_id ? locations[application.village_id] : null],
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/bodhifarm/farmers" className="mb-3 inline-block text-sm font-semibold text-green-700">← Back to Farmer Management</Link>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">{farmer.farmer_id}</span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{farmer.status || 'ACTIVE'}</span>
                </div>
                <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{farmer.full_name}</h1>
                <p className="mt-1 text-sm text-slate-500">{farmer.mobile || 'Mobile number not available'}</p>
              </div>
              <button onClick={loadFarmerProfile} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Refresh Profile</button>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard label="Farms" value={farms.length} />
          <MetricCard label="Bird Batches" value={batches.length} />
          <MetricCard label="Live Birds" value={totalLiveBirds} valueClass="text-green-700" />
          <MetricCard label="Mortality" value={totalMortality} valueClass="text-red-600" />
          <MetricCard label="Total Eggs" value={totalEggs} valueClass="text-amber-600" />
          <MetricCard label="Saleable Eggs" value={totalSaleableEggs} valueClass="text-green-700" />
          <MetricCard label="Feed Consumed" value={`${totalFeedKg.toFixed(2)} kg`} valueClass="text-orange-600" />
          <MetricCard label="Feed Cost" value={`₹${totalFeedCost.toFixed(2)}`} valueClass="text-purple-700" />
        </div>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Farmer Information</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem label="Farmer ID" value={farmer.farmer_id} />
            <InfoItem label="Full Name" value={farmer.full_name} />
            <InfoItem label="Mobile" value={farmer.mobile || 'Not available'} />
            <InfoItem label="Status" value={farmer.status || 'ACTIVE'} />
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Location</h2>
          <p className="mt-1 text-sm text-slate-500">Registered farmer location.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {locationItems.map(([label, value]) => <InfoItem key={label} label={label} value={value || 'Not available'} />)}
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">KYC & Document Status</h2>
          <p className="mt-1 text-sm text-slate-500">Status only. Sensitive document numbers are not displayed.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatusCard label="Aadhaar" ok={kyc.aadhaar} />
            <StatusCard label="Bank Details" ok={kyc.bank} />
            <StatusCard label="Bank Passbook" ok={kyc.passbook} />
            <StatusCard label="Farmer Photo" ok={kyc.photo} />
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Financial Overview</h2>
          <p className="mt-1 text-sm text-slate-500">Credit information currently available for this farmer.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Credit Limit" value={credit ? `₹${Number(credit.credit_limit || 0).toLocaleString('en-IN')}` : 'Not set'} />
            <MetricCard label="Outstanding" value={credit ? `₹${Number(credit.outstanding || 0).toLocaleString('en-IN')}` : 'Not set'} valueClass="text-red-600" />
            <MetricCard label="Available Credit" value={credit ? `₹${Number(credit.available_credit || 0).toLocaleString('en-IN')}` : 'Not set'} valueClass="text-green-700" />
            <MetricCard label="Credit Status" value={credit?.status || 'Not set'} />
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Purchase and payment totals are not displayed here yet because the current profile source does not establish a complete farmer-level financial transaction aggregation.
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div><h2 className="text-xl font-bold text-slate-900">Farms</h2><p className="mt-1 text-sm text-slate-500">Farms registered under this farmer.</p></div>
            <Link href="/bodhifarm/farms" className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white">Manage Farms</Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {farms.length === 0 ? <div className="rounded-xl bg-amber-50 p-5 text-sm text-amber-700">No farm registered for this farmer.</div> : farms.map(farm => {
              const farmBatches = batches.filter(b => b.farm_id === farm.id);
              const live = farmBatches.reduce((s,b)=>s+Number(b.current_quantity||0),0);
              return <div key={farm.id} className="rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-900">{farm.farm_name || 'Unnamed Farm'}</h3><p className="mt-1 text-sm text-slate-500">{farm.farm_type || 'Farm type not specified'}</p></div><span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">{farm.status || 'ACTIVE'}</span></div>
                <div className="mt-4 grid grid-cols-2 gap-3"><InfoItem label="Shed Capacity" value={Number(farm.shed_capacity||0)} /><InfoItem label="Batches" value={farmBatches.length} /><InfoItem label="Live Birds" value={live} /><InfoItem label="Status" value={farm.status || 'ACTIVE'} /></div>
              </div>;
            })}
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900">Bird Batches</h2><p className="mt-1 text-sm text-slate-500">Complete flock information.</p></div><Link href="/bodhifarm" className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white">Manage Batches</Link></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {batches.length === 0 ? <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">No bird batches registered.</div> : batches.map(batch => {
              const farm = farms.find(f => f.id === batch.farm_id);
              return <div key={batch.id} className="rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-green-700">Batch {batch.batch_code}</p><h3 className="mt-1 font-semibold text-slate-900">{batch.breed}</h3><p className="mt-1 text-xs text-slate-500">{batch.bird_type || 'Bird type not specified'}</p></div><span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">{batch.status || 'ACTIVE'}</span></div>
                <div className="mt-5 grid grid-cols-2 gap-3"><InfoItem label="Farm" value={farm?.farm_name || 'Farm not assigned'} /><InfoItem label="Placement" value={formatDate(batch.placement_date)} /><InfoItem label="Initial" value={Number(batch.initial_quantity||0)} /><InfoItem label="Live" value={Number(batch.current_quantity||0)} /><InfoItem label="Mortality" value={Number(batch.mortality_quantity||0)} /><InfoItem label="Mortality %" value={`${percentage(Number(batch.mortality_quantity||0), Number(batch.initial_quantity||0)).toFixed(2)}%`} /></div>
              </div>;
            })}
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900">Performance Summary</h2><p className="mt-1 text-sm text-slate-500">Aggregated operational performance.</p></div><Link href="/bodhifarm/performance" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Open Performance Dashboard</Link></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PerformanceCard label="Mortality Rate" value={`${mortalityRate.toFixed(2)}%`} description="Mortality against initial birds" />
            <PerformanceCard label="Saleable Egg Rate" value={`${saleableRate.toFixed(2)}%`} description="Saleable eggs / total eggs" />
            <PerformanceCard label="Eggs / Live Bird" value={(totalLiveBirds ? totalEggs/totalLiveBirds : 0).toFixed(2)} description="Total eggs per current live bird" />
            <PerformanceCard label="Feed / Live Bird" value={`${feedPerLiveBird.toFixed(3)} kg`} description="Recorded feed per live bird" />
            <PerformanceCard label="Feed Cost / Egg" value={`₹${feedCostPerEgg.toFixed(2)}`} description="Recorded feed cost per egg" />
            <PerformanceCard label="Veterinary Records" value={veterinary.length} description="Health and veterinary records" />
            <PerformanceCard label="Recorded Vet Mortality" value={veterinary.reduce((s,r)=>s+Number(r.mortality_quantity||0),0)} description="Mortality in veterinary records" />
            <PerformanceCard label="Egg Records" value={eggs.length} description="Production records" />
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900">Egg Production</h2><p className="mt-1 text-sm text-slate-500">Recent production records.</p></div><Link href="/bodhifarm/egg-production" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Manage Eggs</Link></div>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4"><MiniCard label="Total" value={totalEggs}/><MiniCard label="Saleable" value={totalSaleableEggs}/><MiniCard label="Cracked" value={totalCracked}/><MiniCard label="Damaged" value={totalDamaged}/></div>
          <div className="mt-5 space-y-2">{eggs.slice(0,5).map(egg=><div key={egg.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{formatDate(egg.production_date)}</p><p className="text-xs text-slate-500">Total {Number(egg.total_eggs||0)} · Saleable {Number(egg.saleable_eggs||0)}</p></div><div className="text-sm text-slate-600">Cracked: {Number(egg.cracked_eggs||0)} · Damaged: {Number(egg.damaged_eggs||0)}</div></div>)}</div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900">Feed Management</h2><p className="mt-1 text-sm text-slate-500">Recent feed consumption and cost.</p></div><Link href="/bodhifarm/feed" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Manage Feed</Link></div>
          <div className="mt-5 grid grid-cols-2 gap-4"><MiniCard label="Total Feed" value={`${totalFeedKg.toFixed(2)} kg`}/><MiniCard label="Total Cost" value={`₹${totalFeedCost.toFixed(2)}`}/></div>
          <div className="mt-5 space-y-2">{feeds.slice(0,5).map(feed=><div key={feed.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{formatDate(feed.record_date)}</p><p className="text-xs text-slate-500">{feed.feed_type || 'Feed'}</p></div><div className="text-sm font-semibold text-slate-700">{Number(feed.quantity_kg||0).toFixed(2)} kg · ₹{Number(feed.total_cost||0).toFixed(2)}</div></div>)}</div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900">Veterinary & Mortality</h2><p className="mt-1 text-sm text-slate-500">Recent health, treatment and mortality records.</p></div><Link href="/bodhifarm/veterinary" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Manage Veterinary</Link></div>
          <div className="mt-5 space-y-3">{veterinary.slice(0,5).map(record=><div key={record.id} className="rounded-lg border border-slate-200 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{record.record_type || 'Veterinary Record'}</p><p className="text-xs text-slate-500">{record.record_date ? formatDate(record.record_date) : 'Date not available'}</p></div><span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">Mortality: {Number(record.mortality_quantity||0)}</span></div><div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><p><strong>Cause:</strong> {record.cause || '—'}</p><p><strong>Diagnosis:</strong> {record.diagnosis || '—'}</p><p><strong>Treatment:</strong> {record.treatment || '—'}</p><p><strong>Veterinary:</strong> {record.veterinary_name || '—'}</p></div></div>)}</div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Activity Timeline</h2>
          <p className="mt-1 text-sm text-slate-500">Recent operational events for this farmer.</p>
          <div className="mt-5 space-y-3">
            {activities.length === 0 ? <p className="text-sm text-slate-500">No activity records available.</p> : activities.map((item, index) => (
              <div key={`${item.date}-${item.title}-${index}`} className="flex gap-4 rounded-xl border border-slate-200 p-4">
                <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-green-600" />
                <div className="min-w-0"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p className="font-semibold text-slate-900">{item.title}</p><span className="text-xs text-slate-500">{formatDate(item.date)}</span></div><p className="mt-1 text-sm text-slate-600">{item.detail}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Link href="/bodhifarm" className="rounded-lg bg-green-700 px-4 py-3 text-center text-sm font-semibold text-white">Bird Batches</Link>
            <Link href="/bodhifarm/egg-production" className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700">Egg Production</Link>
            <Link href="/bodhifarm/feed" className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700">Feed</Link>
            <Link href="/bodhifarm/veterinary" className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700">Veterinary</Link>
            <Link href="/bodhifarm/performance" className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700">Performance</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value, valueClass='text-slate-900' }: { label:string; value:string|number; valueClass?:string }) {
  return <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold sm:text-3xl ${valueClass}`}>{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</p></div>;
}

function InfoItem({ label, value }: { label:string; value:string|number }) {
  return <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-words font-semibold text-slate-900">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</p></div>;
}

function PerformanceCard({ label, value, description }: { label:string; value:string|number; description:string }) {
  return <div className="rounded-xl border border-slate-200 p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</p><p className="mt-1 text-xs text-slate-400">{description}</p></div>;
}

function MiniCard({ label, value }: { label:string; value:string|number }) {
  return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</p></div>;
}

function StatusCard({ label, ok }: { label:string; ok:boolean }) {
  return <div className={`rounded-xl border p-4 ${ok ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}><p className="text-sm font-semibold text-slate-900">{label}</p><p className={`mt-2 text-sm font-bold ${ok ? 'text-green-700' : 'text-amber-700'}`}>{ok ? 'Available / Uploaded' : 'Pending'}</p></div>;
}

function formatDate(value: string) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function percentage(numerator:number, denominator:number) {
  return denominator > 0 ? (numerator / denominator) * 100 : 0;
}
