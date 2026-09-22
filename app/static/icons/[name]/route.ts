import { serveAsset } from "@/lib/serve-asset";
export const dynamic = "force-static";
export const dynamicParams = false;
const FILES = ["apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
export function generateStaticParams() { return FILES.map((name) => ({ name })); }
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return FILES.includes(name) ? serveAsset(`static/icons/${name}`, "public, max-age=86400") : new Response("Not found", { status: 404 });
}
