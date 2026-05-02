import type { NextConfig } from "next";

/**
 * Static export for hosts like Cloudflare Pages that serve prebuilt HTML/CSS/JS.
 * Set Pages "Build output directory" to `out` (not `.next`).
 *
 * If you need SSR or Route Handlers on Cloudflare, use @cloudflare/next-on-pages instead.
 */
const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
