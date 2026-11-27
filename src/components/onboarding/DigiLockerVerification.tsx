export function DigiLockerVerification({ manualInstructions }: { manualInstructions: string }) {
  return (
    <section aria-label="Identity verification" className="my-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
      <h2 className="font-semibold">Identity verification</h2>
      <p className="mt-1">{manualInstructions}</p>
      <button
        type="button"
        disabled
        className="mt-3 rounded-lg border border-gray-300 px-3 py-2 font-medium text-gray-600"
      >
        Verify with DigiLocker
      </button>
      <p className="mt-2 text-gray-600">DigiLocker verification is not available yet.</p>
    </section>
  );
}
