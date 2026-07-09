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
      <div className="home-rows">
        {GENRES.map((g: any) => (
          <Link
            className="bookrow"
            href={`/genre/${g.slug}/`}
            key={g.slug}
            style={{ ["--rowc" as any]: `var(--g-${g.accent})` } as React.CSSProperties}
          >
            <span className="bookrow__body">
              <span className="bookrow__title">{g.kicker}</span>
              <span className="bookrow__desc">{g.label}</span>
            </span>
            <span className="bookrow__chev" aria-hidden="true">&rsaquo;</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
