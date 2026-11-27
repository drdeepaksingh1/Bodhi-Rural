'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useBodhiMartLanguage } from '../../language';
import { createClient } from '../../../../lib/supabase/client';

export default function SellerRegistrationPage() {
  const supabase = useMemo(() => createClient(), []);

  const language = useBodhiMartLanguage();
  const [shopLocation, setShopLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<'denied' | 'unavailable' | null>(null);
  const t = (english: string, hindi: string) => language === 'hi' ? hindi : english;

  function captureShopLocation() {
    setShopLocation(null);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('unavailable');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setShopLocation({ latitude, longitude });
        setLocating(false);
      },
      (failure) => {
        setLocationError(failure.code === 1 ? 'denied' : 'unavailable');
        setLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
  }

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
  const [needsPassword, setNeedsPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
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
      setError(t("Enter your email address to receive a verification code.", "सत्यापन कोड पाने के लिए अपना ईमेल पता दर्ज करें।"));
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
      setSuccess(t("Verification code sent. Check your email and enter the 8-digit code below.", "सत्यापन कोड भेज दिया गया है। ईमेल में मिला 8 अंकों का कोड दर्ज करें।"));
    } catch (err: any) {
      setError(err?.message || t("Unable to send a verification code. Please try again.", "कोड नहीं भेजा जा सका। फिर कोशिश करें।"));
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyEmail() {
    setError('');
    setSuccess('');
    const cleanedOtp = otp.replace(/\D/g, '');
    if (!/^\d{8}$/.test(cleanedOtp)) {
      setError(t("Enter the 8-digit verification code from your email.", "ईमेल से मिला 8 अंकों का सत्यापन कोड दर्ज करें।"));
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

      const { data: hasPassword, error: accountError } = await supabase.rpc('bodhimart_current_account_has_password');
      if (accountError) throw new Error('Could not check your account. Sign in or try again.');

      setUserId(verifiedUser.id);
      setNeedsPassword(!hasPassword);
      setVerificationEmail(verifiedUser.email || verificationEmail.trim().toLowerCase());
      setForm((current) => ({
        ...current,
        email: current.email || verifiedUser.email || '',
      }));
      setSuccess(t("Email verified. Complete your seller application below. BodhiMart admins review every application before activation.", "ईमेल सत्यापित हो गया। नीचे अपना विक्रेता आवेदन पूरा करें।"));
    } catch (err: any) {
      setError(err?.message || t("Unable to verify this code. Please check it and try again.", "कोड का सत्यापन नहीं हुआ। कोड जाँचकर फिर कोशिश करें।"));
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword.length < 8 || newPassword !== confirmPassword) {
      setError(t('Use at least 8 characters and enter the same password twice.', 'कम से कम 8 अक्षर इस्तेमाल करें और दोनों बार वही पासवर्ड दर्ज करें।'));
      return;
    }
    setSavingPassword(true);
    try {
      const { data, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !data.user || data.user.id !== userId) {
        throw new Error(t('Verify your email again before setting a password.', 'पासवर्ड बनाने से पहले ईमेल दोबारा सत्यापित करें।'));
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setNeedsPassword(false);
      setSuccess(t('Password saved. Complete your seller application below.', 'पासवर्ड सहेज लिया गया। अपना विक्रेता आवेदन पूरा करें।'));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t('Could not set your password.', 'पासवर्ड सेट नहीं हो सका।'));
    } finally {
      setSavingPassword(false);
    }
  }

  async function submitApplication(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    if (!shopLocation || locating || submitting || needsPassword) return;

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
          t("Please fill Owner Name, Shop Name and Mobile Number.", "मालिक का नाम, दुकान का नाम और मोबाइल नंबर भरें।")
        );
      }

      const pan = form.pan_number.trim().toUpperCase();
      const gstin = form.gstin.trim().toUpperCase();
      if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
        throw new Error(t('Enter a valid PAN format.', 'पैन सही प्रारूप में दर्ज करें।'));
      }
      if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]{3}$/.test(gstin)) {
        throw new Error(t('Enter a valid GSTIN format.', 'जीएसटीआईएन सही प्रारूप में दर्ज करें।'));
      }
      if (pan && gstin && gstin.slice(2, 12) !== pan) {
        throw new Error(t('GSTIN must match the PAN of the selling business.', 'जीएसटीआईएन विक्रेता व्यवसाय के पैन से मेल खाना चाहिए।'));
      }

      const { data: userData, error: authError } =
        await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      const authenticatedUser = userData.user;
      if (!authenticatedUser || authenticatedUser.id !== userId) {
        throw new Error(t("Verify your email before submitting a seller application.", "विक्रेता आवेदन भेजने से पहले अपना ईमेल सत्यापित करें।"));
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
          pan_number: pan || null,
          gstin: gstin || null,
          upi_id:
            form.upi_id.trim() || null,
          business_type:
            form.business_type.trim() || null,
          shop_latitude: shopLocation.latitude,
          shop_longitude: shopLocation.longitude,
          status: 'SUBMITTED',
        })
        .select('id, application_number')
        .single();

      if (error) {
        throw error;
      }

      setApplicationSubmitted(true);
      setShopLocation(null);
      setSuccess(
        `${t("Seller application submitted successfully", "विक्रेता आवेदन सफलतापूर्वक जमा हुआ")}${
          data?.application_number
            ? ` — ${t("Application No.", "आवेदन संख्या")} ${data.application_number}`
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
          t("Unable to submit seller application.", "विक्रेता आवेदन जमा नहीं हो सका।")
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f8f5] px-4 text-center text-sm text-gray-600">
        <p aria-live="polite">{t("Checking your BodhiMart account…", "आपके BodhiMart खाते की जाँच हो रही है…")}</p>
      </main>
    );
  }

  return (
    <main
      lang={language}
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
            {t("Become a BodhiMart Seller", "BodhiMart विक्रेता बनें")}
          </h1>

          <p
            style={{
              margin: '10px 0 0',
              opacity: 0.9,
              lineHeight: 1.6,
            }}
          >
            {t("Apply to list your shop or business on BodhiMart. Verify your email first; our team reviews every application before seller activation.", "BodhiMart पर अपनी दुकान या व्यवसाय जोड़ने के लिए आवेदन करें। पहले ईमेल सत्यापित करें। हमारी टीम हर आवेदन की समीक्षा करती है।")}
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
                  {t("View your application status →", "अपने आवेदन की स्थिति देखें →")}
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
            <h2 style={{ marginTop: 0, color: '#145c2b' }}>{t("Verify your email to get started", "शुरू करने के लिए अपना ईमेल सत्यापित करें")}</h2>
            <p style={{ color: '#555', lineHeight: 1.6 }}>
              {t("We’ll use your verified email to link your seller application to your account. Creating an account does not activate a seller profile or publish products.", "आपका सत्यापित ईमेल विक्रेता आवेदन को आपके खाते से जोड़ेगा। विक्रेता प्रोफ़ाइल सक्रिय करने के लिए आवेदन की मंज़ूरी ज़रूरी है।")}
            </p>
            <label htmlFor="seller-verification-email" style={labelStyle}>{t("Email Address", "ईमेल पता")}</label>
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
              {sendingOtp ? t("Sending code…", "कोड भेजा जा रहा है…") : otpSent ? t("Code sent", "कोड भेज दिया गया") : t("Send verification code", "सत्यापन कोड भेजें")}
            </button>
            {otpSent && (
              <div style={{ marginTop: 20 }}>
                <label htmlFor="seller-verification-code" style={labelStyle}>{t("8-digit verification code", "8 अंकों का सत्यापन कोड")}</label>
                <input
                  id="seller-verification-code"
                  type="text"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder={t("Enter code from email", "ईमेल से मिला कोड दर्ज करें")}
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
                  {verifyingOtp ? t("Verifying…", "सत्यापन हो रहा है…") : t("Verify email", "ईमेल सत्यापित करें")}
                </button>
              </div>
            )}
            <p style={{ marginTop: 20, fontSize: 13, color: '#666' }}>
              Already have an account? <Link className="font-semibold text-green-800 underline" href="/login?account=seller&redirect=%2Fbodhimart%2Fseller%2Fregister">{t("Log in", "लॉग इन करें")}</Link>
            </p>
          </section>
        ) : needsPassword ? (
          <form onSubmit={savePassword} className="space-y-4 rounded-2xl bg-white p-6">
            <h2 className="text-xl font-bold text-green-900">{t('Create your seller login password', 'विक्रेता लॉग इन का पासवर्ड बनाएँ')}</h2>
            <label className="block">
              {t('Password', 'पासवर्ड')}
              <input type="password" required minLength={8} autoComplete="new-password" value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)} className="mt-1 block w-full rounded-lg border p-3" />
            </label>
            <label className="block">
              {t('Confirm password', 'पासवर्ड की पुष्टि करें')}
              <input type="password" required minLength={8} autoComplete="new-password" value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 block w-full rounded-lg border p-3" />
            </label>
            <button type="submit" disabled={savingPassword} className="rounded-lg bg-green-800 px-4 py-3 font-semibold text-white disabled:opacity-60">
              {savingPassword ? t('Saving…', 'सहेजा जा रहा है…') : t('Save password and continue', 'पासवर्ड सहेजें और आगे बढ़ें')}
            </button>
          </form>
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
            {t("Shopkeeper Information", "दुकानदार की जानकारी")}
          </h2>

          <div style={gridStyle}>
            <Field
              label={t("Shopkeeper / Owner Name *", "दुकानदार / मालिक का नाम *")}
              value={form.owner_name}
              onChange={(value) =>
                updateField('owner_name', value)
              }
              required
            />

            <Field
              label={t("Shop / Business Name *", "दुकान / व्यवसाय का नाम *")}
              value={form.shop_name}
              onChange={(value) =>
                updateField('shop_name', value)
              }
              required
            />

            <Field
              label={t("Mobile Number *", "मोबाइल नंबर *")}
              value={form.mobile}
              onChange={(value) =>
                updateField('mobile', value)
              }
              required
              type="tel"
            />

            <Field
              label={t("Email", "ईमेल")}
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
            {t("Business Details", "व्यवसाय की जानकारी")}
          </h2>

          <div style={gridStyle}>
            <Field
              label={t("Business Type", "व्यवसाय का प्रकार")}
              value={form.business_type}
              onChange={(value) =>
                updateField(
                  'business_type',
                  value
                )
              }
              placeholder={t("Retail / Wholesale / Manufacturer / Farmer Producer", "खुदरा / थोक / निर्माता / किसान उत्पादक")}
            />

            <Field
              label={t("PAN of the selling business (if applicable)", "विक्रेता व्यवसाय का पैन (यदि लागू हो)")}
              value={form.pan_number}
              onChange={(value) =>
                updateField(
                  'pan_number',
                  value
                )
              }
            />

            <Field
              label={t("GSTIN (if registered)", "जीएसटीआईएन (यदि पंजीकृत हैं)")}
              value={form.gstin}
              onChange={(value) =>
                updateField('gstin', value)
              }
            />

            <Field
              label={t("UPI ID", "यूपीआई आईडी")}
              value={form.upi_id}
              onChange={(value) =>
                updateField('upi_id', value)
              }
            />
          </div>

          {/* ADDRESS */}
          <div style={{ marginTop: 18 }}>
            <label style={labelStyle}>
              {t("Business / Shop Address", "व्यवसाय / दुकान का पता")}
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
              placeholder={t("Enter complete shop/business address", "दुकान या व्यवसाय का पूरा पता दर्ज करें")}
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

          <fieldset className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
            <legend className="px-1 font-semibold text-green-900">{t('Shop GPS location (required)', 'दुकान का जीपीएस स्थान (अनिवार्य)')}</legend>
            <p className="mb-3 text-sm">{t('Stand at your shop and allow location access. BodhiMart uses this pickup point to match nearby orders.', 'अपनी दुकान पर खड़े होकर लोकेशन की अनुमति दें। BodhiMart इस स्थान का उपयोग पास के ऑर्डर से आपकी दुकान को जोड़ने के लिए करता है।')}</p>
            <button type="button" disabled={locating || submitting} onClick={captureShopLocation} className="min-h-11 rounded-lg bg-green-800 px-4 text-sm font-semibold text-white disabled:opacity-60">
              {locating ? t('Getting location…', 'स्थान लिया जा रहा है…') : shopLocation ? t('Capture again', 'स्थान फिर से लें') : t('Capture shop location', 'दुकान का स्थान लें')}
            </button>
            <div className="mt-2 text-sm" aria-live="polite">
              {shopLocation && t('Shop location captured.', 'दुकान का स्थान दर्ज हो गया।')}
              {locationError === 'denied' && t('Allow location access in your browser settings, then try again.', 'ब्राउज़र सेटिंग में लोकेशन की अनुमति देकर फिर कोशिश करें।')}
              {locationError === 'unavailable' && t('Location is unavailable. Turn on GPS and try again at your shop.', 'स्थान उपलब्ध नहीं है। जीपीएस चालू करके दुकान पर फिर कोशिश करें।')}
            </div>
          </fieldset>

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
            {t('BodhiMart reviews your application and verifies KYC before activating your seller account.', 'विक्रेता खाता सक्रिय करने से पहले BodhiMart आपके आवेदन और केवाईसी की जाँच करता है।')}
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={submitting || !shopLocation || locating || applicationSubmitted}
            style={{
              marginTop: 24,
              background: '#145c2b',
              color: '#fff',
              border: 'none',
              borderRadius: 9,
              padding: '13px 24px',
              fontWeight: 700,
              fontSize: 15,
              cursor: submitting || !shopLocation || locating || applicationSubmitted
                ? 'not-allowed'
                : 'pointer',
              opacity: submitting || !shopLocation || locating || applicationSubmitted ? 0.7 : 1,
            }}
          >
            {submitting
              ? t("Submitting...", "आवेदन भेजा जा रहा है…")
              : t("Submit Seller Application", "विक्रेता आवेदन जमा करें")}
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
