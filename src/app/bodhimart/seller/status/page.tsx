'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';

type Application = {
  id: string;
  application_number: string | null;
  shop_name: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

const statusDetails: Record<string, { title: string; message: string; tone: string }> = {
  SUBMITTED: {
    title: 'Application received',
    message: 'Your application is in the queue. We will review the details and update this page.',
    tone: 'submitted',
  },
  UNDER_REVIEW: {
    title: 'Under review',
    message: 'The BodhiMart team is reviewing your shop details. Please check back for an update.',
    tone: 'review',
  },
  APPROVED: {
    title: 'Application approved',
    message: 'Your seller application is approved. Open your seller dashboard to get started.',
    tone: 'approved',
  },
  REJECTED: {
    title: 'Changes needed',
    message: 'The team could not approve this application yet. Review the note below and contact support if you need help.',
    tone: 'rejected',
  },
  SUSPENDED: {
    title: 'Application paused',
    message: 'This seller application is currently paused. Contact BodhiMart support for assistance.',
    tone: 'rejected',
  },
};

export default function SellerApplicationStatusPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadApplication = useCallback(async (isRefresh = false) => {
    setError('');
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) {
        router.replace('/login?account=seller&redirect=%2Fbodhimart%2Fseller%2Fstatus');
        return;
      }

      const { data, error: applicationError } = await supabase
        .from('marketplace_seller_applications')
        .select('id, application_number, shop_name, status, rejection_reason, created_at, updated_at')
        .eq('user_id', authData.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (applicationError) throw applicationError;
      setApplication(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load your application status.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  const state = application ? statusDetails[application.status] : null;

  return (
    <main className="min-h-[70vh] bg-[#f5f8f5] px-4 py-12 sm:px-6">
      <section className="mx-auto max-w-2xl">
        <Link href="/bodhimart" className="text-sm font-semibold text-[#145c2b] hover:underline">
          ← Back to BodhiMart
        </Link>
        <div className="mt-7 rounded-3xl border border-[#e1e9e2] bg-white p-6 shadow-sm sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b8a70]">Seller onboarding</p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-[#173d24]">Application status</h1>
              <p className="mt-2 text-sm leading-6 text-[#68756b]">Track the latest review of your BodhiMart seller application.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadApplication(true)}
              disabled={loading || refreshing}
              className="rounded-xl border border-[#d8e3da] px-4 py-2.5 text-sm font-bold text-[#145c2b] disabled:opacity-60"
            >
              {refreshing ? 'Checking…' : 'Check for updates'}
            </button>
          </div>

          {loading ? (
            <div className="mt-8 rounded-2xl bg-[#f5f8f5] p-6 text-sm text-[#68756b]" role="status">
              Loading your application…
            </div>
          ) : error ? (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800" role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => void loadApplication()} className="mt-3 font-bold underline">
                Try again
              </button>
            </div>
          ) : !application ? (
            <div className="mt-8 rounded-2xl bg-[#f5f8f5] p-6">
              <h2 className="text-lg font-semibold text-[#173d24]">No application found</h2>
              <p className="mt-2 text-sm leading-6 text-[#68756b]">Start your seller application to list products on BodhiMart.</p>
              <Link href="/bodhimart/seller/register" className="mt-5 inline-flex rounded-xl bg-[#145c2b] px-5 py-3 text-sm font-bold text-white">
                Apply to sell
              </Link>
            </div>
          ) : (
            <div className="mt-8">
              <div className={`rounded-2xl border p-6 ${
                state?.tone === 'approved' ? 'border-green-200 bg-green-50' :
                state?.tone === 'rejected' ? 'border-amber-200 bg-amber-50' :
                'border-[#dce8dc] bg-[#f5f8f5]'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg" aria-hidden="true">
                    {state?.tone === 'approved' ? '✓' : state?.tone === 'rejected' ? '!' : '•'}
                  </span>
                  <h2 className="text-xl font-semibold text-[#173d24]">{state?.title || 'Application received'}</h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#526257]">{state?.message || 'Your application status is being updated.'}</p>
                {application.status === 'REJECTED' && application.rejection_reason && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4">
                    <h3 className="text-sm font-bold text-[#5f4810]">Review note</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#665b3d]">{application.rejection_reason}</p>
                  </div>
                )}
              </div>

              <dl className="mt-6 grid gap-4 rounded-2xl border border-[#e6ebe6] p-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#7a857c]">Shop</dt>
                  <dd className="mt-1 font-semibold text-[#263e2c]">{application.shop_name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#7a857c]">Application number</dt>
                  <dd className="mt-1 font-semibold text-[#263e2c]">{application.application_number || 'Pending'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#7a857c]">Submitted</dt>
                  <dd className="mt-1 text-sm text-[#526257]">{new Date(application.created_at).toLocaleDateString('en-IN')}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#7a857c]">Last updated</dt>
                  <dd className="mt-1 text-sm text-[#526257]">{new Date(application.updated_at).toLocaleDateString('en-IN')}</dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                {application.status === 'APPROVED' && (
                  <Link href="/bodhimart/seller/dashboard" className="rounded-xl bg-[#145c2b] px-5 py-3 text-sm font-bold text-white">
                    Open seller dashboard
                  </Link>
                )}
                <Link href="/bodhimart" className="rounded-xl border border-[#d8e3da] px-5 py-3 text-sm font-bold text-[#145c2b]">
                  Return to BodhiMart
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
