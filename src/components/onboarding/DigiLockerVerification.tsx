import { useId } from 'react';

type ApplicationRole = 'farmer' | 'staff' | 'delivery';

const instructions: Record<ApplicationRole, string> = {
  farmer: 'Continue with the farmer application for document review. Enter the farm location separately.',
  staff: 'Continue with the staff application for document review. Enter your current correspondence address separately.',
  delivery: 'Contact BodhiMart to apply for delivery partner access. Your service area is separate from your residential address.',
};

export function DigiLockerVerification({ role }: { role: ApplicationRole }) {
  const statusId = useId();

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
      <p id={statusId} className="mt-2 text-gray-600">DigiLocker is unavailable. No permission has been requested and no details have been fetched.</p>
    </section>
  );
}
