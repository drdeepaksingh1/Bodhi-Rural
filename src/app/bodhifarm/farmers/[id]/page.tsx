'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';

type Farm = {
  id: string;
  farmer_id: string;
  farm_name: string | null;
  farm_type: string | null;
  shed_capacity: number | null;
  status: string | null;
};

type Farmer = {
  id: string;
  farmer_id: string | null;
  full_name: string | null;
  mobile: string | null;
  status: string | null;
};

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
  batch_id: string | null;
  record_date: string | null;
  record_type: string | null;
  mortality_quantity: number | null;
  cause: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  treatment: string | null;
  veterinary_name: string | null;
};

export default function Farm360Page() {
  const params = useParams();

  const farmId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const supabase = createClient();

  const [farm, setFarm] = useState<Farm | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [eggs, setEggs] = useState<EggRecord[]>([]);
  const [feeds, setFeeds] = useState<FeedRecord[]>([]);
  const [veterinary, setVeterinary] = useState<VeterinaryRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadFarm360() {
    if (!farmId) {
      setError('Farm ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: farmData, error: farmError } =
        await supabase
          .from('farms')
          .select(
            'id, farmer_id, farm_name, farm_type, shed_capacity, status'
          )
          .eq('id', farmId)
          .single();

      if (farmError || !farmData) {
        throw new Error(
          farmError?.message || 'Farm could not be found.'
        );
      }

      setFarm(farmData);

      const [
        farmerResult,
        batchesResult,
      ] = await Promise.all([
        supabase
          .from('farmers')
          .select(
            'id, farmer_id, full_name, mobile, status'
          )
          .eq('id', farmData.farmer_id)
          .maybeSingle(),

        supabase
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
          .eq('farm_id', farmId)
          .order('placement_date', {
            ascending: false,
          }),
      ]);

      if (farmerResult.error) {
        throw new Error(
          `Farmer: ${farmerResult.error.message}`
        );
      }

      if (batchesResult.error) {
        throw new Error(
          `Bird batches: ${batchesResult.error.message}`
        );
      }

      setFarmer(farmerResult.data || null);

      const batchData = batchesResult.data || [];

      setBatches(batchData);

      const batchIds = batchData.map(
        (batch) => batch.id
      );

      if (batchIds.length === 0) {
        setEggs([]);
        setFeeds([]);
        setVeterinary([]);
        return;
      }

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
          .in('batch_id', batchIds)
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
          .in('batch_id', batchIds)
          .order('record_date', {
            ascending: false,
          }),

        /*
         * IMPORTANT:
         * veterinary_records uses batch_id.
         * Do NOT use bird_batch_id.
         */
        supabase
          .from('veterinary_records')
          .select(
            `
            id,
            batch_id,
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
          .in('batch_id', batchIds)
          .order('record_date', {
            ascending: false,
          }),
      ]);

      if (eggsResult.error) {
        throw new Error(
          `Egg production: ${eggsResult.error.message}`
        );
      }

      if (feedsResult.error) {
        throw new Error(
          `Feed records: ${feedsResult.error.message}`
        );
      }

      if (veterinaryResult.error) {
        throw new Error(
          `Veterinary records: ${veterinaryResult.error.message}`
        );
      }

      setEggs(eggsResult.data || []);
      setFeeds(feedsResult.data || []);
      setVeterinary(veterinaryResult.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load Farm 360°.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFarm360();
  }, [farmId]);

  async function refreshFarm() {
    setRefreshing(true);

    try {
      await loadFarm360();
    } finally {
      setRefreshing(false);
    }
  }

  const totalInitialBirds = useMemo(
    () =>
      batches.reduce(
        (sum, batch) =>
          sum + Number(batch.initial_quantity || 0),
        0
      ),
    [batches]
  );

  const totalLiveBirds = useMemo(
    () =>
      batches.reduce(
        (sum, batch) =>
          sum + Number(batch.current_quantity || 0),
        0
      ),
    [batches]
  );

  const totalMortality = useMemo(
    () =>
      batches.reduce(
        (sum, batch) =>
          sum + Number(batch.mortality_quantity || 0),
        0
      ),
    [batches]
  );

  const survivalRate =
    totalInitialBirds > 0
      ? (totalLiveBirds / totalInitialBirds) * 100
      : 0;

  const mortalityRate =
    totalInitialBirds > 0
      ? (totalMortality / totalInitialBirds) * 100
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

  const totalSaleableEggs = useMemo(
    () =>
      eggs.reduce(
        (sum, item) =>
          sum + Number(item.saleable_eggs || 0),
        0
      ),
    [eggs]
  );

  const totalCrackedEggs = useMemo(
    () =>
      eggs.reduce(
        (sum, item) =>
          sum + Number(item.cracked_eggs || 0),
        0
      ),
    [eggs]
  );

  const totalDamagedEggs = useMemo(
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
      ? (totalSaleableEggs / totalEggs) * 100
      : 0;

  const eggsPerLiveBird =
    totalLiveBirds > 0
      ? totalEggs / totalLiveBirds
      : 0;

  const totalFeedKg = useMemo(
    () =>
      feeds.reduce(
        (sum, item) =>
          sum + Number(item.quantity_kg || 0),
        0
      ),
    [feeds]
  );

  const totalFeedCost = useMemo(
    () =>
      feeds.reduce(
        (sum, item) =>
          sum + Number(item.total_cost || 0),
        0
      ),
    [feeds]
  );

  const averageFeedCost =
    totalFeedKg > 0
      ? totalFeedCost / totalFeedKg
      : 0;

  const feedPerLiveBird =
    totalLiveBirds > 0
      ? totalFeedKg / totalLiveBirds
      : 0;

  const feedCostPerEgg =
    totalEggs > 0
      ? totalFeedCost / totalEggs
      : 0;

  const veterinaryMortality = useMemo(
    () =>
      veterinary.reduce(
        (sum, item) =>
          sum + Number(item.mortality_quantity || 0),
        0
      ),
    [veterinary]
  );

  const capacityUtilization =
    farm?.shed_capacity &&
    Number(farm.shed_capacity) > 0
      ? (totalLiveBirds /
          Number(farm.shed_capacity)) *
        100
      : null;

  const activeBatches = batches.filter(
    (batch) =>
      String(batch.status || '').toUpperCase() ===
      'ACTIVE'
  ).length;

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
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-green-600" />

            <p className="font-semibold text-slate-700">
              Loading Farm 360°...
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Loading farmer, flock, production,
              feed and veterinary data.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !farm) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
            <h1 className="text-xl font-bold text-red-800">
              Farm Not Found
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error || 'This farm does not exist.'}
            </p>

            <Link
              href="/bodhifarm/farms"
              className="mt-5 inline-block rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
            >
              ← Back to Farm Management
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* NAVIGATION */}

        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/bodhifarm/farms"
            className="font-semibold text-green-700 hover:underline"
          >
            ← Farm Management
          </Link>

          <span className="text-slate-400">/</span>

          <span className="text-slate-500">
            Farm 360°
          </span>
        </div>

        {/* HEADER */}

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                  FARM 360°
                </span>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {farm.status || 'ACTIVE'}
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-bold text-slate-900">
                {farm.farm_name || 'Unnamed Farm'}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {farm.farm_type ||
                  'Farm type not specified'}
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

              <Link
                href="/bodhifarm"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Bird Batch Management
              </Link>

              <button
                type="button"
                onClick={refreshFarm}
                disabled={refreshing}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {refreshing
                  ? 'Refreshing...'
                  : 'Refresh'}
              </button>
            </div>
          </div>
        </section>

        {/* PRIMARY KPI */}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <MetricCard
            label="Shed Capacity"
            value={Number(
              farm.shed_capacity || 0
            ).toLocaleString('en-IN')}
            description="Maximum recorded capacity"
          />

          <MetricCard
            label="Live Birds"
            value={totalLiveBirds}
            description="Current flock"
          />

          <MetricCard
            label="Survival Rate"
            value={`${survivalRate.toFixed(2)}%`}
            description={`${totalInitialBirds} initial birds`}
          />

          <MetricCard
            label="Capacity Utilization"
            value={
              capacityUtilization !== null
                ? `${capacityUtilization.toFixed(2)}%`
                : '—'
            }
            description="Live birds / shed capacity"
          />

        </section>

        {/* FARM + FARMER */}

        <section className="mb-6 grid gap-6 lg:grid-cols-2">

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <SectionTitle
              title="Farm Information"
              description="Core farm registration details."
            />

            <div className="grid grid-cols-2 gap-3">
              <InfoItem
                label="Farm Name"
                value={farm.farm_name || '—'}
              />

              <InfoItem
                label="Farm Type"
                value={farm.farm_type || '—'}
              />

              <InfoItem
                label="Shed Capacity"
                value={Number(
                  farm.shed_capacity || 0
                ).toLocaleString('en-IN')}
              />

              <InfoItem
                label="Status"
                value={farm.status || 'ACTIVE'}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <SectionTitle
              title="Connected Farmer"
              description="Farmer responsible for this farm."
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

                  <p className="mt-1 text-xs text-slate-500">
                    Status:{' '}
                    {farmer.status || 'ACTIVE'}
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
              <EmptyState message="Connected farmer information is not available." />
            )}
          </div>

        </section>

        {/* FLOCK PERFORMANCE */}

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <SectionTitle
            title="Flock Performance"
            description="Consolidated bird performance across this farm."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <MetricCard
              label="Initial Birds"
              value={totalInitialBirds}
              description="Total birds placed"
            />

            <MetricCard
              label="Live Birds"
              value={totalLiveBirds}
              description="Current flock"
            />

            <MetricCard
              label="Mortality"
              value={totalMortality}
              description={`${mortalityRate.toFixed(2)}% mortality`}
            />

            <MetricCard
              label="Active Batches"
              value={activeBatches}
              description={`${batches.length} total batches`}
            />

          </div>

        </section>

        {/* BIRD BATCHES */}

        <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Bird Batches
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  All bird batches currently assigned to this farm.
                </p>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                {activeBatches} Active
              </span>
            </div>
          </div>

          <div className="p-6">

            {batches.length === 0 ? (
              <EmptyState message="No bird batches are assigned to this farm." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">

                {batches.map((batch) => {
                  const initial =
                    Number(
                      batch.initial_quantity || 0
                    );

                  const live =
                    Number(
                      batch.current_quantity || 0
                    );

                  const mortality =
                    Number(
                      batch.mortality_quantity || 0
                    );

                  const batchSurvival =
                    initial > 0
                      ? (live / initial) * 100
                      : 0;

                  return (
                    <div
                      key={batch.id}
                      className="rounded-xl border border-slate-200 p-5"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>
                          <Link
                            href={`/bodhifarm/batches/${batch.id}`}
                            className="text-lg font-bold text-green-700 hover:underline"
                          >
                            {batch.batch_code ||
                              'Unnamed Batch'}
                          </Link>

                          <p className="mt-1 text-sm text-slate-500">
                            {batch.breed ||
                              'Breed not specified'}
                            {' · '}
                            {batch.bird_type ||
                              'Bird type not specified'}
                          </p>
                        </div>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                          {batch.status ||
                            'ACTIVE'}
                        </span>

                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">

                        <InfoItem
                          label="Initial"
                          value={initial}
                        />

                        <InfoItem
                          label="Live"
                          value={live}
                        />

                        <InfoItem
                          label="Mortality"
                          value={mortality}
                        />

                        <InfoItem
                          label="Survival"
                          value={`${batchSurvival.toFixed(2)}%`}
                        />

                        <InfoItem
                          label="Placement"
                          value={formatDate(
                            batch.placement_date
                          )}
                        />

                        <InfoItem
                          label="Source"
                          value={batch.source || '—'}
                        />

                      </div>

                      <Link
                        href={`/bodhifarm/batches/${batch.id}`}
                        className="mt-5 block rounded-lg bg-green-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-green-800"
                      >
                        Open Batch 360° →
                      </Link>

                    </div>
                  );
                })}

              </div>
            )}

          </div>
        </section>

        {/* EGG PRODUCTION */}

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <SectionTitle
            title="Egg Production"
            description="Aggregated egg production from all batches in this farm."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <MetricCard
              label="Total Eggs"
              value={totalEggs}
              description={`${eggs.length} production records`}
            />

            <MetricCard
              label="Saleable Eggs"
              value={totalSaleableEggs}
              description={`${saleableRate.toFixed(2)}% saleable`}
            />

            <MetricCard
              label="Cracked Eggs"
              value={totalCrackedEggs}
              description="Recorded cracked eggs"
            />

            <MetricCard
              label="Damaged Eggs"
              value={totalDamagedEggs}
              description="Recorded damaged eggs"
            />

          </div>

          {eggs.length > 0 && (
            <div className="mt-5 space-y-3">

              {eggs.slice(0, 5).map((egg) => (
                <div
                  key={egg.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <p className="font-semibold text-slate-900">
                        {formatDate(
                          egg.production_date
                        )}
                      </p>

                      <p className="text-xs text-slate-500">
                        Batch:{' '}
                        {egg.batch_id
                          ? egg.batch_id
                          : 'Not assigned'}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">
                          Total
                        </p>
                        <p className="font-bold">
                          {Number(
                            egg.total_eggs || 0
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Saleable
                        </p>
                        <p className="font-bold text-green-700">
                          {Number(
                            egg.saleable_eggs || 0
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Cracked
                        </p>
                        <p className="font-bold text-red-600">
                          {Number(
                            egg.cracked_eggs || 0
                          )}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              ))}

            </div>
          )}

        </section>

        {/* FEED */}

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <SectionTitle
            title="Feed Management"
            description="Feed consumption and cost across farm batches."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <MetricCard
              label="Feed Consumed"
              value={`${totalFeedKg.toFixed(2)} kg`}
              description={`${feeds.length} feed records`}
            />

            <MetricCard
              label="Feed Cost"
              value={`₹${totalFeedCost.toFixed(2)}`}
              description="Total recorded cost"
            />

            <MetricCard
              label="Average Cost"
              value={`₹${averageFeedCost.toFixed(2)}/kg`}
              description="Average feed cost"
            />

            <MetricCard
              label="Feed / Live Bird"
              value={
                totalLiveBirds > 0
                  ? `${feedPerLiveBird.toFixed(3)} kg`
                  : '—'
              }
              description="Recorded feed / live birds"
            />

          </div>

          {feeds.length > 0 && (
            <div className="mt-5 space-y-3">

              {feeds.slice(0, 5).map((feed) => (
                <div
                  key={feed.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <p className="font-semibold text-slate-900">
                        {formatDate(
                          feed.record_date
                        )}
                      </p>

                      <p className="text-sm text-slate-500">
                        {feed.feed_type ||
                          'Feed'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        {Number(
                          feed.quantity_kg || 0
                        ).toFixed(2)}{' '}
                        kg
                      </p>

                      <p className="text-sm text-slate-500">
                        ₹
                        {Number(
                          feed.total_cost || 0
                        ).toFixed(2)}
                      </p>
                    </div>

                  </div>
                </div>
              ))}

            </div>
          )}

        </section>

        {/* VETERINARY */}

        <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b border-slate-200 p-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Veterinary & Health
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Health, diagnosis, treatment and mortality records.
                </p>
              </div>

              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                Vet Mortality: {veterinaryMortality}
              </div>

            </div>

          </div>

          <div className="p-6">

            {veterinary.length === 0 ? (
              <EmptyState message="No veterinary records are available for this farm." />
            ) : (
              <div className="space-y-3">

                {veterinary.slice(0, 10).map((record) => (

                  <div
                    key={record.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {record.record_type ||
                            'HEALTH'}
                        </span>

                        {Number(
                          record.mortality_quantity || 0
                        ) > 0 && (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                            Mortality:{' '}
                            {Number(
                              record.mortality_quantity || 0
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
                        value={
                          record.symptoms || '—'
                        }
                      />

                      <InfoItem
                        label="Diagnosis"
                        value={
                          record.diagnosis || '—'
                        }
                      />

                      <InfoItem
                        label="Treatment"
                        value={
                          record.treatment || '—'
                        }
                      />

                    </div>

                    {record.veterinary_name && (
                      <p className="mt-3 text-xs text-slate-500">
                        Veterinary:{' '}
                        {record.veterinary_name}
                      </p>
                    )}

                  </div>

                ))}

              </div>
            )}

          </div>

        </section>

        {/* FARM PERFORMANCE */}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <SectionTitle
              title="Farm Performance"
              description="Current consolidated performance indicators."
            />

            <Link
              href="/bodhifarm/performance"
              className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
            >
              Open Performance Dashboard
            </Link>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <MetricCard
              label="Eggs / Live Bird"
              value={
                totalLiveBirds > 0
                  ? eggsPerLiveBird.toFixed(2)
                  : '—'
              }
              description="Total eggs / current live birds"
            />

            <MetricCard
              label="Saleable Rate"
              value={`${saleableRate.toFixed(2)}%`}
              description="Saleable / total eggs"
            />

            <MetricCard
              label="Feed Cost / Egg"
              value={
                totalEggs > 0
                  ? `₹${feedCostPerEgg.toFixed(2)}`
                  : '—'
              }
              description="Feed cost / total eggs"
            />

            <MetricCard
              label="Mortality Rate"
              value={`${mortalityRate.toFixed(2)}%`}
              description={`${totalMortality} birds`}
            />

          </div>

        </section>

      </div>
    </main>
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
