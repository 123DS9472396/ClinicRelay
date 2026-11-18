import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { normalizeTelephonyEvent } from "@/lib/telephony";
import { hasProcessedEvent, recordProcessedEvent } from "@/lib/telephony-store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const secret = process.env.TELEPHONY_WEBHOOK_SECRET;
    if (secret) {
      const signature = req.headers.get("x-clinicrelay-signature") || "";
      const expected = `sha256=${crypto.createHmac("sha256", secret).update(raw).digest("hex")}`;
      if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return NextResponse.json({ ok: false, error: "Invalid webhook signature." }, { status: 401 });
      }
    }
    const event = normalizeTelephonyEvent(JSON.parse(raw));
    if (await hasProcessedEvent(event.eventId)) {
      return NextResponse.json({ ok: true, accepted: true, duplicate: true, eventId: event.eventId });
    }
    await recordProcessedEvent(event.eventId);
    return NextResponse.json({
      ok: true,
      accepted: true,
      event,
      contract: "clinicrelay.telephony.v1",
      message: "Webhook accepted for demo processing. Production deployments should persist this event and enqueue a callback."
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Invalid webhook payload" }, { status: 400 });
  }
}
