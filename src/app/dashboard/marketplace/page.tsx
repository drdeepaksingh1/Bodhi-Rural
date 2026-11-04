import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import LogoutButton from '../../../components/LogoutButton';

const PAGE_PATH = '/dashboard/marketplace/applications';

const ALLOWED_ROLES = [
  'SUPER_ADMIN',
  'CEO',
  'CORPORATE_ADMIN',
];

type Application = {
  id: string;
  application_number: string | null;
  user_id: string | null;
  shop_name: string;
  owner_name: string;
  mobile: string | null;
  email: string | null;
  address: string | null;
  pan_number: string | null;
  gstin: string | null;
  upi_id: string | null;
  business_type: string | null;
  shop_photo_url: string | null;
  status: string;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
};

async function getAuthorizedAdmin() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role_id, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || profile.is_active !== true) {
    redirect('/dashboard');
  }

  const { data: role } = await supabase
    .from('roles')
    .select('code, name')
    .eq('id', profile.role_id)
    .single();

  if (!role || !ALLOWED_ROLES.includes(role.code)) {
    redirect('/dashboard');
  }

  return {
    supabase,
    user,
    profile,
    role,
  };
}

// APPROVE SELLER APPLICATION
async function approveApplication(formData: FormData) {
  'use server';

  const applicationId = String(
    formData.get('application_id') || ''
  );

  if (!applicationId) {
    redirect(`${PAGE_PATH}?error=Invalid+application+ID`);
  }

  const {
    supabase,
    user,
    role,
  } = await getAuthorizedAdmin();

  // Explicit role check before calling the database RPC
  if (!ALLOWED_ROLES.includes(role.code)) {
    redirect('/dashboard');
  }

  const { data, error } = await supabase.rpc(
    'approve_marketplace_seller',
    {
      p_application_id: applicationId,
    }
  );

  if (error) {
    redirect(
      `${PAGE_PATH}?error=${encodeURIComponent(error.message)}`
    );
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result) {
    redirect(`${PAGE_PATH}?error=Approval+returned+no+result`);
  }

  revalidatePath(PAGE_PATH);
  revalidatePath('/dashboard/marketplace');
  revalidatePath('/dashboard/marketplace/sellers');

  redirect(
    `${PAGE_PATH}?success=${encodeURIComponent(
      `Application approved. Seller ID: ${result.seller_code}`
    )}`
  );
}

