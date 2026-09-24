import Link from 'next/link';

const cards = [
  [
    '🌾',
    'BodhiFarm',
    'Farmer, poultry, birds, eggs, feed and veterinary operations.',
    '/bodhifarm',
  ],
  [
    '🛒',
    'BodhiMart',
    'Buy feed, chicks, seeds, farm inputs and other products online.',
    '/bodhimart',
  ],
  [
    '🤝',
    'Farmer Network',
    'Connect rural producers with inputs, services and markets.',
    '/farmer-network',
  ],
];

export default function Home() {
  return (
    <main>
      {/* HERO */}
      <section
        style={{
          background:
            'linear-gradient(135deg, #f4faf5 0%, #ffffff 55%, #eef7f0 100%)',
          padding: '80px 20px 75px',
          borderBottom: '1px solid #e5eee7',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '1180px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              maxWidth: '820px',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                background: '#e4f2e7',
                color: '#145c2b',
                padding: '8px 15px',
                borderRadius: '30px',
                fontSize: '14px',
                fontWeight: 700,
                marginBottom: '22px',
              }}
            >
              RURAL LIVELIHOOD • AGRICULTURE • TECHNOLOGY
            </div>

            <h1
              style={{
                fontSize: 'clamp(38px, 6vw, 68px)',
                lineHeight: 1.08,
                margin: '0 0 24px',
                color: '#123b20',
                fontWeight: 800,
                letterSpacing: '-1.5px',
              }}
            >
              Empowering Rural India
              <br />
              Through Sustainable Livelihoods.
            </h1>

            <p
              style={{
                fontSize: '20px',
                lineHeight: 1.7,
                color: '#526157',
                maxWidth: '760px',
                marginBottom: '30px',
              }}
            >
              BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED is building an
              integrated rural ecosystem connecting farmers, agriculture,
              livestock, markets, technology and livelihood opportunities.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '14px',
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/farmer-network"
                className="btn"
                style={{
                  background: '#145c2b',
                  color: '#ffffff',
                  padding: '13px 22px',
                  borderRadius: '7px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Join Farmer Network
              </Link>

              <Link
                href="/bodhifarm"
                className="btn alt"
                style={{
                  padding: '13px 22px',
                  borderRadius: '7px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Explore BodhiFarm
              </Link>

              <Link
                href="/login"
                style={{
                  padding: '13px 22px',
                  borderRadius: '7px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  color: '#145c2b',
                  border: '1px solid #145c2b',
                }}
              >
                Open Bodhi Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT NUMBERS */}
      <section
        style={{
          background: '#145c2b',
          color: '#ffffff',
          padding: '34px 20px',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '1180px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '20px',
          }}
        >
          <div>
            <strong style={{ fontSize: '34px', display: 'block' }}>
              1,000+
            </strong>
            <span style={{ opacity: 0.9 }}>Target Farmers</span>
          </div>

          <div>
            <strong style={{ fontSize: '34px', display: 'block' }}>
              300,000
            </strong>
            <span style={{ opacity: 0.9 }}>Target Bird Capacity</span>
          </div>

          <div>
            <strong style={{ fontSize: '34px', display: 'block' }}>
              3
            </strong>
            <span style={{ opacity: 0.9 }}>Core Digital Platforms</span>
          </div>

          <div>
            <strong style={{ fontSize: '34px', display: 'block' }}>
              Bihar & Jharkhand
            </strong>
            <span style={{ opacity: 0.9 }}>Initial Focus Region</span>
          </div>
        </div>
      </section>

      {/* BUSINESS ECOSYSTEM */}
      <section
        className="section"
        style={{
          paddingTop: '70px',
          paddingBottom: '70px',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '720px', marginBottom: '35px' }}>
            <div
              style={{
                color: '#145c2b',
                fontWeight: 700,
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '8px',
              }}
            >
              Our Rural Ecosystem
            </div>

            <h2 style={{ marginBottom: '12px' }}>
              One platform. Multiple rural businesses.
            </h2>

            <p className="muted">
              Bodhi Rural combines farmer operations, agriculture,
              livestock, digital commerce and rural producer networks into
              an integrated ecosystem.
            </p>
          </div>

          <div className="grid">
            {cards.map((c) => (
              <div className="card" key={c[1]}>
                <div style={{ fontSize: 38, marginBottom: '10px' }}>
                  {c[0]}
                </div>

                <h3>{c[1]}</h3>

                <p className="muted">{c[2]}</p>

                <Link href={c[3]} className="btn alt">
                  Explore →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VISION */}
      <section
        style={{
          background: '#f7f9f7',
          padding: '65px 20px',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              color: '#145c2b',
              fontWeight: 700,
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '10px',
            }}
          >
            Our Vision
          </div>

          <h2 style={{ marginBottom: '18px' }}>
            Building a stronger rural livelihood ecosystem
          </h2>

          <p
            style={{
              color: '#526157',
              fontSize: '18px',
              lineHeight: 1.8,
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            We aim to create sustainable economic opportunities by connecting
            rural producers with technology, quality inputs, production
            systems, markets and professional management.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        style={{
          background: '#ffffff',
          padding: '65px 20px',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h2>Be part of the Bodhi Rural ecosystem.</h2>

          <p
            className="muted"
            style={{
              maxWidth: '650px',
              margin: '12px auto 25px',
            }}
          >
            Connect with our farmer network, explore our agriculture
            operations or access the Bodhi digital platform.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <Link href="/farmer-network" className="btn">
              Farmer Network
            </Link>

            <Link href="/contact" className="btn alt">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
