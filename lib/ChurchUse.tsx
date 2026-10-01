/* USING THIS AT CHURCH (2026-09-30)
   The other half of Digital Lutheran Church's /word/newsletter/ page.
   Hope for Americans asks DLC and partner churches to link these stories in
   newsletters and sermon notes. A church that finds a story here first gets
   the same ready line DLC offers, and the Sundays it is read in church, each
   linked to that Sunday's page on DLC.

   lib/dlc-sundays.json is generated from DLC's lectionary tables (rcl.ts,
   festivals.ts and family-sites.ts in the digital-lutheran-church repo). The
   Revised Common Lectionary is a fixed three-year cycle, so the file does
   not go out of date; regenerate it only when DLC's story matching changes.
   Keys are the story or parable path. A Scene by Scene story of a parable
   uses the parable's path, as DLC does. */
import dlcSundays from "@/lib/dlc-sundays.json";
import { SITE_URL } from "@/lib/bible";

type Year = { year: string | null; url: string };
type Sunday = { sunday: string; reading: string; ref: string; years: Year[] };
const SUNDAYS = dlcSundays as Record<string, Sunday[]>;
const DLC = "https://www.digitallutheranchurch.com";

export function ChurchUse({ path, sundayPath, name, hook, minutes }: {
  /** This page, e.g. "/stories/zacchaeus/". */
  path: string;
  /** Where to look up Sundays, if different (a story of a parable uses the parable). */
  sundayPath?: string;
  /** "Zacchaeus", or "The parable of the Talents". */
  name: string;
  /** One plain line on what happens. */
  hook: string;
  minutes?: number | null;
}) {
  const url = `${SITE_URL}${path}`;
  const line = `${name}, explained in plain words. ${hook}${minutes ? ` About ${minutes} minutes.` : ""} ${url}`;
  const sundays = SUNDAYS[sundayPath || path] || [];
  return (
    <section className="church-use" aria-labelledby="church-use-title">
      <h2 className="church-use__title" id="church-use-title">Using this at church</h2>
      {sundays.length > 0 && (
        <>
          <p className="church-use__label">Read in church on</p>
          <ul className="church-use__sundays">
            {sundays.map((s) => (
              <li key={s.sunday + s.ref}>
                {s.years.length === 1 && !s.years[0].year ? (
                  <a href={s.years[0].url} rel="noopener">{s.sunday}</a>
                ) : (
                  <>
                    <span className="church-use__sunday">{s.sunday}</span>{" "}
                    {s.years.map((y, i) => (
                      <span key={y.url}>{i > 0 && " · "}<a href={y.url} rel="noopener">Year {y.year}</a></span>
                    ))}
                  </>
                )}
                <span className="church-use__reading">{s.reading}, {s.ref}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="church-use__label">For a newsletter or sermon notes</p>
      <div className="church-use__box">
        <p className="church-use__line" data-church-line>{line}</p>
        <button type="button" className="btn btn--line church-use__copy" data-church-copy hidden>Copy the line</button>
      </div>
      <p className="church-use__more">
        <a href={`${DLC}/word/newsletter/`} rel="noopener">Lines for the next eight Sundays, on Digital Lutheran Church</a>
      </p>
      <script dangerouslySetInnerHTML={{ __html: `(function(){var b=document.querySelector('[data-church-copy]');if(!b||!navigator.clipboard)return;b.hidden=false;var t=b.textContent;b.addEventListener('click',function(){var l=document.querySelector('[data-church-line]');navigator.clipboard.writeText(l?l.textContent:'').then(function(){b.textContent='Copied';setTimeout(function(){b.textContent=t;},2500);},function(){b.textContent='Select the text to copy it';});});})();` }} />
    </section>
  );
}
