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
  farmer_id: string;
  batch_id: string | null;
  production_date: string;
  total_eggs: number | null;
  saleable_eggs: number | null;
  cracked_eggs: number | null;
  damaged_eggs: number | null;
};

type FeedRecord = {
  id: string;
  farmer_id: string;
  batch_id: string | null;
  record_date: string;
  feed_type: string | null;
  quantity_kg: number | null;
  unit_cost: number | null;
  total_cost: number | null;
};

type VeterinaryRecord = {
  id: string;
  farmer_id: string;
  batch_id: string | null;
  record_date: string | null;
  record_type: string | null;
  mortality_quantity: number | null;
  cause: string | null;
  diagnosis: string | null;
  treatment: string | null;
  veterinary_name: string | null;
};

export default function Farmer360ProfilePage() {
  const params = useParams();

  const farmerUuid =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const supabase = createClient();

  const [farmer, setFarmer] =
    useState<Farmer | null>(null);

  const [farms, setFarms] =
    useState<Farm[]>([]);

  const [batches, setBatches] =
    useState<BirdBatch[]>([]);

  const [eggs, setEggs] =
    useState<EggRecord[]>([]);

  const [feeds, setFeeds] =
    useState<FeedRecord[]>([]);

  const [veterinary, setVeterinary] =
    useState<VeterinaryRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [refreshing, setRefreshing] =
    useState(false);

  useEffect(() => {
    if (farmerUuid) {
      loadFarmerProfile();
    }
  }, [farmerUuid]);

  async function loadFarmerProfile() {
    if (!farmerUuid) return;

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
      ] = await Promise.all([
        supabase
          .from('farmers')
          .select(
            'id, farmer_id, full_name, mobile, status'
          )
          .eq('id', farmerUuid)
          .single(),

        supabase
          .from('farms')
          .select(
            'id, farmer_id, farm_name, farm_type, shed_capacity, status'
          )
          .eq('farmer_id', farmerUuid)
          .order('farm_name'),

        supabase
          .from('bird_batches')
          .select(
            'id, farmer_id, farm_id, batch_code, breed, bird_type, placement_date, initial_quantity, current_quantity, mortality_quantity, status'
          )
          .eq('farmer_id', farmerUuid)
          .order('placement_date', {
            ascending: false,
          }),

        supabase
          .from('egg_production')
          .select(
            'id, farmer_id, batch_id, production_date, total_eggs, saleable_eggs, cracked_eggs, damaged_eggs'
          )
          .eq('farmer_id', farmerUuid)
          .order('production_date', {
            ascending: false,
          }),

        supabase
          .from('feed_records')
          .select(
            'id, farmer_id, batch_id, record_date, feed_type, quantity_kg, unit_cost, total_cost'
          )
          .eq('farmer_id', farmerUuid)
          .order('record_date', {
            ascending: false,
          }),

        supabase
          .from('veterinary_records')
          .select(
            'id, farmer_id, batch_id, record_date, record_type, mortality_quantity, cause, diagnosis, treatment, veterinary_name'
          )
          .eq('farmer_id', farmerUuid)
          .order('record_date', {
            ascending: false,
          }),
      ]);

      if (farmerResult.error) {
        throw new Error(
          farmerResult.error.message
        );
      }

      if (farmsResult.error) {
        throw new Error(
          farmsResult.error.message
        );
      }

      if (batchesResult.error) {
        throw new Error(
          batchesResult.error.message
        );
      }

      if (eggsResult.error) {
        throw new Error(
          eggsResult.error.message
        );
      }

      if (feedsResult.error) {
        throw new Error(
          feedsResult.error.message
        );
      }

      if (veterinaryResult.error) {
        throw new Error(
          veterinaryResult.error.message
        );
      }

      setFarmer(farmerResult.data);
      setFarms(farmsResult.data ?? []);
      setBatches(batchesResult.data ?? []);
      setEggs(eggsResult.data ?? []);
      setFeeds(feedsResult.data ?? []);
      setVeterinary(
        veterinaryResult.data ?? []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load farmer profile.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfile() {
    setRefreshing(true);

    try {
      await loadFarmerProfile();
    } finally {
      setRefreshing(false);
    }
  }

  const totalInitialBirds = useMemo(
    () =>
      batches.reduce(
        (sum, batch) =>
          sum +
          Number(
            batch.initial_quantity || 0
          ),
        0
      ),
    [batches]
  );

  const totalLiveBirds = useMemo(
    () =>
      batches.reduce(
        (sum, batch) =>
          sum +
          Number(
            batch.current_quantity || 0
          ),
        0
      ),
    [batches]
  );

  const totalMortality = useMemo(
    () =>
      batches.reduce(
        (sum, batch) =>
          sum +
          Number(
            batch.mortality_quantity || 0
          ),
        0
      ),
    [batches]
  );

  const mortalityRate =
    totalInitialBirds > 0
      ? (totalMortality /
          totalInitialBirds) *
        100
      : 0;

  const survivalRate =
    totalInitialBirds > 0
      ? (totalLiveBirds /
          totalInitialBirds) *
        100
      : 0;

  const totalEggs = useMemo(
    () =>
      eggs.reduce(
        (sum, egg) =>
          sum +
          Number(
            egg.total_eggs || 0
          ),
        0
      ),
    [eggs]
  );

  const totalSaleableEggs = useMemo(
    () =>
      eggs.reduce(
        (sum, egg) =>
          sum +
          Number(
            egg.saleable_eggs || 0
          ),
        0
      ),
    [eggs]
  );

  const totalCracked = useMemo(
    () =>
      eggs.reduce(
        (sum, egg) =>
          sum +
          Number(
            egg.cracked_eggs || 0
          ),
        0
      ),
    [eggs]
  );

  const totalDamaged = useMemo(
    () =>
      eggs.reduce(
        (sum, egg) =>
          sum +
          Number(
            egg.damaged_eggs || 0
          ),
        0
      ),
    [eggs]
  );

  const saleableRate =
    totalEggs > 0
      ? (totalSaleableEggs /
          totalEggs) *
        100
      : 0;

  const eggsPerLiveBird =
    totalLiveBirds > 0
      ? totalEggs / totalLiveBirds
      : 0;

  const totalFeedKg = useMemo(
    () =>
      feeds.reduce(
        (sum, feed) =>
          sum +
          Number(
            feed.quantity_kg || 0
          ),
        0
      ),
    [feeds]
  );

  const totalFeedCost = useMemo(
    () =>
      feeds.reduce(
        (sum, feed) =>
          sum +
          Number(
            feed.total_cost || 0
          ),
        0
      ),
    [feeds]
  );

  const feedPerLiveBird =
    totalLiveBirds > 0
      ? totalFeedKg /
        totalLiveBirds
      : 0;

  const feedCostPerEgg =
    totalEggs > 0
      ? totalFeedCost / totalEggs
      : 0;

  const veterinaryMortality =
    veterinary.reduce(
      (sum, record) =>
        sum +
        Number(
          record.mortality_quantity || 0
        ),
      0
    );

  function getFarmName(
    farmId: string | null
  ) {
    if (!farmId) {
      return 'Farm not assigned';
    }

    const farm = farms.find(
      (item) => item.id === farmId
    );

    return (
      farm?.farm_name ||
      'Unnamed Farm'
    );
  }

  function getBatchCountForFarm(
    farmId: string
  ) {
    return batches.filter(
      (batch) =>
        batch.farm_id === farmId
    ).length;
  }

  function getLiveBirdsForFarm(
    farmId: string
  ) {
    return batches
      .filter(
        (batch) =>
          batch.farm_id === farmId
      )
      .reduce(
        (sum, batch) =>
          sum +
          Number(
            batch.current_quantity || 0
          ),
        0
      );
  }

  function getFarmUtilization(
    farm: Farm
  ) {
    const capacity = Number(
      farm.shed_capacity || 0
    );

    if (capacity <= 0) {
      return 0;
    }

    return (
      (getLiveBirdsForFarm(farm.id) /
        capacity) *
      100
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-green-600" />

            <p className="font-semibold text-slate-700">
              Loading Farmer 360° Profile...
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Loading farmer, farm, flock and
              production data.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !farmer) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-xl font-bold text-red-800">
              Farmer Profile Not Available
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error ||
                'The requested farmer could not be found.'}
            </p>

            <Link
              href="/bodhifarm/farmers"
              className="mt-5 inline-block rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              ← Back to Farmer Management
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-6">
          <Link
            href="/bodhifarm/farmers"
            className="mb-3 inline-block text-sm font-semibold text-green-700 hover:underline"
          >
            ← Back to Farmer Management
          </Link>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <div className="flex flex-wrap items-center gap-2">

                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                    {farmer.farmer_id}
                  </span>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {farmer.status ||
                      'ACTIVE'}
                  </span>

                </div>

                <h1 className="mt-3 text-3xl font-bold text-slate-900">
                  {farmer.full_name}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Farmer 360° · Complete
                  operational profile
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Mobile:{' '}
                  <span className="font-semibold">
                    {farmer.mobile ||
                      'Not available'}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">

                <button
                  onClick={refreshProfile}
                  disabled={refreshing}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {refreshing
                    ? 'Refreshing...'
                    : 'Refresh Profile'}
                </button>

                <Link
                  href="/bodhifarm"
                  className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                >
                  Bird Batches
                </Link>

              </div>

            </div>
          </div>
        </div>

        {/* KPI GRID */}

        <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">

          <MetricCard
            label="Farms"
            value={farms.length}
          />

          <MetricCard
            label="Bird Batches"
            value={batches.length}
          />

          <MetricCard
            label="Live Birds"
            value={totalLiveBirds}
            valueClass="text-green-700"
          />

          <MetricCard
            label="Mortality"
            value={totalMortality}
            valueClass="text-red-600"
          />

          <MetricCard
            label="Total Eggs"
            value={totalEggs}
            valueClass="text-amber-600"
          />

          <MetricCard
            label="Saleable Eggs"
            value={totalSaleableEggs}
            valueClass="text-green-700"
          />

          <MetricCard
            label="Feed"
            value={`${totalFeedKg.toFixed(
              2
            )} kg`}
            valueClass="text-orange-600"
          />

          <MetricCard
            label="Feed Cost"
            value={`₹${totalFeedCost.toLocaleString(
              'en-IN',
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}`}
            valueClass="text-purple-700"
          />

        </section>

        {/* FARMER STATUS */}

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Farmer Operational Status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current operational position of
                this farmer.
              </p>
            </div>

            <span className="w-fit rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700">
              {farmer.status ||
                'ACTIVE'}
            </span>

          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <StatusBox
              label="Initial Birds"
              value={totalInitialBirds}
            />

            <StatusBox
              label="Live Birds"
              value={totalLiveBirds}
            />

            <StatusBox
              label="Survival Rate"
              value={`${survivalRate.toFixed(
                2
              )}%`}
            />

            <StatusBox
              label="Mortality Rate"
              value={`${mortalityRate.toFixed(
                2
              )}%`}
            />

          </div>
        </section>

        {/* FARMER INFORMATION */}

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <h2 className="text-xl font-bold text-slate-900">
            Farmer Information
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <InfoItem
              label="Farmer ID"
              value={farmer.farmer_id}
            />

            <InfoItem
              label="Name"
              value={farmer.full_name}
            />

            <InfoItem
              label="Mobile"
              value={
                farmer.mobile ||
                'Not available'
              }
            />

            <InfoItem
              label="Platform Status"
              value={
                farmer.status ||
                'ACTIVE'
              }
            />

          </div>
        </section>

        {/* FARMS */}

        <section className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b border-slate-200 p-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Farms & Capacity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Farms connected to this farmer
                  and their current flock utilization.
                </p>
              </div>

              <Link
                href="/bodhifarm/farms"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Manage Farms
              </Link>

            </div>
          </div>

          <div className="p-6">

            {farms.length === 0 ? (
              <div className="rounded-xl bg-amber-50 p-5 text-sm text-amber-700">
                No farm is currently registered
                for this farmer.
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">

                {farms.map((farm) => {

                  const liveBirds =
                    getLiveBirdsForFarm(
                      farm.id
                    );

                  const batchCount =
                    getBatchCountForFarm(
                      farm.id
                    );

                  const utilization =
                    getFarmUtilization(
                      farm
                    );

                  return (
                    <div
                      key={farm.id}
                      className="rounded-xl border border-slate-200 p-5 transition hover:border-green-300 hover:shadow-sm"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {farm.farm_name ||
                              'Unnamed Farm'}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {farm.farm_type ||
                              'Farm type not specified'}
                          </p>
                        </div>

                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {farm.status ||
                            'ACTIVE'}
                        </span>

                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">

                        <InfoItem
                          label="Shed Capacity"
                          value={Number(
                            farm.shed_capacity ||
                              0
                          )}
                        />

                        <InfoItem
                          label="Live Birds"
                          value={liveBirds}
                        />

                        <InfoItem
                          label="Bird Batches"
                          value={batchCount}
                        />

                        <InfoItem
                          label="Utilization"
                          value={`${utilization.toFixed(
                            1
                          )}%`}
                        />

                      </div>

                      <div className="mt-5">

                        <div className="mb-2 flex justify-between text-xs">

                          <span className="text-slate-500">
                            Capacity Utilization
                          </span>

                          <span className="font-semibold text-slate-700">
                            {utilization.toFixed(
                              1
                            )}
                            %
                          </span>

                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                          <div
                            className="h-full rounded-full bg-green-600 transition-all"
                            style={{
                              width: `${Math.min(
                                utilization,
                                100
                              )}%`,
                            }}
                          />

                        </div>

                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">

                        <Link
                          href={`/bodhifarm/farms/${farm.id}`}
                          className="rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800"
                        >
                          Farm 360°
                        </Link>

                        <Link
                          href="/bodhifarm"
                          className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Bird Batches
                        </Link>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </div>
        </section>

        {/* BIRD BATCHES */}

        <section className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b border-slate-200 p-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Bird Batches
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Farmer-level flock register with
                  direct Batch 360° access.
                </p>
              </div>

              <Link
                href="/bodhifarm"
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
              >
                Manage Batches
              </Link>

            </div>
          </div>

          <div className="overflow-x-auto">

            {batches.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                No bird batches registered for
                this farmer.
              </div>
            ) : (
              <table className="min-w-[1000px] w-full text-sm">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-5 py-4 text-left font-semibold text-slate-600">
                      Batch
                    </th>

                    <th className="px-5 py-4 text-left font-semibold text-slate-600">
                      Farm
                    </th>

                    <th className="px-5 py-4 text-left font-semibold text-slate-600">
                      Breed
                    </th>

                    <th className="px-5 py-4 text-left font-semibold text-slate-600">
                      Placement
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-slate-600">
                      Initial
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-slate-600">
                      Live
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-slate-600">
                      Mortality
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-slate-600">
                      Survival
                    </th>

                    <th className="px-5 py-4 text-center font-semibold text-slate-600">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y">

                  {batches.map((batch) => {

                    const initial =
                      Number(
                        batch.initial_quantity ||
                          0
                      );

                    const live =
                      Number(
                        batch.current_quantity ||
                          0
                      );

                    const mortality =
                      Number(
                        batch.mortality_quantity ||
                          0
                      );

                    const survival =
                      initial > 0
                        ? (live / initial) *
                          100
                        : 0;

                    return (
                      <tr
                        key={batch.id}
                        className="hover:bg-slate-50"
                      >

                        <td className="px-5 py-4">

                          <Link
                            href={`/bodhifarm/batches/${batch.id}`}
                            className="font-bold text-green-700 hover:underline"
                          >
                            {batch.batch_code}
                          </Link>

                          <p className="mt-1 text-xs text-slate-500">
                            {batch.bird_type ||
                              'Bird type not specified'}
                          </p>

                        </td>

                        <td className="px-5 py-4 font-medium text-slate-800">
                          {getFarmName(
                            batch.farm_id
                          )}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {batch.breed}
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-slate-700">
                          {formatDate(
                            batch.placement_date
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          {initial.toLocaleString(
                            'en-IN'
                          )}
                        </td>

                        <td className="px-5 py-4 text-right font-bold text-green-700">
                          {live.toLocaleString(
                            'en-IN'
                          )}
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-red-600">
                          {mortality.toLocaleString(
                            'en-IN'
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">

                          <span
                            className={
                              survival >= 95
                                ? 'font-bold text-green-700'
                                : survival >= 90
                                  ? 'font-bold text-amber-600'
                                  : 'font-bold text-red-600'
                            }
                          >
                            {survival.toFixed(
                              1
                            )}
                            %
                          </span>

                        </td>

                        <td className="px-5 py-4 text-center">

                          <Link
                            href={`/bodhifarm/batches/${batch.id}`}
                            className="rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
                          >
                            View 360°
                          </Link>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>
              </table>
            )}

          </div>
        </section>

        {/* PERFORMANCE */}

        <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b border-slate-200 p-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Performance Summary
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Aggregated production and flock
                  indicators for this farmer.
                </p>
              </div>

              <Link
                href="/bodhifarm/performance"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Performance Dashboard
              </Link>

            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">

            <PerformanceCard
              label="Survival Rate"
              value={`${survivalRate.toFixed(
                2
              )}%`}
              description="Live birds / initial birds"
            />

            <PerformanceCard
              label="Mortality Rate"
              value={`${mortalityRate.toFixed(
                2
              )}%`}
              description="Mortality / initial birds"
            />

            <PerformanceCard
              label="Saleable Egg Rate"
              value={`${saleableRate.toFixed(
                2
              )}%`}
              description="Saleable eggs / total eggs"
            />

            <PerformanceCard
              label="Eggs / Live Bird"
              value={eggsPerLiveBird.toFixed(
                2
              )}
              description="Total eggs / current live birds"
            />

            <PerformanceCard
              label="Feed / Live Bird"
              value={`${feedPerLiveBird.toFixed(
                3
              )} kg`}
              description="Recorded feed / current birds"
            />

            <PerformanceCard
              label="Feed Cost / Egg"
              value={`₹${feedCostPerEgg.toFixed(
                2
              )}`}
              description="Feed cost / total eggs"
            />

            <PerformanceCard
              label="Veterinary Records"
              value={veterinary.length}
              description="Recorded health events"
            />

            <PerformanceCard
              label="Vet Mortality"
              value={veterinaryMortality}
              description="Mortality in veterinary records"
            />

          </div>
        </section>

        {/* EGG PRODUCTION */}

        <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b border-slate-200 p-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Egg Production
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Recent production records for
                  this farmer.
                </p>
              </div>

              <Link
                href="/bodhifarm/egg-production"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Manage Eggs
              </Link>

            </div>

          </div>

          <div className="p-6">

            <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">

              <MiniCard
                label="Total"
                value={totalEggs}
              />

              <MiniCard
                label="Saleable"
                value={totalSaleableEggs}
              />

              <MiniCard
                label="Cracked"
                value={totalCracked}
              />

              <MiniCard
                label="Damaged"
                value={totalDamaged}
              />

            </div>

            {eggs.length === 0 ? (
              <p className="text-sm text-slate-500">
                No egg production records.
              </p>
            ) : (
              <div className="space-y-2">

                {eggs
                  .slice(0, 5)
                  .map((egg) => (
                    <div
                      key={egg.id}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >

                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatDate(
                            egg.production_date
                          )}
                        </p>

                        <p className="text-xs text-slate-500">
                          Total:{' '}
                          {Number(
                            egg.total_eggs || 0
                          )}
                          {' · '}
                          Saleable:{' '}
                          {Number(
                            egg.saleable_eggs || 0
                          )}
                        </p>
                      </div>

                      <p className="text-sm text-slate-600">
                        Cracked:{' '}
                        {Number(
                          egg.cracked_eggs || 0
                        )}
                        {' · '}
                        Damaged:{' '}
                        {Number(
                          egg.damaged_eggs || 0
                        )}
                      </p>

                    </div>
                  ))}

              </div>
            )}

          </div>
        </section>

        {/* FEED */}

        <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b border-slate-200 p-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Feed Management
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Feed consumption and cost.
                </p>
              </div>

              <Link
                href="/bodhifarm/feed"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Manage Feed
              </Link>

            </div>

          </div>

          <div className="p-6">

            <div className="mb-5 grid grid-cols-2 gap-4">

              <MiniCard
                label="Total Feed"
                value={`${totalFeedKg.toFixed(
                  2
                )} kg`}
              />

              <MiniCard
                label="Total Cost"
                value={`₹${totalFeedCost.toLocaleString(
                  'en-IN',
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}`}
              />

            </div>

            {feeds.length === 0 ? (
              <p className="text-sm text-slate-500">
                No feed records.
              </p>
            ) : (
              <div className="space-y-2">

                {feeds
                  .slice(0, 5)
                  .map((feed) => (
                    <div
                      key={feed.id}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >

                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatDate(
                            feed.record_date
                          )}
                        </p>

                        <p className="text-xs text-slate-500">
                          {feed.feed_type ||
                            'Feed'}
                        </p>
                      </div>

                      <p className="text-sm font-semibold text-slate-700">
                        {Number(
                          feed.quantity_kg || 0
                        ).toFixed(2)}{' '}
                        kg · ₹
                        {Number(
                          feed.total_cost || 0
                        ).toFixed(2)}
                      </p>

                    </div>
                  ))}

              </div>
            )}

          </div>
        </section>

        {/* VETERINARY */}

        <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b border-slate-200 p-6">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Veterinary & Mortality
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Health, diagnosis, treatment and
                  mortality records.
                </p>
              </div>

              <Link
                href="/bodhifarm/veterinary"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Manage Veterinary
              </Link>

            </div>

          </div>

          <div className="p-6">

            {veterinary.length === 0 ? (
              <p className="text-sm text-slate-500">
                No veterinary records.
              </p>
            ) : (
              <div className="space-y-3">

                {veterinary
                  .slice(0, 5)
                  .map((record) => (
                    <div
                      key={record.id}
                      className="rounded-lg border border-slate-200 p-4"
                    >

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                          <p className="font-semibold text-slate-900">
                            {record.record_type ||
                              'Veterinary Record'}
                          </p>

                          <p className="text-xs text-slate-500">
                            {record.record_date
                              ? formatDate(
                                  record.record_date
                                )
                              : 'Date not available'}
                          </p>
                        </div>

                        <span className="w-fit rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          Mortality:{' '}
                          {Number(
                            record.mortality_quantity ||
                              0
                          )}
                        </span>

                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">

                        <p>
                          <strong>Cause:</strong>{' '}
                          {record.cause ||
                            '—'}
                        </p>

                        <p>
                          <strong>Diagnosis:</strong>{' '}
                          {record.diagnosis ||
                            '—'}
                        </p>

                        <p>
                          <strong>Treatment:</strong>{' '}
                          {record.treatment ||
                            '—'}
                        </p>

                        <p>
                          <strong>Veterinary:</strong>{' '}
                          {record.veterinary_name ||
                            '—'}
                        </p>

                      </div>

                    </div>
                  ))}

              </div>
            )}

          </div>
        </section>

        {/* QUICK ACTIONS */}

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">

          <h2 className="text-xl font-bold text-slate-900">
            Quick Actions
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

            <Link
              href="/bodhifarm"
              className="rounded-lg bg-green-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-green-800"
            >
              Bird Batches
            </Link>

            <Link
              href="/bodhifarm/egg-production"
              className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Egg Production
            </Link>

            <Link
              href="/bodhifarm/feed"
              className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Feed
            </Link>

            <Link
              href="/bodhifarm/veterinary"
              className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Veterinary
            </Link>

            <Link
              href="/bodhifarm/performance"
              className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Performance
            </Link>

          </div>
        </section>

      </div>
    </main>
  );
}

/* =========================================================
   COMPONENTS
   ========================================================= */

function MetricCard({
  label,
  value,
  valueClass = 'text-slate-900',
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold sm:text-3xl ${valueClass}`}
      >
        {typeof value === 'number'
          ? value.toLocaleString('en-IN')
          : value}
      </p>

    </div>
  );
}

function StatusBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-slate-900">
        {typeof value === 'number'
          ? value.toLocaleString('en-IN')
          : value}
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
        {typeof value === 'number'
          ? value.toLocaleString('en-IN')
          : value}
      </p>

    </div>
  );
}

function PerformanceCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">

      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {typeof value === 'number'
          ? value.toLocaleString('en-IN')
          : value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}

function MiniCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-slate-900">
        {typeof value === 'number'
          ? value.toLocaleString('en-IN')
          : value}
      </p>

    </div>
  );
}

function formatDate(
  value: string | null | undefined
) {
  if (!value) {
    return '—';
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
}
