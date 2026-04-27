import { AntaraApiError, AntaraSession, exchangeCode } from "@/lib/antara";

/**
 * Why this exists:
 * This file holds auth/session helpers that keep security decisions explicit and reusable.
 *
 * What Antara expects:
 * The app sends users to /oauth/authorize and later exchanges the returned code exactly once.
 *
 * Alternatives:
 * A backend session layer can own token storage and user mapping for stricter production controls.
 */

let inMemorySession: AntaraSession | null = null;

const getRequiredPublicEnv = (
  key:
    | "NEXT_PUBLIC_API_BASE"
    | "NEXT_PUBLIC_APP_ID"
    | "NEXT_PUBLIC_REDIRECT_URI",
) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key}. Add it to .env.local.`);
  }
  return value;
};

export const getAuthorizeUrl = () => {
  const apiBase = getRequiredPublicEnv("NEXT_PUBLIC_API_BASE").replace(/\/$/, "");
  const appId = getRequiredPublicEnv("NEXT_PUBLIC_APP_ID");
  const redirectUri = getRequiredPublicEnv("NEXT_PUBLIC_REDIRECT_URI");

  const params = new URLSearchParams({
    app_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
  });

  return `${apiBase}/oauth/authorize?${params.toString()}`;
};

export const exchangeCodeForSession = async (code: string) => {
  if (!code) {
    throw new Error("Authorization code is missing from callback URL.");
  }

  try {
    // We keep tokens in memory only. Alternative: issue HttpOnly cookies from a backend proxy.
    const session = await exchangeCode(code);
    inMemorySession = session;
    return session;
  } catch (error) {
    if (error instanceof AntaraApiError && error.status === 401) {
      throw new Error("The session is invalid or expired. Please log in again.");
    }
    if (error instanceof AntaraApiError && error.status === 400) {
      throw new Error("The authorization code is invalid. Please retry login.");
    }
    throw error instanceof Error
      ? error
      : new Error("Unexpected auth error while exchanging Antara code.");
  }
};

export const getInMemorySession = () => inMemorySession;

export const clearInMemorySession = () => {
  inMemorySession = null;
};
