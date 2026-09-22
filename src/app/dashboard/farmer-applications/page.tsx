import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase/server';

type PageProps = {
  searchParams?: {
    status?: string;
    search?: string;
  };
};

const MANAGEMENT_ROLES = [
  'SUPER_ADMIN',
  'CEO',
  'CORPORATE_ADMIN',
  'STATE_MANAGER',
  'DISTRICT_MANAGER',
  'BLOCK_MANAGER',
  'CLUSTER_SUPERVISOR',
];

async function approveApplication(formData: FormData) {
  'use server';

  const applicationId = String(formData.get('application_id') || '');

  if (!applicationId) {
    throw new Error('Application ID is required');
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('farmer_applications')
    .update({
      status: 'APPROVED',
    })
    .eq('id', applicationId)
    .eq('status', 'PENDING');

  if (error) {
    throw new Error(error.message);
  }

  redirect('/dashboard/farmer-applications?status=PENDING');
}

async function rejectApplication(formData: FormData) {
  'use server';

  const applicationId = String(formData.get('application_id') || '');
  const rejectionReason = String(
    formData.get('rejection_reason') || ''
  ).trim();

  if (!applicationId) {
    throw new Error('Application ID is required');
  }

  if (!rejectionReason) {
    throw new Error('Rejection reason is required');
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('farmer_applications')
    .update({
      status: 'REJECTED',
      rejection_reason: rejectionReason,
    })
    .eq('id', applicationId)
    .eq('status', 'PENDING');

  if (error) {
    throw new Error(error.message);
  }

  redirect('/dashboard/farmer-applications?status=PENDING');
}

export default async function FarmerApplicationsPage({
  searchParams,
}: PageProps) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify management role
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      role_id,
      is_active,
      roles (
        code,
        name
      )
    `)
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  const roleData = Array.isArray(profile?.roles)
    ? profile.roles[0]
    : profile?.roles;

  const roleCode = roleData?.code;

  if (!roleCode || !MANAGEMENT_ROLES.includes(roleCode)) {
    redirect('/dashboard');
  }

  const selectedStatus =
    searchParams?.status &&
    ['PENDING', 'APPROVED', 'REJECTED'].includes(searchParams.status)
      ? searchParams.status
      : 'PENDING';

  const search = (searchParams?.search || '').trim();

  let query = supabase
    .from('farmer_applications')
    .select(`
      id,
      full_name,
      father_husband_name,
      mobile,
      alternate_mobile,
      date_of_birth,
      gender,
      state_id,
      district_id,
      block_id,
      panchayat_id,
      village_id,
      address,
      farm_name,
      farm_type,
      land_area,
      shed_available,
      shed_capacity,
      bank_name,
      bank_branch,
      bank_account_name,
      bank_account_number,
      ifsc_code,
      farmer_photo_url,
      aadhaar_document_url,
      bank_passbook_url,
      status,
      farmer_id,
      approved_by,
      approved_at,
      rejection_reason,
      created_at
    `)
    .eq('status', selectedStatus)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,mobile.ilike.%${search}%`
    );
  }

  const { data: applications, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // Load location names
  const locationIds = Array.from(
    new Set(
      (applications || [])
        .flatMap((application) => [
          application.state_id,
          application.district_id,
          application.block_id,
          application.panchayat_id,
          application.village_id,
        ])
        .filter(Boolean)
    )
  );

  let locations: Record<
    string,
    { name: string; code: string | null }
  > = {};

  if (locationIds.length > 0) {
    const { data: locationRows } = await supabase
      .from('locations')
      .select('id, name, code')
      .in('id', locationIds);

    locations = Object.fromEntries(
      (locationRows || []).map((location) => [
        location.id,
        {
          name: location.name,
          code: location.code,
        },
      ])
    );
  }

  // Counts
  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    supabase
      .from('farmer_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING'),

    supabase
      .from('farmer_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'APPROVED'),

    supabase
      .from('farmer_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'REJECTED'),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <a
              href="/dashboard"
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to Dashboard
            </a>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Farmer Applications
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Review and manage farmer registration applications.
            </p>
          </div>

          <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
            <div className="text-xs text-slate-500">
              Logged in as
            </div>
            <div className="font-semibold text-slate-900">
              {profile?.full_name || user.email}
            </div>
          </div>
        </div>

        {/* Status cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          <a
            href="/dashboard/farmer-applications?status=PENDING"
            className={`rounded-xl border bg-white p-5 shadow-sm ${
              selectedStatus === 'PENDING'
                ? 'border-orange-400 ring-2 ring-orange-100'
                : 'border-slate-200'
            }`}
          >
            <div className="text-sm text-slate-500">
              Pending
            </div>
            <div className="mt-1 text-3xl font-bold text-orange-600">
              {pendingCount ?? 0}
            </div>
          </a>

          <a
            href="/dashboard/farmer-applications?status=APPROVED"
            className={`rounded-xl border bg-white p-5 shadow-sm ${
              selectedStatus === 'APPROVED'
                ? 'border-green-400 ring-2 ring-green-100'
                : 'border-slate-200'
            }`}
          >
            <div className="text-sm text-slate-500">
              Approved
            </div>
            <div className="mt-1 text-3xl font-bold text-green-600">
              {approvedCount ?? 0}
            </div>
          </a>

          <a
            href="/dashboard/farmer-applications?status=REJECTED"
            className={`rounded-xl border bg-white p-5 shadow-sm ${
              selectedStatus === 'REJECTED'
                ? 'border-red-400 ring-2 ring-red-100'
                : 'border-slate-200'
            }`}
          >
            <div className="text-sm text-slate-500">
              Rejected
            </div>
            <div className="mt-1 text-3xl font-bold text-red-600">
              {rejectedCount ?? 0}
            </div>
          </a>
        </div>

        {/* Search */}
        <form
          method="GET"
          className="mb-6 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm md:flex-row"
        >
          <input
            type="hidden"
            name="status"
            value={selectedStatus}
          />

          <input
            name="search"
            defaultValue={search}
            placeholder="Search by farmer name or mobile..."
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700"
          >
            Search
          </button>

          <a
            href={`/dashboard/farmer-applications?status=${selectedStatus}`}
            className="rounded-lg border border-slate-300 px-6 py-2.5 text-center font-semibold text-slate-700 hover:bg-slate-50"
          >
            Clear
          </a>
        </form>

        {/* Applications */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">
              {selectedStatus} Applications
            </h2>
          </div>

          {(applications || []).length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No {selectedStatus.toLowerCase()} applications found.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {(applications || []).map((application) => {
                const state = locations[application.state_id];
                const district = locations[application.district_id];
                const block = locations[application.block_id];
                const panchayat = locations[application.panchayat_id];
                const village = locations[application.village_id];

                return (
                  <div
                    key={application.id}
                    className="p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                      {/* Applicant */}
                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold text-slate-900">
                            {application.full_name}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              application.status === 'PENDING'
                                ? 'bg-orange-100 text-orange-700'
                                : application.status === 'APPROVED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {application.status}
                          </span>
                        </div>

                        <div className="mt-2 grid gap-2 text-sm text-slate-600 md:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <span className="font-medium">
                              Mobile:
                            </span>{' '}
                            {application.mobile}
                          </div>

                          <div>
                            <span className="font-medium">
                              Father/Husband:
                            </span>{' '}
                            {application.father_husband_name || '—'}
                          </div>

                          <div>
                            <span className="font-medium">
                              Gender:
                            </span>{' '}
                            {application.gender || '—'}
                          </div>

                          <div>
                            <span className="font-medium">
                              State:
                            </span>{' '}
                            {state?.name || '—'}
                          </div>

                          <div>
                            <span className="font-medium">
                              District:
                            </span>{' '}
                            {district?.name || '—'}
                          </div>

                          <div>
                            <span className="font-medium">
                              Block:
                            </span>{' '}
                            {block?.name || '—'}
                          </div>

                          <div>
                            <span className="font-medium">
                              Panchayat:
                            </span>{' '}
                            {panchayat?.name || '—'}
                          </div>

                          <div>
                            <span className="font-medium">
                              Village:
                            </span>{' '}
                            {village?.name || '—'}
                          </div>

                          <div>
                            <span className="font-medium">
                              Village Code:
                            </span>{' '}
                            {village?.code || '—'}
                          </div>
                        </div>

                        <div className="mt-4 rounded-lg bg-slate-50 p-4">
                          <div className="mb-2 text-sm font-semibold text-slate-800">
                            Farm Details
                          </div>

                          <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                            <div>
                              Farm:{' '}
                              {application.farm_name || '—'}
                            </div>

                            <div>
                              Type:{' '}
                              {application.farm_type || '—'}
                            </div>

                            <div>
                              Land:{' '}
                              {application.land_area ?? '—'}
                            </div>

                            <div>
                              Shed:{' '}
                              {application.shed_available
                                ? 'Available'
                                : 'Not available'}
                            </div>

                            <div>
                              Shed Capacity:{' '}
                              {application.shed_capacity ?? '—'}
                            </div>
                          </div>
                        </div>

                        {application.status === 'APPROVED' && (
                          <div className="mt-4 rounded-lg bg-green-50 p-4">
                            <div className="text-xs font-semibold uppercase text-green-700">
                              Farmer ID
                            </div>

                            <div className="mt-1 text-xl font-bold text-green-800">
                              {application.farmer_id
                                ? 'Farmer record created'
                                : 'Pending farmer record'}
                            </div>

                            {application.approved_at && (
                              <div className="mt-1 text-xs text-green-700">
                                Approved:{' '}
                                {new Date(
                                  application.approved_at
                                ).toLocaleString('en-IN')}
                              </div>
                            )}
                          </div>
                        )}

                        {application.status === 'REJECTED' &&
                          application.rejection_reason && (
                            <div className="mt-4 rounded-lg bg-red-50 p-4">
                              <div className="text-xs font-semibold uppercase text-red-700">
                                Rejection Reason
                              </div>

                              <div className="mt-1 text-sm text-red-800">
                                {application.rejection_reason}
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Actions */}
                      {application.status === 'PENDING' && (
                        <div className="w-full shrink-0 lg:w-80">

                          <div className="rounded-xl border border-slate-200 p-4">

                            <div className="mb-4 text-sm font-semibold text-slate-800">
                              Application Actions
                            </div>

                            {/* Approve */}
                            <form action={approveApplication}>
                              <input
                                type="hidden"
                                name="application_id"
                                value={application.id}
                              />

                              <button
                                type="submit"
                                className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
                              >
                                ✓ Approve Application
                              </button>
                            </form>

                            {/* Reject */}
                            <form
                              action={rejectApplication}
                              className="mt-4"
                            >
                              <input
                                type="hidden"
                                name="application_id"
                                value={application.id}
                              />

                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Rejection Reason
                              </label>

                              <textarea
                                name="rejection_reason"
                                required
                                rows={3}
                                placeholder="Enter reason for rejection..."
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-500"
                              />

                              <button
                                type="submit"
                                className="mt-2 w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
                              >
                                ✕ Reject Application
                              </button>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-slate-500">
          Sensitive Aadhaar information is intentionally not displayed in
          this application list.
        </div>
      </div>
    </main>
  );
}
