import Image from 'next/image';
import Link from 'next/link';

const sectors = [
  { mark: '01', title: 'Agriculture & horticulture', detail: 'Crop production, horticulture and sustainable farming systems.' },
  { mark: '02', title: 'Livestock & dairy', detail: 'Livestock, dairy and allied rural production.' },
  { mark: '03', title: 'Poultry', detail: 'Layer farming, poultry, hatchery and egg value chains.' },
  { mark: '04', title: 'Fisheries', detail: 'Fisheries, aquaculture and aquatic farming activities.' },
  { mark: '05', title: 'Food processing', detail: 'Aggregation, processing, packaging and value addition.' },
  { mark: '06', title: 'Agri-technology', detail: 'Digital tools for farm management and rural services.' },
];

const platforms = [
  {
    number: '01',
    name: 'BodhiFarm',
    description: 'A digital workspace for farm, poultry, egg, feed and veterinary operations.',
    href: '/bodhifarm',
    action: 'Explore BodhiFarm',
  },
  {
    number: '02',
    name: 'BodhiMart',
    description: 'A marketplace for farm inputs, products, feed, seeds and rural essentials.',
    href: '/bodhimart',
    action: 'Visit BodhiMart',
  },
  {
    number: '03',
    name: 'Farmer Network',
    description: 'Connections to inputs, services, knowledge and market opportunities.',
    href: '/farmer-network',
    action: 'Meet the network',
  },
];

