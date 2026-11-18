import { NextResponse } from "next/server";
import type { Enquiry, Status } from "@/lib/data";
import { STATUSES } from "@/lib/data";
import { normalizeEnquiry } from "@/lib/validation";
import { readEnquiries, writeEnquiries } from "@/lib/local-store";
import { cloudPersistenceEnabled, readCloudEnquiries, patchCloudEnquiry, writeCloudEnquiries } from "@/lib/cloud-store";

export const runtime = "nodejs";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  let patch: unknown;
  try { patch = await req.json(); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  if (!patch || typeof patch !== "object") return NextResponse.json({ error: "Expected a JSON object." }, { status: 400 });
  const input = patch as Partial<Enquiry>;
  if (input.status && !STATUSES.includes(input.status as Status)) return NextResponse.json({ error: "Invalid enquiry status." }, { status: 422 });
  if (input.appt && !["", "Pending confirmation", "Confirmed", "Declined"].includes(input.appt)) return NextResponse.json({ error: "Invalid appointment state." }, { status: 422 });
  if (input.notes !== undefined && typeof input.notes !== "string") return NextResponse.json({ error: "Notes must be text." }, { status: 422 });
  const allowed: Partial<Enquiry> = {};
  if (input.status) allowed.status = input.status;
  if (input.notes !== undefined) allowed.notes = input.notes.slice(0, 1000);
  if (input.appt !== undefined) allowed.appt = input.appt;

  try {
    if (cloudPersistenceEnabled()) {
      const updated = normalizeEnquiry(await patchCloudEnquiry(id, allowed));
      if (!updated) return NextResponse.json({ error: "Updated enquiry is invalid." }, { status: 422 });
      return NextResponse.json({ ok: true, row: updated, persistence: "supabase" });
    }
    const rows = await readEnquiries();
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
    const updated = normalizeEnquiry({ ...rows[index], ...allowed });
    if (!updated) return NextResponse.json({ error: "Updated enquiry is invalid." }, { status: 422 });
    const next = [...rows];
    next[index] = updated;
    await writeEnquiries(next);
    return NextResponse.json({ ok: true, row: updated, persistence: "local-json" });
  } catch (error) {
    console.error("Could not patch enquiry", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Could not update enquiry." }, { status: 502 });
  }
}
