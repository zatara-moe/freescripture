import { serveAsset } from "@/lib/serve-asset";
export const dynamic = "force-static";
export const dynamicParams = false;
const FILES = ["favicon.svg", "og-image.jpg", "og-image.svg", "search-index-kjv.json", "search-index-web.json", "search-index-bbe.json"];
export function generateStaticParams() { return FILES.map((file) => ({ file })); }
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  return FILES.includes(file) ? serveAsset(`static/${file}`, "public, max-age=86400") : new Response("Not found", { status: 404 });
}
