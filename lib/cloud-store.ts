import type { Enquiry } from "@/lib/data";

const url = () => process.env.SUPABASE_URL?.replace(/\/$/, "");
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

export const cloudPersistenceEnabled = () => Boolean(url() && key());

async function request(path: string, init?: RequestInit) {
  const base = url();
  const token = key();
  if (!base || !token) throw new Error("Supabase persistence is not configured");
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: token,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Supabase request failed with ${response.status}`);
  return response;
}

export async function readCloudEnquiries(): Promise<Enquiry[]> {
  const response = await request("demo_enquiries?select=payload&order=updated_at.desc");
  const rows = await response.json() as { payload: Enquiry }[];
  return rows.map((row) => row.payload);
}

export async function writeCloudEnquiries(rows: Enquiry[]): Promise<Enquiry[]> {
  const payload = rows.map((row) => ({ id: row.id, payload: row }));
  if (payload.length) {
    await request("demo_enquiries?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(payload)
    });
  }
  return rows;
}
