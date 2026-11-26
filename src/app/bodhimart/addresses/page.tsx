'use client';

import { Copy } from '../language';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

type Address = {
  id: string;
  address_name: string | null;
  recipient_name: string;
  mobile: string;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  pincode: string | null;
  is_default: boolean;
  created_at: string;
};

type AddressForm = {
  address_name: string;
  recipient_name: string;
  mobile: string;
  address_line1: string;
  address_line2: string;
  landmark: string;
  pincode: string;
};

const emptyForm: AddressForm = {
  address_name: '',
  recipient_name: '',
  mobile: '',
  address_line1: '',
  address_line2: '',
  landmark: '',
  pincode: '',
};

const inputClass = 'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-100';

export default function BodhiMartAddressesPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState('');
  const [settingDefault, setSettingDefault] = useState('');
  const [editing, setEditing] = useState<Address | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [makeDefault, setMakeDefault] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError?.message === 'Auth session missing!') {
        router.replace('/login?account=buyer&redirect=%2Fbodhimart%2Faddresses');
        return;
      }
      if (authError) throw authError;
      if (!user) {
        router.replace('/login?account=buyer&redirect=%2Fbodhimart%2Faddresses');
        return;
      }

      const { data, error: addressError } = await supabase
        .from('marketplace_customer_addresses')
        .select('id, address_name, recipient_name, mobile, address_line1, address_line2, landmark, pincode, is_default, created_at')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (addressError) throw addressError;
      setAddresses((data || []) as Address[]);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load saved addresses.');
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    // Load only the signed-in customer's saved delivery addresses.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAddresses();
  }, [loadAddresses]);

  function startAdd() {
    setEditing(null);
    setForm(emptyForm);
    setMakeDefault(addresses.length === 0);
    setFormOpen(true);
    setError('');
    setMessage('');
  }

  function startEdit(address: Address) {
    setEditing(address);
    setForm({
      address_name: address.address_name || '',
      recipient_name: address.recipient_name,
      mobile: address.mobile,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      landmark: address.landmark || '',
      pincode: address.pincode || '',
    });
    setMakeDefault(address.is_default);
    setFormOpen(true);
    setError('');
    setMessage('');
  }

  async function saveAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const mobileDigits = form.mobile.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    if (form.recipient_name.trim().length < 2) {
      setError('Enter the recipient’s name.');
      return;
    }
    if (mobileDigits.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (form.address_line1.trim().length < 5) {
      setError('Enter a complete delivery address.');
      return;
    }
    if (form.pincode.trim() && !/^\d{6}$/.test(form.pincode.trim())) {
      setError('Enter a valid 6-digit PIN code.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        router.replace('/login?account=buyer&redirect=%2Fbodhimart%2Faddresses');
        return;
      }

      if (makeDefault) {
        const { error: clearError } = await supabase
          .from('marketplace_customer_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
        if (clearError) throw clearError;
      }

      const values = {
        address_name: form.address_name.trim() || null,
        recipient_name: form.recipient_name.trim(),
        mobile: form.mobile.trim(),
        address_line1: form.address_line1.trim(),
        address_line2: form.address_line2.trim() || null,
        landmark: form.landmark.trim() || null,
        pincode: form.pincode.trim() || null,
        is_default: makeDefault || addresses.length === 0,
        updated_at: new Date().toISOString(),
      };

      const result = editing
        ? await supabase
            .from('marketplace_customer_addresses')
            .update(values)
            .eq('id', editing.id)
            .eq('user_id', user.id)
        : await supabase
            .from('marketplace_customer_addresses')
            .insert({ ...values, user_id: user.id });
      if (result.error) throw result.error;

      setFormOpen(false);
      setEditing(null);
      setMessage(editing ? 'Address updated.' : 'Address saved.');
      await loadAddresses();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this address.');
    } finally {
      setSaving(false);
    }
  }

  async function setAsDefault(address: Address) {
    if (settingDefault || address.is_default) return;
    setSettingDefault(address.id);
    setError('');
    setMessage('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        router.replace('/login?account=buyer&redirect=%2Fbodhimart%2Faddresses');
        return;
      }

      const { error: clearError } = await supabase
        .from('marketplace_customer_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
      if (clearError) throw clearError;
      const { error: setErrorResult } = await supabase
        .from('marketplace_customer_addresses')
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq('id', address.id)
        .eq('user_id', user.id);
      if (setErrorResult) throw setErrorResult;
      setMessage('Default delivery address updated.');
      await loadAddresses();
    } catch (defaultError: unknown) {
      setError(defaultError instanceof Error ? defaultError.message : 'Unable to set the default address.');
      await loadAddresses();
    } finally {
      setSettingDefault('');
    }
  }

  async function removeAddress(address: Address) {
    if (removing) return;
    if (!window.confirm('Remove this saved address? Existing orders will keep their saved delivery details.')) return;

    setRemoving(address.id);
    setError('');
    setMessage('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        router.replace('/login?account=buyer&redirect=%2Fbodhimart%2Faddresses');
        return;
      }
      const { error: deleteError } = await supabase
        .from('marketplace_customer_addresses')
        .delete()
        .eq('id', address.id)
        .eq('user_id', user.id);
      if (deleteError) throw deleteError;
      setMessage('Address removed.');
      await loadAddresses();
    } catch (removeError: unknown) {
      setError(removeError instanceof Error ? removeError.message : 'Unable to remove this address.');
    } finally {
      setRemoving('');
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5] text-[#183426]">
      <section className="bg-green-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-200">BodhiMart</p>
            <h1 className="mt-2 text-3xl font-bold"><Copy en="Saved addresses" hi="सहेजे गए पते" /></h1>
            <p className="mt-2 text-sm text-green-100"><Copy en="Keep delivery details ready for your next order." hi="अगले ऑर्डर के लिए अपना डिलीवरी पता सहेजें।" /></p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/bodhimart/checkout" className="rounded-xl border border-white/40 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"><Copy en="Back to checkout" hi="चेकआउट पर लौटें" /></Link>
            <button type="button" onClick={startAdd} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-green-900 hover:bg-green-50">+ Add address</button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</p>}

        {formOpen && (
          <form onSubmit={(event) => void saveAddress(event)} className="mb-6 rounded-2xl border border-green-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-900">{editing ? 'Edit address' : 'Add a delivery address'}</h2>
              <button type="button" onClick={() => setFormOpen(false)} className="text-sm font-semibold text-gray-500 hover:text-gray-800"><Copy en="Close" hi="बंद करें" /></button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-gray-700"><Copy en="Address label" hi="पते का नाम" /> <span className="font-normal text-gray-500">(Home, shop, etc.)</span><input className={`${inputClass} mt-1`} maxLength={60} value={form.address_name} onChange={(event) => setForm({ ...form, address_name: event.target.value })} /></label>
              <label className="text-sm font-semibold text-gray-700"><Copy en="Recipient name *" hi="प्राप्तकर्ता का नाम *" /><input className={`${inputClass} mt-1`} required maxLength={120} value={form.recipient_name} onChange={(event) => setForm({ ...form, recipient_name: event.target.value })} /></label>
              <label className="text-sm font-semibold text-gray-700"><Copy en="Mobile number *" hi="मोबाइल नंबर *" /><input className={`${inputClass} mt-1`} required type="tel" inputMode="tel" maxLength={16} value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} /></label>
              <label className="text-sm font-semibold text-gray-700 sm:col-span-2"><Copy en="Address line 1 *" hi="पते की पहली पंक्ति *" /><input className={`${inputClass} mt-1`} required maxLength={240} value={form.address_line1} onChange={(event) => setForm({ ...form, address_line1: event.target.value })} /></label>
              <label className="text-sm font-semibold text-gray-700"><Copy en="Address line 2" hi="पते की दूसरी पंक्ति" /><input className={`${inputClass} mt-1`} maxLength={240} value={form.address_line2} onChange={(event) => setForm({ ...form, address_line2: event.target.value })} /></label>
              <label className="text-sm font-semibold text-gray-700"><Copy en="Landmark" hi="नज़दीकी पहचान" /><input className={`${inputClass} mt-1`} maxLength={120} value={form.landmark} onChange={(event) => setForm({ ...form, landmark: event.target.value })} /></label>
              <label className="text-sm font-semibold text-gray-700"><Copy en="PIN code" hi="पिन कोड" /><input className={`${inputClass} mt-1`} inputMode="numeric" maxLength={6} value={form.pincode} onChange={(event) => setForm({ ...form, pincode: event.target.value.replace(/\D/g, '') })} /></label>
              <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium text-gray-700"><input type="checkbox" checked={makeDefault} onChange={(event) => setMakeDefault(event.target.checked)} className="h-4 w-4 accent-green-800" /><Copy en="Use as default address" hi="इसे मुख्य पता बनाएँ" /></label>
            </div>
            <button type="submit" disabled={saving} className="mt-5 rounded-xl bg-green-800 px-5 py-3 text-sm font-bold text-white hover:bg-green-900 disabled:cursor-wait disabled:opacity-60">{saving ? 'Saving…' : editing ? 'Save changes' : 'Save address'}</button>
          </form>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center text-gray-600 shadow-sm"><Copy en="Loading saved addresses…" hi="सहेजे गए पते लोड हो रहे हैं…" /></div>
        ) : addresses.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm">
            <div className="text-5xl" aria-hidden="true">⌂</div>
            <h2 className="mt-4 text-xl font-bold text-gray-900"><Copy en="No saved addresses" hi="कोई पता सहेजा नहीं गया" /></h2>
            <p className="mt-2 text-sm text-gray-600"><Copy en="Add a delivery address to make checkout faster." hi="जल्दी चेकआउट के लिए डिलीवरी पता जोड़ें।" /></p>
            <button type="button" onClick={startAdd} className="mt-6 rounded-xl bg-green-800 px-5 py-3 text-sm font-bold text-white"><Copy en="Add your first address" hi="अपना पहला पता जोड़ें" /></button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <article key={address.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900">{address.address_name || 'Delivery address'}</h2>
                      {address.is_default && <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-green-800"><Copy en="Default" hi="मुख्य पता" /></span>}
                    </div>
                    <p className="mt-3 font-semibold text-gray-800">{address.recipient_name}</p>
                    <p className="mt-1 text-sm text-gray-600">{address.mobile}</p>
                    <p className="mt-3 text-sm leading-6 text-gray-700">{address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ''}{address.landmark ? `, Near ${address.landmark}` : ''}{address.pincode ? `, ${address.pincode}` : ''}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                  <button type="button" onClick={() => startEdit(address)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><Copy en="Edit" hi="बदलें" /></button>
                  {!address.is_default && <button type="button" onClick={() => void setAsDefault(address)} disabled={Boolean(settingDefault)} className="rounded-lg border border-green-700 px-3 py-2 text-sm font-semibold text-green-800 hover:bg-green-50 disabled:opacity-60">{settingDefault === address.id ? 'Updating…' : 'Set as default'}</button>}
                  <button type="button" onClick={() => void removeAddress(address)} disabled={removing === address.id} className="ml-auto rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">{removing === address.id ? 'Removing…' : 'Remove'}</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
