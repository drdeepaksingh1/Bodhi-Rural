'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/client';

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
  status: string | null;
};

type BirdBatch = {
  id: string;
  farmer_id: string;
  farm_id: string | null;
  batch_code: string;
  breed: string;
  initial_quantity: number | null;
  current_quantity: number | null;
  mortality_quantity: number | null;
  status: string | null;
};

const farmTypes = [
  'Poultry Farm',
  'Layer Farm',
  'Broiler Farm',
  'Dual Purpose Farm',
  'Mixed Farm',
  'Dairy Farm',
  'Goat Farm',
  'Other',
];

export default function FarmManagementPage() {
  const supabase = createClient();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [batches, setBatches] = useState<BirdBatch[]>([]);

  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [farmName, setFarmName] = useState('');
  const [farmType, setFarmType] = useState('Poultry Farm');
  const [shedCapacity, setShedCapacity] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const [assignFarmId, setAssignFarmId] = useState('');
  const [assignBatchId, setAssignBatchId] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');

    const [
      farmersResult,
      farmsResult,
      batchesResult,
    ] = await Promise.all([
      supabase
        .from('farmers')
        .select('id, farmer_id, full_name')
        .eq('status', 'ACTIVE')
        .order('full_name'),

      supabase
        .from('farms')
        .select(
          'id, farmer_id, farm_name, farm_type, shed_capacity, status'
        )
        .order('farm_name'),

      supabase
        .from('bird_batches')
        .select(
          'id, farmer_id, farm_id, batch_code, breed, initial_quantity, current_quantity, mortality_quantity, status'
        )
        .order('placement_date', { ascending: false }),
    ]);

    if (farmersResult.error) {
      setError(farmersResult.error.message);
    } else {
      setFarmers(farmersResult.data || []);
    }

    if (farmsResult.error) {
      setError(farmsResult.error.message);
    } else {
      setFarms(farmsResult.data || []);
    }

    if (batchesResult.error) {
      setError(batchesResult.error.message);
    } else {
      setBatches(batchesResult.data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const farmerFarms = useMemo(() => {
    if (!selectedFarmer) return [];

    return farms.filter(
      (farm) => farm.farmer_id === selectedFarmer
    );
  }, [farms, selectedFarmer]);

  const farmerBatches = useMemo(() => {
    if (!selectedFarmer) return [];

    return batches.filter(
      (batch) => batch.farmer_id === selectedFarmer
    );
  }, [batches, selectedFarmer]);

  const totalCapacity = farms.reduce(
    (sum, farm) => sum + Number(farm.shed_capacity || 0),
    0
  );

  const totalLiveBirds = batches.reduce(
    (sum, batch) => sum + Number(batch.current_quantity || 0),
    0
  );

  async function saveFarm() {
    setMessage('');
    setError('');

    if (!selectedFarmer) {
      setError('Please select a farmer.');
      return;
    }

    if (!farmName.trim()) {
      setError('Please enter farm name.');
      return;
    }

    const capacity = Number(shedCapacity);

    if (!Number.isInteger(capacity) || capacity < 0) {
      setError('Shed capacity must be a whole number.');
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase
      .from('farms')
      .insert({
        farmer_id: selectedFarmer,
        farm_name: farmName.trim(),
        farm_type: farmType,
        shed_capacity: capacity,
        status,
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setFarmName('');
    setShedCapacity('');
    setMessage('Farm created successfully.');

    await loadData();

    setSaving(false);
  }

  async function assignBatch() {
    setMessage('');
    setError('');

    if (!assignFarmId) {
      setError('Please select a farm.');
      return;
    }

    if (!assignBatchId) {
      setError('Please select a bird batch.');
      return;
    }

    setAssigning(true);

    const selectedBatch = batches.find(
      (batch) => batch.id === assignBatchId
    );

    if (!selectedBatch) {
      setError('Bird batch not found.');
      setAssigning(false);
      return;
    }

    const selectedFarm = farms.find(
      (farm) => farm.id === assignFarmId
    );

    if (!selectedFarm) {
      setError('Farm not found.');
      setAssigning(false);
      return;
    }

    if (selectedBatch.farmer_id !== selectedFarm.farmer_id) {
      setError(
        'This bird batch and farm belong to different farmers.'
      );
      setAssigning(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('bird_batches')
      .update({
        farm_id: assignFarmId,
      })
      .eq('id', assignBatchId);

    if (updateError) {
      setError(updateError.message);
      setAssigning(false);
      return;
    }

    setMessage('Bird batch assigned to farm successfully.');

    await loadData();

    setAssignBatchId('');
    setAssigning(false);
  }

  const farmerName = (farmerId: string) => {
    const farmer = farmers.find(
      (item) => item.id === farmerId
    );

    return farmer
      ? `${farmer.farmer_id} — ${farmer.full_name}`
      : 'Unknown farmer';
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/bodhifarm/farmers"
              className="mb-2 inline-block text-sm font-medium text-green-700 hover:text-green-800"
            >
              ← Back to Farmer Management
            </Link>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Farm Management
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Register farms and connect bird batches to the correct farm.
            </p>
          </div>

          <button
            onClick={loadData}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Total Farmers
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {farmers.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Total Farms
            </p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {farms.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Shed Capacity
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {totalCapacity.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Live Birds
            </p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {totalLiveBirds.toLocaleString()}
            </p>
          </div>

        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl bg-white p-10 text-center text-slate-500">
            Loading farm data...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">

            {/* Create Farm */}
            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                Register Farm
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Create a farm under an existing farmer.
              </p>

              <div className="mt-5 space-y-4">

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Farmer *
                  </label>

                  <select
                    value={selectedFarmer}
                    onChange={(e) => {
                      setSelectedFarmer(e.target.value);
                      setAssignFarmId('');
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
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
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Farm Name *
                  </label>

                  <input
                    value={farmName}
                    onChange={(e) =>
                      setFarmName(e.target.value)
                    }
                    placeholder="Example: GVVH Poultry Farm"
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Farm Type
                  </label>

                  <select
                    value={farmType}
                    onChange={(e) =>
                      setFarmType(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
                  >
                    {farmTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Shed Capacity
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={shedCapacity}
                    onChange={(e) =>
                      setShedCapacity(e.target.value)
                    }
                    placeholder="Example: 500"
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <button
                  onClick={saveFarm}
                  disabled={saving}
                  className="w-full rounded-lg bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : 'Create Farm'}
                </button>

              </div>
            </section>

            {/* Assign Batch */}
            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                Assign Bird Batch
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Connect an existing bird batch to its farm.
              </p>

              <div className="mt-5 space-y-4">

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Farmer
                  </label>

                  <select
                    value={selectedFarmer}
                    onChange={(e) => {
                      setSelectedFarmer(e.target.value);
                      setAssignFarmId('');
                      setAssignBatchId('');
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
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
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Farm
                  </label>

                  <select
                    value={assignFarmId}
                    onChange={(e) =>
                      setAssignFarmId(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
                  >
                    <option value="">
                      Select farm
                    </option>

                    {farmerFarms.map((farm) => (
                      <option
                        key={farm.id}
                        value={farm.id}
                      >
                        {farm.farm_name || 'Unnamed Farm'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Bird Batch
                  </label>

                  <select
                    value={assignBatchId}
                    onChange={(e) =>
                      setAssignBatchId(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
                  >
                    <option value="">
                      Select batch
                    </option>

                    {farmerBatches.map((batch) => (
                      <option
                        key={batch.id}
                        value={batch.id}
                      >
                        {batch.batch_code} —{' '}
                        {batch.current_quantity || 0} live
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={assignBatch}
                  disabled={assigning}
                  className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {assigning
                    ? 'Assigning...'
                    : 'Assign Batch to Farm'}
                </button>

              </div>
            </section>

            {/* Farmer Farms */}
            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                Selected Farmer Farms
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {selectedFarmer
                  ? 'Farms registered under the selected farmer.'
                  : 'Select a farmer to view farms.'}
              </p>

              <div className="mt-5 space-y-3">

                {!selectedFarmer ? (
                  <div className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">
                    Select a farmer above.
                  </div>
                ) : farmerFarms.length === 0 ? (
                  <div className="rounded-lg bg-amber-50 p-5 text-center text-sm text-amber-700">
                    No farms registered for this farmer.
                  </div>
                ) : (
                  farmerFarms.map((farm) => (
                    <div
                      key={farm.id}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900">
                            {farm.farm_name ||
                              'Unnamed Farm'}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {farm.farm_type ||
                              'Farm type not specified'}
                          </p>
                        </div>

                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                          {farm.status || 'ACTIVE'}
                        </span>
                      </div>

                      <div className="mt-3 text-sm text-slate-600">
                        Shed Capacity:{' '}
                        <strong>
                          {Number(
                            farm.shed_capacity || 0
                          ).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  ))
                )}

              </div>
            </section>

          </div>
        )}

        {/* All Farms */}
        {!loading && (
          <section className="mt-6 rounded-xl bg-white shadow-sm ring-1 ring-slate-200">

            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-bold text-slate-900">
                All Farms
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {farms.length} farm(s) registered
              </p>
            </div>

            {farms.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No farms registered yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left">
                        Farm
                      </th>

                      <th className="px-5 py-3 text-left">
                        Farmer
                      </th>

                      <th className="px-5 py-3 text-left">
                        Type
                      </th>

                      <th className="px-5 py-3 text-left">
                        Capacity
                      </th>

                      <th className="px-5 py-3 text-left">
                        Status
                      </th>

                      <th className="px-5 py-3 text-left">
                        Batches
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {farms.map((farm) => {
                      const farmBatches = batches.filter(
                        (batch) =>
                          batch.farm_id === farm.id
                      );

                      return (
                        <tr key={farm.id}>
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            {farm.farm_name ||
                              'Unnamed Farm'}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {farmerName(farm.farmer_id)}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {farm.farm_type || '—'}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {Number(
                              farm.shed_capacity || 0
                            ).toLocaleString()}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                              {farm.status || 'ACTIVE'}
                            </span>
                          </td>

                          <td className="px-5 py-4 font-semibold text-slate-900">
                            {farmBatches.length}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </section>
        )}

      </div>
    </main>
  );
}
