import { serveAsset } from "@/lib/serve-asset";
export const dynamic = "force-static";
export function GET() { return serveAsset("static/js/reading-prefs.js"); }
