import Link from 'next/link';
import { CalendarDays, ExternalLink, GraduationCap, PlayCircle, Video } from 'lucide-react';
import { createClient } from '../../lib/supabase/server';

export const metadata = {
  title: 'Skills & Training | Bodhi Rural',
  description: 'Practical learning resources and online training sessions for farmers and rural enterprises.',
};

type TrainingResource = {
  id: string;
  title: string;
  skill_area: string;
  description: string;
  video_url: string | null;
  meeting_url: string | null;
  session_at: string | null;
};

function formatSession(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
}

export default async function SkillsTrainingPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('skills_training_resources')
    .select('id, title, skill_area, description, video_url, meeting_url, session_at')
    .eq('status', 'PUBLISHED')
    .order('session_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });
  const resources = (data || []) as TrainingResource[];

  return (
    <main className="min-h-screen bg-[#f5f7f2] text-[#183426]">
      <section className="bg-[#17482f] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.3fr_.7fr] lg:items-end lg:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b9d2b8]">Bodhi Rural Learning</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">Skills that grow with every season.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/80">Explore practical training for agriculture, allied livelihoods and rural enterprise. Watch a short lesson or join a live session from your phone or computer.</p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/10 p-6 sm:p-7">
            <GraduationCap aria-hidden="true" className="text-[#f2c66d]" size={30} />
            <h2 className="mt-4 text-xl font-semibold">Learn online, apply locally</h2>
            <p className="mt-2 text-sm leading-6 text-white/75">Training links are reviewed by Bodhi Rural before they appear here. Live sessions include a direct Google Meet, Zoom or Teams join link when available.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#68806c]">Learning library</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Video lessons & live sessions</h2>
          </div>
          <p className="text-sm text-[#607265]">{resources.length} published resource{resources.length === 1 ? '' : 's'}</p>
        </div>

        {error ? (
          <div role="status" className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-950">
            Training resources are being prepared. Please check again soon or <a className="font-bold underline" href="mailto:bodhirural@gmail.com,ceo@brlps.co.in">contact our team</a>.
          </div>
        ) : resources.length ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => (
              <article key={resource.id} className="flex flex-col rounded-3xl border border-[#e0e8de] bg-white p-6 shadow-sm">
                <span className="w-fit rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-bold text-[#356344]">{resource.skill_area}</span>
                <h3 className="mt-4 text-xl font-semibold">{resource.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-[#5c6e62]">{resource.description}</p>
                {resource.session_at && (
                  <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#52685a]">
                    <CalendarDays aria-hidden="true" size={16} /> {formatSession(resource.session_at)} IST
                  </p>
                )}
                <div className="mt-6 flex flex-wrap gap-3 border-t border-[#edf0eb] pt-5">
                  {resource.video_url && (
                    <a href={resource.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1c643f] px-4 py-2 text-sm font-bold text-white hover:bg-[#154b30]">
                      <PlayCircle aria-hidden="true" size={17} /> Watch lesson <ExternalLink aria-hidden="true" size={14} />
                    </a>
                  )}
                  {resource.meeting_url && (
                    <a href={resource.meeting_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#cbd9cc] px-4 py-2 text-sm font-bold text-[#20563a] hover:bg-[#f2f7ef]">
                      <Video aria-hidden="true" size={17} /> Join live training <ExternalLink aria-hidden="true" size={14} />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-[#c8d7c8] bg-white px-6 py-14 text-center">
            <GraduationCap aria-hidden="true" className="mx-auto text-[#578062]" size={38} />
            <h3 className="mt-4 text-xl font-semibold">New learning resources are on the way</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#607265]">Video lessons and live training links will appear here after our team publishes them.</p>
            <a href="mailto:bodhirural@gmail.com,ceo@brlps.co.in?subject=Skills%20and%20training%20enquiry" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#1c643f] px-5 py-2 text-sm font-bold text-white hover:bg-[#154b30]">Ask about training</a>
          </div>
        )}

        <div className="mt-12 rounded-3xl bg-[#eaf1e7] p-6 sm:p-8">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-xl font-semibold">Want to host a farmer training?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52685a]">Share your proposed topic, video or meeting link with our team. We can help coordinate an online session for farmers and rural enterprises.</p>
            </div>
            <Link href="/contact" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#9bb79d] px-5 py-2 text-sm font-bold text-[#20563a] hover:bg-white">Contact Bodhi Rural</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

