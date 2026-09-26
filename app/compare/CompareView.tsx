"use client";
/* Side-by-side reader. Two pickers, one swap button, and rows that
   always line up: one row per verse for two translations, or one row
   per scene when a retelling is involved. On a phone each row stacks,
   with a small tag on every cell so you always know which is which. */
import { useEffect, useMemo, useState } from "react";

export type SceneData = { num: number; title: string; html: string; from: number; to: number };
export type Version = {
  id: string;
  kind: "translation" | "retelling";
  nick: string;
  name: string;
  note: string;
  href: string;
  verses?: { v: number; t: string }[];
  scenes?: SceneData[];
};

type Row = { key: string; head?: string; sub?: string; a: string | { v: number; t: string }[]; b: string | { v: number; t: string }[] };

const SAVE_KEY = "fs-compare";

function versesIn(v: Version, from: number, to: number) {
  return (v.verses || []).filter((x) => x.v >= from && x.v <= to);
}

function buildRows(A: Version, B: Version): Row[] {
  const R = A.kind === "retelling" ? A : B.kind === "retelling" ? B : null;
  if (!R) {
    const nums = Array.from(new Set([...(A.verses || []), ...(B.verses || [])].map((x) => x.v))).sort((x, y) => x - y);
    return nums.map((n) => ({ key: `v${n}`, a: versesIn(A, n, n), b: versesIn(B, n, n) }));
  }
  const T = R === A ? B : A; // the other side
  const scenes = [...(R.scenes || [])].sort((x, y) => x.from - y.from);
  const cellFor = (side: Version, sc: SceneData): Row["a"] =>
    side.kind === "retelling" ? (side.scenes?.find((s) => s.num === sc.num)?.html || "") : versesIn(side, sc.from, sc.to);

  const rows: (Row & { start: number })[] = scenes.map((sc) => ({
    key: `s${sc.num}`,
    start: sc.from,
    head: `Scene ${sc.num}: ${sc.title}`,
    sub: sc.to >= 999 ? `Verses ${sc.from} to the end` : sc.from === sc.to ? `Verse ${sc.from}` : `Verses ${sc.from} to ${sc.to}`,
    a: cellFor(A, sc),
    b: cellFor(B, sc),
  }));

  // Verses the retelling doesn't cover get their own quiet rows, so
  // nothing in the Bible text silently disappears.
  if (T.kind === "translation") {
    const covered = (n: number) => scenes.some((s) => n >= s.from && n <= s.to);
    let run: number[] = [];
    const flush = () => {
      if (!run.length) return;
      const from = run[0], to = run[run.length - 1];
      const gap = "<p class=\"cmp-gap\">This part isn't retold as its own scene.</p>";
      rows.push({
        key: `g${from}`, start: from,
        head: "Between scenes",
        sub: from === to ? `Verse ${from}` : `Verses ${from} to ${to}`,
        a: A === T ? versesIn(T, from, to) : gap,
        b: B === T ? versesIn(T, from, to) : gap,
      });
      run = [];
    };
    for (const x of T.verses || []) { if (covered(x.v)) flush(); else run.push(x.v); }
    flush();
  }
  return rows.sort((x, y) => x.start - y.start);
}

function Cell({ value, v }: { value: Row["a"]; v: Version }) {
  return (
    <div className={`cmp-cell cmp-cell--${v.kind}`}>
      <span className="cmp-cell__tag">{v.nick}</span>
      {typeof value === "string" ? (
        <div className="cmp-retell" dangerouslySetInnerHTML={{ __html: value }} />
      ) : value.length ? (
        <p className="cmp-verses">
          {value.map((x) => (
            <span key={x.v}><sup className="cmp-num">{x.v}</sup>{x.t} </span>
          ))}
        </p>
      ) : (
        <p className="cmp-gap">Not in this version.</p>
      )}
    </div>
  );
}

export default function CompareView({ versions, book, chapter }: { versions: Version[]; book: string; chapter: number }) {
  const ids = versions.map((v) => v.id);
  const firstStory = versions.find((v) => v.kind === "retelling");
  const [a, setA] = useState(firstStory ? firstStory.id : "bsb");
  const [b, setB] = useState(firstStory ? "bsb" : "kjv");

  // URL wins, then the reader's last translation pair, then the defaults.
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      let na = q.get("a") || (firstStory ? firstStory.id : saved.a) || a;
      let nb = q.get("b") || saved.b || b;
      if (!ids.includes(na)) na = ids[0];
      if (!ids.includes(nb) || nb === na) nb = ids.find((x) => x !== na)!;
      setA(na); setB(nb);
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (side: "a" | "b", id: string) => {
    let na = side === "a" ? id : a;
    let nb = side === "b" ? id : b;
    if (na === nb) { if (side === "a") nb = a; else na = b; } // picking the same one swaps them
    setA(na); setB(nb);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("a", na); url.searchParams.set("b", nb);
      window.history.replaceState(null, "", url.toString());
      const onlyTrans = (x: string) => !x.startsWith("story:");
      if (onlyTrans(na) && onlyTrans(nb)) localStorage.setItem(SAVE_KEY, JSON.stringify({ a: na, b: nb }));
    } catch (e) {}
  };

  const A = versions.find((v) => v.id === a) || versions[0];
  const B = versions.find((v) => v.id === b) || versions[1];
  const rows = useMemo(() => buildRows(A, B), [A, B]);

  const Picker = ({ side, label, value }: { side: "a" | "b"; label: string; value: string }) => (
    <label className="cmp-pick">
      <span className="cmp-pick__label">{label}</span>
      <select value={value} onChange={(e) => choose(side, e.target.value)}>
        {versions.map((v) => (
          <option key={v.id} value={v.id}>{v.nick}: {v.name}</option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="cmp">
      <div className="cmp-controls" role="group" aria-label="Choose two versions">
        <Picker side="a" label="Read" value={A.id} />
        <button type="button" className="cmp-swap" onClick={() => choose("a", B.id)} aria-label="Swap the two sides">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 4 3 8l4 4" /><path d="M3 8h14" /><path d="m17 20 4-4-4-4" /><path d="M21 16H7" /></svg>
          <span>Swap</span>
        </button>
        <Picker side="b" label="Next to" value={B.id} />
      </div>

      <div className="cmp-cols" aria-hidden="true">
        {[A, B].map((v) => (
          <div className={`cmp-col cmp-col--${v.kind}`} key={v.id}>
            <span className="cmp-col__name">{v.name}</span>
            <span className="cmp-col__note">{v.note}</span>
          </div>
        ))}
      </div>

      <div className="cmp-rows">
        {rows.map((r) => (
          <section className={`cmp-row${r.head ? " cmp-row--scene" : ""}`} key={r.key} aria-label={r.head || undefined}>
            {r.head && (
              <h2 className="cmp-row__head">
                <span className="cmp-row__title">{r.head}</span>
                {r.sub && <span className="cmp-row__sub">{r.sub}</span>}
              </h2>
            )}
            <div className="cmp-row__pair">
              <Cell value={r.a} v={A} />
              <Cell value={r.b} v={B} />
            </div>
          </section>
        ))}
      </div>

      <div className="cmp-open">
        <a className="rbtn" href={A.href}>Open {A.nick} on its own</a>
        <a className="rbtn rbtn--subtle" href={B.href}>Open {B.nick} on its own</a>
      </div>
      <p className="cmp-fine">Your pair of translations is remembered on this device for other chapters.</p>
    </div>
  );
}
