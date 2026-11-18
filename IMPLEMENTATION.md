# ClinicRelay implementation note

## What is delivered

ClinicRelay is a responsive after-hours dental enquiry dashboard. It includes a call inbox with search and status filters, appointment request review, callback notes, analytics, clinic settings, fictional seed data, and a simulated receptionist conversation.

The browser demo persists settings in `localStorage` and enquiries through `GET/POST /api/enquiries`, which writes a local `.data/enquiries.json` store during development. The production database shape is documented in `supabase/schema.sql`.

## AI and safety

The server route extracts structured fields and uses approved response templates. It does not invent prices, availability, diagnoses, or confirmed bookings. Ollama/Qwen is attempted first when the local Ollama server is available, followed by optional Groq, Gemini, and the deterministic rule engine. `OLLAMA_MODEL`, `GROQ_MODEL`, and `GEMINI_MODEL` are configurable.

## Telephony boundary

`POST /api/telephony/webhook` implements the `clinicrelay.telephony.v1` acknowledgement contract. `scripts/simulate-telephony.mjs` sends a realistic provider event. The endpoint is intentionally a demo boundary: production work would verify provider signatures, persist events, enqueue callbacks, and connect a real telephony provider.

## Run and verify

Use Node.js 20+, then run `npm install`, `npm run dev`, `npm test`, and `npm run build`. Deploy by importing the project into Vercel and configuring the optional environment variables.

## Design principles

The product uses an original editorial SaaS identity rather than copying another product. The UI keeps the workflow visible: patient enquiry -> structured capture -> clinic callback. Fictional data and the simulated-call boundary are always disclosed.
