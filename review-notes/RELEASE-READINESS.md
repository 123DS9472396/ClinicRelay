# ClinicRelay Release Readiness

## Assessment

**Prototype verdict: READY for a supervised, local or hosted demo.**  
**Production verdict: NOT READY for patient calls or real clinic use.**

The application satisfies the 48-hour prototype brief as a browser-based after-hours patient recovery workflow. It does not implement a live telephone network, authenticated clinic service, or verified calendar.

## Requirement audit

| Requirement | Status | Implemented evidence | Not verified / limitation |
|---|---|---|---|
| Recover after-hours enquiries | Working demo | Browser test-call workflow; Supabase persistence | No real missed-call/forwarding integration |
| Virtual receptionist | Working with Groq; safe rules fallback | `/api/assistant` provider routing and guarded output | LLM accuracy is not medically or clinically certified |
| Appointment requests | Working demo | Pending confirmation state; human confirm/decline actions | No dentist calendar or slot availability |
| Rescheduling | Working demo | Intent extraction and guided conversation | Full cancellation/reschedule rules need clinic policy tests |
| FAQ responses | Working demo | Timings/location/settings and FAQ answer resolver | FAQ quality depends on clinic-approved content |
| Urgent enquiry escalation | Working demo | High-priority label and emergency response boundary | No live on-call alert/SMS/WhatsApp |
| Patient detail validation | Partially working | 10-digit Indian mobile extraction; payload limits | Name validation is conversational, not field-certified |
| Callback consent | Working demo | Explicit yes/no question and consent field | No consent storage notice/retention policy |
| Transcript | Working demo | Every patient/AI turn is stored in the enquiry | No immutable production audit log |
| Persistent records | Working locally and via Supabase | Server REST adapter, demo table, local JSON fallback | Supabase RLS/real tenant isolation not complete |
| Realtime updates | Supabase implementation verified for API; browser test manually exercised | Browser subscription in `app/page.tsx` | Cross-device production test remains environment-dependent |
| Call inbox search/filter | Working demo | Name, phone, summary search; status filter | No priority filter, date filter or pagination |
| Callback status/notes | Working demo | Status and notes update in UI, persisted through enquiry POST | No dedicated PATCH API or status audit trail |
| Human confirmation | Working demo | Confirm/decline controls; requests stay pending | No availability review record or calendar approval |
| Analytics | Working demo calculations | Capture, callback, appointment and intent totals | Figures are generated only from demo/entered records; no real clinic baseline |
| Clinic settings | Working demo | Name, address, hours, holiday, languages, FAQs | No server-side settings persistence or version history |
| English/Hindi/Marathi | Partially working | Language detection and consent templates; Groq prompts | Not a complete Hindi/Marathi speech/voice experience |
| ₹5,000/month model | Documented, not live-validated | Cost note and implementation documents | Requires provider quotes and real usage |
| Email/WhatsApp | Missing | No provider integration | Deliberately absent; no false delivery claims |
| Authentication | Missing | Demo workspace has no sign-in | Required before live patient data |
| Live telephony | Missing | Browser simulator and webhook contract only | Not production voice-connected |
| Webhook validation | Implemented demo-hardening | Payload normalization, HMAC option, duplicate event log | Provider secret and signature contract must be configured and tested |
| API failure handling | Working | Invalid JSON/schema responses and Supabase retry/502 handling | Load testing and provider failover remain pending |
| Security and secrets | Partially working | Server-side service role key; `.env.local` ignored; no secrets in source | RLS, authentication, encryption/retention policy, rate limiting remain |
| Mobile responsiveness | Working basic layout; needs final viewport sign-off | Tailwind mobile sidebar/test-call/modal layout | No automated mobile visual regression test |

## Senior-engineering gaps

1. **No live call ingress.** Browser simulation proves the workflow, not telephony.
2. **No real appointment source of truth.** A human must check availability outside ClinicRelay.
3. **No authentication or clinic tenant isolation.** Supabase is suitable for the demo only until RLS and sign-in are implemented.
4. **No server-side clinic settings.** Settings are currently browser-oriented; clinic facts should become a signed/admin-managed server record.
5. **No dedicated domain mutations.** The app currently posts complete enquiry arrays; staff should use typed PATCH endpoints for status, notes and confirmations.
6. **No production audit trail.** Changes should record actor, timestamp, old value and reason.
7. **No notification pipeline.** Email/WhatsApp/SMS should remain off until consent and provider policy are approved.
8. **No live Hindi/Marathi voice test.** Templates exist; speech accuracy and end-to-end dialogue remain unverified.
9. **No load or concurrency testing.** Supabase Realtime and repeated whole-row writes need conflict-safe updates.
10. **No cost/card validation.** The ₹5,000 budget is a planning model, not a provider invoice.

## Implemented product choices

- Simulated calls are unmistakably labelled.
- Fictional patient records are used.
- Appointment outcomes remain requests until human confirmation.
- Callback consent is explicit.
- Urgent concerns receive no diagnosis and prompt human/emergency escalation.
- Groq is optional; the receptionist remains usable through deterministic rules.
- Supabase is optional; the app has a local/JSON fallback.
- The UI uses one restrained visual identity, calm data density and a premium operations layout.

## Deliberately rejected

- A standalone website chatbot as the primary call recovery method.
- AI-created medical diagnosis or prescription advice.
- Automatic appointment confirmation.
- A full practice-management system before demand validation.
- A night receptionist or answering service because it exceeds the 48-hour/₹5,000 prototype boundary.
- Fake live-call analytics or false real-clinic recovery claims.

## What is required for the next production phase

1. Confirm monthly call volume, after-hours share and phone provider.
2. Obtain a voice/telephony provider test number.
3. Implement forwarding/missed-call routing.
4. Add signed, idempotent webhook ingestion.
5. Add clinic authentication and row-level tenant security.
6. Move call, patient, consent and appointment states to normalised Supabase/PostgreSQL tables.
7. Integrate a dentist-approved availability source or calendar.
8. Add WhatsApp/email alerts only after consent and template review.
9. Establish retention, deletion and audit policies.
10. Pilot on a non-critical line and measure capture, callback and confirmation rates.

## Verified in this session

- Next.js build passes.
- Automated tests pass.
- TypeScript passes.
- Five automated tests pass.
- Typed enquiry and clinic-settings API boundaries are implemented.
- Production dependency audit has zero vulnerabilities.
- `/api/health` returns 200.
- `/api/enquiries` returns 200 with Supabase persistence.
- `/api/settings` GET/PUT returned 200 and saved settings to Supabase.
- `/api/enquiries/[id]` PATCH returned 200 for valid updates.
- Invalid status PATCH returned 422.
- Groq assistant route returned `source=groq`.
- Duplicate webhook delivery is identified.
- Invalid enquiry payloads return validation errors.
- Stale Next cache cleanup is automatic through `npm run dev`.
- ClinicRelay uses Next.js 16.4.6 and React 19.2.4.
- `npm audit --omit=dev` reports zero production vulnerabilities.
- No Next development server is left running after validation.
