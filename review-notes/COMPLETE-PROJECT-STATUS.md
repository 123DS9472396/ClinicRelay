# ClinicRelay Complete Project Status

**Generated:** 18 November 2026  
**Prototype status:** Working supervised browser demo  
**Production status:** Not ready for real patient calls or live clinic operations

## 1. Assignment outcome

ClinicRelay addresses the 48-hour brief with a browser-based after-hours patient recovery prototype:

- A simulated call captures intent, name, an Indian 10-digit mobile number, preferences and callback consent.
- Groq generates guarded receptionist replies when configured.
- The deterministic rule engine remains usable without external AI credentials.
- Enquiries are stored locally or in Supabase.
- Staff can search, filter and update the call inbox.
- Appointment outcomes remain requests until a human confirms or declines them.
- Fictional data and demo disclosures are visible throughout.

The prototype does not claim to answer real phone calls, place calls, access a real dentist calendar or send real WhatsApp, SMS or email.

## 2. Genuinely working

| Capability | Verified evidence |
|---|---|
| Next.js application | Next.js 16.4.6 and React 19.2.4 build passes |
| Browser call simulator | Test-call modal, scenarios, conversation and hang-up behavior |
| Guided receptionist | Name, mobile number, date/time, yes/no consent |
| Groq LLM | Live route returned `source=groq`; greeting and appointment scenarios worked |
| Safe rules fallback | Built-in receptionist replies remain usable without a provider |
| Appointment request | Requests remain `Pending confirmation`; no automatic confirmation |
| Human confirmation/decline | Confirmed and declined controls update enquiry state |
| Rescheduling | Intent extraction and guided follow-up |
| Urgent intent | High-priority flag and safe human/emergency escalation response |
| FAQ/timings/location | Configured clinic facts and editable FAQ answers |
| Callback consent | Explicit yes/no question and persisted consent field |
| Transcript | Patient and receptionist turns are stored with the enquiry |
| Local persistence | Local JSON fallback and browser cache |
| Supabase persistence | Enquiry API uses Supabase and returns stored rows |
| Supabase settings | `demo_settings` migration applied; GET/PUT APIs verified |
| Supabase Realtime | Browser subscription implemented; two-window behavior manually observed |
| Call inbox | Search, status filter, priority sorting and detail drawer |
| Callback status/notes | Typed PATCH API and UI update behavior |
| Clinic settings | Name, address, hours, holiday, languages and FAQ answers |
| Analytics | Capture, callback, appointment and intent totals calculated from records |
| Demo integrity | Fictional records and explicit no-live-line disclosure |
| Security headers | CSP, nosniff, referrer and permissions headers |
| Cache recovery | `predev` clears stale `.next` before development |

## 3. Working only partially

| Capability | Working portion | Remaining limitation |
|---|---|---|
| English/Hindi/Marathi | Detection and some consent/templates | Not complete live voice or end-to-end translation |
| Mobile responsiveness | Basic Tailwind layout and test-call modal | No automated mobile visual sign-off |
| FAQ quality | Editable questions and answers | Clinic approval and test coverage are required |
| Callback status | UI/API updates | No staff identity or status-change audit history |
| Appointment management | Confirm/decline | No calendar or dentist availability source |
| Patient validation | 10-digit Indian mobile extraction | Name validation is not a dedicated verified field contract |
| Analytics | Current-record calculations | No real clinic baseline or date-range trend validation |
| Supabase Realtime | Implemented and manually observed | Concurrency/conflict behavior needs production testing |
| ₹5,000 model | Planning assumptions documented | No confirmed provider invoice or spend alerts |

## 4. Not implemented

| Capability | Status |
|---|---|
| Real inbound telephone number | Missing |
| Missed-call forwarding | Missing |
| Voice recognition/speech output | Missing |
| Authentication | Missing |
| Clinic staff accounts | Missing |
| Clinic-level Supabase RLS | Missing |
| Patient consent/retention/deletion policy | Missing |
| Dentist calendar | Missing |
| Real availability | Missing |
| WhatsApp | Missing |
| SMS/email | Missing |
| Live notification provider | Missing |
| Provider voice webhook integration | Missing |
| Production audit log | Missing |
| Production concurrency control | Missing |

## 5. Verified validation

- `npm test`: 5 tests passed.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `npm audit --omit=dev`: 0 production vulnerabilities.
- `/api/health`: HTTP 200.
- `/api/enquiries`: HTTP 200 with Supabase persistence.
- `/api/settings`: HTTP 200.
- `/api/settings` PUT: HTTP 200.
- `/api/enquiries/[id]` PATCH: HTTP 200.
- Invalid status PATCH: HTTP 422.
- Groq assistant: HTTP 200 with `source=groq`.
- Invalid enquiry payload: HTTP 422.
- Duplicate webhook event: duplicate response verified.
- Supabase settings migration: applied successfully.

## 6. UI and environment issues

### Marquee

The moving marquee was deliberately removed. It is not useful in an operations dashboard and can create motion, accessibility and browser/CSP concerns.

It was replaced by a static demo-status rail showing:

- demo workspace
- browser-simulated calls
- fictional patients
- no live phone line

### Cloud fallback banner

The fallback banner means the browser could not complete a cloud/settings/enquiry load at that moment.

The live API is currently returning HTTP 200 and Supabase persistence is active. The client now preserves cached rows and only uses cached or fictional data when cloud loading fails.

### CSP/eval warning

ClinicRelay source contains no application `eval()` and no marquee.

Browser warnings may come from extensions or development tooling, including:

- MetaMask
- React or Redux tools
- debugging extensions
- extension-injected scripts

ClinicRelay sends `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`.
Development permits `unsafe-eval` only for Next.js HMR. Production excludes `unsafe-eval`.

## 7. Senior-engineering recommendations

1. Replace whole-array synchronization with conflict-safe typed mutations.
2. Add authentication and clinic/tenant RLS before storing real patient information.
3. Normalize Supabase tables instead of storing complete enquiry objects only as JSON.
4. Add immutable audit events for status, confirmation and consent changes.
5. Add provider webhook signature verification and replay protection.
6. Add notification consent and approved templates before SMS/WhatsApp/email.
7. Add live voice provider and speech testing for Indian languages.
8. Add dentist calendar access while retaining human approval.
9. Add mobile viewport, keyboard and screen-reader automated tests.
10. Pilot against real call logs before relying on the 30% claim or projected savings.

## 8. What the 48-hour prototype proves

It proves that:

- after-hours enquiries can become a structured queue;
- callback consent can be explicit;
- urgent cases can be prioritized;
- staff can review and confirm appointment requests;
- data can persist in a cloud demo;
- Groq can improve conversational replies while rules remain safe.

It does not prove:

- real phone call recovery;
- real call volume;
- real booking conversion;
- real speech recognition;
- an actual ₹5,000 monthly cost;
- production privacy/compliance;
- calendar availability;
- real clinic revenue impact.

## 9. Next recommended pilot

1. One test phone number.
2. Missed-call forwarding or voice provider.
3. Caller ID and signed call event.
4. One clinic staff account.
5. Supabase tenant/RLS isolation.
6. Human callback queue.
7. No autonomous appointment confirmation.
8. WhatsApp/SMS only after consent and approved templates.
9. Measure eligible calls, captured calls, callbacks and confirmed visits.
