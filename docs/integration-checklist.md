# Antara login — demo app / integrator checklist

Use this when wiring a public app (like `antara-demo-app`) to Antara’s API worker. It aligns with `useantara.com/worker` routes and the **Antara** repo doc `docs/integrators-antara-login-hosting.md` (hosting, consent UI, MIME/CSP).

## Registration (Antara admin / control plane)

1. **App row** exists with status **active** and governance **approved** (worker rejects pending/suspended apps).
2. **client_id** for OAuth is the app’s **UUID** (`client_id` query / body parameter).
3. **Redirect URI(s)** include every environment you use; the worker validates **`validateRedirectUri` — exact string match** (scheme, host, port, path, trailing slash).
4. For **private / invite-only** apps, the test user has an **invite** and permission policy allows connect (worker checks on POST `/oauth/authorize`).

## Browser OAuth (PKCE)

5. **GET `/oauth/authorize`** on the **API** host with:
   - `client_id`, `redirect_uri`, `response_type=code`
   - `state` (CSRF)
   - `code_challenge`, `code_challenge_method=S256`
   - optional `scope` (allowed tokens per worker allow-list)
6. User completes consent on **`https://useantara.com/oauth/consent`** (redirect from authorize when `Accept: text/html`).
7. **POST `/oauth/token`** with `grant_type=authorization_code`, `code`, `redirect_uri` (same as step 5), `client_id`, **`code_verifier`**.
8. Do **not** send OAuth authorization codes to **`POST /auth/exchange-code`** — that endpoint is for **signed portal / magic-link** codes (`MAGIC_LINK_SECRET`), not OAuth.

## Tokens

9. OAuth code exchange returns an **OAuth identity token** prefix **`oit_`** (opaque, KV-backed).
10. **`POST /app/v1/messages`** is implemented for **Bearer `aat_`** (app access token from DB) or capability tokens — **not** for `oit_`. Send messages from a **server** using `aat_` unless Antara documents otherwise.
11. **`POST /auth/introspect`** accepts `oit_`, `uat_`, `aat_` for debugging and session validation.

## Hosting / UX

12. **`NEXT_PUBLIC_*`** point at the **API** base URL for fetch calls; consent UI is still on `useantara.com`.
13. If the consent page fails to load JS, check MIME types and SPA routing on `useantara.com` (see integrators doc).

## Verification

| Step | Check |
|------|--------|
| Authorize | 302 to `…/oauth/consent?…` with same query string |
| Callback | Your `redirect_uri` receives `code` and `state` |
| Token | `POST /oauth/token` returns `{ data: { accessToken, user, scopes } }` |
| Introspect | `POST /auth/introspect` with `{ token }` returns `active: true` for `oit_` |

---

*Last updated: 2026-05-02 — aligned with Antara worker OAuth handler and messaging auth middleware.*
