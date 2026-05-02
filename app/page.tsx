import { LoginButton } from "@/components/LoginButton";

/**
 * Why this exists:
 * This is the public entry page for developers evaluating Antara OAuth.
 *
 * What Antara expects:
 * Redirect to /oauth/authorize with client_id, redirect_uri, response_type=code, PKCE, and state.
 *
 * Alternatives:
 * For larger apps, this page can include marketing copy or route users through a backend-initiated login flow.
 */
export default function Home() {
  return (
    <main className="container">
      <section className="card">
        <p className="eyebrow">Antara Reference Integration</p>
        <h1>Demo: External Identity Provider with Antara OAuth</h1>
        <p className="muted">
          This app demonstrates login, identity rendering, permissions display,
          token introspection, and the app messaging API contract (aat_ on the server).
        </p>
        <LoginButton />
      </section>
    </main>
  );
}
