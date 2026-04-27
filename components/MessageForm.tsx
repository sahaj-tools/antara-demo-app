"use client";

import { FormEvent, useState } from "react";
import { sendMessage } from "@/lib/antara";

/**
 * Why this exists:
 * This component demonstrates a real authenticated API call after Antara login succeeds.
 *
 * What Antara expects:
 * Protected calls require Authorization: Bearer <access_token> plus JSON message payload.
 *
 * Alternatives:
 * Teams can queue outbound messages on their backend for retries, auditing, and rate-limit control.
 */
export const MessageForm = ({
  accessToken,
  to,
}: {
  accessToken: string;
  to: string;
}) => {
  const [message, setMessage] = useState("Hello from demo app");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      await sendMessage({ accessToken, to, message });
      setFeedback("Message sent successfully via Antara.");
    } catch (sendError) {
      const messageText =
        sendError instanceof Error
          ? sendError.message
          : "Message request failed. Please try again.";
      setError(messageText);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel">
      <h2>Send message with Antara</h2>
      <form className="stack" onSubmit={onSubmit}>
        <label className="label" htmlFor="message">
          Message body
        </label>
        <textarea
          className="input"
          id="message"
          name="message"
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          value={message}
        />
        <button className="button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Sending..." : "Send message"}
        </button>
      </form>
      {feedback && <p className="alert success">{feedback}</p>}
      {error && <p className="alert error">{error}</p>}
    </section>
  );
};
