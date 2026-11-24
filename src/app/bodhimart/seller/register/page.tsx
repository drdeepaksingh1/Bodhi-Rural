'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../../../lib/supabase/client';

export default function SellerRegistrationPage() {
  const supabase = useMemo(() => createClient(), []);

  const [form, setForm] = useState({
    owner_name: '',
    shop_name: '',
    mobile: '',
    email: '',
    address: '',
    pan_number: '',
    gstin: '',
    upi_id: '',
    business_type: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [success, setSuccess] = useState('');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function requireSellerSession() {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (!active) return;

        if (authError && !authError.message.toLowerCase().includes('auth session missing')) {
          setError(authError.message);
          setCheckingSession(false);
          return;
        }

        if (data.user) {
          setUserId(data.user.id);
          setVerificationEmail(data.user.email || '');
          setForm((current) => ({
            ...current,
            email: current.email || data.user.email || '',
          }));
        }
        setCheckingSession(false);
      } catch {
        if (active) setCheckingSession(false);
      }
    }

    void requireSellerSession();
    return () => {
      active = false;
    };
  }, [supabase]);

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function sendVerificationCode() {
    setError('');
    setSuccess('');
    const email = verificationEmail.trim().toLowerCase();
    if (!email) {
      setError('Enter your email address to receive a verification code.');
      return;
    }

    setSendingOtp(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/bodhimart/seller/register`,
        },
      });
      if (error) throw error;
      setOtpSent(true);
      setSuccess('Verification code sent. Check your email and enter the 8-digit code below.');
    } catch (err: any) {
      setError(err?.message || 'Unable to send a verification code. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyEmail() {
    setError('');
    setSuccess('');
    const cleanedOtp = otp.replace(/\D/g, '');
    if (!/^\d{8}$/.test(cleanedOtp)) {
      setError('Enter the 8-digit verification code from your email.');
      return;
    }

    setVerifyingOtp(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: verificationEmail.trim().toLowerCase(),
        token: cleanedOtp,
        type: 'email',
      });
      if (error) throw error;
      const verifiedUser = data.user;
      if (!verifiedUser) throw new Error('Email verified, but the account could not be opened. Please try again.');

      setUserId(verifiedUser.id);
      setVerificationEmail(verifiedUser.email || verificationEmail.trim().toLowerCase());
      setForm((current) => ({
        ...current,
        email: current.email || verifiedUser.email || '',
      }));
      setSuccess('Email verified. Complete your seller application below. BodhiMart admins review every application before activation.');
    } catch (err: any) {
      setError(err?.message || 'Unable to verify this code. Please check it and try again.');
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function submitApplication(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitting(true);
    setSuccess('');
    setError('');

    try {
      if (
        !form.owner_name.trim() ||
        !form.shop_name.trim() ||
        !form.mobile.trim()
      ) {
        throw new Error(
          'Please fill Owner Name, Shop Name and Mobile Number.'
        );
      }

      const { data: userData, error: authError } =
        await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      const authenticatedUser = userData.user;
      if (!authenticatedUser || authenticatedUser.id !== userId) {
        throw new Error('Verify your email before submitting a seller application.');
      }

      const { data, error } = await supabase
        .from('marketplace_seller_applications')
        .insert({
          user_id: authenticatedUser.id,
          owner_name: form.owner_name.trim(),
          shop_name: form.shop_name.trim(),
          mobile: form.mobile.trim(),
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          pan_number:
            form.pan_number.trim() || null,
          gstin:
            form.gstin.trim() || null,
          upi_id:
            form.upi_id.trim() || null,
          business_type:
            form.business_type.trim() || null,
          status: 'SUBMITTED',
        })
        .select('id, application_number')
        .single();

      if (error) {
        throw error;
      }

      setApplicationSubmitted(true);
setSuccess(
        `Seller application submitted successfully${
          data?.application_number
            ? ` — Application No. ${data.application_number}`
            : ''
        }.`
      );

      setForm({
        owner_name: '',
        shop_name: '',
        mobile: '',
        email: '',
        address: '',
        pan_number: '',
        gstin: '',
        upi_id: '',
        business_type: '',
      });
    } catch (err: any) {
      setError(
        err?.message ||
          'Unable to submit seller application.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f8f5] px-4 text-center text-sm text-gray-600">
        <p aria-live="polite">Checking your BodhiMart account…</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f8f5',
        padding: '35px 20px 60px',
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: '#145c2b',
            color: '#fff',
            borderRadius: 18,
            padding: '30px',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 13,
              opacity: 0.85,
              marginBottom: 6,
            }}
          >
            BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 30,
            }}
          >
            Become a BodhiMart Seller
          </h1>

          <p
            style={{
              margin: '10px 0 0',
              opacity: 0.9,
              lineHeight: 1.6,
            }}
          >
            Apply to list your shop or business on BodhiMart. Verify your email first; our team reviews every application before seller activation.
          </p>
        </div>

        {/* SUCCESS */}
        {success && (
          <div
            style={{
              background: '#e8f5e9',
              color: '#145c2b',
              padding: 16,
              borderRadius: 10,
              marginBottom: 20,
              fontWeight: 600,
            }}
          >
            {success}
            {applicationSubmitted && (
              <p style={{ margin: '10px 0 0' }}>
                <Link href="/bodhimart/seller/status" style={{ color: '#145c2b', fontWeight: 700 }}>
                  View your application status →
                </Link>
              </p>
            )}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div
            style={{
              background: '#ffebee',
              color: '#b71c1c',
              padding: 16,
              borderRadius: 10,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {!userId ? (
          <section
            style={{
              background: '#fff',
              borderRadius: 18,
              padding: 28,
              boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
            }}
          >
            <h2 style={{ marginTop: 0, color: '#145c2b' }}>Verify your email to get started</h2>
            <p style={{ color: '#555', lineHeight: 1.6 }}>
              We’ll use your verified email to link your seller application to your account. Creating an account does not activate a seller profile or publish products.
            </p>
            <label htmlFor="seller-verification-email" style={labelStyle}>Email Address</label>
            <input
              id="seller-verification-email"
              type="email"
              value={verificationEmail}
              onChange={(event) => setVerificationEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
              disabled={otpSent || sendingOtp || verifyingOtp}
              style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 9, border: '1px solid #ccc', marginTop: 8 }}
            />
            <button
              type="button"
              onClick={sendVerificationCode}
              disabled={sendingOtp || otpSent}
              style={{ marginTop: 16, background: '#145c2b', color: '#fff', border: 0, borderRadius: 9, padding: '13px 20px', fontWeight: 700, cursor: sendingOtp || otpSent ? 'not-allowed' : 'pointer', opacity: sendingOtp || otpSent ? 0.7 : 1 }}
            >
              {sendingOtp ? 'Sending code…' : otpSent ? 'Code sent' : 'Send verification code'}
            </button>
            {otpSent && (
              <div style={{ marginTop: 20 }}>
                <label htmlFor="seller-verification-code" style={labelStyle}>8-digit verification code</label>
                <input
                  id="seller-verification-code"
                  type="text"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Enter code from email"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 9, border: '1px solid #ccc', marginTop: 8 }}
                />
                <button
                  type="button"
                  onClick={verifyEmail}
                  disabled={verifyingOtp}
                  style={{ marginTop: 12, background: '#1f2937', color: '#fff', border: 0, borderRadius: 9, padding: '13px 20px', fontWeight: 700, cursor: verifyingOtp ? 'not-allowed' : 'pointer', opacity: verifyingOtp ? 0.7 : 1 }}
                >
                  {verifyingOtp ? 'Verifying…' : 'Verify email'}
                </button>
              </div>
            )}
            <p style={{ marginTop: 20, fontSize: 13, color: '#666' }}>
              Already have an account? <Link className="font-semibold text-green-800 underline" href="/login?account=seller&redirect=%2Fbodhimart%2Fseller%2Fregister">Log in</Link>
            </p>
          </section>
        ) : (
          <form
            onSubmit={submitApplication}
            style={{
              background: '#fff',
              borderRadius: 18,
              padding: 28,
              boxShadow:
                '0 4px 18px rgba(0,0,0,0.06)',
            }}
          >
          {/* OWNER INFORMATION */}
          <h2
            style={{
              marginTop: 0,
              color: '#145c2b',
            }}
          >
            Shopkeeper Information
          </h2>

          <div style={gridStyle}>
            <Field
              label="Shopkeeper / Owner Name *"
              value={form.owner_name}
              onChange={(value) =>
                updateField('owner_name', value)
              }
              required
            />

            <Field
              label="Shop / Business Name *"
              value={form.shop_name}
              onChange={(value) =>
                updateField('shop_name', value)
              }
              required
            />

            <Field
              label="Mobile Number *"
              value={form.mobile}
              onChange={(value) =>
                updateField('mobile', value)
              }
              required
              type="tel"
            />

            <Field
              label="Email"
              value={form.email}
              onChange={(value) =>
                updateField('email', value)
              }
              type="email"
            />
          </div>

          {/* BUSINESS */}
          <h2
            style={{
              color: '#145c2b',
              marginTop: 30,
            }}
          >
            Business Details
          </h2>

          <div style={gridStyle}>
            <Field
              label="Business Type"
              value={form.business_type}
              onChange={(value) =>
                updateField(
                  'business_type',
                  value
                )
              }
              placeholder="Retail / Wholesale / Manufacturer / Farmer Producer"
            />

            <Field
              label="PAN Number"
              value={form.pan_number}
              onChange={(value) =>
                updateField(
                  'pan_number',
                  value
                )
              }
            />

            <Field
              label="GSTIN"
              value={form.gstin}
              onChange={(value) =>
                updateField('gstin', value)
              }
            />

            <Field
              label="UPI ID"
              value={form.upi_id}
              onChange={(value) =>
                updateField('upi_id', value)
              }
            />
          </div>

          {/* ADDRESS */}
          <div style={{ marginTop: 18 }}>
            <label style={labelStyle}>
              Business / Shop Address
            </label>

            <textarea
              value={form.address}
              onChange={(event) =>
                updateField(
                  'address',
                  event.target.value
                )
              }
              rows={4}
              placeholder="Enter complete shop/business address"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: 12,
                borderRadius: 9,
                border: '1px solid #ccc',
                resize: 'vertical',
              }}
            />
          </div>

          {/* WORKFLOW NOTICE */}
          <div
            style={{
              marginTop: 24,
              padding: 15,
              background: '#f7f9f7',
              borderRadius: 10,
              color: '#555',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            After submission, the application will be
            reviewed by BodhiMart administration. KYC
            verification and seller approval will be
            completed before seller activation.
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 24,
              background: '#145c2b',
              color: '#fff',
              border: 'none',
              borderRadius: 9,
              padding: '13px 24px',
              fontWeight: 700,
              fontSize: 15,
              cursor: submitting
                ? 'not-allowed'
                : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting
              ? 'Submitting...'
              : 'Submit Seller Application'}
          </button>
          </form>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: 12,
          borderRadius: 9,
          border: '1px solid #ccc',
        }}
      />
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit,minmax(240px,1fr))',
  gap: 18,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  fontSize: 13,
  marginBottom: 7,
  color: '#333',
};
