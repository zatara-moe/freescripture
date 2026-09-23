"use client";
/* The homepage's one primary action, plus a quieter second path.
   First-time readers get a specific starting point (the first readable
   story, or Psalm 23). Returning readers get their place back, in a
   story or a chapter. Reads the saved place after the page loads, so it
   never fights the server-rendered page. */
import Link from "next/link";
import { useEffect, useState } from "react";

type Start = { href: string; label: string; sub: string };
const PSALM: Start = { href: "/web/psalms/23/", label: "Start with Psalm 23", sub: "The Lord is my shepherd. A good place to begin." };

export default function QuickStart({ start }: { start?: Start }) {
  const first = start || PSALM;
  const [s, setS] = useState<Start>(first);
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem("fs-last") || "null");
      if (d && d.url) setS({ href: d.url, label: d.label ? `Continue ${d.label}` : "Continue reading", sub: "Pick up where you left off." });
    } catch (e) {}
  }, []);
  return (
    <>
      <div className="hero-actions">
        <Link className="hero-cta" href={s.href}>{s.label}</Link>
        <Link className="hero-link" href="/stories/">Browse all stories</Link>
      </div>
      <p className="hero-hint">{s.sub}</p>
    </>
  );
}
