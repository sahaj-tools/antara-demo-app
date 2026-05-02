/**
 * Why this exists:
 * Client code must read Antara config from inlined literals (see `generated-public-env.ts`)
 * because `process.env.NEXT_PUBLIC_*` is not always embedded in static-export bundles on all hosts.
 *
 * What Antara expects:
 * Same three public values as before: API base, app id, redirect URI for OAuth.
 *
 * Alternatives:
 * Fetch runtime config from `/config.json` if you prefer not to rebuild when URLs change.
 */
import { INLINED_PUBLIC_ENV } from "@/lib/generated-public-env";

export type PublicEnvKey = keyof typeof INLINED_PUBLIC_ENV;

function pick(key: PublicEnvKey): string | undefined {
  const inlined = INLINED_PUBLIC_ENV[key];
  if (inlined !== undefined && String(inlined).trim() !== "") {
    return String(inlined);
  }
  if (typeof process !== "undefined" && process.env?.[key]) {
    return process.env[key];
  }
  return undefined;
}

export function getRequiredPublicEnv(key: PublicEnvKey): string {
  const value = pick(key);
  if (!value?.trim()) {
    throw new Error(
      `Missing ${key}. Run \`node scripts/inject-public-env.mjs\` before building (see package.json scripts), ` +
        `or set ${key} in .env.local / CI so the inject step can write lib/generated-public-env.ts.`,
    );
  }
  return value.trim();
}

export function getApiBaseUrl(): string {
  return getRequiredPublicEnv("NEXT_PUBLIC_API_BASE").replace(/\/$/, "");
}
