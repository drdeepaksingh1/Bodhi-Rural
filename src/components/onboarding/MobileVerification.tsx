'use client';

import { useId, useState, type FormEvent } from 'react';
import { createClient } from '../../lib/supabase/client';

export function MobileVerification({ onVerified }: { onVerified?: () => void }) {
  const id = useId();
  const [mobile, setMobile] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState('');

  if (process.env.NEXT_PUBLIC_BODHI_SMS_VERIFICATION !== 'true') return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || verified) return;
    setMessage('');
    if (!sentTo && !/^[6-9][0-9]{9}$/.test(mobile)) {
      setMessage('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email_confirmed_at) {
        setMessage('Sign in with your verified email first.');
        return;
      }

      if (sentTo) {
        const { data, error } = await supabase.auth.verifyOtp({ type: 'phone_change', phone: sentTo, token });
        if (error || data.user?.id !== user.id || !data.user.phone_confirmed_at
          || data.user.phone?.replace(/^\+/, '') !== sentTo.slice(1)) {
          setMessage('Could not verify this code. Check it or request a new one.');
          return;
        }
      } else {
        const phone = '+91' + mobile;
        if (user.phone?.replace(/^\+/, '') !== phone.slice(1) || !user.phone_confirmed_at) {
          const { error } = await supabase.auth.updateUser({ phone });
          if (error) {
            setMessage('Could not send an SMS right now. Check the number or try again later.');
            return;
          }
          setSentTo(phone);
          setMessage('Enter the code sent by SMS.');
          return;
        }
      }
      setVerified(true);
      setToken('');
      setMessage('Mobile number verified.');
      onVerified?.();
    } catch {
      setMessage('Mobile verification is temporarily unavailable.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="my-4 space-y-2 rounded-xl border border-gray-200 p-4">
      <h2 className="font-semibold">Verify your mobile number by SMS</h2>
      {!verified && (
        <>
          <label htmlFor={id} className="block text-sm">{sentTo ? 'SMS verification code' : 'Indian mobile number (+91)'}</label>
          <input key={sentTo ? 'code' : 'number'} id={id} type="text" inputMode="numeric" autoComplete={sentTo ? 'one-time-code' : 'tel-national'}
            value={sentTo ? token : mobile} required disabled={busy} maxLength={10}
            onChange={(event) => (sentTo ? setToken : setMobile)(event.target.value.replace(/\D/g, ''))}
            className="rounded-lg border px-3 py-2"
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className="rounded-lg bg-green-800 px-3 py-2 text-white">
              {sentTo ? 'Verify code' : 'Send SMS code'}
            </button>
            {sentTo && <button type="button" disabled={busy} onClick={() => { setSentTo(''); setToken(''); setMessage(''); }} className="px-2 underline">Change number or request a new code</button>}
          </div>
        </>
      )}
      {message && <p role="status" className="text-sm">{message}</p>}
    </form>
  );
}
