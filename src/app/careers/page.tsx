import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Explore career opportunities with Bodhi Rural across agriculture, rural enterprise, technology and operations.',
  alternates: { canonical: '/careers' },
};

export default function CareersPage() {
  return (
    <main className="min-h-[70vh] bg-[#f7f7f2] text-[#1c2b23]">
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
        <div>
          <p className="inline-flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#1c6844] before:h-px before:w-7 before:bg-[#876321]">
            Careers at Bodhi Rural
          </p>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl font-medium leading-[1.05] tracking-[-.035em] text-[#123d2b] sm:text-6xl">
            Grow your work with rural India.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#526157]">
            We work across agriculture, allied livelihoods, rural enterprise and technology. We value people who bring practical skills, curiosity and respect for the communities we work alongside.
          </p>
        </div>
        <aside className="border-l border-[#d3dbd2] py-1 pl-6 text-sm leading-7 text-[#526157]">
          <strong className="mb-2 block text-[11px] font-extrabold uppercase tracking-[.12em] text-[#123d2b]">
            Our work
          </strong>
          Opportunities may span field operations, agriculture and allied activities, business development, technology and programme coordination.
        </aside>
      </section>

      <section className="border-y border-[#e0e4dc] bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#70501f]">Current opportunities</p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-[-.025em] text-[#123d2b]">No open positions are listed right now.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#617067]">
              There are no advertised roles at the moment. You can still submit a general staff application through our email-verified form; it will enter the existing HR review process.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/staff/register"
              className="inline-flex min-h-12 items-center justify-center gap-3 bg-[#123d2b] px-6 text-sm font-bold text-white no-underline transition hover:bg-[#1c6844]"
            >
              Apply through HR <span aria-hidden="true">→</span>
            </Link>
            <a
              href="mailto:bodhirural@gmail.com?subject=Career%20enquiry%20-%20Bodhi%20Rural"
              className="inline-flex min-h-12 items-center justify-center border border-[#cbd5ca] px-5 text-sm font-bold text-[#123d2b] no-underline transition hover:bg-[#f7f7f2]"
            >
              Ask a question
            </a>
            <Link
              href="/staff/application/track"
              className="inline-flex min-h-12 items-center justify-center border border-[#cbd5ca] px-5 text-sm font-bold text-[#123d2b] no-underline transition hover:bg-[#f7f7f2]"
            >
              Track an application
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-12 sm:px-8 sm:py-16 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#1c6844]">Learn about us</p>
          <h2 className="mt-3 font-serif text-3xl font-medium tracking-[-.025em] text-[#123d2b]">See the work behind the opportunities.</h2>
        </div>
        <Link href="/about" className="inline-flex min-h-12 items-center justify-center border border-[#cbd5ca] px-5 text-sm font-bold text-[#123d2b] no-underline transition hover:bg-white">
          About Bodhi Rural <span className="ml-3" aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}

