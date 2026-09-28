'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

type Farmer = {
  id: string;
  farmer_id: string;
  full_name: string;
};

type Farm = {
  id: string;
  farmer_id: string;
  farm_name: string | null;
  farm_type: string | null;
  shed_capacity: number | null;
  status: string;
};

type BirdBatch = {
  id: string;
  batch_code: string;
  breed: string;
  bird_type: string | null;
  placement_date: string;
  initial_quantity: number;
  current_quantity: number;
  mortality_quantity: number;
  source: string | null;
  status: string;
  farmer_id: string;
  farm_id: string | null;
};

type EggRecord = {
  id: string;
  total_eggs: number | null;
  saleable_eggs: number | null;
};

type FeedRecord = {
  id: string;
  quantity_kg: number | null;
  total_cost: number | null;
};

type VeterinaryRecord = {
  id: string;
  mortality_quantity: number | null;
};

const breeds = [
  'Gallus gallus domesticus',
  'Kadaknath',
  'Desi / Deshi',
  'Sonali',
  'RIR (Rhode Island Red)',
  'Black Australorp',
  'Ginni',
  'Other',
];

const birdTypes = [
  'Layer',
  'Broiler',
  'Dual Purpose',
  'Breeder',
  'Other',
];

const statuses = [
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
];

