import fs from "node:fs/promises";
import path from "node:path";
import type { Enquiry } from "@/lib/data";
import { seed } from "@/lib/data";

const file = path.join(process.cwd(), ".data", "enquiries.json");

async function ensureFile() {
  try {
    await fs.access(file);
  } catch {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(seed(), null, 2), "utf8");
  }
}

export async function readEnquiries(): Promise<Enquiry[]> {
  await ensureFile();
  return JSON.parse(await fs.readFile(file, "utf8")) as Enquiry[];
}

export async function writeEnquiries(rows: Enquiry[]) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(rows, null, 2), "utf8");
  return rows;
}
