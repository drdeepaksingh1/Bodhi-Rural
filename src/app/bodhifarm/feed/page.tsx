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
  source: string | null;
};

const FEED_TYPES = [
  'Layer Feed',
  'Pre-Layer Feed',
  'Chick Starter',
  'Grower Feed',
  'Broiler Feed',
  'Breeder Feed',
  'Maize',
  'Soybean Meal',
  'Mineral Mixture',
  'Other',
];

const SOURCES = [
  'BodhiFarm',
  'BodhiFeeds',
  'Local Purchase',
  'Farmer Stock',
  'Other',
];

function getIndiaDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(new Date());
}

export default function FeedManagementPage() {
  const supabase = createClient();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [batches, setBatches] = useState<BirdBatch[]>([]);
  const [records, setRecords] = useState<FeedRecord[]>([]);

  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [recordDate, setRecordDate] = useState(getIndiaDate());
  const [feedType, setFeedType] = useState('');
  const [quantityKg, setQuantityKg] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [source, setSource] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedBatchData = useMemo(() => {
    return batches.find((batch) => batch.id === selectedBatch);
  }, [batches, selectedBatch]);

  const liveBirds = selectedBatchData?.current_quantity ?? 0;

  const quantity = Number(quantityKg) || 0;
  const rate = Number(unitCost) || 0;
  const estimatedTotalCost = quantity * rate;

  const farmerBatches = useMemo(() => {
    if (!selectedFarmer) return [];

    return batches.filter(
      (batch) => batch.farmer_id === selectedFarmer
    );
  }, [batches, selectedFarmer]);

  const summary = useMemo(() => {
    return records.reduce(
      (acc, record) => {
        acc.quantity += Number(record.quantity_kg || 0);
        acc.cost += Number(record.total_cost || 0);

        return acc;
      },
      {
        quantity: 0,
        cost: 0,
      }
    );
  }, [records]);

  const averageCostPerKg =
    summary.quantity > 0
      ? summary.cost / summary.quantity
      : 0;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');

    const [
      farmersResponse,
      batchesResponse,
      recordsResponse,
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
          total_cost,
          source
          `
        )
        .order('record_date', {
          ascending: false,
        })
        .limit(100),
    ]);

    if (farmersResponse.error) {
      setError(farmersResponse.error.message);
    }

    if (batchesResponse.error) {
      setError(batchesResponse.error.message);
    }

    if (recordsResponse.error) {
      setError(recordsResponse.error.message);
    }

    setFarmers(farmersResponse.data || []);
    setBatches(batchesResponse.data || []);
    setRecords(recordsResponse.data || []);

    setLoading(false);
  }

  function handleFarmerChange(value: string) {
    setSelectedFarmer(value);
    setSelectedBatch('');
    setMessage('');
    setError('');
  }

  function handleBatchChange(value: string) {
    setSelectedBatch(value);
    setMessage('');
    setError('');
  }

  async function saveFeedRecord() {
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

    if (!recordDate) {
      setError('Please select feed date.');
      return;
    }

    if (!feedType) {
      setError('Please select feed type.');
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Feed quantity must be greater than 0 kg.');
      return;
    }

    if (!Number.isFinite(rate) || rate < 0) {
      setError('Unit cost cannot be negative.');
      return;
    }

    if (!source) {
      setError('Please select feed source.');
      return;
    }

    if (liveBirds <= 0) {
      setError(
        'The selected batch has no live birds.'
      );
      return;
    }

    setSaving(true);

    /*
     * total_cost is intentionally NOT sent.
     * Supabase calculates it using the database trigger.
     */
    const { error: insertError } = await supabase
      .from('feed_records')
      .insert({
        farmer_id: selectedFarmer,
        batch_id: selectedBatch,
        record_date: recordDate,
        feed_type: feedType,
        quantity_kg: quantity,
        unit_cost: rate,
        source,
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setMessage(
      'Feed record saved successfully.'
    );

    setQuantityKg('');
    setUnitCost('');
    setFeedType('');
    setSource('');

    await loadData();

    setSaving(false);
  }

  function getFarmerName(farmerId: string) {
    const farmer = farmers.find(
      (item) => item.id === farmerId
    );

    if (!farmer) return farmerId;

    return `${farmer.farmer_id} — ${farmer.full_name}`;
  }

  function getBatchName(batchId: string | null) {
    if (!batchId) return '—';

    const batch = batches.find(
      (item) => item.id === batchId
    );

    if (!batch) return batchId;

    return `${batch.batch_code} — ${batch.breed}`;
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
              Feed Management
            </h1>

            <p className="text-sm text-gray-500">
              Feed issue and consumption management
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
            <p className="text-sm text-gray-500">
              Total Feed
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {summary.quantity.toFixed(2)} kg
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Latest 100 records
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Feed Cost
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              ₹{summary.cost.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Average Cost / Kg
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              ₹{averageCostPerKg.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Selected Batch Birds
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {selectedBatch ? liveBirds : '—'}
            </p>
          </div>
        </section>

        {/* Feed Form */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Record Feed
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Record feed issued or consumed by a farmer and bird batch.
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
                onChange={(e) =>
                  handleFarmerChange(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="">
                  Select Farmer
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

            {/* Batch */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bird Batch
              </label>

              <select
                value={selectedBatch}
                onChange={(e) =>
                  handleBatchChange(e.target.value)
                }
                disabled={!selectedFarmer}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none disabled:bg-gray-100 focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="">
                  {selectedFarmer
                    ? 'Select Bird Batch'
                    : 'Select Farmer First'}
                </option>

                {farmerBatches.map((batch) => (
                  <option
                    key={batch.id}
                    value={batch.id}
                  >
                    {batch.batch_code} — {batch.breed} —{' '}
                    {batch.current_quantity} live
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Feed Date
              </label>

              <input
                type="date"
                value={recordDate}
                onChange={(e) =>
                  setRecordDate(e.target.value)
                }
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

            {/* Feed Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Feed Type
              </label>

              <select
                value={feedType}
                onChange={(e) =>
                  setFeedType(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="">
                  Select Feed Type
                </option>

                {FEED_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Source
              </label>

              <select
                value={source}
                onChange={(e) =>
                  setSource(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="">
                  Select Source
                </option>

                {SOURCES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Quantity (Kg)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={quantityKg}
                onChange={(e) =>
                  setQuantityKg(e.target.value)
                }
                placeholder="Enter quantity"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* Rate */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Unit Cost (₹ / Kg)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) =>
                  setUnitCost(e.target.value)
                }
                placeholder="Example: 32"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>

          {/* Estimated Cost */}
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Feed Cost
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Quantity × Unit Cost
                </p>
              </div>

              <p className="text-3xl font-bold text-green-700">
                ₹{estimatedTotalCost.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={saveFeedRecord}
              disabled={saving || loading}
              className="rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Feed Record'}
            </button>
          </div>
        </section>

        {/* History */}
        <section className="rounded-xl border bg-white shadow-sm">

          <div className="border-b px-6 py-5">
            <h2 className="text-xl font-bold text-gray-900">
              Feed History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Latest 100 feed records
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

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Feed Type
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Quantity
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rate/Kg
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total Cost
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Source
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">

                {records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-sm text-gray-500"
                    >
                      No feed records found.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id}>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                        {record.record_date}
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-gray-900">
                        {getFarmerName(
                          record.farmer_id
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {getBatchName(
                          record.batch_id
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {record.feed_type || '—'}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900">
                        {Number(
                          record.quantity_kg || 0
                        ).toFixed(2)}{' '}
                        kg
                      </td>

                      <td className="px-5 py-4 text-right text-sm text-gray-700">
                        ₹
                        {Number(
                          record.unit_cost || 0
                        ).toFixed(2)}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-bold text-green-700">
                        ₹
                        {Number(
                          record.total_cost || 0
                        ).toFixed(2)}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {record.source || '—'}
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
