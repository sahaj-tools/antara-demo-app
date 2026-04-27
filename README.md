# Antara External IdP Demo App

This project is a minimal but complete reference implementation for integrating Antara as an external identity provider in a public-facing Next.js application.

## 1) What is Antara

Antara is an identity and permissions platform. In this demo, Antara is the OAuth provider that:

- authenticates the user
- returns identity and granted permissions
- allows authenticated app actions (sending a message)

## 2) How Login Works (diagram style)

```text
[User clicks "Login with Antara"]
          |
          v
[Browser redirects to Antara /oauth/authorize]
          |
          v
[Antara prompts and approves access]
          |
          v
[Antara redirects back to /dashboard?code=...]
          |
          v
[Demo app calls POST /auth/exchange-code]
          |
          v
[App stores access token + identity in memory]
          |
          v
[Dashboard renders identity, permissions, and Message form]
```

## 3) Setup Steps

1. Install dependencies:

```bash
npm install
```

2. Create or update `.env.local`:

```bash
NEXT_PUBLIC_API_BASE=https://api.useantara.com
NEXT_PUBLIC_APP_ID=<your_app_id>
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/dashboard
```

3. Start the app:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## 4) Environment Variables

- `NEXT_PUBLIC_API_BASE`: Antara API base URL.
- `NEXT_PUBLIC_APP_ID`: App identifier registered with Antara.
- `NEXT_PUBLIC_REDIRECT_URI`: Callback URL configured in Antara app settings.

## 5) API Flow Explanation

### Login initiation

- `GET ${NEXT_PUBLIC_API_BASE}/oauth/authorize`
- query params:
  - `app_id`
  - `redirect_uri`
  - `response_type=code`

### Code exchange

- `POST ${NEXT_PUBLIC_API_BASE}/auth/exchange-code`
- body:

```json
{
  "code": "<authorization_code>"
}
```

### Authenticated action (send message)

- `POST ${NEXT_PUBLIC_API_BASE}/app/v1/messages`
- header:
  - `Authorization: Bearer <access_token>`
- body:

```json
{
  "to": "user.slug",
  "message": "Hello from demo app"
}
```

## 6) Security Notes

- No token logging:
  - The app never logs access tokens to console.
- Why no `localStorage`:
  - Tokens are kept only in memory to reduce exposure from persistent browser storage.
- Token handling:
  - Access token is set in React state and process memory.
  - Logout clears memory and redirects to home.
- Validation:
  - Dashboard validates that `code` exists before exchanging.
  - Error messages are user-friendly for invalid code, expired session, and general API failures.

## 7) Extending This App

The code includes comments describing extension points. Typical next steps:

- Store users in your DB after successful code exchange.
- Map Antara identity (`slug`, `trustLevel`, permissions) to your internal user record.
- Customize permission display and policy checks for your product domain.
- Add role-based authorization gates in UI and APIs.
- Move token exchange/message calls to backend endpoints for stricter security posture.

## Test Commands

Run lint:

```bash
npm run lint
```

Run tests:

```bash
npm run test
```
