/* Adds the trailing slash to page addresses ("/about" → "/about/"), the
   same way Next.js did before, with one exception: share images
   (".../opengraph-image") load directly. Apps like iMessage, Facebook, and
   X fetch those images, and some of them don't follow a redirect.
   Files with an extension (site.css, sw.js, robots.txt) are left alone. */
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const last = pathname.split("/").pop() || "";
  if (pathname.endsWith("/") || last === "opengraph-image" || last.includes(".")) return NextResponse.next();
  return NextResponse.redirect(new URL(pathname + "/" + req.nextUrl.search, req.url), 308);
}

export const config = { matcher: ["/((?!_next/).*)"] };
