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
      <span className="bookrow__body">
        <span className="bookrow__title">{n.short}</span>
        {n.card && <span className="bookrow__desc">{n.card}</span>}
      </span>
      <span className="bookrow__chev" aria-hidden="true">&rsaquo;</span>
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

      <h2 className="book-section__label">For a hard day</h2>
      <div className="home-rows">{hard.map(Row)}</div>

      <h2 className="book-section__label">To share good news</h2>
      <div className="home-rows">{good.map(Row)}</div>
    </div>
  );
}
