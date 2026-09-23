"use client";
/* Site navigation that always knows the current page, including after
   in-app link taps (Next.js swaps pages without a full reload, so a
   one-time script can't keep the highlight right). */
import Link from "next/link";
import { usePathname } from "next/navigation";

type Section = "home" | "stories" | "bible" | "foryou" | "";

function sectionOf(p: string): Section {
  if (p === "/") return "home";
  if (p.startsWith("/stories/") || p.startsWith("/parables/")) return "stories";
  if (/^\/(web|kjv|bbe|genre|verse|compare)\//.test(p)) return "bible";
  if (p.startsWith("/read/")) return "foryou";
  return "";
}

const cur = (on: boolean) => (on ? { "aria-current": "page" as const } : {});

export function SiteNav() {
  const s = sectionOf(usePathname() || "/");
  return (
    <nav className="site-nav" aria-label="Primary">
      <Link href="/stories/" {...cur(s === "stories")}>Stories</Link>
      <Link href="/web/" {...cur(s === "bible")}>Bible</Link>
      <Link href="/read/" {...cur(s === "foryou")}>Verses</Link>
    </nav>
  );
}

const ICON = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export function TabBar() {
  const s = sectionOf(usePathname() || "/");
  return (
    <nav className="tab-bar" aria-label="Main">
      <Link className="tab-bar__btn" href="/" aria-label="Home" {...cur(s === "home")}>
        <svg {...ICON}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /></svg>
        <span>Home</span>
      </Link>
      <Link className="tab-bar__btn" href="/stories/" aria-label="Stories" {...cur(s === "stories")}>
        <svg {...ICON}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
        <span>Stories</span>
      </Link>
      <Link className="tab-bar__btn" href="/web/" aria-label="Bible" {...cur(s === "bible")}>
        <svg {...ICON}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M19 19H6a2 2 0 0 0-2 2" /></svg>
        <span>Bible</span>
      </Link>
      <Link className="tab-bar__btn" href="/read/" aria-label="Verses" {...cur(s === "foryou")}>
        <svg {...ICON}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" /></svg>
        <span>Verses</span>
      </Link>
    </nav>
  );
}
