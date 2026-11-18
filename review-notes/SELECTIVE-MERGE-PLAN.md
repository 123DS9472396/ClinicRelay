# ClinicRelay selective merge plan

## Status

**Awaiting explicit approval before code implementation.** This plan is the result of the independent audit. No reference project was edited and no reference implementation has been merged.

## Phase 1 — safety and domain contract

1. Add runtime schemas for `Msg`, `Settings`, `Enquiry`, assistant requests, enquiry mutations, and telephony events.
2. Extend `Enquiry` with `callbackConsent`, `language`, `callbackNotes`, and provider event metadata where needed.
3. Preserve the current fictional-data and demo disclosure boundaries.

Acceptance: invalid JSON, missing fields, invalid phones, and oversized text return explicit 4xx responses; no unsafe row is persisted.

## Phase 2 — guided receptionist workflow

1. Adapt the reference state machine from `src/assistant.mjs` into a typed server module.
2. Keep Groq/Ollama/Gemini as optional classification and reply providers.
3. Make consent a required step before creating callback tasks or appointment requests.
4. Add English, Hindi, and Marathi guarded templates.
5. Keep urgent cases high priority and prohibit diagnosis, medication, prices, availability, and automatic confirmation.

Acceptance: appointment, reschedule, FAQ, urgent, invalid phone, consent yes, and consent no scenarios pass automated tests.

## Phase 3 — API and persistence hardening

1. Add typed PATCH APIs for enquiry status/notes and appointment request status.
2. Rename the UI action from “Create appointment” to “Confirm request” and preserve human confirmation.
3. Add webhook HMAC verification and provider-event idempotency behind environment configuration.
4. Persist activity/audit records in Supabase; keep local JSON only for local demo fallback.
5. Verify Realtime publication and browser updates with two sessions.

Acceptance: duplicate webhook events do not create duplicate calls; unsigned events are rejected when verification is enabled; confirmation requires an explicit clinic action.

## Phase 4 — selective UI improvement

1. Adopt the reference answer-first dashboard band and callback queue.
2. Preserve current Next.js components and design tokens; do not copy the vanilla HTML.
3. Add loading, error, empty, and realtime connection states.
4. Improve mobile navigation and call drawer/modal interactions.
5. Add FAQ and language controls to Settings.

Acceptance: desktop and mobile manual checks pass; all buttons and navigation have observable outcomes; no fake analytics are introduced.

## Phase 5 — release validation

1. Run `npm test`, `npm run build`, TypeScript check, API probes, and browser checks.
2. Run the 20-scenario acceptance matrix covering English, Hindi, Marathi, consent, urgent, appointment, reschedule, FAQ, webhook, and failure paths.
3. Update `README.md`, `IMPLEMENTATION.md`, and the one-page note with actual limitations and free-tier cost assumptions.

## Explicitly not planned

- Real PSTN calls without a paid provider.
- Automatic calendar booking without a verified calendar integration.
- Email or WhatsApp claims without a configured provider.
- Unrestricted medical chatbot behavior.
- Authentication redesign as part of this prototype merge.
