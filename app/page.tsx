import { LoginButton } from "@/components/LoginButton";

/**
 * Why this exists:
 * This is the public entry page for developers evaluating Antara OAuth.
 *
 * What Antara expects:
 * We direct users to Antara's authorize endpoint with app_id, redirect_uri, and response_type=code.
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
          and secure message sending using the Antara API.
        </p>
        <LoginButton />
      </section>
    </main>
  );
}
