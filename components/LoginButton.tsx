"use client";

import { buildOAuthAuthorizeUrl } from "@/lib/auth";
import { createCodeChallengeS256, createCodeVerifier, createOAuthState } from "@/lib/pkce";
import { savePendingOAuth } from "@/lib/oauth-pending";

/**
 * Starts OAuth with PKCE: stores verifier + state, then redirects to Antara /oauth/authorize.
 */
export const LoginButton = () => {
  const onLogin = async () => {
    const codeVerifier = createCodeVerifier();
    const codeChallenge = await createCodeChallengeS256(codeVerifier);
    const state = createOAuthState();
    savePendingOAuth({ state, codeVerifier });
    window.location.assign(buildOAuthAuthorizeUrl({ state, codeChallenge }));
  };

  return (
    <button className="button" onClick={() => void onLogin()} type="button">
      Login with Antara
    </button>
  );
};
