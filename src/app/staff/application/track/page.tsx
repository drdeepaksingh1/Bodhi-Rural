'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';

type ApplicationStatus = {
  application_number: string;
  proposed_designation: string | null;
  proposed_department: string | null;
  status: string;
  current_stage: string | null;
  submitted_at: string | null;
  updated_at: string;
};

function TrackingForm() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [trackingId, setTrackingId] = useState(searchParams.get('trackingId') || '');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [application, setApplication] = useState<ApplicationStatus | null>(null);

  async function findApplication(userId: string) {
    const { data, error: lookupError } = await supabase
      .from('staff_applications')
      .select('application_number, proposed_designation, proposed_department, status, current_stage, submitted_at, updated_at')
      .eq('user_id', userId)
      .eq('application_number', trackingId.trim())
      .maybeSingle();

    if (lookupError) throw new Error(lookupError.message);
    if (!data) {
      setApplication(null);
      setError('We could not match that tracking ID with this verified email. Check both and try again.');
      return;
    }

    setError('');
    setApplication(data as ApplicationStatus);
  }

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    setApplication(null);

    if (!trackingId.trim()) {
      setError('Enter your application tracking ID.');
      return;
    }

    setLoading(true);
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    });
    if (sendError) setError(sendError.message);
    else {
      setCodeSent(true);
      setNotice('A verification code has been sent to your registered email address.');
    }
    setLoading(false);
  }

  async function verifyAndTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    const cleanedOtp = otp.replace(/\D/g, '');
    if (!/^\d{8}$/.test(cleanedOtp)) {
      setError('Enter the 8-digit verification code from your email.');
      return;
    }

    setLoading(true);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: cleanedOtp,
      type: 'email',
    });
    if (verifyError || !data.user) {
      setError(verifyError?.message || 'Email verification could not be completed.');
      setLoading(false);
      return;
    }

    try {
      await findApplication(data.user.id);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'Unable to load your application status.');
    } finally {
      setLoading(false);
    }
  }

  async function refreshStatus() {
    setLoading(true);
    setError('');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setApplication(null);
      setError('Verify your email again to view this application.');
      setLoading(false);
      return;
    }
    try {
      await findApplication(user.id);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'Unable to refresh your application status.');
    } finally {
      setLoading(false);
    }
  }

  const status = application?.status.toUpperCase() || '';
  const stage = application?.current_stage?.toUpperCase() || '';
  const rejected = status === 'REJECTED' || status.endsWith('_REJECTED');
  const terminal = status === 'APPROVED' || rejected;
  const currentStep = status === 'APPROVED' ? 3 : stage.includes('CEO') ? 1 : stage.includes('CHAIRMAN') || stage.includes('MD') ? 2 : 0;
  const statusLabel = status === 'APPROVED'
    ? 'Approved'
    : rejected
      ? 'Application closed'
      : stage.includes('CEO')
        ? 'CEO review'
        : stage.includes('CHAIRMAN') || stage.includes('MD')
          ? 'Final review'
          : 'HR review';

  return (
    <main className="min-h-[70vh] bg-[#f7f7f2] px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/careers" className="text-sm font-semibold text-emerald-800 underline underline-offset-4">← Careers</Link>
        <header className="mt-5 rounded-3xl bg-emerald-950 p-7 text-white sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[.17em] text-emerald-200">Candidate portal</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Track your application</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-100">Enter your tracking ID and verify the email address used on your application. Only the verified applicant can view its progress.</p>
        </header>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <form onSubmit={codeSent ? verifyAndTrack : sendCode} className="space-y-5">
            <label className="block text-sm font-semibold text-slate-700">Application tracking ID
              <input required value={trackingId} onChange={(event) => setTrackingId(event.target.value)} placeholder="Enter the ID shown after submission" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">Registered email address
              <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={codeSent} placeholder="name@example.com" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100" />
            </label>
            {codeSent && <label className="block text-sm font-semibold text-slate-700">8-digit verification code
              <input required inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="Enter the code from your email" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 font-normal outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
            </label>}
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-emerald-800 px-4 py-3 font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
              {loading ? 'Please wait…' : codeSent ? 'Verify email and track' : 'Send verification code'}
            </button>
            {codeSent && <button type="button" onClick={() => { setCodeSent(false); setOtp(''); setNotice(''); setError(''); }} className="w-full text-sm font-semibold text-emerald-800 underline underline-offset-4">Use a different email address</button>}
          </form>
        </section>

        {application && <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Application tracking ID</p>
              <p className="mt-1 text-2xl font-bold tracking-wide text-slate-900">{application.application_number}</p>
              <p className="mt-2 text-sm text-slate-600">{[application.proposed_designation, application.proposed_department].filter(Boolean).join(' · ') || 'Staff application'}</p>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : rejected ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-900'}`}>{statusLabel}</span>
          </div>
          <div className="p-6">
            <h2 className="font-bold text-slate-900">Review progress</h2>
            {rejected ? <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">This application has been closed. For assistance, contact Bodhi Rural and quote your tracking ID.</p> : <ol className="mt-5 grid gap-3 sm:grid-cols-3">
              {['HR review', 'CEO review', 'Final review'].map((label, index) => {
                const complete = terminal || index < currentStep;
                const active = !terminal && index === currentStep;
                return <li key={label} className={`rounded-xl border p-4 ${active ? 'border-amber-300 bg-amber-50' : complete ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                  <p className={`text-xs font-bold uppercase tracking-wide ${active ? 'text-amber-800' : complete ? 'text-emerald-800' : 'text-slate-500'}`}>{complete ? 'Complete' : active ? 'In progress' : 'Upcoming'}</p>
                  <p className="mt-2 font-semibold text-slate-900">{label}</p>
                </li>;
              })}
            </ol>}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500">
              <span>Last updated: {new Date(application.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <button type="button" onClick={() => void refreshStatus()} disabled={loading} className="font-bold text-emerald-800 underline underline-offset-4 disabled:opacity-50">{loading ? 'Refreshing…' : 'Refresh status'}</button>
            </div>
          </div>
        </section>}
      </div>
    </main>
  );
}

export default function TrackApplicationPage() {
  return <Suspense fallback={<main className="min-h-[70vh] bg-[#f7f7f2] px-4 py-16 text-center text-slate-600">Loading application tracking…</main>}><TrackingForm /></Suspense>;
}
