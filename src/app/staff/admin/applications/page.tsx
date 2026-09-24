'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '../../../../lib/supabase/client';

type Role = { id: string; code: string; name: string };
type Location = { id: string; name: string; location_type: string; code: string | null };
type App = {
  id: string; application_number: string; full_name: string;
  mobile: string | null; email: string | null; alternate_mobile: string | null;
  father_husband_name: string | null; date_of_birth: string | null; gender: string | null;
  blood_group: string | null; address: string | null;
  state_id: string | null; district_id: string | null; block_id: string | null;
  panchayat_id: string | null; village_id: string | null;
  highest_qualification: string | null; course: string | null; institution: string | null;
  passing_year: number | null; previous_organization: string | null;
  previous_designation: string | null; total_experience_years: number | null;
  proposed_department: string | null; proposed_designation: string;
  proposed_role_id: string | null; proposed_state_id: string | null;
  proposed_district_id: string | null; proposed_block_id: string | null;
  proposed_panchayat_id: string | null; status: string; current_stage: string;
  submitted_at: string | null; created_at: string; staff_id: string | null;
};
type Approval = {
  id: string; stage: string; decision: string; remarks: string | null;
  decided_at: string | null; approver_role_id: string | null; role_name?: string;
};

const fmt = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const val = (v: unknown) => v === null || v === undefined || v === '' ? '—' : String(v);

