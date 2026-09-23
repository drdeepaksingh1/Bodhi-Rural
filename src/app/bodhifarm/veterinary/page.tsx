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

type VeterinaryRecord = {
  id: string;
  farmer_id: string;
  batch_id: string;
  record_date: string;
  record_type: string;
  mortality_quantity: number;
  cause: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  treatment: string | null;
  medicine: string | null;
  medicine_quantity: number | null;
  veterinary_visit: boolean;
  veterinary_name: string | null;
  follow_up_date: string | null;
  remarks: string | null;
};

const RECORD_TYPES = [
  'MORTALITY',
  'VETERINARY_VISIT',
  'HEALTH_CHECK',
  'TREATMENT',
  'VACCINATION',
];

const CAUSES = [
  'Unknown',
  'Disease',
  'Injury',
  'Weakness',
  'Heat Stress',
  'Cold Stress',
  'Predator',
  'Accident',
  'Other',
];

function getIndiaDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(new Date());
}

export default function VeterinaryPage() {
  const supabase = createClient();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [batches, setBatches] = useState<BirdBatch[]>([]);
  const [records, setRecords] = useState<VeterinaryRecord[]>([]);

  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  const [recordDate, setRecordDate] = useState(getIndiaDate());
  const [recordType, setRecordType] = useState('MORTALITY');
  const [mortalityQuantity, setMortalityQuantity] = useState('');

  const [cause, setCause] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [medicine, setMedicine] = useState('');
  const [medicineQuantity, setMedicineQuantity] = useState('');

  const [veterinaryVisit, setVeterinaryVisit] = useState(false);
  const [veterinaryName, setVeterinaryName] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedBatchData = useMemo(() => {
    return batches.find(
      (batch) => batch.id === selectedBatch
    );
  }, [batches, selectedBatch]);

  const farmerBatches = useMemo(() => {
    if (!selectedFarmer) return [];

    return batches.filter(
      (batch) => batch.farmer_id === selectedFarmer
    );
  }, [batches, selectedFarmer]);

  const currentLiveBirds =
    selectedBatchData?.current_quantity ?? 0;

  const currentMortality =
    selectedBatchData?.mortality_quantity ?? 0;

  const mortality = Number(mortalityQuantity) || 0;

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
        .order('placement_date', {
          ascending: false,
        }),

      supabase
        .from('veterinary_records')
        .select(
          `
          id,
          farmer_id,
          batch_id,
          record_date,
          record_type,
          mortality_quantity,
          cause,
          symptoms,
          diagnosis,
          treatment,
          medicine,
          medicine_quantity,
          veterinary_visit,
          veterinary_name,
          follow_up_date,
          remarks
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

  function resetForm() {
    setRecordType('MORTALITY');
    setMortalityQuantity('');
    setCause('');
    setSymptoms('');
    setDiagnosis('');
    setTreatment('');
    setMedicine('');
    setMedicineQuantity('');
    setVeterinaryVisit(false);
    setVeterinaryName('');
    setFollowUpDate('');
    setRemarks('');
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

  async function saveRecord() {
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
      setError('Please select record date.');
      return;
    }

    if (!recordType) {
      setError('Please select record type.');
      return;
    }

    if (recordType === 'MORTALITY') {
      if (
        !Number.isInteger(mortality) ||
        mortality <= 0
      ) {
        setError(
          'Mortality quantity must be a whole number greater than 0.'
        );
        return;
      }

      if (mortality > currentLiveBirds) {
        setError(
          `Mortality cannot exceed current live birds (${currentLiveBirds}).`
        );
        return;
      }
    }

    if (
      medicineQuantity &&
      (!Number.isFinite(
        Number(medicineQuantity)
      ) ||
        Number(medicineQuantity) < 0)
    ) {
      setError(
        'Medicine quantity cannot be negative.'
      );
      return;
    }

    if (veterinaryVisit && !veterinaryName.trim()) {
      setError(
        'Please enter the veterinary name.'
      );
      return;
    }

    setSaving(true);

    const { error: insertError } =
      await supabase
        .from('veterinary_records')
        .insert({
          farmer_id: selectedFarmer,
          batch_id: selectedBatch,
          record_date: recordDate,
          record_type: recordType,
          mortality_quantity:
            recordType === 'MORTALITY'
              ? mortality
              : 0,
          cause: cause || null,
          symptoms: symptoms || null,
          diagnosis: diagnosis || null,
          treatment: treatment || null,
          medicine: medicine || null,
          medicine_quantity:
            medicineQuantity
              ? Number(medicineQuantity)
              : null,
          veterinary_visit:
            veterinaryVisit,
          veterinary_name:
            veterinaryName || null,
          follow_up_date:
            followUpDate || null,
          remarks: remarks || null,
        });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setMessage(
      'Veterinary / mortality record saved successfully.'
    );

    resetForm();

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

  function getBatchName(batchId: string) {
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
              Veterinary & Mortality
            </h1>

            <p className="text-sm text-gray-500">
              Bird health, mortality and veterinary management
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

        {/* Selected Flock */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Current Live Birds
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {selectedBatch
                ? currentLiveBirds
                : '—'}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Mortality
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {selectedBatch
                ? currentMortality
                : '—'}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Initial Birds
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {selectedBatch
                ? selectedBatchData?.initial_quantity
                : '—'}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Available After Entry
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              {selectedBatch
                ? Math.max(
                    currentLiveBirds - mortality,
                    0
                  )
                : '—'}
            </p>
          </div>

        </section>

        {/* Form */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Record Bird Health / Mortality
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Record mortality, veterinary visits, treatment and health events.
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
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">
                  Select Farmer
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
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm disabled:bg-gray-100"
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
                    {batch.batch_code} —{' '}
                    {batch.breed} —{' '}
                    {batch.current_quantity} live
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Record Date
              </label>

              <input
                type="date"
                value={recordDate}
                onChange={(e) =>
                  setRecordDate(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              />
            </div>

            {/* Record Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Record Type
              </label>

              <select
                value={recordType}
                onChange={(e) =>
                  setRecordType(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
              >
                {RECORD_TYPES.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Mortality */}
            {recordType === 'MORTALITY' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Mortality Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  max={currentLiveBirds}
                  value={mortalityQuantity}
                  onChange={(e) =>
                    setMortalityQuantity(
                      e.target.value
                    )
                  }
                  placeholder={`Maximum ${currentLiveBirds}`}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                />
              </div>
            )}

            {/* Cause */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Cause
              </label>

              <select
                value={cause}
                onChange={(e) =>
                  setCause(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">
                  Select Cause
                </option>

                {CAUSES.map((item) => (
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

          {/* Health Details */}
          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Symptoms
              </label>

              <textarea
                value={symptoms}
                onChange={(e) =>
                  setSymptoms(e.target.value)
                }
                rows={3}
                placeholder="Describe symptoms..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Diagnosis
              </label>

              <textarea
                value={diagnosis}
                onChange={(e) =>
                  setDiagnosis(e.target.value)
                }
                rows={3}
                placeholder="Veterinary diagnosis..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Treatment
              </label>

              <textarea
                value={treatment}
                onChange={(e) =>
                  setTreatment(e.target.value)
                }
                rows={3}
                placeholder="Treatment given..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Medicine
              </label>

              <textarea
                value={medicine}
                onChange={(e) =>
                  setMedicine(e.target.value)
                }
                rows={3}
                placeholder="Medicine name..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              />
            </div>

          </div>

          {/* Veterinary */}
          <div className="mt-6 rounded-xl border bg-gray-50 p-5">

            <h3 className="text-sm font-bold text-gray-900">
              Veterinary Visit
            </h3>

            <div className="mt-4 grid gap-5 md:grid-cols-3">

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={veterinaryVisit}
                  onChange={(e) =>
                    setVeterinaryVisit(
                      e.target.checked
                    )
                  }
                  className="h-4 w-4"
                />

                <label className="text-sm text-gray-700">
                  Veterinary Visit
                </label>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Veterinary Name
                </label>

                <input
                  type="text"
                  value={veterinaryName}
                  onChange={(e) =>
                    setVeterinaryName(
                      e.target.value
                    )
                  }
                  disabled={!veterinaryVisit}
                  placeholder="Veterinary name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Follow-up Date
                </label>

                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) =>
                    setFollowUpDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                />
              </div>

            </div>

          </div>

          {/* Medicine Quantity + Remarks */}
          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Medicine Quantity
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={medicineQuantity}
                onChange={(e) =>
                  setMedicineQuantity(
                    e.target.value
                  )
                }
                placeholder="Example: 100 ml"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Remarks
              </label>

              <input
                type="text"
                value={remarks}
                onChange={(e) =>
                  setRemarks(e.target.value)
                }
                placeholder="Additional remarks"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              />
            </div>

          </div>

          {/* Save */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={saveRecord}
              disabled={saving || loading}
              className="rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : 'Save Health Record'}
            </button>
          </div>

        </section>

        {/* History */}
        <section className="rounded-xl border bg-white shadow-sm">

          <div className="border-b px-6 py-5">
            <h2 className="text-xl font-bold text-gray-900">
              Veterinary & Mortality History
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Latest 100 health records
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
                    Type
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Mortality
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Cause
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Veterinary
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">

                {records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm text-gray-500"
                    >
                      No veterinary or mortality records found.
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
                        {record.record_type.replace(
                          '_',
                          ' '
                        )}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-bold text-red-600">
                        {record.mortality_quantity}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {record.cause || '—'}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {record.veterinary_visit
                          ? record.veterinary_name ||
                            'Visit recorded'
                          : 'No'}
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
