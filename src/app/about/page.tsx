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
          padding: '55px 20px 50px',
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
                marginBottom: '12px',
              }}
            >
              BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED
            </div>

            <h1
              style={{
                fontSize: 'clamp(36px, 5vw, 58px)',
                lineHeight: 1.08,
                color: '#123b20',
                margin: '0 0 18px',
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
                lineHeight: 1.7,
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
          padding: '55px 20px',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'minmax(0, 1.4fr) minmax(290px, 0.6fr)',
              gap: '35px',
              alignItems: 'start',
            }}
          >
            <div>
              <SectionLabel text="ABOUT THE COMPANY" />

              <h2>Our rural livelihood and agriculture platform</h2>

              <p className="muted compactText">
                BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED is established
                as a company limited by shares with its registered office in
                Bihar.
              </p>

              <p className="muted compactText">
                The company&apos;s Memorandum of Association provides a broad
                business framework covering agriculture, horticulture,
                floriculture, agroforestry, food processing, livestock,
                poultry, fisheries, agricultural inputs, feed, agri-technology
                and rural livelihood promotion.
              </p>

              <p className="muted compactText">
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
                padding: '24px',
              }}
            >
              <h3
                style={{
                  color: '#145c2b',
                  marginTop: 0,
                  marginBottom: '18px',
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
          padding: '55px 20px',
        }}
      >
        <div className="container">
          <SectionLabel text="BUSINESS OBJECTS" />

          <h2>Our areas of activity</h2>

          <p
            className="muted"
            style={{
              maxWidth: '760px',
              marginBottom: '28px',
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
              gap: '16px',
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
          INTEGRATED APPROACH
      ========================================================= */}
      <section
        style={{
          padding: '55px 20px',
        }}
      >
        <div className="container">
          <SectionLabel text="OUR APPROACH" />

          <h2>From production to market</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
              marginTop: '25px',
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
          RURAL DEVELOPMENT
      ========================================================= */}
      <section
        style={{
          background: '#145c2b',
          padding: '55px 20px',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '800px' }}>
            <SectionLabel
              text="RURAL DEVELOPMENT"
              light
            />

            <h2 style={{ color: '#ffffff' }}>
              Building connected rural ecosystems
            </h2>

            <p
              style={{
                color: '#f0f7f2',
                fontSize: '17px',
                lineHeight: 1.75,
                marginBottom: '28px',
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

      {/* =========================================================
          TECHNOLOGY + GOVERNANCE
      ========================================================= */}
      <section
        style={{
          padding: '55px 20px',
          background: '#ffffff',
        }}
      >
        <div className="container">
          <div
            style={{
              maxWidth: '800px',
              marginBottom: '30px',
            }}
          >
            <SectionLabel text="TECHNOLOGY & MANAGEMENT" />

            <h2>Technology-enabled rural operations</h2>

            <p
              className="muted"
              style={{
                fontSize: '17px',
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              The registered objects expressly include digital platforms,
              mobile applications, farm management systems, IoT solutions
              and agritech services. This provides the foundation for
              technology-enabled farmer management, operational monitoring,
              reporting and digital commerce.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            <GovernanceCard
              title="Corporate Governance"
              text="The company's Articles of Association establish provisions relating to share capital, members, general meetings, voting rights, the Board of Directors and proceedings of the Board."
            />

            <GovernanceCard
              title="Management Structure"
              text="The Articles provide for the appointment of management positions including Chief Executive Officer, Manager, Company Secretary and Chief Financial Officer, subject to the applicable provisions of law."
            />

            <GovernanceCard
              title="Responsible Growth"
              text="The company's registered framework also provides for agreements, collaborations, infrastructure, research, quality facilities, finance, insurance and other lawful activities necessary to further its business objects."
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          CLOSING
      ========================================================= */}
      <section
        style={{
          background: '#f7f9f7',
          padding: '45px 20px',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <h2
            style={{
              marginBottom: '10px',
            }}
          >
            Empowering Rural India for a Sustainable Future
          </h2>

          <p
            className="muted"
            style={{
              margin: 0,
            }}
          >
            BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED
            <br />
            Islampur, Nalanda, Bihar – 801303
          </p>
        </div>
      </section>

      {/* =========================================================
          PAGE-LEVEL RESPONSIVE CSS
      ========================================================= */}
      <style jsx>{`
        .compactText {
          line-height: 1.75;
          margin-bottom: 14px;
        }

        @media (max-width: 700px) {
          section {
            padding-left: 15px !important;
            padding-right: 15px !important;
          }
        }
      `}</style>
    </main>
  );
}

/* =============================================================
   SECTION LABEL
============================================================= */

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
        marginBottom: '8px',
      }}
    >
      {text}
    </div>
  );
}

/* =============================================================
   COMPANY INFORMATION
============================================================= */

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
        paddingBottom: last ? 0 : '12px',
        marginBottom: last ? 0 : '12px',
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
          lineHeight: 1.45,
          fontSize: '14px',
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =============================================================
   BUSINESS OBJECT CARD
============================================================= */

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
        padding: '21px',
        boxShadow: '0 3px 12px rgba(20, 92, 43, 0.05)',
      }}
    >
      <div
        style={{
          fontSize: '28px',
          marginBottom: '8px',
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          margin: '0 0 8px',
          fontSize: '18px',
        }}
      >
        {title}
      </h3>

      <p
        className="muted"
        style={{
          lineHeight: 1.6,
          margin: 0,
          fontSize: '14px',
        }}
      >
        {text}
      </p>
    </div>
  );
}

/* =============================================================
   APPROACH CARD
============================================================= */

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
        padding: '22px',
        background: '#ffffff',
      }}
    >
      <div
        style={{
          fontSize: '28px',
          marginBottom: '8px',
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          margin: '0 0 7px',
          fontSize: '18px',
        }}
      >
        {title}
      </h3>

      <p
        className="muted"
        style={{
          lineHeight: 1.6,
          margin: 0,
          fontSize: '14px',
        }}
      >
        {text}
      </p>
    </div>
  );
}

/* =============================================================
   RURAL DEVELOPMENT CARD
============================================================= */

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
        padding: '21px',
      }}
    >
      <h3
        style={{
          color: '#145c2b',
          margin: '0 0 7px',
          fontSize: '18px',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: '#526157',
          lineHeight: 1.6,
          margin: 0,
          fontSize: '14px',
        }}
      >
        {text}
      </p>
    </div>
  );
}

/* =============================================================
   GOVERNANCE CARD
============================================================= */

function GovernanceCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        border: '1px solid #e1e9e3',
        borderRadius: '10px',
        padding: '22px',
        background: '#f7f9f7',
      }}
    >
      <h3
        style={{
          color: '#145c2b',
          margin: '0 0 9px',
          fontSize: '18px',
        }}
      >
        {title}
      </h3>

      <p
        className="muted"
        style={{
          lineHeight: 1.65,
          margin: 0,
          fontSize: '14px',
        }}
      >
        {text}
      </p>
    </div>
  );
}
