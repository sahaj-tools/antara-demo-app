import type { NextConfig } from "next";

/**
 * Static export for hosts like Cloudflare Pages that serve prebuilt HTML/CSS/JS.
 * Set Pages "Build output directory" to `out` (not `.next`).
 *
 * If you need SSR or Route Handlers on Cloudflare, use @cloudflare/next-on-pages instead.
 */

const requiredPublicEnv = [
  "NEXT_PUBLIC_API_BASE",
  "NEXT_PUBLIC_APP_ID",
  "NEXT_PUBLIC_REDIRECT_URI",
] as const;

for (const key of requiredPublicEnv) {
  if (!process.env[key]) {
    throw new Error(
      `${key} must be set when running "next build". Next.js inlines NEXT_PUBLIC_* at build time; ` +
        `setting variables only in the runtime UI (without rebuilding) leaves them undefined in the browser bundle. ` +
        `Add it in Cloudflare Pages → Settings → Variables (Production and Preview if you use preview URLs), then redeploy.`,
    );
  }
}

const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
