import {
  AntaraApiError,
  AntaraSession,
  exchangeOAuthAuthorizationCode,
} from "@/lib/antara";
import { getRequiredPublicEnv } from "@/lib/public-env";

/**
 * Auth helpers: OAuth authorize URL construction and in-memory session after code exchange.
 *
 * Flow: browser navigates here with Accept including text/html → API 302 to useantara.com/oauth/consent
 * (same query string). Consent SPA then GETs this URL again with Accept: application/json + cookies.
 *
 * Required query params per Antara integrator checklist: client_id, redirect_uri, response_type=code,
 * state, code_challenge, code_challenge_method=S256; scope optional (we send an explicit default).
 */

let inMemorySession: AntaraSession | null = null;

/** Space-separated scopes for consent (subset of Antara allow-list). */
const DEFAULT_OAUTH_SCOPE = "identity.read messages.send profile.basic";

export type AuthorizeParams = {
  state: string;
  codeChallenge: string;
};

export const buildOAuthAuthorizeUrl = ({ state, codeChallenge }: AuthorizeParams) => {
  const apiBase = getRequiredPublicEnv("NEXT_PUBLIC_API_BASE").replace(/\/$/, "");
  const clientId = getRequiredPublicEnv("NEXT_PUBLIC_APP_ID");
  const redirectUri = getRequiredPublicEnv("NEXT_PUBLIC_REDIRECT_URI");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    scope: DEFAULT_OAUTH_SCOPE,
  });

  return `${apiBase}/oauth/authorize?${params.toString()}`;
};

export const exchangeCodeForSession = async (
  code: string,
  codeVerifier: string,
): Promise<AntaraSession> => {
  if (!code) {
    throw new Error("Authorization code is missing from callback URL.");
  }
  if (!codeVerifier) {
    throw new Error("PKCE verifier missing — start login from this app’s home page.");
  }

  try {
    const session = await exchangeOAuthAuthorizationCode({ code, codeVerifier });
    inMemorySession = session;
    return session;
  } catch (error) {
    if (error instanceof AntaraApiError && error.status === 401) {
      throw new Error("The session is invalid or expired. Please log in again.");
    }
    if (error instanceof AntaraApiError && error.status === 400) {
      throw new Error("The authorization code is invalid or was already used. Please retry login.");
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
