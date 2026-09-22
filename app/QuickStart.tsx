"use client";
/* The homepage's one primary action. First-time readers get a specific,
   gentle starting point. Returning readers get their place back.
   Reads the saved position after the page loads, so it never fights
   the server-rendered page. */
import Link from "next/link";
import { useEffect, useState } from "react";

const START = { href: "/web/psalms/23/", label: "Start with Psalm 23", sub: "The Lord is my shepherd. A good place to begin." };

export default function QuickStart() {
  const [s, setS] = useState(START);
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem("fs-last") || "null");
      if (d && d.url) setS({ href: d.url, label: d.label ? `Continue ${d.label}` : "Continue reading", sub: "Pick up where you left off." });
    } catch (e) {}
  }, []);
  return (
    <Link className="quick-start" href={s.href}>
      <span className="quick-start__body">
        <span className="quick-start__label">{s.label}</span>
        <span className="quick-start__sub">{s.sub}</span>
      </span>
      <svg className="quick-start__chev" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
    </Link>
  );
}
