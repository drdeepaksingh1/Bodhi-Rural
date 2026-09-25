export default function Page() {
  return (
    <main>
      {/* Hero */}
      <section
        style={{
          background:
            'linear-gradient(135deg, #f4faf5 0%, #ffffff 55%, #eef7f0 100%)',
          padding: '75px 20px 65px',
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
              maxWidth: '850px',
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
                marginBottom: '20px',
              }}
            >
              ABOUT BODHI RURAL
            </div>

            <h1
              style={{
                fontSize: 'clamp(38px, 6vw, 64px)',
                lineHeight: 1.1,
                color: '#123b20',
                margin: '0 0 22px',
                fontWeight: 800,
                letterSpacing: '-1px',
              }}
            >
              Empowering Rural India
              <br />
              for a Sustainable Future
            </h1>

            <p
              style={{
                fontSize: '20px',
                lineHeight: 1.7,
                color: '#526157',
                maxWidth: '780px',
                margin: 0,
              }}
            >
              BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED is focused on
              building sustainable rural livelihood opportunities through
              agriculture, livestock, farmer networks, market linkages and
              technology-enabled management systems.
            </p>
          </div>
        </div>
      </section>

      {/* Company Profile */}
      <section
        className="section"
        style={{
          paddingTop: '70px',
          paddingBottom: '70px',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '45px',
              alignItems: 'start',
            }}
          >
            <div>
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
                Who We Are
              </div>

              <h2 style={{ marginBottom: '18px' }}>
                A rural livelihood and agriculture enterprise
              </h2>

              <p className="muted" style={{ lineHeight: 1.8 }}>
                Bodhi Rural is developing an integrated ecosystem designed
                to connect rural producers with productive assets, inputs,
                services, technology and markets.
              </p>

              <p className="muted" style={{ lineHeight: 1.8 }}>
                Our approach brings together farmer operations, poultry and
                livestock activities, agricultural inputs, digital commerce
                and management information systems within a connected
                platform.
              </p>

              <p className="muted" style={{ lineHeight: 1.8 }}>
                The objective is to create structured and scalable systems
                that can support rural producers while enabling transparent
                and professional business operations.
              </p>
            </div>

            <div
              style={{
                background: '#f7f9f7',
                border: '1px solid #e3ebe5',
                borderRadius: '12px',
                padding: '28px',
              }}
            >
              <h3
                style={{
                  color: '#145c2b',
                  marginTop: 0,
                  marginBottom: '22px',
                }}
              >
                Company Information
              </h3>

              <div style={{ display: 'grid', gap: '17px' }}>
                <InfoRow
                  label="Company"
                  value="BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED"
                />

                <InfoRow
                  label="CIN"
                  value="U46209BR2026PTC083153"
                />

                <InfoRow
                  label="Registered Office"
                  value="Islampur, Nalanda, Bihar – 801303"
                />

                <InfoRow
                  label="Registration"
                  value="Registered under Ministry of Corporate Affairs, Government of India"
                />

                <InfoRow
                  label="Website"
                  value="www.brlps.co.in"
                />

                <InfoRow
                  label="Email"
                  value="ceo@brlps.co.in"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section
        style={{
          background: '#f7f9f7',
          padding: '70px 20px',
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
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '25px',
            }}
          >
            <div
              className="card"
              style={{
                padding: '32px',
                borderTop: '4px solid #145c2b',
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>
                🌱
              </div>

              <h2>Our Vision</h2>

              <p
                className="muted"
                style={{ lineHeight: 1.8 }}
              >
                To contribute to a stronger and more sustainable rural
                economy where farmers and rural communities have access to
                productive opportunities, technology, markets and better
                livelihood systems.
              </p>
            </div>

            <div
              className="card"
              style={{
                padding: '32px',
                borderTop: '4px solid #145c2b',
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>
                🤝
              </div>

              <h2>Our Mission</h2>

              <p
                className="muted"
                style={{ lineHeight: 1.8 }}
              >
                To develop practical, scalable and technology-enabled rural
                business systems that connect producers with quality inputs,
                services, production support and markets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section
        className="section"
        style={{
          paddingTop: '70px',
          paddingBottom: '70px',
        }}
      >
        <div className="container">
          <div
            style={{
              maxWidth: '700px',
              marginBottom: '35px',
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
              Our Values
            </div>

            <h2>Principles that guide our work</h2>

            <p className="muted">
              We aim to build long-term rural businesses through responsible
              operations, strong relationships and transparent systems.
            </p>
          </div>

          <div className="grid">
            <ValueCard
              icon="🌾"
              title="Farmer First"
              text="Designing systems around the practical needs and economic opportunities of rural producers."
            />

            <ValueCard
              icon="♻️"
              title="Sustainability"
              text="Promoting responsible agricultural and livelihood models designed for long-term value creation."
            />

            <ValueCard
              icon="💡"
              title="Innovation"
              text="Using technology and improved processes to make rural business operations more efficient and scalable."
            />

            <ValueCard
              icon="🤝"
              title="Partnership"
              text="Working with farmers, producer groups, institutions and market partners to build connected ecosystems."
            />

            <ValueCard
              icon="📊"
              title="Transparency"
              text="Developing structured information and management systems to support accountable operations."
            />

            <ValueCard
              icon="📈"
              title="Inclusive Growth"
              text="Creating opportunities for rural communities through productive agriculture and livelihood activities."
            />
          </div>
        </div>
      </section>

      {/* Business Areas */}
      <section
        style={{
          background: '#145c2b',
          color: '#ffffff',
          padding: '70px 20px',
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
              maxWidth: '700px',
              marginBottom: '35px',
            }}
          >
            <div
              style={{
                color: '#d9eedf',
                fontWeight: 700,
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '10px',
              }}
            >
              Our Ecosystem
            </div>

            <h2 style={{ color: '#ffffff' }}>
              Connecting multiple rural business areas
            </h2>

            <p
              style={{
                color: 'rgba(255,255,255,0.82)',
                lineHeight: 1.7,
              }}
            >
              Bodhi Rural is developing an integrated model across
              agriculture, livestock, farmer networks, commerce and
              technology.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '18px',
            }}
          >
            <BusinessCard
              title="BodhiFarm"
              text="Farmer, poultry, livestock, egg, feed and veterinary operations."
            />

            <BusinessCard
              title="BodhiMart"
              text="Digital commerce for agricultural inputs, farm products and rural businesses."
            />

            <BusinessCard
              title="Farmer Network"
              text="Connecting rural producers with inputs, services, knowledge and markets."
            />

            <BusinessCard
              title="Technology"
              text="Digital systems for farmer management, operations, reporting and business intelligence."
            />
          </div>
        </div>
      </section>

      {/* Scale */}
      <section
        className="section"
        style={{
          paddingTop: '65px',
          paddingBottom: '65px',
          textAlign: 'center',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '900px',
            margin: '0 auto',
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
            Growth Platform
          </div>

          <h2>Designed to grow with rural communities</h2>

          <p
            className="muted"
            style={{
              fontSize: '18px',
              lineHeight: 1.8,
              maxWidth: '750px',
              margin: '15px auto 30px',
            }}
          >
            Our digital architecture is being developed to support an
            expanding network of farmers and rural enterprises, beginning
            with a target of 1,000 farmers and 300,000 birds and designed
            for future scale.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                minWidth: '190px',
                padding: '22px',
                background: '#f7f9f7',
                borderRadius: '10px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  fontSize: '32px',
                  color: '#145c2b',
                }}
              >
                1,000+
              </strong>
              <span className="muted">Target Farmers</span>
            </div>

            <div
              style={{
                minWidth: '190px',
                padding: '22px',
                background: '#f7f9f7',
                borderRadius: '10px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  fontSize: '32px',
                  color: '#145c2b',
                }}
              >
                300,000
              </strong>
              <span className="muted">
                Target Bird Capacity
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section
        style={{
          background: '#f7f9f7',
          padding: '55px 20px',
          textAlign: 'center',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          <h2>Empowering Rural India for a Sustainable Future</h2>

          <p
            className="muted"
            style={{
              fontSize: '17px',
              lineHeight: 1.7,
            }}
          >
            BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED
            <br />
            Islampur, Nalanda, Bihar – 801303
          </p>
        </div>
      </section>
    </main>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        borderBottom: '1px solid #dfe8e1',
        paddingBottom: '13px',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          color: '#6b786e',
          fontWeight: 700,
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: '#1d3324',
          lineHeight: 1.5,
        }}
      >
        {value}
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
    <div className="card">
      <div
        style={{
          fontSize: '34px',
          marginBottom: '10px',
        }}
      >
        {icon}
      </div>

      <h3>{title}</h3>

      <p
        className="muted"
        style={{ lineHeight: 1.7 }}
      >
        {text}
      </p>
    </div>
  );
}

function BusinessCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        padding: '24px',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: '10px',
        background: 'rgba(255,255,255,0.07)',
      }}
    >
      <h3
        style={{
          color: '#ffffff',
          marginTop: 0,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: 'rgba(255,255,255,0.82)',
          lineHeight: 1.7,
          marginBottom: 0,
        }}
      >
        {text}
      </p>
    </div>
  );
}
