import { NextResponse } from "next/server";
import type { Enquiry } from "@/lib/data";
import { readEnquiries, writeEnquiries } from "@/lib/local-store";
import { cloudPersistenceEnabled, readCloudEnquiries, writeCloudEnquiries } from "@/lib/cloud-store";

export const runtime = "nodejs";

export async function GET() {
  const persistence = cloudPersistenceEnabled() ? "supabase" : "local-json";
  if (!cloudPersistenceEnabled()) return NextResponse.json({ rows: await readEnquiries(), persistence });
  const rows = await readCloudEnquiries();
  if (rows.length) return NextResponse.json({ rows, persistence });
  const seeded = (await import("@/lib/data")).seed();
  await writeCloudEnquiries(seeded);
  return NextResponse.json({ rows: seeded, persistence });
}

export async function POST(req: Request) {
  const body = await req.json() as { rows?: Enquiry[]; row?: Enquiry };
  const rows = body.rows || (body.row ? [...await readEnquiries(), body.row] : null);
  if (!Array.isArray(rows)) return NextResponse.json({ ok: false, error: "Expected rows or row" }, { status: 400 });
  const unique = [...new Map(rows.map((row) => [row.id, row])).values()];
  const persistence = cloudPersistenceEnabled() ? "supabase" : "local-json";
  if (cloudPersistenceEnabled()) await writeCloudEnquiries(unique);
  else await writeEnquiries(unique);
  return NextResponse.json({ ok: true, rows: unique, persistence });
}

export async function DELETE() {
  const rows = (await import("@/lib/data")).seed();
  const persistence = cloudPersistenceEnabled() ? "supabase" : "local-json";
  if (cloudPersistenceEnabled()) await writeCloudEnquiries(rows);
  else await writeEnquiries(rows);
  return NextResponse.json({ ok: true, rows, persistence });
}
