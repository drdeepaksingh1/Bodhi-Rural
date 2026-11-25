import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import LogoutButton from '../../../components/LogoutButton';

const PAGE_PATH = '/dashboard/marketplace/training';
const PUBLIC_PATH = '/skills-training';
const ALLOWED_ROLES = ['SUPER_ADMIN', 'CEO', 'CORPORATE_ADMIN'];

async function getAuthorizedAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name, role_id, is_active').eq('id', user.id).single();
  if (!profile || profile.is_active !== true) redirect('/dashboard');
  const { data: role } = await supabase.from('roles').select('code, name').eq('id', profile.role_id).single();
  if (!role || !ALLOWED_ROLES.includes(role.code)) redirect('/dashboard');
  return { supabase, user, profile, role };
}

function safeHttpsUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function validMeetingUrl(value: string) {
  if (!value) return true;
  const safeUrl = safeHttpsUrl(value);
  if (!safeUrl) return false;
  const host = new URL(safeUrl).hostname.toLowerCase();
  return host === 'meet.google.com' || host === 'zoom.us' || host.endsWith('.zoom.us') || host === 'teams.microsoft.com';
}

async function createTrainingResource(formData: FormData) {
  'use server';
  const { supabase, user } = await getAuthorizedAdmin();
  const title = String(formData.get('title') || '').trim();
  const skillArea = String(formData.get('skill_area') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const rawVideoUrl = String(formData.get('video_url') || '').trim();
  const rawMeetingUrl = String(formData.get('meeting_url') || '').trim();
  const videoUrl = rawVideoUrl ? safeHttpsUrl(rawVideoUrl) : null;
  const meetingUrl = rawMeetingUrl ? safeHttpsUrl(rawMeetingUrl) : null;
  const sessionValue = String(formData.get('session_at') || '').trim();
  const shouldPublish = formData.get('status') === 'PUBLISHED';

  if (title.length < 3 || title.length > 160 || skillArea.length < 2 || skillArea.length > 80 || description.length < 10 || description.length > 1200) {
    redirect(`${PAGE_PATH}?notice=invalid-details`);
  }
  if ((rawVideoUrl && !videoUrl) || (rawMeetingUrl && !meetingUrl) || !validMeetingUrl(rawMeetingUrl) || (!videoUrl && !meetingUrl)) {
    redirect(`${PAGE_PATH}?notice=invalid-links`);
  }

  let sessionAt: string | null = null;
  if (sessionValue) {
    const parsedDate = new Date(`${sessionValue}+05:30`);
    if (Number.isNaN(parsedDate.getTime())) redirect(`${PAGE_PATH}?notice=invalid-date`);
    sessionAt = parsedDate.toISOString();
  }

  const { error } = await supabase.from('skills_training_resources').insert({
    title,
    skill_area: skillArea,
    description,
    video_url: videoUrl,
    meeting_url: meetingUrl,
    session_at: sessionAt,
    status: shouldPublish ? 'PUBLISHED' : 'DRAFT',
    created_by: user.id,
  });
  if (error) redirect(`${PAGE_PATH}?notice=save-failed`);
  revalidatePath(PUBLIC_PATH);
  revalidatePath(PAGE_PATH);
  redirect(`${PAGE_PATH}?notice=${shouldPublish ? 'published' : 'saved'}`);
}

async function updateTrainingStatus(formData: FormData) {
  'use server';
  const { supabase } = await getAuthorizedAdmin();
  const id = String(formData.get('id') || '').trim();
  const status = String(formData.get('status') || '').trim();
  if (!id || !['DRAFT', 'PUBLISHED'].includes(status)) redirect(`${PAGE_PATH}?notice=invalid-details`);
  const { error } = await supabase.from('skills_training_resources').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) redirect(`${PAGE_PATH}?notice=save-failed`);
  revalidatePath(PUBLIC_PATH);
  revalidatePath(PAGE_PATH);
  redirect(`${PAGE_PATH}?notice=updated`);
}

async function deleteTrainingResource(formData: FormData) {
  'use server';
  const { supabase } = await getAuthorizedAdmin();
  const id = String(formData.get('id') || '').trim();
  if (!id) redirect(`${PAGE_PATH}?notice=invalid-details`);
  const { error } = await supabase.from('skills_training_resources').delete().eq('id', id);
  if (error) redirect(`${PAGE_PATH}?notice=save-failed`);
  revalidatePath(PUBLIC_PATH);
  revalidatePath(PAGE_PATH);
  redirect(`${PAGE_PATH}?notice=deleted`);
}

