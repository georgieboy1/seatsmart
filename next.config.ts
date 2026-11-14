import type { NextConfig } from "next";

// SynDesk ships as a static site: no server, no database, no accounts.
// Every page is prerendered at build time and all data lives in the
// teacher's browser (see src/lib/local/store.ts).
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
