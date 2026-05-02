/**
 * Centralizes Antara API calls. OAuth uses POST /oauth/token (PKCE); /auth/exchange-code is for
 * Antara portal magic-link handoff, not third-party OAuth codes.
 */

import { getApiBaseUrl, getRequiredPublicEnv } from "@/lib/public-env";

export type AntaraIdentity = {
  displayName: string;
  slug: string;
  trustLevel: string;
  /** Granted OAuth scopes (Antara canonical names). */
  permissions: string[];
};

export type AntaraSession = {
  accessToken: string;
  user: AntaraIdentity;
};

/** Envelope for POST /oauth/token and POST /auth/introspect success bodies. */
type ApiEnvelope<T> = {
  data: T;
  meta?: { requestId?: string; issuedAt?: number };
};

type IdpTokenUser = {
  id: string;
  primarySlug: string;
  displayName?: string;
  trustLevel: string;
  verified: boolean;
};

type TokenSuccessData = {
  accessToken: string;
  tokenType: "Bearer";
  expiresAt: number;
  expiresIn: number;
  scopes: string[];
  user: IdpTokenUser | null;
};

type ApiErrorPayload = {
  error?: string;
  message?: string;
  code?: string;
};

export class AntaraApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AntaraApiError";
    this.status = status;
  }
}

const parseErrorMessage = async (response: Response) => {
  const fallback = "Antara API request failed. Please try again.";
  try {
    const body = (await response.json()) as ApiErrorPayload & { data?: { message?: string } };
    return (
      body.message ??
      body.error ??
      body.data?.message ??
      fallback
    );
  } catch {
    return fallback;
  }
};

function mapTokenToSession(data: TokenSuccessData): AntaraSession {
  const u = data.user;
  if (!u) {
    throw new AntaraApiError("Token response did not include a user block.", 500);
  }
  return {
    accessToken: data.accessToken,
    user: {
      displayName: u.displayName?.trim() || u.primarySlug,
      slug: u.primarySlug,
      trustLevel: u.trustLevel,
      permissions: data.scopes ?? [],
    },
  };
}

/**
 * Exchange authorization code for OAuth identity token (oit_). Requires PKCE verifier
 * and the same redirect_uri used in /oauth/authorize.
 */
export const exchangeOAuthAuthorizationCode = async ({
  code,
  codeVerifier,
}: {
  code: string;
  codeVerifier: string;
}): Promise<AntaraSession> => {
  const clientId = getRequiredPublicEnv("NEXT_PUBLIC_APP_ID");
  const redirectUri = getRequiredPublicEnv("NEXT_PUBLIC_REDIRECT_URI");

  const response = await fetch(`${getApiBaseUrl()}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    throw new AntaraApiError(await parseErrorMessage(response), response.status);
  }

  const json = (await response.json()) as ApiEnvelope<TokenSuccessData>;
  if (!json.data?.accessToken) {
    throw new AntaraApiError("Unexpected token response shape.", 500);
  }
  return mapTokenToSession(json.data);
};

export type IntrospectResult = {
  active: boolean;
  sessionType: string | null;
  audience: string | null;
  scopes: string[];
};

/**
 * RFC 7662–style introspection; accepts oit_ / uat_ / aat_ per Antara API.
 */
export const introspectToken = async (token: string): Promise<IntrospectResult> => {
  const response = await fetch(`${getApiBaseUrl()}/auth/introspect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new AntaraApiError(await parseErrorMessage(response), response.status);
  }

  const json = (await response.json()) as ApiEnvelope<IntrospectResult>;
  return json.data;
};

/**
 * POST /app/v1/messages — requires Bearer **aat_** (server-issued app access token), not oit_.
 * Body uses `slug` + `body`; Idempotency-Key is required by the API.
 */
export const sendAppMessage = async ({
  accessToken,
  slug,
  body,
}: {
  accessToken: string;
  slug: string;
  body: string;
}) => {
  const response = await fetch(`${getApiBaseUrl()}/app/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({ slug, body }),
  });

  if (!response.ok) {
    throw new AntaraApiError(await parseErrorMessage(response), response.status);
  }

  return response.json();
};
