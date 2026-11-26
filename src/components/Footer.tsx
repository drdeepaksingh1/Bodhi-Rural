import Image from 'next/image';
import Link from 'next/link';
import { Copy } from '../app/bodhimart/language';

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--green2)',
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
              <Copy en="Bodhi Rural Livelihood & Agri Private Limited works toward building sustainable agricultural and rural livelihood ecosystems across India." hi="बोधि रूरल लाइवलीहुड एंड एग्री प्राइवेट लिमिटेड भारत में टिकाऊ कृषि और ग्रामीण आजीविका को बढ़ावा देने के लिए काम करती है।" />
            </p>

            <p
              style={{
                fontSize: '14px',
                fontStyle: 'italic',
                margin: 0,
                opacity: 0.9,
              }}
            >
              &quot;Bodhi – Growing Together&quot;
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
              <Copy en="QUICK LINKS" hi="महत्वपूर्ण लिंक" />
            </h3>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '7px',
              }}
            >
              <Link href="/about" style={linkStyle}>
                <Copy en="About" hi="हमारे बारे में" />
              </Link>

              <Link href="/bodhifarm" style={linkStyle}>
                BodhiFarm
              </Link>

              <Link href="/bodhimart" style={linkStyle}>
                BodhiMart
              </Link>

              <Link href="/farmer-network" style={linkStyle}>
                <Copy en="Rural Network" hi="ग्रामीण नेटवर्क" />
              </Link>

              <Link href="/projects" style={linkStyle}>
                <Copy en="Projects" hi="परियोजनाएँ" />
              </Link>

              <Link href="/contact" style={linkStyle}>
                <Copy en="Contact" hi="संपर्क" />
              </Link>

              <Link href="/skills-training" style={linkStyle}>
                <Copy en="Skills & Training" hi="कौशल और प्रशिक्षण" />
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
              <Copy en="GET IN TOUCH" hi="संपर्क करें" />
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
              <Copy en="Islampur, Nalanda" hi="इस्लामपुर, नालंदा" />
              <br />
              <Copy en="Bihar, India – 801303" hi="बिहार, भारत – 801303" />
            </p>

            <p
              style={{
                margin: '8px 0 0',
                lineHeight: '1.5',
                fontSize: '14px',
              }}
            >
              <Copy en="Phone:" hi="फ़ोन:" /> <a href="tel:+917667979679" style={{ color: '#ffffff', textDecoration: 'none' }}>+91 76679 79679</a>
              <br />
              <Copy en="Email:" hi="ईमेल:" />{' '}
              <a
                href="mailto:bodhirural@gmail.com,ceo@brlps.co.in"
                style={{
                  color: '#ffffff',
                  textDecoration: 'none',
                }}
              >
                bodhirural@gmail.com · ceo@brlps.co.in
              </a>
              <br />
              <Copy en="Website:" hi="वेबसाइट:" />{' '}
              <a href="https://www.brlps.co.in" style={{ color: '#ffffff', textDecoration: 'none' }}>
                www.brlps.co.in
              </a>
            </p>
          </div>
        </div>

        <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/privacy-policy/bodhifarm" className="underline"><Copy en="BodhiFarm privacy" hi="BodhiFarm गोपनीयता" /></Link>
          <Link href="/privacy-policy/bodhimart" className="underline"><Copy en="BodhiMart privacy" hi="BodhiMart गोपनीयता" /></Link>
          <Link href="/account-deletion" className="underline"><Copy en="Request account deletion" hi="खाता हटाने का अनुरोध करें" /></Link>
        </nav>

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
              rights reserved.<br />
               Designed by: Tattvabodhini Technologies Private Limited
            </small>

            <small
              style={{
                fontSize: '12px',
                opacity: 0.8,
              }}
            >
              <Copy en="Islampur, Nalanda, Bihar, India" hi="इस्लामपुर, नालंदा, बिहार, भारत" />
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
