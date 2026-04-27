"use client";

import { getAuthorizeUrl } from "@/lib/auth";

/**
 * Why this exists:
 * This keeps Antara login initiation reusable and obvious for developers.
 *
 * What Antara expects:
 * Redirect users to /oauth/authorize with app_id, redirect_uri, and response_type=code.
 *
 * Alternatives:
 * A server route can generate this URL and perform pre-login checks before redirecting.
 */
export const LoginButton = () => {
  const onLogin = () => {
    const authorizeUrl = getAuthorizeUrl();
    window.location.assign(authorizeUrl);
  };

  return (
    <button className="button" onClick={onLogin} type="button">
      Login with Antara
    </button>
  );
};
