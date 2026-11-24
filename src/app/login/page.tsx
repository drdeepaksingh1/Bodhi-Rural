
'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

function LoginForm() {
  const searchParams = useSearchParams();
  const accountType = searchParams.get('account');
  const isSellerLogin = accountType === 'seller';
  const isBuyerLogin = accountType === 'buyer';
  const fallbackRedirect = isSellerLogin
    ? '/bodhimart/seller/dashboard'
    : isBuyerLogin
      ? '/bodhimart/products'
      : '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Safely determine the page to open after successful login
  function getSafeRedirectPath() {
    const requestedPath = searchParams.get('redirect');

    if (!requestedPath) {
      return fallbackRedirect;
    }

    try {
      const parsedUrl = new URL(
        requestedPath,
        window.location.origin
      );

      if (parsedUrl.origin !== window.location.origin) {
        return fallbackRedirect;
      }

      return (
        parsedUrl.pathname +
        parsedUrl.search +
        parsedUrl.hash
      );
    } catch {
      return fallbackRedirect;
    }
  }

  // Normal login
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage('');

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      window.location.assign(getSafeRedirectPath());

    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to login. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  // Forgot password
  async function handleForgotPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!email.trim()) {
      setMessage('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const supabase = createClient();

      // Always use the canonical production domain
      const redirectUrl = new URL(
        'https://brlps.co.in/auth/callback'
      );

      redirectUrl.searchParams.set(
        'next',
        '/reset-password'
      );

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: redirectUrl.toString(),
          }
        );

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage(
        'Password reset email sent successfully. Please check your inbox and open the latest email.'
      );

    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to send reset email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  function openForgotPassword() {
    setIsForgotPassword(true);
    setPassword('');
    setMessage('');
  }

  function openLogin() {
    setIsForgotPassword(false);
    setPassword('');
    setMessage('');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        {/* Branding */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-green-800">
            BodhiMart
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            {isForgotPassword
              ? 'Reset your account password'
              : isSellerLogin
                ? 'Seller workspace sign in'
                : isBuyerLogin
                  ? 'Shop and manage your BodhiMart orders'
                  : 'Welcome to BodhiMart'}
          </p>
        </div>

        {/* Form heading */}
        <h2 className="mb-6 text-xl font-semibold text-gray-800">
          {isForgotPassword
            ? 'Forgot Password'
            : isSellerLogin
              ? 'Seller Login'
              : isBuyerLogin
                ? 'Buyer Login'
                : 'Login to Your Account'}
        </h2>

        {!isForgotPassword && (isSellerLogin || isBuyerLogin) && (
          <p className="-mt-3 mb-5 text-sm leading-6 text-gray-600">
            {isSellerLogin
              ? 'Sign in to manage your approved shop. Seller tools are available after BodhiMart admin approval.'
              : 'Sign in to shop the catalogue, save products and manage your orders.'}
          </p>
        )}

        <form
          onSubmit={
            isForgotPassword
              ? handleForgotPassword
              : handleLogin
          }
          className="space-y-5"
        >

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              autoComplete="email"
              required
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          {/* Password - only during login */}
          {!isForgotPassword && (
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
              />
            </div>
          )}

          {/* Forgot password link */}
          {!isForgotPassword && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={openForgotPassword}
                disabled={loading}
                className="text-sm font-medium text-green-700 hover:text-green-900"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Status message */}
          {message && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800"
            >
              {message}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Please wait...'
              : isForgotPassword
                ? 'Send Reset Password Link'
                : 'Login'}
          </button>

        </form>

        {/* Back to login */}
        {isForgotPassword && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={openLogin}
              disabled={loading}
              className="text-sm font-medium text-green-700 hover:text-green-900"
            >
              Back to Login
            </button>
          </div>
        )}

        {!isForgotPassword && (
          <div className="mt-6 text-center text-sm text-gray-600">
            <a
              href={isSellerLogin
                ? '/login?account=buyer&redirect=%2Fbodhimart%2Fproducts'
                : isBuyerLogin
                  ? '/login?account=seller&redirect=%2Fbodhimart%2Fseller%2Fdashboard'
                  : '/bodhimart/login'}
              className="font-semibold text-green-800 underline"
            >
              {isSellerLogin
                ? 'Shopping instead? Buyer login'
                : isBuyerLogin
                  ? 'Selling on BodhiMart? Seller login'
                  : 'Choose buyer or seller sign in'}
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 border-t border-gray-200 pt-5 text-center">
          <p className="text-xs text-gray-500">
            BodhiMart | Bodhi Rural Livelihood & Agri Pvt. Ltd.
          </p>
        </div>

      </div>
    </main>
  );
}

// Suspense boundary required by Next.js 14
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-gray-600">
            Loading login...
          </p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