export default function BodhiFarmPage() {
  const supabase = createClient();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [allFarms, setAllFarms] = useState<Farm[]>([]);
  const [batches, setBatches] = useState<BirdBatch[]>([]);
  const [eggs, setEggs] = useState<EggRecord[]>([]);
  const [feeds, setFeeds] = useState<FeedRecord[]>([]);
  const [veterinary, setVeterinary] = useState<VeterinaryRecord[]>([]);

  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [selectedFarm, setSelectedFarm] = useState('');

  const [breed, setBreed] = useState('');
  const [birdType, setBirdType] = useState('');
  const [placementDate, setPlacementDate] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [mortalityQuantity, setMortalityQuantity] = useState('0');
  const [source, setSource] = useState('Bodhi Rural');
  const [status, setStatus] = useState('ACTIVE');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingFarms, setLoadingFarms] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  /*
   * ---------------------------------------------------------
   * LOAD FARMERS
   * ---------------------------------------------------------
   */

  async function loadFarmers() {
    const { data, error } = await supabase
      .from('farmers')
      .select('id, farmer_id, full_name')
      .eq('status', 'ACTIVE')
      .order('full_name', { ascending: true });

    if (error) {
      setError(`Unable to load farmers: ${error.message}`);
      return;
    }

    setFarmers(data ?? []);
  }

  /*
   * ---------------------------------------------------------
   * LOAD FARMS
   * ---------------------------------------------------------
   */

  async function loadAllFarms() {
    const { data, error } = await supabase
      .from('farms')
      .select(
        'id, farmer_id, farm_name, farm_type, shed_capacity, status'
      )
      .order('created_at', { ascending: true });

    if (error) {
      setError(`Unable to load farms: ${error.message}`);
      return;
    }

    setAllFarms(data ?? []);
  }

  /*
   * ---------------------------------------------------------
   * LOAD BIRD BATCHES
   * ---------------------------------------------------------
   */

  async function loadBatches() {
    const { data, error } = await supabase
      .from('bird_batches')
      .select(`
        id,
        batch_code,
        breed,
        bird_type,
        placement_date,
        initial_quantity,
        current_quantity,
        mortality_quantity,
        source,
        status,
        farmer_id,
        farm_id
      `)
      .order('created_at', { ascending: false });

    if (error) {
      setError(`Unable to load bird batches: ${error.message}`);
      return;
    }

    setBatches(data ?? []);
  }

  /*
   * ---------------------------------------------------------
   * LOAD OPERATIONAL DATA
   * ---------------------------------------------------------
   */

  async function loadOperationalData() {
    const [
      eggsResult,
      feedsResult,
      veterinaryResult,
    ] = await Promise.all([
      supabase
        .from('egg_production')
        .select('id, total_eggs, saleable_eggs'),

      supabase
        .from('feed_records')
        .select('id, quantity_kg, total_cost'),

      supabase
        .from('veterinary_records')
        .select('id, mortality_quantity'),
    ]);

    if (eggsResult.error) {
      setError(
        `Unable to load egg production: ${eggsResult.error.message}`
      );
    } else {
      setEggs(eggsResult.data ?? []);
    }

    if (feedsResult.error) {
      setError(
        `Unable to load feed records: ${feedsResult.error.message}`
      );
    } else {
      setFeeds(feedsResult.data ?? []);
    }

    if (veterinaryResult.error) {
      setError(
        `Unable to load veterinary records: ${veterinaryResult.error.message}`
      );
    } else {
      setVeterinary(veterinaryResult.data ?? []);
    }
  }

  /*
   * ---------------------------------------------------------
   * LOAD FARMS FOR SELECTED FARMER
   * ---------------------------------------------------------
   */

  async function loadFarms(farmerId: string) {
    setFarms([]);
    setSelectedFarm('');

    if (!farmerId) {
      return;
    }

    setLoadingFarms(true);
    setError('');

    const { data, error } = await supabase
      .from('farms')
      .select(
        'id, farmer_id, farm_name, farm_type, shed_capacity, status'
      )
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: true });

    setLoadingFarms(false);

    if (error) {
      setError(`Unable to load farms: ${error.message}`);
      return;
    }

    setFarms(data ?? []);
  }

  /*
   * ---------------------------------------------------------
   * INITIAL LOAD
   * ---------------------------------------------------------
   */

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setError('');

      await Promise.all([
        loadFarmers(),
        loadAllFarms(),
        loadBatches(),
        loadOperationalData(),
      ]);

      setLoading(false);
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    loadFarms(selectedFarmer);
  }, [selectedFarmer]);

  /*
   * ---------------------------------------------------------
   * SAVE BIRD BATCH
   *
   * Batch code is generated automatically by Supabase.
   * ---------------------------------------------------------
   */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError('');
    setMessage('');

    if (!selectedFarmer) {
      setError('Please select a farmer.');
      return;
    }

    if (!selectedFarm) {
      setError('Please select a farm.');
      return;
    }

    if (!breed) {
      setError('Please select a breed.');
      return;
    }

    if (!placementDate) {
      setError('Please select the placement date.');
      return;
    }

    const initial = Number(initialQuantity);
    const current = Number(currentQuantity);
    const mortality = Number(mortalityQuantity);

    if (!Number.isInteger(initial) || initial <= 0) {
      setError(
        'Initial quantity must be a whole number greater than 0.'
      );
      return;
    }

    if (!Number.isInteger(current) || current < 0) {
      setError(
        'Current quantity must be 0 or greater.'
      );
      return;
    }

    if (!Number.isInteger(mortality) || mortality < 0) {
      setError(
        'Mortality must be 0 or greater.'
      );
      return;
    }

    if (current + mortality > initial) {
      setError(
        'Current quantity plus mortality cannot exceed initial quantity.'
      );
      return;
    }

    setSaving(true);

    /*
     * IMPORTANT:
     * batch_code is intentionally NOT supplied.
     *
     * Supabase trigger:
     * generate_bird_batch_code()
     * generates the official batch code automatically.
     */

    const { data: insertedBatch, error: insertError } =
      await supabase
        .from('bird_batches')
        .insert({
          farmer_id: selectedFarmer,
          farm_id: selectedFarm,
          breed,
          bird_type: birdType || null,
          placement_date: placementDate,
          initial_quantity: initial,
          current_quantity: current,
          mortality_quantity: mortality,
          source: source.trim() || null,
          status,
        })
        .select('id, batch_code')
        .single();

    setSaving(false);

    if (insertError) {
      setError(
        `Unable to save bird batch: ${insertError.message}`
      );
      return;
    }

    const generatedBatchCode =
      insertedBatch?.batch_code || 'Batch';

    setMessage(
      `Bird batch ${generatedBatchCode} has been successfully created.`
    );

    setSelectedFarmer('');
    setSelectedFarm('');
    setFarms([]);
    setBreed('');
    setBirdType('');
    setPlacementDate('');
    setInitialQuantity('');
    setCurrentQuantity('');
    setMortalityQuantity('0');
    setSource('Bodhi Rural');
    setStatus('ACTIVE');

    await Promise.all([
      loadBatches(),
      loadAllFarms(),
      loadOperationalData(),
    ]);
  }

  /*
   * ---------------------------------------------------------
   * HELPERS
   * ---------------------------------------------------------
   */

  function getFarmerName(farmerId: string) {
    const farmer = farmers.find(
      (item) => item.id === farmerId
    );

    return farmer
      ? `${farmer.farmer_id} — ${farmer.full_name}`
      : farmerId;
  }

  function getFarmerShortName(farmerId: string) {
    const farmer = farmers.find(
      (item) => item.id === farmerId
    );

    return farmer?.full_name || 'Unknown Farmer';
  }

  function getFarmName(farmId: string | null) {
    if (!farmId) {
      return 'No farm assigned';
    }

    const farm = allFarms.find(
      (item) => item.id === farmId
    );

    if (!farm) {
      return 'Farm not found';
    }

    return farm.farm_name || 'Unnamed Farm';
  }

  function getFarmType(farmId: string | null) {
    if (!farmId) {
      return '';
    }

    const farm = allFarms.find(
      (item) => item.id === farmId
    );

    return farm?.farm_type || '';
  }

  function getSurvivalRate(batch: BirdBatch) {
    if (!batch.initial_quantity) {
      return 0;
    }

    return (
      (batch.current_quantity /
        batch.initial_quantity) *
      100
    );
  }

  function formatDate(value: string) {
    if (!value) {
      return '—';
    }

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

  function getStatusClass(statusValue: string) {
    if (statusValue === 'ACTIVE') {
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    }

    if (statusValue === 'COMPLETED') {
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    }

    if (statusValue === 'CANCELLED') {
      return 'bg-red-100 text-red-700 border border-red-200';
    }

    return 'bg-slate-100 text-slate-700 border border-slate-200';
  }

  /*
   * ---------------------------------------------------------
   * TOTALS
   * ---------------------------------------------------------
   */

  const totalInitialBirds = batches.reduce(
    (sum, batch) =>
      sum + Number(batch.initial_quantity || 0),
    0
  );

  const totalCurrentBirds = batches.reduce(
    (sum, batch) =>
      sum + Number(batch.current_quantity || 0),
    0
  );

  const totalMortality = batches.reduce(
    (sum, batch) =>
      sum + Number(batch.mortality_quantity || 0),
    0
  );

  const totalFarms = allFarms.length;

  const totalEggs = eggs.reduce(
    (sum, record) =>
      sum + Number(record.total_eggs || 0),
    0
  );

  const totalSaleableEggs = eggs.reduce(
    (sum, record) =>
      sum + Number(record.saleable_eggs || 0),
    0
  );

  const totalFeedKg = feeds.reduce(
    (sum, record) =>
      sum + Number(record.quantity_kg || 0),
    0
  );

  const totalFeedCost = feeds.reduce(
    (sum, record) =>
      sum + Number(record.total_cost || 0),
    0
  );

  const totalVeterinaryRecords =
    veterinary.length;

  const overallSurvivalRate =
    totalInitialBirds > 0
      ? (totalCurrentBirds / totalInitialBirds) * 100
      : 0;

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

            <p className="font-medium text-slate-700">
              Loading BodhiFarm...
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Connecting to the live farming database.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* =====================================================
          PAGE TITLE
          ===================================================== */}

      <div className="mx-auto max-w-7xl px-6 pt-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              BodhiFarm Operations Center
            </h1>

            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              Manage farmers, farms, bird batches, production,
              feed, veterinary records and flock performance.
            </p>
          </div>

          <a
            href="/dashboard"
            className="inline-flex w-fit rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100"
          >
            ← Dashboard
          </a>

        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* ===================================================
            OVERVIEW
            =================================================== */}

        <div className="mb-8">

          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              BodhiFarm Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Live overview of farmers, farms, birds,
              eggs, feed and veterinary operations.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Active Farmers
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-700">
                {farmers.length.toLocaleString('en-IN')}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Registered active farmers
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Farms
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-700">
                {totalFarms.toLocaleString('en-IN')}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Registered farms
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Live Birds
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-700">
                {totalCurrentBirds.toLocaleString('en-IN')}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Current flock
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Mortality
              </p>

              <p className="mt-2 text-3xl font-bold text-red-600">
                {totalMortality.toLocaleString('en-IN')}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Total recorded mortality
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Total Eggs
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-600">
                {totalEggs.toLocaleString('en-IN')}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Recorded production
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Saleable Eggs
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {totalSaleableEggs.toLocaleString('en-IN')}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Saleable production
              </p>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Feed Consumed
              </p>

              <p className="mt-2 text-3xl font-bold text-orange-600">
                {totalFeedKg.toFixed(2)} kg
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Recorded feed
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Feed Cost
              </p>

              <p className="mt-2 text-3xl font-bold text-purple-700">
                ₹
                {totalFeedCost.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Recorded feed cost
              </p>
            </div>

          </div>

        </div>

        {/* ===================================================
            MODULES
            =================================================== */}

        <div className="mb-8">

          <h2 className="mb-5 text-xl font-bold text-slate-900">
            BodhiFarm Modules
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <a
              href="/bodhifarm/farmers"
              className="rounded-xl border bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <p className="font-bold text-slate-900">
                Farmer Management
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Farmer profiles and operational summaries.
              </p>
            </a>

            <a
              href="/bodhifarm/farms"
              className="rounded-xl border bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <p className="font-bold text-slate-900">
                Farm Management
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Register farms and manage farm capacity.
              </p>
            </a>

            <a
              href="/bodhifarm/egg-production"
              className="rounded-xl border bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <p className="font-bold text-slate-900">
                Egg Production
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Record and monitor egg production.
              </p>
            </a>

            <a
              href="/bodhifarm/feed"
              className="rounded-xl border bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <p className="font-bold text-slate-900">
                Feed Management
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Feed issue, consumption and cost.
              </p>
            </a>

            <a
              href="/bodhifarm/veterinary"
              className="rounded-xl border bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <p className="font-bold text-slate-900">
                Veterinary & Mortality
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Health events and mortality management.
              </p>
            </a>

            <a
              href="/bodhifarm/performance"
              className="rounded-xl border bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <p className="font-bold text-slate-900">
                Performance Dashboard
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Bird, egg and feed performance.
              </p>
            </a>

            <a
              href="/bodhifarm"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm transition hover:bg-emerald-100"
            >
              <p className="font-bold text-emerald-800">
                Bird Batch Management
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                Register and manage poultry batches.
              </p>
            </a>

            <a
              href="/bodhifarm/performance"
              className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:bg-slate-100"
            >
              <p className="font-bold text-slate-800">
                Flock Performance
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Analyze flock-level production efficiency.
              </p>
            </a>

          </div>

        </div>

        {/* ===================================================
            BATCH SUMMARY
            =================================================== */}

        <div className="grid gap-5 md:grid-cols-5">

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Batches
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {batches.length.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Initial Birds
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {totalInitialBirds.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Current Birds
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {totalCurrentBirds.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Mortality
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {totalMortality.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Overall Survival
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              {overallSurvivalRate.toFixed(2)}%
            </p>
          </div>

        </div>

        {/* ===================================================
            MESSAGES
            =================================================== */}

        {error && (
          <div className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

            <div>
              <p className="font-semibold">
                Operation Error
              </p>

              <p className="mt-1">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError('')}
              className="text-xs font-semibold text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>

          </div>
        )}

        {message && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            <p className="font-semibold">
              Success
            </p>

            <p className="mt-1">
              {message}
            </p>
          </div>
        )}

        {/* ===================================================
            ADD BIRD BATCH
            =================================================== */}

        <div className="mt-8 rounded-2xl border bg-white shadow-sm">

          <div className="border-b px-6 py-5">

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add Bird Batch
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Register a new poultry batch under a farmer and farm.
                </p>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2">
                <p className="text-xs font-semibold text-emerald-700">
                  Automatic Batch Number
                </p>

                <p className="text-xs text-emerald-600">
                  Generated by Supabase
                </p>
              </div>

            </div>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6"
          >

            {/* FARMER / FARM */}

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Farmer *
                </label>

                <select
                  value={selectedFarmer}
                  onChange={(event) =>
                    setSelectedFarmer(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600"
                  required
                >

                  <option value="">
                    Select farmer
                  </option>

                  {farmers.map((farmer) => (
                    <option
                      key={farmer.id}
                      value={farmer.id}
                    >
                      {farmer.farmer_id} — {farmer.full_name}
                    </option>
                  ))}

                </select>

              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Farm *
                </label>

                <select
                  value={selectedFarm}
                  onChange={(event) =>
                    setSelectedFarm(event.target.value)
                  }
                  disabled={
                    !selectedFarmer ||
                    loadingFarms
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-slate-100 focus:border-emerald-600"
                  required
                >

                  <option value="">
                    {loadingFarms
                      ? 'Loading farms...'
                      : selectedFarmer
                        ? farms.length > 0
                          ? 'Select farm'
                          : 'No farm available'
                        : 'Select farmer first'}
                  </option>

                  {farms.map((farm) => (
                    <option
                      key={farm.id}
                      value={farm.id}
                    >
                      {farm.farm_name || 'Unnamed Farm'}
                      {farm.farm_type
                        ? ` — ${farm.farm_type}`
                        : ''}
                    </option>
                  ))}

                </select>

                {selectedFarmer &&
                  !loadingFarms &&
                  farms.length === 0 && (
                    <p className="mt-2 text-xs text-red-600">
                      No farm is registered for this farmer.
                      Please create the farm first.
                    </p>
                  )}

              </div>

            </div>

            {/* AUTOMATIC BATCH CODE */}

            <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50 px-5 py-4">

              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    Batch Code
                  </p>

                  <p className="mt-1 text-xs text-emerald-700">
                    The system will automatically generate the
                    official batch number after saving.
                  </p>
                </div>

                <div className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-500 shadow-sm">
                  AUTO
                </div>

              </div>

            </div>

            {/* BREED / TYPE */}

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Breed *
                </label>

                <select
                  value={breed}
                  onChange={(event) =>
                    setBreed(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600"
                  required
                >

                  <option value="">
                    Select breed
                  </option>

                  {breeds.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}

                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Bird Type
                </label>

                <select
                  value={birdType}
                  onChange={(event) =>
                    setBirdType(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600"
                >

                  <option value="">
                    Select bird type
                  </option>

                  {birdTypes.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}

                </select>
              </div>

            </div>

            {/* DATE */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Placement Date *
              </label>

              <input
                type="date"
                value={placementDate}
                onChange={(event) =>
                  setPlacementDate(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600 md:max-w-md"
                required
              />

            </div>

            {/* QUANTITIES */}

            <div className="grid gap-5 md:grid-cols-3">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Initial Quantity *
                </label>

                <input
                  type="number"
                  min="1"
                  value={initialQuantity}
                  onChange={(event) =>
                    setInitialQuantity(event.target.value)
                  }
                  placeholder="300"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Current Quantity *
                </label>

                <input
                  type="number"
                  min="0"
                  value={currentQuantity}
                  onChange={(event) =>
                    setCurrentQuantity(event.target.value)
                  }
                  placeholder="300"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Mortality
                </label>

                <input
                  type="number"
                  min="0"
                  value={mortalityQuantity}
                  onChange={(event) =>
                    setMortalityQuantity(event.target.value)
                  }
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                />
              </div>

            </div>

            {/* SOURCE / STATUS */}

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Source
                </label>

                <input
                  type="text"
                  value={source}
                  onChange={(event) =>
                    setSource(event.target.value)
                  }
                  placeholder="Bodhi Rural"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Status *
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600"
                  required
                >

                  {statuses.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}

                </select>
              </div>

            </div>

            {/* SUBMIT */}

            <div className="flex justify-end border-t pt-6">

              <button
                type="submit"
                disabled={saving || loadingFarms}
                className="rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? 'Creating Batch...'
                  : 'Create Bird Batch'}
              </button>

            </div>

          </form>

        </div>

        {/* ===================================================
            BIRD BATCH LIST
            =================================================== */}

        <div className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">

          <div className="border-b px-6 py-5">

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Bird Batches
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  All bird batches registered in BodhiFarm.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-600">
                {batches.length.toLocaleString('en-IN')} batch
                {batches.length === 1 ? '' : 'es'}
              </div>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="min-w-[1250px] w-full text-sm">

              <thead className="bg-slate-50">

                <tr>

                  <th className="px-5 py-4 text-left font-semibold text-slate-600">
                    Batch
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-600">
                    Farmer
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-600">
                    Farm
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-600">
                    Breed
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-600">
                    Type
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-600">
                    Placement
                  </th>

                  <th className="px-5 py-4 text-right font-semibold text-slate-600">
                    Initial
                  </th>

                  <th className="px-5 py-4 text-right font-semibold text-slate-600">
                    Current
                  </th>

                  <th className="px-5 py-4 text-right font-semibold text-slate-600">
                    Mortality
                  </th>

                  <th className="px-5 py-4 text-right font-semibold text-slate-600">
                    Survival
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-600">
                    Status
                  </th>

                  <th className="px-5 py-4 text-center font-semibold text-slate-600">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y">

                {batches.map((batch) => {

                  const survivalRate =
                    getSurvivalRate(batch);

                  return (
                    <tr
                      key={batch.id}
                      className="transition hover:bg-slate-50"
                    >

                      {/* BATCH */}

                      <td className="px-5 py-4">

                        <a
                          href={`/bodhifarm/batches/${batch.id}`}
                          className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                        >
                          {batch.batch_code}
                        </a>

                        <p className="mt-1 text-xs text-slate-400">
                          {batch.source || 'Source not specified'}
                        </p>

                      </td>

                      {/* FARMER */}

                      <td className="px-5 py-4">

                        <p className="font-semibold text-slate-800">
                          {getFarmerShortName(
                            batch.farmer_id
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {getFarmerName(
                            batch.farmer_id
                          ).split(' — ')[0]}
                        </p>

                      </td>

                      {/* FARM */}

                      <td className="px-5 py-4">

                        <p className="font-semibold text-slate-800">
                          {getFarmName(
                            batch.farm_id
                          )}
                        </p>

                        {getFarmType(batch.farm_id) && (
                          <p className="mt-1 text-xs text-slate-500">
                            {getFarmType(batch.farm_id)}
                          </p>
                        )}

                      </td>

                      {/* BREED */}

                      <td className="px-5 py-4 text-slate-700">
                        {batch.breed}
                      </td>

                      {/* TYPE */}

                      <td className="px-5 py-4 text-slate-700">
                        {batch.bird_type || '—'}
                      </td>

                      {/* PLACEMENT */}

                      <td className="px-5 py-4 whitespace-nowrap text-slate-700">
                        {formatDate(
                          batch.placement_date
                        )}
                      </td>

                      {/* INITIAL */}

                      <td className="px-5 py-4 text-right">
                        {batch.initial_quantity.toLocaleString(
                          'en-IN'
                        )}
                      </td>

                      {/* CURRENT */}

                      <td className="px-5 py-4 text-right font-bold text-emerald-700">
                        {batch.current_quantity.toLocaleString(
                          'en-IN'
                        )}
                      </td>

                      {/* MORTALITY */}

                      <td className="px-5 py-4 text-right font-semibold text-red-600">
                        {batch.mortality_quantity.toLocaleString(
                          'en-IN'
                        )}
                      </td>

                      {/* SURVIVAL */}

                      <td className="px-5 py-4 text-right">

                        <span
                          className={
                            survivalRate >= 95
                              ? 'font-bold text-emerald-700'
                              : survivalRate >= 90
                                ? 'font-bold text-amber-600'
                                : 'font-bold text-red-600'
                          }
                        >
                          {survivalRate.toFixed(1)}%
                        </span>

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            batch.status
                          )}`}
                        >
                          {batch.status}
                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">

                        <div className="flex items-center justify-center gap-2">

                          <a
                            href={`/bodhifarm/batches/${batch.id}`}
                            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
                          >
                            View 360°
                          </a>

                          <a
                            href={`/bodhifarm/batches/${batch.id}`}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Edit
                          </a>

                        </div>

                      </td>

                    </tr>
                  );
                })}

                {batches.length === 0 && (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-6 py-16 text-center"
                    >

                      <div className="mx-auto max-w-md">

                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl">
                          🐔
                        </div>

                        <p className="mt-4 font-semibold text-slate-800">
                          No bird batches registered yet
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Create your first bird batch using
                          the form above.
                        </p>

                      </div>

                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* ===================================================
            OPERATIONAL SUMMARY
            =================================================== */}

        <div className="mt-8 grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl border bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Egg Production Records
            </p>

            <p className="mt-2 text-2xl font-bold text-amber-600">
              {eggs.length.toLocaleString('en-IN')}
            </p>

            <a
              href="/bodhifarm/egg-production"
              className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline"
            >
              Open Egg Production →
            </a>

          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Feed Records
            </p>

            <p className="mt-2 text-2xl font-bold text-orange-600">
              {feeds.length.toLocaleString('en-IN')}
            </p>

            <a
              href="/bodhifarm/feed"
              className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline"
            >
              Open Feed Management →
            </a>

          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Veterinary Records
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {totalVeterinaryRecords.toLocaleString('en-IN')}
            </p>

            <a
              href="/bodhifarm/veterinary"
              className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline"
            >
              Open Veterinary →
            </a>

          </div>

        </div>

      </section>

    </main>
  );
}
