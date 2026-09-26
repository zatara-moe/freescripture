import { STORIES, isIndexed } from "@/lib/stories";
import type { MetadataRoute } from "next";
import {
  TRANS_ORDER,
  booksForTranslation,
  flatChapters,
  NEEDS,
  GENRES,
  PARABLES,
  SITE_URL,
} from "@/lib/bible";
import verseIndex from "@/lib/verse-index.json";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/` },
    { url: `${SITE_URL}/read/` },
    { url: `${SITE_URL}/stories/` },
    { url: `${SITE_URL}/timeline/` },
    { url: `${SITE_URL}/parables/` },
    { url: `${SITE_URL}/genre/` },
    { url: `${SITE_URL}/search/` },
    { url: `${SITE_URL}/compare/` },
    { url: `${SITE_URL}/about/` },
  ];
  for (const n of NEEDS as any[]) urls.push({ url: `${SITE_URL}/read/${n.slug}/` });
  for (const g of GENRES as any[]) urls.push({ url: `${SITE_URL}/genre/${g.slug}/` });
  for (const s of STORIES) if (isIndexed(s)) urls.push({ url: `${SITE_URL}/stories/${s.slug}/` });
  for (const p of PARABLES as any[]) urls.push({ url: `${SITE_URL}/parables/${p.slug}/` });
  // Bare "chapter:verse" disambiguation pages — every one built for the
  // literal query someone types when they don't remember the book name.
  for (const key of Object.keys(verseIndex as Record<string, string[]>)) {
    const [chapter, verse] = key.split(":");
    urls.push({ url: `${SITE_URL}/verse/${chapter}-${verse}/` });
  }
  for (const t of TRANS_ORDER) {
    urls.push({ url: `${SITE_URL}/${t}/` });
    for (const b of booksForTranslation(t)) urls.push({ url: `${SITE_URL}/${t}/${b.slug}/` });
    for (const c of flatChapters(t)) urls.push({ url: `${SITE_URL}/${t}/${c.slug}/${c.num}/` });
  }
  return urls;
}
