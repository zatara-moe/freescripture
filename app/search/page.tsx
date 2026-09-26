import type { Metadata } from "next";
import { SITE_URL } from "@/lib/bible";
import { searchCatalog } from "@/lib/search-terms";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search Bible stories, parables, people, and verses by the names you know, like the Prodigal Son or the Woman at the Well. Four free translations.",
  alternates: { canonical: `${SITE_URL}/search/` },
};

export default function Search() {
  return (
    <div className="reading-column search-page">
      <header className="page-head">
        <h1 className="page-title">Search</h1>
        <p className="page-lede">Type a story, a person, or a few words from a verse. Stories and familiar passages show first, then verses.</p>
      </header>

      <div className="search-box">
        <label className="search-trans">
          <span>Translation</span>
          <select id="search-trans" defaultValue="bsb">
            <option value="bsb">Berean Standard Bible</option>
            <option value="web">World English Bible</option>
            <option value="kjv">King James Version</option>
            <option value="bbe">Bible in Basic English</option>
          </select>
        </label>
        <input
          id="search-input"
          className="search-input"
          type="search"
          placeholder="Try: prodigal son, Nicodemus, John 3:16"
          aria-label="Search stories, people, and verses"
          autoComplete="off"
          suppressHydrationWarning
        />
      </div>

      <div id="search-shortcuts" className="search-shortcuts" aria-live="polite" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />
      <div id="search-status" className="search-status" role="status" aria-live="polite" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />
      <div id="search-results" className="search-results" aria-live="polite" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />

      <script id="search-catalog" type="application/json" dangerouslySetInnerHTML={{ __html: JSON.stringify(searchCatalog()).replace(/</g, "\\u003c") }} />
      <script src="/static/js/search.js?v=9" defer></script>
    </div>
  );
}
