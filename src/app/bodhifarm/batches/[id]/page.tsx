'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';

type Farmer = {
  id: string;
  farmer_id: string | null;
  full_name: string | null;
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
  batch_code: string | null;
  breed: string | null;
  bird_type: string | null;
  placement_date: string | null;
  initial_quantity: number | null;
  current_quantity: number | null;
  mortality_quantity: number | null;
  source: string | null;
  status: string | null;
};

type EggRecord = {
  id: string;
  batch_id: string | null;
  production_date: string | null;
  total_eggs: number | null;
  cracked_eggs: number | null;
  damaged_eggs: number | null;
  saleable_eggs: number | null;
};

type FeedRecord = {
  id: string;
  batch_id: string | null;
  record_date: string | null;
  feed_type: string | null;
  quantity_kg: number | null;
  unit_cost: number | null;
  total_cost: number | null;
};

type VeterinaryRecord = {
  id: string;
  bird_batch_id: string | null;
  record_date: string | null;
  record_type: string | null;
  mortality_quantity: number | null;
  cause: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  treatment: string | null;
  veterinary_name: string | null;
  veterinary_visit: boolean | null;
  follow_up_date: string | null;
  medicine_quantity: number | null;
};

export default function BirdBatch360() {
  const params = useParams();
  const batchId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const supabase = createClient();

  const [batch, setBatch] = useState<BirdBatch | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);

  const [eggs, setEggs] = useState<EggRecord[]>([]);
  const [feeds, setFeeds] = useState<FeedRecord[]>([]);
  const [veterinary, setVeterinary] = useState<VeterinaryRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadBatch360() {
    if (!batchId) {
      setError('Bird batch ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const { data: batchData, error: batchError } =
      await supabase
        .from('bird_batches')
        .select(
          `
          id,
          farmer_id,
          farm_id,
          batch_code,
          breed,
          bird_type,
          placement_date,
          initial_quantity,
          current_quantity,
          mortality_quantity,
          source,
          status
          `
        )
        .eq('id', batchId)
        .single();

    if (batchError || !batchData) {
      setError(
        batchError?.message ||
          'Bird batch could not be found.'
      );
      setLoading(false);
      return;
    }

    setBatch(batchData);

    const [
      farmerResult,
      farmResult,
      eggsResult,
      feedResult,
      veterinaryResult,
    ] = await Promise.all([
      supabase
        .from('farmers')
        .select(
          'id, farmer_id, full_name, mobile, status'
        )
        .eq('id', batchData.farmer_id)
        .maybeSingle(),

      batchData.farm_id
        ? supabase
            .from('farms')
            .select(
              'id, farmer_id, farm_name, farm_type, shed_capacity, status'
            )
            .eq('id', batchData.farm_id)
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),

      supabase
        .from('egg_production')
        .select(
          `
          id,
          batch_id,
          production_date,
          total_eggs,
          cracked_eggs,
          damaged_eggs,
          saleable_eggs
          `
        )
        .eq('batch_id', batchId)
        .order('production_date', {
          ascending: false,
        }),

      supabase
        .from('feed_records')
        .select(
          `
          id,
          batch_id,
          record_date,
          feed_type,
          quantity_kg,
          unit_cost,
          total_cost
          `
        )
        .eq('batch_id', batchId)
        .order('record_date', {
          ascending: false,
        }),

      supabase
        .from('veterinary_records')
        .select(
          `
          id,
          bird_batch_id,
          record_date,
          record_type,
          mortality_quantity,
          cause,
          symptoms,
          diagnosis,
          treatment,
          veterinary_name,
          veterinary_visit,
          follow_up_date,
          medicine_quantity
          `
        )
        .eq('bird_batch_id', batchId)
        .order('record_date', {
          ascending: false,
        }),
    ]);

    if (farmerResult.data) {
      setFarmer(farmerResult.data);
    }

    if (farmResult.data) {
      setFarm(farmResult.data);
    }

    if (eggsResult.data) {
      setEggs(eggsResult.data);
    }

    if (feedResult.data) {
      setFeeds(feedResult.data);
    }

    if (veterinaryResult.data) {
      setVeterinary(veterinaryResult.data);
    }

    if (eggsResult.error) {
      console.warn(
        'Egg production:',
        eggsResult.error.message
      );
    }

    if (feedResult.error) {
      console.warn(
        'Feed:',
        feedResult.error.message
      );
    }

    if (veterinaryResult.error) {
      console.warn(
        'Veterinary:',
        veterinaryResult.error.message
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadBatch360();
  }, [batchId]);

  const initialBirds = Number(
    batch?.initial_quantity || 0
  );

  const liveBirds = Number(
    batch?.current_quantity || 0
  );

  const mortality = Number(
    batch?.mortality_quantity || 0
  );

  const mortalityRate =
    initialBirds > 0
      ? (mortality / initialBirds) * 100
      : 0;

  const survivalRate =
    initialBirds > 0
      ? (liveBirds / initialBirds) * 100
      : 0;

  const totalEggs = useMemo(
    () =>
      eggs.reduce(
        (sum, item) =>
          sum + Number(item.total_eggs || 0),
        0
      ),
    [eggs]
  );

  const saleableEggs = useMemo(
    () =>
      eggs.reduce(
        (sum, item) =>
          sum + Number(item.saleable_eggs || 0),
        0
      ),
    [eggs]
  );

  const crackedEggs = useMemo(
    () =>
      eggs.reduce(
        (sum, item) =>
          sum + Number(item.cracked_eggs || 0),
        0
      ),
    [eggs]
  );

  const damagedEggs = useMemo(
    () =>
      eggs.reduce(
        (sum, item) =>
          sum + Number(item.damaged_eggs || 0),
        0
      ),
    [eggs]
  );

  const saleableRate =
    totalEggs > 0
      ? (saleableEggs / totalEggs) * 100
      : 0;

  const feedKg = useMemo(
    () =>
      feeds.reduce(
        (sum, item) =>
          sum + Number(item.quantity_kg || 0),
        0
      ),
    [feeds]
  );

  const feedCost = useMemo(
    () =>
      feeds.reduce(
        (sum, item) =>
          sum + Number(item.total_cost || 0),
        0
      ),
    [feeds]
  );

  const averageFeedCost =
    feedKg > 0 ? feedCost / feedKg : 0;

  const eggsPerLiveBird =
    liveBirds > 0
      ? totalEggs / liveBirds
      : 0;

  const mortalityEvents = veterinary.filter(
    (item) =>
      String(item.record_type || '').toUpperCase() ===
      'MORTALITY'
  ).length;

  const veterinaryVisits = veterinary.filter(
    (item) => item.veterinary_visit
  ).length;

  const capacityUtilization =
    farm?.shed_capacity && farm.shed_capacity > 0
      ? (liveBirds / farm.shed_capacity) * 100
      : null;

  function formatDate(value: string | null) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-slate-600">
              Loading Bird Batch 360°...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !batch) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
            <h1 className="text-xl font-bold text-red-800">
              Bird Batch Not Found
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error || 'This bird batch does not exist.'}
            </p>

            <Link
              href="/bodhifarm"
              className="mt-5 inline-block rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
            >
              ← Back to BodhiFarm
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* HEADER */}

      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Link
                  href="/bodhifarm"
                  className="font-medium text-green-700 hover:text-green-800"
                >
                  ← BodhiFarm
                </Link>

                <span className="text-slate-400">
                  /
                </span>

                <Link
                  href="/bodhifarm/farms"
                  className="font-medium text-green-700 hover:text-green-800"
                >
                  Farm Management
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-900">
                  Bird Batch 360°
                </h1>

                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                  {batch.status || 'ACTIVE'}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Complete operational profile of this poultry batch.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <Link
                href={`/bodhifarm/farmers/${batch.farmer_id}`}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Farmer 360°
              </Link>

              {batch.farm_id && (
                <Link
                  href={`/bodhifarm/farms/${batch.farm_id}`}
                  className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
                >
                  Farm 360°
                </Link>
              )}

              <button
                onClick={loadBatch360}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Refresh
              </button>

            </div>
          </div>

        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">

        {/* BATCH IDENTITY */}

        <section className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="bg-green-700 px-6 py-6 text-white">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-green-100">
                  Batch Code
                </p>

                <h2 className="mt-1 text-3xl font-bold">
                  {batch.batch_code || 'Unnamed Batch'}
                </h2>

                <p className="mt-2 text-green-50">
                  {batch.breed || 'Breed not specified'}
                  {' · '}
                  {batch.bird_type || 'Bird type not specified'}
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-green-100">
                  Placement Date
                </p>

                <p className="mt-1 text-lg font-bold">
                  {formatDate(batch.placement_date)}
                </p>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 md:grid-cols-4 md:divide-y-0">

            <Summary
              label="Initial Birds"
              value={initialBirds}
            />

            <Summary
              label="Live Birds"
              value={liveBirds}
            />

            <Summary
              label="Mortality"
              value={mortality}
            />

            <Summary
              label="Mortality Rate"
              value={`${mortalityRate.toFixed(2)}%`}
            />

          </div>
        </section>

        {/* NAVIGATION */}

        <div className="mb-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex min-w-max">

            <a
              href="#overview"
              className="border-b-2 border-green-700 px-5 py-4 text-sm font-semibold text-green-700"
            >
              Overview
            </a>

            <a
              href="#identity"
              className="px-5 py-4 text-sm font-semibold text-slate-600 hover:text-green-700"
            >
              Batch Identity
            </a>

            <a
              href="#production"
              className="px-5 py-4 text-sm font-semibold text-slate-600 hover:text-green-700"
            >
              Production
            </a>

            <a
              href="#feed"
              className="px-5 py-4 text-sm font-semibold text-slate-600 hover:text-green-700"
            >
              Feed
            </a>

            <a
              href="#veterinary"
              className="px-5 py-4 text-sm font-semibold text-slate-600 hover:text-green-700"
            >
              Veterinary
            </a>

            <a
              href="#performance"
              className="px-5 py-4 text-sm font-semibold text-slate-600 hover:text-green-700"
            >
              Performance
            </a>

          </div>
        </div>

        {/* OVERVIEW */}

        <section id="overview" className="mb-6">

          <SectionTitle
            title="Batch Overview"
            description="Current operational status of the bird batch."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <MetricCard
              label="Initial Birds"
              value={initialBirds}
              description="Birds placed"
            />

            <MetricCard
              label="Live Birds"
              value={liveBirds}
              description="Current flock"
            />

            <MetricCard
              label="Survival Rate"
              value={`${survivalRate.toFixed(2)}%`}
              description="Live / initial"
            />

            <MetricCard
              label="Mortality"
              value={`${mortalityRate.toFixed(2)}%`}
              description={`${mortality} birds`}
            />

          </div>
        </section>

        {/* FARMER + FARM */}

        <section className="mb-6 grid gap-6 lg:grid-cols-2">

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            <SectionTitle
              title="Farmer"
              description="Owner connected with this bird batch."
            />

            {farmer ? (
              <>
                <div className="rounded-xl bg-slate-50 p-4">

                  <p className="text-sm font-bold text-green-700">
                    {farmer.farmer_id || 'No Farmer ID'}
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    {farmer.full_name || 'Unnamed Farmer'}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    {farmer.mobile || 'Mobile not available'}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Status: {farmer.status || 'ACTIVE'}
                  </p>

                </div>

                <Link
                  href={`/bodhifarm/farmers/${farmer.id}`}
                  className="mt-4 inline-block rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                >
                  Open Farmer 360° →
                </Link>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Farmer information unavailable.
              </p>
            )}

          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            <SectionTitle
              title="Farm"
              description="Farm where this batch is assigned."
            />

            {farm ? (
              <>
                <div className="rounded-xl bg-slate-50 p-4">

                  <h3 className="text-xl font-bold text-slate-900">
                    {farm.farm_name || 'Unnamed Farm'}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {farm.farm_type || 'Farm'}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">

                    <InfoItem
                      label="Shed Capacity"
                      value={farm.shed_capacity || 0}
                    />

                    <InfoItem
                      label="Farm Status"
                      value={farm.status || 'ACTIVE'}
                    />

                    <InfoItem
                      label="Live Birds"
                      value={liveBirds}
                    />

                    <InfoItem
                      label="Utilization"
                      value={
                        capacityUtilization !== null
                          ? `${capacityUtilization.toFixed(1)}%`
                          : '—'
                      }
                    />

                  </div>

                </div>

                <Link
                  href={`/bodhifarm/farms/${farm.id}`}
                  className="mt-4 inline-block rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                >
                  Open Farm 360° →
                </Link>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 p-5">
                <p className="font-semibold text-slate-700">
                  Farm not assigned
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  This batch is not currently connected to a farm.
                </p>

                <Link
                  href="/bodhifarm/farms"
                  className="mt-3 inline-block text-sm font-semibold text-green-700"
                >
                  Assign from Farm Management →
                </Link>
              </div>
            )}

          </div>

        </section>

        {/* IDENTITY */}

        <section
          id="identity"
          className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >

          <SectionTitle
            title="Batch Identity"
            description="Core registration information."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <InfoItem
              label="Batch Code"
              value={batch.batch_code || '—'}
            />

            <InfoItem
              label="Breed"
              value={batch.breed || '—'}
            />

            <InfoItem
              label="Bird Type"
              value={batch.bird_type || '—'}
            />

            <InfoItem
              label="Source"
              value={batch.source || '—'}
            />

            <InfoItem
              label="Placement Date"
              value={formatDate(batch.placement_date)}
            />

            <InfoItem
              label="Initial Quantity"
              value={initialBirds}
            />

            <InfoItem
              label="Current Quantity"
              value={liveBirds}
            />

            <InfoItem
              label="Status"
              value={batch.status || 'ACTIVE'}
            />

          </div>

        </section>

        {/* PRODUCTION */}

        <section
          id="production"
          className="mb-6"
        >

          <SectionTitle
            title="Egg Production"
            description="Egg production recorded against this batch."
          />

          <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <MetricCard
              label="Total Eggs"
              value={totalEggs}
              description={`${eggs.length} production records`}
            />

            <MetricCard
              label="Saleable Eggs"
              value={saleableEggs}
              description={`${saleableRate.toFixed(2)}% saleable`}
            />

            <MetricCard
              label="Cracked"
              value={crackedEggs}
              description="Cracked eggs"
            />

            <MetricCard
              label="Damaged"
              value={damagedEggs}
              description="Damaged eggs"
            />

          </div>

          {eggs.length === 0 ? (
            <EmptyState message="No egg production records have been recorded for this batch." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">

              <table className="min-w-full text-sm">

                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      Date
                    </th>

                    <th className="px-4 py-3 text-right">
                      Total
                    </th>

                    <th className="px-4 py-3 text-right">
                      Saleable
                    </th>

                    <th className="px-4 py-3 text-right">
                      Cracked
                    </th>

                    <th className="px-4 py-3 text-right">
                      Damaged
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">

                  {eggs.map((item) => (
                    <tr key={item.id}>

                      <td className="px-4 py-3">
                        {formatDate(item.production_date)}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold">
                        {Number(item.total_eggs || 0)}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold text-green-700">
                        {Number(item.saleable_eggs || 0)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {Number(item.cracked_eggs || 0)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {Number(item.damaged_eggs || 0)}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* FEED */}

        <section
          id="feed"
          className="mb-6"
        >

          <SectionTitle
            title="Feed Management"
            description="Feed consumption and cost connected to this batch."
          />

          <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <MetricCard
              label="Feed Consumed"
              value={`${feedKg.toFixed(2)} kg`}
              description={`${feeds.length} feed records`}
            />

            <MetricCard
              label="Feed Cost"
              value={`₹${feedCost.toFixed(2)}`}
              description="Total recorded cost"
            />

            <MetricCard
              label="Average Cost"
              value={`₹${averageFeedCost.toFixed(2)}`}
              description="Average per kg"
            />

            <MetricCard
              label="Feed / Live Bird"
              value={
                liveBirds > 0
                  ? `${(feedKg / liveBirds).toFixed(3)} kg`
                  : '—'
              }
              description="Recorded feed"
            />

          </div>

          {feeds.length === 0 ? (
            <EmptyState message="No feed records have been recorded for this batch." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">

              <table className="min-w-full text-sm">

                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      Date
                    </th>

                    <th className="px-4 py-3 text-left">
                      Feed
                    </th>

                    <th className="px-4 py-3 text-right">
                      Quantity
                    </th>

                    <th className="px-4 py-3 text-right">
                      Unit Cost
                    </th>

                    <th className="px-4 py-3 text-right">
                      Total Cost
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">

                  {feeds.map((item) => (
                    <tr key={item.id}>

                      <td className="px-4 py-3">
                        {formatDate(item.record_date)}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        {item.feed_type || 'Feed'}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {Number(item.quantity_kg || 0).toFixed(2)} kg
                      </td>

                      <td className="px-4 py-3 text-right">
                        ₹{Number(item.unit_cost || 0).toFixed(2)}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold">
                        ₹{Number(item.total_cost || 0).toFixed(2)}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* VETERINARY */}

        <section
          id="veterinary"
          className="mb-6"
        >

          <SectionTitle
            title="Veterinary & Health"
            description="Health events, mortality and veterinary activity."
          />

          <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <MetricCard
              label="Health Records"
              value={veterinary.length}
              description="Recorded events"
            />

            <MetricCard
              label="Mortality Events"
              value={mortalityEvents}
              description="Mortality records"
            />

            <MetricCard
              label="Veterinary Visits"
              value={veterinaryVisits}
              description="Recorded visits"
            />

            <MetricCard
              label="Mortality"
              value={mortality}
              description="Current cumulative mortality"
            />

          </div>

          {veterinary.length === 0 ? (
            <EmptyState message="No veterinary or health records have been recorded for this batch." />
          ) : (
            <div className="space-y-3">

              {veterinary.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >

                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

                    <div>
                      <div className="flex flex-wrap items-center gap-2">

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {item.record_type || 'HEALTH'}
                        </span>

                        {Number(
                          item.mortality_quantity || 0
                        ) > 0 && (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                            Mortality:{' '}
                            {Number(
                              item.mortality_quantity || 0
                            )}
                          </span>
                        )}

                      </div>

                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {formatDate(item.record_date)}
                      </p>
                    </div>

                    <div className="text-sm text-slate-500">
                      {item.veterinary_name ||
                        'Veterinary name not recorded'}
                    </div>

                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                    <InfoItem
                      label="Cause"
                      value={item.cause || '—'}
                    />

                    <InfoItem
                      label="Symptoms"
                      value={item.symptoms || '—'}
                    />

                    <InfoItem
                      label="Diagnosis"
                      value={item.diagnosis || '—'}
                    />

                    <InfoItem
                      label="Treatment"
                      value={item.treatment || '—'}
                    />

                  </div>

                  {(item.follow_up_date ||
                    item.medicine_quantity) && (
                    <div className="mt-4 border-t border-slate-200 pt-4">

                      <div className="grid gap-3 sm:grid-cols-2">

                        <InfoItem
                          label="Follow-up"
                          value={formatDate(
                            item.follow_up_date
                          )}
                        />

                        <InfoItem
                          label="Medicine Quantity"
                          value={
                            item.medicine_quantity || '—'
                          }
                        />

                      </div>

                    </div>
                  )}

                </div>
              ))}

            </div>
          )}

        </section>

        {/* PERFORMANCE */}

        <section
          id="performance"
          className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <SectionTitle
              title="Batch Performance"
              description="Key production and flock indicators."
            />

            <Link
              href="/bodhifarm/performance"
              className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
            >
              Open Performance Dashboard
            </Link>

          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <MetricCard
              label="Eggs / Live Bird"
              value={eggsPerLiveBird.toFixed(2)}
              description="Total eggs ÷ live birds"
            />

            <MetricCard
              label="Saleable Rate"
              value={`${saleableRate.toFixed(2)}%`}
              description="Saleable eggs ÷ total eggs"
            />

            <MetricCard
              label="Mortality Rate"
              value={`${mortalityRate.toFixed(2)}%`}
              description="Mortality ÷ initial birds"
            />

            <MetricCard
              label="Capacity Utilization"
              value={
                capacityUtilization !== null
                  ? `${capacityUtilization.toFixed(2)}%`
                  : '—'
              }
              description="Live birds ÷ shed capacity"
            />

          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-5">

            <h3 className="font-bold text-slate-900">
              Operational Summary
            </h3>

            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">

              <InfoItem
                label="Initial Birds"
                value={initialBirds}
              />

              <InfoItem
                label="Live Birds"
                value={liveBirds}
              />

              <InfoItem
                label="Total Eggs"
                value={totalEggs}
              />

              <InfoItem
                label="Feed"
                value={`${feedKg.toFixed(2)} kg`}
              />

              <InfoItem
                label="Feed Cost"
                value={`₹${feedCost.toFixed(2)}`}
              />

              <InfoItem
                label="Mortality"
                value={mortality}
              />

              <InfoItem
                label="Saleable Eggs"
                value={saleableEggs}
              />

              <InfoItem
                label="Health Records"
                value={veterinary.length}
              />

            </div>

          </div>

        </section>

        {/* QUICK ACTIONS */}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <h2 className="text-xl font-bold text-slate-900">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Open the operational modules connected with this batch.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <Link
              href="/bodhifarm/egg-production"
              className="rounded-xl border border-slate-200 p-4 hover:border-green-400 hover:bg-green-50"
            >
              <p className="font-bold text-slate-900">
                🥚 Egg Production
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Record and manage egg production.
              </p>
            </Link>

            <Link
              href="/bodhifarm/feed"
              className="rounded-xl border border-slate-200 p-4 hover:border-green-400 hover:bg-green-50"
            >
              <p className="font-bold text-slate-900">
                🌾 Feed Management
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Track feed quantity and cost.
              </p>
            </Link>

            <Link
              href="/bodhifarm/veterinary"
              className="rounded-xl border border-slate-200 p-4 hover:border-green-400 hover:bg-green-50"
            >
              <p className="font-bold text-slate-900">
                🩺 Veterinary
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Manage health and mortality records.
              </p>
            </Link>

            <Link
              href="/bodhifarm/performance"
              className="rounded-xl border border-slate-200 p-4 hover:border-green-400 hover:bg-green-50"
            >
              <p className="font-bold text-slate-900">
                📊 Performance
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Analyze batch performance.
              </p>
            </Link>

          </div>

        </section>

      </div>
    </main>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
      <p className="text-sm text-slate-500">
        {message}
      </p>
    </div>
  );
}
