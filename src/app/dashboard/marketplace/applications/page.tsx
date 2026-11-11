
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import LogoutButton from '../../../../components/LogoutButton';

const PAGE_PATH = '/dashboard/marketplace/applications';

const ALLOWED_ROLES = [
  'SUPER_ADMIN',
  'CEO',
  'CORPORATE_ADMIN',
];

async function getAuthorizedAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role_id, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    redirect('/dashboard');
  }

  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('code, name')
    .eq('id', profile.role_id)
    .single();

  if (
    roleError ||
    !role ||
    !ALLOWED_ROLES.includes(role.code)
  ) {
    redirect('/dashboard');
  }

  return { supabase, user, profile, role };
}

async function approveApplication(formData: FormData) {
  'use server';

  const applicationId = String(
    formData.get('application_id') || ''
  );

  if (!applicationId) {
    throw new Error('Application ID is required.');
  }

  const { supabase } = await getAuthorizedAdmin();

  const { error } = await supabase.rpc(
    'approve_marketplace_seller',
    {
      p_application_id: applicationId,
    }
  );

  if (error) {
    throw new Error(`Approval failed: ${error.message}`);
  }

  revalidatePath(PAGE_PATH);
  revalidatePath('/dashboard/marketplace');
}

async function rejectApplication(formData: FormData) {
  'use server';

  const applicationId = String(
    formData.get('application_id') || ''
  );

  const rejectionReason = String(
    formData.get('rejection_reason') || ''
  ).trim();

  if (!applicationId) {
    throw new Error('Application ID is required.');
  }

  if (!rejectionReason) {
    throw new Error('Please provide a rejection reason.');
  }

  const { supabase } = await getAuthorizedAdmin();

  const { error } = await supabase.rpc(
    'reject_marketplace_seller',
    {
      p_application_id: applicationId,
      p_rejection_reason: rejectionReason,
    }
  );

  if (error) {
    throw new Error(`Rejection failed: ${error.message}`);
  }

  revalidatePath(PAGE_PATH);
  revalidatePath('/dashboard/marketplace');
}

export default async function SellerApplicationsPage() {
  const { supabase, profile, role } =
    await getAuthorizedAdmin();

  const { data: applications, error } = await supabase
    .from('marketplace_seller_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(
      `Unable to load seller applications: ${error.message}`
    );
  }

  const submittedCount =
    applications?.filter(
      (item) => item.status === 'SUBMITTED'
    ).length ?? 0;

  const approvedCount =
    applications?.filter(
      (item) => item.status === 'APPROVED'
    ).length ?? 0;

  const rejectedCount =
    applications?.filter(
      (item) => item.status === 'REJECTED'
    ).length ?? 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard/marketplace"
              className="text-sm font-medium text-green-700 hover:underline"
            >
              ← Marketplace Control Panel
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-gray-900">
              Seller Applications
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Review and process marketplace seller applications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {profile.full_name || 'Administrator'}
              </p>
              <p className="text-xs text-gray-500">
                {role.name || role.code}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Submitted
            </p>
            <p className="mt-2 text-3xl font-bold text-orange-600">
              {submittedCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Approved
            </p>
            <p className="mt-2 text-3xl font-bold text-green-700">
              {approvedCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Rejected
            </p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {rejectedCount}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              All Applications
            </h2>
          </div>

          {!applications || applications.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No seller applications found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {applications.map((application) => (
                <article
                  key={application.id}
                  className="p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {application.shop_name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-600">
                        Owner: {application.owner_name}
                      </p>

                      <p className="text-sm text-gray-600">
                        Mobile: {application.mobile || 'Not provided'}
                      </p>

                      <p className="text-sm text-gray-600">
                        Email: {application.email || 'Not provided'}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Application No: {application.application_number || 'N/A'}
                      </p>

                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(
                          application.created_at
                        ).toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        application.status === 'APPROVED'
                          ? 'bg-green-100 text-green-700'
                          : application.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {application.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
                    <p>
                      <strong>Address:</strong>{' '}
                      {application.address || 'Not provided'}
                    </p>

                    <p>
                      <strong>Business type:</strong>{' '}
                      {application.business_type || 'Not provided'}
                    </p>

                    <p>
                      <strong>PAN:</strong>{' '}
                      {application.pan_number || 'Not provided'}
                    </p>

                    <p>
                      <strong>GSTIN:</strong>{' '}
                      {application.gstin || 'Not provided'}
                    </p>
                  </div>

                  {application.status === 'SUBMITTED' && (
                    <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-end">
                      <form action={approveApplication}>
                        <input
                          type="hidden"
                          name="application_id"
                          value={application.id}
                        />

                        <button
                          type="submit"
                          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
                        >
                          Approve Application
                        </button>
                      </form>

                      <form
                        action={rejectApplication}
                        className="flex flex-1 flex-col gap-2 sm:flex-row"
                      >
                        <input
                          type="hidden"
                          name="application_id"
                          value={application.id}
                        />

                        <input
                          type="text"
                          name="rejection_reason"
                          required
                          placeholder="Enter rejection reason"
                          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />

                        <button
                          type="submit"
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </form>
                    </div>
                  )}

                  {application.status === 'REJECTED' &&
                    application.rejection_reason && (
                      <p className="mt-3 text-sm text-red-700">
                        <strong>Rejection reason:</strong>{' '}
                        {application.rejection_reason}
                      </p>
                    )}
                </article>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

