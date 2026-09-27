import { Fragment, type ReactNode } from "react";

/* Line breaks on purpose.

   Short info lines like "Story · 1 Samuel 17 · About 19 min" used to break
   anywhere, so a phone could show "About" at the end of one line and
   "19 min" on the next. These helpers keep each piece together and only let
   the line break at the separator.

   <Dots parts={["Story", "1 Samuel 17", "About 19 min"]} />
     -> each part stays whole, breaks happen only after a "·".
   A part that is a long phrase (a subtitle, a sentence) can be passed as
   { text, wrap: true } so it may wrap inside itself.

   <Chain items={["Baby Moses", "The Burning Bush"]} />
     -> "Baby Moses → The Burning Bush", breaking only after an arrow. Titles
        of 24 characters or fewer never break inside. A longer title may wrap
        on a narrow card, but its arrow stays on its last word. */

type Part = ReactNode | { text: ReactNode; wrap: true };

function isWrap(p: Part): p is { text: ReactNode; wrap: true } {
  return typeof p === "object" && p !== null && "wrap" in (p as any);
}

export function Dots({ parts }: { parts: Part[] }) {
  const list = parts.filter((p) => p !== null && p !== undefined && p !== false && p !== "");
  return (
    <>
      {list.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && "\u00A0· "}
          {isWrap(p) ? p.text : <span className="keep">{p as ReactNode}</span>}
        </Fragment>
      ))}
    </>
  );
}

export function Chain({ items }: { items: string[] }) {
  return (
    <>
      {items.map((t, i) => (
        <Fragment key={i}>
          <span className={t.length <= 24 ? "keep" : undefined}>{t}{i < items.length - 1 ? " →" : ""}</span>
          {i < items.length - 1 && " "}
        </Fragment>
      ))}
    </>
  );
}

/* Titles on the small book covers (about 120px of text width).
   - A short last word ("Son", "Men", "Bush") is joined to the word before
     it, so a cover never ends with one tiny word: "The / Prodigal Son".
   - A title with a very long word ("Commandments") gets a smaller size so
     the word fits instead of being cut off. */
export function coverTitle(t: string): { text: string; small: boolean } {
  const words = t.split(/\s+/);
  const last = words[words.length - 1] || "";
  const prev = words[words.length - 2] || "";
  const pair = prev.length + last.length + 1;
  let small = words.some((w) => w.length >= 11);
  let join = false;
  if (words.length >= 3 && last.length <= 5) {
    if (pair <= 12) join = true;                    // fits at the normal size
    else if (pair <= 14) { join = true; small = true; } // fits one size down
  }
  const text = join ? words.slice(0, -1).join(" ") + "\u00A0" + last : t;
  return { text, small };
}
