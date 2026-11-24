'use client';

import { FormEvent, Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

function BuyerRegistrationForm() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function getSafeRedirectPath() {
    const requestedPath = searchParams.get('redirect');
    if (!requestedPath) return '/bodhimart/products';

    try {
      const parsed = new URL(requestedPath, window.location.origin);
      if (
        parsed.origin !== window.location.origin ||
        !parsed.pathname.startsWith('/bodhimart/') ||
        parsed.pathname.startsWith('/bodhimart/seller/')
      ) {
        return '/bodhimart/products';
      }
      return parsed.pathname + parsed.search + parsed.hash;
    } catch {
      return '/bodhimart/products';
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const destination = getSafeRedirectPath();
      const callback = new URL('/auth/callback', window.location.origin);
      callback.searchParams.set('next', destination);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { emailRedirectTo: callback.toString() },
      });

      if (signUpError) throw signUpError;
      if (data.session) {
        window.location.assign(destination);
        return;
      }

      setMessage('Your account is ready for email confirmation. Open the confirmation email to finish signing in and continue shopping.');
      setPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to create your account. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const redirect = getSafeRedirectPath();
  const loginHref = `/login?account=buyer&redirect=${encodeURIComponent(redirect)}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f2] px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-[#e3e8df] bg-white p-7 shadow-sm sm:p-9">
        <Link href="/bodhimart" className="text-sm font-semibold text-[#27623b] hover:underline">
          ← Back to BodhiMart
        </Link>
        <div className="mt-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8a6f]">BodhiMart shopping</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#203d2c]">Create buyer account</h1>
          <p className="mt-3 text-sm leading-6 text-[#69766d]">Use your email to shop, save products and follow your orders.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="buyer-email" className="mb-2 block text-sm font-medium text-gray-700">Email address</label>
            <input id="buyer-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" required disabled={submitting} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100" />
          </div>
          <div>
            <label htmlFor="buyer-password" className="mb-2 block text-sm font-medium text-gray-700">Password</label>
            <input id="buyer-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required disabled={submitting} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100" />
          </div>
          <div>
            <label htmlFor="buyer-confirm-password" className="mb-2 block text-sm font-medium text-gray-700">Confirm password</label>
            <input id="buyer-confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter your password again" autoComplete="new-password" required disabled={submitting} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100" />
          </div>

          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {message && <p role="status" aria-live="polite" className="rounded-xl bg-green-50 p-3 text-sm leading-6 text-green-900">{message}</p>}

          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-[#173f2b] px-4 py-3 font-semibold text-white transition hover:bg-[#20563a] disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <Link href={loginHref} className="font-semibold text-green-800 underline">Buyer login</Link>
        </p>
        <p className="mt-5 border-t border-gray-200 pt-4 text-center text-xs leading-5 text-gray-500">Buyer registration does not activate seller tools. Sellers must apply separately and receive BodhiMart admin approval.</p>
      </section>
    </main>
  );
}

export default function BuyerRegistrationPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#f5f7f2] text-gray-600">Loading registration…</main>}>
      <BuyerRegistrationForm />
    </Suspense>
  );
}
