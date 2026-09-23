'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';

type Batch = {
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
};

export default function BirdBatch360Page() {
  const params = useParams();

  const batchId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const supabase = createClient();

  const [batch, setBatch] = useState<Batch | null>(null);
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

    const [farmerResult, farmResult] =
      await Promise.all([
        supabase
          .from('farmers')
          .select(
            `
            id,
            farmer_id,
            full_name,
            mobile,
            status
            `
          )
          .eq('id', batchData.farmer_id)
          .maybeSingle(),

        batchData.farm_id
          ? supabase
              .from('farms')
              .select(
                `
                id,
                farmer_id,
                farm_name,
                farm_type,
                shed_capacity,
                status
                `
              )
              .eq('id', batchData.farm_id)
              .maybeSingle()
          : Promise.resolve({
              data: null,
              error: null,
            }),
      ]);

    setFarmer(farmerResult.data || null);
    setFarm(farmResult.data || null);

    const [
      eggsResult,
      feedsResult,
      veterinaryResult,
    ] = await Promise.all([
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
          veterinary_name
          `
        )
        .eq('bird_batch_id', batchId)
        .order('record_date', {
          ascending: false,
        }),
    ]);

    setEggs(eggsResult.data || []);
    setFeeds(feedsResult.data || []);
    setVeterinary(veterinaryResult.data || []);

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
        (sum, record) =>
          sum + Number(record.total_eggs || 0),
        0
      ),
    [eggs]
  );

  const saleableEggs = useMemo(
    () =>
      eggs.reduce(
        (sum, record) =>
          sum + Number(record.saleable_eggs || 0),
        0
      ),
    [eggs]
  );

  const crackedEggs = useMemo(
    () =>
      eggs.reduce(
        (sum, record) =>
          sum + Number(record.cracked_eggs || 0),
        0
      ),
    [eggs]
  );

  const damagedEggs = useMemo(
    () =>
      eggs.reduce(
        (sum, record) =>
          sum + Number(record.damaged_eggs || 0),
        0
      ),
    [eggs]
  );

  const saleableRate =
    totalEggs > 0
      ? (saleableEggs / totalEggs) * 100
      : 0;

  const eggsPerLiveBird =
    liveBirds > 0
      ? totalEggs / liveBirds
      : 0;

  const totalFeedKg = useMemo(
    () =>
      feeds.reduce(
        (sum, record) =>
          sum + Number(record.quantity_kg || 0),
        0
      ),
    [feeds]
  );

  const totalFeedCost = useMemo(
    () =>
      feeds.reduce(
        (sum, record) =>
          sum + Number(record.total_cost || 0),
        0
      ),
    [feeds]
  );

  const averageFeedCost =
    totalFeedKg > 0
      ? totalFeedCost / totalFeedKg
      : 0;

  const feedPerLiveBird =
    liveBirds > 0
      ? totalFeedKg / liveBirds
      : 0;

  const veterinaryMortality = useMemo(
    () =>
      veterinary.reduce(
        (sum, record) =>
          sum +
          Number(
            record.mortality_quantity || 0
          ),
        0
      ),
    [veterinary]
  );

  const capacityUtilization =
    farm?.shed_capacity &&
    Number(farm.shed_capacity) > 0
      ? (liveBirds /
          Number(farm.shed_capacity)) *
        100
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
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
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
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8">

            <h1 className="text-xl font-bold text-red-800">
              Bird Batch Not Found
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error ||
                'This bird batch does not exist.'}
            </p>

            <Link
              href="/bodhifarm"
              className="mt-5 inline-block rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
            >
              ← Back to Bird Batch Management
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

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="flex flex-wrap items-center gap-2 text-sm">

                <Link
                  href="/bodhifarm"
                  className="font-semibold text-green-700 hover:text-green-800"
                >
                  ← Bird Batch Management
                </Link>

                <span className="text-slate-400">
                  /
                </span>

                <span className="text-slate-500">
                  Batch 360°
                </span>

              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">

                <h1 className="text-3xl font-bold text-slate-900">
                  {batch.batch_code ||
                    'Bird Batch'}
                </h1>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  {batch.status || 'ACTIVE'}
                </span>

              </div>

              <p className="mt-2 text-sm text-slate-500">
                Complete operational profile of this bird batch.
              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              {farmer && (
                <Link
                  href={`/bodhifarm/farmers/${farmer.id}`}
                  className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
                >
                  Farmer 360°
                </Link>
              )}

              {farm && (
                <Link
                  href={`/bodhifarm/farms/${farm.id}`}
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

        {/* BATCH PROFILE */}

        <section className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="bg-green-700 px-6 py-7 text-white">

            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-green-100">
                  Bird Batch Profile
                </p>

                <h2 className="mt-1 text-3xl font-bold">
                  {batch.batch_code ||
                    'Bird Batch'}
                </h2>

                <p className="mt-2 text-sm text-green-100">
                  {batch.breed ||
                    'Breed not specified'}
                  {' · '}
                  {batch.bird_type ||
                    'Bird type not specified'}
                </p>

              </div>

              <div className="rounded-xl bg-white/10 p-4">

                <p className="text-xs uppercase tracking-wide text-green-100">
                  Batch ID
                </p>

                <p className="mt-1 break-all text-sm font-semibold">
                  {batch.id}
                </p>

              </div>

            </div>

          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 md:grid-cols-4 md:divide-y-0">

            <Summary
              label="Initial Birds"
              value={initialBirds.toLocaleString('en-IN')}
            />

            <Summary
              label="Live Birds"
              value={liveBirds.toLocaleString('en-IN')}
            />

            <Summary
              label="Mortality"
              value={mortality.toLocaleString('en-IN')}
            />

            <Summary
              label="Survival"
              value={`${survivalRate.toFixed(2)}%`}
            />

          </div>

        </section>

        {/* KPI */}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <MetricCard
            label="Mortality Rate"
            value={`${mortalityRate.toFixed(2)}%`}
            description={`${mortality} birds lost`}
          />

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
            label="Feed Consumed"
            value={`${totalFeedKg.toFixed(2)} kg`}
            description={`₹${totalFeedCost.toFixed(2)} recorded cost`}
          />

        </section>

        {/* BATCH + FARMER + FARM */}

        <section className="mb-6 grid gap-6 lg:grid-cols-3">

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            <SectionTitle
              title="Batch Information"
              description="Core batch registration details."
            />

            <div className="space-y-3">

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
                label="Placement Date"
                value={formatDate(
                  batch.placement_date
                )}
              />

              <InfoItem
                label="Source"
                value={batch.source || '—'}
              />

              <InfoItem
                label="Status"
                value={batch.status || 'ACTIVE'}
              />

            </div>

          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            <SectionTitle
              title="Farmer"
              description="Farmer responsible for this batch."
            />

            {farmer ? (
              <>
                <div className="rounded-xl bg-slate-50 p-5">

                  <p className="text-sm font-bold text-green-700">
                    {farmer.farmer_id ||
                      'No Farmer ID'}
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    {farmer.full_name ||
                      'Unnamed Farmer'}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    {farmer.mobile ||
                      'Mobile not available'}
                  </p>

                </div>

                <Link
                  href={`/bodhifarm/farmers/${farmer.id}`}
                  className="mt-4 block rounded-lg bg-green-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-green-800"
                >
                  Open Farmer 360° →
                </Link>
              </>
            ) : (
              <EmptyState message="Farmer information is not available." />
            )}

          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

            <SectionTitle
              title="Farm"
              description="Farm where this batch is placed."
            />

            {farm ? (
              <>
                <div className="rounded-xl bg-slate-50 p-5">

                  <h3 className="text-xl font-bold text-slate-900">
                    {farm.farm_name ||
                      'Unnamed Farm'}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {farm.farm_type || 'Farm'}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">

                    <InfoItem
                      label="Shed Capacity"
                      value={
                        farm.shed_capacity || 0
                      }
                    />

                    <InfoItem
                      label="Status"
                      value={
                        farm.status || 'ACTIVE'
                      }
                    />

                  </div>

                </div>

                <Link
                  href={`/bodhifarm/farms/${farm.id}`}
                  className="mt-4 block rounded-lg bg-green-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-green-800"
                >
                  Open Farm 360° →
                </Link>
              </>
            ) : (
              <EmptyState message="This batch is not currently linked to a farm." />
            )}

          </div>

        </section>

        {/* FLOCK STATUS */}

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <SectionTitle
            title="Flock Status"
            description="Current bird population and mortality position."
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
              description="Current quantity"
            />

            <MetricCard
              label="Mortality"
              value={mortality}
              description="Recorded mortality"
            />

            <MetricCard
              label="Survival Rate"
              value={`${survivalRate.toFixed(2)}%`}
              description="Live / initial"
            />

          </div>

          <div className="mt-5">

            <div className="mb-2 flex justify-between text-xs font-semibold text-slate-500">

              <span>
                Flock survival
              </span>

              <span>
                {survivalRate.toFixed(2)}%
              </span>

            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-200">

              <div
                className="h-full rounded-full bg-green-600"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, survivalRate)
                  )}%`,
                }}
              />

            </div>

          </div>

        </section>

        {/* EGG PRODUCTION */}

        <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b border-slate-200 p-6">

            <h2 className="text-xl font-bold text-slate-900">
              Egg Production
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Production records linked to this bird batch.
            </p>

          </div>

          <div className="p-6">

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <MetricCard
                label="Total Eggs"
                value={totalEggs}
                description="Recorded production"
              />

              <MetricCard
                label="Saleable"
                value={saleableEggs}
                description={`${saleableRate.toFixed(2)}% of total`}
              />

              <MetricCard
                label="Cracked"
                value={crackedEggs}
                description="Recorded cracked eggs"
              />

              <MetricCard
                label="Damaged"
                value={damagedEggs}
                description="Recorded damaged eggs"
              />

            </div>

            {eggs.length === 0 ? (
              <EmptyState message="No egg production records are available." />
            ) : (
              <div className="overflow-x-auto">

                <table className="min-w-full text-left text-sm">

                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">

                    <tr>
                      <th className="px-4 py-3">
                        Date
                      </th>

                      <th className="px-4 py-3">
                        Total
                      </th>

                      <th className="px-4 py-3">
                        Saleable
                      </th>

                      <th className="px-4 py-3">
                        Cracked
                      </th>

                      <th className="px-4 py-3">
                        Damaged
                      </th>
                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-200">

                    {eggs.map((record) => (

                      <tr key={record.id}>

                        <td className="px-4 py-3 font-medium">
                          {formatDate(
                            record.production_date
                          )}
                        </td>

                        <td className="px-4 py-3 font-semibold">
                          {record.total_eggs || 0}
                        </td>

                        <td className="px-4 py-3 font-semibold text-green-700">
                          {record.saleable_eggs || 0}
                        </td>

                        <td className="px-4 py-3">
                          {record.cracked_eggs || 0}
                        </td>

                        <td className="px-4 py-3">
                          {record.damaged_eggs || 0}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>
            )}

          </div>

        </section>

        {/* FEED */}

        <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b border-slate-200 p-6">

            <h2 className="text-xl font-bold text-slate-900">
              Feed Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Feed consumption and cost records for this batch.
            </p>

          </div>

          <div className="p-6">

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <MetricCard
                label="Feed Consumed"
                value={`${totalFeedKg.toFixed(2)} kg`}
                description={`${feeds.length} records`}
              />

              <MetricCard
                label="Feed Cost"
                value={`₹${totalFeedCost.toFixed(2)}`}
                description="Recorded total"
              />

              <MetricCard
                label="Average Cost"
                value={`₹${averageFeedCost.toFixed(2)}/kg`}
                description="Average feed cost"
              />

              <MetricCard
                label="Feed / Live Bird"
                value={`${feedPerLiveBird.toFixed(3)} kg`}
                description="Recorded feed / current live bird"
              />

            </div>

            {feeds.length === 0 ? (
              <EmptyState message="No feed records are available." />
            ) : (
              <div className="overflow-x-auto">

                <table className="min-w-full text-left text-sm">

                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">

                    <tr>

                      <th className="px-4 py-3">
                        Date
                      </th>

                      <th className="px-4 py-3">
                        Feed
                      </th>

                      <th className="px-4 py-3">
                        Quantity
                      </th>

                      <th className="px-4 py-3">
                        Unit Cost
                      </th>

                      <th className="px-4 py-3">
                        Total Cost
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-200">

                    {feeds.map((record) => (

                      <tr key={record.id}>

                        <td className="px-4 py-3">
                          {formatDate(
                            record.record_date
                          )}
                        </td>

                        <td className="px-4 py-3 font-medium">
                          {record.feed_type || '—'}
                        </td>

                        <td className="px-4 py-3 font-semibold">
                          {Number(
                            record.quantity_kg || 0
                          ).toFixed(2)}{' '}
                          kg
                        </td>

                        <td className="px-4 py-3">
                          ₹
                          {Number(
                            record.unit_cost || 0
                          ).toFixed(2)}
                        </td>

                        <td className="px-4 py-3 font-semibold">
                          ₹
                          {Number(
                            record.total_cost || 0
                          ).toFixed(2)}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>
            )}

          </div>

        </section>

        {/* VETERINARY */}

        <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b border-slate-200 p-6">

            <h2 className="text-xl font-bold text-slate-900">
              Veterinary & Health
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Health, mortality and veterinary records for this batch.
            </p>

          </div>

          <div className="p-6">

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <MetricCard
                label="Health Records"
                value={veterinary.length}
                description="Records linked to batch"
              />

              <MetricCard
                label="Recorded Mortality"
                value={veterinaryMortality}
                description="From veterinary records"
              />

              <MetricCard
                label="Batch Mortality"
                value={mortality}
                description="Current batch record"
              />

            </div>

            {veterinary.length === 0 ? (
              <EmptyState message="No veterinary records are available." />
            ) : (
              <div className="space-y-4">

                {veterinary.map((record) => (

                  <div
                    key={record.id}
                    className="rounded-xl border border-slate-200 p-5"
                  >

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {record.record_type ||
                            'HEALTH'}
                        </span>

                        {Number(
                          record.mortality_quantity ||
                            0
                        ) > 0 && (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                            Mortality:{' '}
                            {Number(
                              record.mortality_quantity ||
                                0
                            )}
                          </span>
                        )}

                      </div>

                      <span className="text-sm text-slate-500">
                        {formatDate(
                          record.record_date
                        )}
                      </span>

                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                      <InfoItem
                        label="Cause"
                        value={record.cause || '—'}
                      />

                      <InfoItem
                        label="Symptoms"
                        value={record.symptoms || '—'}
                      />

                      <InfoItem
                        label="Diagnosis"
                        value={record.diagnosis || '—'}
                      />

                      <InfoItem
                        label="Treatment"
                        value={record.treatment || '—'}
                      />

                    </div>

                    {record.veterinary_name && (
                      <p className="mt-4 text-xs text-slate-500">
                        Veterinary: {record.veterinary_name}
                      </p>
                    )}

                  </div>

                ))}

              </div>
            )}

          </div>

        </section>

        {/* PERFORMANCE */}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <SectionTitle
              title="Batch Performance"
              description="Consolidated performance indicators."
            />

            <Link
              href="/bodhifarm/performance"
              className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
            >
              Performance Dashboard
            </Link>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <MetricCard
              label="Eggs / Live Bird"
              value={eggsPerLiveBird.toFixed(2)}
              description="Total eggs / current live birds"
            />

            <MetricCard
              label="Saleable Rate"
              value={`${saleableRate.toFixed(2)}%`}
              description="Saleable / total eggs"
            />

            <MetricCard
              label="Mortality Rate"
              value={`${mortalityRate.toFixed(2)}%`}
              description="Mortality / initial birds"
            />

            <MetricCard
              label="Capacity Utilization"
              value={
                capacityUtilization !== null
                  ? `${capacityUtilization.toFixed(2)}%`
                  : '—'
              }
              description="Live birds / farm shed capacity"
            />

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
