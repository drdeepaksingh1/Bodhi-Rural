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

type EggProduction = {
  id: string;
  farmer_id: string;
  batch_id: string;
  production_date: string;
  total_eggs: number;
  cracked_eggs: number;
  damaged_eggs: number;
  saleable_eggs: number;
  farmer?: {
    farmer_id: string;
    full_name: string;
  };
  batch?: {
    batch_code: string;
    breed: string;
  };
};

function getIndiaDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(new Date());
}

export default function EggProductionPage() {
  const supabase = createClient();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [batches, setBatches] = useState<BirdBatch[]>([]);
  const [productions, setProductions] = useState<EggProduction[]>([]);

  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [productionDate, setProductionDate] = useState(getIndiaDate());

  const [totalEggs, setTotalEggs] = useState('');
  const [crackedEggs, setCrackedEggs] = useState('');
  const [damagedEggs, setDamagedEggs] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedBatchData = useMemo(() => {
    return batches.find((batch) => batch.id === selectedBatch);
  }, [batches, selectedBatch]);

  const liveBirds = selectedBatchData?.current_quantity ?? 0;

  const maximumEggs = Math.floor(liveBirds * 0.70);

  const total = Number(totalEggs) || 0;
  const cracked = Number(crackedEggs) || 0;
  const damaged = Number(damagedEggs) || 0;

  const saleableEggs = Math.max(0, total - cracked - damaged);

  const productionPercentage =
    liveBirds > 0 ? ((total / liveBirds) * 100).toFixed(1) : '0.0';

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setError('');

    const [
      farmersResponse,
      batchesResponse,
      productionResponse,
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
        .eq('status', 'ACTIVE')
        .order('placement_date', { ascending: false }),

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
        .order('production_date', { ascending: false })
        .limit(100),
    ]);

    if (farmersResponse.error) {
      setError(farmersResponse.error.message);
    }

    if (batchesResponse.error) {
      setError(batchesResponse.error.message);
    }

    if (productionResponse.error) {
      setError(productionResponse.error.message);
    }

    setFarmers(farmersResponse.data || []);
    setBatches(batchesResponse.data || []);
    setProductions(productionResponse.data || []);

    setLoading(false);
  }

  const farmerBatches = useMemo(() => {
    if (!selectedFarmer) return [];

    return batches.filter(
      (batch) => batch.farmer_id === selectedFarmer
    );
  }, [batches, selectedFarmer]);

  function handleFarmerChange(value: string) {
    setSelectedFarmer(value);
    setSelectedBatch('');
    setTotalEggs('');
    setCrackedEggs('');
    setDamagedEggs('');
    setMessage('');
    setError('');
  }

  function handleBatchChange(value: string) {
    setSelectedBatch(value);
    setTotalEggs('');
    setCrackedEggs('');
    setDamagedEggs('');
    setMessage('');
    setError('');
  }

  async function saveProduction() {
    setMessage('');
    setError('');

    if (!selectedFarmer) {
      setError('Please select a farmer.');
      return;
    }

    if (!selectedBatch) {
      setError('Please select a bird batch.');
      return;
    }

    if (!productionDate) {
      setError('Please select production date.');
      return;
    }

    if (!Number.isInteger(total) || total < 0) {
      setError('Total eggs must be a whole number.');
      return;
    }

    if (!Number.isInteger(cracked) || cracked < 0) {
      setError('Cracked eggs must be a whole number.');
      return;
    }

    if (!Number.isInteger(damaged) || damaged < 0) {
      setError('Damaged eggs must be a whole number.');
      return;
    }

    if (cracked + damaged > total) {
      setError(
        'Cracked eggs plus damaged eggs cannot exceed total eggs.'
      );
      return;
    }

    if (total > maximumEggs) {
      setError(
        `Production cannot exceed 70% of current live birds. Maximum allowed: ${maximumEggs} eggs.`
      );
      return;
    }

    if (liveBirds <= 0) {
      setError('This batch has no live birds available for production.');
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase
      .from('egg_production')
      .insert({
        farmer_id: selectedFarmer,
        batch_id: selectedBatch,
        production_date: productionDate,
        total_eggs: total,
        cracked_eggs: cracked,
        damaged_eggs: damaged,
      
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setMessage('Egg production saved successfully.');

    setTotalEggs('');
    setCrackedEggs('');
    setDamagedEggs('');

    await loadInitialData();

    setSaving(false);
  }

  const summary = useMemo(() => {
    return productions.reduce(
      (acc, item) => {
        acc.total += Number(item.total_eggs || 0);
        acc.saleable += Number(item.saleable_eggs || 0);
        acc.cracked += Number(item.cracked_eggs || 0);
        acc.damaged += Number(item.damaged_eggs || 0);

        return acc;
      },
      {
        total: 0,
        saleable: 0,
        cracked: 0,
        damaged: 0,
      }
    );
  }, [productions]);

  function getFarmerName(farmerId: string) {
    const farmer = farmers.find((item) => item.id === farmerId);

    if (!farmer) return farmerId;

    return `${farmer.farmer_id} — ${farmer.full_name}`;
  }

  function getBatchName(batchId: string) {
    const batch = batches.find((item) => item.id === batchId);

    if (!batch) return batchId;

    return `${batch.batch_code} — ${batch.breed}`;
  }

  return (
    <main className="min-h-screen bg-gray-50">
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
              Egg Production
            </h1>

            <p className="text-sm text-gray-500">
              Daily egg production management
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
        {/* Summary */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Production</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {summary.total}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              eggs in loaded history
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Saleable Eggs</p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {summary.saleable}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Cracked Eggs</p>
            <p className="mt-2 text-3xl font-bold text-orange-600">
              {summary.cracked}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Damaged Eggs</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {summary.damaged}
            </p>
          </div>
        </section>

        {/* Production Form */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Record Daily Egg Production
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Maximum production is restricted to 70% of the current live
              birds in the selected batch.
            </p>
          </div>

          {message && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {/* Farmer */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Farmer
              </label>

              <select
                value={selectedFarmer}
                onChange={(e) => handleFarmerChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="">Select Farmer</option>

                {farmers.map((farmer) => (
                  <option key={farmer.id} value={farmer.id}>
                    {farmer.farmer_id} — {farmer.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bird Batch
              </label>

              <select
                value={selectedBatch}
                onChange={(e) => handleBatchChange(e.target.value)}
                disabled={!selectedFarmer}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none disabled:bg-gray-100 focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="">
                  {selectedFarmer
                    ? 'Select Bird Batch'
                    : 'Select Farmer First'}
                </option>

                {farmerBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batch_code} — {batch.breed} —{' '}
                    {batch.current_quantity} live
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Production Date
              </label>

              <input
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* Live birds */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Current Live Birds
              </label>

              <div className="rounded-lg border bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-900">
                {selectedBatch ? liveBirds : '—'}
              </div>
            </div>
          </div>

          {/* 70% Limit */}
          {selectedBatch && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Current Live Birds
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {liveBirds}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Maximum Eggs — 70%
                  </p>

                  <p className="mt-1 text-2xl font-bold text-green-700">
                    {maximumEggs}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Current Entry
                  </p>

                  <p
                    className={`mt-1 text-2xl font-bold ${
                      total > maximumEggs
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {total}
                  </p>
                </div>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    total > maximumEggs
                      ? 'bg-red-500'
                      : 'bg-green-600'
                  }`}
                  style={{
                    width: `${Math.min(
                      liveBirds > 0
                        ? (total / maximumEggs) * 100
                        : 0,
                      100
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-gray-600">
                Production entered: {productionPercentage}% of current
                live birds. Maximum permitted: 70%.
              </p>
            </div>
          )}

          {/* Egg inputs */}
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Total Eggs
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={totalEggs}
                onChange={(e) => setTotalEggs(e.target.value)}
                placeholder={`Maximum ${maximumEggs}`}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cracked Eggs
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={crackedEggs}
                onChange={(e) => setCrackedEggs(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Damaged Eggs
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={damagedEggs}
                onChange={(e) => setDamagedEggs(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>

          {/* Saleable */}
          <div className="mt-6 rounded-lg border bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Saleable Eggs
              </span>

              <span className="text-2xl font-bold text-green-700">
                {saleableEggs}
              </span>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={saveProduction}
              disabled={saving || loading}
              className="rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Production'}
            </button>
          </div>
        </section>

        {/* History */}
        <section className="rounded-xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-xl font-bold text-gray-900">
              Egg Production History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Latest 100 production records
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Farmer
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Batch
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Cracked
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Damaged
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Saleable
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {productions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm text-gray-500"
                    >
                      No egg production records found.
                    </td>
                  </tr>
                ) : (
                  productions.map((production) => (
                    <tr key={production.id}>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                        {production.production_date}
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-gray-900">
                        {getFarmerName(production.farmer_id)}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {getBatchName(production.batch_id)}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900">
                        {production.total_eggs}
                      </td>

                      <td className="px-5 py-4 text-right text-sm text-orange-600">
                        {production.cracked_eggs}
                      </td>

                      <td className="px-5 py-4 text-right text-sm text-red-600">
                        {production.damaged_eggs}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-bold text-green-700">
                        {production.saleable_eggs}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
