import Link from 'next/link';

const platforms = [
  {
    icon: '🌾',
    title: 'BodhiFarm',
    text: 'Digital management for farmers, poultry, birds, eggs, feed and veterinary operations.',
    href: '/bodhifarm',
  },
  {
    icon: '🛒',
    title: 'BodhiMart',
    text: 'A digital marketplace for farm inputs, products, feed, seeds and rural essentials.',
    href: '/bodhimart',
  },
  {
    icon: '🤝',
    title: 'Farmer Network',
    text: 'Connecting rural producers with inputs, services, knowledge and markets.',
    href: '/farmer-network',
  },
];

const sectors = [
  {
    icon: '🌱',
    title: 'Agriculture',
    text: 'Crop production, horticulture, sustainable and natural farming.',
  },
  {
    icon: '🐄',
    title: 'Livestock & Dairy',
    text: 'Livestock, dairy and allied rural production systems.',
  },
  {
    icon: '🐔',
    title: 'Poultry',
    text: 'Layer farming, poultry production, hatchery and egg value chains.',
  },
  {
    icon: '🐟',
    title: 'Fisheries',
    text: 'Fisheries, aquaculture and other aquatic farming activities.',
  },
  {
    icon: '🏭',
    title: 'Food Processing',
    text: 'Aggregation, processing, packaging and agricultural value addition.',
  },
  {
    icon: '📱',
    title: 'Agri-Technology',
    text: 'Digital platforms, farm management and technology-enabled services.',
  },
];

