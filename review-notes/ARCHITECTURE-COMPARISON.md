# ClinicRelay architecture comparison

## Current Next.js project

Strengths:

- App Router and typed React UI.
- Server-side AI route with Ollama, Groq, Gemini, and rules fallback.
- Local JSON persistence plus optional Supabase REST persistence.
- Browser Supabase Realtime subscription.
- Deployment configuration for Vercel and Render.
- Explicit demo boundary.

Risks:

- `POST /api/enquiries` accepts arbitrary rows without runtime schema validation.
- `POST /api/assistant` trusts request shape and clinic settings.
- Telephony webhook normalizes payloads but does not authenticate or deduplicate events.
- Browser localStorage can overwrite a newer cloud state.
- No authentication or tenant isolation exists for the demo API.
- There are only two current automated tests, both for telephony normalization.

Evidence: `app/api/assistant/route.ts`, `app/api/enquiries/route.ts`, `app/api/telephony/webhook/route.ts`, `lib/cloud-store.ts`, `lib/supabase-browser.ts`, `supabase/schema.sql`.

## Assessment reference

Strengths:

- `src/assistant.mjs` models conversation as an explicit state machine.
- `server.mjs` validates body size, JSON, phone numbers, status transitions, settings, and webhook signatures.
- Provider webhook handling includes HMAC verification and duplicate `providerEventId` detection.
- `src/store.mjs` uses atomic temporary-file replacement.
- `tests/assistant.test.mjs` covers urgent precedence, appointment requests, invalid phone, no consent, FAQ, and Hindi.
- `docs/ARCHITECTURE.md` states production trade-offs honestly.

Risks:

- JSON persistence is not suitable for concurrent production use.
- No authentication is enabled.
- The Groq classifier is optional and the core conversation remains deterministic.
- No real telephony, email, WhatsApp, or calendar integration.

## Recommended target

Keep the current Next.js project and merge only these bounded ideas:

1. Add a shared runtime validation layer for assistant, enquiries, settings, and telephony inputs.
2. Add a server-side conversation session/state model, using the reference stages: intent → name → phone → preference → consent → persisted record.
3. Add callback consent and language to the domain model.
4. Add typed PATCH operations for enquiry and appointment transitions.
5. Add signed webhook verification behind an explicit provider configuration flag and idempotency storage.
6. Add focused tests for every safety-critical branch.
7. Use Supabase tables with tenant-scoped policies when authentication is introduced.

The reference architecture is a source of behavior and validation patterns, not a replacement backend.
