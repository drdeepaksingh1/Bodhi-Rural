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
  [key: string]: unknown;
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

type FarmerApplication = {
  id: string;
  user_id: string | null;
  full_name: string;
  father_husband_name: string | null;
  mobile: string;
  alternate_mobile: string | null;
  date_of_birth: string | null;
  gender: string | null;
  state_id: string | null;
  district_id: string | null;
  block_id: string | null;
  panchayat_id: string | null;
  village_id: string | null;
  address: string | null;
  farm_name: string | null;
  farm_type: string | null;
  land_area: number | null;
  shed_available: boolean | null;
  shed_capacity: number | null;
  bank_account_name: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_account_number: string | null;
  ifsc_code: string | null;
  bank_passbook_url: string | null;
  aadhaar_number: string | null;
  aadhaar_document_url: string | null;
  farmer_photo_url: string | null;
  status: string;
  approved_at: string | null;
  rejection_reason: string | null;
  farmer_id: string | null;
  created_at: string | null;
};

type LocationRow = {
  id: string;
  name: string;
  location_type: string;
};

type GenericRow = Record<string, unknown>;

const supabase = createClient();

export default function Farmer360ProfilePage() {
  const params = useParams();
  const farmerUuid = Array.isArray(params.id) ? params.id[0] : params.id;

  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [application, setApplication] = useState<FarmerApplication | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [batches, setBatches] = useState<BirdBatch[]>([]);
  const [eggs, setEggs] = useState<EggRecord[]>([]);
  const [feeds, setFeeds] = useState<FeedRecord[]>([]);
  const [veterinary, setVeterinary] = useState<VeterinaryRecord[]>([]);
  const [credit, setCredit] = useState<GenericRow | null>(null);
  const [orders, setOrders] = useState<GenericRow[]>([]);
  const [payments, setPayments] = useState<GenericRow[]>([]);
  const [locations, setLocations] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (farmerUuid) {
      loadProfile();
    }
  }, [farmerUuid]);

  async function loadProfile() {
    setLoading(true);
    setError('');

    try {
      const [
        farmerResult,
        applicationResult,
        farmsResult,
        batchesResult,
        eggsResult,
        feedsResult,
        veterinaryResult,
        creditResult,
        ordersResult,
        paymentsResult,
      ] = await Promise.all([
        supabase
          .from('farmers')
          .select('*')
          .eq('id', farmerUuid)
          .single(),

        supabase
          .from('farmer_applications')
          .select('*')
          .eq('farmer_id', farmerUuid)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

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
          .order('placement_date', { ascending: false }),

        supabase
          .from('egg_production')
          .select(
            'id, farmer_id, batch_id, production_date, total_eggs, saleable_eggs, cracked_eggs, damaged_eggs'
          )
          .eq('farmer_id', farmerUuid)
          .order('production_date', { ascending: false }),

        supabase
          .from('feed_records')
          .select(
            'id, farmer_id, batch_id, record_date, feed_type, quantity_kg, unit_cost, total_cost'
          )
          .eq('farmer_id', farmerUuid)
          .order('record_date', { ascending: false }),

        supabase
          .from('veterinary_records')
          .select(
            'id, farmer_id, batch_id, record_date, record_type, mortality_quantity, cause, diagnosis, treatment, veterinary_name'
          )
          .eq('farmer_id', farmerUuid)
          .order('record_date', { ascending: false }),

        supabase
          .from('farmer_credit')
          .select('*')
          .eq('farmer_id', farmerUuid)
          .limit(1)
          .maybeSingle(),

        supabase
          .from('orders')
          .select('*')
          .eq('farmer_id', farmerUuid)
          .order('created_at', { ascending: false })
          .limit(20),

        supabase
          .from('payments')
          .select('*')
          .eq('farmer_id', farmerUuid)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      if (farmerResult.error) {
        throw new Error(farmerResult.error.message);
      }

      setFarmer(farmerResult.data as Farmer);
      setApplication(
        (applicationResult.data as FarmerApplication | null) || null
      );
      setFarms((farmsResult.data || []) as Farm[]);
      setBatches((batchesResult.data || []) as BirdBatch[]);
      setEggs((eggsResult.data || []) as EggRecord[]);
      setFeeds((feedsResult.data || []) as FeedRecord[]);
      setVeterinary((veterinaryResult.data || []) as VeterinaryRecord[]);

      if (!creditResult.error) {
        setCredit((creditResult.data as GenericRow | null) || null);
      } else {
        setCredit(null);
      }

      if (!ordersResult.error) {
        setOrders((ordersResult.data || []) as GenericRow[]);
      } else {
        setOrders([]);
      }

      if (!paymentsResult.error) {
        setPayments((paymentsResult.data || []) as GenericRow[]);
      } else {
        setPayments([]);
      }

      const locationIds = [
        applicationResult.data?.state_id,
        applicationResult.data?.district_id,
        applicationResult.data?.block_id,
        applicationResult.data?.panchayat_id,
        applicationResult.data?.village_id,
      ].filter(Boolean) as string[];

      if (locationIds.length > 0) {
        const locationResult = await supabase
          .from('locations')
          .select('id, name, location_type')
          .in('id', locationIds);

        if (!locationResult.error) {
          const map: Record<string, string> = {};
          ((locationResult.data || []) as LocationRow[]).forEach((row) => {
            map[row.id] = row.name;
          });
          setLocations(map);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load Farmer 360° profile.'
      );
    } finally {
      setLoading(false);
    }
  }

  const totalInitialBirds = useMemo(
    () =>
      batches.reduce(
        (sum, batch) => sum + Number(batch.initial_quantity || 0),
        0
      ),
    [batches]
  );

  const totalLiveBirds = useMemo(
    () =>
      batches.reduce(
        (sum, batch) => sum + Number(batch.current_quantity || 0),
        0
      ),
    [batches]
  );

  const totalMortality = useMemo(
    () =>
      batches.reduce(
        (sum, batch) => sum + Number(batch.mortality_quantity || 0),
        0
      ),
    [batches]
  );

  const totalEggs = useMemo(
    () =>
      eggs.reduce((sum, egg) => sum + Number(egg.total_eggs || 0), 0),
    [eggs]
  );

  const totalSaleableEggs = useMemo(
    () =>
      eggs.reduce(
        (sum, egg) => sum + Number(egg.saleable_eggs || 0),
        0
      ),
    [eggs]
  );

  const totalCracked = useMemo(
    () =>
      eggs.reduce(
        (sum, egg) => sum + Number(egg.cracked_eggs || 0),
        0
      ),
    [eggs]
  );

  const totalDamaged = useMemo(
    () =>
      eggs.reduce(
        (sum, egg) => sum + Number(egg.damaged_eggs || 0),
        0
      ),
    [eggs]
  );

  const totalFeedKg = useMemo(
    () =>
      feeds.reduce(
        (sum, feed) => sum + Number(feed.quantity_kg || 0),
        0
      ),
    [feeds]
  );

  const totalFeedCost = useMemo(
    () =>
      feeds.reduce(
        (sum, feed) => sum + Number(feed.total_cost || 0),
        0
      ),
    [feeds]
  );

  const mortalityRate =
    totalInitialBirds > 0
      ? (totalMortality / totalInitialBirds) * 100
      : 0;

  const saleableRate =
    totalEggs > 0 ? (totalSaleableEggs / totalEggs) * 100 : 0;

  const eggsPerLiveBird =
    totalLiveBirds > 0 ? totalEggs / totalLiveBirds : 0;

  const feedPerLiveBird =
    totalLiveBirds > 0 ? totalFeedKg / totalLiveBirds : 0;

  const feedCostPerEgg =
    totalEggs > 0 ? totalFeedCost / totalEggs : 0;

  const veterinaryMortality = veterinary.reduce(
    (sum, record) => sum + Number(record.mortality_quantity || 0),
    0
  );

  const creditLimit = numberFrom(
    credit,
    ['credit_limit', 'limit', 'approved_limit']
  );
  const creditOutstanding = numberFrom(
    credit,
    ['outstanding', 'outstanding_amount', 'used_amount', 'amount_outstanding']
  );
  const creditAvailable = numberFrom(
    credit,
    ['available', 'available_credit', 'available_limit']
  );
  const creditStatus = stringFrom(
    credit,
    ['status', 'credit_status']
  );

  const totalOrderValue = orders.reduce(
    (sum, row) =>
      sum +
      numberFrom(row, [
        'total_amount',
        'grand_total',
        'order_total',
        'amount',
        'net_amount',
      ]),
    0
  );

  const totalPaid = payments.reduce(
    (sum, row) =>
      sum +
      numberFrom(row, ['amount', 'paid_amount', 'payment_amount']),
    0
  );

  const recentActivity = useMemo(() => {
    const activity: {
      id: string;
      date: string;
      title: string;
      description: string;
      type: string;
    }[] = [];

    eggs.slice(0, 8).forEach((egg) => {
      activity.push({
        id: `egg-${egg.id}`,
        date: egg.production_date,
        title: 'Egg production recorded',
        description: `${Number(egg.total_eggs || 0)} eggs · ${Number(
          egg.saleable_eggs || 0
        )} saleable`,
        type: 'Production',
      });
    });

    feeds.slice(0, 8).forEach((feed) => {
      activity.push({
        id: `feed-${feed.id}`,
        date: feed.record_date,
        title: 'Feed record',
        description: `${Number(feed.quantity_kg || 0).toFixed(2)} kg · ₹${Number(
          feed.total_cost || 0
        ).toFixed(2)}`,
        type: 'Feed',
      });
    });

    veterinary.slice(0, 8).forEach((record) => {
      activity.push({
        id: `vet-${record.id}`,
        date: record.record_date || '',
        title: record.record_type || 'Veterinary record',
        description: `Mortality ${Number(
          record.mortality_quantity || 0
        )} · ${record.cause || 'No cause recorded'}`,
        type: 'Health',
      });
    });

    orders.slice(0, 8).forEach((order, index) => {
      activity.push({
        id: `order-${String(order.id || index)}`,
        date: String(
          order.created_at ||
            order.order_date ||
            order.createdDate ||
            ''
        ).slice(0, 10),
        title: 'BodhiMart order',
        description: `${stringFrom(order, [
          'order_number',
          'order_no',
          'status',
        ]) || 'Order recorded'} · ₹${numberFrom(order, [
          'total_amount',
          'grand_total',
          'order_total',
          'amount',
        ]).toFixed(2)}`,
        type: 'Commerce',
      });
    });

    return activity
      .filter((item) => item.date)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 15);
  }, [eggs, feeds, veterinary, orders]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-slate-600">Loading Farmer 360° Profile...</p>
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
              Farmer 360° Profile Not Found
            </h1>
            <p className="mt-2 text-sm text-red-700">
              {error || 'The requested farmer could not be found.'}
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

  const farmerName = farmer.full_name || 'Farmer';
  const photoUrl = stringFrom(farmer, ['photo_url', 'farmer_photo_url', 'avatar_url']);
  const joiningDate = stringFrom(farmer, ['joining_date', 'created_at']);
  const farmerEmail = stringFrom(farmer, ['email']);
  const farmerAddress = application?.address || stringFrom(farmer, ['address']);
  const fatherHusband =
    application?.father_husband_name ||
    stringFrom(farmer, ['father_husband_name', 'father_name', 'husband_name']);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/bodhifarm/farmers"
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            ← Back to Farmer Management
          </Link>

          <button
            onClick={loadProfile}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh 360° Profile
          </button>
        </div>

        {/* PROFILE HEADER */}
        <section className="mb-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="bg-gradient-to-r from-green-800 to-green-600 px-5 py-6 text-white sm:px-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 text-2xl font-bold ring-2 ring-white/40">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={farmerName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(farmerName)
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                      {farmer.farmer_id}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-green-800">
                      {farmer.status || 'ACTIVE'}
                    </span>
                  </div>

                  <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                    {farmerName}
                  </h1>

                  <p className="mt-1 text-sm text-green-50">
                    Farmer 360° Profile · Complete identity, location,
                    KYC, finance and farm operations
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-white/10 p-4 text-sm">
                <p className="text-green-100">Mobile</p>
                <p className="mt-1 text-lg font-bold">
                  {farmer.mobile || 'Not available'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-4 sm:divide-y-0">
            <Summary label="Live Birds" value={totalLiveBirds} />
            <Summary label="Mortality" value={totalMortality} />
            <Summary label="Total Eggs" value={totalEggs} />
            <Summary label="Saleable Eggs" value={totalSaleableEggs} />
          </div>
        </section>

        {/* NAV */}
        <div className="mb-5 overflow-x-auto rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
          <div className="flex min-w-max gap-2">
            {[
              ['overview', 'Overview'],
              ['identity', 'Identity & KYC'],
              ['location', 'Location'],
              ['farm', 'Farm & Flock'],
              ['production', 'Production'],
              ['finance', 'Finance'],
              ['activity', 'Activity'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  activeSection === key
                    ? 'bg-green-700 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* OVERVIEW */}
        {activeSection === 'overview' && (
          <>
            <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <MetricCard label="Farms" value={farms.length} />
              <MetricCard label="Bird Batches" value={batches.length} />
              <MetricCard
                label="Mortality Rate"
                value={`${mortalityRate.toFixed(2)}%`}
                valueClass="text-red-600"
              />
              <MetricCard
                label="Feed Consumed"
                value={`${totalFeedKg.toFixed(2)} kg`}
                valueClass="text-orange-600"
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <section className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <SectionTitle
                  title="Farmer Overview"
                  description="One consolidated view of the farmer's current platform record."
                />

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoItem label="Farmer ID" value={farmer.farmer_id} />
                  <InfoItem label="Name" value={farmerName} />
                  <InfoItem label="Mobile" value={farmer.mobile || '—'} />
                  <InfoItem label="Father / Husband" value={fatherHusband || '—'} />
                  <InfoItem label="Email" value={farmerEmail || '—'} />
                  <InfoItem
                    label="Joining / Created"
                    value={joiningDate ? formatDateTime(joiningDate) : '—'}
                  />
                  <InfoItem
                    label="Application"
                    value={application?.status || 'Not linked'}
                  />
                  <InfoItem
                    label="Land Area"
                    value={
                      application?.land_area != null
                        ? `${application.land_area} acre`
                        : '—'
                    }
                  />
                  <InfoItem
                    label="Shed Capacity"
                    value={
                      application?.shed_capacity != null
                        ? application.shed_capacity
                        : '—'
                    }
                  />
                </div>
              </section>

              <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <SectionTitle
                  title="Platform Status"
                  description="Connected modules for this farmer."
                />

                <div className="mt-5 space-y-3">
                  <StatusRow label="Farmer" active />
                  <StatusRow label="Farmer Application" active={!!application} />
                  <StatusRow label="Farm" active={farms.length > 0} />
                  <StatusRow label="Bird Management" active={batches.length > 0} />
                  <StatusRow label="Egg Production" active={eggs.length > 0} />
                  <StatusRow label="Feed" active={feeds.length > 0} />
                  <StatusRow
                    label="Veterinary"
                    active={veterinary.length > 0}
                  />
                  <StatusRow label="Credit" active={!!credit} />
                  <StatusRow label="BodhiMart" active={orders.length > 0} />
                </div>
              </section>
            </div>

            <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <SectionTitle
                title="Recent Activity"
                description="Recent operational and commerce activity connected with this farmer."
              />

              <div className="mt-5">
                {recentActivity.length === 0 ? (
                  <Empty text="No recent activity recorded." />
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">
                              {item.title}
                            </p>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                              {item.type}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.description}
                          </p>
                        </div>
                        <p className="text-xs font-semibold text-slate-500">
                          {formatDate(item.date)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* IDENTITY + KYC */}
        {activeSection === 'identity' && (
          <div className="space-y-5">
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <SectionTitle
                title="Personal Identity"
                description="Identity information captured during farmer registration."
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoItem label="Farmer ID" value={farmer.farmer_id} />
                <InfoItem label="Full Name" value={farmerName} />
                <InfoItem label="Father / Husband" value={fatherHusband || '—'} />
                <InfoItem label="Mobile" value={farmer.mobile || '—'} />
                <InfoItem
                  label="Alternate Mobile"
                  value={application?.alternate_mobile || '—'}
                />
                <InfoItem
                  label="Date of Birth"
                  value={application?.date_of_birth ? formatDate(application.date_of_birth) : '—'}
                />
                <InfoItem
                  label="Gender"
                  value={application?.gender || '—'}
                />
                <InfoItem label="Email" value={farmerEmail || '—'} />
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <SectionTitle
                title="KYC & Bank"
                description="Sensitive identifiers are masked in the 360° view."
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem
                  label="Aadhaar"
                  value={
                    application?.aadhaar_number
                      ? maskAadhaar(application.aadhaar_number)
                      : 'Not available'
                  }
                />
                <InfoItem
                  label="Aadhaar Document"
                  value={
                    application?.aadhaar_document_url
                      ? 'Uploaded'
                      : 'Not uploaded'
                  }
                />
                <InfoItem
                  label="Farmer Photo"
                  value={
                    application?.farmer_photo_url || photoUrl
                      ? 'Uploaded'
                      : 'Not uploaded'
                  }
                />
                <InfoItem
                  label="Account Holder"
                  value={application?.bank_account_name || '—'}
                />
                <InfoItem
                  label="Bank"
                  value={application?.bank_name || '—'}
                />
                <InfoItem
                  label="Branch"
                  value={application?.bank_branch || '—'}
                />
                <InfoItem
                  label="Account Number"
                  value={
                    application?.bank_account_number
                      ? maskAccount(application.bank_account_number)
                      : '—'
                  }
                />
                <InfoItem
                  label="IFSC"
                  value={application?.ifsc_code || '—'}
                />
                <InfoItem
                  label="Passbook"
                  value={
                    application?.bank_passbook_url
                      ? 'Uploaded'
                      : 'Not uploaded'
                  }
                />
              </div>

              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Full Aadhaar and complete bank account numbers are intentionally
                not displayed on the operational 360° profile.
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <SectionTitle
                title="Registration & Approval"
                description="Farmer onboarding record."
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoItem label="Application Status" value={application?.status || '—'} />
                <InfoItem
                  label="Application Date"
                  value={
                    application?.created_at
                      ? formatDateTime(application.created_at)
                      : '—'
                  }
                />
                <InfoItem
                  label="Approved Date"
                  value={
                    application?.approved_at
                      ? formatDateTime(application.approved_at)
                      : '—'
                  }
                />
                <InfoItem
                  label="Application Farmer ID"
                  value={application?.farmer_id ? farmer.farmer_id : '—'}
                />
              </div>
            </section>
          </div>
        )}

        {/* LOCATION */}
        {activeSection === 'location' && (
          <div className="space-y-5">
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <SectionTitle
                title="Farmer Location"
                description="Administrative geography linked to the farmer registration."
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <InfoItem
                  label="State"
                  value={locationName(application?.state_id, 'Not available')}
                />
                <InfoItem
                  label="District"
                  value={locationName(application?.district_id, 'Not available')}
                />
                <InfoItem
                  label="Block"
                  value={locationName(application?.block_id, 'Not available')}
                />
                <InfoItem
                  label="Panchayat"
                  value={locationName(application?.panchayat_id, 'Not available')}
                />
                <InfoItem
                  label="Village"
                  value={locationName(application?.village_id, 'Not available')}
                />
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Address</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {farmerAddress || 'Address not available'}
                </p>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <SectionTitle
                title="Farm Registration"
                description="Agricultural information captured at onboarding."
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoItem label="Farm Name" value={application?.farm_name || '—'} />
                <InfoItem label="Farm Type" value={application?.farm_type || '—'} />
                <InfoItem
                  label="Land Area"
                  value={
                    application?.land_area != null
                      ? `${application.land_area} acre`
                      : '—'
                  }
                />
                <InfoItem
                  label="Shed Available"
                  value={
                    application?.shed_available == null
                      ? '—'
                      : application.shed_available
                        ? 'Yes'
                        : 'No'
                  }
                />
              </div>
            </section>
          </div>
        )}

        {/* FARM + FLOCK */}
        {activeSection === 'farm' && (
          <div className="space-y-5">
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <SectionTitle
                title="Farms"
                description="All farms registered under this farmer."
              />

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {farms.length === 0 ? (
                  <Empty text="No farm registered for this farmer." />
                ) : (
                  farms.map((farm) => {
                    const farmBatches = batches.filter(
                      (batch) => batch.farm_id === farm.id
                    );
                    const farmLiveBirds = farmBatches.reduce(
                      (sum, batch) =>
                        sum + Number(batch.current_quantity || 0),
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
                              {farm.farm_name || 'Unnamed Farm'}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {farm.farm_type || 'Farm type not specified'}
                            </p>
                          </div>
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                            {farm.status || 'ACTIVE'}
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <InfoItem
                            label="Shed Capacity"
                            value={Number(farm.shed_capacity || 0)}
                          />
                          <InfoItem label="Batches" value={farmBatches.length} />
                          <InfoItem label="Live Birds" value={farmLiveBirds} />
                          <InfoItem
                            label="Farm Status"
                            value={farm.status || 'ACTIVE'}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <SectionTitle
                title="Bird Batches"
                description="Flock lifecycle and current quantity."
              />

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {batches.length === 0 ? (
                  <Empty text="No bird batches registered." />
                ) : (
                  batches.map((batch) => (
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
                            {batch.bird_type || 'Bird type not specified'}
                          </p>
                        </div>
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                          {batch.status || 'ACTIVE'}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <InfoItem
                          label="Placement"
                          value={formatDate(batch.placement_date)}
                        />
                        <InfoItem
                          label="Initial"
                          value={Number(batch.initial_quantity || 0)}
                        />
                        <InfoItem
                          label="Live"
                          value={Number(batch.current_quantity || 0)}
                        />
                        <InfoItem
                          label="Mortality"
                          value={Number(batch.mortality_quantity || 0)}
                        />
                        <InfoItem
                          label="Mortality %"
                          value={`${percentage(
                            Number(batch.mortality_quantity || 0),
                            Number(batch.initial_quantity || 0)
                          ).toFixed(2)}%`}
                        />
                        <InfoItem
                          label="Farm"
                          value={
                            farms.find((farm) => farm.id === batch.farm_id)
                              ?.farm_name || 'Not assigned'
                          }
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* PRODUCTION */}
        {activeSection === 'production' && (
          <div className="space-y-5">
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <MetricCard label="Total Eggs" value={totalEggs} valueClass="text-amber-600" />
              <MetricCard
                label="Saleable Eggs"
                value={totalSaleableEggs}
                valueClass="text-green-700"
              />
              <MetricCard label="Feed" value={`${totalFeedKg.toFixed(2)} kg`} />
              <MetricCard
                label="Feed Cost"
                value={`₹${totalFeedCost.toFixed(2)}`}
                valueClass="text-purple-700"
              />
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <SectionTitle
                title="Production Performance"
                description="Aggregated production indicators."
              />

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <PerformanceCard
                  label="Saleable Rate"
                  value={`${saleableRate.toFixed(2)}%`}
                  description="Saleable eggs / total eggs"
                />
                <PerformanceCard
                  label="Eggs / Live Bird"
                  value={eggsPerLiveBird.toFixed(2)}
                  description="Total eggs per current live bird"
                />
                <PerformanceCard
                  label="Feed / Live Bird"
                  value={`${feedPerLiveBird.toFixed(3)} kg`}
                  description="Recorded feed per current live bird"
                />
                <PerformanceCard
                  label="Feed Cost / Egg"
                  value={`₹${feedCostPerEgg.toFixed(2)}`}
                  description="Recorded feed cost per egg"
                />
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <SectionTitle
                title="Egg Production"
                description="Latest production records."
              />

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniCard label="Total" value={totalEggs} />
                <MiniCard label="Saleable" value={totalSaleableEggs} />
                <MiniCard label="Cracked" value={totalCracked} />
                <MiniCard label="Damaged" value={totalDamaged} />
              </div>

              <div className="mt-5 space-y-2">
                {eggs.length === 0 ? (
                  <Empty text="No egg production records." />
                ) : (
                  eggs.slice(0, 15).map((egg) => (
                    <div
                      key={egg.id}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatDate(egg.production_date)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Batch: {egg.batch_id || '—'}
                        </p>
                      </div>
                      <p className="text-sm text-slate-700">
                        Total {Number(egg.total_eggs || 0)} · Saleable{' '}
                        {Number(egg.saleable_eggs || 0)} · Cracked{' '}
                        {Number(egg.cracked_eggs || 0)} · Damaged{' '}
                        {Number(egg.damaged_eggs || 0)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <SectionTitle
                title="Feed Records"
                description="Feed consumption and cost."
              />

              <div className="mt-5 space-y-2">
                {feeds.length === 0 ? (
                  <Empty text="No feed records." />
                ) : (
                  feeds.slice(0, 15).map((feed) => (
                    <div
                      key={feed.id}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatDate(feed.record_date)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {feed.feed_type || 'Feed'}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {Number(feed.quantity_kg || 0).toFixed(2)} kg · ₹
                        {Number(feed.total_cost || 0).toFixed(2)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <SectionTitle
                title="Veterinary & Mortality"
                description="Health, treatment and mortality records."
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Veterinary Records" value={veterinary.length} />
                <MetricCard
                  label="Recorded Mortality"
                  value={veterinaryMortality}
                  valueClass="text-red-600"
                />
                <MetricCard
                  label="Flock Mortality"
                  value={totalMortality}
                  valueClass="text-red-600"
                />
                <MetricCard
                  label="Mortality Rate"
                  value={`${mortalityRate.toFixed(2)}%`}
                  valueClass="text-red-600"
                />
              </div>

              <div className="mt-5 space-y-3">
                {veterinary.length === 0 ? (
                  <Empty text="No veterinary records." />
                ) : (
                  veterinary.slice(0, 15).map((record) => (
                    <div
                      key={record.id}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {record.record_type || 'Veterinary Record'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {record.record_date
                              ? formatDate(record.record_date)
                              : 'Date not available'}
                          </p>
                        </div>
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                          Mortality: {Number(record.mortality_quantity || 0)}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <p>
                          <strong>Cause:</strong> {record.cause || '—'}
                        </p>
                        <p>
                          <strong>Diagnosis:</strong> {record.diagnosis || '—'}
                        </p>
                        <p>
                          <strong>Treatment:</strong> {record.treatment || '—'}
                        </p>
                        <p>
                          <strong>Veterinary:</strong>{' '}
                          {record.veterinary_name || '—'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* FINANCE */}
        {activeSection === 'finance' && (
          <div className="space-y-5">
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <MetricCard
                label="BodhiMart Orders"
                value={orders.length}
              />
              <MetricCard
                label="Order Value"
                value={`₹${totalOrderValue.toFixed(2)}`}
                valueClass="text-blue-700"
              />
              <MetricCard
                label="Payments"
                value={payments.length}
              />
              <MetricCard
                label="Recorded Paid"
                value={`₹${totalPaid.toFixed(2)}`}
                valueClass="text-green-700"
              />
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <SectionTitle
                title="Farmer Credit"
                description="Credit position where a credit record is available."
              />

              {credit ? (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoItem
                    label="Credit Limit"
                    value={`₹${creditLimit.toFixed(2)}`}
                  />
                  <InfoItem
                    label="Outstanding"
                    value={`₹${creditOutstanding.toFixed(2)}`}
                  />
                  <InfoItem
                    label="Available"
                    value={`₹${creditAvailable.toFixed(2)}`}
                  />
                  <InfoItem
                    label="Status"
                    value={creditStatus || '—'}
                  />
                </div>
              ) : (
                <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                  No farmer credit record is currently linked to this farmer.
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <SectionTitle
                title="BodhiMart Orders"
                description="Recent farmer-linked orders."
              />

              <div className="mt-5 space-y-2">
                {orders.length === 0 ? (
                  <Empty text="No BodhiMart orders found for this farmer." />
                ) : (
                  orders.map((order, index) => (
                    <div
                      key={String(order.id || index)}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {stringFrom(order, [
                            'order_number',
                            'order_no',
                            'id',
                          ]) || `Order ${index + 1}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {stringFrom(order, ['status', 'order_status']) || 'Status not available'}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-700">
                        ₹
                        {numberFrom(order, [
                          'total_amount',
                          'grand_total',
                          'order_total',
                          'amount',
                        ]).toFixed(2)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <SectionTitle
                title="Payments"
                description="Recent farmer-linked payment records."
              />

              <div className="mt-5 space-y-2">
                {payments.length === 0 ? (
                  <Empty text="No payment records found for this farmer." />
                ) : (
                  payments.map((payment, index) => (
                    <div
                      key={String(payment.id || index)}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {stringFrom(payment, [
                            'payment_reference',
                            'transaction_id',
                            'id',
                          ]) || `Payment ${index + 1}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {stringFrom(payment, [
                            'status',
                            'payment_status',
                            'mode',
                          ]) || 'Payment record'}
                        </p>
                      </div>
                      <p className="font-semibold text-green-700">
                        ₹
                        {numberFrom(payment, [
                          'amount',
                          'paid_amount',
                          'payment_amount',
                        ]).toFixed(2)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* ACTIVITY */}
        {activeSection === 'activity' && (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <SectionTitle
              title="Farmer Activity Timeline"
              description="Consolidated recent activity across BodhiFarm and BodhiMart."
            />

            <div className="mt-6">
              {recentActivity.length === 0 ? (
                <Empty text="No activity available." />
              ) : (
                <div className="relative space-y-4">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-green-600 ring-4 ring-green-100" />
                      <div className="flex-1 rounded-xl border border-slate-200 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {item.title}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {item.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                              {item.type}
                            </span>
                            <p className="mt-2 text-xs text-slate-500">
                              {formatDate(item.date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* QUICK ACTIONS */}
        <section className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <SectionTitle
            title="Quick Actions"
            description="Open the relevant management module for this farmer."
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <ActionLink href="/bodhifarm" label="Bird Batches" primary />
            <ActionLink href="/bodhifarm/egg-production" label="Egg Production" />
            <ActionLink href="/bodhifarm/feed" label="Feed Management" />
            <ActionLink href="/bodhifarm/veterinary" label="Veterinary" />
            <ActionLink href="/bodhifarm/performance" label="Performance Dashboard" />
          </div>
        </section>
      </div>
    </main>
  );

  function locationName(id: string | null | undefined, fallback: string) {
    if (!id) return fallback;
    return locations[id] || fallback;
  }
}

function stringFrom(
  row: GenericRow | Farmer | null | undefined,
  keys: string[]
): string {
  if (!row) return '';
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return String(value);
    }
  }
  return '';
}

function numberFrom(
  row: GenericRow | Farmer | null | undefined,
  keys: string[]
): number {
  if (!row) return 0;
  for (const key of keys) {
    const value = row[key];
    const number = Number(value);
    if (value !== null && value !== undefined && Number.isFinite(number)) {
      return number;
    }
  }
  return 0;
}

function maskAadhaar(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

function maskAccount(value: string) {
  const clean = value.replace(/\s/g, '');
  if (clean.length <= 4) return `****${clean}`;
  return `XXXXXX${clean.slice(-4)}`;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function formatDate(value: string) {
  if (!value) return '—';

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value: string) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function percentage(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">
        {typeof value === 'number'
          ? value.toLocaleString('en-IN')
          : value}
      </p>
    </div>
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
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold sm:text-3xl ${valueClass}`}>
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
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-slate-900">
        {typeof value === 'number'
          ? value.toLocaleString('en-IN')
          : value}
      </p>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function StatusRow({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span
        className={`rounded-full px-2 py-1 text-[11px] font-bold ${
          active
            ? 'bg-green-100 text-green-700'
            : 'bg-slate-100 text-slate-500'
        }`}
      >
        {active ? 'CONNECTED' : 'NO RECORD'}
      </span>
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
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">
        {typeof value === 'number'
          ? value.toLocaleString('en-IN')
          : value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
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
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">
        {typeof value === 'number'
          ? value.toLocaleString('en-IN')
          : value}
      </p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
      {text}
    </div>
  );
}

function ActionLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? 'rounded-lg bg-green-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-green-800'
          : 'rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50'
      }
    >
      {label}
    </Link>
  );
}
