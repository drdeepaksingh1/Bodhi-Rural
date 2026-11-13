import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Explore Bodhi Rural’s work across agriculture, value addition, rural enterprise and digital services.',
  alternates: { canonical: '/projects' },
};

const workAreas = [
  {
    number: '01',
    title: 'Agriculture & natural resources',
    description: 'Work across production systems, horticulture, agroforestry and sustainable approaches to rural development.',
    href: '/about',
    link: 'About our company',
  },
  {
    number: '02',
    title: 'Enterprise & value addition',
    description: 'Aggregation, processing, packaging, distribution and enterprise development across rural value chains.',
    href: '/about',
    link: 'Explore our company profile',
  },
  {
    number: '03',
    title: 'Digital services & market access',
    description: 'Connected platforms and services that bring operations, products and market opportunities closer together.',
    href: '/bodhimart',
    link: 'Explore BodhiMart',
  },
];

const valueChain = [
  { number: '01', title: 'Production', description: 'Build the foundations for productive activity.' },
  { number: '02', title: 'Aggregation', description: 'Connect supply, services and coordination.' },
  { number: '03', title: 'Value addition', description: 'Develop processing, packaging and enterprise.' },
  { number: '04', title: 'Market access', description: 'Strengthen distribution and commercial links.' },
];

