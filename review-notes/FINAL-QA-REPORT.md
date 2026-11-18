# ClinicRelay final QA report

## Assessment status

**Release recommendation: DEMO-READY WITH LIMITATIONS.** The approved selective hardening is implemented and the core free browser demo is verified. Production telephony, authentication, and live Supabase/mobile verification remain outside the verified release boundary.

## Evidence run

| Check | Result | Evidence |
|---|---|---|
| Current automated tests | PASS | `npm test`: 2 passed |
| Current production build | PASS | `npm run build` completed |
| Current TypeScript validation | PASS | `npx tsc --noEmit` completed |
| Framework upgrade | PASS | Next.js 16.4.6 and React 19.2.4 |
| Production dependency audit | PASS | `npm audit --omit=dev`: 0 vulnerabilities |
| Stale dev-cache prevention | PASS | `predev` clears `.next`; no leftover port 3000/3001 listener after validation |
| Assistant runtime probe | PASS | Appointment scenario returned a guided name request with rules fallback |
| Invalid enquiry API input | PASS | Invalid phone returned HTTP 422 |
| Duplicate webhook event | PASS | Second delivery returned `duplicate: true` |
| Reference assistant tests | PASS | 6 passed in extracted assessment reference |
| Health endpoint | PASS | `/api/health` returned 200 |
| Supabase environment loading | PASS | Local dev server detected all four variables and `/api/enquiries` reported `persistence=supabase` |
| Local enquiry persistence | PASS | `/api/enquiries` returned rows and accepted POST |
| Telephony simulator | PASS | Simulator received HTTP 200 |
| Real Groq response | NOT TESTED | No valid key was used during audit |
| Supabase Realtime | NOT TESTED | Requires project credentials and deployed schema |
| Mobile browser behavior | NOT TESTED | No browser automation was available in this audit |
| Real phone call | NOT TESTED | No telephony provider is configured |

## Required-feature matrix

| Feature | Status | Finding |
|---|---|---|
| After-hours capture | Working | Browser test call saves an enquiry |
| Simulated call disclosure | Working | UI states calls are simulated and patients fictional |
| AI receptionist conversation | Partially implemented | Provider pipeline exists; local runtime commonly falls back to rules |
| Appointment intent | Working demo | Request is created from test call |
| Reschedule intent | Partially implemented | Extraction exists; full guided reschedule flow is not covered by current tests |
| FAQ responses | Working demo | Configurable FAQ answers are matched and returned without inventing clinic facts |
| Urgent escalation | Partially implemented | Priority and safe response exist; consent and human queue semantics are incomplete |
| Patient validation | Partially implemented | Phone and request payload validation are enforced; name validation remains conversational |
| Callback consent | Working demo | Explicit yes/no step controls callback and appointment-request persistence |
| Transcript and summary | Working demo | Stored in enquiry record |
| Persistent records | Partially implemented | Local JSON works; Supabase path is not live-verified |
| Inbox/search/filter | Working demo | Search and status filters exist |
| Callback status/notes | Working demo | UI updates status and notes, but no dedicated mutation API |
| Human appointment confirmation | Working demo | UI labels action as “Confirm request” and retains pending status until clinic action |
| Analytics | Partially implemented | Derived metrics work but are limited and not independently tested |
| Clinic settings | Working demo | Name/address/hours/holiday, languages, and FAQ answers are editable |
| English/Hindi/Marathi | Partially implemented | Language detection and consent/no-consent templates cover all three; full dialogue localization is not complete |
| Email/WhatsApp | Missing | No provider integration |
| Responsive UI | Needs manual verification | Tailwind rules exist; mobile interaction not browser-tested |
| ₹5,000/month model | Partially implemented | Documentation exists; no in-product cost assumptions |
| Privacy/security | Partially implemented | Secrets remain server-side, payloads are validated, and optional HMAC/idempotency are implemented; auth/tenant isolation is absent |

## Security and integrity findings

1. Supabase service-role access is server-side by convention, but live RLS/realtime configuration remains unverified.
2. No authentication or tenant isolation is present; acceptable only for a fictional demo, not production.
3. The current browser persistence effect can overwrite cloud state when multiple tabs update concurrently.

## UI findings

The extracted reference has a stronger operations-tool hierarchy: compact answer band, callback queue, activity strip, drawer details, explicit state notices, and mobile-safe layout. The current project should selectively adopt those patterns in React rather than copy the static HTML.

## Release blockers

- Add assistant and persistence tests beyond the two telephony tests.
- Manually verify desktop/mobile interactions and Supabase Realtime.

## Not claimed

This report does not claim real telephony, real calendar booking, email/WhatsApp delivery, multilingual support, production authentication, or measured AI accuracy.
