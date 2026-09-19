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
          href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,300;0,400;0,600;0,700;1,400&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;0,7..72,700;1,7..72,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/static/css/site.css?v=19" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#fcfaf6" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1c1812" media="(prefers-color-scheme: dark)" />
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
            <nav className="site-nav" aria-label="Primary">
              <Link href="/read/">For you</Link>
              <Link href="/parables/">Parables</Link>
              <Link href="/web/">Books</Link>
              <Link href="/search/">Search</Link>
              <Link href="/about/">About</Link>
            </nav>
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
        </header>

        <main id="main">{children}</main>

        <nav className="tab-bar" aria-label="Quick navigation">
          <Link className="tab-bar__btn" href="/" aria-label="Home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /></svg>
            <span>Home</span>
          </Link>
          <Link className="tab-bar__btn" href="/read/" aria-label="For you">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" /></svg>
            <span>For you</span>
          </Link>
          <Link className="tab-bar__btn" href="/parables/" aria-label="Parables">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
            <span>Parables</span>
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
              <div><dt>D</dt><dd>Reading display settings</dd></div>
              <div><dt>T</dt><dd>Light / dark mode</dd></div>
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

        <script src="/static/js/reading-prefs.js?v=8" defer></script>
        <script dangerouslySetInnerHTML={{ __html: `
(function(){
  /* --- Service worker registration --- */
  if('serviceWorker' in navigator){
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('/sw.js').catch(function(){});
    });
  }
  /* --- Active tab highlighting: read current path and mark the
     matching tab-bar button with aria-current="page" so CSS can
     style it. Runs immediately so there's no visible flash. --- */
  var p=location.pathname;
  var tabs=document.querySelectorAll('.tab-bar__btn');
  [].forEach.call(tabs,function(btn){
    var label=btn.getAttribute('aria-label')||'';
    var active=false;
    if(label==='Home') active=(p==='/');
    else if(label==='For you') active=(p.startsWith('/read/'));
    else if(label==='Parables') active=(p.startsWith('/parables/'));
    else if(label==='Books') active=(/^\/(web|kjv|bbe|genre)\//.test(p));
    else if(label==='Search') active=p.startsWith('/search/');
    if(active) btn.setAttribute('aria-current','page');
  });
})();
        `}} />
      </body>
    </html>
  );
}
