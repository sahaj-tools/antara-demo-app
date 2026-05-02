/**
 * PKCE (RFC 7636) helpers for the browser. Antara requires S256 code_challenge on /oauth/authorize
 * and code_verifier on POST /oauth/token.
 */

function base64UrlEncode(buf: Uint8Array): string {
  let bin = "";
  buf.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 43–128 chars; 32 random bytes → 43-char unpadded base64url (within spec). */
export function createCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export async function createCodeChallengeS256(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

export function createOAuthState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}
