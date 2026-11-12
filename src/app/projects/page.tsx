import Link from 'next/link';

const workAreas = [
  { index: '01', title: 'Farmer and producer livelihoods', body: 'Work across agriculture, horticulture, livestock, poultry, fisheries and allied rural activities.', href: '/farmer-network', link: 'Explore the farmer network' },
  { index: '02', title: 'Enterprise and value addition', body: 'A focus on aggregation, food processing, agricultural inputs and rural enterprise development.', href: '/about', link: 'Learn about our activities' },
  { index: '03', title: 'Digital services and market access', body: 'BodhiFarm, BodhiMart and the Farmer Network connect farm operations, commerce and rural services.', href: '/bodhimart', link: 'Explore BodhiMart' },
];

export default function Page() {
  return (
    <>
      <style>{`
        .br-projects { color: #1c2b23; }
        .br-projects-hero { background: #f7f7f2; padding: 72px 0 76px; }
        .br-projects-wrap { width: min(1160px, calc(100% - 48px)); margin: 0 auto; }
        .br-projects-eyebrow { display: inline-flex; align-items: center; gap: 10px; color: #1c6844; font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
        .br-projects-eyebrow:before { content: ''; width: 26px; height: 1px; background: #bd9250; }
        .br-projects h1 { max-width: 760px; margin: 18px 0 16px; color: #123d2b; font: 500 clamp(42px, 6vw, 68px)/1.03 Georgia, 'Times New Roman', serif; letter-spacing: -.04em; }
        .br-projects-intro { max-width: 690px; margin: 0; color: #617067; font-size: 16px; line-height: 1.8; }
        .br-projects-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
        .br-projects-button { display: inline-flex; align-items: center; gap: 14px; min-height: 46px; padding: 0 18px; border: 1px solid #123d2b; background: #123d2b; color: #fff; font-size: 13px; font-weight: 700; }
        .br-projects-button.secondary { background: transparent; color: #123d2b; }
        .br-project-list { padding: 76px 0 90px; }
        .br-project-list h2 { margin: 0; color: #123d2b; font: 500 clamp(30px, 4vw, 44px)/1.12 Georgia, 'Times New Roman', serif; letter-spacing: -.03em; }
        .br-project-list-intro { max-width: 680px; margin: 14px 0 34px; color: #617067; font-size: 15px; line-height: 1.75; }
        .br-project-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid #d9dfd8; border-left: 1px solid #d9dfd8; }
        .br-project-card { min-height: 250px; display: flex; flex-direction: column; padding: 24px; border-right: 1px solid #d9dfd8; border-bottom: 1px solid #d9dfd8; }
        .br-project-index { color: #bd9250; font-size: 11px; font-weight: 800; letter-spacing: .1em; }
        .br-project-card h3 { margin: 28px 0 10px; color: #123d2b; font: 24px/1.15 Georgia, 'Times New Roman', serif; }
        .br-project-card p { margin: 0; color: #617067; font-size: 14px; line-height: 1.7; }
        .br-project-card a { display: inline-flex; align-items: center; gap: 10px; margin-top: auto; padding-top: 22px; color: #1c6844; font-size: 13px; font-weight: 800; text-decoration: none; }
        @media (max-width: 760px) {
          .br-projects-wrap { width: min(100% - 36px, 540px); }
          .br-projects-hero { padding: 52px 0 56px; }
          .br-project-list { padding: 58px 0 68px; }
          .br-project-grid { grid-template-columns: 1fr; }
          .br-project-card { min-height: 215px; padding: 20px; }
        }
      `}</style>
      <main className="br-projects">
        <section className="br-projects-hero">
          <div className="br-projects-wrap">
            <span className="br-projects-eyebrow">Our work</span>
            <h1>Connecting people, production and opportunity.</h1>
            <p className="br-projects-intro">
              Bodhi Rural works across agriculture and allied rural sectors, with an approach
              that connects production, enterprise development, digital services and market access.
            </p>
            <div className="br-projects-actions">
              <Link href="/about" className="br-projects-button">About Bodhi Rural <span aria-hidden="true">↗</span></Link>
              <Link href="/contact" className="br-projects-button secondary">Get in touch <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>
        <section className="br-project-list">
          <div className="br-projects-wrap">
            <span className="br-projects-eyebrow">Areas of focus</span>
            <h2>Working across the rural value chain.</h2>
            <p className="br-project-list-intro">
              Our areas of activity span rural production, services and value addition.
              These connected pathways inform the company’s programs and digital platforms.
            </p>
            <div className="br-project-grid">
              {workAreas.map((area) => (
                <article className="br-project-card" key={area.index}>
                  <span className="br-project-index">{area.index}</span>
                  <h3>{area.title}</h3>
                  <p>{area.body}</p>
                  <Link href={area.href}>{area.link} <span aria-hidden="true">→</span></Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
