'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function Farm360() {
  const params = useParams();

  const farmId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="mb-6">
          <Link
            href="/bodhifarm/farms"
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            ← Back to Farm Management
          </Link>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Farm 360°
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Complete profile and operational view of the farm.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">

          <div className="rounded-xl bg-green-700 p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-wide text-green-100">
              Farm Profile
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Farm 360°
            </h2>

            <p className="mt-2 text-sm text-green-100">
              Farm ID: {farmId}
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Card
              title="Farm Profile"
              text="Farm identity, type and status."
            />

            <Card
              title="Farmer"
              text="Connected farmer information."
            />

            <Card
              title="Bird Batches"
              text="Batches assigned to this farm."
            />

            <Card
              title="Performance"
              text="Production and flock performance."
            />

          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">

            <h3 className="font-bold text-amber-900">
              Farm 360° connection
            </h3>

            <p className="mt-2 text-sm text-amber-800">
              The Farm 360° route is active. The detailed database
              sections can now be connected without affecting the
              existing Farm Management module.
            </p>

          </div>

          <div className="mt-6 flex flex-wrap gap-3">

            <Link
              href="/bodhifarm/farms"
              className="rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
            >
              Farm Management
            </Link>

            <Link
              href="/bodhifarm"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Bird Batch Management
            </Link>

            <Link
              href="/bodhifarm/performance"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Performance
            </Link>

          </div>

        </div>
      </div>
    </main>
  );
}

function Card({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <h3 className="font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        {text}
      </p>
    </div>
  );
}
