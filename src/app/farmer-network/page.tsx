import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BarChart3,
  ClipboardList,
  Handshake,
  MapPinned,
  Network,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Rural Network | Connected Rural Development',
  description:
    'Discover Bodhi Rural Network: a structured approach to coordinating field activity, programmes and regional reporting across rural India.',
  alternates: { canonical: '/farmer-network' },
};

const capabilities = [
  {
    icon: ClipboardList,
    title: 'Field operations',
    description:
      'Keep farmer, farm and activity records connected to the work taking place on the ground.',
  },
  {
    icon: Network,
    title: 'Programme coordination',
    description:
      'Give teams a shared structure for responsibilities, workflows and progress follow-up.',
  },
  {
    icon: BarChart3,
    title: 'Regional reporting',
    description:
      'Review information across programme and administrative levels to support timely decisions.',
  },
  {
    icon: ShieldCheck,
    title: 'Responsible information',
    description:
      'Use role-based access and purposeful records to support accountable operations.',
  },
];

const operatingLevels = [
  { label: 'Field activity', detail: 'Farmers, livelihoods and local delivery' },
  { label: 'Programme teams', detail: 'Coordination, follow-up and support' },
  { label: 'Regional oversight', detail: 'Consolidated reporting and learning' },
];

const principles = [
  {
    number: '01',
    title: 'Start with local context',
    description:
      'Programme design should reflect the livelihoods, resources and priorities of the communities it serves.',
  },
  {
    number: '02',
    title: 'Make progress visible',
    description:
      'Clear responsibilities and consistent records help partners follow implementation and identify what needs attention.',
  },
  {
    number: '03',
    title: 'Learn and adapt',
    description:
      'Structured reviews create room to improve delivery as field conditions and programme needs change.',
  },
];

