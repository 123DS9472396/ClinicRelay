# ClinicRelay

After-hours enquiry capture for a dental clinic. Calls are simulated in the browser; nothing here answers a real phone line.

## Run locally
1. Install Node.js 20 or newer.
2. `npm install`
3. Optional: copy `.env.example` to `.env.local`. If Ollama is running locally, ClinicRelay uses `qwen3.5:9b` by default; otherwise add a `GROQ_API_KEY` or `GEMINI_API_KEY`. Without any model available the assistant uses its built-in rule engine.
4. `npm run dev`, then open http://localhost:3000

## Deploy
### Recommended free demo: Vercel + Supabase

1. Revoke the Groq key if it has ever been pasted into chat, screenshots, commits, or logs. Create a replacement key in Groq.
2. Push this project to a private GitHub repository.
3. Import the repository into Vercel. `vercel.json` is included, but Next.js auto-detection is sufficient.
4. Add `GROQ_API_KEY`, `GROQ_MODEL=llama-3.1-8b-instant`, and `OLLAMA_ENABLED=false` under Vercel Project Settings > Environment Variables. Never commit `.env.local`. Ollama at `127.0.0.1` is only reachable from the local development machine.
5. Apply `supabase/schema.sql` to a free Supabase project.
6. Add `SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY` to Vercel/Render. The `/api/enquiries` route automatically uses Supabase when both are present and local JSON otherwise.
7. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable browser realtime updates. The dashboard subscribes to `demo_enquiries` changes and updates open inboxes without a refresh. The service-role key must never use a `NEXT_PUBLIC_` name.
8. Verify `https://your-domain.vercel.app/api/health` and `https://your-domain.vercel.app/api/enquiries`.

Vercel is the preferred demo host because it runs Next.js server routes without a sleeping web server. The included `render.yaml` provides a free Render alternative, but Render free services sleep after inactivity and their local filesystem is ephemeral, so local JSON must not be treated as production storage there.

### Free provider setup

The app does not require a paid model. Groq's compatible API can power the guarded receptionist when a valid key is configured. Ollama/Qwen remains available for local development. If no provider responds, the safe rules engine keeps the prototype usable.

## How it works
- The assistant follows a guarded workflow (name, preferred time, phone). Ollama/Qwen, Groq, or Gemini can extract fields and generate the next conversational reply when available; the response includes the active `source` (`ollama`, `groq`, `gemini`, or `rules`). Generated replies are rejected when they claim availability, confirmation, pricing, diagnosis, or medication advice, and approved templates remain the fallback.
- Appointments are saved as requests, never confirmed automatically.
- Records are persisted through the local JSON backend at `/.data/enquiries.json` during local development, with browser storage retained as a fallback. `supabase/schema.sql` is the production schema.

## Telephony contract

`POST /api/telephony/webhook` accepts `clinicrelay.telephony.v1` JSON:

```json
{
  "eventId": "evt-123",
  "provider": "twilio",
  "callId": "call-123",
  "from": "+919820012345",
  "to": "+912212345678",
  "transcript": "I need a cleaning appointment tomorrow evening.",
  "occurredAt": "2026-11-17T12:00:00.000Z"
}
```

Run the local simulator while the app is running:

```powershell
node scripts/simulate-telephony.mjs
```

This prototype acknowledges the event but does not claim to connect a real phone line or persist webhook events server-side.

## Troubleshooting a missing `.next` chunk

If Next.js reports `Cannot find module './<number>.js'` from `.next/server`, stop any duplicate dev servers and rebuild the generated cache:

```powershell
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object { $_.CommandLine -match 'clinicrelay|next dev' } |
  Select-Object ProcessId
Remove-Item -LiteralPath .\.next -Recurse -Force
npm run dev
```

The “Next.js is outdated” notice is separate from this cache error. It is a dependency-maintenance warning, not a reason for the missing chunk.

## Validation

```powershell
npm test
npm run build
npm run generate:pdf
```

See `IMPLEMENTATION.md`, `IMPLEMENTATION_NOTE.pdf`, `DEMO_SCRIPT.md`, and `AGENTS.md` for the handoff materials.

The local persistence API is `GET/POST /api/enquiries`; `DELETE /api/enquiries` resets fictional demo data.
