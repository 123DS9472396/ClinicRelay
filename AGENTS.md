# ClinicRelay coding instructions

## Product boundary

Keep the product professional, restrained, and original. Do not copy another product's branding or visual layout. Preserve the explicit demo-mode disclosure and use fictional patient data in examples.

## Engineering rules

- Use TypeScript and existing Next.js App Router patterns.
- Keep receptionist replies within approved templates; never invent medical advice, pricing, availability, or confirmed bookings.
- Treat appointment records as requests until a clinic user confirms them.
- Keep external AI providers optional. The no-key rule engine must remain usable.
- Validate webhook payloads and return explicit HTTP errors for invalid input.
- Do not add secrets to the repository. Use `.env.local` locally and platform environment variables in deployment.
- Run `npm test` and `npm run build` before handoff.

## Useful commands

```powershell
npm install
npm run dev
npm test
npm run build
node scripts/simulate-telephony.mjs
```
