export default function Page() {
  return (
    <main>
      {/* =========================================================
          HERO
      ========================================================= */}
      <section
        style={{
          background:
            'linear-gradient(135deg, #f2f9f4 0%, #ffffff 55%, #eaf5ed 100%)',
          padding: '50px 20px 45px',
          borderBottom: '1px solid #e2ebe4',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '850px' }}>
            <div
              style={{
                color: '#145c2b',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '1px',
                marginBottom: '10px',
              }}
            >
              BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED
            </div>

            <h1
              style={{
                fontSize: 'clamp(36px, 5vw, 58px)',
                lineHeight: 1.08,
                color: '#123b20',
                margin: '0 0 16px',
                fontWeight: 800,
              }}
            >
              Building sustainable
              <br />
              rural livelihoods
            </h1>

            <p
              style={{
                fontSize: '18px',
                lineHeight: 1.65,
                color: '#536158',
                maxWidth: '760px',
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

      {/* =========================================================
          COMPANY PROFILE
      ========================================================= */}
      <section
        style={{
          padding: '45px 20px',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'minmax(0, 1.4fr) minmax(290px, 0.6fr)',
              gap: '30px',
              alignItems: 'start',
            }}
          >
            <div>
              <SectionLabel text="ABOUT THE COMPANY" />

              <h2>Our rural livelihood and agriculture platform</h2>

              <p
                className="muted"
                style={{
                  lineHeight: 1.7,
                  marginBottom: '12px',
                }}
              >
                BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED is established
                as a company limited by shares with its registered office in
                Bihar.
              </p>

              <p
                className="muted"
                style={{
                  lineHeight: 1.7,
                  marginBottom: '12px',
                }}
              >
                The company&apos;s Memorandum of Association provides a broad
                business framework covering agriculture, horticulture,
                floriculture, agroforestry, food processing, livestock,
                poultry, fisheries, agricultural inputs, feed, agri-technology
                and rural livelihood promotion.
              </p>

              <p
                className="muted"
                style={{
                  lineHeight: 1.7,
                  marginBottom: 0,
                }}
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
                padding: '22px',
              }}
            >
              <h3
                style={{
                  color: '#145c2b',
                  marginTop: 0,
                  marginBottom: '16px',
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
                last
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          BUSINESS OBJECTS
      ========================================================= */}
      <section
        style={{
          background: '#f7f9f7',
          padding: '45px 20px',
        }}
      >
        <div className="container">
          <SectionLabel text="BUSINESS OBJECTS" />

          <h2>Our areas of activity</h2>

          <p
            className="muted"
            style={{
              maxWidth: '760px',
              marginBottom: '24px',
            }}
          >
            The company&apos;s registered objects provide the foundation for
            a diversified rural and agricultural business ecosystem.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px',
            }}
          >
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

      {/* =========================================================
          OUR APPROACH
      ========================================================= */}
      <section
        style={{
          padding: '45px 20px',
        }}
      >
        <div className="container">
          <SectionLabel text="OUR APPROACH" />

          <h2>From production to market</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px',
              marginTop: '22px',
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

      {/* =========================================================
          RURAL DEVELOPMENT — FINAL SECTION
      ========================================================= */}
      <section
        style={{
          background: '#145c2b',
          padding: '50px 20px 55px',
        }}
      >
        <div className="container">
          <div
            style={{
              maxWidth: '800px',
              marginBottom: '25px',
            }}
          >
            <SectionLabel
              text="RURAL DEVELOPMENT"
              light
            />

            <h2
              style={{
                color: '#ffffff',
                marginBottom: '14px',
              }}
            >
              Building connected rural ecosystems
            </h2>

            <p
              style={{
                color: '#f0f7f2',
                fontSize: '17px',
                lineHeight: 1.7,
                margin: 0,
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
                'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            <DevelopmentCard
              title="Farmer Networks"
              text="Connecting producers and rural producer groups."
            />

            <DevelopmentCard
              title="Livelihood Promotion"
              text="Supporting productive rural livelihood opportunities."
            />

            <DevelopmentCard
              title="Capacity Building"
              text="Training, skill development and knowledge systems."
            />

            <DevelopmentCard
              title="Rural Enterprises"
              text="Promoting agriculture-linked entrepreneurship."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   SECTION LABEL
============================================================ */

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
        fontSize: '12px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        marginBottom: '7px',
      }}
    >
      {text}
    </div>
  );
}

/* ============================================================
   COMPANY INFORMATION
============================================================ */

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        paddingBottom: last ? 0 : '10px',
        marginBottom: last ? 0 : '10px',
        borderBottom: last
          ? 'none'
          : '1px solid #dfe8e1',
      }}
    >
      <div
        style={{
          color: '#6c786f',
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '3px',
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: '#1d3324',
          lineHeight: 1.4,
          fontSize: '14px',
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* ============================================================
   BUSINESS OBJECT CARD
============================================================ */

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
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e1e9e3',
        borderRadius: '10px',
        padding: '18px',
        boxShadow:
          '0 2px 8px rgba(20, 92, 43, 0.05)',
      }}
    >
      <div
        style={{
          fontSize: '26px',
          marginBottom: '6px',
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          margin: '0 0 7px',
          fontSize: '17px',
        }}
      >
        {title}
      </h3>

      <p
        className="muted"
        style={{
          lineHeight: 1.55,
          margin: 0,
          fontSize: '14px',
        }}
      >
        {text}
      </p>
    </div>
  );
}

/* ============================================================
   APPROACH CARD
============================================================ */

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
        padding: '18px',
        background: '#ffffff',
      }}
    >
      <div
        style={{
          fontSize: '26px',
          marginBottom: '6px',
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          margin: '0 0 6px',
          fontSize: '17px',
        }}
      >
        {title}
      </h3>

      <p
        className="muted"
        style={{
          lineHeight: 1.55,
          margin: 0,
          fontSize: '14px',
        }}
      >
        {text}
      </p>
    </div>
  );
}

/* ============================================================
   RURAL DEVELOPMENT CARD
============================================================ */

function DevelopmentCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '10px',
        padding: '20px',
      }}
    >
      <h3
        style={{
          color: '#145c2b',
          margin: '0 0 6px',
          fontSize: '17px',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: '#526157',
          lineHeight: 1.55,
          margin: 0,
          fontSize: '14px',
        }}
      >
        {text}
      </p>
    </div>
  );
}
