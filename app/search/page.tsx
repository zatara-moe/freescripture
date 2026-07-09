import type { Metadata } from "next";
import { SITE_URL } from "@/lib/bible";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search the King James, World English, and Basic English Bibles for a word or a verse.",
  alternates: { canonical: `${SITE_URL}/search/` },
};

export default function Search() {
  return (
    <div className="reading-column search-page">
      <header className="page-head">
        <h1 className="page-title">Search</h1>
        <p className="page-lede">Type a word or a phrase to find it across a translation.</p>
      </header>

      <div className="search-box">
        <label className="search-trans">
          <span>Translation</span>
          <select id="search-trans" defaultValue="web">
            <option value="web">World English Bible</option>
            <option value="kjv">King James Version</option>
            <option value="bbe">Bible in Basic English</option>
          </select>
        </label>
        <input
          id="search-input"
          className="search-input"
          type="search"
          placeholder="Search a word or verse"
          aria-label="Search scripture"
          autoComplete="off"
        />
      </div>

      <div id="search-results" className="search-results" aria-live="polite"></div>

      <script src="/static/js/search.js" defer></script>
    </div>
  );
}
