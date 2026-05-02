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
      `${key} must be set when running "next build". Use \`npm run build\` (not \`next build\` alone) so ` +
        `scripts/inject-public-env.mjs runs first and writes string literals into lib/generated-public-env.ts. ` +
        `Set variables in Cloudflare Pages (or .env.local) before the build.`,
    );
  }
}

const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
