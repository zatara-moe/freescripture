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
  themeColor: "#F0EFEA",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const PREFS_BOOTSTRAP = `(function () {
  try {
    var raw = localStorage.getItem('fs-prefs');
    if (!raw) return;
    var p = JSON.parse(raw);
    var defaults = {size:'default', leading:'default', layout:'verses', font:'default', focus:'off', theme:'system', reading:'scroll', turn:'paper'};
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
          href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Literata:opsz,wght@7..72,400;7..72,700&family=Lexend:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/static/css/site.css?v=36" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F0EFEA" media="(prefers-color-scheme: light)" />
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
              <span className="site-mark__fs" aria-hidden="true">
                <svg width="22" height="16" viewBox="0 0 26 20" fill="none" aria-hidden="true">
                  <path d="M13 3C11 1.5 8 0.5 5 0.5C3.5 0.5 2 0.8 1 1.3V16.5C2 16 3.5 15.7 5 15.7C8 15.7 11 16.7 13 18.5C15 16.7 18 15.7 21 15.7C22.5 15.7 24 16 25 16.5V1.3C24 0.8 22.5 0.5 21 0.5C18 0.5 15 1.5 13 3Z" fill="currentColor" />
                  <line x1="13" y1="3" x2="13" y2="18.5" stroke="var(--gold)" strokeWidth="1" />
                  <line x1="16" y1="7" x2="22" y2="7" stroke="var(--gold)" strokeWidth="1" opacity="0.35" />
                  <line x1="16" y1="10" x2="21" y2="10" stroke="var(--gold)" strokeWidth="1" opacity="0.35" />
                  <line x1="16" y1="13" x2="20" y2="13" stroke="var(--gold)" strokeWidth="1" opacity="0.35" />
                </svg>
              </span>
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
          <nav className="site-footer__links" aria-label="More">
            <Link href="/about/">About</Link>
            <Link href="/parables/">Parables</Link>
            <Link href="/search/">Search</Link>
          </nav>
          <p className="hfa-madein">Made with <span className="hfa-heart" aria-hidden="true">&hearts;</span> in Flagstaff</p>
          <div className="hfa-rule"></div>
          <div className="hfa-mark">A <a href="https://hopeforamericans.net">Hope for Americans</a> tool</div>
          <div className="hfa-mark">Scripture for <a href="https://www.digitallutheranchurch.com">Digital Lutheran Church</a></div>
          <div className="hfa-vision">Free to read. No ads, no accounts.</div>
        </footer>

        {/* Keyboard shortcuts overlay — closed by default, opened by
            the ? button, the ? key, or Escape while open. */}
        <div className="shortcuts-modal" id="shortcuts-help" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title" hidden>
          <div className="shortcuts-modal__card">
            <div className="shortcuts-modal__head">
              <h2 id="shortcuts-title">Keyboard shortcuts</h2>
              <button type="button" data-shortcuts-close aria-label="Close shortcuts">Close</button>
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

        <script src="/static/js/shortcuts.js?v=2" defer></script>

        <script src="/static/js/reading-prefs.js?v=12" defer></script>
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
