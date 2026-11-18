import type { Enquiry, Intent, Language, Msg, Settings, Status } from "@/lib/data";

const intents: Intent[] = ["appointment", "reschedule", "timings", "location", "urgent", "general"];
const statuses: Status[] = ["New", "Callback pending", "Contacted", "Booked", "Closed"];
const languages: Language[] = ["English", "Hindi", "Marathi"];

const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export function normalizeEnquiry(input: unknown): Enquiry | null {
  if (!input || typeof input !== "object") return null;
  const row = input as Partial<Enquiry>;
  if (!text(row.id, 100) || !intents.includes(row.intent as Intent) || !statuses.includes(row.status as Status)) return null;
  const phone = text(row.phone, 20);
  if (phone && !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").slice(-10))) return null;
  return {
    id: text(row.id, 100), name: text(row.name, 80), phone, intent: row.intent as Intent,
    priority: row.priority === "High" ? "High" : "Normal", status: row.status as Status,
    service: text(row.service, 100), prefDate: text(row.prefDate, 80), prefTime: text(row.prefTime, 80),
    at: typeof row.at === "string" && !Number.isNaN(Date.parse(row.at)) ? row.at : new Date().toISOString(),
    duration: typeof row.duration === "number" && Number.isFinite(row.duration) && row.duration >= 0 ? Math.min(row.duration, 86400) : 0,
    summary: text(row.summary, 500), transcript: Array.isArray(row.transcript) ? row.transcript
      .filter((message): message is Msg => Boolean(message && typeof message === "object" && (message.role === "ai" || message.role === "patient") && typeof message.text === "string"))
      .slice(0, 100).map((message) => ({ role: message.role, text: message.text.slice(0, 1000) })) : [],
    notes: text(row.notes, 1000), appt: row.appt === "Confirmed" || row.appt === "Declined" || row.appt === "Pending confirmation" ? row.appt : "",
    source: text(row.source, 80), callbackConsent: typeof row.callbackConsent === "boolean" ? row.callbackConsent : null,
    language: languages.includes(row.language as Language) ? row.language as Language : "English"
  };
}

export function normalizeSettings(input: unknown): Settings | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Partial<Settings>;
  const name = text(value.name, 120), address = text(value.address, 240);
  if (!name || !address || !/^\d{2}:\d{2}$/.test(text(value.open, 5)) || !/^\d{2}:\d{2}$/.test(text(value.close, 5)) || !text(value.weeklyOff, 20)) return null;
  return {
    name, address, open: text(value.open, 5), close: text(value.close, 5), weeklyOff: text(value.weeklyOff, 20),
    languages: Array.isArray(value.languages) ? value.languages.filter((item): item is Language => languages.includes(item as Language)) : ["English"],
    faqs: Array.isArray(value.faqs) ? value.faqs.filter((faq) => faq && typeof faq === "object" && typeof faq.id === "string" && typeof faq.question === "string" && typeof faq.answer === "string")
      .slice(0, 20).map((faq) => ({ id: faq.id.slice(0, 80), question: faq.question.slice(0, 200), answer: faq.answer.slice(0, 600) })) : []
  };
}
