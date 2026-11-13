import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      aria-labelledby="not-found-title"
      style={{
        minHeight: '62vh',
        display: 'grid',
        placeItems: 'center',
        padding: '72px 24px',
        background: '#f7f7f2',
        color: '#1c2b23',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 620 }}>
        <p
          style={{
            margin: 0,
            color: '#bd9250',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '.18em',
          }}
        >
          PAGE NOT FOUND · 404
        </p>
        <h1
          id="not-found-title"
          style={{
            margin: '18px 0 14px',
            color: '#123d2b',
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 'clamp(38px, 7vw, 58px)',
            fontWeight: 500,
            letterSpacing: '-.035em',
            lineHeight: 1.08,
          }}
        >
          This page isn’t here.
        </h1>
        <p style={{ margin: '0 auto', maxWidth: 500, color: '#617067', fontSize: 16, lineHeight: 1.75 }}>
          The address may have changed, or the page may no longer be available.
          You can return to the homepage or explore our work.
        </p>
        <nav
          aria-label="Helpful links"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 12,
            marginTop: 30,
          }}
        >
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              minHeight: 48,
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 20px',
              background: '#123d2b',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Go to homepage
          </Link>
          <Link
            href="/projects"
            style={{
              display: 'inline-flex',
              minHeight: 48,
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 20px',
              border: '1px solid #123d2b',
              color: '#123d2b',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Explore our work
          </Link>
        </nav>
      </div>
    </main>
  );
}
