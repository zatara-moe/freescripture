/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  /* The Empty Tomb was split into The Crucifixion and The Resurrection
     (September 2026). Old links go to The Resurrection. */
  async redirects() {
    return [
      { source: "/stories/the-empty-tomb/", destination: "/stories/the-resurrection/", permanent: true },
      /* Moses and the Exodus became five stories plus The Ten Commandments (September 2026). */
      { source: "/stories/moses-and-the-exodus/", destination: "/paths/moses-and-the-exodus/", permanent: true },
    ];
  },
};
module.exports = nextConfig;
