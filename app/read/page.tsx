import Link from "next/link";
import type { Metadata } from "next";
import { NEEDS, SITE_URL } from "@/lib/bible";

export const metadata: Metadata = {
  title: "Find a verse for the moment",
  description:
    "Scripture for what you're going through. Fear, grief, strength, guilt, forgiveness, and good news to share. Read one, or send it along.",
  alternates: { canonical: `${SITE_URL}/read/` },
};

export default function NeedsHub() {
  const hard = NEEDS.filter((n: any) => n.group === "hard");
  const good = NEEDS.filter((n: any) => n.group === "good");

  const Row = (n: any) => (
    <Link
      className="bookrow"
      href={`/read/${n.slug}/`}
      key={n.slug}
      style={{ ["--rowc" as any]: `var(--g-${n.accent})` } as React.CSSProperties}
    >
      <span className="bookrow__main">
        <span className="bookrow__t">{n.short}</span>
        {n.card && <span className="bookrow__d">{n.card}</span>}
      </span>
      <svg className="bookrow__chev" width="9" height="15" viewBox="0 0 9 15" fill="none" aria-hidden="true"><path d="M1.5 1.5L7 7.5L1.5 13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </Link>
  );

  return (
    <div className="reading-column needs-hub">
      <header className="page-head">
        <h1 className="page-title">Find a verse for the moment</h1>
        <p className="page-lede">
          Pick what fits. Read into a passage, or grab a line and send it to someone.
        </p>
      </header>

      <h2 className="book-section-label">For a hard day</h2>
      <div className="read-list">{hard.map(Row)}</div>

      <h2 className="book-section-label">To share good news</h2>
      <div className="read-list">{good.map(Row)}</div>
    </div>
  );
}
