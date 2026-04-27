import { Suspense } from "react";
import { DashboardClient } from "@/components/DashboardClient";

/**
 * Why this exists:
 * This route demonstrates the full Antara callback lifecycle and authenticated app behavior.
 *
 * What Antara expects:
 * Antara redirects with ?code=, and that code must be exchanged via POST /auth/exchange-code.
 *
 * Alternatives:
 * Production deployments often perform this exchange server-side and issue HttpOnly cookies.
 */
export default function DashboardPage() {
  return (
    <main className="container">
      <section className="card">
        <p className="eyebrow">Dashboard</p>
        <h1>Antara Session Demo</h1>
        {/* Suspense is required because DashboardClient uses useSearchParams. */}
        <Suspense fallback={<p className="muted">Loading dashboard...</p>}>
          <DashboardClient />
        </Suspense>
      </section>
    </main>
  );
}