export default function Page() {
  return (
    <>
      <style>{`
        .br-projects { color: #1c2b23; }
        .br-projects * { box-sizing: border-box; }
        .br-projects-wrap { width: min(1160px, calc(100% - 48px)); margin: 0 auto; }
        .br-projects-eyebrow { display: inline-flex; align-items: center; gap: 10px; color: #1c6844; font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
        .br-projects-eyebrow:before { content: ''; width: 26px; height: 1px; background: #876321; }
        .br-projects-hero { padding: 82px 0 84px; background: #f7f7f2; }
        .br-projects-hero-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(290px, .85fr); gap: 54px; align-items: end; }
        .br-projects h1, .br-projects h2 { color: #123d2b; font-family: Georgia, 'Times New Roman', serif; font-weight: 500; letter-spacing: -.035em; }
        .br-projects h1 { max-width: 760px; margin: 18px 0 16px; font-size: clamp(42px, 5.7vw, 68px); line-height: 1.04; }
        .br-projects-lead { max-width: 690px; margin: 0; color: #526157; font-size: 16px; line-height: 1.8; }
        .br-projects-aside { border-left: 1px solid #d3dbd2; padding: 4px 0 4px 24px; color: #526157; font-size: 15px; line-height: 1.8; }
        .br-projects-aside strong { display: block; margin-bottom: 8px; color: #123d2b; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
        .br-projects-section { padding: 78px 0 86px; }
        .br-projects-section.tinted { background: #fbfbf8; }
        .br-projects-heading { max-width: 720px; margin-bottom: 34px; }
        .br-projects h2 { margin: 14px 0 0; font-size: clamp(32px, 4vw, 46px); line-height: 1.12; }
        .br-projects-heading p { max-width: 680px; margin: 15px 0 0; color: #617067; font-size: 15px; line-height: 1.8; }
        .br-projects-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid #d9dfd8; border-left: 1px solid #d9dfd8; }
        .br-projects-card { min-height: 260px; display: flex; flex-direction: column; padding: 25px; border-right: 1px solid #d9dfd8; border-bottom: 1px solid #d9dfd8; background: #fff; }
        .br-projects-number, .br-projects-stage-number { color: #70501f; font-size: 11px; font-weight: 800; letter-spacing: .1em; }
        .br-projects-card h3 { margin: 27px 0 10px; color: #123d2b; font: 24px/1.2 Georgia, 'Times New Roman', serif; }
        .br-projects-card p, .br-projects-stage p { margin: 0; color: #617067; font-size: 14px; line-height: 1.7; }
        .br-projects-card a { display: inline-flex; align-items: center; gap: 10px; margin-top: auto; padding-top: 22px; color: #1c6844; font-size: 13px; font-weight: 800; text-decoration: none; }
        .br-projects-stages { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid #d9dfd8; }
        .br-projects-stage { padding: 22px 18px 0 0; }
        .br-projects-stage h3 { margin: 18px 0 8px; color: #123d2b; font: 22px/1.2 Georgia, 'Times New Roman', serif; }
        .br-projects-cta { padding: 66px 0; background: #123d2b; }
        .br-projects-cta-row { display: flex; align-items: end; justify-content: space-between; gap: 30px; }
        .br-projects-cta .br-projects-eyebrow { color: #e4eadf; }
        .br-projects-cta h2 { max-width: 680px; margin: 14px 0 0; color: #fff; font-size: clamp(32px, 4vw, 44px); }
        .br-projects-button { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; gap: 12px; flex-shrink: 0; padding: 0 20px; background: #fff; color: #123d2b; font-size: 13px; font-weight: 700; text-decoration: none; }
        @media (max-width: 860px) {
          .br-projects-hero-grid { grid-template-columns: 1fr; gap: 26px; }
          .br-projects-aside { max-width: 690px; }
          .br-projects-cta-row { display: block; }
          .br-projects-button { margin-top: 24px; }
        }
        @media (max-width: 760px) {
          .br-projects-wrap { width: min(100% - 36px, 540px); }
          .br-projects-hero { padding: 55px 0 60px; }
          .br-projects-section { padding: 60px 0 68px; }
          .br-projects-grid { grid-template-columns: 1fr; }
          .br-projects-card { min-height: 0; padding: 21px; }
          .br-projects-card h3 { margin-top: 18px; }
          .br-projects-stages { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 18px; }
          .br-projects-stage { padding-right: 6px; }
        }
        @media (max-width: 400px) {
          .br-projects-wrap { width: calc(100% - 30px); }
          .br-projects-stages { grid-template-columns: 1fr; gap: 18px; }
        }
      `}</style>
      <main className="br-projects">
        <section className="br-projects-hero">
          <div className="br-projects-wrap br-projects-hero-grid">
            <div>
              <span className="br-projects-eyebrow">Our work</span>
              <h1>Connecting rural enterprise with opportunity.</h1>
              <p className="br-projects-lead">
                Bodhi Rural works across agriculture, enterprise development,
                value addition and digital services. Our approach connects
                capabilities at each stage of the rural value chain.
              </p>
            </div>
            <aside className="br-projects-aside">
              <strong>Areas of focus</strong>
              Our company scope brings together production, services and market
              access to support a more connected rural economy.
            </aside>
          </div>
        </section>

        <section className="br-projects-section">
          <div className="br-projects-wrap">
            <div className="br-projects-heading">
              <span className="br-projects-eyebrow">Where we work</span>
              <h2>Connected activity across sectors.</h2>
              <p>
                We focus on practical links between natural resources,
                enterprises and the digital tools that support rural development.
              </p>
            </div>
            <div className="br-projects-grid">
              {workAreas.map((area) => (
                <article className="br-projects-card" key={area.number}>
                  <span className="br-projects-number">{area.number}</span>
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
                  <Link href={area.href}>{area.link} <span aria-hidden="true">→</span></Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="br-projects-section tinted">
          <div className="br-projects-wrap">
            <div className="br-projects-heading">
              <span className="br-projects-eyebrow">Our approach</span>
              <h2>From production to market access.</h2>
              <p>
                Each stage can benefit from stronger coordination, value
                addition and access to services.
              </p>
            </div>
            <div className="br-projects-stages">
              {valueChain.map((stage) => (
                <article className="br-projects-stage" key={stage.number}>
                  <span className="br-projects-stage-number">{stage.number}</span>
                  <h3>{stage.title}</h3>
                  <p>{stage.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="br-projects-cta">
          <div className="br-projects-wrap br-projects-cta-row">
            <div>
              <span className="br-projects-eyebrow">Start a conversation</span>
              <h2>Let’s explore how we can work together.</h2>
            </div>
            <Link href="/contact" className="br-projects-button">Get in touch <span aria-hidden="true">↗</span></Link>
          </div>
        </section>
      </main>
    </>
  );
}
