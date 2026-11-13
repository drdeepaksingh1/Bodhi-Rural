import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Bodhi Rural Livelihood & Agri Private Limited, its work across agriculture, rural enterprise and livelihood development.',
  alternates: { canonical: '/about' },
};

const workAreas = [
  {
    number: '01',
    title: 'Agriculture & natural resources',
    description: 'Agriculture, horticulture, agroforestry and sustainable approaches to production and resource stewardship.',
  },
  {
    number: '02',
    title: 'Processing & market linkages',
    description: 'Aggregation, storage, processing, packaging, distribution and market development for agricultural products.',
  },
  {
    number: '03',
    title: 'Rural enterprise & technology',
    description: 'Digital services, agri-technology and enterprise development across connected rural value chains.',
  },
  {
    number: '04',
    title: 'Skills & livelihood development',
    description: 'Training, capacity building, research, innovation and support for producer and community organisations.',
  },
];

const valueChain = [
  { number: '01', title: 'Production', detail: 'Support productive activity and responsible practices.' },
  { number: '02', title: 'Aggregation', detail: 'Connect people, services and supply.' },
  { number: '03', title: 'Value addition', detail: 'Enable processing, packaging and enterprise.' },
  { number: '04', title: 'Market access', detail: 'Strengthen distribution and commercial links.' },
];

const companyDetails = [
  ['Legal name', 'BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED'],
  ['Corporate form', 'Company Limited by Shares'],
  ['Registered office', 'Islampur, Nalanda, Bihar – 801303'],
  ['Email', 'ceo@brlps.co.in'],
];

