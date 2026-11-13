import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Rural Network',
  description: 'Explore Rural Network, a digital workspace for rural operations, information and programme coordination.',
  alternates: { canonical: '/farmer-network' },
};

const capabilities = [
  {
    number: '01',
    title: 'Operational coordination',
    description: 'Organize activities, users and records through role-based dashboards.',
  },
  {
    number: '02',
    title: 'Management reporting',
    description: 'Prepare filtered information across state, district, block, cluster and programme levels.',
  },
  {
    number: '03',
    title: 'Phased growth',
    description: 'Shape programme workflows to support implementation in stages and future expansion.',
  },
];

export default function Page() {
  return (
    <>
      <style>{`
        .br-network { color: #1c2b23; }
        .br-network * { box-sizing: border-box; }
        .br-network-wrap { width: min(1160px, calc(100% - 48px)); margin: 0 auto; }
        .br-network-eyebrow { display: inline-flex; align-items: center; gap: 10px; color: #1c6844; font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
        .br-network-eyebrow:before { content: ''; width: 26px; height: 1px; background: #876321; }
        .br-network-hero { padding: 82px 0; background: #f7f7f2; }
        .br-network-hero-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(300px, .85fr); gap: 56px; align-items: center; }
        .br-network h1, .br-network h2, .br-network h3 { color: #123d2b; font-family: Georgia, 'Times New Roman', serif; font-weight: 500; letter-spacing: -.035em; }
        .br-network h1 { max-width: 720px; margin: 18px 0 16px; font-size: clamp(44px, 6vw, 70px); line-height: 1.03; }
        .br-network-lead { max-width: 650px; margin: 0; color: #526157; font-size: 16px; line-height: 1.8; }
        .br-network-links { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
        .br-network-button { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; gap: 12px; padding: 0 20px; background: #123d2b; color: #fff; font-size: 13px; font-weight: 700; text-decoration: none; }
        .br-network-button.secondary { border: 1px solid #123d2b; background: transparent; color: #123d2b; }
        .br-network-panel { padding: 30px; background: #123d2b; color: #fff; }
        .br-network-panel small { color: #e4eadf; font-size: 10px; font-weight: 800; letter-spacing: .15em; text-transform: uppercase; }
        .br-network-panel h2 { margin: 18px 0 12px; color: #fff; font-size: 30px; line-height: 1.2; }
        .br-network-panel p { margin: 0; color: #e4eadf; font-size: 14px; line-height: 1.75; }
        .br-network-panel-rule { height: 1px; margin: 22px 0; background: rgba(255,255,255,.25); }
        .br-network-panel-label { margin: 0 0 10px; color: #e4eadf; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
        .br-network-levels { display: flex; flex-wrap: wrap; gap: 8px; }
        .br-network-levels span { padding: 7px 9px; border: 1px solid rgba(255,255,255,.35); color: #fff; font-size: 11px; }
        .br-network-section { padding: 78px 0 86px; }
        .br-network-heading { max-width: 720px; margin-bottom: 34px; }
        .br-network h2 { margin: 14px 0 0; font-size: clamp(32px, 4vw, 46px); line-height: 1.12; }
        .br-network-heading p { max-width: 670px; margin: 15px 0 0; color: #617067; font-size: 15px; line-height: 1.8; }
        .br-network-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid #d9dfd8; border-left: 1px solid #d9dfd8; }
        .br-network-card { min-height: 235px; padding: 24px; border-right: 1px solid #d9dfd8; border-bottom: 1px solid #d9dfd8; background: #fff; }
        .br-network-number { color: #70501f; font-size: 11px; font-weight: 800; letter-spacing: .1em; }
        .br-network-card h3 { margin: 26px 0 10px; font-size: 24px; line-height: 1.2; }
        .br-network-card p { margin: 0; color: #617067; font-size: 14px; line-height: 1.75; }
        .br-network-scale { padding: 68px 0; background: #fbfbf8; }
        .br-network-scale-row { display: grid; grid-template-columns: .75fr 1.25fr; gap: 56px; align-items: start; }
        .br-network-scale p { max-width: 720px; margin: 0; color: #617067; font-size: 16px; line-height: 1.85; }
        .br-network-cta { padding: 66px 0; background: #123d2b; }
        .br-network-cta-row { display: flex; align-items: end; justify-content: space-between; gap: 30px; }
        .br-network-cta .br-network-eyebrow { color: #e4eadf; }
        .br-network-cta h2 { max-width: 680px; margin: 14px 0 0; color: #fff; font-size: clamp(32px, 4vw, 44px); }
        .br-network-cta .br-network-button { flex-shrink: 0; background: #fff; color: #123d2b; }
        @media (max-width: 860px) {
          .br-network-hero-grid { grid-template-columns: 1fr; gap: 32px; }
          .br-network-panel { max-width: 640px; }
          .br-network-scale-row { grid-template-columns: 1fr; gap: 18px; }
          .br-network-cta-row { display: block; }
          .br-network-cta .br-network-button { margin-top: 24px; }
        }
        @media (max-width: 760px) {
          .br-network-wrap { width: min(100% - 36px, 540px); }
          .br-network-hero { padding: 56px 0 60px; }
          .br-network-section { padding: 60px 0 68px; }
          .br-network-grid { grid-template-columns: 1fr; }
          .br-network-card { min-height: 0; padding: 21px; }
          .br-network-card h3 { margin-top: 18px; }
          .br-network-scale, .br-network-cta { padding: 56px 0; }
        }
        @media (max-width: 400px) {
          .br-network-wrap { width: calc(100% - 30px); }
          .br-network-links { display: grid; grid-template-columns: 1fr; }
          .br-network-button { width: 100%; }
          .br-network-panel { padding: 23px; }
        }
      `}</style>
      <main className="br-network">
        <section className="br-network-hero">
          <div className="br-network-wrap br-network-hero-grid">
            <div>
              <span className="br-network-eyebrow">Digital platform</span>
              <h1>Rural Network</h1>
              <p className="br-network-lead">
                A digital workspace for rural operations, information and
                regional programme coordination. Rural Network brings useful
                records, reporting and workflows into one structured environment.
              </p>
              <div className="br-network-links">
                <Link href="/contact" className="br-network-button">Discuss the platform <span aria-hidden="true">↗</span></Link>
                <Link href="/about" className="br-network-button secondary">About Bodhi Rural <span aria-hidden="true">→</span></Link>
              </div>
            </div>
            <aside className="br-network-panel" aria-label="Reporting hierarchy">
              <small>Organized information</small>
              <h2>One view across programme levels.</h2>
              <p>Prepare filtered management information across the organizational levels that guide implementation.</p>
              <div className="br-network-panel-rule" />
              <p className="br-network-panel-label">Reporting levels</p>
              <div className="br-network-levels">
                <span>State</span>
                <span>District</span>
                <span>Block</span>
                <span>Cluster</span>
                <span>Programme</span>
              </div>
            </aside>
          </div>
        </section>

        <section className="br-network-section">
          <div className="br-network-wrap">
            <div className="br-network-heading">
              <span className="br-network-eyebrow">Platform capabilities</span>
              <h2>Tools for coordinated rural operations.</h2>
              <p>
                Clear operational records and flexible reporting can help teams
                coordinate activities and follow progress across programmes.
              </p>
            </div>
            <div className="br-network-grid">
              {capabilities.map((capability) => (
                <article className="br-network-card" key={capability.number}>
                  <span className="br-network-number">{capability.number}</span>
                  <h3>{capability.title}</h3>
                  <p>{capability.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="br-network-scale">
          <div className="br-network-wrap br-network-scale-row">
            <div>
              <span className="br-network-eyebrow">Designed to grow</span>
              <h2>Start with current needs. Expand in phases.</h2>
            </div>
            <p>
              Rural Network is designed to support phased programmes and future
              expansion. Its structured workspace can evolve as operational
              requirements and reporting needs develop.
            </p>
          </div>
        </section>

        <section className="br-network-cta">
          <div className="br-network-wrap br-network-cta-row">
            <div>
              <span className="br-network-eyebrow">Learn more</span>
              <h2>Talk with us about Rural Network.</h2>
            </div>
            <Link href="/contact" className="br-network-button">Get in touch <span aria-hidden="true">↗</span></Link>
          </div>
        </section>
      </main>
    </>
  );
}
