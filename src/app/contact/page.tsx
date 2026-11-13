import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Bodhi Rural for general enquiries, partnerships and conversations about agriculture and rural enterprise.',
  alternates: { canonical: '/contact' },
};

export default function Page() {
  return (
    <>
      <style>{`
        .br-contact { color: #1c2b23; }
        .br-contact * { box-sizing: border-box; }
        .br-contact-wrap { width: min(1160px, calc(100% - 48px)); margin: 0 auto; }
        .br-contact-eyebrow { display: inline-flex; align-items: center; gap: 10px; color: #1c6844; font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
        .br-contact-eyebrow:before { content: ''; width: 26px; height: 1px; background: #876321; }
        .br-contact h1, .br-contact h2, .br-contact h3 { color: #123d2b; font-family: Georgia, 'Times New Roman', serif; font-weight: 500; letter-spacing: -.03em; }
        .br-contact-hero { padding: 82px 0; background: #f7f7f2; }
        .br-contact-hero-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr); gap: 60px; align-items: end; }
        .br-contact h1 { max-width: 720px; margin: 18px 0 16px; font-size: clamp(44px, 6vw, 70px); line-height: 1.03; }
        .br-contact-lead { max-width: 660px; margin: 0; color: #526157; font-size: 16px; line-height: 1.8; }
        .br-contact-note { padding: 4px 0 4px 24px; border-left: 1px solid #d3dbd2; color: #526157; font-size: 15px; line-height: 1.8; }
        .br-contact-note strong { display: block; margin-bottom: 8px; color: #123d2b; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
        .br-contact-main { padding: 78px 0 88px; }
        .br-contact-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(300px, .85fr); gap: 56px; align-items: start; }
        .br-contact h2 { margin: 14px 0 12px; font-size: clamp(32px, 4vw, 44px); line-height: 1.12; }
        .br-contact-intro { max-width: 570px; margin: 0 0 28px; color: #617067; font-size: 15px; line-height: 1.8; }
        .br-contact-methods { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .br-contact-method { min-height: 168px; padding: 22px; border: 1px solid #d9dfd8; background: #fff; }
        .br-contact-method small { display: block; margin-bottom: 17px; color: #526157; font-size: 10px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
        .br-contact-method a { color: #123d2b; font-size: clamp(15px, 1.8vw, 18px); font-weight: 700; line-height: 1.5; overflow-wrap: anywhere; text-decoration: underline; text-decoration-color: #bd9250; text-underline-offset: 4px; }
        .br-contact-method a:hover { color: #1c6844; }
        .br-contact-office { padding: 30px; background: #123d2b; color: #fff; }
        .br-contact-office .br-contact-eyebrow { color: #e4eadf; }
        .br-contact-office h3 { margin: 18px 0; color: #fff; font-size: 28px; line-height: 1.2; }
        .br-contact-office p { margin: 0; color: #e4eadf; font-size: 15px; line-height: 1.8; }
        .br-contact-office address { margin-top: 20px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,.25); color: #fff; font-size: 15px; font-style: normal; line-height: 1.8; }
        .br-contact-about { display: inline-flex; align-items: center; gap: 10px; margin-top: 22px; color: #fff; font-size: 13px; font-weight: 800; text-decoration: underline; text-underline-offset: 4px; }
        .br-contact-about:hover { color: #e4eadf; }
        @media (max-width: 820px) {
          .br-contact-hero-grid, .br-contact-grid { grid-template-columns: 1fr; gap: 30px; }
          .br-contact-note { max-width: 640px; }
        }
        @media (max-width: 600px) {
          .br-contact-wrap { width: min(100% - 36px, 540px); }
          .br-contact-hero { padding: 56px 0 60px; }
          .br-contact-main { padding: 60px 0 68px; }
          .br-contact-methods { grid-template-columns: 1fr; }
          .br-contact-method { min-height: 0; padding: 20px; }
          .br-contact-office { padding: 24px; }
        }
        @media (max-width: 400px) {
          .br-contact-wrap { width: calc(100% - 30px); }
        }
      `}</style>
      <main className="br-contact">
        <section className="br-contact-hero">
          <div className="br-contact-wrap br-contact-hero-grid">
            <div>
              <span className="br-contact-eyebrow">Contact Bodhi Rural</span>
              <h1>Start a conversation.</h1>
              <p className="br-contact-lead">
                Reach us for general enquiries, partnerships, or conversations
                about agriculture and rural enterprise.
              </p>
            </div>
            <aside className="br-contact-note">
              <strong>We welcome enquiries about</strong>
              Company information, collaboration opportunities and our work
              across rural value chains.
            </aside>
          </div>
        </section>

        <section className="br-contact-main">
          <div className="br-contact-wrap br-contact-grid">
            <div>
              <span className="br-contact-eyebrow">Get in touch</span>
              <h2>Choose the best way to reach us.</h2>
              <p className="br-contact-intro">
                Contact the Bodhi Rural team by email or phone. We are based in
                Islampur, Nalanda, Bihar.
              </p>
              <div className="br-contact-methods">
                <div className="br-contact-method">
                  <small>Email</small>
                  <a href="mailto:ceo@brlps.co.in">ceo@brlps.co.in</a>
                </div>
                <div className="br-contact-method">
                  <small>Phone</small>
                  <a href="tel:+917667979679">+91 76679 79679</a>
                </div>
              </div>
            </div>

            <aside className="br-contact-office" aria-labelledby="br-contact-office-title">
              <span className="br-contact-eyebrow">Registered office</span>
              <h3 id="br-contact-office-title">Bodhi Rural Livelihood &amp; Agri Private Limited</h3>
              <p>Company Limited by Shares</p>
              <address>
                Islampur, Nalanda<br />
                Bihar, India – 801303
              </address>
              <Link href="/about" className="br-contact-about">
                Learn about the company <span aria-hidden="true">→</span>
              </Link>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
