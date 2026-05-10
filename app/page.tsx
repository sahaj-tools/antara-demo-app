import { LoginButton } from "@/components/LoginButton";

/**
 * Why this exists:
 * This is the public entry page for developers evaluating Antara OAuth.
 *
 * What Antara expects:
 * Full authorize query (client_id, redirect_uri, response_type=code, state, PKCE); browser GET
 * so API redirects to useantara.com/oauth/consent with the same query string.
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
        <p className="muted smallPrint">
          Login builds a complete <code>/oauth/authorize</code> link (client id, redirect URI, PKCE,
          state, and optional scope) so the consent page on <code>useantara.com</code> can load. If
          users see an error there, capture the <strong>error code</strong> and <strong>request ID</strong>{" "}
          shown on the page for support.
        </p>
        <p className="muted smallPrint">
          Apps can be <strong>private</strong>, <strong>invite-only</strong>, or <strong>pending approval</strong>{" "}
          (Phase 3 trust gates). Until the app is allowed for your test user, OAuth may fail — use a
          staging <code>client_id</code>, register exact redirect URIs, and see the repo README{" "}
          <em>Phase 3</em> section.
        </p>
        <p className="muted smallPrint">
          Phase 4 circle context is supported: add <code>?circle=&lt;circle-uuid&gt;</code> to this
          page or paste a circle UUID below before login. The dashboard demonstrates introspect and
          identity lookup with <code>oit_</code> under that context.
        </p>
        <LoginButton />
      </section>
    </main>
  );
}
