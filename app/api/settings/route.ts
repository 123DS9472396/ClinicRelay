import { NextResponse } from "next/server";
import { defaultSettings } from "@/lib/data";
import { normalizeSettings } from "@/lib/validation";
import { cloudPersistenceEnabled, readCloudSettings, writeCloudSettings } from "@/lib/cloud-store";

export const runtime = "nodejs";

export async function GET() {
  if (!cloudPersistenceEnabled()) return NextResponse.json({ settings: defaultSettings, persistence: "local-json" });
  const settings = await readCloudSettings(defaultSettings);
  return NextResponse.json({ settings: normalizeSettings(settings) || defaultSettings, persistence: "supabase" });
}

export async function PUT(req: Request) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const settings = normalizeSettings(body);
  if (!settings) return NextResponse.json({ error: "Clinic settings are invalid." }, { status: 422 });
  if (!cloudPersistenceEnabled()) return NextResponse.json({ ok: true, settings, persistence: "local-json" });
  try {
    await writeCloudSettings(settings);
    return NextResponse.json({ ok: true, settings, persistence: "supabase" });
  } catch (error) {
    console.error("Could not persist clinic settings", error);
    return NextResponse.json({ ok: false, error: "Clinic settings could not be saved." }, { status: 502 });
  }
}