const notices: Record<string, string> = {
  published: 'Training resource published.',
  saved: 'Training resource saved as a draft.',
  updated: 'Training resource status updated.',
  deleted: 'Training resource removed.',
  'invalid-details': 'Check the title, skill area and description, then try again.',
  'invalid-links': 'Use secure HTTPS video links and Google Meet, Zoom or Microsoft Teams meeting links. Add at least one link.',
  'invalid-date': 'Enter a valid session date and time.',
  'save-failed': 'The resource could not be saved. Check access and try again.',
};

type Resource = {
  id: string;
  title: string;
  skill_area: string;
  description: string;
  video_url: string | null;
  meeting_url: string | null;
  session_at: string | null;
  status: string;
  created_at: string;
};

export default async function SkillsTrainingAdminPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const [{ supabase, profile, role }, params] = await Promise.all([getAuthorizedAdmin(), searchParams]);
  const { data, error } = await supabase.from('skills_training_resources').select('id, title, skill_area, description, video_url, meeting_url, session_at, status, created_at').order('created_at', { ascending: false });
  const resources = (data || []) as Resource[];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-green-700">Bodhi Rural · Management</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Skills &amp; Training</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Add reviewed video lessons and schedule farmer training with secure meeting links.</p>
            <p className="mt-2 text-xs text-slate-500">{profile.full_name || role.name} · Authorized administrator</p>
          </div>
          <div className="flex gap-2"><Link href="/skills-training" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">View public page</Link><LogoutButton /></div>
        </header>

        {params.notice && notices[params.notice] && <p role="status" className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">{notices[params.notice]}</p>}
        {error && <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">Could not load the training resources.</p>}

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-bold text-slate-900">Add a lesson or live training</h2>
          <p className="mt-1 text-sm text-slate-600">Video links can be from YouTube, Vimeo or another HTTPS website. Live links can use Google Meet, Zoom or Microsoft Teams.</p>
          <form action={createTrainingResource} className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">Training title<input name="title" required minLength={3} maxLength={160} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="e.g. Safe mushroom cultivation" /></label>
            <label className="block text-sm font-semibold text-slate-700">Skill area<input name="skill_area" required minLength={2} maxLength={80} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="Crop production, livestock, enterprise…" /></label>
            <label className="block text-sm font-semibold text-slate-700 md:col-span-2">Short description<textarea name="description" required minLength={10} maxLength={1200} rows={3} className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-normal" placeholder="What participants will learn and who the session is for" /></label>
            <label className="block text-sm font-semibold text-slate-700">Video lesson URL <span className="font-normal text-slate-500">(optional)</span><input name="video_url" type="url" maxLength={2000} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="https://www.youtube.com/watch?v=…" /></label>
            <label className="block text-sm font-semibold text-slate-700">Google Meet / Zoom / Teams URL <span className="font-normal text-slate-500">(optional)</span><input name="meeting_url" type="url" maxLength={2000} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" placeholder="https://meet.google.com/…" /></label>
            <label className="block text-sm font-semibold text-slate-700">Live session date &amp; time <span className="font-normal text-slate-500">(India time, optional)</span><input name="session_at" type="datetime-local" className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 font-normal" /></label>
            <label className="flex items-center gap-3 self-end rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-700"><input name="status" value="PUBLISHED" type="checkbox" className="h-4 w-4 accent-green-700" /> Publish on the public training page</label>
            <div className="md:col-span-2"><button type="submit" className="min-h-11 rounded-lg bg-green-800 px-5 py-2 text-sm font-bold text-white hover:bg-green-900">Save training resource</button></div>
          </form>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-bold text-slate-900">Saved resources</h2><p className="mt-1 text-sm text-slate-600">Drafts stay private. Published resources appear on Skills &amp; Training.</p></div><span className="text-sm text-slate-500">{resources.length} total</span></div>
          <div className="space-y-4">
            {resources.map((resource) => (
              <article key={resource.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${resource.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>{resource.status}</span><span className="text-xs font-semibold text-slate-500">{resource.skill_area}</span></div><h3 className="mt-3 text-lg font-bold text-slate-900">{resource.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{resource.description}</p><p className="mt-2 break-all text-xs text-slate-500">{resource.video_url || ''}{resource.video_url && resource.meeting_url ? ' · ' : ''}{resource.meeting_url || ''}</p></div>
                  <div className="flex flex-wrap gap-2">
                    <form action={updateTrainingStatus}><input type="hidden" name="id" value={resource.id} /><input type="hidden" name="status" value={resource.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'} /><button className="min-h-10 rounded-lg border border-green-700 px-3 py-2 text-xs font-bold text-green-800">{resource.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</button></form>
                    <form action={deleteTrainingResource}><input type="hidden" name="id" value={resource.id} /><button className="min-h-10 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Remove</button></form>
                  </div>
                </div>
              </article>
            ))}
            {!resources.length && !error && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No training resources yet. Add your first video or live session above.</div>}
          </div>
        </section>
      </div>
    </main>
  );
}

