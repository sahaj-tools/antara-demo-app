/**
 * Why this exists:
 * This file centralizes all outbound Antara API calls so app code remains clean and teachable.
 *
 * What Antara expects:
 * Requests use JSON bodies and bearer auth for protected endpoints.
 *
 * Alternatives:
 * Teams can switch to a backend proxy service to avoid exposing token exchange in the browser.
 */

import { getApiBaseUrl } from "@/lib/public-env";

export type AntaraIdentity = {
  displayName: string;
  slug: string;
  trustLevel: string;
  permissions: string[];
};

export type AntaraSession = {
  accessToken: string;
  user: AntaraIdentity;
};

type ApiErrorPayload = {
  error?: string;
  message?: string;
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
    const body = (await response.json()) as ApiErrorPayload;
    return body.message ?? body.error ?? fallback;
  } catch {
    return fallback;
  }
};

export const exchangeCode = async (code: string): Promise<AntaraSession> => {
  const response = await fetch(`${getApiBaseUrl()}/auth/exchange-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new AntaraApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as AntaraSession;
};

export const sendMessage = async ({
  accessToken,
  to,
  message,
}: {
  accessToken: string;
  to: string;
  message: string;
}) => {
  const response = await fetch(`${getApiBaseUrl()}/app/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ to, message }),
  });

  if (!response.ok) {
    throw new AntaraApiError(await parseErrorMessage(response), response.status);
  }

  return response.json();
};
