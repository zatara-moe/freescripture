import Link from "next/link";
import type { Metadata } from "next";
import { GENRES, SITE_URL } from "@/lib/bible";

export const metadata: Metadata = {
  title: "Browse the Bible by kind of book",
  description:
    "Six kinds of book: story, poetry, wisdom, law, letters, and prophecy. Find the one that fits how you want to read.",
  alternates: { canonical: `${SITE_URL}/genre/` },
};

export default function GenreHub() {
  return (
    <div className="reading-column genre-hub">
      <header className="page-head">
        <h1 className="page-title">Browse by kind of book</h1>
        <p className="page-lede">Six ways the Bible reads. Pick the shape you want.</p>
      </header>
      <div className="read-list">
        {GENRES.map((g: any) => (
          <Link
            className="bookrow"
            href={`/genre/${g.slug}/`}
            key={g.slug}
            style={{ ["--rowc" as any]: `var(--g-${g.accent})` } as React.CSSProperties}
          >
            <span className="bookrow__main">
              <span className="bookrow__t">{g.kicker}</span>
              <span className="bookrow__d">{g.label}</span>
            </span>
            <svg className="bookrow__chev" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true"><path d="M1.5 1.5L7 7.5L1.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
