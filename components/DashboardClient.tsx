"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { IdentityCard } from "@/components/IdentityCard";
import { MessageForm } from "@/components/MessageForm";
import { clearInMemorySession, exchangeCodeForSession } from "@/lib/auth";
import type { AntaraSession } from "@/lib/antara";

/**
 * Why this exists:
 * This client component owns callback parsing and in-browser session state for the Antara demo flow.
 *
 * What Antara expects:
 * The callback query contains ?code= and the app exchanges it via /auth/exchange-code.
 *
 * Alternatives:
 * Production systems often move this logic to backend routes and issue HttpOnly cookie sessions.
 */
export const DashboardClient = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [session, setSession] = useState<AntaraSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const code = useMemo(() => searchParams.get("code"), [searchParams]);

  useEffect(() => {
    let isMounted = true;

    const runExchange = async () => {
      if (!code) {
        if (isMounted) {
          setLoading(false);
          setError(
            "No authorization code was provided. Please log in again from the home page.",
          );
        }
        return;
      }

      try {
        const result = await exchangeCodeForSession(code);
        if (isMounted) {
          // Extension point: persist or upsert this identity in your own DB via a backend API.
          // Example: map result.user.slug to an internal user row, then hydrate custom profile fields.
          setSession(result);
          setError(null);
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

    runExchange();
    return () => {
      isMounted = false;
    };
  }, [code]);

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
          {/* Extension point: customize displayed permissions or map them to product-specific roles. */}
          <IdentityCard identity={session.user} />
          {/* Extension point: enforce role-based UI by checking session.user.permissions before actions. */}
          <MessageForm accessToken={session.accessToken} to={session.user.slug} />
          <button className="button secondary" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      )}
    </>
  );
};
