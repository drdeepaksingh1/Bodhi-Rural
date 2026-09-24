import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      style={{
        background: '#145c2b',
        color: '#ffffff',
        marginTop: '60px',
      }}
    >
      <div
        className="container"
        style={{
          paddingTop: '48px',
          paddingBottom: '24px',
        }}
      >
        {/* Main Footer */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '50px',
            justifyContent: 'space-between',
          }}
        >
          {/* Company */}
          <div
            style={{
              flex: '1 1 360px',
              minWidth: '280px',
            }}
          >
            <Link
              href="/"
              style={{
                display: 'inline-block',
                background: '#ffffff',
                padding: '8px',
                borderRadius: '4px',
                marginBottom: '18px',
              }}
            >
              <Image
                src="/branding/bodhi-rural-logo.png"
                alt="BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED"
                width={302}
                height={90}
                style={{
                  width: '190px',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </Link>

            <p
              style={{
                fontSize: '17px',
                lineHeight: '1.7',
                margin: '0 0 18px',
                maxWidth: '520px',
              }}
            >
              Bodhi Rural Livelihood & Agri Private Limited works toward
              building sustainable agricultural and rural livelihood
              ecosystems across India.
            </p>

            <p
              style={{
                fontSize: '16px',
                fontStyle: 'italic',
                margin: 0,
                opacity: 0.9,
              }}
            >
              "Bodhi – Growing Together"
            </p>
          </div>

          {/* Quick Links */}
          <div
            style={{
              flex: '0 1 220px',
              minWidth: '180px',
            }}
          >
            <h3
              style={{
                fontSize: '18px',
                marginBottom: '20px',
                color: '#ffffff',
              }}
            >
              QUICK LINKS
            </h3>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <Link href="/about" style={linkStyle}>
                About
              </Link>

              <Link href="/bodhifarm" style={linkStyle}>
                BodhiFarm
              </Link>

              <Link href="/bodhimart" style={linkStyle}>
                BodhiMart
              </Link>

              <Link href="/farmer-network" style={linkStyle}>
                Farmer Network
              </Link>

              <Link href="/projects" style={linkStyle}>
                Projects
              </Link>

              <Link href="/contact" style={linkStyle}>
                Contact
              </Link>
            </div>
          </div>

          {/* Get in Touch */}
          <div
            style={{
              flex: '1 1 280px',
              minWidth: '260px',
            }}
          >
            <h3
              style={{
                fontSize: '18px',
                marginBottom: '20px',
                color: '#ffffff',
              }}
            >
              GET IN TOUCH
            </h3>

            <p
              style={{
                fontWeight: 700,
                margin: '0 0 12px',
                fontSize: '16px',
              }}
            >
              Bodhi Rural Livelihood & Agri Pvt. Ltd.
            </p>

            <p
              style={{
                margin: '0 0 4px',
                lineHeight: '1.6',
              }}
            >
              Islampur, Nalanda
              <br />
              Bihar, India – 801303
            </p>

            <p
              style={{
                margin: '14px 0 4px',
                lineHeight: '1.6',
              }}
            >
              Phone: +91 76679 79679
              <br />
              Email:{' '}
              <a
                href="mailto:ceo@brlps.co.in"
                style={{
                  color: '#ffffff',
                  textDecoration: 'none',
                }}
              >
                ceo@brlps.co.in
              </a>
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.25)',
            marginTop: '42px',
            paddingTop: '22px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '15px',
            }}
          >
            <small
              style={{
                fontSize: '14px',
                opacity: 0.8,
              }}
            >
              © 2026 BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED. All
              rights reserved.
            </small>

            <small
              style={{
                fontSize: '14px',
                opacity: 0.8,
              }}
            >
              Islampur, Nalanda, Bihar, India
            </small>
          </div>
        </div>
      </div>
    </footer>
  );
}

const linkStyle = {
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: '16px',
  opacity: 0.9,
};
