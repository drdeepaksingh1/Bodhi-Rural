'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function Farm360Page() {
  const params = useParams();

  const farmId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow">

        <Link
          href="/bodhifarm/farms"
          className="text-sm font-semibold text-green-700"
        >
          ← Back to Farm Management
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          Farm 360°
        </h1>

        <p className="mt-3 text-slate-600">
          Farm ID: {farmId}
        </p>

        <div className="mt-6 rounded-xl bg-green-50 p-5">
          <p className="font-semibold text-green-800">
            Farm 360° module is active.
          </p>
        </div>

      </div>
    </main>
  );
}
