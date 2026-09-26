import { PARTS, ERAS, tlX } from "@/lib/timeline";

/* The colored band: the whole Bible story drawn to scale.
   Used full size on /timeline/, and small in each timeline panel and on
   every story page, so readers learn one picture of the whole story. */
export function Bands({ here, mini = false }: { here?: number; mini?: boolean }) {
  return (
    <div className={`tl-band${mini ? " tl-band--mini" : ""}`} aria-hidden="true">
      <span className="tl-band__fade-l" style={{ width: `${tlX(-2000)}%` }} />
      {PARTS.map((p) => (
        <span key={p.n} className={`tl-band__part tl-t${p.n}`} style={{ left: `${tlX(p.from)}%`, width: `${tlX(p.to) - tlX(p.from)}%` }} />
      ))}
      <span className="tl-band__fade-r" style={{ left: `${tlX(100)}%` }} />
      {ERAS.filter((e) => e.gap).map((e) => (
        <span key={e.id} className="tl-band__stip" style={{ left: `${tlX(e.start)}%`, width: `${tlX(e.end) - tlX(e.start)}%` }} />
      ))}
      {here != null && <span className="tl-band__here" style={{ left: `${here}%` }} />}
    </div>
  );
}
