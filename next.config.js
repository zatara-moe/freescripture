/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',           // fully static, no server needed
  trailingSlash: true,        // /kjv/genesis/1/  — matches the whole design
  images: { unoptimized: true },
};
module.exports = nextConfig;
