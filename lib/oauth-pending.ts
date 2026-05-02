/**
 * Stores PKCE verifier + OAuth state across the redirect to Antara and back.
 * sessionStorage is tab-scoped and cleared when the tab closes — acceptable for this demo.
 */

const STORAGE_KEY = "antara_demo_oauth_pkce";

export type PendingOAuth = {
  state: string;
  codeVerifier: string;
};

export function savePendingOAuth(pending: PendingOAuth): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
}

export function takePendingOAuth(): PendingOAuth | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  sessionStorage.removeItem(STORAGE_KEY);
  try {
    const parsed = JSON.parse(raw) as PendingOAuth;
    if (
      typeof parsed.state === "string" &&
      parsed.state.length > 0 &&
      typeof parsed.codeVerifier === "string" &&
      parsed.codeVerifier.length > 0
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}
