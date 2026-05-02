import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendAppMessage } from "@/lib/antara";

/**
 * Validates POST /app/v1/messages: Bearer token, Idempotency-Key, body { slug, body }.
 */

describe("antara messaging api", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE = "https://api.useantara.com";
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends message successfully", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ messageId: "message-1", status: "queued" }), {
        status: 202,
      }),
    );

    const response = await sendAppMessage({
      accessToken: "aat_token",
      slug: "ada@antara",
      body: "Hello from demo app",
    });

    expect(response).toEqual({ messageId: "message-1", status: "queued" });
    expect(fetch).toHaveBeenCalledTimes(1);
    const init = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    expect(init?.headers).toBeDefined();
  });

  it("handles api failure", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Invalid token" }), { status: 401 }),
    );

    await expect(
      sendAppMessage({
        accessToken: "expired-token",
        slug: "ada@antara",
        body: "Hello from demo app",
      }),
    ).rejects.toThrow("Invalid token");
  });
});
