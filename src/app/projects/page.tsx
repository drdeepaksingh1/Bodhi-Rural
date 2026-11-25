import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpenCheck,
  Building2,
  Fish,
  Handshake,
  MapPinned,
  Network,
  Store,
  UsersRound,
  Wheat,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Projects & Partnerships | Bodhi Rural',
  description:
    'Explore Bodhi Rural’s focus areas and partnership approach across agriculture, allied livelihoods, rural enterprise and market access in India.',
  alternates: { canonical: '/projects' },
};

const focusAreas = [
  {
    icon: Wheat,
    label: '01 · Agriculture',
    title: 'Productive, resilient farming',
    description:
      'Support farming systems across crops, horticulture, soil health, water stewardship and sustainable production practices.',
  },
  {
    icon: Fish,
    label: '02 · Allied livelihoods',
    title: 'Livestock and aquatic systems',
    description:
      'Build livelihood pathways across dairy, cattle, goats, poultry, ducks, piggery and fisheries, shaped to local conditions.',
  },
  {
    icon: UsersRound,
    label: '03 · People & institutions',
    title: 'Skills, inclusion and organisation',
    description:
      'Strengthen practical skills, community participation and the capacity of producer and local institutions.',
  },
  {
    icon: Store,
    label: '04 · Enterprise',
    title: 'Value addition and rural business',
    description:
      'Explore aggregation, processing, packaging and distribution models that create stronger rural enterprises.',
  },
  {
    icon: Network,
    label: '05 · Market systems',
    title: 'Services and market access',
    description:
      'Connect producers with relevant inputs, services, buyers and dependable routes to market.',
  },
  {
    icon: BookOpenCheck,
    label: '06 · Digital enablement',
    title: 'Information for better decisions',
    description:
      'Use fit-for-purpose digital tools to organise operations, follow programme progress and make information more useful.',
  },
];

const deliverySteps = [
  {
    number: '01',
    title: 'Understand the context',
    description: 'Listen to local priorities, existing capabilities, risks and the wider market environment.',
  },
  {
    number: '02',
    title: 'Design with partners',
    description: 'Agree the objectives, roles, delivery model and measures of progress before implementation.',
  },
  {
    number: '03',
    title: 'Deliver with accountability',
    description: 'Coordinate people, services and resources with clear responsibilities and regular review.',
  },
  {
    number: '04',
    title: 'Measure, learn and adapt',
    description: 'Use agreed evidence and feedback to understand what is working and improve the approach.',
  },
];

const partnerTypes = [
  {
    icon: Building2,
    title: 'Development organisations',
    description: 'Co-design livelihood and rural development programmes with clear objectives and measurable learning.',
  },
  {
    icon: Handshake,
    title: 'Public and community institutions',
    description: 'Coordinate locally grounded initiatives with appropriate institutions and community organisations.',
  },
  {
    icon: Store,
    title: 'Responsible businesses',
    description: 'Build practical links between producers, service providers, processors and buyers.',
  },
  {
    icon: Network,
    title: 'Research and technology teams',
    description: 'Adapt knowledge and digital services to the realities of rural delivery and field operations.',
  },
];

