'use client';

import { useId, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

type VerifiedAddress = {
  legal_name: string;
  document_address: string;
  verified_at: string;
  permanent_address_confirmed_at: string | null;
};

type ApplicationRole = 'farmer' | 'staff' | 'delivery';

const instructions: Record<ApplicationRole, string> = {
  farmer: 'Continue with the farmer application for document review. Enter the farm location separately.',
  staff: 'Continue with the staff application for document review. Enter your current correspondence address separately.',
  delivery: 'Contact BodhiMart to apply for delivery partner access. Your service area is separate from your residential address.',
};

export function DigiLockerVerification({ role }: { role: ApplicationRole }) {
  const statusId = useId();
  const [record, setRecord] = useState<VerifiedAddress | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function review(verifiedAt?: string) {
    setBusy(true);
    setMessage('');
    try {
      const client = createClient();
      const { data: { user } } = await client.auth.getUser();
      if (!user) {
        setRecord(null);
        setMessage('Sign in to review a verified address.');
        return;
      }
      const { data, error } = await client.rpc('bodhi_review_verified_address', {
        p_application_role: role,
        p_verified_at: verifiedAt ?? null,
      });
      if (error) throw error;
      setRecord(data?.[0] ?? null);
      if (!data?.length) {
        setMessage(verifiedAt
          ? 'The record changed. Load your address again before confirming.'
          : 'There is no verified address for this application yet.');
      }
    } catch {
      setMessage('Could not load or confirm the address. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Identity verification" className="my-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
      <h2 className="font-semibold">Identity verification</h2>
      <p className="mt-1">{instructions[role]}</p>
      <details className="mt-3">
        <summary className="cursor-pointer font-medium text-green-900">How optional DigiLocker verification will work</summary>
        <div className="mt-2 space-y-2">
          <p>Bodhi Rural will ask for your permission to retrieve your legal name and residential address from the identity document you choose to share.</p>
          <p>These details will be used for identity review and to prefill your application. You will be able to review them before submitting. If you confirm the document address is your permanent address, Bodhi Rural will record it as such. Enter your current or work address separately if it differs.</p>
          <p>You can decline and continue through the manual review route. This option does not ask you to enter your Aadhaar number.</p>
        </div>
      </details>
      <button
        type="button"
        disabled
        aria-describedby={statusId}
        className="mt-3 rounded-lg border border-gray-300 px-3 py-2 font-medium text-gray-600"
      >
        Verify and prefill with DigiLocker
      </button>
      <p id={statusId} className="mt-2 text-gray-600">Starting a new DigiLocker check is currently unavailable.</p>
      <button type="button" onClick={() => void review()} disabled={busy} className="mt-3 rounded-lg border border-green-700 px-3 py-2 font-medium text-green-900">
        Review my verified address
      </button>
      {record && (
        <div className="mt-3 rounded-lg bg-white p-3">
          <p className="font-semibold">{record.legal_name}</p>
          <p className="whitespace-pre-wrap">{record.document_address}</p>
          {record.permanent_address_confirmed_at ? (
            <p className="mt-2 text-green-800" role="status">Confirmed as your permanent address.</p>
          ) : (
            <button type="button" onClick={() => void review(record.verified_at)} disabled={busy} className="mt-3 rounded-lg bg-green-800 px-3 py-2 font-medium text-white">
              Confirm as my permanent address
            </button>
          )}
        </div>
      )}
      {message && <p className="mt-2" role="status">{message}</p>}
    </section>
  );
}
