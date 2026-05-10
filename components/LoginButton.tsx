"use client";

import { useState } from "react";
import { buildOAuthAuthorizeUrl } from "@/lib/auth";
import { createCodeChallengeS256, createCodeVerifier, createOAuthState } from "@/lib/pkce";
import { savePendingOAuth } from "@/lib/oauth-pending";

/**
 * Starts OAuth with PKCE: stores verifier + state, then redirects to Antara /oauth/authorize.
 */
export const LoginButton = () => {
  const [circleId, setCircleId] = useState(() => {
    if (typeof window === "undefined") return "";
    return (new URLSearchParams(window.location.search).get("circle") ?? "").trim();
  });

  const onLogin = async (circleOverride?: string) => {
    const codeVerifier = createCodeVerifier();
    const codeChallenge = await createCodeChallengeS256(codeVerifier);
    const state = createOAuthState();
    savePendingOAuth({ state, codeVerifier });
    window.location.assign(
      buildOAuthAuthorizeUrl({
        state,
        codeChallenge,
        circleId: (circleOverride ?? circleId).trim(),
      }),
    );
  };

  return (
    <div className="stack">
      <label className="label" htmlFor="circle-id">
        Optional circle deep link (UUID)
      </label>
      <input
        className="input"
        id="circle-id"
        name="circle-id"
        onChange={(event) => setCircleId(event.target.value)}
        placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
        value={circleId}
      />
      <p className="smallPrint">
        Leave blank for normal login, or pass a circle UUID to test delegated context in OAuth.
      </p>
      <button className="button" onClick={() => void onLogin()} type="button">
        Login with Antara
      </button>
      <p className="smallPrint">
        Tip: share a URL like <code>/?circle=&lt;circle-uuid&gt;</code> to prefill this value for
        testers.
      </p>
    </div>
  );
};