export default function Home() {
  return (
    <>
      <style>{`
        .home-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
          gap: 36px;
          align-items: center;
        }

        .home-intro-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
          gap: 34px;
          align-items: center;
        }

        .home-value-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .home-platform-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .home-scale-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 0.8fr);
          gap: 30px;
          align-items: center;
        }

        .home-scale-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @media (max-width: 800px) {
          .home-hero-grid,
          .home-intro-grid,
          .home-scale-grid {
            grid-template-columns: 1fr;
          }

          .home-platform-grid {
            grid-template-columns: 1fr;
          }

          .home-value-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 520px) {
          .home-value-grid,
          .home-scale-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main>
        {/* =====================================================
            HERO
        ===================================================== */}
        <section
          style={{
            background:
              'linear-gradient(135deg, #f4faf5 0%, #ffffff 52%, #edf7ef 100%)',
            padding: '48px 20px 52px',
          }}
        >
          <div className="container home-hero-grid">
            <div>
              <div
                style={{
                  display: 'inline-block',
                  background: '#e3f1e6',
                  color: '#145c2b',
                  borderRadius: '30px',
                  padding: '7px 14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.7px',
                  textTransform: 'uppercase',
                  marginBottom: '14px',
                }}
              >
                Rural • Agriculture • Technology
              </div>

              <h1
                style={{
                  fontSize: 'clamp(36px, 5vw, 58px)',
                  lineHeight: 1.08,
                  margin: '0 0 16px',
                  color: '#173522',
                  maxWidth: '700px',
                }}
              >
                Building a stronger rural livelihood ecosystem.
              </h1>

              <p
                style={{
                  fontSize: '16px',
                  lineHeight: 1.65,
                  color: '#526157',
                  maxWidth: '680px',
                  marginBottom: '22px',
                }}
              >
                BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED brings
                agriculture, allied activities, farmer networks, digital
                platforms and rural enterprises together to create connected
                opportunities for rural communities.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <Link
                  href="/login"
                  className="btn"
                  style={{
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  Open Bodhi Portal
                </Link>

                <Link
                  href="/farmer-network"
                  className="btn alt"
                  style={{
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  Join Farmer Network
                </Link>
              </div>
            </div>

            {/* VISION PANEL */}
            <div
              style={{
                background: '#145c2b',
                borderRadius: '16px',
                padding: '25px',
                color: '#ffffff',
                boxShadow:
                  '0 12px 30px rgba(20, 92, 43, 0.13)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: '#cfe8d5',
                  marginBottom: '8px',
                }}
              >
                Bodhi Rural Vision
              </div>

              <h2
                style={{
                  color: '#ffffff',
                  fontSize: '27px',
                  lineHeight: 1.2,
                  margin: '0 0 10px',
                }}
              >
                Connecting farmers, resources and markets.
              </h2>

              <p
                style={{
                  color: '#e9f4ec',
                  lineHeight: 1.6,
                  fontSize: '14px',
                  margin: 0,
                }}
              >
                A connected rural ecosystem designed around production,
                services, technology, value addition and market linkages.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginTop: '18px',
                }}
              >
                <MiniStat value="1,000" label="Target Farmers" />
                <MiniStat value="300K" label="Bird Capacity" />
                <MiniStat value="6+" label="Core Sectors" />
                <MiniStat value="1" label="Connected Platform" />
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            WHO WE ARE
        ===================================================== */}
        <section style={{ padding: '38px 20px' }}>
          <div className="container home-intro-grid">
            <div>
              <SectionLabel text="WHO WE ARE" />

              <h2>
                A rural enterprise platform built around agriculture
              </h2>

              <p
                className="muted"
                style={{
                  lineHeight: 1.65,
                  fontSize: '15px',
                  marginBottom: '12px',
                }}
              >
                BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED operates across
                agriculture and allied rural activities, including agriculture,
                horticulture, livestock, poultry, fisheries, feed, food
                processing, agricultural inputs and agri-technology.
              </p>

              <p
                className="muted"
                style={{
                  lineHeight: 1.65,
                  fontSize: '15px',
                  marginBottom: '18px',
                }}
              >
                Our approach is focused on connecting production with
                aggregation, processing, distribution, digital commerce,
                capacity building and market opportunities.
              </p>

              <Link
                href="/about"
                className="btn alt"
                style={{
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Learn About Bodhi Rural
              </Link>
            </div>

            <div className="home-value-grid">
              <ValueCard
                icon="🌾"
                title="Production"
                text="Supporting rural production systems."
              />

              <ValueCard
                icon="🏭"
                title="Value Addition"
                text="Processing and enterprise development."
              />

              <ValueCard
                icon="📱"
                title="Technology"
                text="Digital tools for connected operations."
              />

              <ValueCard
                icon="🌍"
                title="Markets"
                text="Building stronger market linkages."
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            SECTORS
        ===================================================== */}
        <section
          style={{
            background: '#f7f9f7',
            padding: '38px 20px',
          }}
        >
          <div className="container">
            <SectionLabel text="OUR SECTORS" />

            <h2>Across the rural agriculture ecosystem</h2>

            <p
              className="muted"
              style={{
                maxWidth: '760px',
                lineHeight: 1.65,
                marginBottom: '20px',
              }}
            >
              Our business activities span multiple agriculture and allied
              sectors, allowing rural producers and enterprises to participate
              across different stages of the value chain.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              {sectors.map((sector) => (
                <SectorCard
                  key={sector.title}
                  icon={sector.icon}
                  title={sector.title}
                  text={sector.text}
                />
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            DIGITAL PLATFORMS
        ===================================================== */}
        <section style={{ padding: '38px 20px' }}>
          <div className="container">
            <SectionLabel text="OUR DIGITAL PLATFORMS" />

            <h2>One ecosystem. Multiple rural solutions.</h2>

            <p
              className="muted"
              style={{
                maxWidth: '750px',
                lineHeight: 1.65,
                marginBottom: '20px',
              }}
            >
              Bodhi Rural is developing digital systems that connect farmers,
              operations, products, services and management information.
            </p>

            <div className="home-platform-grid">
              {platforms.map((platform) => (
                <PlatformCard
                  key={platform.title}
                  icon={platform.icon}
                  title={platform.title}
                  text={platform.text}
                  href={platform.href}
                />
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            SCALE
        ===================================================== */}
        <section
          style={{
            background: '#f7faf7',
            padding: '38px 20px',
          }}
        >
          <div className="container">
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #dfe9e1',
                borderRadius: '15px',
                padding: '28px',
              }}
            >
              <div className="home-scale-grid">
                <div>
                  <SectionLabel text="BODHI RURAL SCALE" />

                  <h2 style={{ marginBottom: '10px' }}>
                    Building scalable rural operations
                  </h2>

                  <p
                    className="muted"
                    style={{
                      lineHeight: 1.65,
                      margin: 0,
                      fontSize: '15px',
                    }}
                  >
                    The platform is designed to support a structured network
                    of farmers and rural enterprises while enabling digital
                    management of production, procurement, inputs, products,
                    services and market connections.
                  </p>
                </div>

                <div className="home-scale-stats">
                  <ScaleStat
                    value="1,000"
                    label="Target Farmers"
                  />

                  <ScaleStat
                    value="300,000"
                    label="Target Bird Capacity"
                  />

                  <ScaleStat
                    value="15+"
                    label="Initial Product Categories"
                  />

                  <ScaleStat
                    value="1"
                    label="Unified Digital Ecosystem"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            RURAL LIVELIHOOD
        ===================================================== */}
        <section
          style={{
            background: '#145c2b',
            padding: '42px 20px 46px',
          }}
        >
          <div
            className="container"
            style={{
              textAlign: 'center',
            }}
          >
            <SectionLabel
              text="RURAL LIVELIHOOD"
              light
            />

            <h2
              style={{
                color: '#ffffff',
                maxWidth: '800px',
                margin: '0 auto 10px',
              }}
            >
              Creating connected opportunities for rural communities
            </h2>

            <p
              style={{
                color: '#e9f4ec',
                maxWidth: '760px',
                margin: '0 auto 20px',
                lineHeight: 1.65,
                fontSize: '15px',
              }}
            >
              From farmers and producer groups to rural enterprises and
              agricultural value chains, Bodhi Rural aims to build systems
              that connect people, resources, technology and markets.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <Link
                href="/farmer-network"
                style={{
                  background: '#ffffff',
                  color: '#145c2b',
                  padding: '11px 20px',
                  borderRadius: '7px',
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                Explore Farmer Network
              </Link>

              <Link
                href="/projects"
                style={{
                  border: '1px solid #cfe8d5',
                  color: '#ffffff',
                  padding: '11px 20px',
                  borderRadius: '7px',
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                View Projects
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function SectionLabel({
  text,
  light = false,
}: {
  text: string;
  light?: boolean;
}) {
  return (
    <div
      style={{
        color: light ? '#cfe8d5' : '#145c2b',
        fontWeight: 700,
        fontSize: '11px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: '6px',
      }}
    >
      {text}
    </div>
  );
}

function MiniStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.10)',
        borderRadius: '8px',
        padding: '11px',
      }}
    >
      <div
        style={{
          fontSize: '21px',
          fontWeight: 800,
          marginBottom: '2px',
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: '#d9eddf',
          fontSize: '10px',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ValueCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        border: '1px solid #e1e9e3',
        borderRadius: '10px',
        padding: '16px',
        background: '#ffffff',
      }}
    >
      <div
        style={{
          fontSize: '25px',
          marginBottom: '6px',
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          margin: '0 0 5px',
          fontSize: '16px',
        }}
      >
        {title}
      </h3>

      <p
        className="muted"
        style={{
          margin: 0,
          fontSize: '12px',
          lineHeight: 1.45,
        }}
      >
        {text}
      </p>
    </div>
  );
}

function SectorCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e1e9e3',
        borderRadius: '10px',
        padding: '16px',
      }}
    >
      <div
        style={{
          fontSize: '25px',
          marginBottom: '5px',
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          margin: '0 0 5px',
          fontSize: '16px',
        }}
      >
        {title}
      </h3>

      <p
        className="muted"
        style={{
          margin: 0,
          lineHeight: 1.45,
          fontSize: '13px',
        }}
      >
        {text}
      </p>
    </div>
  );
}

function PlatformCard({
  icon,
  title,
  text,
  href,
}: {
  icon: string;
  title: string;
  text: string;
  href: string;
}) {
  return (
    <div
      style={{
        border: '1px solid #dfe9e1',
        borderRadius: '12px',
        padding: '20px',
        background: '#ffffff',
        boxShadow:
          '0 3px 10px rgba(20, 92, 43, 0.05)',
      }}
    >
      <div
        style={{
          fontSize: '29px',
          marginBottom: '6px',
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          color: '#145c2b',
          margin: '0 0 6px',
          fontSize: '19px',
        }}
      >
        {title}
      </h3>

      <p
        className="muted"
        style={{
          lineHeight: 1.5,
          fontSize: '13px',
          margin: '0 0 13px',
        }}
      >
        {text}
      </p>

      <Link
        href={href}
        className="btn alt"
        style={{
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        Explore
      </Link>
    </div>
  );
}

function ScaleStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div
      style={{
        background: '#f3f8f4',
        borderRadius: '9px',
        padding: '14px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          color: '#145c2b',
          fontSize: '23px',
          fontWeight: 800,
          marginBottom: '2px',
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: '#647168',
          fontSize: '10px',
          lineHeight: 1.35,
        }}
      >
        {label}
      </div>
    </div>
  );
}
