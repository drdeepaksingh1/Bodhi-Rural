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
    <>
      <main>
        <section className="hero">
          <div className="container">
            <div className="badge">Rural • Agriculture • Technology</div>

            <h1>
              Building a stronger rural livelihood ecosystem with farmers.
            </h1>

            <p>
              Bodhi Rural brings farmer management, poultry operations,
              digital commerce and management information into one platform.
            </p>

            <div className="actions">
              <Link className="btn" href="/login">
                Open Bodhi Portal
              </Link>

              <Link className="btn alt" href="/bodhimart">
                Shop BodhiMart
              </Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2>One platform. Multiple rural businesses.</h2>

            <p>
              Start with a 300-farmer pilot and grow the same architecture
              toward 10,000+ farmers.
            </p>

            <div className="grid">
              {cards.map((c) => (
                <div className="card" key={c[1]}>
                  <div style={{ fontSize: 34 }}>{c[0]}</div>

                  <h3>{c[1]}</h3>

                  <p className="muted">{c[2]}</p>

                  <Link href={c[3]} className="btn alt">
                    Explore
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="section"
          style={{ background: '#f7f9f7' }}
        >
          <div className="container">
            <h2>Pilot dashboard</h2>

            <div className="stats">
              <div className="stat">
                <strong>300</strong>
                Target farmers
              </div>

              <div className="stat">
                <strong>90,000</strong>
                Example bird capacity
              </div>

              <div className="stat">
                <strong>15+</strong>
                Demo products
              </div>

              <div className="stat">
                <strong>1</strong>
                Unified farmer account
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
