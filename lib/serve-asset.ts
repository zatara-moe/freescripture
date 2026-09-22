/* Serves every static file (stylesheet, scripts, icons, search indexes,
   service worker, manifest) from lib/static-assets/ at its normal web
   address. This site does not use a public/ folder: the repo's
   .gitignore skips public/, so files placed there never reach GitHub.
   To change a static file, edit its copy in lib/static-assets/.
   Do not create a public/ folder with these files: Next.js stops the
   build when a public file and a route share the same address. */
import fs from "node:fs";
import path from "node:path";

const TYPES: Record<string, string> = {
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

export function serveAsset(rel: string, cacheControl = "public, max-age=3600") {
  const file = path.join(process.cwd(), "lib", "static-assets", rel);
  if (!fs.existsSync(file)) return new Response("Not found", { status: 404 });
  const type = TYPES[path.extname(file)] || "application/octet-stream";
  return new Response(new Uint8Array(fs.readFileSync(file)), {
    headers: { "Content-Type": type, "Cache-Control": cacheControl },
  });
}
