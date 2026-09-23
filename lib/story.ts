/* Scene by Scene: renders a story written in the Style Guide v1.1
   Markdown format. Supports only what the guide uses: zone headings (#),
   boxes (##), scenes (###), paragraphs, bold, italics, lists, tables,
   and blockquotes (Imagine the Scene boxes and hymn quotes).
   The † reviewer marks are stripped from what readers see. */
import fs from "node:fs";
import path from "node:path";

export type Block =
  | { type: "p"; html: string }
  | { type: "label"; html: string }
  | { type: "key"; html: string }
  | { type: "scene"; id: string; num: number; title: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "imagine"; label: string; html: string }
  | { type: "quote"; lines: string[] };

export interface Box { id: string; emoji: string; title: string; blocks: Block[] }
export interface Zone { id: string; title: string; boxes: Box[] }
export interface Story { zones: Zone[]; bigIdea: string | null; words: number; scenes: number }

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
export function inline(s: string) {
  return esc(s.replace(/†/g, ""))
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function splitRow(line: string) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

export function loadStory(slug: string): Story | null {
  const file = path.join(process.cwd(), "data", "stories", `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);

  const zones: Zone[] = [];
  let zone: Zone | null = null;
  let box: Box | null = null;
  let words = 0;
  let scenes = 0;
  let para: string[] = [];

  const push = (b: Block) => { if (box) box.blocks.push(b); };
  const flush = () => {
    if (!para.length) return;
    const text = para.join(" ");
    const html = inline(text);
    const boldOnly = /^\*\*[^*]+\*\*$/.test(text.trim());
    if (boldOnly && text.trim().split(/\s+/).length <= 3) push({ type: "label", html });
    else if (boldOnly) push({ type: "key", html });
    else push({ type: "p", html });
    if (box && box.id === "plain-retelling") words += text.split(/\s+/).length;
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^# /.test(line)) {
      flush();
      const title = line.slice(2).trim();
      zone = { id: slugify(title), title, boxes: [] };
      zones.push(zone); box = null; continue;
    }
    if (/^## /.test(line)) {
      flush();
      const raw = line.slice(3).trim();
      const m = raw.match(/^(\p{Extended_Pictographic}\uFE0F?)\s*(.*)$/u);
      const emoji = m ? m[1] : "";
      const title = (m ? m[2] : raw).trim();
      box = { id: slugify(title.replace(/[:"'].*$/, "")) || slugify(title), emoji, title, blocks: [] };
      zone?.boxes.push(box); continue;
    }
    if (/^### /.test(line)) {
      flush();
      const t = line.slice(4).trim();
      const m = t.match(/^(?:Scene|Section)\s+(\d+):\s*(.*)$/);
      const num = m ? parseInt(m[1], 10) : ++scenes;
      if (m) scenes = Math.max(scenes, num);
      push({ type: "scene", id: `scene-${num}`, num, title: m ? m[2] : t });
      continue;
    }
    if (/^> /.test(line)) {
      flush();
      const q: string[] = [];
      while (i < lines.length && /^> ?/.test(lines[i])) { q.push(lines[i].replace(/^> ?/, "")); i++; }
      i--;
      if (q[0].includes("Imagine the Scene")) {
        push({ type: "imagine", label: inline(q[0]), html: inline(q.slice(1).join(" ")) });
      } else {
        push({ type: "quote", lines: q.map(inline) });
      }
      continue;
    }
    if (/^\|/.test(line)) {
      flush();
      const t: string[] = [];
      while (i < lines.length && /^\|/.test(lines[i])) { t.push(lines[i]); i++; }
      i--;
      const head = splitRow(t[0]).map(inline);
      const rows = t.slice(2).map((r) => splitRow(r).map(inline));
      push({ type: "table", head, rows });
      continue;
    }
    if (/^- /.test(line)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i])) { items.push(inline(lines[i].slice(2))); i++; }
      i--;
      push({ type: "ul", items });
      continue;
    }
    if (/^---\s*$/.test(line)) { flush(); continue; }
    if (!line.trim()) { flush(); continue; }
    para.push(line.trim());
  }
  flush();

  /* The Big Idea is shown on its own at the end of the page, so pull it
     out of the Why It Matters zone. */
  let bigIdea: string | null = null;
  for (const z of zones) {
    const idx = z.boxes.findIndex((b) => b.id === "big-idea");
    if (idx >= 0) {
      const b = z.boxes[idx];
      const p = b.blocks.find((x) => x.type === "p" || x.type === "label" || x.type === "key") as any;
      bigIdea = p ? p.html.replace(/<\/?strong>/g, "") : null;
      z.boxes.splice(idx, 1);
    }
  }
  return { zones, bigIdea, words, scenes };
}

/* ------------------------------------------------------------------
   Scenes with verse ranges, for side-by-side reading.
   The verse range for each scene comes from the story's own
   "Map of the Story" table (Scene | Verses | What happens), so writers
   only record it once. Ranges look like "17:1–3", "17:4", or "1:17–2:10".
   ------------------------------------------------------------------ */
export interface SceneRange { startCh: number; startV: number; endCh: number; endV: number }
export interface Scene { num: number; title: string; html: string; range: SceneRange | null }

function parseRange(cell: string): SceneRange | null {
  const t = cell.replace(/<[^>]+>/g, "").replace(/\s+/g, "").replace(/[–—]/g, "-");
  const m = t.match(/^(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
  if (!m) return null;
  const startCh = +m[1], startV = +m[2];
  const endCh = m[3] ? +m[3] : startCh;
  const endV = m[4] ? +m[4] : startV;
  return { startCh, startV, endCh, endV };
}

function blockHtml(b: Block): string {
  switch (b.type) {
    case "p": case "key": case "label": return `<p>${b.html}</p>`;
    case "ul": return `<ul>${b.items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
    case "quote": return `<blockquote>${b.lines.join("<br>")}</blockquote>`;
    case "imagine": return `<aside class="cmp-imagine"><strong>${b.label.replace(/<\/?em>/g, "")}</strong> ${b.html}</aside>`;
    default: return "";
  }
}

export function loadScenes(slug: string): Scene[] {
  const story = loadStory(slug);
  if (!story) return [];
  const boxes = story.zones.flatMap((z) => z.boxes);
  const ranges = new Map<number, SceneRange>();
  const map = boxes.find((b) => b.id.startsWith("map-of-the"));
  const table = map?.blocks.find((b) => b.type === "table") as Extract<Block, { type: "table" }> | undefined;
  if (table) {
    for (const row of table.rows) {
      const n = row[0]?.replace(/<[^>]+>/g, "").match(/^(\d+)\./);
      const r = row[1] ? parseRange(row[1]) : null;
      if (n && r) ranges.set(+n[1], r);
    }
  }
  const retell = boxes.find((b) => b.id === "plain-retelling");
  const scenes: Scene[] = [];
  let cur: Scene | null = null;
  for (const b of retell?.blocks || []) {
    if (b.type === "scene") {
      cur = { num: b.num, title: b.title, html: "", range: ranges.get(b.num) || null };
      scenes.push(cur);
    } else if (cur) {
      cur.html += blockHtml(b);
    }
  }
  return scenes;
}
