import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearInMemorySession, exchangeCodeForSession } from "@/lib/auth";

/**
 * Why this exists:
 * These tests verify Antara code-exchange behavior and important error handling.
 *
 * What Antara expects:
 * Valid code returns session payload; invalid/expired flows return API errors that we map to user-safe messages.
 *
 * Alternatives:
 * End-to-end browser tests can be added for callback URL behavior.
 */

describe("auth exchange", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE = "https://api.useantara.com";
    clearInMemorySession();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    clearInMemorySession();
  });

  it("handles valid code", async () => {
    const fakeSession = {
      accessToken: "token-123",
      user: {
        displayName: "Ada Lovelace",
        slug: "ada@antara",
        trustLevel: "high",
        permissions: ["identity.read", "messages.send"],
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(fakeSession), { status: 200 }),
    );

    const session = await exchangeCodeForSession("valid-code");
    expect(session).toEqual(fakeSession);
  });

  it("handles invalid code", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Invalid code" }), { status: 400 }),
    );

    await expect(exchangeCodeForSession("bad-code")).rejects.toThrow(
      "The authorization code is invalid. Please retry login.",
    );
  });

  it("handles missing code", async () => {
    await expect(exchangeCodeForSession("")).rejects.toThrow(
      "Authorization code is missing from callback URL.",
    );
  });
});
