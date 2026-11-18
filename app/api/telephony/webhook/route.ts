import { NextResponse } from "next/server";
import { normalizeTelephonyEvent } from "@/lib/telephony";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const event = normalizeTelephonyEvent(await req.json());
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