export default function RuralNetworkPage() {
  return (
    <main className="rural-network-page">
      <style>{`
        .rural-network-page {
          --rn-ink: #18382b;
          --rn-green: #286447;
          --rn-green-dark: #153a2b;
          --rn-muted: #5d6e63;
          --rn-line: #dce4dd;
          --rn-soft: #f4f7f2;
          --rn-paper: #fbfcfa;
          --rn-gold: #bd9553;
          color: var(--rn-ink);
          background: #fff;
        }
        .rural-network-page *, .rural-network-page *::before, .rural-network-page *::after { box-sizing: border-box; }
        .rn-container { width: min(1180px, calc(100% - 48px)); margin: 0 auto; }
        .rn-hero { padding: 78px 0 76px; background: var(--rn-soft); overflow: hidden; }
        .rn-hero-grid { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(340px, .92fr); gap: 58px; align-items: center; }
        .rn-kicker { display: inline-flex; align-items: center; gap: 10px; color: var(--rn-green); font-size: 12px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
        .rn-kicker::before { content: ''; width: 28px; height: 2px; background: var(--rn-gold); }
        .rn-hero h1, .rn-section h2, .rn-cta h2 { color: var(--rn-ink); font-family: Georgia, 'Times New Roman', serif; font-weight: 500; letter-spacing: -.035em; }
        .rn-hero h1 { max-width: 720px; margin: 19px 0 20px; font-size: clamp(42px, 5.4vw, 68px); line-height: 1.04; }
        .rn-lead { max-width: 690px; margin: 0; color: #4f6256; font-size: 18px; line-height: 1.8; }
        .rn-hero-note { max-width: 670px; margin: 18px 0 0; color: var(--rn-muted); font-size: 15px; line-height: 1.75; }
        .rn-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
        .rn-button { display: inline-flex; min-height: 50px; align-items: center; justify-content: center; padding: 0 21px; border: 1px solid var(--rn-green-dark); background: var(--rn-green-dark); color: #fff; font-size: 14px; font-weight: 750; text-decoration: none; transition: background .18s ease, color .18s ease; }
        .rn-button:hover { background: var(--rn-green); }
        .rn-button-secondary { background: transparent; color: var(--rn-green-dark); }
        .rn-button-secondary:hover { background: #e7eee8; color: var(--rn-green-dark); }
        .rn-diagram { position: relative; min-height: 365px; display: grid; place-items: center; padding: 24px; border: 1px solid #d7e1d8; background: radial-gradient(circle at center, #fff 0, #fff 29%, transparent 30%), linear-gradient(135deg, #e6eee7, #f6f7ef); }
        .rn-diagram::before, .rn-diagram::after { content: ''; position: absolute; width: 67%; height: 1px; background: #b8cabc; transform: rotate(28deg); }
        .rn-diagram::after { transform: rotate(-28deg); }
        .rn-diagram-center { z-index: 1; width: 148px; height: 148px; display: grid; place-items: center; border: 1px solid #d0ddd1; border-radius: 50%; background: #fff; box-shadow: 0 12px 34px rgba(22, 58, 43, .10); text-align: center; }
        .rn-diagram-center span { display: block; max-width: 106px; color: var(--rn-green-dark); font-family: Georgia, 'Times New Roman', serif; font-size: 21px; line-height: 1.15; }
        .rn-node { position: absolute; z-index: 2; width: 132px; padding: 14px 12px; border: 1px solid #dce4dd; background: #fff; box-shadow: 0 8px 22px rgba(22, 58, 43, .07); text-align: center; }
        .rn-node svg { width: 19px; height: 19px; margin-bottom: 6px; color: var(--rn-green); }
        .rn-node strong { display: block; color: var(--rn-ink); font-size: 13px; }
        .rn-node small { display: block; margin-top: 3px; color: var(--rn-muted); font-size: 12px; line-height: 1.4; }
        .rn-node-top { top: 22px; left: 50%; transform: translateX(-50%); }
        .rn-node-right { right: 17px; top: 50%; transform: translateY(-50%); }
        .rn-node-bottom { bottom: 22px; left: 50%; transform: translateX(-50%); }
        .rn-node-left { left: 17px; top: 50%; transform: translateY(-50%); }
        .rn-section { padding: 82px 0; }
        .rn-section-soft { background: var(--rn-paper); }
        .rn-section-heading { max-width: 760px; margin-bottom: 35px; }
        .rn-section h2 { margin: 14px 0 0; font-size: clamp(32px, 4vw, 48px); line-height: 1.12; }
        .rn-section-heading p { max-width: 690px; margin: 16px 0 0; color: var(--rn-muted); font-size: 16px; line-height: 1.8; }
        .rn-capability-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid var(--rn-line); border-left: 1px solid var(--rn-line); }
        .rn-capability { min-height: 242px; padding: 25px 22px; border-right: 1px solid var(--rn-line); border-bottom: 1px solid var(--rn-line); background: #fff; }
        .rn-icon-box { width: 43px; height: 43px; display: grid; place-items: center; background: #eaf1eb; color: var(--rn-green); }
        .rn-icon-box svg { width: 21px; height: 21px; }
        .rn-capability h3 { margin: 22px 0 9px; color: var(--rn-ink); font-size: 19px; letter-spacing: -.015em; }
        .rn-capability p { margin: 0; color: var(--rn-muted); font-size: 14px; line-height: 1.75; }
        .rn-levels { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid var(--rn-line); border-bottom: 1px solid var(--rn-line); }
        .rn-level { position: relative; min-height: 170px; padding: 25px 28px 25px 0; }
        .rn-level + .rn-level { padding-left: 28px; border-left: 1px solid var(--rn-line); }
        .rn-level-index { color: #96713a; font-size: 12px; font-weight: 800; letter-spacing: .12em; }
        .rn-level h3 { margin: 18px 0 8px; color: var(--rn-ink); font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 500; }
        .rn-level p { max-width: 270px; margin: 0; color: var(--rn-muted); font-size: 14px; line-height: 1.7; }
        .rn-principles { padding: 78px 0 84px; background: var(--rn-green-dark); color: #fff; }
        .rn-principles .rn-kicker { color: #d7e7d9; }
        .rn-principles h2 { max-width: 700px; margin: 14px 0 34px; color: #fff; font-family: Georgia, 'Times New Roman', serif; font-size: clamp(32px, 4vw, 46px); font-weight: 500; line-height: 1.12; letter-spacing: -.03em; }
        .rn-principle-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid rgba(255,255,255,.25); }
        .rn-principle { padding: 24px 25px 0 0; }
        .rn-principle + .rn-principle { padding-left: 25px; border-left: 1px solid rgba(255,255,255,.25); }
        .rn-principle span { color: #ddbd80; font-size: 12px; font-weight: 800; letter-spacing: .12em; }
        .rn-principle h3 { margin: 20px 0 9px; color: #fff; font-size: 19px; }
        .rn-principle p { margin: 0; color: #dce7de; font-size: 14px; line-height: 1.75; }
        .rn-cta { padding: 68px 0; background: #f1f5f0; }
        .rn-cta-row { display: flex; align-items: center; justify-content: space-between; gap: 28px; }
        .rn-cta h2 { max-width: 700px; margin: 13px 0 0; font-size: clamp(30px, 3.8vw, 43px); line-height: 1.13; }
        .rn-cta p { max-width: 650px; margin: 12px 0 0; color: var(--rn-muted); font-size: 15px; line-height: 1.7; }
        @media (max-width: 980px) {
          .rn-hero-grid { grid-template-columns: 1fr; gap: 38px; }
          .rn-diagram { min-height: 340px; }
          .rn-capability-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 680px) {
          .rn-container { width: min(100% - 36px, 540px); }
          .rn-hero { padding: 54px 0 58px; }
          .rn-lead { font-size: 16px; }
          .rn-section { padding: 60px 0; }
          .rn-capability-grid, .rn-levels, .rn-principle-grid { grid-template-columns: 1fr; }
          .rn-capability { min-height: 0; padding: 21px; }
          .rn-level, .rn-level + .rn-level { min-height: 0; padding: 22px 0; border-left: 0; }
          .rn-level + .rn-level { border-top: 1px solid var(--rn-line); }
          .rn-level h3 { margin-top: 12px; }
          .rn-principles { padding: 60px 0; }
          .rn-principle, .rn-principle + .rn-principle { padding: 22px 0; border-left: 0; }
          .rn-principle + .rn-principle { border-top: 1px solid rgba(255,255,255,.25); }
          .rn-cta { padding: 58px 0; }
          .rn-cta-row { display: block; }
          .rn-cta .rn-button { margin-top: 24px; }
        }
        @media (max-width: 430px) {
          .rn-container { width: calc(100% - 30px); }
          .rn-actions { display: grid; grid-template-columns: 1fr; }
          .rn-button { width: 100%; }
          .rn-diagram { min-height: 315px; }
          .rn-node { width: 112px; padding: 11px 8px; }
          .rn-node-left { left: 4px; }
          .rn-node-right { right: 4px; }
          .rn-diagram-center { width: 128px; height: 128px; }
        }
        @media (prefers-reduced-motion: reduce) { .rn-button { transition: none; } }
      `}</style>

      <section className="rn-hero">
        <div className="rn-container rn-hero-grid">
          <div>
            <span className="rn-kicker">Rural Network · Programme coordination</span>
            <h1>A connected operating model for rural development.</h1>
            <p className="rn-lead">
              Rural Network brings field activity, programme coordination and
              regional reporting into one structured digital workspace.
            </p>
            <p className="rn-hero-note">
              Built around the realities of agriculture and allied livelihoods,
              it helps teams organise information from local delivery through
              to management review.
            </p>
            <div className="rn-actions">
              <Link href="/contact" className="rn-button">Discuss a partnership</Link>
              <Link href="/about" className="rn-button rn-button-secondary">Our organisation</Link>
            </div>
          </div>

          <div className="rn-diagram" role="img" aria-label="Rural Network brings field teams, farmers, programme teams and regional oversight into a coordinated model">
            <div className="rn-diagram-center"><span>Rural Network</span></div>
            <div className="rn-node rn-node-top"><UsersRound aria-hidden="true" /><strong>People</strong><small>Farmers &amp; teams</small></div>
            <div className="rn-node rn-node-right"><MapPinned aria-hidden="true" /><strong>Place</strong><small>Local context</small></div>
            <div className="rn-node rn-node-bottom"><ClipboardList aria-hidden="true" /><strong>Programmes</strong><small>Activities &amp; follow-up</small></div>
            <div className="rn-node rn-node-left"><BarChart3 aria-hidden="true" /><strong>Progress</strong><small>Reporting &amp; learning</small></div>
          </div>
        </div>
      </section>

      <section className="rn-section">
        <div className="rn-container">
          <div className="rn-section-heading">
            <span className="rn-kicker">A practical digital foundation</span>
            <h2>Make rural programmes easier to coordinate and understand.</h2>
            <p>
              The platform is organised around everyday operational needs: clear
              records, shared workflows and useful information for decisions.
            </p>
          </div>
          <div className="rn-capability-grid">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <article className="rn-capability" key={title}>
                <div className="rn-icon-box"><Icon aria-hidden="true" /></div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rn-section rn-section-soft">
        <div className="rn-container">
          <div className="rn-section-heading">
            <span className="rn-kicker">A clear line of sight</span>
            <h2>Connect local delivery with programme oversight.</h2>
            <p>
              Information can move through three connected levels, helping
              teams stay close to local activity while supporting a wider view
              of implementation.
            </p>
          </div>
          <div className="rn-levels">
            {operatingLevels.map((level, index) => (
              <article className="rn-level" key={level.label}>
                <span className="rn-level-index">LEVEL 0{index + 1}</span>
                <h3>{level.label}</h3>
                <p>{level.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rn-principles">
        <div className="rn-container">
          <span className="rn-kicker">How we build for the field</span>
          <h2>Useful systems begin with people, context and accountability.</h2>
          <div className="rn-principle-grid">
            {principles.map((principle) => (
              <article className="rn-principle" key={principle.number}>
                <span>{principle.number}</span>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rn-cta">
        <div className="rn-container rn-cta-row">
          <div>
            <span className="rn-kicker">Work with Bodhi Rural</span>
            <h2>Explore a programme or platform partnership.</h2>
            <p>We welcome conversations with development organisations, institutions, responsible businesses and technology partners.</p>
          </div>
          <Link href="/contact" className="rn-button">Contact our team</Link>
        </div>
      </section>
    </main>
  );
}

