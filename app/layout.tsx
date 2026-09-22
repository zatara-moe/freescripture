import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { SiteNav, TabBar } from "./AppNav";

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
  themeColor: "#FBF7F0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const PREFS_BOOTSTRAP = `(function () {
  try {
    var raw = localStorage.getItem('fs-prefs');
    if (!raw) return;
    var p = JSON.parse(raw);
    var defaults = {size:'default', leading:'default', layout:'verses', font:'default', focus:'off', theme:'system'};
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
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@500;700;800&family=Literata:opsz,wght@7..72,400;7..72,700&family=Lexend:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/static/css/site.css?v=27" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FBF7F0" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1A1814" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Free Scripture" />
        <link rel="apple-touch-icon" href="/static/icons/apple-touch-icon.png" />
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
            <SiteNav />
            <div className="header-actions">
            <Link className="icon-btn" href="/search/" aria-label="Search" title="Search (/)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </Link>
            <button className="icon-btn icon-btn--aa" type="button" data-prefs-open aria-label="Display settings" title="Display (D)">
              Aa
            </button>
            <button
              className="theme-toggle"
              type="button"
              data-theme-toggle
              aria-label="Switch between light and dark mode"
            >
              {/* Sun: visible when dark mode is active — click to go light */}
              <svg className="theme-toggle__sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              {/* Moon: visible when light mode is active — click to go dark */}
              <svg className="theme-toggle__moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </button>
            <button
              className="shortcuts-btn"
              type="button"
              data-shortcuts-open
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              ?
            </button>
            </div>
          </div>
        </header>

        <main id="main">{children}</main>

        <TabBar />

        <footer className="site-footer">
          <div className="foot-tag">The whole text, open to anyone.</div>
          <nav className="site-footer__links" aria-label="More">
            <Link href="/about/">About</Link>
            <Link href="/parables/">Parables</Link>
            <Link href="/search/">Search</Link>
          </nav>
          <p className="hfa-madein">Made with <span className="hfa-heart" aria-hidden="true">&hearts;</span> in Flagstaff</p>
          <div className="hfa-rule"></div>
          <div className="hfa-mark">A <a href="https://hopeforamericans.net">Hope for Americans</a> tool</div>
          <div className="hfa-mark">Scripture for <a href="https://www.digitallutheranchurch.com">Digital Lutheran Church</a></div>
          <div className="hfa-vision">free to use, the way the web used to be</div>
        </footer>

        {/* Keyboard shortcuts overlay — closed by default, opened by
            the ? button, the ? key, or Escape while open. */}
        <div className="shortcuts-modal" id="shortcuts-help" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title" hidden>
          <div className="shortcuts-modal__card">
            <div className="shortcuts-modal__head">
              <h2 id="shortcuts-title">Keyboard shortcuts</h2>
              <button type="button" data-shortcuts-close aria-label="Close">&times;</button>
            </div>
            <dl className="shortcuts-list">
              <div><dt>&larr; &rarr;</dt><dd>Previous / next chapter</dd></div>
              <div><dt>/</dt><dd>Search</dd></div>
              <div><dt>D</dt><dd>Display settings</dd></div>
              <div><dt>T</dt><dd>Switch between light and Night</dd></div>
              <div><dt>G</dt><dd>Toggle focus mode</dd></div>
              <div><dt>Esc</dt><dd>Close this, or any open panel</dd></div>
              <div><dt>?</dt><dd>Show this list</dd></div>
            </dl>
          </div>
        </div>

        {/* First-visit tip: teaches chapter swipe/arrow navigation once. */}
        <div className="nav-tip" id="nav-tip" hidden>
          <span>Swipe, or use &larr; &rarr;, to move between chapters.</span>
          <button type="button" data-tip-close aria-label="Dismiss">&times;</button>
        </div>

        <script src="/static/js/shortcuts.js?v=1" defer></script>

        <script src="/static/js/reading-prefs.js?v=10" defer></script>
        <script dangerouslySetInnerHTML={{ __html: `
(function(){
  /* --- Service worker registration --- */
  if('serviceWorker' in navigator){
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('/sw.js').catch(function(){});
    });
  }
})();
        `}} />
      </body>
    </html>
  );
}
