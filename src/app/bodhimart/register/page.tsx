'use client';

import { Copy } from '../language';
import { FormEvent, Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

function BuyerRegistrationForm() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [otp, setOtp] = useState('');
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);
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

    setSubmitting(true);
    try {
      const address = email.trim().toLowerCase();
      if (step === 'email') {
        const { error } = await supabase.auth.signInWithOtp({
          email: address,
          options: { shouldCreateUser: true },
        });
        if (error) throw error;
        setStep('code');
        setMessage('Check your email for the verification code.');
        return;
      }

      if (step === 'code') {
        const { data, error } = await supabase.auth.verifyOtp({
          email: address, token: otp.trim(), type: 'email',
        });
        if (error) throw error;
        if (!data.user || !data.session) throw new Error('Email verification did not start a session. Request a new code.');
        const { data: hasPassword, error: accountError } = await supabase.rpc('bodhimart_current_account_has_password');
        if (accountError) throw new Error('Could not check your account. Sign in or try again.');
        if (hasPassword) {
          const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
          if (signOutError) throw new Error('This email is already registered. Open BodhiMart to continue.');
          setOtp('');
          setStep('email');
          setError('This email is already registered. Sign in with your existing account.');
          return;
        }
        setVerifiedUserId(data.user.id);
        setStep('password');
        return;
      }

      if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
      if (password !== confirmPassword) throw new Error('The passwords do not match.');
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user || data.user.id !== verifiedUserId) {
        throw new Error('Your verification session expired. Reload the page and verify your email again.');
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      window.location.assign(getSafeRedirectPath());
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to finish registration. Please try again.');
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
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c8a6f]"><Copy en="BodhiMart shopping" hi="BodhiMart पर खरीदारी" /></p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#203d2c]"><Copy en="Create buyer account" hi="खरीदार खाता बनाएँ" /></h1>
          <p className="mt-3 text-sm leading-6 text-[#69766d]"><Copy en="Use your email to shop, save products and follow your orders." hi="खरीदारी, उत्पाद सहेजने और ऑर्डर की स्थिति देखने के लिए अपना ईमेल इस्तेमाल करें।" /></p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="buyer-email" className="mb-2 block text-sm font-medium text-gray-700"><Copy en="Email address" hi="ईमेल पता" /></label>
            <input id="buyer-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" required disabled={submitting || step !== 'email'} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100" />
          </div>
          {step === 'code' && (
            <div>
              <label htmlFor="buyer-otp"><Copy en="Email verification code" hi="ईमेल सत्यापन कोड" /></label>
              <input id="buyer-otp" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,8}" maxLength={8}
                required className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3" />
              <button type="button" disabled={submitting} className="mt-3 text-sm text-green-800 underline"
                onClick={() => { setStep('email'); setOtp(''); setMessage(''); setError(''); }}>
                <Copy en="Change email or request a new code" hi="ईमेल बदलें या नया कोड माँगें" />
              </button>
            </div>
          )}
          {step === 'password' && <>
          <div>
            <label htmlFor="buyer-password" className="mb-2 block text-sm font-medium text-gray-700"><Copy en="Password" hi="पासवर्ड" /></label>
            <input id="buyer-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required disabled={submitting} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100" />
          </div>
          <div>
            <label htmlFor="buyer-confirm-password" className="mb-2 block text-sm font-medium text-gray-700"><Copy en="Confirm password" hi="पासवर्ड की पुष्टि करें" /></label>
            <input id="buyer-confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter your password again" autoComplete="new-password" required disabled={submitting} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100" />
          </div>
          </>}

          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {message && <p role="status" aria-live="polite" className="rounded-xl bg-green-50 p-3 text-sm leading-6 text-green-900">{message}</p>}

          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-[#173f2b] px-4 py-3 font-semibold text-white transition hover:bg-[#20563a] disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <Copy en="Please wait…" hi="कृपया प्रतीक्षा करें…" />
              : step === 'email' ? <Copy en="Send verification code" hi="सत्यापन कोड भेजें" />
              : step === 'code' ? <Copy en="Verify email" hi="ईमेल सत्यापित करें" />
              : <Copy en="Set password and continue" hi="पासवर्ड बनाएँ और आगे बढ़ें" />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <Link href={loginHref} className="font-semibold text-green-800 underline"><Copy en="Buyer login" hi="खरीदार लॉग इन" /></Link>
        </p>
        <p className="mt-5 border-t border-gray-200 pt-4 text-center text-xs leading-5 text-gray-500">Buyer registration does not activate seller tools. Sellers must apply separately and receive BodhiMart admin approval.</p>
      </section>
    </main>
  );
}

export default function BuyerRegistrationPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#f5f7f2] text-gray-600"><Copy en="Loading registration…" hi="पंजीकरण लोड हो रहा है…" /></main>}>
      <BuyerRegistrationForm />
    </Suspense>
  );
}
