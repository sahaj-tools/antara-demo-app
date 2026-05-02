"use client";

import { FormEvent, useState } from "react";
import { introspectToken, sendAppMessage, AntaraApiError } from "@/lib/antara";

/**
 * Demonstrates API calls after OAuth:
 * - Introspection works with the browser OAuth token (oit_).
 * - /app/v1/messages expects a server app token (aat_), not oit_ — see README.
 */
export const MessageForm = ({
  accessToken,
  recipientSlug,
}: {
  accessToken: string;
  recipientSlug: string;
}) => {
  const [messageBody, setMessageBody] = useState("Hello from the Antara demo app");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIntrospecting, setIsIntrospecting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [introspectJson, setIntrospectJson] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onIntrospect = async () => {
    setIsIntrospecting(true);
    setFeedback(null);
    setError(null);
    setIntrospectJson(null);
    try {
      const data = await introspectToken(accessToken);
      setIntrospectJson(JSON.stringify(data, null, 2));
      setFeedback("Introspection succeeded — token is active for Antara APIs that accept oit_.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Introspection failed.");
    } finally {
      setIsIntrospecting(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      await sendAppMessage({
        accessToken,
        slug: recipientSlug,
        body: messageBody,
      });
      setFeedback("Message accepted by the API.");
    } catch (sendError) {
      if (
        sendError instanceof AntaraApiError &&
        sendError.message.toLowerCase().includes("token")
      ) {
        setError(
          "Messaging uses Bearer aat_ (server-issued app token). The OAuth browser token is oit_. " +
            "Run sends from your backend with an app access token, or ask Antara to document oit_ messaging if supported.",
        );
        return;
      }
      const messageText =
        sendError instanceof Error ? sendError.message : "Message request failed.";
      setError(messageText);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel">
      <h2>API checks</h2>
      <p className="muted">
        After login, your session uses an OAuth identity token (<code>oit_…</code>).{" "}
        <strong>POST /auth/introspect</strong> accepts it. <strong>POST /app/v1/messages</strong>{" "}
        requires a server <code>aat_</code> token per Antara API routing.
      </p>

      <div className="stack">
        <button
          className="button secondary"
          disabled={isIntrospecting}
          onClick={() => void onIntrospect()}
          type="button"
        >
          {isIntrospecting ? "Calling introspect…" : "Verify token (POST /auth/introspect)"}
        </button>
        {introspectJson && (
          <pre className="preBlock">{introspectJson}</pre>
        )}
      </div>

      <h3>Send message (app API shape)</h3>
      <p className="muted">
        Request body is <code>slug</code> + <code>body</code> with <code>Idempotency-Key</code>.{" "}
        With <code>oit_</code> you will normally see an invalid-token error — that is expected until
        you use <code>aat_</code> from your server.
      </p>
      <form className="stack" onSubmit={(e) => void onSubmit(e)}>
        <label className="label" htmlFor="message">
          Message body
        </label>
        <textarea
          className="input"
          id="message"
          name="message"
          onChange={(event) => setMessageBody(event.target.value)}
          rows={4}
          value={messageBody}
        />
        <button className="button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Sending…" : "POST /app/v1/messages (demo)"}
        </button>
      </form>
      {feedback && <p className="alert success">{feedback}</p>}
      {error && <p className="alert error">{error}</p>}
    </section>
  );
};
