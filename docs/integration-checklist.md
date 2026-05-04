# Antara login — demo app / integrator checklist

This document mirrors **`useantara.com/docs/demo-app-integration-checklist.md`** and expands it with implementation notes for this repo. See also **`integrators-antara-login-hosting.md`** in the `useantara.com` repo under `docs/` (hosting, consent UI, MIME/CSP).

## Summary (Antara product checklist)

1. Register the app; **client_id** = app UUID; **redirect URIs** = exact match.
2. Use **PKCE** (`code_challenge` / `code_verifier`) on `/oauth/authorize` and `/oauth/token`.
3. Use **`POST /oauth/token`** for OAuth codes — **not** `POST /auth/exchange-code` (portal magic links).
4. OAuth access tokens are **`oit_`**; **`/app/v1/messages`** expects **`aat_`** (server app token) — see README for introspect vs messaging.

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

1. **App row** exists with status **active** and governance **approved** (worker rejects pending/suspended apps).
2. **client_id** for OAuth is the app’s **UUID**.
3. **Redirect URI(s)** include every environment; **`validateRedirectUri`** is an **exact** string match.
4. For **private / invite-only** apps, the test user has an **invite** and policy allows connect (POST `/oauth/authorize` checks).

## Browser OAuth (PKCE) — this repo

5. **`lib/auth.ts`** → **`buildOAuthAuthorizeUrl`** builds the query string; **`LoginButton`** generates PKCE + state and stores the verifier in **`sessionStorage`** (`lib/oauth-pending.ts`).
6. **`DashboardClient`** validates **`state`**, exchanges with **`POST /oauth/token`** (`lib/antara.ts`).
7. Do **not** send OAuth codes to **`POST /auth/exchange-code`**.

## Tokens

8. OAuth exchange returns **`oit_`** (opaque).
9. **`POST /app/v1/messages`** is for **`aat_`** / cap tokens — not **`oit_`** from the browser OAuth flow.
10. **`POST /auth/introspect`** accepts **`oit_`** for validation demos.

## Hosting / UX

11. **`NEXT_PUBLIC_*`** use the **API** origin for `fetch`; consent UI is on **`useantara.com`**.
12. If consent scripts fail to load, check MIME / SPA routing on **`useantara.com`** (integrators doc).

## Verification

| Step | Check |
|------|--------|
| Authorize | 302 to `…/oauth/consent?…` with same query string |
| Callback | `redirect_uri` receives `code` and `state` |
| Token | `POST /oauth/token` returns `{ data: { accessToken, user, scopes } }` |
| Introspect | `POST /auth/introspect` with `{ token }` → `active: true` for `oit_` |

---

*Last updated: 2026-05-03 — aligned with `useantara.com/docs/demo-app-integration-checklist.md` and Antara worker OAuth + consent SPA.*
