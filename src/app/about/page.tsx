export default function Page() {
  return (
    <main>
      {/* Hero */}
      <section
        style={{
          background:
            'linear-gradient(135deg, #f2f9f4 0%, #ffffff 55%, #eaf5ed 100%)',
          padding: '75px 20px 65px',
          borderBottom: '1px solid #e2ebe4',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '900px' }}>
            <div
              style={{
                display: 'inline-block',
                background: '#e2f1e6',
                color: '#145c2b',
                padding: '8px 16px',
                borderRadius: '30px',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '1px',
                marginBottom: '18px',
              }}
            >
              BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED
            </div>

            <h1
              style={{
                fontSize: 'clamp(38px, 6vw, 64px)',
                lineHeight: 1.08,
                color: '#123b20',
                margin: '0 0 22px',
                fontWeight: 800,
              }}
            >
              Building sustainable
              <br />
              rural livelihoods
            </h1>

            <p
              style={{
                fontSize: '20px',
                lineHeight: 1.75,
                color: '#536158',
                maxWidth: '800px',
                margin: 0,
              }}
            >
              Bodhi Rural is an agriculture and rural livelihood enterprise
              working across agriculture, livestock, food, agricultural
              inputs, rural enterprises and technology-enabled solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Company Profile */}
      <section className="section">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'minmax(0, 1.35fr) minmax(300px, 0.65fr)',
              gap: '45px',
              alignItems: 'start',
            }}
          >
            <div>
              <div
                style={{
                  color: '#145c2b',
                  fontWeight: 700,
                  fontSize: '13px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                }}
              >
                About the Company
              </div>

              <h2>Our rural livelihood and agriculture platform</h2>

              <p
                className="muted"
                style={{ lineHeight: 1.85 }}
              >
                BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED is established
                as a company limited by shares with its registered office in
                Bihar.
              </p>

              <p
                className="muted"
                style={{ lineHeight: 1.85 }}
              >
                The company&apos;s Memorandum of Association provides a broad
                business framework covering agriculture, horticulture,
                floriculture, agroforestry, food processing, livestock,
                poultry, fisheries, agricultural inputs, feed, agri-technology
                and rural livelihood promotion.
              </p>

              <p
                className="muted"
                style={{ lineHeight: 1.85 }}
              >
                The company is also structured to support Farmer Producer
                Organizations, Self Help Groups, cooperatives and rural
                producer groups, together with training, capacity building,
                research, innovation and rural enterprise development.
              </p>
            </div>

            <div
              style={{
                background: '#f7faf7',
                border: '1px solid #dfe9e1',
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
                Company Profile
              </h3>

              <InfoRow
                label="Company Name"
                value="BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED"
              />

              <InfoRow
                label="Registered State"
                value="Bihar"
              />

              <InfoRow
                label="Registered Office"
                value="Islampur, Nalanda, Bihar – 801303"
              />

              <InfoRow
                label="Corporate Form"
                value="Company Limited by Shares"
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
      </section>

      {/* Main Objects */}
      <section
        style={{
          background: '#f7f9f7',
          padding: '70px 20px',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '800px', marginBottom: '35px' }}>
            <div
              style={{
                color: '#145c2b',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              Business Objects
            </div>

            <h2>Our areas of activity</h2>

            <p
              className="muted"
              style={{ lineHeight: 1.8 }}
            >
              The company&apos;s registered objects provide the foundation
              for a diversified rural and agricultural business ecosystem.
            </p>
          </div>

          <div className="grid">
            <ObjectCard
              icon="🌾"
              title="Agriculture & Horticulture"
              text="Agriculture, horticulture, floriculture, agroforestry and cultivation of cereals, pulses, oilseeds, fruits, vegetables, spices and other crops."
            />

            <ObjectCard
              icon="♻️"
              title="Sustainable Agriculture"
              text="Organic farming, natural farming, regenerative agriculture and sustainable agricultural practices."
            />

            <ObjectCard
              icon="🐄"
              title="Livestock & Dairy"
              text="Dairy farming, milk production and livestock activities including goat, sheep and other livestock enterprises."
            />

            <ObjectCard
              icon="🐔"
              title="Poultry & Hatchery"
              text="Poultry farming, hatchery operations, livestock breeding and related rural production systems."
            />

            <ObjectCard
              icon="🐟"
              title="Fisheries & Aquaculture"
              text="Fisheries, aquaculture, fish farming, shrimp farming and other aquatic farming activities."
            />

            <ObjectCard
              icon="🌽"
              title="Feed & Fodder"
              text="Cattle feed, poultry feed, fish feed, mineral mixtures, feed supplements, fodder and silage production."
            />

            <ObjectCard
              icon="🥬"
              title="Food Processing"
              text="Processing, dehydration, cold storage, milling, oil extraction, packaging and value addition of agricultural products."
            />

            <ObjectCard
              icon="📱"
              title="Agri-Technology"
              text="Digital platforms, mobile applications, farm management systems, IoT solutions and agritech services."
            />

            <ObjectCard
              icon="🌱"
              title="Agricultural Inputs"
              text="Seeds, bio-fertilizers, organic manure, farm machinery, tools and other agricultural inputs."
            />

            <ObjectCard
              icon="🤝"
              title="FPOs, SHGs & Cooperatives"
              text="Organization and support for Farmer Producer Organizations, Self Help Groups, cooperatives and rural producer groups."
            />

            <ObjectCard
              icon="🎓"
              title="Training & Capacity Building"
              text="Skill development, training, capacity building and rural livelihood promotion programmes."
            />

            <ObjectCard
              icon="🚀"
              title="Rural Enterprises"
              text="Agrientrepreneurship, rural enterprises and livelihood-based micro enterprises."
            />
          </div>
        </div>
      </section>

      {/* Integrated Approach */}
      <section className="section">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '25px',
            }}
          >
            <FeatureCard
              icon="🌾"
              title="Production"
              text="Supporting agricultural, livestock, poultry, fisheries and other rural production activities."
            />

            <FeatureCard
              icon="🏭"
              title="Processing"
              text="Creating opportunities for aggregation, processing, packaging, preservation and value addition."
            />

            <FeatureCard
              icon="📦"
              title="Supply & Distribution"
              text="Building systems for agricultural inputs, products, trading, distribution and marketing."
            />

            <FeatureCard
              icon="🛒"
              title="Digital Commerce"
              text="Using digital platforms and e-commerce systems to connect rural products and services with markets."
            />

            <FeatureCard
              icon="🔬"
              title="Research & Innovation"
              text="Supporting research, demonstrations and innovation in agriculture, livestock, feed, food and agri-technology."
            />

            <FeatureCard
              icon="🌍"
              title="Market Linkages"
              text="Developing trading, distribution, marketing and export-import opportunities for eligible products."
            />
          </div>
        </div>
      </section>

      {/* Rural Development */}
      <section
        style={{
          background: '#145c2b',
          color: '#ffffff',
          padding: '70px 20px',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '850px' }}>
            <div
              style={{
                color: '#d9eedf',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              Rural Development
            </div>

            <h2 style={{ color: '#ffffff' }}>
              Building connected rural ecosystems
            </h2>

            <p
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: '18px',
                lineHeight: 1.8,
              }}
            >
              The company&apos;s objects specifically provide for rural
              livelihood promotion, support to producer organizations,
              training and capacity building, government and CSR-related
              development projects, research and innovation, and the
              promotion of rural enterprises.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '18px',
              marginTop: '35px',
            }}
          >
            <DarkCard
              title="Farmer Networks"
              text="Connecting producers and rural producer groups."
            />

            <DarkCard
              title="Livelihood Promotion"
              text="Supporting productive rural livelihood opportunities."
            />

            <DarkCard
              title="Capacity Building"
              text="Training, skill development and knowledge systems."
            />

            <DarkCard
              title="Rural Enterprises"
              text="Promoting agriculture-linked entrepreneurship."
            />
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="section">
        <div className="container">
          <div
            style={{
              maxWidth: '820px',
              margin: '0 auto',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                color: '#145c2b',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              Technology & Management
            </div>

            <h2>Technology-enabled rural operations</h2>

            <p
              className="muted"
              style={{
                fontSize: '18px',
                lineHeight: 1.8,
              }}
            >
              The registered objects expressly include digital platforms,
              mobile applications, farm management systems, IoT solutions
              and agritech services. This provides the foundation for
              technology-enabled farmer management, operational monitoring,
              reporting and digital commerce.
            </p>
          </div>
        </div>
      </section>

      {/* Governance */}
      <section
        style={{
          background: '#f7f9f7',
          padding: '65px 20px',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '30px',
            }}
          >
            <div className="card">
              <h3>Corporate Governance</h3>

              <p
                className="muted"
                style={{ lineHeight: 1.8 }}
              >
                The company&apos;s Articles of Association establish
                provisions relating to share capital, members, general
                meetings, voting rights, the Board of Directors and
                proceedings of the Board.
              </p>
            </div>

            <div className="card">
              <h3>Management Structure</h3>

              <p
                className="muted"
                style={{ lineHeight: 1.8 }}
              >
                The Articles provide for the appointment of management
                positions including Chief Executive Officer, Manager,
                Company Secretary and Chief Financial Officer, subject to
                the applicable provisions of law.
              </p>
            </div>

            <div className="card">
              <h3>Responsible Growth</h3>

              <p
                className="muted"
                style={{ lineHeight: 1.8 }}
              >
                The company&apos;s registered framework also provides for
                agreements, collaborations, infrastructure, research,
                quality facilities, finance, insurance and other lawful
                activities necessary to further its business objects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section
        style={{
          padding: '65px 20px',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <h2>Empowering Rural India for a Sustainable Future</h2>

          <p
            className="muted"
            style={{
              fontSize: '17px',
              lineHeight: 1.8,
              maxWidth: '750px',
              margin: '15px auto 0',
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
        paddingBottom: '14px',
        marginBottom: '14px',
        borderBottom: '1px solid #dfe8e1',
      }}
    >
      <div
        style={{
          color: '#6c786f',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
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

function ObjectCard({
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
          fontSize: '32px',
          marginBottom: '10px',
        }}
      >
        {icon}
      </div>

      <h3>{title}</h3>

      <p
        className="muted"
        style={{
          lineHeight: 1.7,
          marginBottom: 0,
        }}
      >
        {text}
      </p>
    </div>
  );
}

function FeatureCard({
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
        padding: '26px',
        background: '#ffffff',
      }}
    >
      <div
        style={{
          fontSize: '30px',
          marginBottom: '10px',
        }}
      >
        {icon}
      </div>

      <h3 style={{ marginBottom: '8px' }}>{title}</h3>

      <p
        className="muted"
        style={{
          lineHeight: 1.7,
          marginBottom: 0,
        }}
      >
        {text}
      </p>
    </div>
  );
}

function DarkCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: '10px',
        padding: '23px',
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
