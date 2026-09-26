import type { Metadata } from "next";
import { SITE_URL } from "@/lib/bible";

export const metadata: Metadata = {
  title: "Memorize",
  description: "The Bible lines you are learning by heart, and when to practice next. Saved on your device. No account.",
  alternates: { canonical: `${SITE_URL}/memorize/` },
  robots: { index: false, follow: true },
};

/* The Memorize list lives only on this device (learn.js fills it in). */
export default function MemorizePage() {
  return (
    <div className="mem-page">
      <header className="cat-head">
        <h1 className="cat-title">Memorize</h1>
        <p className="cat-lede">Bible lines you are learning by heart. Each one comes back when it&rsquo;s time to practice again, so it sticks.</p>
        <p className="mem-page__private">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          Saved on this device only. No account.
        </p>
      </header>

      <div className="mem-empty" data-mem-empty>
        <p className="mem-empty__title">No lines yet.</p>
        <p>Every story ends with one line to memorize. Finish a story&rsquo;s Memorize step, and the line will show up here.</p>
        <a className="btn btn--primary" href="/stories/">Find a story</a>
      </div>

      <ol className="mem-list" data-mem-list></ol>
      <script src="/static/js/learn.js?v=3" defer></script>
    </div>
  );
}
