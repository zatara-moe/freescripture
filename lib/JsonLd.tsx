import React from "react";

/**
 * Renders a JSON-LD script tag. Pass any schema.org object.
 * Kept minimal and server-rendered so AI crawlers read it directly.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
