# Antara login — demo app / integrator checklist

**Platform roadmap:** see **`PRODUCT_PLAN.md`** Phase 1 (OAuth / consent / env-specific `client_id`) in the **useantara.com** repo. Phase 3 covers private/invite-only apps and trust labels; Phase 4 covers circle context and deep links; **Phase 5** adds an optional **`GET /public/v1/apps`** discovery surface (does not gate OAuth — see **`useantara.com/docs/phase-5-catalog-policy.md`**). **Sec-4.1:** use **separate** registered OAuth apps for production vs local/staging (`client_id` + redirect URI sets) — see **README** Sec-4.1 and **`.env.example`**.

This document mirrors **`useantara.com/docs/demo-app-integration-checklist.md`** and expands it with implementation notes for this repo. See also **`integrators-antara-login-hosting.md`** in the `useantara.com` repo under `docs/` (hosting, consent UI, MIME/CSP).

## Summary (Antara product checklist)

1. Register the app; **client_id** = app UUID; **redirect URIs** = exact match.
2. Use **PKCE** (`code_challenge` / `code_verifier`) on `/oauth/authorize` and `/oauth/token`.
3. Use **`POST /oauth/token`** for OAuth codes — **not** `POST /auth/exchange-code` (portal magic links).
4. OAuth access tokens are **`oit_`**; **`/app/v1/messages`** expects **`aat_`** (server app token) — see README for introspect vs messaging. **`POST /app/v1/identity/lookup`** may use **`Bearer oit_`** when the grant includes **`identity.read`** (or legacy **`identify`**); **`GET /auth/me`** and **`GET /oauth/userinfo`** also accept **`oit_`** and revalidate **circle** access on every request when the token carries **`circleId`**.

## Consent screen URL (what this demo does)

1. The demo sends the user’s browser to **`GET {NEXT_PUBLIC_API_BASE}/oauth/authorize?…`** with a normal navigation (`window.location`). The request **`Accept`** header includes **`text/html`**, so the worker returns **302** to **`https://useantara.com/oauth/consent`** with the **same query string** (`worker/src/handlers/oauth.ts`).
2. The consent SPA then calls **`GET {API}/oauth/authorize?…`** again with **`Accept: application/json`** and the user’s Antara session cookies to load consent metadata.
3. Your app **must** include every **required** query parameter in that first URL (see table). Missing or wrong values surface as errors on the consent page (“contact the app developer”).

| Query param | Required | Notes |
|-------------|----------|--------|
| `client_id` | Yes | Same as `NEXT_PUBLIC_APP_ID` in this demo. |
| `redirect_uri` | Yes | **Exact** registered URI (scheme, host, path, trailing slash). |
| `response_type` | Yes | Must be `code`. |
| `state` | Yes | Stored with PKCE verifier; verified on callback. |
| `code_challenge` | Yes | PKCE S256 challenge. |
| `code_challenge_method` | Yes | Must be `S256`. |
| `scope` | Optional | This demo sends an explicit space-separated list for predictable consent; omitting is valid — Antara normalizes defaults. |

### Troubleshooting (support)

If users cannot complete consent, ask for the **error message**, **error code** (e.g. `INVALID_REDIRECT`, `PKCE_REQUIRED`), and **request reference** (UUID) from the Antara page — map **`requestId`** to worker logs.

## Registration (Antara admin / control plane)

1. **App row** exists with lifecycle **`status: active`** (not soft-deleted). Governance **`approval_status`** may be **`pending`** for newly created apps; OAuth flows can be **blocked until an operator sets approval** (and any domain verification gate you use).
2. **client_id** for OAuth is the app’s **UUID**.
3. **Redirect URI(s)** include every environment; **`validateRedirectUri`** is an **exact** string match.
4. For **private / invite-only** apps, the test user has an **invite** and policy allows connect (POST `/oauth/authorize` checks).
5. **Staging vs production:** provision a separate app (different UUID) per environment so `redirect_uri` and trust labels do not collide; avoids pointing production registration at `localhost`.

## Phase 3 — Private-first defaults, invites, domain verification

| Backend / admin signal | Typical meaning for integrators |
|------------------------|--------------------------------|
| `type: private`, `inviteOnly: true`, `approvalStatus: pending` | Default posture for **new** admin-created apps. Login may fail until approval + invites are sorted. Do not label as “verified” or “official” until policy says so. |
| Domain verification **`well_known`** | Operator publishes the challenge token at **`/.well-known/antara-verification.txt`** on the app **domain**, then runs verify in Admin. Success generally moves the app toward **verified** + **approved** per worker policy. |
| `moderation_state` not `clean` | User-facing flows may be limited; fix in Admin before testing OAuth end-to-end. |

**Docs in Admin:** App details → **Domain verification** (start challenge, verify) and **Lifecycle & trust** (type, invite-only, approval, moderation, trust score).

## Browser OAuth (PKCE) — this repo

5. **`lib/auth.ts`** → **`buildOAuthAuthorizeUrl`** builds the query string; **`LoginButton`** generates PKCE + state and stores the verifier in **`sessionStorage`** (`lib/oauth-pending.ts`).
6. **`DashboardClient`** validates **`state`**, exchanges with **`POST /oauth/token`** (`lib/antara.ts`).
7. Do **not** send OAuth codes to **`POST /auth/exchange-code`**.

## Tokens

8. OAuth exchange returns **`oit_`** (opaque).
9. **`POST /app/v1/messages`** is for **`aat_`** / cap tokens — not **`oit_`** from the browser OAuth flow.
10. **`POST /auth/introspect`** accepts **`oit_`** for validation demos (circle-bound tokens go **`active: false`** after owner revokes circle access).
11. Optional: call **`POST /app/v1/identity/lookup`** with **`Authorization: Bearer <oit_>`** and body **`{}`** to resolve the user’s slug for that app (same circle rules as userinfo).

## Hosting / UX

12. **`NEXT_PUBLIC_*`** use the **API** origin for `fetch`; consent UI is on **`useantara.com`**.
13. If consent scripts fail to load, check MIME / SPA routing on **`useantara.com`** (integrators doc).

## Verification

| Step | Check |
|------|--------|
| Authorize | 302 to `…/oauth/consent?…` with same query string |
| Callback | `redirect_uri` receives `code` and `state` |
| Token | `POST /oauth/token` returns `{ data: { accessToken, user, scopes } }` |
| Introspect | `POST /auth/introspect` with `{ token }` → `active: true` for `oit_` |
| Identity lookup (OAuth token) | `POST …/app/v1/identity/lookup` + **`Bearer oit_`** + optional `{ "userId": "<sub>" }` → slug payload when **`identity.read`** is granted |

## Production smoke test

Run this before release or after app registration changes (from the **useantara.com** repo):

```bash
ANTARA_SMOKE_CLIENT_ID=<uuid> ANTARA_SMOKE_REDIRECT_URI=<exact-registered-uri> npm run smoke:oauth-authorize
```

**Pass:** `401` with `data.loginRequired=true` — app + redirect are valid; only the user session is missing.

**Actionable failures:**

- `INVALID_CLIENT` → app missing or inactive in target API environment.
- `INVALID_REDIRECT` → `redirect_uri` does not exactly match app registration (check scheme, host, path, trailing slash).

---

*Last updated: 2026-05-08 — Phase 3 trust-gate copy + Phase 4 circle deep-link/`oit_` lookup flow; aligned with `useantara.com/docs/demo-app-integration-checklist.md`.*
