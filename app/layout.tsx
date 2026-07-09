import type { Metadata, Viewport } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  metadataBase: new URL("https://freescripture.org"),
  title: {
    default: "Free Scripture. Read the whole Bible online.",
    template: "%s | Free Scripture",
  },
  description:
    "The King James, World English, and Basic English Bibles, free to read. Every book and chapter, plus a verse for whatever you're going through.",
  icons: {
    icon: "/static/favicon.svg",
    apple: "/static/favicon.svg",
  },
  openGraph: {
    siteName: "Free Scripture",
    type: "website",
    images: [{ url: "/static/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["/static/og-image.jpg"] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fcfaf6",
  width: "device-width",
  initialScale: 1,
};

const PREFS_BOOTSTRAP = `(function () {
  try {
    var raw = localStorage.getItem('fs-prefs');
    if (!raw) return;
    var p = JSON.parse(raw);
    var defaults = {font:'default', size:'default', leading:'default', layout:'flowing', italics:'on'};
    var root = document.documentElement;
    Object.keys(defaults).forEach(function (k) {
      if (p[k] && p[k] !== defaults[k]) root.setAttribute('data-fs-' + k, p[k]);
    });
  } catch (e) {}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/static/css/site.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://freescripture.org/#website",
                  url: "https://freescripture.org/",
                  name: "Free Scripture",
                  description:
                    "The King James, World English, and Basic English Bibles, free to read online. Every book and chapter.",
                  publisher: { "@id": "https://freescripture.org/#org" },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate:
                        "https://freescripture.org/search/?q={search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                  },
                  inLanguage: "en",
                },
                {
                  "@type": "Organization",
                  "@id": "https://freescripture.org/#org",
                  name: "Free Scripture",
                  url: "https://freescripture.org/",
                  description:
                    "A free online Bible reader stewarded by Hope for Americans in Flagstaff, Arizona.",
                  parentOrganization: {
                    "@type": "Organization",
                    name: "Hope for Americans",
                    url: "https://hopeforamericans.net",
                  },
                },
              ],
            }),
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: PREFS_BOOTSTRAP }} />
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>

        <header className="site-header">
          <div className="site-header__inner">
            <Link className="site-mark" href="/">
              <svg className="site-mark__icon" width="32" height="22" viewBox="0 0 32 22" fill="none" aria-hidden="true">
                <path d="M16 2Q16 0 14 0L2 0Q0 0 0 2L0 22Q7 20 16 21" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 2Q16 0 18 0L30 0Q32 0 32 2L32 22Q25 20 16 21" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="4" y1="6" x2="12.5" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <line x1="4" y1="10" x2="11.5" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <line x1="4" y1="14" x2="10.5" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <line x1="19.5" y1="6" x2="28" y2="6" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <line x1="19.5" y1="10" x2="27" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <line x1="19.5" y1="14" x2="26" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              </svg>
              <span className="site-mark__text">Free Scripture</span>
            </Link>
            <nav className="site-nav" aria-label="Primary">
              <Link href="/read/">Verses</Link>
              <Link href="/web/">Books</Link>
              <Link href="/search/">Search</Link>
              <Link href="/about/">About</Link>
            </nav>
          </div>
        </header>

        <main id="main">{children}</main>

        <nav className="tab-bar" aria-label="Quick navigation">
          <Link className="tab-bar__btn" href="/" aria-label="Home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /></svg>
            <span>Home</span>
          </Link>
          <Link className="tab-bar__btn" href="/web/" aria-label="Books">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M19 19H6a2 2 0 0 0-2 2" /></svg>
            <span>Books</span>
          </Link>
          <Link className="tab-bar__btn" href="/search/" aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <span>Search</span>
          </Link>
          <button className="tab-bar__btn" type="button" data-prefs-open aria-label="Reading settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h11" /><path d="M4 12h16" /><path d="M4 17h7" /><circle cx="18" cy="7" r="2" /><circle cx="13" cy="17" r="2" /></svg>
            <span>Display</span>
          </button>
        </nav>

        <footer className="site-footer">
          <div className="foot-tag">The whole text, open to anyone.</div>
          <p className="hfa-madein">Made with <span className="hfa-heart" aria-hidden="true">&hearts;</span> in Flagstaff</p>
          <div className="hfa-rule"></div>
          <div className="hfa-mark">A <a href="https://hopeforamericans.net">Hope for Americans</a> tool</div>
          <div className="hfa-vision">free to use, the way the web used to be</div>
        </footer>

        <script src="/static/js/reading-prefs.js" defer></script>
      </body>
    </html>
  );
}
