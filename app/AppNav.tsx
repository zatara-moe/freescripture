"use client";
/* The same four places on every device, named for what's inside:
     Home        an overview of everything, and your next step
     Stories     Bible stories, parables, and verses, explained in plain words
     Full Bible  the Bible text itself, word for word
     Memorize    the lines you are learning by heart
   Desktop shows them in the header. Phones show them as a tab bar. */
import { useEffect } from "react";
import { usePathname } from "next/navigation";

type Section = "home" | "stories" | "bible" | "memorize" | "";

function sectionOf(p: string): Section {
  if (p === "/") return "home";
  if (/^\/(stories|parables|read)\//.test(p)) return "stories";
  if (/^\/(bsb|web|kjv|bbe|genre|verse|compare|search)\//.test(p)) return "bible";
  if (p.startsWith("/memorize/")) return "memorize";
  return "";
}

const cur = (on: boolean) => (on ? { "aria-current": "page" as const } : {});

export function SiteNav() {
  const s = sectionOf(usePathname() || "/");
  return (
    <nav className="site-nav" aria-label="Primary">
      <a href="/" {...cur(s === "home")}>Home</a>
      <a href="/stories/" {...cur(s === "stories")}>Stories</a>
      <a href="/bsb/" {...cur(s === "bible")}>Full Bible</a>
      <a href="/memorize/" {...cur(s === "memorize")}>Memorize</a>
    </nav>
  );
}

const ICON = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export function TabBar() {
  const s = sectionOf(usePathname() || "/");
  return (
    <nav className="tab-bar" aria-label="Main">
      <a className="tab-bar__btn" href="/" {...cur(s === "home")}>
        <svg {...ICON}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /></svg>
        <span>Home</span>
      </a>
      <a className="tab-bar__btn" href="/stories/" {...cur(s === "stories")}>
        <svg {...ICON}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
        <span>Stories</span>
      </a>
      <a className="tab-bar__btn" href="/bsb/" {...cur(s === "bible")}>
        <svg {...ICON}><path d="M2 5.5C4 4.5 8 4 12 6.5c4-2.5 8-2 10-1V19c-2-1-6-1.5-10 1-4-2.5-8-2-10-1z" /><path d="M12 6.5V20" /></svg>
        <span>Full Bible</span>
      </a>
      <a className="tab-bar__btn" href="/memorize/" {...cur(s === "memorize")}>
        <svg {...ICON}><path d="M6 3h12v18l-6-4-6 4z" /></svg>
        <span>Memorize</span>
      </a>
    </nav>
  );
}

/* Tells the page scripts (learn.js, stories.js) that React has finished
   hydrating. They wait for this before changing the page, so React never
   sees a page it didn't render and throws the changes away. */
export function Hydrated() {
  useEffect(() => {
    (window as any).__fsHydrated = true;
    window.dispatchEvent(new Event("fs:hydrated"));
  }, []);
  return null;
}