// REJECT SELLER APPLICATION
async function rejectApplication(formData: FormData) {
  'use server';

  const applicationId = String(
    formData.get('application_id') || ''
  );

  const rejectionReason = String(
    formData.get('rejection_reason') || ''
  ).trim();

  if (!applicationId) {
    redirect(`${PAGE_PATH}?error=Invalid+application+ID`);
  }

  if (!rejectionReason) {
    redirect(`${PAGE_PATH}?error=Rejection+reason+is+required`);
  }

  if (rejectionReason.length > 1000) {
    redirect(`${PAGE_PATH}?error=Rejection+reason+is+too+long`);
  }

  const {
    supabase,
    user,
    role,
  } = await getAuthorizedAdmin();

  if (!ALLOWED_ROLES.includes(role.code)) {
    redirect('/dashboard');
  }

  const { error } = await supabase.rpc(
    'reject_marketplace_seller',
    {
      p_application_id: applicationId,
      p_rejection_reason: rejectionReason,
    }
  );

  if (error) {
    redirect(
      `${PAGE_PATH}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(PAGE_PATH);

  redirect(
    `${PAGE_PATH}?success=${encodeURIComponent(
      'Seller application rejected successfully.'
    )}`
  );
}

function formatDate(value: string | null) {
  if (!value) return '—';

  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function SellerApplicationsPage({
  searchParams,
}: {
  searchParams?: {
    status?: string;
    success?: string;
    error?: string;
  };
}) {
  const {
    supabase,
    user,
    profile,
    role,
  } = await getAuthorizedAdmin();

  const selectedStatus = (
    searchParams?.status || 'ALL'
  ).toUpperCase();

  const validStatuses = [
    'ALL',
    'SUBMITTED',
    'APPROVED',
    'REJECTED',
  ];

  const filterStatus = validStatuses.includes(selectedStatus)
    ? selectedStatus
    : 'ALL';

  let query = supabase
    .from('marketplace_seller_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (filterStatus !== 'ALL') {
    query = query.eq('status', filterStatus);
  }

  const { data: applications, error: loadError } = await query;

  const rows = (applications || []) as Application[];

  const { count: pendingCount } = await supabase
    .from('marketplace_seller_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'SUBMITTED');

  const { count: approvedCount } = await supabase
    .from('marketplace_seller_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'APPROVED');

  const { count: rejectedCount } = await supabase
    .from('marketplace_seller_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'REJECTED');

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
              BodhiMart Administration
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Seller Applications
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Review, approve and reject marketplace seller applications.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/marketplace"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Marketplace
            </Link>

            <Link
              href="/dashboard"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Main Dashboard
            </Link>

            <LogoutButton />
          </div>
        </div>

        {/* ADMIN INFORMATION */}
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-900">
            <strong>Welcome:</strong>{' '}
            {profile.full_name || user.email}
          </p>

          <p className="mt-1 text-sm text-green-800">
            <strong>Role:</strong> {role.name} ({role.code})
          </p>

          <p className="mt-1 text-xs text-green-800">
            Approval access is controlled by your existing
            Supabase authorization function and Row Level Security.
          </p>
        </div>

        {/* SUCCESS MESSAGE */}
        {searchParams?.success && (
          <div className="mb-6 rounded-lg border border-green-300 bg-green-50 p-4 text-sm font-medium text-green-800">
            {searchParams.success}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {searchParams?.error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            {searchParams.error}
          </div>
        )}

        {/* DATABASE ERROR */}
        {loadError && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            Unable to load applications: {loadError.message}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <SummaryCard
            title="All Applications"
            value={
              (pendingCount || 0) +
              (approvedCount || 0) +
              (rejectedCount || 0)
            }
            color="blue"
          />

          <SummaryCard
            title="Pending Applications"
            value={pendingCount || 0}
            color="orange"
          />

          <SummaryCard
            title="Approved Applications"
            value={approvedCount || 0}
            color="green"
          />

          <SummaryCard
            title="Rejected Applications"
            value={rejectedCount || 0}
            color="red"
          />
        </div>

        {/* FILTERS */}
        <div className="mb-6 flex flex-wrap gap-2">
          {validStatuses.map((status) => (
            <Link
              key={status}
              href={
                status === 'ALL'
                  ? PAGE_PATH
                  : `${PAGE_PATH}?status=${status}`
              }
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                filterStatus === status
                  ? 'bg-green-700 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status === 'ALL' ? 'All' : status}
            </Link>
          ))}
        </div>

        {/* APPLICATION LIST */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Registered Applications
            </h2>

            <span className="text-sm text-gray-500">
              {rows.length} records loaded
            </span>
          </div>

          {rows.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                No applications found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                There are no applications in this status.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {rows.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  approveAction={approveApplication}
                  rejectAction={rejectApplication}
                />
              ))}
            </div>
          )}
        </div>

        {/* SECURITY NOTICE */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="font-semibold text-gray-900">
            Administrative Security
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Seller approvals and rejections are processed through
            existing authenticated Supabase database functions.
            The database validates administrator authorization,
            locks application records and prevents duplicate
            approval. Seller IDs are generated by the existing
            database function.
          </p>
        </div>
      </div>
    </main>
  );
}

// SUMMARY CARD
function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: 'blue' | 'orange' | 'green' | 'red';
}) {
  const styles = {
    blue: 'border-blue-200 text-blue-700',
    orange: 'border-orange-200 text-orange-700',
    green: 'border-green-200 text-green-700',
    red: 'border-red-200 text-red-700',
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">
        {title}
      </p>

      <p className={`mt-3 text-3xl font-bold ${styles[color]}`}>
        {value}
      </p>
    </div>
  );
}

// APPLICATION CARD
function ApplicationCard({
  application,
  approveAction,
  rejectAction,
}: {
  application: Application;
  approveAction: (formData: FormData) => Promise<void>;
  rejectAction: (formData: FormData) => Promise<void>;
}) {
  const statusStyles: Record<string, string> = {
    SUBMITTED: 'bg-orange-100 text-orange-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  return (
    <article className="p-5 sm:p-6">

      {/* APPLICATION HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Application Number
          </p>

          <h3 className="mt-1 text-lg font-bold text-gray-900">
            {application.application_number || 'Not assigned'}
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Submitted: {formatDate(application.created_at)}
          </p>
        </div>

        <span
          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${
            statusStyles[application.status] ||
            'bg-gray-100 text-gray-700'
          }`}
        >
          {application.status}
        </span>
      </div>

      {/* BUSINESS INFORMATION */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <InfoItem
          label="Business / Shop Name"
          value={application.shop_name}
        />

        <InfoItem
          label="Owner Name"
          value={application.owner_name}
        />

        <InfoItem
          label="Mobile"
          value={application.mobile}
        />

        <InfoItem
          label="Email"
          value={application.email}
        />

        <InfoItem
          label="Business Type"
          value={application.business_type}
        />

        <InfoItem
          label="PAN Number"
          value={application.pan_number}
        />

        <InfoItem
          label="GSTIN"
          value={application.gstin}
        />

        <InfoItem
          label="UPI ID"
          value={application.upi_id}
        />

        <InfoItem
          label="Address"
          value={application.address}
        />
      </div>

      {/* SHOP IMAGE */}
      {application.shop_photo_url && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-gray-700">
            Shop Photograph
          </p>

          <a
            href={application.shop_photo_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-blue-700 underline"
          >
            View uploaded photograph
          </a>
        </div>
      )}

      {/* APPROVED INFORMATION */}
      {application.status === 'APPROVED' && (
        <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800">
            Application approved
          </p>

          <p className="mt-1 text-sm text-green-700">
            Approval date: {formatDate(application.approved_at)}
          </p>

          <p className="mt-1 text-xs text-green-700">
            Approving administrator ID:{' '}
            {application.approved_by || 'Not recorded'}
          </p>
        </div>
      )}

      {/* REJECTION INFORMATION */}
      {application.status === 'REJECTED' && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            Rejection reason
          </p>

          <p className="mt-1 text-sm text-red-700">
            {application.rejection_reason || 'No reason recorded'}
          </p>
        </div>
      )}

      {/* APPROVAL AND REJECTION ACTIONS */}
      {application.status === 'SUBMITTED' && (
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-200 pt-5 lg:grid-cols-2">

          {/* APPROVE FORM */}
          <form
            action={approveAction}
            className="rounded-lg border border-green-200 bg-green-50 p-4"
          >
            <input
              type="hidden"
              name="application_id"
              value={application.id}
            />

            <h4 className="font-semibold text-green-900">
              Approve Application
            </h4>

            <p className="mt-1 text-xs leading-5 text-green-800">
              Approval creates an ACTIVE seller record and
              generates a unique BodhiMart seller ID.
            </p>

            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
              formAction={approveAction}
            >
              Approve Seller
            </button>
          </form>

          {/* REJECT FORM */}
          <form
            action={rejectAction}
            className="rounded-lg border border-red-200 bg-red-50 p-4"
          >
            <input
              type="hidden"
              name="application_id"
              value={application.id}
            />

            <h4 className="font-semibold text-red-900">
              Reject Application
            </h4>

            <label
              htmlFor={`reason-${application.id}`}
              className="mt-3 block text-sm font-medium text-red-900"
            >
              Rejection reason *
            </label>

            <textarea
              id={`reason-${application.id}`}
              name="rejection_reason"
              required
              maxLength={1000}
              rows={3}
              placeholder="Enter the reason for rejection..."
              className="mt-2 w-full rounded-lg border border-red-200 bg-white p-3 text-sm text-gray-900 outline-none focus:border-red-500"
            />

            <button
              type="submit"
              className="mt-3 w-full rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800"
            >
              Reject Application
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

// INFORMATION ITEM
function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-gray-900">
        {value || '—'}
      </p>
    </div>
  );
}
