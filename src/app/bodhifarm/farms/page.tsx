'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';

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

type BirdBatch = {
  id: string;
  farmer_id: string;
  farm_id: string | null;
  batch_code: string | null;
  breed: string | null;
  current_quantity: number | null;
  status: string | null;
};

export default function FarmManagement() {
  const supabase = createClient();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [batches, setBatches] = useState<BirdBatch[]>([]);

  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const [farmName, setFarmName] = useState('');
  const [farmType, setFarmType] = useState('Dual Purpose Farm');
  const [shedCapacity, setShedCapacity] = useState('');

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
        .select(
          'id, farmer_id, full_name, mobile, status'
        )
        .order('farmer_id'),

      supabase
        .from('farms')
        .select(
          'id, farmer_id, farm_name, farm_type, shed_capacity, status'
        )
        .order('farm_name'),

      supabase
        .from('bird_batches')
        .select(
          'id, farmer_id, farm_id, batch_code, breed, current_quantity, status'
        )
        .order('batch_code'),
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

  const selectedFarmer = useMemo(
    () =>
      farmers.find(
        (farmer) => farmer.id === selectedFarmerId
      ) || null,
    [farmers, selectedFarmerId]
  );

  const selectedFarmerFarms = useMemo(
    () =>
      farms.filter(
        (farm) => farm.farmer_id === selectedFarmerId
      ),
    [farms, selectedFarmerId]
  );

  const selectedFarmerBatches = useMemo(
    () =>
      batches.filter(
        (batch) => batch.farmer_id === selectedFarmerId
      ),
    [batches, selectedFarmerId]
  );

  const selectedFarm = useMemo(
    () =>
      farms.find(
        (farm) => farm.id === selectedFarmId
      ) || null,
    [farms, selectedFarmId]
  );

  const unassignedBatches = useMemo(
    () =>
      selectedFarmerBatches.filter(
        (batch) => batch.farm_id !== selectedFarmId
      ),
    [selectedFarmerBatches, selectedFarmId]
  );

  const totalShedCapacity = useMemo(
    () =>
      farms.reduce(
        (sum, farm) =>
          sum + Number(farm.shed_capacity || 0),
        0
      ),
    [farms]
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

  function selectFarmer(id: string) {
    setSelectedFarmerId(id);
    setSelectedFarmId('');
    setSelectedBatchId('');
    setMessage('');
    setError('');
  }

  async function createFarm(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage('');
    setError('');

    if (!selectedFarmerId) {
      setError('Please select a farmer.');
      return;
    }

    if (!farmName.trim()) {
      setError('Farm name is required.');
      return;
    }

    setSaving(true);

    const { error: insertError } = await supabase
      .from('farms')
      .insert({
        farmer_id: selectedFarmerId,
        farm_name: farmName.trim(),
        farm_type: farmType,
        shed_capacity: shedCapacity
          ? Number(shedCapacity)
          : null,
        status: 'ACTIVE',
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setFarmName('');
    setFarmType('Dual Purpose Farm');
    setShedCapacity('');

    setMessage('Farm registered successfully.');

    await loadData();

    setSaving(false);
  }

  async function assignBatch() {
    setMessage('');
    setError('');

    if (!selectedFarmerId) {
      setError('Please select a farmer.');
      return;
    }

    if (!selectedFarmId) {
      setError('Please select a farm.');
      return;
    }

    if (!selectedBatchId) {
      setError('Please select a bird batch.');
      return;
    }

    setAssigning(true);

    const { error: updateError } = await supabase
      .from('bird_batches')
      .update({
        farm_id: selectedFarmId,
      })
      .eq('id', selectedBatchId);

    if (updateError) {
      setError(updateError.message);
      setAssigning(false);
      return;
    }

    setSelectedBatchId('');
    setMessage(
      'Bird batch assigned to farm successfully.'
    );

    await loadData();

    setAssigning(false);
  }

  async function unassignBatch(batchId: string) {
    setMessage('');
    setError('');

    const { error: updateError } = await supabase
      .from('bird_batches')
      .update({
        farm_id: null,
      })
      .eq('id', batchId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage('Bird batch removed from this farm.');

    await loadData();
  }

  return (
    <main className="min-h-screen bg-slate-50">

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <Link
              href="/bodhifarm"
              className="text-sm font-semibold text-green-700 hover:text-green-800"
            >
              ← Back to BodhiFarm
            </Link>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Farm Management
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Register farms and connect bird batches to farms.
            </p>

          </div>

          <button
            onClick={loadData}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>

        </div>

        {/* MESSAGE */}

        {message && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {/* KPI */}

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

          <Kpi
            label="Total Farmers"
            value={farmers.length}
          />

          <Kpi
            label="Total Farms"
            value={farms.length}
          />

          <Kpi
            label="Shed Capacity"
            value={totalShedCapacity.toLocaleString('en-IN')}
          />

          <Kpi
            label="Live Birds"
            value={totalLiveBirds.toLocaleString('en-IN')}
          />

        </div>

        {loading ? (

          <div className="rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Loading Farm Management...
            </p>
          </div>

        ) : (

          <>

            {/* TOP THREE PANELS */}

            <div className="grid gap-6 lg:grid-cols-3">

              {/* SELECT FARMER */}

              <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

                <h2 className="text-lg font-bold text-slate-900">
                  Select Farmer
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select the farmer whose farms you want to manage.
                </p>

                <div className="mt-5 space-y-2">

                  {farmers.length === 0 ? (

                    <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                      No farmers available.
                    </div>

                  ) : (

                    farmers.map((farmer) => (

                      <button
                        key={farmer.id}
                        onClick={() =>
                          selectFarmer(farmer.id)
                        }
                        className={`w-full rounded-lg border p-3 text-left ${
                          selectedFarmerId === farmer.id
                            ? 'border-green-600 bg-green-50'
                            : 'border-slate-200 hover:border-green-300'
                        }`}
                      >

                        <p className="text-sm font-bold text-green-700">
                          {farmer.farmer_id ||
                            'No Farmer ID'}
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {farmer.full_name ||
                            'Unnamed Farmer'}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {farmer.mobile ||
                            'Mobile not available'}
                        </p>

                      </button>

                    ))

                  )}

                </div>

              </section>

              {/* REGISTER FARM */}

              <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

                <h2 className="text-lg font-bold text-slate-900">
                  Register Farm
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new farm under a farmer.
                </p>

                <form
                  onSubmit={createFarm}
                  className="mt-5 space-y-4"
                >

                  <label className="block">

                    <span className="mb-1 block text-sm font-semibold text-slate-700">
                      Farmer *
                    </span>

                    <select
                      value={selectedFarmerId}
                      onChange={(event) =>
                        selectFarmer(
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
                    >

                      <option value="">
                        Select farmer
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

                  </label>

                  <label className="block">

                    <span className="mb-1 block text-sm font-semibold text-slate-700">
                      Farm Name *
                    </span>

                    <input
                      value={farmName}
                      onChange={(event) =>
                        setFarmName(
                          event.target.value
                        )
                      }
                      placeholder="Example: Abhi"
                      className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
                    />

                  </label>

                  <label className="block">

                    <span className="mb-1 block text-sm font-semibold text-slate-700">
                      Farm Type
                    </span>

                    <select
                      value={farmType}
                      onChange={(event) =>
                        setFarmType(
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
                    >

                      <option>
                        Dual Purpose Farm
                      </option>

                      <option>
                        Layer Farm
                      </option>

                      <option>
                        Broiler Farm
                      </option>

                      <option>
                        Sonali Farm
                      </option>

                      <option>
                        Backyard Poultry
                      </option>

                      <option>
                        Mixed Farm
                      </option>

                      <option>
                        Other
                      </option>

                    </select>

                  </label>

                  <label className="block">

                    <span className="mb-1 block text-sm font-semibold text-slate-700">
                      Shed Capacity
                    </span>

                    <input
                      type="number"
                      min="0"
                      value={shedCapacity}
                      onChange={(event) =>
                        setShedCapacity(
                          event.target.value
                        )
                      }
                      placeholder="Example: 600"
                      className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
                    />

                  </label>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-lg bg-green-700 px-4 py-3 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-60"
                  >
                    {saving
                      ? 'Saving...'
                      : 'Save Farm'}
                  </button>

                </form>

              </section>

              {/* ASSIGN BATCH */}

              <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

                <h2 className="text-lg font-bold text-slate-900">
                  Assign Bird Batch
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Connect a bird batch to its farm.
                </p>

                <div className="mt-5 space-y-4">

                  <label className="block">

                    <span className="mb-1 block text-sm font-semibold text-slate-700">
                      Farmer
                    </span>

                    <select
                      value={selectedFarmerId}
                      onChange={(event) =>
                        selectFarmer(
                          event.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
                    >

                      <option value="">
                        Select farmer
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

                  </label>

                  <label className="block">

                    <span className="mb-1 block text-sm font-semibold text-slate-700">
                      Farm
                    </span>

                    <select
                      value={selectedFarmId}
                      onChange={(event) => {
                        setSelectedFarmId(
                          event.target.value
                        );
                        setSelectedBatchId('');
                      }}
                      disabled={!selectedFarmerId}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm disabled:bg-slate-100"
                    >

                      <option value="">
                        Select farm
                      </option>

                      {selectedFarmerFarms.map(
                        (farm) => (
                          <option
                            key={farm.id}
                            value={farm.id}
                          >
                            {farm.farm_name}
                          </option>
                        )
                      )}

                    </select>

                  </label>

                  <label className="block">

                    <span className="mb-1 block text-sm font-semibold text-slate-700">
                      Bird Batch
                    </span>

                    <select
                      value={selectedBatchId}
                      onChange={(event) =>
                        setSelectedBatchId(
                          event.target.value
                        )
                      }
                      disabled={!selectedFarmId}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm disabled:bg-slate-100"
                    >

                      <option value="">
                        Select batch
                      </option>

                      {unassignedBatches.map(
                        (batch) => (
                          <option
                            key={batch.id}
                            value={batch.id}
                          >
                            {batch.batch_code ||
                              'Batch'}{' '}
                            —{' '}
                            {batch.breed ||
                              'Breed'}{' '}
                            —{' '}
                            {batch.current_quantity ||
                              0}{' '}
                            birds
                          </option>
                        )
                      )}

                    </select>

                  </label>

                  <button
                    onClick={assignBatch}
                    disabled={assigning}
                    className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {assigning
                      ? 'Assigning...'
                      : 'Assign Batch to Farm'}
                  </button>

                  {selectedFarm && (
                    <div className="rounded-lg bg-green-50 p-4">

                      <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                        Selected Farm
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {selectedFarm.farm_name}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        Shed Capacity:{' '}
                        {selectedFarm.shed_capacity ||
                          0}
                      </p>

                    </div>
                  )}

                </div>

              </section>

            </div>

            {/* SELECTED FARMER FARMS */}

            <section className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

              <h2 className="text-xl font-bold text-slate-900">
                Selected Farmer Farms
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Farms registered under the selected farmer.
              </p>

              <div className="mt-5">

                {!selectedFarmer ? (

                  <div className="rounded-lg bg-slate-50 p-8 text-center">
                    <p className="text-sm text-slate-500">
                      Select a farmer above to view their farms.
                    </p>
                  </div>

                ) : selectedFarmerFarms.length === 0 ? (

                  <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                    <p className="font-semibold text-slate-700">
                      No farms registered
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Create a farm using Register Farm.
                    </p>
                  </div>

                ) : (

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

                    {selectedFarmerFarms.map(
                      (farm) => {

                        const farmBatches =
                          batches.filter(
                            (batch) =>
                              batch.farm_id ===
                              farm.id
                          );

                        const liveBirds =
                          farmBatches.reduce(
                            (sum, batch) =>
                              sum +
                              Number(
                                batch.current_quantity ||
                                  0
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
                                    'Farm'}
                                </p>

                              </div>

                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                {farm.status ||
                                  'ACTIVE'}
                              </span>

                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">

                              <Metric
                                label="Shed Capacity"
                                value={
                                  farm.shed_capacity ||
                                  0
                                }
                              />

                              <Metric
                                label="Batches"
                                value={
                                  farmBatches.length
                                }
                              />

                              <Metric
                                label="Live Birds"
                                value={liveBirds}
                              />

                              <Metric
                                label="Utilization"
                                value={
                                  farm.shed_capacity
                                    ? `${Math.round(
                                        (liveBirds /
                                          farm.shed_capacity) *
                                          100
                                      )}%`
                                    : '—'
                                }
                              />

                            </div>

                            {/* FARM 360 LINK */}

                            <Link
                              href={`/bodhifarm/farms/${farm.id}`}
                              className="mt-4 block rounded-lg bg-green-700 px-4 py-3 text-center text-sm font-bold text-white hover:bg-green-800"
                            >
                              Open Farm 360° →
                            </Link>

                            {farmBatches.length >
                              0 && (
                              <div className="mt-4 border-t border-slate-200 pt-4">

                                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Bird Batches
                                </p>

                                <div className="space-y-2">

                                  {farmBatches.map(
                                    (batch) => (
                                      <div
                                        key={batch.id}
                                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                                      >

                                        <Link
                                          href={`/bodhifarm/batches/${batch.id}`}
                                          className="min-w-0"
                                        >

                                          <p className="text-sm font-semibold text-green-700 hover:underline">
                                            {batch.batch_code ||
                                              'Batch'}
                                          </p>

                                          <p className="text-xs text-slate-500">
                                            {batch.breed ||
                                              'Breed not specified'}
                                          </p>

                                        </Link>

                                        <div className="text-right">

                                          <p className="text-sm font-bold text-slate-900">
                                            {batch.current_quantity ||
                                              0}
                                          </p>

                                          <button
                                            onClick={() =>
                                              unassignBatch(
                                                batch.id
                                              )
                                            }
                                            className="text-xs font-medium text-red-600 hover:text-red-700"
                                          >
                                            Remove
                                          </button>

                                        </div>

                                      </div>
                                    )
                                  )}

                                </div>

                              </div>
                            )}

                          </div>
                        );
                      }
                    )}

                  </div>

                )}

              </div>

            </section>

            {/* ALL FARMS */}

            <section className="mt-6 rounded-xl bg-white shadow-sm ring-1 ring-slate-200">

              <div className="border-b border-slate-200 p-5">

                <h2 className="text-xl font-bold text-slate-900">
                  All Farms
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {farms.length} farm(s) registered.
                </p>

              </div>

              {farms.length === 0 ? (

                <div className="p-8 text-center text-sm text-slate-500">
                  No farms have been registered yet.
                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="min-w-full text-left text-sm">

                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">

                      <tr>

                        <th className="px-5 py-3">
                          Farm
                        </th>

                        <th className="px-5 py-3">
                          Farmer
                        </th>

                        <th className="px-5 py-3">
                          Type
                        </th>

                        <th className="px-5 py-3">
                          Capacity
                        </th>

                        <th className="px-5 py-3">
                          Status
                        </th>

                        <th className="px-5 py-3">
                          Batches
                        </th>

                        <th className="px-5 py-3">
                          Live Birds
                        </th>

                        <th className="px-5 py-3">
                          Profile
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-200">

                      {farms.map((farm) => {

                        const farmer =
                          farmers.find(
                            (item) =>
                              item.id ===
                              farm.farmer_id
                          );

                        const farmBatches =
                          batches.filter(
                            (batch) =>
                              batch.farm_id ===
                              farm.id
                          );

                        const liveBirds =
                          farmBatches.reduce(
                            (sum, batch) =>
                              sum +
                              Number(
                                batch.current_quantity ||
                                  0
                              ),
                            0
                          );

                        return (
                          <tr
                            key={farm.id}
                            className="hover:bg-slate-50"
                          >

                            <td className="px-5 py-4 font-semibold text-slate-900">
                              {farm.farm_name ||
                                'Unnamed Farm'}
                            </td>

                            <td className="px-5 py-4">

                              <p className="font-medium text-slate-900">
                                {farmer?.farmer_id ||
                                  '—'}
                              </p>

                              <p className="text-xs text-slate-500">
                                {farmer?.full_name ||
                                  '—'}
                              </p>

                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {farm.farm_type ||
                                '—'}
                            </td>

                            <td className="px-5 py-4 font-semibold">
                              {farm.shed_capacity ||
                                0}
                            </td>

                            <td className="px-5 py-4">

                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                {farm.status ||
                                  'ACTIVE'}
                              </span>

                            </td>

                            <td className="px-5 py-4 font-semibold">
                              {farmBatches.length}
                            </td>

                            <td className="px-5 py-4 font-semibold">
                              {liveBirds}
                            </td>

                            <td className="px-5 py-4">

                              <Link
                                href={`/bodhifarm/farms/${farm.id}`}
                                className="font-semibold text-green-700 hover:text-green-800 hover:underline"
                              >
                                Farm 360° →
                              </Link>

                            </td>

                          </tr>
                        );
                      })}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

          </>

        )}

      </div>

    </main>
  );
}

function Kpi({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

    </div>
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

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}
