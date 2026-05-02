# Cursor prompts: Antara OAuth + API alignment

This repo contains two complementary prompts:

1. **§1 — useantara.com (consent SPA + static hosting)**
  Fix MIME types, asset paths, Cloudflare `_routes.json`, CSP on the **marketing/consent** site.
2. **§2 — API worker (backend) — verification & gaps**
  Use when changing `useantara.com/worker` OAuth or app routes so integrator apps (e.g. `antara-demo-app`) stay consistent.

---

## §1 Frontend / consent site (paste into Antara web + Pages)

*(Original prompt — consent UI on `https://useantara.com`, chunk loading, CSP.)*

You are working in the Antara web frontend that serves OAuth consent under `https://useantara.com` (e.g. `/oauth/consent`).

### Symptoms

1. JS module requests return `**Content-Type: text/html`** (SPA fallback) → “Failed to load module script…”.
2. **CSP** blocks scripts or `connect-src` blocks `/assets/i18n/*.json`.
3. Relative `**assets/...`** under deep routes resolves to `**/oauth/assets/...**` — use **root-relative** `/assets/...`.

### Goals

- Static assets (`*.js`, `*.mjs`, `*.css`, `/assets/*`) must not be rewritten to `index.html`.
- Correct **MIME** types on CDN/Pages; `**_routes.json`** excludes asset patterns from the SPA worker where applicable.
- CSP on Pages, if any: allow `connect-src 'self' https://api.useantara.com` (and auth if needed).

### Deliverables

Code/config in this repo + short note for integrators.

---

## §2 API worker — backend checks (product / Cursor agent)

Paste into a chat in `**useantara.com/worker**` (or the Antara API package) when reviewing OAuth or messaging.

### Contract integrators depend on


| Topic                | Worker location                               | Expectation                                                                                                                                  |
| -------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Authorize redirect   | `handlers/oauth.ts`                           | Browser **GET** with `Accept: text/html` → **302** to `FRONTEND_ORIGIN/oauth/consent` + query string.                                        |
| Authorize params     | `handlers/oauth.ts`                           | `**client_id`** (not `app_id`), `**state**`, `**code_challenge**`, `**code_challenge_method=S256**`, `redirect_uri`, `response_type=code`.   |
| Token exchange       | `handlers/oauth.ts` `POST /oauth/token`       | `grant_type=authorization_code`, `**code_verifier**`, same `redirect_uri`, `client_id`. Returns `**jsonIdpData**` envelope `{ data, meta }`. |
| OAuth token type     | `lib/oauth-identity-token.ts`                 | Access token prefix `**oit_**` (opaque).                                                                                                     |
| Portal-only exchange | `handlers/auth.ts` `POST /auth/exchange-code` | **Signed** magic-link codes — **not** OAuth authorization codes.                                                                             |


### Messaging vs token type


| Topic         | Worker location          | Expectation                                                                                                   |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| App messaging | `handlers/messaging.ts`  | `**POST /app/v1/messages`**: primary path `**authenticateApp**` → Bearer `**aat_**`. Optional cap token path. |
| Introspection | `handlers/introspect.ts` | `**POST /auth/introspect**` resolves `**oit_**` via `resolveOAuthIdentityToken`.                              |


**Implication for demos:** browser OAuth yields `**oit_`**. Calling `**/app/v1/messages**` from the browser with `oit_` will fail **by design** until the worker adds an `**oit_` branch** or integrators use `**aat_`** on the server. Document this for PM/support.

### Verification commands (staging/prod)

1. `GET https://api.useantara.com/oauth/authorize?client_id=…&redirect_uri=…&response_type=code&state=…&code_challenge=…&code_challenge_method=S256` with `Accept: text/html` → **302** to `useantara.com/oauth/consent…`.
2. Complete consent → callback with `code` + `state`.
3. `POST /oauth/token` with JSON body including `**code_verifier`** → **200** and `data.accessToken` starting with `**oit_`**.
4. `POST /auth/introspect` with `{ "token": "<oit_>" }` → `data.active === true`.
5. `POST /app/v1/messages` with `Authorization: Bearer <oit_>` → expect **401/invalid token** unless product adds support; with `**aat_`** → success path.

### When changing behavior

- If `**/oauth/token**` response shape changes, update `**antara-demo-app**` (`lib/antara.ts` mapping) and public README.
- If messaging ever accepts `**oit_**`, update demo **MessageForm** copy and integration checklist.

---

## End of document

