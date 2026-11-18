import fs from "node:fs/promises";
import path from "node:path";

const file = path.join(process.cwd(), ".data", "telephony-events.json");

async function readIds(): Promise<string[]> {
  try { return JSON.parse(await fs.readFile(file, "utf8")) as string[]; }
  catch { return []; }
}

export async function hasProcessedEvent(eventId: string) {
  return (await readIds()).includes(eventId);
}

export async function recordProcessedEvent(eventId: string) {
  const ids = await readIds();
  if (!ids.includes(eventId)) {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify([...ids.slice(-999), eventId], null, 2), "utf8");
  }
}