export default function Home() {
  return (
    <>
      <style jsx global>{`
        .br-home {
          --br-forest: #123d2b;
          --br-green: #1c6844;
          --br-leaf: #dce9dc;
          --br-gold: #bd9250;
          --br-ink: #1c2b23;
          --br-muted: #617067;
          --br-paper: #f7f7f2;
          color: var(--br-ink);
          overflow: hidden;
        }
        .br-home * { box-sizing: border-box; }
        .br-home a { text-decoration: none; }
        .br-wrap { width: min(1160px, calc(100% - 48px)); margin: 0 auto; }
        .br-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          color: var(--br-green); font-size: 11px; font-weight: 800;
          letter-spacing: .16em; text-transform: uppercase;
        }
        .br-eyebrow:before { content: ''; width: 26px; height: 1px; background: var(--br-gold); }
        .br-hero {
          background: var(--br-paper);
          padding: 66px 0 74px;
          position: relative;
        }
        .br-hero:before {
          content: ''; position: absolute; width: 480px; height: 480px;
          border: 1px solid rgba(28,104,68,.09); border-radius: 50%;
          right: -220px; top: -210px; pointer-events: none;
        }
        .br-hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 66px; align-items: center; position: relative; }
        .br-hero-copy { padding: 12px 0; }
        .br-hero h1 {
          color: var(--br-forest); font-family: Georgia, 'Times New Roman', serif;
          font-weight: 500; font-size: clamp(46px, 5.5vw, 72px); line-height: 1.02;
          letter-spacing: -.045em; margin: 20px 0 22px; max-width: 650px;
        }
        .br-hero h1 em { color: var(--br-green); font-weight: 400; }
        .br-lead { color: var(--br-muted); font-size: 17px; line-height: 1.8; max-width: 560px; margin: 0; }
        .br-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
        .br-button {
          display: inline-flex; justify-content: center; align-items: center; gap: 18px;
          min-height: 48px; padding: 0 20px; border: 1px solid var(--br-forest);
          background: var(--br-forest); color: white; font-size: 13px; font-weight: 700;
          transition: transform .2s ease, background .2s ease;
        }
        .br-button:hover { transform: translateY(-2px); background: var(--br-green); }
        .br-button.secondary { background: transparent; color: var(--br-forest); }
        .br-button.secondary:hover { background: white; }
        .br-hero-note { margin-top: 30px; color: #748078; font-size: 12px; letter-spacing: .04em; }
        .br-hero-visual { position: relative; min-height: 474px; }
        .br-hero-photo {
          position: absolute; inset: 0 24px 28px 0; overflow: hidden;
          background: #d8e3d5;
        }
        .br-hero-photo img { width: 100%; height: 100%; object-fit: cover; }
        .br-photo-tint { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,35,24,.02), rgba(10,35,24,.25)); }
        .br-photo-caption {
          position: absolute; left: 24px; bottom: 23px; color: white;
          font-size: 11px; letter-spacing: .14em; text-transform: uppercase; font-weight: 700;
        }
        .br-vision {
          position: absolute; right: 0; bottom: 0; width: 208px;
          background: var(--br-forest); color: white; padding: 22px 22px 20px;
          box-shadow: 0 14px 35px rgba(13,46,31,.18);
        }
        .br-vision small { display: block; color: #cbd9c8; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; }
        .br-vision strong { display: block; font: 25px/1.15 Georgia, serif; margin-top: 11px; }
        .br-intro { padding: 90px 0; }
        .br-intro-grid { display: grid; grid-template-columns: .82fr 1.18fr; gap: 90px; align-items: start; }
        .br-intro h2, .br-section-heading h2, .br-platform-head h2, .br-cta h2 {
          color: var(--br-forest); font: 500 clamp(34px, 4vw, 48px)/1.12 Georgia, 'Times New Roman', serif;
          letter-spacing: -.035em; margin: 16px 0 0;
        }
        .br-intro-copy { border-left: 1px solid #d9dfd8; padding: 4px 0 4px 32px; }
        .br-intro-copy p { color: var(--br-muted); font-size: 16px; line-height: 1.85; margin: 0 0 18px; }
        .br-text-link { display: inline-flex; align-items: center; gap: 12px; color: var(--br-green); font-size: 13px; font-weight: 800; margin-top: 8px; }
        .br-text-link span { transition: transform .2s ease; }
        .br-text-link:hover span { transform: translateX(4px); }
        .br-pillars { background: var(--br-paper); padding: 77px 0 84px; }
        .br-section-heading { max-width: 650px; }
        .br-section-heading p, .br-platform-head p { color: var(--br-muted); font-size: 15px; line-height: 1.75; margin: 17px 0 0; max-width: 620px; }
        .br-sector-grid { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 43px; border-top: 1px solid #d9dfd8; border-left: 1px solid #d9dfd8; }
        .br-sector {
          min-height: 177px; padding: 23px 25px; border-right: 1px solid #d9dfd8; border-bottom: 1px solid #d9dfd8;
          transition: background .2s ease;
        }
        .br-sector:hover { background: #eef2e9; }
        .br-sector-mark { color: var(--br-gold); font-size: 11px; font-weight: 800; letter-spacing: .08em; }
        .br-sector h3 { color: var(--br-forest); font: 22px/1.2 Georgia, serif; margin: 22px 0 8px; }
        .br-sector p { color: var(--br-muted); font-size: 13px; line-height: 1.6; margin: 0; }
        .br-platforms { padding: 86px 0 94px; }
        .br-platform-head { display: flex; justify-content: space-between; gap: 40px; align-items: end; }
        .br-platform-head p { max-width: 390px; margin-bottom: 4px; }
        .br-platform-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 40px; }
        .br-platform {
          min-height: 267px; padding: 26px; border: 1px solid #dce2db; display: flex;
          flex-direction: column; transition: border-color .2s ease, transform .2s ease;
        }
        .br-platform:hover { border-color: var(--br-green); transform: translateY(-3px); }
        .br-platform-number { color: var(--br-gold); font-size: 11px; font-weight: 800; letter-spacing: .1em; }
        .br-platform h3 { color: var(--br-forest); font: 29px/1.1 Georgia, serif; margin: 36px 0 11px; }
        .br-platform p { color: var(--br-muted); font-size: 14px; line-height: 1.7; margin: 0; }
        .br-platform .br-text-link { margin-top: auto; padding-top: 22px; }
        .br-scale { background: var(--br-forest); padding: 66px 0; color: white; }
        .br-scale-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 70px; align-items: center; }
        .br-scale .br-eyebrow { color: #d9e3d6; }
        .br-scale h2 { color: white; font: 500 clamp(32px, 3.5vw, 43px)/1.12 Georgia, serif; margin: 18px 0 14px; }
        .br-scale-copy p { color: #d2ddd5; font-size: 14px; line-height: 1.8; max-width: 510px; margin: 0; }
        .br-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 0 25px; }
        .br-metric { padding: 20px 0; border-top: 1px solid rgba(255,255,255,.25); }
        .br-metric strong { display: block; color: #e7c994; font: 34px/1 Georgia, serif; }
        .br-metric span { display: block; color: #e0e9e1; font-size: 11px; letter-spacing: .05em; margin-top: 9px; }
        .br-cta { padding: 80px 0; background: #edf1e9; }
        .br-cta-row { display: flex; align-items: end; justify-content: space-between; gap: 35px; }
        .br-cta h2 { max-width: 700px; }
        .br-cta .br-actions { margin: 0; flex-shrink: 0; }
        @media (max-width: 900px) {
          .br-hero-grid { gap: 35px; }
          .br-intro-grid { gap: 45px; }
          .br-platform-head { display: block; }
          .br-platform-head p { max-width: 600px; }
          .br-cta-row { display: block; }
          .br-cta .br-actions { margin-top: 25px; }
        }
        @media (max-width: 700px) {
          .br-wrap { width: min(100% - 36px, 540px); }
          .br-hero { padding: 46px 0 50px; }
          .br-hero-grid, .br-intro-grid, .br-scale-grid { grid-template-columns: 1fr; }
          .br-hero-grid { gap: 30px; }
          .br-hero h1 { font-size: clamp(43px, 12vw, 58px); }
          .br-lead { font-size: 15px; }
          .br-hero-visual { min-height: min(88vw, 430px); }
          .br-hero-photo { inset: 0 17px 20px 0; }
          .br-vision { width: 172px; padding: 17px; }
          .br-vision strong { font-size: 21px; }
          .br-intro { padding: 62px 0; }
          .br-intro-grid { gap: 26px; }
          .br-intro-copy { padding-left: 19px; }
          .br-pillars, .br-platforms { padding: 62px 0; }
          .br-sector-grid { grid-template-columns: 1fr 1fr; margin-top: 30px; }
          .br-sector { min-height: 160px; padding: 18px; }
          .br-sector h3 { font-size: 19px; margin-top: 17px; }
          .br-platform-grid { grid-template-columns: 1fr; gap: 10px; margin-top: 28px; }
          .br-platform { min-height: 230px; }
          .br-scale { padding: 54px 0; }
          .br-scale-grid { gap: 28px; }
          .br-cta { padding: 62px 0; }
        }
        @media (max-width: 420px) {
          .br-wrap { width: calc(100% - 30px); }
          .br-actions { display: grid; grid-template-columns: 1fr; }
          .br-button { width: 100%; }
          .br-sector-grid { grid-template-columns: 1fr; }
          .br-sector { min-height: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .br-home *, .br-home *:before, .br-home *:after { scroll-behavior: auto !important; transition: none !important; }
        }
      `}</style>

      <main className="br-home">
        <section className="br-hero">
          <div className="br-wrap br-hero-grid">
            <div className="br-hero-copy">
              <span className="br-eyebrow">Rural enterprise · Agriculture · Technology</span>
              <h1>Building a stronger <em>rural future.</em></h1>
              <p className="br-lead">
                We connect agriculture, rural enterprises and digital tools to create
                more resilient livelihoods and stronger value chains across India.
              </p>
              <div className="br-actions">
                <Link href="/about" className="br-button">Discover Bodhi Rural <span aria-hidden="true">↗</span></Link>
                <Link href="/bodhimart" className="br-button secondary">Explore BodhiMart <span aria-hidden="true">→</span></Link>
              </div>
              <p className="br-hero-note">BODHI RURAL LIVELIHOOD &amp; AGRI PRIVATE LIMITED</p>
            </div>
            <div className="br-hero-visual" aria-label="Rural landscape and agriculture">
              <div className="br-hero-photo">
                <Image src="/branding/bodhi-rural-village-hero.png" alt="A rural landscape reflecting the communities Bodhi Rural works alongside" fill priority sizes="(max-width: 700px) 100vw, 50vw" />
                <div className="br-photo-tint" />
                <span className="br-photo-caption">Rooted in rural India</span>
              </div>
              <div className="br-vision"><small>Our purpose</small><strong>Growing<br />together.</strong></div>
            </div>
          </div>
        </section>

        <section className="br-intro">
          <div className="br-wrap br-intro-grid">
            <div>
              <span className="br-eyebrow">Who we are</span>
              <h2>Rural progress, built through connection.</h2>
            </div>
            <div className="br-intro-copy">
              <p>
                Bodhi Rural Livelihood &amp; Agri Private Limited works across
                agriculture and allied rural activities, bringing producers,
                services, technology and markets into a more connected ecosystem.
              </p>
              <p>
                From production and aggregation to processing, digital commerce and
                capacity building, our focus is on practical pathways that help
                rural communities participate across the value chain.
              </p>
              <Link href="/about" className="br-text-link">More about our approach <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>

        <section className="br-pillars">
          <div className="br-wrap">
            <div className="br-section-heading">
              <span className="br-eyebrow">Our sectors</span>
              <h2>Experience across the rural economy.</h2>
              <p>Our work spans interconnected sectors, creating opportunities to support production, services and value addition at every stage.</p>
            </div>
            <div className="br-sector-grid">
              {sectors.map((sector) => (
                <article className="br-sector" key={sector.mark}>
                  <span className="br-sector-mark">{sector.mark}</span>
                  <h3>{sector.title}</h3>
                  <p>{sector.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="br-platforms">
          <div className="br-wrap">
            <div className="br-platform-head">
              <div>
                <span className="br-eyebrow">Digital platforms</span>
                <h2>Connected tools for rural enterprise.</h2>
              </div>
              <p>Purpose-built platforms help connect operations, products and people across the Bodhi Rural ecosystem.</p>
            </div>
            <div className="br-platform-grid">
              {platforms.map((platform) => (
                <article className="br-platform" key={platform.number}>
                  <span className="br-platform-number">{platform.number} / PLATFORM</span>
                  <h3>{platform.name}</h3>
                  <p>{platform.description}</p>
                  <Link href={platform.href} className="br-text-link">{platform.action} <span aria-hidden="true">→</span></Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="br-scale">
          <div className="br-wrap br-scale-grid">
            <div className="br-scale-copy">
              <span className="br-eyebrow">Our ambition</span>
              <h2>Designed to grow with rural communities.</h2>
              <p>Our digital and operational ecosystem is being developed to support farmers, rural enterprises and connected market activity at scale.</p>
            </div>
            <div className="br-metrics" aria-label="Bodhi Rural planning targets">
              <div className="br-metric"><strong>1,000</strong><span>Target farmers</span></div>
              <div className="br-metric"><strong>300,000</strong><span>Target bird capacity</span></div>
              <div className="br-metric"><strong>15+</strong><span>Initial product categories</span></div>
              <div className="br-metric"><strong>6+</strong><span>Connected rural sectors</span></div>
            </div>
          </div>
        </section>

        <section className="br-cta">
          <div className="br-wrap br-cta-row">
            <div>
              <span className="br-eyebrow">Work with us</span>
              <h2>Let’s build meaningful opportunities, together.</h2>
            </div>
            <div className="br-actions">
              <Link href="/farmer-network" className="br-button">Join the farmer network <span aria-hidden="true">→</span></Link>
              <Link href="/contact" className="br-button secondary">Get in touch <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
