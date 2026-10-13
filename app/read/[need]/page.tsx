import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  NEEDS,
  DEFAULT_TRANS,
  bookSlug,
  pullVerse,
  SITE_URL,
} from "@/lib/bible";
import { JsonLd } from "@/lib/JsonLd";

type Params = { need: string };

export function generateStaticParams() {
  return NEEDS.map((n: any) => ({ need: n.slug }));
}

export const dynamicParams = false;

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { need } = await params;
  const n = NEEDS.find((x: any) => x.slug === need);
  if (!n) return {};
  return {
    title: n.meta_title || n.h1,
    description: n.meta_desc || n.lede,
    alternates: { canonical: `${SITE_URL}/read/${need}/` },
    openGraph: { siteName: "Free Scripture", title: `${n.h1 || n.short} | Free Scripture`, description: n.meta_desc || n.lede, url: `${SITE_URL}/read/${need}/` },
  };
}

function refLabel(book: string, chapter: number) {
  const label = book === "Psalms" ? "Psalm" : book;
  return `${label} ${chapter}`;
}

/* "When you're afraid" -> "Afraid", for the compact tags in the rail */
const TAG: Record<string, string> = {
  "racing-mind": "Racing thoughts",
  "celebrate": "Celebrating",
  "forgiveness": "Hurt by someone",
};
function tagLabel(slug: string, short: string) {
  if (TAG[slug]) return TAG[slug];
  const t = short.replace(/^When (you're |you've |you feel |you have |you need |you )?/, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function Other({ x, current }: { x: any; current: string }) {
  const on = x.slug === current;
  return (
    <li>
      <a
        className={`need-others__link${on ? " is-on" : ""}`}
        href={`/read/${x.slug}/`}
        aria-current={on ? "page" : undefined}
        title={x.short}
      >
        {tagLabel(x.slug, x.short)}
      </a>
    </li>
  );
}

export default async function NeedPage(
  { params }: { params: Promise<Params> }
) {
  const { need } = await params;
  const n = NEEDS.find((x: any) => x.slug === need);
  if (!n) notFound();

  const hard = NEEDS.filter((x: any) => x.group === "hard");
  const good = NEEDS.filter((x: any) => x.group === "good");

  // Build the passages once so schema and render agree.
  const passages = n.passages.map((p: any) => {
    const [book, chapter, verse, accent, frame] = p;
    return {
      book, chapter, verse, accent, frame,
      text: pullVerse(DEFAULT_TRANS, book, chapter, verse),
      slug: bookSlug(book),
    };
  });

  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/read/${need}/#faq`,
        name: n.h1,
        description: n.meta_desc || n.lede,
        url: `${SITE_URL}/read/${need}/`,
        isPartOf: { "@id": "https://freescripture.org/#website" },
        mainEntity: passages
          .filter((p: any) => p.text)
          .map((p: any) => ({
            "@type": "Question",
            name: `What does ${refLabel(p.book, p.chapter)}:${p.verse} say?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${p.text} (${refLabel(p.book, p.chapter)}:${p.verse}, BSB)`,
              url: `${SITE_URL}/${DEFAULT_TRANS}/${p.slug}/${p.chapter}/#v${p.verse}`,
            },
          })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Verses", item: `${SITE_URL}/read/` },
          { "@type": "ListItem", position: 2, name: n.short, item: `${SITE_URL}/read/${need}/` },
        ],
      },
    ],
  };

  return (
    <>
    <div className="reading-column need-page">
      <JsonLd data={jsonld} />
      <aside className="rail need-rail" aria-label="On this page">
        <p className="rail__crumb"><a href="/read/">&larr; All verses</a></p>

        <nav className="need-toc" aria-labelledby="need-toc-label">
          <p className="rail__label" id="need-toc-label">On this page</p>
          <ol className="need-toc__list">
            {passages.map((p: any, i: number) => (
              <li key={i}>
                <a
                  className="need-toc__link"
                  href={`#p${i + 1}`}
                  data-toc-link={`p${i + 1}`}
                >
                  <span className="need-toc__ref">{refLabel(p.book, p.chapter)}:{p.verse}</span>
                  {p.frame && <span className="need-toc__frame">{p.frame}</span>}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <button className="rail-btn need-rail__send" type="button" data-share-page data-page-title={n.h1} data-page-url={`${SITE_URL}/read/${need}/`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" /></svg>
          <span data-share-page-label>Send this page</span>
        </button>

        <nav className="need-others" aria-labelledby="need-others-label">
          <p className="rail__label" id="need-others-label">For a hard day</p>
          <ul className="need-others__list">
            {hard.map((x: any) => <Other x={x} current={need} key={x.slug} />)}
          </ul>
          <p className="rail__label need-others__sub">To share good news</p>
          <ul className="need-others__list">
            {good.map((x: any) => <Other x={x} current={need} key={x.slug} />)}
          </ul>
        </nav>
      </aside>

      <div className="page-head">
        <p className="ph-eyebrow">Bible verses for how you feel</p>
        <h1 className="page-title ph-title">{n.h1}</h1>
        <p className="page-lede ph-lede">{n.lede}</p>
      </div>

      <div className="passage-list">
        {passages.map((p: any, i: number) => {
          const url = `/${DEFAULT_TRANS}/${p.slug}/${p.chapter}/#v${p.verse}`;
          return (
            <article className="passage" id={`p${i + 1}`} key={i}>
              <div className="passage__ref">
                {refLabel(p.book, p.chapter)}:{p.verse}
              </div>
              {p.frame && <div className="passage__frame">{p.frame}</div>}
              {p.text && <blockquote className="passage__verse">{p.text}</blockquote>}
              <div className="passage__acts">
                <a className="rbtn" href={url}>Read the chapter</a>
                <button
                  className="rbtn rbtn--subtle"
                  type="button"
                  data-share-verse
                  data-verse-text={p.text || ""}
                  data-verse-ref={`${refLabel(p.book, p.chapter)}:${p.verse}`}
                  data-verse-url={`${SITE_URL}/${DEFAULT_TRANS}/${p.slug}/${p.chapter}/#v${p.verse}`}
                >
                  Share
                </button>
                <button
                  className="rbtn rbtn--subtle"
                  type="button"
                  data-copy-verse
                  data-verse-text={p.text || ""}
                  data-verse-ref={`${refLabel(p.book, p.chapter)}:${p.verse}`}
                >
                  Copy
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Below 1200px the rail is just the back link, so "where next" lives here. */}
      <nav className="need-more" aria-labelledby="need-more-label">
        <h2 className="book-section-label" id="need-more-label">More verses for how you feel</h2>
        <p className="rail__label">For a hard day</p>
        <ul className="need-others__list">
          {hard.map((x: any) => <Other x={x} current={need} key={x.slug} />)}
        </ul>
        <p className="rail__label need-others__sub">To share good news</p>
        <ul className="need-others__list">
          {good.map((x: any) => <Other x={x} current={need} key={x.slug} />)}
        </ul>
      </nav>
    </div>

      <script dangerouslySetInnerHTML={{ __html: `
(function(){
  document.addEventListener('click',function(e){
    var share=e.target.closest('[data-share-verse]');
    if(share&&navigator.share){
      var t=share.getAttribute('data-verse-text');
      var r=share.getAttribute('data-verse-ref');
      var u=share.getAttribute('data-verse-url');
      navigator.share({title:r,text:t+' ('+r+')',url:u}).catch(function(){});
      return;
    }
    var copy=e.target.closest('[data-copy-verse]');
    if(copy){
      var t=copy.getAttribute('data-verse-text');
      var r=copy.getAttribute('data-verse-ref');
      var full='"'+t+'" ('+r+', BSB)';
      if(navigator.clipboard&&window.isSecureContext){
        navigator.clipboard.writeText(full).then(function(){
          var span=copy.querySelector('.rbtn__copied')||copy;
          var orig=span.textContent;span.textContent='Copied';
          setTimeout(function(){span.textContent=orig;},1600);
        });
      }
      return;
    }
  });
  // Send this page: native share sheet, or copy the link
  var sp=document.querySelector('[data-share-page]');
  if(sp){
    sp.addEventListener('click',function(){
      var u=sp.getAttribute('data-page-url'), t=sp.getAttribute('data-page-title');
      if(navigator.share){ navigator.share({title:t,url:u}).catch(function(){}); return; }
      if(navigator.clipboard&&window.isSecureContext){
        navigator.clipboard.writeText(u).then(function(){
          var l=sp.querySelector('[data-share-page-label]'); var o=l.textContent;
          l.textContent='Link copied'; setTimeout(function(){l.textContent=o;},1600);
        });
      }
    });
  }
  // Highlight the verse you are reading in the rail
  var links=document.querySelectorAll('[data-toc-link]');
  function spy(){
  if(links.length&&'IntersectionObserver' in window){
    var byId={}; for(var k=0;k<links.length;k++) byId[links[k].getAttribute('data-toc-link')]=links[k];
    var seen={};
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){ seen[e.target.id]=e.isIntersecting; });
      var first=null;
      for(var k=0;k<links.length;k++){ var id=links[k].getAttribute('data-toc-link'); if(seen[id]){ first=id; break; } }
      if(!first) return;
      // Kept on <html> (outside React) so hydration never sees a change;
      // CSS marks the matching rail link.
      document.documentElement.setAttribute('data-toc-on',first);
    },{rootMargin:'-96px 0px -45% 0px'});
    for(var id in byId){ var el=document.getElementById(id); if(el) io.observe(el); }
  }
  }
  spy();
  // Hide share buttons if Web Share API isn't available (class on <html>,
  // which is exempt from hydration checks)
  if(!navigator.share) document.documentElement.classList.add('no-webshare');
})();
      ` }} />
  </>
  );
}
