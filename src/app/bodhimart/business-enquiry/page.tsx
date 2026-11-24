'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

const fieldClass =
  'mt-2 min-h-12 w-full rounded-xl border border-[#d9e3d9] bg-white px-4 py-3 text-sm text-[#183426] outline-none transition placeholder:text-gray-400 focus:border-green-700 focus:ring-2 focus:ring-green-700/15';

export default function BodhiMartBusinessEnquiryPage() {
  const [prepared, setPrepared] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  function buildEmailBody(form: HTMLFormElement) {
    const fields = new FormData(form);
    return [
      'BodhiMart business and bulk sourcing enquiry',
      '',
      `Name: ${fields.get('name')}`,
      `Farm / business / institution: ${fields.get('organization')}`,
      `Email: ${fields.get('email')}`,
      `Phone: ${fields.get('phone')}`,
      `Product or category: ${fields.get('product')}`,
      `Estimated quantity: ${fields.get('quantity')}`,
      `Delivery PIN code: ${fields.get('pincode')}`,
      `Fulfilment preference: ${fields.get('fulfilment')}`,
      '',
      'Additional details:',
      `${fields.get('details') || 'None provided.'}`,
    ].join('\n');
  }

  function prepareEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    setPrepared(true);
    window.location.href =
      `mailto:ceo@brlps.co.in?subject=${encodeURIComponent('BodhiMart bulk sourcing enquiry')}&body=${encodeURIComponent(buildEmailBody(form))}`;
  }

  async function copyEmailDetails(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form || !form.reportValidity()) return;

    try {
      await navigator.clipboard.writeText(buildEmailBody(form));
      setCopyMessage('Enquiry details copied. Paste them into an email to ceo@brlps.co.in.');
    } catch {
      setCopyMessage('Copy was unavailable in this browser. Please use “Continue to email BodhiMart” or email ceo@brlps.co.in directly.');
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f8f4] text-[#183426]">
      <section className="bg-[#123d29] text-white">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <Link href="/bodhimart" className="text-sm font-semibold text-white/75 hover:text-white">
            ← BodhiMart
          </Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#e5c56d]">
            Trade and institutional buying
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Plan your next bulk order with BodhiMart.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
            Tell us what your farm, shop or institution needs. Our team can help
            check sourcing, quantities and fulfilment options.
          </p>
        </div>
      </section>

      <section className="mx-auto grid !mt-0 max-w-6xl !grid-cols-1 gap-8 px-5 py-10 sm:px-8 lg:!grid-cols-[minmax(0,1fr)_300px] lg:py-14">
        <form onSubmit={prepareEmail} className="rounded-3xl border border-[#e1e8df] bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7">
            <h2 className="text-xl font-bold">Request sourcing help</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Share a few details so we can understand the order you have in mind.
            </p>
          </div>

          <div className="grid !mt-0 !grid-cols-1 gap-5 sm:!grid-cols-2">
            <label className="text-sm font-semibold text-gray-700">
              Your name <span className="text-red-600">*</span>
              <input className={fieldClass} name="name" autoComplete="name" required maxLength={100} />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Farm, business or institution <span className="text-red-600">*</span>
              <input className={fieldClass} name="organization" autoComplete="organization" required maxLength={140} />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Email for reply <span className="text-red-600">*</span>
              <input className={fieldClass} name="email" type="email" autoComplete="email" required maxLength={254} />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Phone number <span className="text-red-600">*</span>
              <input className={fieldClass} name="phone" type="tel" autoComplete="tel" required maxLength={25} />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Product or category <span className="text-red-600">*</span>
              <input className={fieldClass} name="product" required maxLength={160} placeholder="For example: poultry feed, rice, seeds" />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Estimated quantity <span className="text-red-600">*</span>
              <input className={fieldClass} name="quantity" required maxLength={80} placeholder="For example: 50 bags or 200 kg" />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Delivery PIN code <span className="text-red-600">*</span>
              <input className={fieldClass} name="pincode" inputMode="numeric" pattern="[0-9]{6}" autoComplete="postal-code" required title="Enter a 6-digit PIN code" />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Preferred fulfilment
              <select className={fieldClass} name="fulfilment" defaultValue="Either delivery or pickup">
                <option>Either delivery or pickup</option>
                <option>Delivery</option>
                <option>Pickup</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-gray-700 sm:col-span-2">
              Other requirements
              <textarea className={`${fieldClass} min-h-28 resize-y`} name="details" maxLength={1000} placeholder="Timing, preferred pack sizes or other useful details" />
            </label>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="submit" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#176b3a] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0f4f2b] focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2">
              Continue to email BodhiMart
            </button>
            <button type="button" onClick={copyEmailDetails} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#176b3a] px-6 py-3 text-sm font-bold text-[#176b3a] transition hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2">
              Copy enquiry details
            </button>
          </div>
          {copyMessage && (
            <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-900">
              {copyMessage}
            </p>
          )}
          {prepared && (
            <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-900">
              Your email app should open with the enquiry prepared. Review it and send it there to contact the BodhiMart team.
            </p>
          )}
        </form>

        <aside className="h-fit rounded-3xl border border-[#dce8dc] bg-[#eaf2e8] p-6 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5f7b65]">How it works</p>
          <ol className="mt-5 space-y-5 text-sm leading-6 text-[#43594a]">
            <li><strong className="text-[#183426]">1. Describe the order.</strong><br />Share product, quantity and delivery area.</li>
            <li><strong className="text-[#183426]">2. Review your email.</strong><br />Your email app opens with the details filled in.</li>
            <li><strong className="text-[#183426]">3. Send when ready.</strong><br />Nothing is sent from this page; you choose whether to send the email.</li>
          </ol>
          <div className="mt-7 border-t border-[#d1dfd1] pt-5 text-sm leading-6 text-[#43594a]">
            Prefer to call? <a className="font-bold text-[#176b3a] hover:underline" href="tel:+917667979679">+91 76679 79679</a>
            <br />Email: <a className="font-bold text-[#176b3a] hover:underline" href="mailto:ceo@brlps.co.in">ceo@brlps.co.in</a>
          </div>
          <Link href="/bodhimart/products" className="mt-6 inline-flex text-sm font-bold text-[#176b3a] hover:underline">
            Browse the catalogue →
          </Link>
        </aside>
      </section>
    </main>
  );
}
