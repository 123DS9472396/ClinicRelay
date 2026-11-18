import type { Enquiry } from "@/lib/data";

const url = () => process.env.SUPABASE_URL?.replace(/\/$/, "");
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

export const cloudPersistenceEnabled = () => Boolean(url() && key());

async function request(path: string, init?: RequestInit) {
  const base = url();
  const token = key();
  if (!base || !token) throw new Error("Supabase persistence is not configured");
  for (let attempt = 0; attempt < 2; attempt += 1) {
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
    if (response.ok) return response;
    if (response.status < 500 || attempt === 1) {
      const detail = (await response.text()).replace(/\s+/g, " ").slice(0, 240);
      throw new Error(`Supabase request failed with ${response.status}${detail ? `: ${detail}` : ""}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Supabase request failed after retry.");
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

export async function patchCloudEnquiry(id: string, patch: Partial<Enquiry>): Promise<Enquiry> {
  const rows = await readCloudEnquiries();
  const current = rows.find((row) => row.id === id);
  if (!current) throw new Error("Enquiry not found");
  const updated = { ...current, ...patch };
  await request("demo_enquiries?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ id, payload: updated }])
  });
  return updated;
}

export async function readCloudSettings<T>(fallback: T): Promise<T> {
  try {
    const response = await request("demo_settings?select=payload&limit=1");
    const rows = await response.json() as { payload: T }[];
    return rows[0]?.payload || fallback;
  } catch {
    return fallback;
  }
}

export async function writeCloudSettings<T>(settings: T): Promise<T> {
  await request("demo_settings?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ id: "clinic-default", payload: settings }])
  });
  return settings;
}
