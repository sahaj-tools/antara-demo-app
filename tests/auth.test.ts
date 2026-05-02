import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearInMemorySession, exchangeCodeForSession } from "@/lib/auth";

describe("auth exchange", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE = "https://api.useantara.com";
    process.env.NEXT_PUBLIC_APP_ID = "test-app-id";
    process.env.NEXT_PUBLIC_REDIRECT_URI = "http://localhost:3000/dashboard";
    clearInMemorySession();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    clearInMemorySession();
  });

  it("handles valid code with OAuth token envelope", async () => {
    const apiBody = {
      data: {
        accessToken: "oit_abc123",
        tokenType: "Bearer" as const,
        expiresAt: 1,
        expiresIn: 3600,
        scopes: ["identity.read", "messages.send"],
        user: {
          id: "u1",
          primarySlug: "ada@antara",
          displayName: "Ada Lovelace",
          trustLevel: "high",
          verified: true,
        },
      },
      meta: { requestId: "r1", issuedAt: 1 },
    };

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(apiBody), { status: 200 }),
    );

    const session = await exchangeCodeForSession("valid-code", "verifier");
    expect(session.accessToken).toBe("oit_abc123");
    expect(session.user.slug).toBe("ada@antara");
    expect(session.user.permissions).toEqual(["identity.read", "messages.send"]);
  });

  it("handles invalid code", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Invalid code" }), { status: 400 }),
    );

    await expect(exchangeCodeForSession("bad-code", "v")).rejects.toThrow(
      "The authorization code is invalid or was already used. Please retry login.",
    );
  });

  it("handles missing code", async () => {
    await expect(exchangeCodeForSession("", "v")).rejects.toThrow(
      "Authorization code is missing from callback URL.",
    );
  });

  it("handles missing verifier", async () => {
    await expect(exchangeCodeForSession("code", "")).rejects.toThrow("PKCE verifier missing");
  });
});
