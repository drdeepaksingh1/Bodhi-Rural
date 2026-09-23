'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/client';

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
  status: string | null;
};

type BirdBatch = {
  id: string;
  farmer_id: string;
  batch_code: string;
  initial_quantity: number | null;
  current_quantity: number | null;
  mortality_quantity: number | null;
  status: string | null;
};

type EggRecord = {
  id: string;
  farmer_id: string;
  total_eggs: number | null;
  saleable_eggs: number | null;
  cracked_eggs: number | null;
  damaged_eggs: number | null;
};

type FeedRecord = {
  id: string;
  farmer_id: string;
  quantity_kg: number | null;
  total_cost: number | null;
};

type VeterinaryRecord = {
  id: string;
  farmer_id: string;
  record_type: string | null;
  mortality_quantity: number | null;
};

type FarmerSummary = Farmer & {
  farms: number;
  batches: number;
  initialBirds: number;
  liveBirds: number;
  mortality: number;
  eggs: number;
  saleableEggs: number;
  feedKg: number;
  feedCost: number;
  veterinaryRecords: number;
};

export default function FarmerManagementPage() {
  const supabase = createClient();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [batches, setBatches] = useState<BirdBatch[]>([]);
  const [eggs, setEggs] = useState<EggRecord[]>([]);
  const [feeds, setFeeds] = useState<FeedRecord[]>([]);
  const [veterinary, setVeterinary] = useState<VeterinaryRecord[]>([]);

  const [search, setSearch] = useState('');
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [
        farmersResult,
        farmsResult,
        batchesResult,
        eggsResult,
        feedsResult,
        veterinaryResult,
      ] = await Promise.all([
        supabase
          .from('farmers')
          .select('id, farmer_id, full_name, mobile, status')
          .order('created_at', { ascending: false }),

        supabase
          .from('farms')
          .select('id, farmer_id, farm_name, farm_type, status'),

        supabase
          .from('bird_batches')
          .select(
            'id, farmer_id, batch_code, initial_quantity, current_quantity, mortality_quantity, status'
          ),

        supabase
          .from('egg_production')
          .select(
            'id, farmer_id, total_eggs, saleable_eggs, cracked_eggs, damaged_eggs'
          ),

        supabase
          .from('feed_records')
          .select('id, farmer_id, quantity_kg, total_cost'),

        supabase
          .from('veterinary_records')
          .select(
            'id, farmer_id, record_type, mortality_quantity'
          ),
      ]);

      const results = [
        farmersResult,
        farmsResult,
        batchesResult,
        eggsResult,
        feedsResult,
        veterinaryResult,
      ];

      const failed = results.find((result) => result.error);

      if (failed?.error) {
        throw new Error(failed.error.message);
      }

      setFarmers((farmersResult.data || []) as Farmer[]);
      setFarms((farmsResult.data || []) as Farm[]);
      setBatches((batchesResult.data || []) as BirdBatch[]);
      setEggs((eggsResult.data || []) as EggRecord[]);
      setFeeds((feedsResult.data || []) as FeedRecord[]);
      setVeterinary(
        (veterinaryResult.data || []) as VeterinaryRecord[]
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load farmer data.'
      );
    } finally {
      setLoading(false);
    }
  }

  const summaries = useMemo<FarmerSummary[]>(() => {
    return farmers.map((farmer) => {
      const farmerFarms = farms.filter(
        (farm) => farm.farmer_id === farmer.id
      );

      const farmerBatches = batches.filter(
        (batch) => batch.farmer_id === farmer.id
      );

      const farmerEggs = eggs.filter(
        (egg) => egg.farmer_id === farmer.id
      );

      const farmerFeeds = feeds.filter(
        (feed) => feed.farmer_id === farmer.id
      );

      const farmerVeterinary = veterinary.filter(
        (record) => record.farmer_id === farmer.id
      );

      return {
        ...farmer,
        farms: farmerFarms.length,
        batches: farmerBatches.length,
        initialBirds: farmerBatches.reduce(
          (sum, batch) => sum + Number(batch.initial_quantity || 0),
          0
        ),
        liveBirds: farmerBatches.reduce(
          (sum, batch) => sum + Number(batch.current_quantity || 0),
          0
        ),
        mortality: farmerBatches.reduce(
          (sum, batch) => sum + Number(batch.mortality_quantity || 0),
          0
        ),
        eggs: farmerEggs.reduce(
          (sum, egg) => sum + Number(egg.total_eggs || 0),
          0
        ),
        saleableEggs: farmerEggs.reduce(
          (sum, egg) => sum + Number(egg.saleable_eggs || 0),
          0
        ),
        feedKg: farmerFeeds.reduce(
          (sum, feed) => sum + Number(feed.quantity_kg || 0),
          0
        ),
        feedCost: farmerFeeds.reduce(
          (sum, feed) => sum + Number(feed.total_cost || 0),
          0
        ),
        veterinaryRecords: farmerVeterinary.length,
      };
    });
  }, [farmers, farms, batches, eggs, feeds, veterinary]);

  const filteredFarmers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return summaries;

    return summaries.filter((farmer) => {
      return (
        farmer.farmer_id.toLowerCase().includes(term) ||
        farmer.full_name.toLowerCase().includes(term) ||
        (farmer.mobile || '').toLowerCase().includes(term)
      );
    });
  }, [summaries, search]);

  const selectedFarmer = useMemo(() => {
    return summaries.find(
      (farmer) => farmer.id === selectedFarmerId
    ) || null;
  }, [summaries, selectedFarmerId]);

  const selectedBatches = useMemo(() => {
    if (!selectedFarmer) return [];

    return batches.filter(
      (batch) => batch.farmer_id === selectedFarmer.id
    );
  }, [batches, selectedFarmer]);

  const selectedFarms = useMemo(() => {
    if (!selectedFarmer) return [];

    return farms.filter(
      (farm) => farm.farmer_id === selectedFarmer.id
    );
  }, [farms, selectedFarmer]);

  const totalFarmers = summaries.length;

  const totalLiveBirds = summaries.reduce(
    (sum, farmer) => sum + farmer.liveBirds,
    0
  );

  const totalMortality = summaries.reduce(
    (sum, farmer) => sum + farmer.mortality,
    0
  );

  const totalEggs = summaries.reduce(
    (sum, farmer) => sum + farmer.eggs,
    0
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/bodhifarm"
              className="mb-2 inline-block text-sm font-medium text-green-700 hover:text-green-800"
            >
              ← Back to BodhiFarm
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Farmer Management
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Manage farmers and view their complete BodhiFarm operational profile.
            </p>
          </div>

          <button
            onClick={loadData}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Refresh Data
          </button>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total Farmers</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalFarmers}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Live Birds</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {totalLiveBirds.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total Mortality</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {totalMortality.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total Eggs</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {totalEggs.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Search Farmer
          </label>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Farmer ID, name or mobile..."
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Loading */}
        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center text-slate-500 shadow-sm">
            Loading farmer data...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">

            {/* Farmer List */}
            <section className="lg:col-span-2">
              <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="font-semibold text-slate-900">
                    Farmers
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {filteredFarmers.length} farmer(s) found
                  </p>
                </div>

                {filteredFarmers.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-500">
                    No farmers found.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredFarmers.map((farmer) => (
                      <button
                        key={farmer.id}
                        onClick={() => setSelectedFarmerId(farmer.id)}
                        className={`w-full p-5 text-left transition hover:bg-slate-50 ${
                          selectedFarmerId === farmer.id
                            ? 'bg-green-50'
                            : ''
                        }`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-green-700">
                                {farmer.farmer_id}
                              </span>

                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  farmer.status === 'ACTIVE'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {farmer.status || 'ACTIVE'}
                              </span>
                            </div>

                            <h3 className="mt-2 font-semibold text-slate-900">
                              {farmer.full_name}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {farmer.mobile || 'Mobile not available'}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-3 text-center sm:min-w-[300px]">
                            <div>
                              <p className="text-xs text-slate-500">
                                Batches
                              </p>
                              <p className="font-bold text-slate-900">
                                {farmer.batches}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-500">
                                Live Birds
                              </p>
                              <p className="font-bold text-green-700">
                                {farmer.liveBirds}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-500">
                                Mortality
                              </p>
                              <p className="font-bold text-red-600">
                                {farmer.mortality}
                              </p>
                            </div>
                          </div>

                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Farmer Detail */}
            <aside>
              <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                {!selectedFarmer ? (
                  <div className="p-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
                      👨‍🌾
                    </div>

                    <h2 className="font-semibold text-slate-900">
                      Select a Farmer
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      Select a farmer from the list to view the complete operational summary.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="border-b border-slate-200 bg-green-50 p-5">
                      <p className="text-sm font-bold text-green-700">
                        {selectedFarmer.farmer_id}
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-slate-900">
                        {selectedFarmer.full_name}
                      </h2>

                      <p className="mt-1 text-sm text-slate-600">
                        {selectedFarmer.mobile || 'Mobile not available'}
                      </p>
                    </div>

                    <div className="space-y-5 p-5">

                      <div>
                        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                          Farm & Flock
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                          <Metric label="Farms" value={selectedFarmer.farms} />
                          <Metric label="Batches" value={selectedFarmer.batches} />
                          <Metric label="Initial Birds" value={selectedFarmer.initialBirds} />
                          <Metric label="Live Birds" value={selectedFarmer.liveBirds} />
                          <Metric label="Mortality" value={selectedFarmer.mortality} />
                          <Metric label="Veterinary" value={selectedFarmer.veterinaryRecords} />
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                          Production
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                          <Metric label="Total Eggs" value={selectedFarmer.eggs} />
                          <Metric label="Saleable Eggs" value={selectedFarmer.saleableEggs} />
                          <Metric
                            label="Feed"
                            value={`${selectedFarmer.feedKg.toFixed(2)} kg`}
                          />
                          <Metric
                            label="Feed Cost"
                            value={`₹${selectedFarmer.feedCost.toFixed(2)}`}
                          />
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                          Farms
                        </h3>

                        {selectedFarms.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No farms registered.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {selectedFarms.map((farm) => (
                              <div
                                key={farm.id}
                                className="rounded-lg border border-slate-200 p-3"
                              >
                                <p className="font-semibold text-slate-900">
                                  {farm.farm_name || 'Unnamed Farm'}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {farm.farm_type || 'Farm type not specified'}
                                  {farm.status
                                    ? ` · ${farm.status}`
                                    : ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                          Bird Batches
                        </h3>

                        {selectedBatches.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            No bird batches registered.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {selectedBatches.map((batch) => (
                              <div
                                key={batch.id}
                                className="rounded-lg border border-slate-200 p-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold text-slate-900">
                                    {batch.batch_code}
                                  </p>

                                  <span className="text-xs font-semibold text-green-700">
                                    {batch.current_quantity || 0} live
                                  </span>
                                </div>

                                <p className="mt-1 text-xs text-slate-500">
                                  Initial: {batch.initial_quantity || 0}
                                  {' · '}
                                  Mortality: {batch.mortality_quantity || 0}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Link
                          href="/bodhifarm"
                          className="rounded-lg bg-green-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-green-800"
                        >
                          Bird Batch Management
                        </Link>

                        <Link
                          href="/bodhifarm/egg-production"
                          className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Egg Production
                        </Link>

                        <Link
                          href="/bodhifarm/feed"
                          className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Feed Management
                        </Link>

                        <Link
                          href="/bodhifarm/performance"
                          className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Performance Dashboard
                        </Link>

                        <Link
                          href="/bodhifarm/veterinary"
                          className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Veterinary & Mortality
                        </Link>
                      </div>

                    </div>
                  </>
                )}
              </div>
            </aside>

          </div>
        )}
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900">
        {typeof value === 'number'
          ? value.toLocaleString()
          : value}
      </p>
    </div>
  );
}
