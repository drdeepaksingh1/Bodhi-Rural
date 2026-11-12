import Link from 'next/link';

export default function Page() {
  return (
    <>
      <style>{`
        .br-contact { color: #1c2b23; }
        .br-contact-hero { background: #f7f7f2; padding: 72px 0 70px; }
        .br-contact-wrap { width: min(1160px, calc(100% - 48px)); margin: 0 auto; }
        .br-contact-eyebrow { display: inline-flex; align-items: center; gap: 10px; color: #1c6844; font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
        .br-contact-eyebrow:before { content: ''; width: 26px; height: 1px; background: #bd9250; }
        .br-contact h1 { max-width: 760px; margin: 18px 0 16px; color: #123d2b; font: 500 clamp(42px, 6vw, 68px)/1.03 Georgia, 'Times New Roman', serif; letter-spacing: -.04em; }
        .br-contact-lead { max-width: 660px; margin: 0; color: #617067; font-size: 16px; line-height: 1.8; }
        .br-contact-main { padding: 76px 0 90px; }
        .br-contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 54px; }
        .br-contact-grid h2 { margin: 0 0 22px; color: #123d2b; font: 500 32px/1.15 Georgia, 'Times New Roman', serif; }
        .br-contact-block { padding: 0 0 22px; margin-bottom: 22px; border-bottom: 1px solid #d9dfd8; }
        .br-contact-block:last-child { margin-bottom: 0; }
        .br-contact-block small { display: block; margin-bottom: 8px; color: #617067; font-size: 10px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
        .br-contact-block a, .br-contact-block address { color: #123d2b; font-size: 16px; line-height: 1.65; font-style: normal; text-decoration: none; }
        .br-contact-profile { background: #f7f7f2; padding: 28px; }
        .br-contact-profile h3 { margin: 0 0 13px; color: #123d2b; font: 24px/1.2 Georgia, 'Times New Roman', serif; }
        .br-contact-profile p { margin: 0 0 18px; color: #617067; font-size: 14px; line-height: 1.75; }
        .br-contact-link { color: #1c6844; font-size: 13px; font-weight: 800; text-decoration: none; }
        @media (max-width: 760px) {
          .br-contact-wrap { width: min(100% - 36px, 540px); }
          .br-contact-hero { padding: 52px 0 56px; }
          .br-contact-main { padding: 58px 0 68px; }
          .br-contact-grid { grid-template-columns: 1fr; gap: 36px; }
          .br-contact-grid h2 { font-size: 28px; }
          .br-contact-profile { padding: 22px; }
        }
      `}</style>
      <main className="br-contact">
        <section className="br-contact-hero">
          <div className="br-contact-wrap">
            <span className="br-contact-eyebrow">Contact</span>
            <h1>Let’s talk about rural livelihoods.</h1>
            <p className="br-contact-lead">
              Reach out for general enquiries, partnerships, or conversations about
              agriculture and rural enterprise.
            </p>
          </div>
        </section>
        <section className="br-contact-main">
          <div className="br-contact-wrap br-contact-grid">
            <div>
              <h2>Get in touch</h2>
              <div className="br-contact-block">
                <small>Email</small>
                <a href="mailto:ceo@brlps.co.in">ceo@brlps.co.in</a>
              </div>
              <div className="br-contact-block">
                <small>Phone</small>
                <a href="tel:+917667979679">+91 76679 79679</a>
              </div>
              <div className="br-contact-block">
                <small>Registered office</small>
                <address>Islampur, Nalanda<br />Bihar, India – 801303</address>
              </div>
            </div>
            <aside className="br-contact-profile">
              <span className="br-contact-eyebrow">Bodhi Rural</span>
              <h3>Bodhi Rural Livelihood &amp; Agri Private Limited</h3>
              <p>
                A rural enterprise platform working across agriculture, allied
                activities and digital services.
              </p>
              <Link href="/about" className="br-contact-link">Learn about the company <span aria-hidden="true">→</span></Link>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
