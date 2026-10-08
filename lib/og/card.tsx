/* Share images (the picture that shows when someone sends a Free Scripture
   link in a text, email, or post). One template for every page:
   Reading Spread logo, Lexend title, Atkinson Hyperlegible line,
   parchment and indigo, and the timeline band along the bottom.

   Each page type has its own opengraph-image.tsx next to its page.tsx,
   and they all call shareCard() below. Fonts live in lib/og/fonts/
   (SIL Open Font License, see the LICENSE files there). */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PARTS, ERAS, tlX } from "@/lib/timeline";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/png";
/** The site-wide share image, for pages that set their own share title but have no image file of their own. */
export const OG_DEFAULT = { url: "/opengraph-image", width: 1200, height: 630, alt: "Free Scripture: the Bible, one scene at a time" };

const C = {
  paper: "#F0EFEA", white: "#FAF8F3", ink: "#1C1B2E", soft: "#34334A", faded: "#55536B",
  indigo: "#404279", rule: "#DCD7C8",
  t: ["#D8C8A2", "#CFA88C", "#A7AEBD", "#8F93C9"],
};

let fontsP: Promise<any[]> | null = null;
function fonts() {
  if (!fontsP) {
    const f = (name: string) => readFile(join(process.cwd(), "lib", "og", "fonts", name));
    fontsP = Promise.all([
      f("lexend-latin-700-normal.woff"),
      f("lexend-latin-600-normal.woff"),
      f("atkinson-hyperlegible-latin-400-normal.woff"),
    ]).then(([l7, l6, a4]) => [
      { name: "Lexend", data: l7, weight: 700, style: "normal" },
      { name: "Lexend", data: l6, weight: 600, style: "normal" },
      { name: "Atkinson", data: a4, weight: 400, style: "normal" },
    ]);
  }
  return fontsP;
}

/** Shortens text to a word boundary and adds an ellipsis. */
export function clip(s: string, max: number) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max).replace(/\s+\S*$/, "");
  return cut.replace(/[,;:.\s]+$/, "") + "…";
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ width: 64, height: 64, borderRadius: 15, background: C.indigo, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="40" height="31" viewBox="0 0 26 20">
          <path d="M13 3C11 1.5 8 0.5 5 0.5C3.5 0.5 2 0.8 1 1.3V16.5C2 16 3.5 15.7 5 15.7C8 15.7 11 16.7 13 18.5C15 16.7 18 15.7 21 15.7C22.5 15.7 24 16 25 16.5V1.3C24 0.8 22.5 0.5 21 0.5C18 0.5 15 1.5 13 3Z" fill={C.paper} />
          <line x1="13" y1="3" x2="13" y2="18.5" stroke={C.indigo} strokeWidth="1.1" />
          <line x1="16" y1="7" x2="22" y2="7" stroke={C.indigo} strokeWidth="1.1" />
          <line x1="16" y1="10" x2="21" y2="10" stroke={C.indigo} strokeWidth="1.1" />
          <line x1="16" y1="13" x2="20" y2="13" stroke={C.indigo} strokeWidth="1.1" />
        </svg>
      </div>
      <div style={{ fontFamily: "Lexend", fontWeight: 600, fontSize: 34, color: C.ink, letterSpacing: -0.5 }}>Free Scripture</div>
    </div>
  );
}

/* The 4-part timeline band, drawn to scale like the site's.
   One SVG, so the dotted "long gap" texture renders the same everywhere. */
function Band({ here, labels }: { here?: number | null; labels?: boolean }) {
  const W = 1056, H = labels ? 22 : 14, PAD = 16;
  const x = (y: number) => (tlX(y) / 100) * W;
  const cx = here != null ? (here / 100) * W : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", width: W }}>
      <svg width={W} height={H + PAD * 2} viewBox={`0 ${-PAD} ${W} ${H + PAD * 2}`}>
        <defs>
          <linearGradient id="fl" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor={C.paper} /><stop offset="1" stopColor={C.t[0]} /></linearGradient>
          <linearGradient id="fr" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor={C.t[3]} /><stop offset="1" stopColor={C.paper} /></linearGradient>
          <pattern id="dots" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.7" fill={C.paper} /></pattern>
        </defs>
        <rect x={0} y={0} width={x(-2000)} height={H} fill="url(#fl)" />
        {PARTS.map((p) => <rect key={p.n} x={x(p.from)} y={0} width={x(p.to) - x(p.from)} height={H} fill={C.t[p.n - 1]} />)}
        <rect x={x(100)} y={0} width={W - x(100)} height={H} fill="url(#fr)" />
        {ERAS.filter((e) => e.gap).map((e) => <rect key={e.id} x={x(e.start)} y={0} width={x(e.end) - x(e.start)} height={H} fill="url(#dots)" />)}
        {cx != null && <circle cx={cx} cy={H / 2} r={13} fill={C.ink} stroke={C.paper} strokeWidth={5} />}
      </svg>
      {labels && (
        <div style={{ display: "flex", position: "relative", width: W, height: 30, marginTop: -8, marginBottom: 14 }}>
          {PARTS.map((p) => (
            <div key={p.n} style={{ position: "absolute", top: 0, ...(p.n === 4 ? { right: 0 } : { left: p.n === 1 ? 0 : x(p.from) + 8 }), display: "flex", fontFamily: "Lexend", fontWeight: 600, fontSize: 22, color: C.soft }}>
              {p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface CardOpts {
  /** Small line above the title, like "Story · 1 Samuel 17". */
  kicker: string;
  title: string;
  /** One or two lines under the title. */
  line?: string;
  /** Where on the timeline this page sits, in percent. Null hides the dot. */
  here?: number | null;
  /** Words to the right of the band, like "Part 2 of 4 · The First Kings". */
  where?: string;
  /** Larger band with the 4 part names under it (timeline page). */
  bandLabels?: boolean;
}

export async function shareCard(o: CardOpts) {
  const t = o.title;
  const size = t.length <= 16 ? 92 : t.length <= 28 ? 80 : t.length <= 44 ? 66 : 56;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.paper, padding: "56px 72px 48px", fontFamily: "Atkinson" }}>
        <div style={{ display: "flex", height: 8, position: "absolute", top: 0, left: 0, right: 0, background: C.indigo }} />
        <Logo />
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", paddingBottom: 8 }}>
          <div style={{ display: "flex", fontFamily: "Lexend", fontWeight: 600, fontSize: 28, color: C.indigo, marginBottom: 14 }}>{o.kicker}</div>
          <div style={{ display: "flex", fontFamily: "Lexend", fontWeight: 700, fontSize: size, lineHeight: 1.08, letterSpacing: -2, color: C.ink, maxWidth: 1056, textWrap: "balance" } as any}>{t}</div>
          {o.line && (
            <div style={{ display: "flex", fontSize: 34, lineHeight: 1.35, color: C.soft, marginTop: 20, maxWidth: 1000, textWrap: "balance" } as any}>{clip(o.line, 120)}</div>
          )}
        </div>
        <div style={{ display: "flex", marginTop: -16 }}><Band here={o.here} labels={o.bandLabels} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
          <div style={{ display: "flex", fontFamily: "Lexend", fontWeight: 600, fontSize: 26, color: C.indigo }}>freescripture.org</div>
          <div style={{ display: "flex", fontFamily: "Lexend", fontWeight: 600, fontSize: 22, color: C.faded }}>{o.where || "Free · No account · No ads"}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: (await fonts()) as any }
  );
}
