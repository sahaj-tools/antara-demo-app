"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { IdentityCard } from "@/components/IdentityCard";
import { MessageForm } from "@/components/MessageForm";
import { clearInMemorySession, exchangeCodeForSession } from "@/lib/auth";
import type { AntaraSession } from "@/lib/antara";
import { takePendingOAuth } from "@/lib/oauth-pending";

/**
 * Client-side OAuth callback: reads ?code=&state=, pairs with stored PKCE verifier, exchanges at /oauth/token.
 */
export const DashboardClient = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [session, setSession] = useState<AntaraSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const code = useMemo(() => searchParams.get("code"), [searchParams]);
  const state = useMemo(() => searchParams.get("state"), [searchParams]);
  const oauthError = useMemo(() => searchParams.get("error"), [searchParams]);
  const oauthErrorDescription = useMemo(
    () => searchParams.get("error_description"),
    [searchParams],
  );

  useEffect(() => {
    let isMounted = true;

    const runExchange = async () => {
      if (oauthError) {
        const detail = oauthErrorDescription
          ? ` (${decodeURIComponent(oauthErrorDescription.replace(/\+/g, " "))})`
          : "";
        if (isMounted) {
          setLoading(false);
          setError(`Login was not completed: ${oauthError}${detail}`);
        }
        return;
      }

      if (!code) {
        if (isMounted) {
          setLoading(false);
          setError(
            "No authorization code was provided. Please log in again from the home page.",
          );
        }
        return;
      }

      const pending = takePendingOAuth();
      if (!pending || !state || pending.state !== state) {
        if (isMounted) {
          setLoading(false);
          setError(
            "OAuth state did not match (reload or third-party tab?). Please start login again from the home page.",
          );
        }
        return;
      }

      try {
        const result = await exchangeCodeForSession(code, pending.codeVerifier);
        if (isMounted) {
          setSession(result);
          setError(null);
          router.replace("/dashboard", { scroll: false });
        }
      } catch (exchangeError) {
        if (isMounted) {
          const message =
            exchangeError instanceof Error
              ? exchangeError.message
              : "Login failed. Please try again.";
          setError(message);
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void runExchange();
    return () => {
      isMounted = false;
    };
  }, [code, state, oauthError, oauthErrorDescription, router]);

  const onLogout = () => {
    clearInMemorySession();
    setSession(null);
    setError(null);
    router.push("/");
  };

  return (
    <>
      {loading && <p className="muted">Exchanging authorization code...</p>}

      {!loading && error && (
        <div className="alert error">
          <p>{error}</p>
          <Link className="link" href="/">
            Return to login
          </Link>
        </div>
      )}

      {!loading && session && (
        <div className="stack">
          <IdentityCard identity={session.user} />
          <MessageForm accessToken={session.accessToken} recipientSlug={session.user.slug} />
          <button className="button secondary" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      )}
    </>
  );
};
