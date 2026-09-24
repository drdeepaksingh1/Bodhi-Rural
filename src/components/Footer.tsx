import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      style={{
        background: '#145c2b',
        color: '#ffffff',
        marginTop: '50px',
      }}
    >
      <div
        className="container"
        style={{
          paddingTop: '30px',
          paddingBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '35px',
            justifyContent: 'space-between',
          }}
        >
          {/* Company */}
          <div
            style={{
              flex: '1 1 340px',
              minWidth: '260px',
            }}
          >
            <Link
              href="/"
              style={{
                display: 'inline-block',
                background: '#ffffff',
                padding: '5px',
                borderRadius: '4px',
                marginBottom: '10px',
              }}
            >
              <Image
                src="/branding/bodhi-rural-logo.png"
                alt="BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED"
                width={302}
                height={90}
                style={{
                  width: '155px',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </Link>

            <p
              style={{
                fontSize: '14px',
                lineHeight: '1.55',
                margin: '0 0 10px',
                maxWidth: '460px',
              }}
            >
              Bodhi Rural Livelihood & Agri Private Limited works toward
              building sustainable agricultural and rural livelihood
              ecosystems across India.
            </p>

            <p
              style={{
                fontSize: '14px',
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
              flex: '0 1 180px',
              minWidth: '160px',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                margin: '0 0 13px',
                color: '#ffffff',
              }}
            >
              QUICK LINKS
            </h3>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '7px',
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
              flex: '1 1 250px',
              minWidth: '230px',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                margin: '0 0 13px',
                color: '#ffffff',
              }}
            >
              GET IN TOUCH
            </h3>

            <p
              style={{
                fontWeight: 700,
                margin: '0 0 7px',
                fontSize: '14px',
              }}
            >
              Bodhi Rural Livelihood & Agri Pvt. Ltd.
            </p>

            <p
              style={{
                margin: 0,
                lineHeight: '1.5',
                fontSize: '14px',
              }}
            >
              Islampur, Nalanda
              <br />
              Bihar, India – 801303
            </p>

            <p
              style={{
                margin: '8px 0 0',
                lineHeight: '1.5',
                fontSize: '14px',
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

        {/* Bottom */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.25)',
            marginTop: '25px',
            paddingTop: '13px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <small
              style={{
                fontSize: '12px',
                opacity: 0.8,
              }}
            >
              © 2026 BODHI RURAL LIVELIHOOD & AGRI PRIVATE LIMITED. All
              rights reserved.
            </small>

            <small
              style={{
                fontSize: '12px',
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
  fontSize: '14px',
  opacity: 0.9,
};
