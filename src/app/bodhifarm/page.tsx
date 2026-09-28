'use client';

import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { createClient } from '../../lib/supabase/client';

type RoleCode =
  | 'SUPER_ADMIN'
  | 'CEO'
  | 'CORPORATE_ADMIN'
  | 'STATE_MANAGER'
  | 'DISTRICT_MANAGER'
  | 'BLOCK_MANAGER'
  | 'CLUSTER_SUPERVISOR'
  | 'FARMER_LEADER'
  | 'FARMER'
  | 'VETERINARY'
  | 'FINANCE'
  | 'MIS'
  | 'HR'
  | 'MARKETING'
  | 'PROCUREMENT'
  | 'SHOPKEEPER'
  | 'WAREHOUSE'
  | 'DELIVERY'
  | 'MARKETPLACE_ADMIN'
  | 'CUSTOMER';

type Farmer = {
  id: string;
  farmer_id: string;
  full_name: string;
};

type Farm = {
  id: string;
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

const managementRoles: RoleCode[] = [
  'SUPER_ADMIN',
  'CEO',
  'CORPORATE_ADMIN',
  'STATE_MANAGER',
  'DISTRICT_MANAGER',
  'BLOCK_MANAGER',
  'CLUSTER_SUPERVISOR',
];

const farmOperationRoles: RoleCode[] = [
  ...managementRoles,
  'FARMER_LEADER',
  'FARMER',
];

const veterinaryRoles: RoleCode[] = [
  ...farmOperationRoles,
  'VETERINARY',
];

const reportingRoles: RoleCode[] = [
  ...managementRoles,
  'FARMER_LEADER',
  'FARMER',
  'VETERINARY',
  'FINANCE',
  'MIS',
];

function hasRole(
  role: RoleCode | null,
  roles: RoleCode[]
) {
  return role ? roles.includes(role) : false;
}

function getRoleLabel(role: RoleCode | null) {
  if (!role) return 'User';

  return role
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function BodhiFarmPage() {
  const supabase = createClient();

  const [role, setRole] = useState<RoleCode | null>(null);
  const [userName, setUserName] = useState('');

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
  const [mortalityQuantity, setMortalityQuantity] =
    useState('0');
  const [source, setSource] = useState('Bodhi Rural');
  const [status, setStatus] = useState('ACTIVE');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingFarms, setLoadingFarms] =
    useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const canCreateBatch = hasRole(
    role,
    farmOperationRoles
  );

  const canManageFarmers = hasRole(
    role,
    managementRoles
  );

  const canSeeVeterinary = hasRole(
    role,
    veterinaryRoles
  );

  const canSeeReports = hasRole(
    role,
    reportingRoles
  );

  /*
   * ---------------------------------------------------------
   * LOAD CURRENT USER / ROLE
   * ---------------------------------------------------------
   */

  async function loadUserRole() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select(
          `
          full_name,
          role_id,
          is_active
        `
        )
        .eq('id', user.id)
        .maybeSingle();

    if (profileError) {
      setError(
        `Unable to load user profile: ${profileError.message}`
      );
      return;
    }

    if (!profile) {
      return;
    }

    if (profile.is_active === false) {
      setError(
        'Your account is inactive. Please contact administration.'
      );
      return;
    }

    setUserName(profile.full_name || user.email || '');

    if (!profile.role_id) {
      return;
    }

    const { data: roleData, error: roleError } =
      await supabase
        .from('roles')
        .select('code')
        .eq('id', profile.role_id)
        .maybeSingle();

    if (roleError) {
      setError(
        `Unable to load user role: ${roleError.message}`
      );
      return;
    }

    if (roleData?.code) {
      setRole(roleData.code as RoleCode);
    }
  }

  /*
   * ---------------------------------------------------------
   * LOAD FARMERS
   * ---------------------------------------------------------
   */

  async function loadFarmers() {
    const { data, error } = await supabase
      .from('farmers')
      .select(
        'id, farmer_id, full_name'
      )
      .eq('status', 'ACTIVE')
      .order('full_name', {
        ascending: true,
      });

    if (error) {
      setError(
        `Unable to load farmers: ${error.message}`
      );
      return;
    }

    setFarmers(data ?? []);
  }

  /*
   * ---------------------------------------------------------
   * LOAD BIRD BATCHES
   * ---------------------------------------------------------
   */

  async function loadBatches() {
    const { data, error } = await supabase
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
        source,
        status,
        farmer_id
      `
      )
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      setError(
        `Unable to load bird batches: ${error.message}`
      );
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
      farmsResult,
      eggsResult,
      feedsResult,
      veterinaryResult,
    ] = await Promise.all([
      supabase
        .from('farms')
        .select(
          'id, farm_name, farm_type, shed_capacity, status'
        ),

      supabase
        .from('egg_production')
        .select(
          'id, total_eggs, saleable_eggs'
        ),

      supabase
        .from('feed_records')
        .select(
          'id, quantity_kg, total_cost'
        ),

      supabase
        .from('veterinary_records')
        .select(
          'id, mortality_quantity'
        ),
    ]);

    if (farmsResult.error) {
      setError(
        `Unable to load farms: ${farmsResult.error.message}`
      );
    } else {
      setAllFarms(
        farmsResult.data ?? []
      );
    }

    if (eggsResult.error) {
      setError(
        `Unable to load egg production: ${eggsResult.error.message}`
      );
    } else {
      setEggs(
        eggsResult.data ?? []
      );
    }

    if (feedsResult.error) {
      setError(
        `Unable to load feed records: ${feedsResult.error.message}`
      );
    } else {
      setFeeds(
        feedsResult.data ?? []
      );
    }

    if (veterinaryResult.error) {
      setError(
        `Unable to load veterinary records: ${veterinaryResult.error.message}`
      );
    } else {
      setVeterinary(
        veterinaryResult.data ?? []
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * LOAD FARMS FOR SELECTED FARMER
   * ---------------------------------------------------------
   */

  async function loadFarms(
    farmerId: string
  ) {
    setFarms([]);
    setSelectedFarm('');

    if (!farmerId) {
      return;
    }

    setLoadingFarms(true);
    setError('');

    const { data, error } =
      await supabase
        .from('farms')
        .select(
          `
          id,
          farm_name,
          farm_type,
          shed_capacity,
          status
        `
        )
        .eq('farmer_id', farmerId)
        .eq('status', 'ACTIVE')
        .order('created_at', {
          ascending: true,
        });

    setLoadingFarms(false);

    if (error) {
      setError(
        `Unable to load farms: ${error.message}`
      );
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

      await Promise.all([
        loadUserRole(),
        loadFarmers(),
        loadBatches(),
        loadOperationalData(),
      ]);

      setLoading(false);
    }

    loadInitialData();
  }, []);

  /*
   * ---------------------------------------------------------
   * LOAD FARMS WHEN FARMER CHANGES
   * ---------------------------------------------------------
   */

  useEffect(() => {
    loadFarms(selectedFarmer);
  }, [selectedFarmer]);

  /*
   * ---------------------------------------------------------
   * SAVE BIRD BATCH
   * ---------------------------------------------------------
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError('');
    setMessage('');

    if (!canCreateBatch) {
      setError(
        'You do not have permission to create a bird batch.'
      );
      return;
    }

    if (!selectedFarmer) {
      setError(
        'Please select a farmer.'
      );
      return;
    }

    if (!selectedFarm) {
      setError(
        'Please select a farm.'
      );
      return;
    }

    if (!breed) {
      setError(
        'Please select a breed.'
      );
      return;
    }

    if (!placementDate) {
      setError(
        'Please select the placement date.'
      );
      return;
    }

    const initial =
      Number(initialQuantity);

    const current =
      Number(currentQuantity);

    const mortality =
      Number(mortalityQuantity);

    if (
      !Number.isInteger(initial) ||
      initial <= 0
    ) {
      setError(
        'Initial quantity must be a whole number greater than 0.'
      );
      return;
    }

    if (
      !Number.isInteger(current) ||
      current < 0
    ) {
      setError(
        'Current quantity must be 0 or greater.'
      );
      return;
    }

    if (
      !Number.isInteger(mortality) ||
      mortality < 0
    ) {
      setError(
        'Mortality must be 0 or greater.'
      );
      return;
    }

    if (
      current + mortality >
      initial
    ) {
      setError(
        'Current quantity plus mortality cannot exceed initial quantity.'
      );
      return;
    }

    setSaving(true);

    /*
     * IMPORTANT:
     *
     * batch_code is intentionally NOT included here.
     *
     * Supabase/PostgreSQL generates it automatically
     * through the bird_batches BEFORE INSERT trigger.
     */

    const {
      data: createdBatch,
      error: insertError,
    } = await supabase
      .from('bird_batches')
      .insert({
        farmer_id:
          selectedFarmer,

        farm_id:
          selectedFarm,

        breed,

        bird_type:
          birdType || null,

        placement_date:
          placementDate,

        initial_quantity:
          initial,

        current_quantity:
          current,

        mortality_quantity:
          mortality,

        source:
          source.trim() || null,

        status,
      })
      .select(
        'id, batch_code'
      )
      .single();

    setSaving(false);

    if (insertError) {
      setError(
        `Unable to save bird batch: ${insertError.message}`
      );
      return;
    }

    const generatedBatchCode =
      createdBatch?.batch_code ||
      'Auto-generated batch';

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
      loadOperationalData(),
    ]);
  }

  /*
   * ---------------------------------------------------------
   * FARMER NAME HELPER
   * ---------------------------------------------------------
   */

  function getFarmerName(
    farmerId: string
  ) {
    const farmer =
      farmers.find(
        (item) =>
          item.id === farmerId
      );

    return farmer
      ? `${farmer.farmer_id} — ${farmer.full_name}`
      : farmerId;
  }

  /*
   * ---------------------------------------------------------
   * FARM NAME HELPER
   * ---------------------------------------------------------
   */

  function getFarmName(
    farmId: string | null
  ) {
    if (!farmId) {
      return '—';
    }

    const farm =
      allFarms.find(
        (item) =>
          item.id === farmId
      );

    return (
      farm?.farm_name ||
      'Unnamed Farm'
    );
  }

  /*
   * ---------------------------------------------------------
   * TOTALS
   * ---------------------------------------------------------
   */

  const totalInitialBirds =
    batches.reduce(
      (sum, batch) =>
        sum +
        Number(
          batch.initial_quantity || 0
        ),
      0
    );

  const totalCurrentBirds =
    batches.reduce(
      (sum, batch) =>
        sum +
        Number(
          batch.current_quantity || 0
        ),
      0
    );

  const totalMortality =
    batches.reduce(
      (sum, batch) =>
        sum +
        Number(
          batch.mortality_quantity || 0
        ),
      0
    );

  const totalFarms =
    allFarms.length;

  const totalEggs =
    eggs.reduce(
      (sum, record) =>
        sum +
        Number(
          record.total_eggs || 0
        ),
      0
    );

  const totalSaleableEggs =
    eggs.reduce(
      (sum, record) =>
        sum +
        Number(
          record.saleable_eggs || 0
        ),
      0
    );

  const totalFeedKg =
    feeds.reduce(
      (sum, record) =>
        sum +
        Number(
          record.quantity_kg || 0
        ),
      0
    );

  const totalFeedCost =
    feeds.reduce(
      (sum, record) =>
        sum +
        Number(
          record.total_cost || 0
        ),
      0
    );

  const totalVeterinaryRecords =
    veterinary.length;

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
            <p className="text-slate-600">
              Loading BodhiFarm...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * PAGE
   * ---------------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-slate-50">

      {/* PAGE TITLE */}

      <div className="mx-auto max-w-7xl px-6 pt-8">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>

            <h1 className="text-3xl font-bold text-slate-900">
              BodhiFarm Operations Center
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage farmers, farms, bird batches,
              production, feed, veterinary records
              and flock performance.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">

              {role && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {getRoleLabel(role)}
                </span>
              )}

              {userName && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {userName}
                </span>
              )}

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Supabase Connected
              </span>

            </div>

          </div>

          <a
            href="/dashboard"
            className="inline-flex w-fit rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-200"
          >
            ← Dashboard
          </a>

        </div>

      </div>

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* OVERVIEW */}

        <div className="mb-8">

          <div className="mb-5">

            <h2 className="text-2xl font-bold text-slate-900">
              BodhiFarm Operations Center
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Live overview of farmers, farms, birds,
              eggs, feed and veterinary operations.
            </p>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Farmers
              </p>

              <p className="mt-2 text-3xl font-bold text-emerald-700">
                {farmers.length.toLocaleString(
                  'en-IN'
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Active farmers
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Farms
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-700">
                {totalFarms.toLocaleString(
                  'en-IN'
                )}
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
                {totalCurrentBirds.toLocaleString(
                  'en-IN'
                )}
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
                {totalMortality.toLocaleString(
                  'en-IN'
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Total recorded
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Total Eggs
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-600">
                {totalEggs.toLocaleString(
                  'en-IN'
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Production records
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Saleable Eggs
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {totalSaleableEggs.toLocaleString(
                  'en-IN'
                )}
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
                {totalFeedCost.toLocaleString(
                  'en-IN',
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Recorded feed cost
              </p>
            </div>

          </div>

        </div>

        {/* ACCESS STATUS */}

        <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="font-bold text-emerald-900">
                BodhiFarm Access
              </p>

              <p className="mt-1 text-sm text-emerald-800">

                {canCreateBatch
                  ? 'Batch creation is enabled for your role.'
                  : 'You have read-only access to the available BodhiFarm information.'}

              </p>

            </div>

            <span className="w-fit rounded-full bg-white px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm">
              {canCreateBatch
                ? 'Batch Creation Enabled'
                : 'Read Only'}
            </span>

          </div>

        </div>

        {/* MODULES */}

        <div className="mb-8">

          <div className="mb-5">

            <h2 className="text-xl font-bold text-slate-900">
              BodhiFarm Modules
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Access operational modules from one place.
            </p>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {canManageFarmers && (
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
            )}

            <a
              href="/bodhifarm/farms"
              className="rounded-xl border bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <p className="font-bold text-slate-900">
                Farm Management
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Register farms and assign bird batches.
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

            {canSeeVeterinary && (
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
            )}

            {canSeeReports && (
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
            )}

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

            {canSeeReports && (
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
            )}

          </div>

        </div>

        {/* SUMMARY */}

        <div className="grid gap-5 md:grid-cols-4">

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Total Batches
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {batches.length}
            </p>

          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Initial Birds
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {totalInitialBirds.toLocaleString(
                'en-IN'
              )}
            </p>

          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Current Birds
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {totalCurrentBirds.toLocaleString(
                'en-IN'
              )}
            </p>

          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Mortality
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {totalMortality.toLocaleString(
                'en-IN'
              )}
            </p>

          </div>

        </div>

        {/* MESSAGES */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {/* ADD BATCH */}

        {canCreateBatch && (
          <div className="mt-8 rounded-2xl border bg-white shadow-sm">

            <div className="border-b px-6 py-5">

              <h2 className="text-xl font-bold text-slate-900">
                Add Bird Batch
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Register a new poultry batch under a farmer
                and farm.
              </p>

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
                      setSelectedFarmer(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600"
                    required
                  >

                    <option value="">
                      Select farmer
                    </option>

                    {farmers.map(
                      (farmer) => (
                        <option
                          key={farmer.id}
                          value={farmer.id}
                        >
                          {farmer.farmer_id} —{' '}
                          {farmer.full_name}
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Farm *
                  </label>

                  <select
                    value={selectedFarm}
                    onChange={(event) =>
                      setSelectedFarm(
                        event.target.value
                      )
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
                        : !selectedFarmer
                          ? 'Select farmer first'
                          : farms.length === 0
                            ? 'No active farm found'
                            : 'Select farm'}

                    </option>

                    {farms.map(
                      (farm) => (
                        <option
                          key={farm.id}
                          value={farm.id}
                        >
                          {farm.farm_name ||
                            'Unnamed Farm'}

                          {farm.farm_type
                            ? ` — ${farm.farm_type}`
                            : ''}

                          {farm.shed_capacity
                            ? ` — Capacity ${farm.shed_capacity}`
                            : ''}
                        </option>
                      )
                    )}

                  </select>

                  {selectedFarmer &&
                    !loadingFarms &&
                    farms.length === 0 && (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        No active farm is registered
                        for this farmer. Please register
                        a farm first.
                      </div>
                    )}

                </div>

              </div>

              {/* AUTOMATIC BATCH CODE */}

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

                  <div>

                    <p className="font-bold text-emerald-900">
                      Batch Code
                    </p>

                    <p className="mt-1 text-sm text-emerald-800">
                      Batch code will be generated
                      automatically by Supabase after
                      saving the batch.
                    </p>

                  </div>

                  <span className="w-fit rounded-full bg-white px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm">
                    AUTO GENERATED
                  </span>

                </div>

                <div className="mt-3 rounded-lg bg-white px-4 py-3 font-mono text-sm text-slate-700">

                  Example:
                  <span className="ml-2 font-bold text-emerald-700">
                    FARMER-ID-001
                  </span>

                  <span className="ml-2 text-slate-400">
                    → next batch
                  </span>

                  <span className="ml-2 font-bold text-emerald-700">
                    FARMER-ID-002
                  </span>

                </div>

              </div>

              {/* BREED */}

              <div className="grid gap-5 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Breed *
                  </label>

                  <select
                    value={breed}
                    onChange={(event) =>
                      setBreed(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600"
                    required
                  >

                    <option value="">
                      Select breed
                    </option>

                    {breeds.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Bird Type
                  </label>

                  <select
                    value={birdType}
                    onChange={(event) =>
                      setBirdType(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600"
                  >

                    <option value="">
                      Select bird type
                    </option>

                    {birdTypes.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}

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
                    setPlacementDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-600"
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
                      setInitialQuantity(
                        event.target.value
                      )
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
                      setCurrentQuantity(
                        event.target.value
                      )
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
                      setMortalityQuantity(
                        event.target.value
                      )
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
                      setSource(
                        event.target.value
                      )
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
                      setStatus(
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600"
                    required
                  >

                    {statuses.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

              {/* SUBMIT */}

              <div className="flex justify-end border-t pt-6">

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !selectedFarmer ||
                    !selectedFarm ||
                    farms.length === 0
                  }
                  className="rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving
                    ? 'Saving Batch...'
                    : 'Save Bird Batch'}

                </button>

              </div>

            </form>

          </div>
        )}

        {/* READ-ONLY MESSAGE */}

        {!canCreateBatch && (
          <div className="mt-8 rounded-2xl border bg-white p-8 text-center shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Bird Batch Management
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your current role has read-only access to
              bird batch information.
            </p>

          </div>
        )}

        {/* BATCH LIST */}

        <div className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">

          <div className="border-b px-6 py-5">

            <h2 className="text-xl font-bold text-slate-900">
              Bird Batches
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              All bird batches registered in BodhiFarm.
            </p>

          </div>

          <div className="overflow-x-auto">

            <table className="min-w-full text-sm">

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

                  <th className="px-5 py-4 text-right font-semibold text-slate-600">
                    Initial
                  </th>

                  <th className="px-5 py-4 text-right font-semibold text-slate-600">
                    Current
                  </th>

                  <th className="px-5 py-4 text-right font-semibold text-slate-600">
                    Mortality
                  </th>

                  <th className="px-5 py-4 text-left font-semibold text-slate-600">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y">

                {batches.map(
                  (batch) => (
                    <tr
                      key={batch.id}
                      className="hover:bg-slate-50"
                    >

                      <td className="px-5 py-4 font-semibold text-emerald-700">
                        {batch.batch_code}
                      </td>

                      <td className="px-5 py-4 text-slate-800">
                        {getFarmerName(
                          batch.farmer_id
                        )}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        —
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {batch.breed}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {batch.bird_type || '—'}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {Number(
                          batch.initial_quantity
                        ).toLocaleString(
                          'en-IN'
                        )}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-emerald-700">
                        {Number(
                          batch.current_quantity
                        ).toLocaleString(
                          'en-IN'
                        )}
                      </td>

                      <td className="px-5 py-4 text-right text-red-600">
                        {Number(
                          batch.mortality_quantity
                        ).toLocaleString(
                          'en-IN'
                        )}
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            batch.status ===
                            'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : batch.status ===
                                  'COMPLETED'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {batch.status}
                        </span>

                      </td>

                    </tr>
                  )
                )}

                {batches.length ===
                  0 && (
                  <tr>

                    <td
                      colSpan={9}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No bird batches have been
                      registered yet.
                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </div>

      </section>

    </main>
  );
}
