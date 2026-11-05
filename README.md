# EmployeeDesk-Frontend

The console for the EmployeeDesk assistant: sign-in and a bilingual (English / Arabic, full RTL) chat over the EmployeeDesk API. Next.js App Router, Tailwind, shadcn/radix.

All data is synthetic. Nothing here comes from any real organisation.

## Run locally

```bash
cp .env.sample .env.local            # API_URL=http://127.0.0.1:8012/api
npm install
npm run dev                          # http://localhost:3012
```

The API and the mock ERP must be running (see `../EmployeeDesk-Backend/README.md`). Sign in with any active synthetic employee, e.g. `user001@example.test` / `Synthetic-Pass-1`.

## Check

```bash
npm run typecheck
npm run lint
npm run build
```

## How it is put together

- **Sessions**: the browser posts credentials to the app's own `/api/session`; the server exchanges them with the API and keeps the token pair in HttpOnly cookies. Page scripts never see a token or the API origin.
- **API calls**: everything goes through `/api/backend/*` (`src/app/api/backend`), which attaches the bearer server-side and renews it from the refresh token when it expires. Streaming responses pass through untouched.
- **Guarding**: `src/proxy.ts` redirects signed-out readers to `/login`, refreshes an expiring session, mints a CSP nonce per response and resolves the locale cookie.
- **Language**: `src/i18n` with typed dictionaries (`en` is the schema, `ar` must match). The header toggle writes the locale cookie and refreshes; the assistant is asked in the UI language.
- **Assistant** (`src/components/assistant/assistant-console.tsx`): streams `token` and `tool_call` events, then renders citations, tool chips, guardrail flags and, for a drafted leave request, the confirmation card that calls `/assistant/confirm/{id}`. Typing "yes" in the composer is not a confirmation.

Screens: `/login`, `/copilot`, `/leave`, `/procurement`, `/audit`.
