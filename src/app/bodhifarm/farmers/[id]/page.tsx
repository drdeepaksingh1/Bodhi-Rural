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
  const farmerUuid = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const supabase = createClient();

  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [batches, setBatches] = useState<BirdBatch[]>([]);
  const [eggs, setEggs] = useState<EggRecord[]>([]);
  const [feeds, setFeeds] = useState<FeedRecord[]>([]);
  const [veterinary, setVeterinary] = useState<VeterinaryRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (farmerUuid) {
      loadFarmerProfile();
    }
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
        throw new Error(farmerResult.error.message);
      }

      if (farmsResult.error) {
        throw new Error(farmsResult.error.message);
      }

      if (batchesResult.error) {
        throw new Error(batchesResult.error.message);
      }

      if (eggsResult.error) {
        throw new Error(eggsResult.error.message);
      }

      if (feedsResult.error) {
        throw new Error(feedsResult.error.message);
      }

      if (veterinaryResult.error) {
        throw new Error(
          veterinaryResult.error.message
        );
      }

      setFarmer(farmerResult.data);
      setFarms(farmsResult.data || []);
      setBatches(batchesResult.data || []);
      setEggs(eggsResult.data || []);
      setFeeds(feedsResult.data || []);
      setVeterinary(
        veterinaryResult.data || []
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

  const totalInitialBirds = useMemo(
    () =>
      batches.reduce(
        (sum, batch) =>
          sum +
          Number(batch.initial_quantity || 0),
        0
      ),
    [batches]
  );

  const totalLiveBirds = useMemo(
    () =>
      batches.reduce(
        (sum, batch) =>
          sum +
          Number(batch.current_quantity || 0),
        0
      ),
    [batches]
  );

  const totalMortality = useMemo(
    () =>
      batches.reduce(
        (sum, batch) =>
          sum +
          Number(batch.mortality_quantity || 0),
        0
      ),
    [batches]
  );

  const mortalityPercentage =
    totalInitialBirds > 0
      ? (totalMortality / totalInitialBirds) * 100
      : 0;

  const totalEggs = useMemo(
    () =>
      eggs.reduce(
        (sum, egg) =>
          sum + Number(egg.total_eggs || 0),
        0
      ),
    [eggs]
  );

  const totalSaleableEggs = useMemo(
    () =>
      eggs.reduce(
        (sum, egg) =>
          sum +
          Number(egg.saleable_eggs || 0),
        0
      ),
    [eggs]
  );

  const totalCracked = useMemo(
    () =>
      eggs.reduce(
        (sum, egg) =>
          sum +
          Number(egg.cracked_eggs || 0),
        0
      ),
    [eggs]
  );

  const totalDamaged = useMemo(
    () =>
      eggs.reduce(
        (sum, egg) =>
          sum +
          Number(egg.damaged_eggs || 0),
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
        (sum, feed) =>
          sum + Number(feed.quantity_kg || 0),
        0
      ),
    [feeds]
  );

  const totalFeedCost = useMemo(
    () =>
      feeds.reduce(
        (sum, feed) =>
          sum + Number(feed.total_cost || 0),
        0
      ),
    [feeds]
  );

  const feedPerLiveBird =
    totalLiveBirds > 0
      ? totalFeedKg / totalLiveBirds
      : 0;

  const feedCostPerEgg =
    totalEggs > 0
      ? totalFeedCost / totalEggs
      : 0;

  const veterinaryMortality = veterinary.reduce(
    (sum, record) =>
      sum +
      Number(record.mortality_quantity || 0),
    0
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-slate-600">
              Loading Farmer 360° Profile...
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
            <h1 className="font-bold text-red-800">
              Farmer Profile Not Found
            </h1>

            <p className="mt-2 text-sm text-red-700">
              {error ||
                'The requested farmer could not be found.'}
            </p>

            <Link
              href="/bodhifarm/farmers"
              className="mt-5 inline-block rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white"
            >
              ← Back to Farmers
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
            className="mb-3 inline-block text-sm font-semibold text-green-700 hover:text-green-800"
          >
            ← Back to Farmer Management
          </Link>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                    {farmer.farmer_id}
                  </span>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {farmer.status || 'ACTIVE'}
                  </span>
                </div>

                <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                  {farmer.full_name}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {farmer.mobile ||
                    'Mobile number not available'}
                </p>
              </div>

              <button
                onClick={loadFarmerProfile}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Refresh Profile
              </button>

            </div>
          </div>
        </div>

        {/* FARMER SUMMARY */}

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

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
            label="Feed Consumed"
            value={`${totalFeedKg.toFixed(2)} kg`}
            valueClass="text-orange-600"
          />

          <MetricCard
            label="Feed Cost"
            value={`₹${totalFeedCost.toFixed(2)}`}
            valueClass="text-purple-700"
          />

        </div>

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
              label="Full Name"
              value={farmer.full_name}
            />

            <InfoItem
              label="Mobile"
              value={
                farmer.mobile || 'Not available'
              }
            />

            <InfoItem
              label="Status"
              value={farmer.status || 'ACTIVE'}
            />

          </div>
        </section>

        {/* FARMS */}

        <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Farms
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Farms registered under this farmer.
                </p>
              </div>

              <Link
                href="/bodhifarm/farms"
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
              >
                Manage Farms
              </Link>
            </div>
          </div>

          <div className="p-6">

            {farms.length === 0 ? (
              <div className="rounded-xl bg-amber-50 p-5 text-sm text-amber-700">
                No farm registered for this farmer.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">

                {farms.map((farm) => {
                  const farmBatches =
                    batches.filter(
                      (batch) =>
                        batch.farm_id === farm.id
                    );

                  const farmLiveBirds =
                    farmBatches.reduce(
                      (sum, batch) =>
                        sum +
                        Number(
                          batch.current_quantity || 0
                        ),
                      0
                    );

                  return (
                    <div
                      key={farm.id}
                      className="rounded-xl border border-slate-200 p-5"
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

                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                          {farm.status || 'ACTIVE'}
                        </span>

                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">

                        <InfoItem
                          label="Shed Capacity"
                          value={Number(
                            farm.shed_capacity || 0
                          ).toLocaleString('en-IN')}
                        />

                        <InfoItem
                          label="Bird Batches"
                          value={farmBatches.length}
                        />

                        <InfoItem
                          label="Live Birds"
                          value={farmLiveBirds}
                        />

                        <InfoItem
                          label="Farm Status"
                          value={
                            farm.status || 'ACTIVE'
                          }
                        />

                      </div>
                    </div>
                  );
                })}

              </div>
            )}

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
                  Complete flock information for this farmer.
                </p>
              </div>

              <Link
                href="/bodhifarm"
                className="rounded-lg bg-green-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-green-800"
              >
                Manage Batches
              </Link>

            </div>
          </div>

          <div className="p-6">

            {batches.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                No bird batches registered.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">

                {batches.map((batch) => {
                  const farm = farms.find(
                    (item) =>
                      item.id === batch.farm_id
                  );

                  return (
                    <div
                      key={batch.id}
                      className="rounded-xl border border-slate-200 p-5"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>
                          <p className="text-sm font-bold text-green-700">
                            Batch {batch.batch_code}
                          </p>

                          <h3 className="mt-1 font-semibold text-slate-900">
                            {batch.breed}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {batch.bird_type ||
                              'Bird type not specified'}
                          </p>
                        </div>

                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                          {batch.status || 'ACTIVE'}
                        </span>

                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">

                        <InfoItem
                          label="Farm"
                          value={
                            farm?.farm_name ||
                            'Farm not assigned'
                          }
                        />

                        <InfoItem
                          label="Placement"
                          value={formatDate(
                            batch.placement_date
                          )}
                        />

                        <InfoItem
                          label="Initial"
                          value={Number(
                            batch.initial_quantity || 0
                          )}
                        />

                        <InfoItem
                          label="Live"
                          value={Number(
                            batch.current_quantity || 0
                          )}
                        />

                        <InfoItem
                          label="Mortality"
                          value={Number(
                            batch.mortality_quantity || 0
                          )}
                        />

                        <InfoItem
                          label="Mortality %"
                          value={`${calculatePercentage(
                            Number(
                              batch.mortality_quantity || 0
                            ),
                            Number(
                              batch.initial_quantity || 0
                            )
                          ).toFixed(2)}%`}
                        />

                      </div>

                    </div>
                  );
                })}

              </div>
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
                  Aggregated operational performance for this farmer.
                </p>
              </div>

              <Link
                href="/bodhifarm/performance"
                className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
              >
                Open Performance Dashboard
              </Link>

            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">

            <PerformanceCard
              label="Production"
              value={`${(
                totalLiveBirds > 0
                  ? (totalEggs /
                      totalLiveBirds) *
                    100
                  : 0
              ).toFixed(2)}%`}
              description="Eggs relative to current live birds"
            />

            <PerformanceCard
              label="Mortality Rate"
              value={`${mortalityPercentage.toFixed(
                2
              )}%`}
              description="Mortality against initial birds"
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
              value={eggsPerLiveBird.toFixed(2)}
              description="Total eggs per current live bird"
            />

            <PerformanceCard
              label="Feed / Live Bird"
              value={`${feedPerLiveBird.toFixed(
                3
              )} kg`}
              description="Recorded feed per live bird"
            />

            <PerformanceCard
              label="Feed Cost / Egg"
              value={`₹${feedCostPerEgg.toFixed(
                2
              )}`}
              description="Recorded feed cost per egg"
            />

            <PerformanceCard
              label="Veterinary Records"
              value={veterinary.length}
              description="Health and veterinary records"
            />

            <PerformanceCard
              label="Recorded Vet Mortality"
              value={veterinaryMortality}
              description="Mortality recorded in veterinary records"
            />

          </div>
        </section>

        {/* EGG PRODUCTION */}

        <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Egg Production
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Production records for this farmer.
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

                {eggs.slice(0, 5).map((egg) => (
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
                        Total {Number(
                          egg.total_eggs || 0
                        )}{' '}
                        · Saleable{' '}
                        {Number(
                          egg.saleable_eggs || 0
                        )}
                      </p>
                    </div>

                    <div className="text-sm text-slate-600">
                      Cracked:{' '}
                      {Number(
                        egg.cracked_eggs || 0
                      )}
                      {' · '}
                      Damaged:{' '}
                      {Number(
                        egg.damaged_eggs || 0
                      )}
                    </div>
                  </div>
                ))}

              </div>
            )}

          </div>
        </section>

        {/* FEED */}

        <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Feed Management
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Feed consumption and cost records.
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
                value={`₹${totalFeedCost.toFixed(
                  2
                )}`}
              />

            </div>

            {feeds.length === 0 ? (
              <p className="text-sm text-slate-500">
                No feed records.
              </p>
            ) : (
              <div className="space-y-2">

                {feeds.slice(0, 5).map((feed) => (
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

                    <div className="text-sm font-semibold text-slate-700">
                      {Number(
                        feed.quantity_kg || 0
                      ).toFixed(2)}{' '}
                      kg · ₹
                      {Number(
                        feed.total_cost || 0
                      ).toFixed(2)}
                    </div>
                  </div>
                ))}

              </div>
            )}

          </div>
        </section>

        {/* VETERINARY */}

        <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">

          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Veterinary & Mortality
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Health, treatment and mortality records.
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

                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                          Mortality:{' '}
                          {Number(
                            record.mortality_quantity ||
                              0
                          )}
                        </span>

                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">

                        <p>
                          <strong>Cause:</strong>{' '}
                          {record.cause || '—'}
                        </p>

                        <p>
                          <strong>Diagnosis:</strong>{' '}
                          {record.diagnosis || '—'}
                        </p>

                        <p>
                          <strong>Treatment:</strong>{' '}
                          {record.treatment || '—'}
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

function formatDate(value: string) {
  if (!value) return '—';

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function calculatePercentage(
  numerator: number,
  denominator: number
) {
  if (denominator <= 0) return 0;

  return (numerator / denominator) * 100;
}
