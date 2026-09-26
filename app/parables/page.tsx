import type { Metadata } from "next";
import { PARABLES, PARABLE_THEMES, SITE_URL } from "@/lib/bible";
import { JsonLd } from "@/lib/JsonLd";

export const metadata: Metadata = {
  title: "The Parables of Jesus | Free Scripture",
  description:
    "Every parable Jesus told, sorted by what it is about rather than where it falls in the book. The Prodigal Son, the Good Samaritan, the Sower, and 34 more.",
  alternates: { canonical: `${SITE_URL}/parables/` },
  openGraph: {
    title: "The Parables of Jesus",
    description:
      "Every parable Jesus told, sorted by what it is about rather than where it falls in the book.",
    url: `${SITE_URL}/parables/`,
  },
};

function Chev() {
  return (
    <svg className="bookrow__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function refLabel(p: any) {
  const [book, ch, s, e] = p.ref;
  return s === e ? `${book} ${ch}:${s}` : `${book} ${ch}:${s}-${e}`;
}

export default function ParablesIndex() {
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "The Parables of Jesus",
    url: `${SITE_URL}/parables/`,
    description:
      "Every parable Jesus told, sorted by theme rather than book order.",
    hasPart: PARABLES.map((p: any) => ({
      "@type": "CreativeWork",
      name: p.title,
      url: `${SITE_URL}/parables/${p.slug}/`,
    })),
  };

  return (
    <div className="reading-column">
      <JsonLd data={jsonld} />

      <div className="page-head">
        <h1 className="page-title">The parables of Jesus</h1>
        <p className="page-lede">
          Thirty-seven stories, sorted by what they are about instead of where
          they fall in the book. If you know the story but not the chapter,
          start here.
        </p>
      </div>

      {/* Client-side filter — no data leaves the page. */}
      <div className="parable-filter">
        <input
          type="search"
          id="parable-search"
          className="parable-filter__input"
          placeholder="Find a parable by name, theme, or what happens"
          aria-label="Filter parables"
          autoComplete="off"
        />
        <p className="parable-filter__count" data-parable-count aria-live="polite"></p>
      </div>

      {PARABLE_THEMES.map((theme: any) => {
        const inTheme = PARABLES.filter((p: any) => p.theme === theme.slug);
        return (
          <section
            className="parable-theme"
            data-theme-block={theme.slug}
            key={theme.slug}
            style={{ ["--rowc" as any]: `var(--g-${theme.accent})` } as React.CSSProperties}
          >
            <div className="parable-theme__head">
              <h2 className="parable-theme__title">{theme.label}</h2>
              <p className="parable-theme__blurb">{theme.blurb}</p>
            </div>
            <div className="read-list">
              {inTheme.map((p: any) => (
                <a
                  className="bookrow bookrow--colored"
                  href={`/parables/${p.slug}/`}
                  key={p.slug}
                  data-parable-row
                  data-search={`${p.title} ${p.also.join(" ")} ${theme.label} ${p.line}`.toLowerCase()}
                  style={{ ["--rowc" as any]: `var(--g-${theme.accent})` } as React.CSSProperties}
                >
                  <span className="bookrow__main">
                    <span className="bookrow__t">{p.title}</span>
                    <span className="bookrow__d">{p.line}</span>
                    <span className="parable-row__ref">{refLabel(p)}</span>
                  </span>
                  <Chev />
                </a>
              ))}
            </div>
          </section>
        );
      })}

      <p className="parable-empty" data-parable-empty hidden>
        No parable matches that. Try a different word, or browse the themes above.
      </p>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  var input=document.getElementById('parable-search');
  if(!input) return;
  var rows=document.querySelectorAll('[data-parable-row]');
  var blocks=document.querySelectorAll('[data-theme-block]');
  var count=document.querySelector('[data-parable-count]');
  var empty=document.querySelector('[data-parable-empty]');
  var total=rows.length;

  function apply(){
    var q=input.value.trim().toLowerCase();
    var shown=0;
    for(var i=0;i<rows.length;i++){
      var hit=!q||rows[i].getAttribute('data-search').indexOf(q)!==-1;
      rows[i].hidden=!hit;
      if(hit) shown++;
    }
    // Hide a theme heading when every parable under it is filtered out
    for(var j=0;j<blocks.length;j++){
      var visible=blocks[j].querySelectorAll('[data-parable-row]:not([hidden])').length;
      blocks[j].hidden=(visible===0);
    }
    if(empty) empty.hidden=(shown>0);
    if(count) count.textContent=q?(shown+' of '+total):'';
  }
  input.addEventListener('input',apply);
})();
        `,
        }}
      />
    </div>
  );
}