export default function Page() {
  return (
    <>
      <style>{`
        .br-about { color: #1c2b23; }
        .br-about * { box-sizing: border-box; }
        .br-about-wrap { width: min(1160px, calc(100% - 48px)); margin: 0 auto; }
        .br-about-hero { padding: 84px 0; background: #f7f7f2; }
        .br-about-hero-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(300px, .85fr); gap: 56px; align-items: center; }
        .br-about-eyebrow { display: inline-flex; align-items: center; gap: 10px; color: #1c6844; font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
        .br-about-eyebrow:before { content: ''; width: 26px; height: 1px; background: #876321; }
        .br-about h1, .br-about h2 { color: #123d2b; font-family: Georgia, 'Times New Roman', serif; font-weight: 500; letter-spacing: -.035em; }
        .br-about h1 { max-width: 680px; margin: 18px 0; font-size: clamp(42px, 5.5vw, 68px); line-height: 1.04; }
        .br-about-lead { max-width: 630px; margin: 0; color: #526157; font-size: 17px; line-height: 1.8; }
        .br-about-links { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
        .br-about-button { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; gap: 14px; padding: 0 20px; background: #123d2b; color: #fff; font-size: 13px; font-weight: 700; text-decoration: none; }
        .br-about-button.secondary { border: 1px solid #123d2b; background: transparent; color: #123d2b; }
        .br-about-profile { padding: 30px; background: #123d2b; color: #fff; box-shadow: 0 20px 48px rgba(18,61,43,.12); }
        .br-about-profile-label { margin: 0 0 24px; color: #d6e1d6; font-size: 10px; font-weight: 800; letter-spacing: .15em; text-transform: uppercase; }
        .br-about-profile h2 { margin: 0 0 24px; color: #fff; font-size: 29px; line-height: 1.2; }
        .br-about-detail { padding: 14px 0; border-top: 1px solid rgba(255,255,255,.22); }
        .br-about-detail dt { margin-bottom: 5px; color: #d6e1d6; font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
        .br-about-detail dd { margin: 0; color: #fff; font-size: 14px; line-height: 1.55; overflow-wrap: anywhere; }
        .br-about-detail a { color: #fff; text-decoration: underline; text-underline-offset: 3px; }
        .br-about-section { padding: 82px 0; }
        .br-about-section.tinted { background: #f7f7f2; }
        .br-about-section-heading { max-width: 700px; margin-bottom: 36px; }
        .br-about h2 { margin: 14px 0 0; font-size: clamp(32px, 4vw, 46px); line-height: 1.12; }
        .br-about-section-heading p { margin: 16px 0 0; color: #617067; font-size: 15px; line-height: 1.8; }
        .br-about-work-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-top: 1px solid #d9dfd8; border-left: 1px solid #d9dfd8; }
        .br-about-work-card { min-height: 190px; padding: 25px; border-right: 1px solid #d9dfd8; border-bottom: 1px solid #d9dfd8; background: #fff; }
        .br-about-work-number, .br-about-chain-number { color: #70501f; font-size: 11px; font-weight: 800; letter-spacing: .1em; }
        .br-about-work-card h3 { margin: 21px 0 9px; color: #123d2b; font: 24px/1.2 Georgia, 'Times New Roman', serif; }
        .br-about-work-card p, .br-about-chain-card p { margin: 0; color: #617067; font-size: 14px; line-height: 1.7; }
        .br-about-chain-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid #d9dfd8; }
        .br-about-chain-card { padding: 22px 18px 0 0; }
        .br-about-chain-card h3 { margin: 17px 0 8px; color: #123d2b; font: 22px/1.2 Georgia, 'Times New Roman', serif; }
        .br-about-cta { padding: 68px 0; background: #123d2b; color: #fff; }
        .br-about-cta-row { display: flex; align-items: end; justify-content: space-between; gap: 30px; }
        .br-about-cta .br-about-eyebrow { color: #e4eadf; }
        .br-about-cta h2 { max-width: 650px; margin: 14px 0 0; color: #fff; font-size: clamp(32px, 4vw, 44px); }
        .br-about-cta .br-about-button { flex-shrink: 0; background: #fff; color: #123d2b; }
        @media (max-width: 820px) {
          .br-about-hero-grid { grid-template-columns: 1fr; gap: 34px; }
          .br-about-profile { max-width: 620px; }
          .br-about-chain-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 18px; }
          .br-about-cta-row { display: block; }
          .br-about-cta .br-about-button { margin-top: 24px; }
        }
        @media (max-width: 600px) {
          .br-about-wrap { width: min(100% - 36px, 540px); }
          .br-about-hero { padding: 56px 0; }
          .br-about-section { padding: 60px 0; }
          .br-about-work-grid { grid-template-columns: 1fr; }
          .br-about-work-card { min-height: 0; padding: 21px; }
          .br-about-chain-card { padding-right: 6px; }
          .br-about-cta { padding: 56px 0; }
        }
        @media (max-width: 400px) {
          .br-about-wrap { width: calc(100% - 30px); }
          .br-about-links { display: grid; grid-template-columns: 1fr; }
          .br-about-button { width: 100%; }
          .br-about-profile { padding: 23px; }
          .br-about-chain-grid { grid-template-columns: 1fr; gap: 18px; }
        }
      `}</style>
      <main className="br-about">
        <section className="br-about-hero">
          <div className="br-about-wrap br-about-hero-grid">
            <div>
              <span className="br-about-eyebrow">About the company</span>
              <h1>Rural enterprise, built through connection.</h1>
              <p className="br-about-lead">
                Bodhi Rural Livelihood &amp; Agri Private Limited is a Bihar-based
                company working across agriculture, rural enterprise and livelihood
                development. We connect capabilities across the value chain to help
                create practical, lasting opportunities.
              </p>
              <div className="br-about-links">
                <a className="br-about-button" href="#our-work">Explore our areas of work <span aria-hidden="true">↓</span></a>
                <Link className="br-about-button secondary" href="/contact">Contact Bodhi Rural <span aria-hidden="true">↗</span></Link>
              </div>
            </div>
            <aside className="br-about-profile" aria-labelledby="br-about-profile-title">
              <p className="br-about-profile-label">Company profile</p>
              <h2 id="br-about-profile-title">Bodhi Rural Livelihood &amp; Agri Private Limited</h2>
              <dl>
                {companyDetails.map(([label, value]) => (
                  <div className="br-about-detail" key={label}>
                    <dt>{label}</dt>
                    <dd>{label === 'Email' ? <a href="mailto:ceo@brlps.co.in">{value}</a> : value}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </section>

        <section id="our-work" className="br-about-section">
          <div className="br-about-wrap">
            <div className="br-about-section-heading">
              <span className="br-about-eyebrow">Our areas of work</span>
              <h2>Experience across connected rural sectors.</h2>
              <p>
                Our company scope spans production, services and value addition,
                bringing together the activities that support a stronger rural economy.
              </p>
            </div>
            <div className="br-about-work-grid">
              {workAreas.map((area) => (
                <article className="br-about-work-card" key={area.number}>
                  <span className="br-about-work-number">{area.number}</span>
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="br-about-section tinted">
          <div className="br-about-wrap">
            <div className="br-about-section-heading">
              <span className="br-about-eyebrow">Our approach</span>
              <h2>From production to market access.</h2>
              <p>
                We focus on connecting capabilities at each stage, from productive
                activity and aggregation through value addition and market linkages.
              </p>
            </div>
            <div className="br-about-chain-grid">
              {valueChain.map((stage) => (
                <article className="br-about-chain-card" key={stage.number}>
                  <span className="br-about-chain-number">{stage.number}</span>
                  <h3>{stage.title}</h3>
                  <p>{stage.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="br-about-cta">
          <div className="br-about-wrap br-about-cta-row">
            <div>
              <span className="br-about-eyebrow">Work with us</span>
              <h2>Let’s build meaningful opportunities, together.</h2>
            </div>
            <Link className="br-about-button" href="/contact">Get in touch <span aria-hidden="true">↗</span></Link>
          </div>
        </section>
      </main>
    </>
  );
}
