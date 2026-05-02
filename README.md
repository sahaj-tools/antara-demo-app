# Antara External IdP Demo App

This project is a minimal but complete reference implementation for integrating Antara as an external identity provider in a public-facing Next.js application.

## 1) What is Antara

Antara is an identity and permissions platform. In this demo, Antara is the OAuth provider that:

- authenticates the user (authorization code + **PKCE**)
- returns identity and **granted scopes** (shown as permissions)
- demonstrates **token introspection** with the browser OAuth token (`oit_`)
- shows how **app messaging** is called (same API your server would use with an **`aat_`** token)

## 2) How Login Works (diagram style)

```text
[User clicks "Login with Antara"]
          |
          v
[Demo generates PKCE verifier + state; stores verifier in sessionStorage]
          |
          v
[Browser redirects to API GET /oauth/authorize?client_id=…&redirect_uri=…&response_type=code
 &state=…&code_challenge=…&code_challenge_method=S256&scope=…]
          |
          v
[302 to useantara.com/oauth/consent — user signs in and approves]
          |
          v
[Browser returns to /dashboard?code=…&state=…]
          |
          v
[Demo checks state matches stored value, then POST /oauth/token with code_verifier]
          |
          v
[App stores OAuth identity token (oit_) + user in memory]
          |
          v
[Dashboard: identity, introspect demo, messaging request shape demo]
```

**Note:** `POST /auth/exchange-code` is for Antara’s **portal / magic-link** handoff (signed codes), **not** for third-party OAuth authorization codes. Integrators must use **`POST /oauth/token`** with PKCE for OAuth.

## 3) Setup Steps

1. Install dependencies:

```bash
npm install
```

2. Register an app in Antara (admin / control plane). You need:

   - **Client id** — UUID, same value as `NEXT_PUBLIC_APP_ID`
   - **Redirect URI(s)** — exact match (scheme, host, path, no stray trailing slash)

3. Create or update `.env.local`:

```bash
NEXT_PUBLIC_API_BASE=https://api.useantara.com
NEXT_PUBLIC_APP_ID=<your_app_uuid_client_id>
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/dashboard
```

4. Start the app:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

### Cloudflare Pages (production)

This project uses **static HTML export** (`output: "export"` in `next.config.ts`) so Cloudflare Pages can serve it like any static site.

In your Pages project **Settings → Build**:

| Setting | Value |
|--------|--------|
| Build command | `npm run build` |
| Build output directory | **`out`** (not `.next`, not `/out`) |

Using `.next` as the output directory will not produce a working site on Pages, because Pages serves static files from that folder; the deployable export lives in **`out/`**.

**Why `npm run build`:** The script runs `node scripts/inject-public-env.mjs` first. That reads `NEXT_PUBLIC_*` from the environment and writes `lib/generated-public-env.ts` with **plain string literals**. The app imports that file so the values always appear in the static JS bundle. Relying only on `process.env.NEXT_PUBLIC_*` inside components is unreliable with some static-export / Turbopack builds (values can be missing in the browser even when CI env is set). Do **not** run `next build` alone in production CI.

Set **Variables and Secrets** (same names as local):

- `NEXT_PUBLIC_API_BASE`
- `NEXT_PUBLIC_APP_ID`
- `NEXT_PUBLIC_REDIRECT_URI` — must exactly match your live callback URL (e.g. `https://demo.useantara.com/dashboard`) and the redirect URI configured in Antara.

After changing build settings, trigger a new deployment.

## 4) Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_BASE` | Antara **API** host (e.g. `https://api.useantara.com`). OAuth and token endpoints live here—not the marketing site origin. |
| `NEXT_PUBLIC_APP_ID` | OAuth **client_id** (your app’s UUID). |
| `NEXT_PUBLIC_REDIRECT_URI` | Registered callback URL for this deployment. |

## 5) API Flow Explanation

### Login initiation

`GET ${NEXT_PUBLIC_API_BASE}/oauth/authorize`

Query parameters (this demo sends all required fields):

| Parameter | Value |
|-----------|--------|
| `client_id` | Same as `NEXT_PUBLIC_APP_ID` |
| `redirect_uri` | Same as env (must match registration **exactly**) |
| `response_type` | `code` |
| `state` | Random string (CSRF protection) |
| `code_challenge` | PKCE S256 challenge |
| `code_challenge_method` | `S256` |
| `scope` | Space-separated scopes (demo defaults to `identity.read messages.send profile.basic`) |

The browser is then redirected to **`https://useantara.com/oauth/consent`** (consent UI).

### Code exchange

`POST ${NEXT_PUBLIC_API_BASE}/oauth/token`

```json
{
  "grant_type": "authorization_code",
  "code": "<authorization_code>",
  "redirect_uri": "<same as authorize>",
  "client_id": "<app uuid>",
  "code_verifier": "<pkce_verifier_from_login_step>"
}
```

Success body is Antara’s envelope `{ data: { accessToken, scopes, user, … }, meta }`. The access token for this flow is an **OAuth identity token** (`oit_…`).

### Introspection (works with `oit_` in the browser)

`POST ${NEXT_PUBLIC_API_BASE}/auth/introspect`

```json
{
  "token": "<access_token>"
}
```

### App messaging (requires **`aat_`**, not `oit_`)

`POST ${NEXT_PUBLIC_API_BASE}/app/v1/messages`

- Header: `Authorization: Bearer <aat_app_access_token>`
- Header: `Idempotency-Key: <uuid>` (required)
- JSON body:

```json
{
  "slug": "recipient.slug@domain",
  "body": "Plain text message"
}
```

The demo may call this endpoint with the **OAuth browser token** to show the real API contract; the API is routed for **app access tokens** (`aat_`). Use your **backend** with a stored app credential to send messages in production.

## 6) Security Notes

- No token logging: the app does not log access tokens to the console in production paths.
- **PKCE** is required by Antara for public clients; the verifier never appears in the URL (only in `sessionStorage` until the callback).
- **State** parameter: validated against the value stored at login start.
- Tokens are kept in **memory** after exchange (not `localStorage`) to reduce XSS persistence risk.
- Logout clears memory and redirects home.
- For production, consider exchanging the code **on your server** and issuing your own session cookies.

## 7) Extending This App

The code includes comments describing extension points. Typical next steps:

- Exchange the code on your backend; store sessions in HttpOnly cookies.
- Map Antara identity (`primarySlug`, `trustLevel`, scopes) to your internal user record.
- Obtain **`aat_`** via Antara’s app-token endpoints and call `/app/v1/messages` from the server only.

## Test Commands

Run lint:

```bash
npm run lint
```

Run tests:

```bash
npm run test
```

## Further reading

- [`docs/integration-checklist.md`](docs/integration-checklist.md) — integrator checklist aligned with Antara API worker behavior.
