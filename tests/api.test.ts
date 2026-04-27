import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMessage } from "@/lib/antara";

/**
 * Why this exists:
 * This validates message delivery calls and failure paths against Antara API contracts.
 *
 * What Antara expects:
 * /app/v1/messages must receive bearer auth and JSON fields: to + message.
 *
 * Alternatives:
 * Backend integration tests can assert retry and queueing logic for production systems.
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
      new Response(JSON.stringify({ id: "message-1", status: "queued" }), {
        status: 200,
      }),
    );

    const response = await sendMessage({
      accessToken: "token-abc",
      to: "ada@antara",
      message: "Hello from demo app",
    });

    expect(response).toEqual({ id: "message-1", status: "queued" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("handles api failure", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Session expired" }), { status: 401 }),
    );

    await expect(
      sendMessage({
        accessToken: "expired-token",
        to: "ada@antara",
        message: "Hello from demo app",
      }),
    ).rejects.toThrow("Session expired");
  });
});