export default function ProjectsPage() {
  return (
    <main className="rural-projects-page">
      <style>{`
        .rural-projects-page {
          --rp-ink: #18382b;
          --rp-green: #286447;
          --rp-dark: #153a2b;
          --rp-muted: #5d6e63;
          --rp-line: #dce4dd;
          --rp-soft: #f4f7f2;
          --rp-paper: #fbfcfa;
          --rp-gold: #bd9553;
          color: var(--rp-ink);
          background: #fff;
        }
        .rural-projects-page *, .rural-projects-page *::before, .rural-projects-page *::after { box-sizing: border-box; }
        .rp-container { width: min(1180px, calc(100% - 48px)); margin: 0 auto; }
        .rp-hero { position: relative; padding: 82px 0 78px; overflow: hidden; background: var(--rp-soft); }
        .rp-hero::after { content: ''; position: absolute; right: -130px; bottom: -245px; width: 500px; height: 500px; border: 1px solid #d7e1d8; border-radius: 50%; box-shadow: 0 0 0 54px rgba(255,255,255,.32), 0 0 0 108px rgba(255,255,255,.22); pointer-events: none; }
        .rp-hero-grid { position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(300px, .9fr); gap: 62px; align-items: end; }
        .rp-kicker { display: inline-flex; align-items: center; gap: 10px; color: var(--rp-green); font-size: 12px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
        .rp-kicker::before { content: ''; width: 28px; height: 2px; background: var(--rp-gold); }
        .rp-hero h1, .rp-section h2, .rp-partner h2, .rp-cta h2 { color: var(--rp-ink); font-family: Georgia, 'Times New Roman', serif; font-weight: 500; letter-spacing: -.035em; }
        .rp-hero h1 { max-width: 740px; margin: 18px 0 18px; font-size: clamp(42px, 5.5vw, 68px); line-height: 1.04; }
        .rp-lead { max-width: 730px; margin: 0; color: #4f6256; font-size: 18px; line-height: 1.8; }
        .rp-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
        .rp-button { display: inline-flex; min-height: 50px; align-items: center; justify-content: center; padding: 0 21px; border: 1px solid var(--rp-dark); background: var(--rp-dark); color: #fff; font-size: 14px; font-weight: 750; text-decoration: none; transition: background .18s ease, color .18s ease; }
        .rp-button:hover { background: var(--rp-green); }
        .rp-button-secondary { background: transparent; color: var(--rp-dark); }
        .rp-button-secondary:hover { background: #e7eee8; color: var(--rp-dark); }
        .rp-hero-aside { max-width: 430px; justify-self: end; padding: 27px; border-left: 3px solid var(--rp-gold); background: rgba(255,255,255,.72); }
        .rp-hero-aside svg { width: 24px; height: 24px; color: var(--rp-green); }
        .rp-hero-aside strong { display: block; margin-top: 17px; color: var(--rp-ink); font-size: 16px; }
        .rp-hero-aside p { margin: 8px 0 0; color: var(--rp-muted); font-size: 14px; line-height: 1.75; }
        .rp-section { padding: 82px 0; }
        .rp-section-soft { background: var(--rp-paper); }
        .rp-section-heading { max-width: 770px; margin-bottom: 36px; }
        .rp-section h2, .rp-partner h2 { margin: 14px 0 0; font-size: clamp(32px, 4vw, 48px); line-height: 1.12; }
        .rp-section-heading p { max-width: 730px; margin: 16px 0 0; color: var(--rp-muted); font-size: 16px; line-height: 1.8; }
        .rp-transparency { display: flex; gap: 13px; align-items: flex-start; margin: 25px 0 0; padding: 16px 18px; border: 1px solid var(--rp-line); background: #fff; color: var(--rp-muted); font-size: 13px; line-height: 1.65; }
        .rp-transparency svg { width: 18px; height: 18px; flex: 0 0 auto; margin-top: 1px; color: var(--rp-green); }
        .rp-focus-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid var(--rp-line); border-left: 1px solid var(--rp-line); }
        .rp-focus-card { min-height: 255px; display: flex; flex-direction: column; padding: 25px 24px; border-right: 1px solid var(--rp-line); border-bottom: 1px solid var(--rp-line); background: #fff; }
        .rp-focus-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .rp-focus-top span { color: #8a6b39; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
        .rp-icon-box { width: 42px; height: 42px; display: grid; place-items: center; background: #eaf1eb; color: var(--rp-green); }
        .rp-icon-box svg { width: 20px; height: 20px; }
        .rp-focus-card h3 { margin: 25px 0 9px; color: var(--rp-ink); font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 500; line-height: 1.22; }
        .rp-focus-card p { margin: 0; color: var(--rp-muted); font-size: 14px; line-height: 1.75; }
        .rp-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid var(--rp-line); }
        .rp-step { padding: 23px 23px 0 0; }
        .rp-step + .rp-step { padding-left: 23px; border-left: 1px solid var(--rp-line); }
        .rp-step-index { color: #8a6b39; font-size: 12px; font-weight: 800; letter-spacing: .13em; }
        .rp-step h3 { margin: 20px 0 9px; color: var(--rp-ink); font-size: 18px; line-height: 1.3; }
        .rp-step p { margin: 0; color: var(--rp-muted); font-size: 14px; line-height: 1.75; }
        .rp-partner { padding: 80px 0 84px; background: var(--rp-dark); color: #fff; }
        .rp-partner .rp-kicker { color: #d7e7d9; }
        .rp-partner h2 { max-width: 760px; color: #fff; }
        .rp-partner-intro { max-width: 720px; margin: 15px 0 36px; color: #dce7de; font-size: 16px; line-height: 1.8; }
        .rp-partner-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid rgba(255,255,255,.24); }
        .rp-partner-card { padding: 24px 20px 0 0; }
        .rp-partner-card + .rp-partner-card { padding-left: 20px; border-left: 1px solid rgba(255,255,255,.24); }
        .rp-partner-card .rp-icon-box { background: rgba(255,255,255,.12); color: #e6ca91; }
        .rp-partner-card h3 { margin: 17px 0 8px; color: #fff; font-size: 16px; line-height: 1.4; }
        .rp-partner-card p { margin: 0; color: #dce7de; font-size: 13px; line-height: 1.7; }
        .rp-cta { padding: 68px 0; background: #f1f5f0; }
        .rp-cta-row { display: flex; align-items: center; justify-content: space-between; gap: 30px; }
        .rp-cta h2 { max-width: 720px; margin: 13px 0 0; font-size: clamp(30px, 3.8vw, 43px); line-height: 1.13; }
        .rp-cta p { max-width: 680px; margin: 12px 0 0; color: var(--rp-muted); font-size: 15px; line-height: 1.7; }
        @media (max-width: 980px) {
          .rp-hero-grid { grid-template-columns: 1fr; gap: 32px; }
          .rp-hero-aside { justify-self: start; max-width: 700px; }
          .rp-focus-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .rp-partner-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 26px; }
          .rp-partner-card:nth-child(3) { padding-left: 0; border-left: 0; }
        }
        @media (max-width: 680px) {
          .rp-container { width: min(100% - 36px, 540px); }
          .rp-hero { padding: 54px 0 58px; }
          .rp-lead { font-size: 16px; }
          .rp-section { padding: 60px 0; }
          .rp-focus-grid, .rp-steps, .rp-partner-grid { grid-template-columns: 1fr; }
          .rp-focus-card { min-height: 0; padding: 21px; }
          .rp-focus-card h3 { margin-top: 18px; }
          .rp-step, .rp-step + .rp-step { padding: 22px 0; border-left: 0; }
          .rp-step + .rp-step { border-top: 1px solid var(--rp-line); }
          .rp-step h3 { margin-top: 12px; }
          .rp-partner { padding: 60px 0; }
          .rp-partner-card, .rp-partner-card + .rp-partner-card { padding: 20px 0; border-left: 0; }
          .rp-partner-card + .rp-partner-card { border-top: 1px solid rgba(255,255,255,.24); }
          .rp-cta { padding: 58px 0; }
          .rp-cta-row { display: block; }
          .rp-cta .rp-button { margin-top: 24px; }
        }
        @media (max-width: 430px) {
          .rp-container { width: calc(100% - 30px); }
          .rp-actions { display: grid; grid-template-columns: 1fr; }
          .rp-button { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) { .rp-button { transition: none; } }
      `}</style>

      <section className="rp-hero">
        <div className="rp-container rp-hero-grid">
          <div>
            <span className="rp-kicker">Projects · Programmes · Partnerships</span>
            <h1>Practical pathways for a stronger rural economy.</h1>
            <p className="rp-lead">
              Bodhi Rural works across agriculture, allied livelihoods, rural
              enterprise and digital services. We bring these areas together
              to shape programmes around local priorities and lasting value.
            </p>
            <div className="rp-actions">
              <Link href="/contact" className="rp-button">Discuss a partnership</Link>
              <Link href="/about" className="rp-button rp-button-secondary">About Bodhi Rural</Link>
            </div>
          </div>
          <aside className="rp-hero-aside">
            <MapPinned aria-hidden="true" />
            <strong>Rooted in Bihar. Open to collaboration across India.</strong>
            <p>
              We welcome conversations with development organisations,
              institutions, responsible businesses and technical partners
              working toward inclusive rural progress.
            </p>
          </aside>
        </div>
      </section>

      <section className="rp-section">
        <div className="rp-container">
          <div className="rp-section-heading">
            <span className="rp-kicker">Areas of focus</span>
            <h2>Connected work across the rural livelihood system.</h2>
            <p>
              Rural livelihoods depend on more than production alone. Our focus
              spans natural resources, skills, services, enterprise and access
              to markets.
            </p>
            <div className="rp-transparency">
              <BookOpenCheck aria-hidden="true" />
              <span>
                This page describes Bodhi Rural’s focus areas and delivery
                approach. Project locations, partners, timelines and results
                are shared when they are verified and approved for publication.
              </span>
            </div>
          </div>
          <div className="rp-focus-grid">
            {focusAreas.map(({ icon: Icon, label, title, description }) => (
              <article className="rp-focus-card" key={label}>
                <div className="rp-focus-top">
                  <span>{label}</span>
                  <div className="rp-icon-box"><Icon aria-hidden="true" /></div>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rp-section rp-section-soft">
        <div className="rp-container">
          <div className="rp-section-heading">
            <span className="rp-kicker">Our delivery approach</span>
            <h2>Designed with communities. Delivered with partners. Improved with evidence.</h2>
            <p>
              A consistent approach helps keep programmes relevant to local
              needs while making responsibilities and learning clear.
            </p>
          </div>
          <div className="rp-steps">
            {deliverySteps.map((step) => (
              <article className="rp-step" key={step.number}>
                <span className="rp-step-index">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rp-partner">
        <div className="rp-container">
          <span className="rp-kicker">Who we work with</span>
          <h2>Partnerships that connect local capability with wider opportunity.</h2>
          <p className="rp-partner-intro">
            We are interested in collaborations that are locally grounded,
            clearly governed and focused on practical outcomes for rural
            communities.
          </p>
          <div className="rp-partner-grid">
            {partnerTypes.map(({ icon: Icon, title, description }) => (
              <article className="rp-partner-card" key={title}>
                <div className="rp-icon-box"><Icon aria-hidden="true" /></div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rp-cta">
        <div className="rp-container rp-cta-row">
          <div>
            <span className="rp-kicker">Start a conversation</span>
            <h2>Have a rural development challenge to work on together?</h2>
            <p>Share your programme goals, geography and partnership needs with our team.</p>
          </div>
          <Link href="/contact" className="rp-button">Contact our team</Link>
        </div>
      </section>
    </main>
  );
}

