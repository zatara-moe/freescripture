import type { MetadataRoute } from "next";
import {
  TRANS_ORDER,
  booksForTranslation,
  flatChapters,
  NEEDS,
  GENRES,
  SITE_URL,
} from "@/lib/bible";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/` },
    { url: `${SITE_URL}/read/` },
    { url: `${SITE_URL}/genre/` },
    { url: `${SITE_URL}/search/` },
    { url: `${SITE_URL}/about/` },
  ];
  for (const n of NEEDS as any[]) urls.push({ url: `${SITE_URL}/read/${n.slug}/` });
  for (const g of GENRES as any[]) urls.push({ url: `${SITE_URL}/genre/${g.slug}/` });
  for (const t of TRANS_ORDER) {
    urls.push({ url: `${SITE_URL}/${t}/` });
    for (const b of booksForTranslation(t)) urls.push({ url: `${SITE_URL}/${t}/${b.slug}/` });
    for (const c of flatChapters(t)) urls.push({ url: `${SITE_URL}/${t}/${c.slug}/${c.num}/` });
  }
  return urls;
}
