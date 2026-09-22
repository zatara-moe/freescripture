import { serveAsset } from "@/lib/serve-asset";
export const dynamic = "force-static";
/* The service worker must never be cached long, or updates stall. */
export function GET() { return serveAsset("sw.js", "public, max-age=0, must-revalidate"); }
