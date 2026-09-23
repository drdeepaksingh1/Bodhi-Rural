'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

type Farmer = {
  id: string;
  farmer_id: string;
  full_name: string;
};

type BirdBatch = {
  id: string;
  batch_code: string;
  breed: string;
  bird_type: string;
  placement_date: string;
  initial_quantity: number;
  current_quantity: number;
  mortality_quantity: number;
  status: string;
  farmer_id: string;
};

type FeedRecord = {
  id: string;
  farmer_id: string;
  batch_id: string | null;
  record_date: string;
  feed_type: string | null;
  quantity_kg: number;
  unit_cost: number | null;
  total_cost: number | null;
};

type EggRecord = {
  id: string;
  farmer_id: string;
  batch_id: string;
  production_date: string;
  total_eggs: number;
  cracked_eggs: number;
  damaged_eggs: number;
  saleable_eggs: number;
};

function getIndiaDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(new Date());
}

function getDateDaysAgo(days: number) {
  const date = new Date();

  date.setDate(date.getDate() - days);

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

export default function PerformancePage() {
  const supabase = createClient();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [batches, setBatches] = useState<BirdBatch[]>([]);
  const [feedRecords, setFeedRecords] = useState<FeedRecord[]>([]);
  const [eggRecords, setEggRecords] = useState<EggRecord[]>([]);

  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  const [fromDate, setFromDate] = useState(
    getDateDaysAgo(6)
  );

  const [toDate, setToDate] = useState(
    getIndiaDate()
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');

    const [
      farmersResponse,
      batchesResponse,
      feedResponse,
      eggResponse,
    ] = await Promise.all([
      supabase
        .from('farmers')
        .select('id, farmer_id, full_name')
        .eq('status', 'ACTIVE')
        .order('farmer_id'),

      supabase
        .from('bird_batches')
        .select(
          `
          id,
          batch_code,
          breed,
          bird_type,
          placement_date,
          initial_quantity,
          current_quantity,
          mortality_quantity,
          status,
          farmer_id
          `
        )
        .order('placement_date', {
          ascending: false,
        }),

      supabase
        .from('feed_records')
        .select(
          `
          id,
          farmer_id,
          batch_id,
          record_date,
          feed_type,
          quantity_kg,
          unit_cost,
          total_cost
          `
        )
        .order('record_date', {
          ascending: false,
        }),

      supabase
        .from('egg_production')
        .select(
          `
          id,
          farmer_id,
          batch_id,
          production_date,
          total_eggs,
          cracked_eggs,
          damaged_eggs,
          saleable_eggs
          `
        )
        .order('production_date', {
          ascending: false,
        }),
    ]);

    if (farmersResponse.error) {
      setError(farmersResponse.error.message);
    }

    if (batchesResponse.error) {
      setError(batchesResponse.error.message);
    }

    if (feedResponse.error) {
      setError(feedResponse.error.message);
    }

    if (eggResponse.error) {
      setError(eggResponse.error.message);
    }

    setFarmers(farmersResponse.data || []);
    setBatches(batchesResponse.data || []);
    setFeedRecords(feedResponse.data || []);
    setEggRecords(eggResponse.data || []);

    setLoading(false);
  }

  const farmerBatches = useMemo(() => {
    if (!selectedFarmer) return [];

    return batches.filter(
      (batch) =>
        batch.farmer_id === selectedFarmer
    );
  }, [batches, selectedFarmer]);

  const selectedBatchData = useMemo(() => {
    return batches.find(
      (batch) => batch.id === selectedBatch
    );
  }, [batches, selectedBatch]);

  const filteredFeed = useMemo(() => {
    return feedRecords.filter((record) => {
      const farmerMatch =
        !selectedFarmer ||
        record.farmer_id === selectedFarmer;

      const batchMatch =
        !selectedBatch ||
        record.batch_id === selectedBatch;

      const dateMatch =
        record.record_date >= fromDate &&
        record.record_date <= toDate;

      return farmerMatch && batchMatch && dateMatch;
    });
  }, [
    feedRecords,
    selectedFarmer,
    selectedBatch,
    fromDate,
    toDate,
  ]);

  const filteredEggs = useMemo(() => {
    return eggRecords.filter((record) => {
      const farmerMatch =
        !selectedFarmer ||
        record.farmer_id === selectedFarmer;

      const batchMatch =
        !selectedBatch ||
        record.batch_id === selectedBatch;

      const dateMatch =
        record.production_date >= fromDate &&
        record.production_date <= toDate;

      return farmerMatch && batchMatch && dateMatch;
    });
  }, [
    eggRecords,
    selectedFarmer,
    selectedBatch,
    fromDate,
    toDate,
  ]);

  const metrics = useMemo(() => {
    const feedKg = filteredFeed.reduce(
      (sum, item) =>
        sum + Number(item.quantity_kg || 0),
      0
    );

    const feedCost = filteredFeed.reduce(
      (sum, item) =>
        sum + Number(item.total_cost || 0),
      0
    );

    const totalEggs = filteredEggs.reduce(
      (sum, item) =>
        sum + Number(item.total_eggs || 0),
      0
    );

    const saleableEggs = filteredEggs.reduce(
      (sum, item) =>
        sum + Number(item.saleable_eggs || 0),
      0
    );

    const crackedEggs = filteredEggs.reduce(
      (sum, item) =>
        sum + Number(item.cracked_eggs || 0),
      0
    );

    const damagedEggs = filteredEggs.reduce(
      (sum, item) =>
        sum + Number(item.damaged_eggs || 0),
      0
    );

    const initialBirds =
      selectedBatchData?.initial_quantity || 0;

    const liveBirds =
      selectedBatchData?.current_quantity || 0;

    const mortality =
      selectedBatchData?.mortality_quantity || 0;

    const mortalityPercentage =
      initialBirds > 0
        ? (mortality / initialBirds) * 100
        : 0;

    const productionPercentage =
      liveBirds > 0
        ? (totalEggs / liveBirds) * 100
        : 0;

    const eggsPerLiveBird =
      liveBirds > 0
        ? totalEggs / liveBirds
        : 0;

    const feedPerLiveBird =
      liveBirds > 0
        ? feedKg / liveBirds
        : 0;

    const feedCostPerEgg =
      totalEggs > 0
        ? feedCost / totalEggs
        : 0;

    const feedKgPerEgg =
      totalEggs > 0
        ? feedKg / totalEggs
        : 0;

    return {
      initialBirds,
      liveBirds,
      mortality,
      mortalityPercentage,
      feedKg,
      feedCost,
      totalEggs,
      saleableEggs,
      crackedEggs,
      damagedEggs,
      productionPercentage,
      eggsPerLiveBird,
      feedPerLiveBird,
      feedCostPerEgg,
      feedKgPerEgg,
    };
  }, [
    filteredFeed,
    filteredEggs,
    selectedBatchData,
  ]);

  function handleFarmerChange(
    value: string
  ) {
    setSelectedFarmer(value);
    setSelectedBatch('');
  }

  function formatNumber(
    value: number,
    decimals = 2
  ) {
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div>
            <a
              href="/bodhifarm"
              className="text-sm font-medium text-green-700 hover:underline"
            >
              ← Back to BodhiFarm
            </a>

            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              BodhiFarm Performance
            </h1>

            <p className="text-sm text-gray-500">
              Bird, feed and egg production performance
            </p>
          </div>

          <img
            src="/branding/bodhi-rural-logo.png"
            alt="Bodhi Rural Livelihood and Agri Private Limited"
            className="h-auto w-[210px] object-contain"
          />

        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">

        {/* Filters */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-gray-900">
            Performance Filters
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-4">

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Farmer
              </label>

              <select
                value={selectedFarmer}
                onChange={(e) =>
                  handleFarmerChange(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">
                  All Farmers
                </option>

                {farmers.map((farmer) => (
                  <option
                    key={farmer.id}
                    value={farmer.id}
                  >
                    {farmer.farmer_id} —{' '}
                    {farmer.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bird Batch
              </label>

              <select
                value={selectedBatch}
                onChange={(e) =>
                  setSelectedBatch(e.target.value)
                }
                disabled={!selectedFarmer}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm disabled:bg-gray-100"
              >
                <option value="">
                  {selectedFarmer
                    ? 'All Batches'
                    : 'Select Farmer First'}
                </option>

                {farmerBatches.map((batch) => (
                  <option
                    key={batch.id}
                    value={batch.id}
                  >
                    {batch.batch_code} —{' '}
                    {batch.breed}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                From Date
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={(e) =>
                  setFromDate(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                To Date
              </label>

              <input
                type="date"
                value={toDate}
                onChange={(e) =>
                  setToDate(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              />
            </div>

          </div>

          {selectedBatchData && (
            <div className="mt-5 rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">
                {selectedBatchData.batch_code} —{' '}
                {selectedBatchData.breed}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {selectedBatchData.bird_type} ·
                Placed{' '}
                {selectedBatchData.placement_date}
              </p>
            </div>
          )}

        </section>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Bird KPIs */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Flock Performance
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Initial Birds
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {selectedBatchData
                  ? metrics.initialBirds
                  : '—'}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Live Birds
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {selectedBatchData
                  ? metrics.liveBirds
                  : '—'}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Mortality
              </p>

              <p className="mt-2 text-3xl font-bold text-red-600">
                {selectedBatchData
                  ? metrics.mortality
                  : '—'}
              </p>

              {selectedBatchData && (
                <p className="mt-1 text-xs text-gray-500">
                  {formatNumber(
                    metrics.mortalityPercentage,
                    2
                  )}
                  %
                </p>
              )}
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Production %
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-700">
                {selectedBatchData
                  ? `${formatNumber(
                      metrics.productionPercentage,
                      2
                    )}%`
                  : '—'}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Eggs ÷ current live birds
              </p>
            </div>

          </div>
        </section>

        {/* Egg KPIs */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Egg Performance
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Total Eggs
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {metrics.totalEggs}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Saleable Eggs
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {metrics.saleableEggs}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Cracked + Damaged
              </p>

              <p className="mt-2 text-3xl font-bold text-orange-600">
                {metrics.crackedEggs +
                  metrics.damagedEggs}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Eggs / Live Bird
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-700">
                {formatNumber(
                  metrics.eggsPerLiveBird,
                  2
                )}
              </p>
            </div>

          </div>
        </section>

        {/* Feed KPIs */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Feed Performance
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Feed Consumed
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatNumber(
                  metrics.feedKg,
                  2
                )}{' '}
                kg
              </p>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Feed Cost
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                ₹
                {formatNumber(
                  metrics.feedCost,
                  2
                )}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Feed / Live Bird
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-700">
                {formatNumber(
                  metrics.feedPerLiveBird,
                  3
                )}{' '}
                kg
              </p>
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Feed Cost / Egg
              </p>

              <p className="mt-2 text-3xl font-bold text-orange-600">
                ₹
                {formatNumber(
                  metrics.feedCostPerEgg,
                  2
                )}
              </p>
            </div>

          </div>
        </section>

        {/* Efficiency */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-gray-900">
            Production Efficiency
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-3">

            <div className="rounded-lg bg-gray-50 p-5">
              <p className="text-sm text-gray-500">
                Feed per Egg
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatNumber(
                  metrics.feedKgPerEgg,
                  4
                )}{' '}
                kg/egg
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Feed kg ÷ total eggs
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-5">
              <p className="text-sm text-gray-500">
                Saleable Egg Rate
              </p>

              <p className="mt-2 text-2xl font-bold text-green-700">
                {metrics.totalEggs > 0
                  ? formatNumber(
                      (metrics.saleableEggs /
                        metrics.totalEggs) *
                        100,
                      2
                    )
                  : '0.00'}
                %
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-5">
              <p className="text-sm text-gray-500">
                FCR Status
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                Not Available
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Egg-weight data is required for true FCR.
              </p>
            </div>

          </div>

        </section>

        {/* Record Summary */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-gray-900">
            Data Summary
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">

            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-500">
                Feed Records
              </p>

              <p className="mt-1 text-2xl font-bold">
                {filteredFeed.length}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-500">
                Egg Production Records
              </p>

              <p className="mt-1 text-2xl font-bold">
                {filteredEggs.length}
              </p>
            </div>

          </div>

        </section>

        {loading && (
          <div className="rounded-lg bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
            Loading performance data...
          </div>
        )}

      </div>
    </main>
  );
}