export default function HRStaffApplicationsPage() {
  const supabase = createClient();
  const [apps, setApps] = useState<App[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [locs, setLocs] = useState<Record<string, Location>>({});
  const [history, setHistory] = useState<Approval[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const selected = apps.find(a => a.id === selectedId) || null;

  const filtered = useMemo(() => apps.filter(a => {
    const matchesFilter = filter === 'ALL' || a.status === filter || a.current_stage === filter;
    const q = search.trim().toLowerCase();
    if (!matchesFilter) return false;
    if (!q) return true;
    return [a.application_number, a.full_name, a.email, a.mobile, a.proposed_designation,
      a.proposed_department, a.status, a.current_stage].filter(Boolean)
      .some(x => String(x).toLowerCase().includes(q));
  }), [apps, search, filter]);

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selectedId) loadHistory(selectedId); else setHistory([]); }, [selectedId]);

  async function load() {
    setLoading(true); setError('');
    try {
      const [ar, rr] = await Promise.all([
        supabase.from('staff_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('roles').select('id, code, name').order('name')
      ]);
      if (ar.error) throw new Error(ar.error.message);
      if (rr.error) throw new Error(rr.error.message);
      const rows = (ar.data || []) as App[];
      setApps(rows); setRoles((rr.data || []) as Role[]);
      if (!selectedId && rows[0]) setSelectedId(rows[0].id);

      const ids = Array.from(new Set(rows.flatMap(a => [
        a.state_id,a.district_id,a.block_id,a.panchayat_id,a.village_id,
        a.proposed_state_id,a.proposed_district_id,a.proposed_block_id,a.proposed_panchayat_id
      ]).filter(Boolean))) as string[];
      if (ids.length) {
        const lr = await supabase.rpc('get_location_names', { p_ids: ids });
        if (lr.error) throw new Error(lr.error.message);
        const map: Record<string, Location> = {};
        for (const x of (lr.data || []) as Location[]) map[x.id] = x;
        setLocs(map);
      }
    } catch (e: any) { setError(e?.message || 'Unable to load applications.'); }
    finally { setLoading(false); }
  }

  async function loadHistory(id: string) {
    setHistoryLoading(true);
    const r = await supabase.from('staff_application_approvals')
      .select('id, stage, decision, remarks, decided_at, approver_role_id')
      .eq('application_id', id).order('decided_at', { ascending: true });
    if (r.error) { setError(r.error.message); setHistory([]); setHistoryLoading(false); return; }
    const rows = (r.data || []) as Approval[];
    const ids = Array.from(new Set(rows.map(x => x.approver_role_id).filter(Boolean))) as string[];
    if (ids.length) {
      const rr = await supabase.from('roles').select('id, name').in('id', ids);
      const map: Record<string,string> = {};
      for (const x of rr.data || []) map[x.id] = x.name;
      rows.forEach(x => { x.role_name = x.approver_role_id ? map[x.approver_role_id] : undefined; });
    }
    setHistory(rows); setHistoryLoading(false);
  }

  const lname = (id: string | null) => id ? locs[id]?.name || '—' : '—';
  const rname = (id: string | null) => id ? roles.find(r => r.id === id)?.name || '—' : '—';

  async function decide(decision: 'APPROVED'|'RETURNED'|'REJECTED') {
    if (!selected) return;
    if (decision !== 'APPROVED' && !remarks.trim()) {
      setError('Please enter remarks before returning or rejecting an application.'); return;
    }
    setProcessing(true); setError(''); setMessage('');
    try {
      const r = await supabase.rpc('process_staff_application', {
        p_application_id: selected.id, p_decision: decision, p_remarks: remarks.trim() || null
      });
      if (r.error) throw new Error(r.error.message);
      setMessage(decision === 'APPROVED' ? 'Application approved and forwarded to CEO review.'
        : decision === 'RETURNED' ? 'Application returned for correction.' : 'Application rejected.');
      setRemarks('');
      await load();
      await loadHistory(selected.id);
    } catch (e: any) { setError(e?.message || 'Unable to process application.'); }
    finally { setProcessing(false); }
  }

  const canAct = !!selected && selected.current_stage === 'HR' &&
    selected.status !== 'APPROVED' && selected.status !== 'REJECTED';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <img src="/branding/bodhi-rural-logo.png" alt="Bodhi Rural" className="h-16 w-auto object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Staff Application Review</h1>
                <p className="text-sm text-green-700">HR Review Panel · Bodhi Rural Livelihood & Agri Private Limited</p>
              </div>
            </div>
            <button onClick={load} disabled={loading} className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50">
              {loading ? 'Refreshing...' : 'Refresh Applications'}
            </button>
          </div>
        </header>

        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        {message && <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</div>}

        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <aside className="rounded-2xl bg-white shadow-sm">
            <div className="border-b p-4 space-y-2">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search application..." className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-green-600" />
              <select value={filter} onChange={e=>setFilter(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="ALL">All Applications</option><option value="HR">HR Review</option>
                <option value="CEO_REVIEW">CEO Review</option><option value="CHAIRMAN_REVIEW">Chairman Review</option>
                <option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="max-h-[calc(100vh-250px)] overflow-y-auto p-3">
              {loading ? <p className="p-6 text-center text-sm text-slate-500">Loading...</p> :
              filtered.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">No applications found.</p> :
              <div className="space-y-2">{filtered.map(a => (
                <button key={a.id} onClick={()=>setSelectedId(a.id)}
                  className={`w-full rounded-xl border p-4 text-left ${a.id===selectedId?'border-green-600 bg-green-50':'border-slate-200 hover:bg-slate-50'}`}>
                  <div className="flex justify-between gap-2">
                    <div><p className="font-bold">{a.application_number}</p><p className="text-sm font-semibold">{a.full_name}</p></div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">{a.current_stage}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{val(a.proposed_designation)}</p>
                  <p className="mt-1 text-xs text-slate-400">{fmt(a.submitted_at || a.created_at)}</p>
                </button>
              ))}</div>}
            </div>
          </aside>

          <section className="space-y-6">
            {!selected ? <div className="rounded-2xl bg-white p-10 text-center shadow-sm text-slate-500">Select an application.</div> :
            <>
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 border-b pb-5 md:flex-row md:justify-between">
                  <div><p className="text-xs font-bold uppercase tracking-wider text-green-700">Staff Application</p>
                    <h2 className="text-2xl font-bold">{selected.application_number}</h2>
                    <p className="text-lg font-semibold">{selected.full_name}</p></div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3"><p className="text-xs text-slate-500">Stage</p><p className="font-bold">{selected.current_stage}</p><p className="text-xs text-slate-500">Status: {selected.status}</p></div>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <Box title="Personal Information">
                    <Info l="Full Name" v={selected.full_name}/><Info l="Father / Husband" v={selected.father_husband_name}/>
                    <Info l="Date of Birth" v={selected.date_of_birth}/><Info l="Gender" v={selected.gender}/>
                    <Info l="Blood Group" v={selected.blood_group}/><Info l="Email" v={selected.email}/>
                    <Info l="Mobile" v={selected.mobile}/><Info l="Alternate Mobile" v={selected.alternate_mobile}/>
                    <Info l="Address" v={selected.address}/>
                  </Box>
                  <Box title="Current Location">
                    <Info l="State" v={lname(selected.state_id)}/><Info l="District" v={lname(selected.district_id)}/>
                    <Info l="Block" v={lname(selected.block_id)}/><Info l="Panchayat" v={lname(selected.panchayat_id)}/>
                    <Info l="Village" v={lname(selected.village_id)}/>
                  </Box>
                  <Box title="Education">
                    <Info l="Qualification" v={selected.highest_qualification}/><Info l="Course" v={selected.course}/>
                    <Info l="Institution" v={selected.institution}/><Info l="Passing Year" v={selected.passing_year}/>
                  </Box>
                  <Box title="Experience">
                    <Info l="Organization" v={selected.previous_organization}/><Info l="Designation" v={selected.previous_designation}/>
                    <Info l="Experience" v={selected.total_experience_years == null ? '—' : `${selected.total_experience_years} years`}/>
                  </Box>
                  <Box title="Proposed Employment">
                    <Info l="Department" v={selected.proposed_department}/><Info l="Designation" v={selected.proposed_designation}/>
                    <Info l="System Role" v={rname(selected.proposed_role_id)}/><Info l="State" v={lname(selected.proposed_state_id)}/>
                    <Info l="District" v={lname(selected.proposed_district_id)}/><Info l="Block" v={lname(selected.proposed_block_id)}/>
                    <Info l="Panchayat" v={lname(selected.proposed_panchayat_id)}/>
                  </Box>
                  <Box title="Application">
                    <Info l="Submitted" v={fmt(selected.submitted_at)}/><Info l="Created" v={fmt(selected.created_at)}/>
                    <Info l="Staff ID" v={selected.staff_id}/>
                  </Box>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold">Approval History</h3>
                {historyLoading ? <p className="mt-4 text-sm text-slate-500">Loading...</p> :
                history.length===0 ? <p className="mt-4 text-sm text-slate-500">No approval action recorded yet.</p> :
                <div className="mt-4 space-y-3">{history.map(h=><div key={h.id} className="rounded-xl border p-4">
                  <div className="flex justify-between gap-3"><div><p className="font-semibold">{h.stage}</p><p className="text-xs text-slate-500">{h.role_name || '—'}</p></div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${h.decision==='APPROVED'?'bg-green-100 text-green-800':h.decision==='REJECTED'?'bg-red-100 text-red-800':'bg-amber-100 text-amber-800'}`}>{h.decision}</span>
                  </div><p className="mt-2 text-sm text-slate-600">{h.remarks || 'No remarks.'}</p><p className="mt-2 text-xs text-slate-400">{fmt(h.decided_at)}</p>
                </div>)}</div>}
              </div>

              {canAct ? <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-green-900">HR Decision</h3>
                <p className="mt-1 text-sm text-green-800">Approval forwards the application to CEO review.</p>
                <textarea value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="HR remarks / observations" className="mt-4 min-h-[110px] w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:border-green-600"/>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <button disabled={processing} onClick={()=>decide('APPROVED')} className="rounded-lg bg-green-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{processing?'Processing...':'Approve & Forward'}</button>
                  <button disabled={processing} onClick={()=>decide('RETURNED')} className="rounded-lg bg-amber-600 px-4 py-3 font-semibold text-white disabled:opacity-50">Return for Correction</button>
                  <button disabled={processing} onClick={()=>decide('REJECTED')} className="rounded-lg bg-red-700 px-4 py-3 font-semibold text-white disabled:opacity-50">Reject Application</button>
                </div>
              </div> :
              <div className="rounded-2xl border bg-white p-5 text-sm text-slate-600">This application is currently at <strong>{selected.current_stage}</strong> and is not available for HR action.</div>}
            </>}
          </section>
        </div>
      </div>
    </main>
  );
}

function Box({title,children}:{title:string;children:React.ReactNode}) {
  return <div className="rounded-xl border border-slate-200 p-4"><h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-700">{title}</h3><div className="space-y-3">{children}</div></div>;
}
function Info({l,v}:{l:string;v:unknown}) {
  return <div className="flex flex-col gap-1 border-b border-slate-100 pb-2 last:border-0 sm:flex-row sm:justify-between"><span className="text-xs font-medium text-slate-500">{l}</span><span className="text-sm font-semibold text-slate-800 sm:max-w-[65%] sm:text-right">{val(v)}</span></div>;
}

