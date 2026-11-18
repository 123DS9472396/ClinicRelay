import { NextResponse } from "next/server";
import type { Intent, Msg, Settings } from "@/lib/data";
export const runtime = "nodejs";
type D = { intent: Intent; name: string; phone: string; service: string; prefDate: string; prefTime: string };
type ModelData = Partial<D> & { reply?: string };
const INTENTS = ["appointment", "reschedule", "timings", "location", "urgent", "general"];
const SERVICES: [RegExp, string][] = [[/clean|scaling/i, "Dental cleaning"], [/root canal/i, "Root canal"], [/brace|aligner/i, "Braces consultation"], [/whiten|bleach/i, "Teeth whitening"], [/check.?up|exam/i, "Check-up"], [/extract|pull.*tooth/i, "Extraction"], [/consult/i, "Consultation"]];
const h12 = (s: string) => { const [h, m] = s.split(":").map(Number); return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
const SYSTEM_PROMPT = "You are a careful after-hours dental receptionist. Extract fields and write a short reply. Return JSON only with keys: intent (appointment|reschedule|timings|location|urgent|general), name, phone (10-digit Indian mobile or empty), service, prefDate, prefTime, reply. Use an empty string when not stated. Never guess. urgent means pain, swelling, bleeding, or a broken or knocked-out tooth. The reply must ask for the next missing detail when needed. Never diagnose, give medical advice, invent prices or availability, or claim an appointment is confirmed. Appointment requests must remain requests until the clinic confirms them.";
const cleanModelData = (o: Record<string, unknown>): ModelData => {
  const s = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 60) : "");
  const reply = typeof o.reply === "string" ? o.reply.trim().slice(0, 500) : "";
  return { intent: INTENTS.includes(String(o.intent)) ? o.intent as Intent : undefined, name: s(o.name), phone: /^[6-9]\d{9}$/.test(s(o.phone)) ? s(o.phone) : "", service: s(o.service), prefDate: s(o.prefDate), prefTime: s(o.prefTime), reply };
};

function rules(patient: string[], lastAi: string): D {
  const t = patient.join(" . ");
  const digits = t.replace(/(\d)[\s-](?=\d)/g, "$1");
  const phone = (digits.match(/(?:\+?91)?([6-9]\d{9})(?!\d)/) || [])[1] || "";
  let name = (t.match(/(?:my name is|i am|i'm|this is|name's)\s+([A-Za-z]{2,}(?:\s[A-Za-z]{2,})?)/i) || [])[1] || "";
  const last = patient[patient.length - 1] || "";
  if (!name && /your name/i.test(lastAi) && /^[A-Za-z .]{2,40}$/.test(last.trim())) name = last.trim().replace(/^(it's|its)\s+/i, "");
  const intent: Intent = /pain|swell|bleed|emergency|urgent|broken|knocked|fever/i.test(t) ? "urgent"
    : /reschedul|postpone|move my|change my appointment|cancel/i.test(t) ? "reschedule"
    : /book|appointment|cleaning|check.?up|root canal|braces|whiten|consult|slot/i.test(t) ? "appointment"
    : /timing|open|close|hours|what time/i.test(t) ? "timings"
    : /where|address|location|direction|how to reach/i.test(t) ? "location" : "general";
  const service = SERVICES.find(([r]) => r.test(t))?.[1] || "";
  const prefDate = (t.match(/\b(today|tomorrow|day after tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|\d{1,2}[\/-]\d{1,2})\b/i) || [])[1] || "";
  const tm = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  const prefTime = tm ? `${tm[1]}:${tm[2] || "00"} ${tm[3].toUpperCase()}` : (t.match(/\b(morning|afternoon|evening)\b/i) || [])[1] || "";
  return { intent, name, phone, service, prefDate, prefTime };
}

async function groq(patient: string[]): Promise<ModelData | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: patient.join("\n") }],
        response_format: { type: "json_object" }, temperature: 0
      }) });
    const o = JSON.parse((await r.json()).choices[0].message.content);
    return cleanModelData(o);
  } catch { return null; }
}

async function ollama(patient: string[]): Promise<ModelData | null> {
  if (process.env.OLLAMA_ENABLED === "false") return null;
  try {
    const r = await fetch(`${process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"}/api/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(5000),
      body: JSON.stringify({ model: process.env.OLLAMA_MODEL || "qwen3.5:9b", stream: false, format: "json", messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: patient.join("\n") }] })
    });
    if (!r.ok) return null;
    const body = await r.json() as { message?: { content?: string } };
    return body.message?.content ? cleanModelData(JSON.parse(body.message.content)) : null;
  } catch { return null; }
}

async function gemini(patient: string[]): Promise<ModelData | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.0-flash"}:generateContent?key=${key}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: patient.join("\n") }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0 } }) });
    const o = JSON.parse((await r.json()).candidates[0].content.parts[0].text);
    return cleanModelData(o);
  } catch { return null; }
}

export async function POST(req: Request) {
  const { messages, cfg } = (await req.json()) as { messages: Msg[]; cfg: Settings };
  const patient = messages.filter((m) => m.role === "patient").map((m) => m.text.slice(0, 500));
  const lastAi = [...messages].reverse().find((m) => m.role === "ai")?.text || "";
  const base = rules(patient, lastAi);
  const localData = await ollama(patient);
  const groqData = localData ? null : await groq(patient);
  const geminiData = localData || groqData ? null : await gemini(patient);
  const ai = localData || groqData || geminiData;
  const d: D = { ...base };
  if (ai) { for (const k of Object.keys(ai) as (keyof D)[]) if (ai[k]) (d as Record<string, string>)[k] = ai[k] as string; if (base.intent === "urgent") d.intent = "urgent"; }
  const { intent } = d;
  const opens = h12(cfg.open);
  const lastText = patient[patient.length - 1] || "";
  const source = localData ? "ollama" : groqData ? "groq" : geminiData ? "gemini" : "rules";
  const generatedReply = typeof ai?.reply === "string" && ai.reply.length > 0
    && !/(confirmed|available|availability|price|cost|diagnos|prescri|take medicine)/i.test(ai.reply)
    ? ai.reply : "";
  const ask = (reply: string) => NextResponse.json({ reply, done: false, data: d, source });
  const done = (reply: string) => {
    const bits = [d.service && `wants ${d.service.toLowerCase()}`, d.prefDate && `on ${d.prefDate}`, d.prefTime && `around ${d.prefTime}`].filter(Boolean).join(" ");
    const summary = { appointment: `${d.name || "Caller"} ${bits || "asked for an appointment"}.`, reschedule: `${d.name || "Caller"} wants to reschedule ${bits}`.trim() + ".", urgent: `Urgent: ${lastText.slice(0, 120)}`, timings: "Asked for clinic timings.", location: "Asked for the clinic address.", general: `General enquiry: ${patient[0]?.slice(0, 100) || ""}` }[intent];
    return NextResponse.json({ reply, done: true, data: d, summary, source });
  };
  if (intent === "timings") return done(`We are open ${h12(cfg.open)} to ${h12(cfg.close)}, closed on ${cfg.weeklyOff}. Would you like to leave an appointment request?`);
  if (intent === "location") return done(`${cfg.name} is at ${cfg.address}. Would you like to leave an appointment request?`);
  if (intent === "general" && patient.length < 2) return ask(generatedReply || "I can note an appointment request, help with a reschedule, or share our timings and address. What would you like?");
  const needsWhen = intent === "appointment" || intent === "reschedule";
  if (intent !== "urgent" && !d.name) return ask("May I know your name?");
  if (needsWhen && !d.prefDate && !d.prefTime) return ask("What date and time would suit you best?");
  if (!d.phone) return ask(lastText.replace(/\D/g, "").length >= 6 ? "That doesn't look like a valid 10-digit mobile number. Could you share it again?" : "May I have your 10-digit mobile number so our receptionist can call you back?");
  if (intent === "urgent") return done(`I'm sorry you're in discomfort. I can't give medical advice, but I've marked this as urgent so the team calls you first when the clinic opens at ${opens}. If you have heavy bleeding, trouble breathing or swallowing, or a head injury, please go to the nearest emergency room now.`);
  if (needsWhen) return done(generatedReply || `Thank you${d.name ? ", " + d.name : ""}. I've recorded your request${d.service ? " for " + d.service.toLowerCase() : ""}${d.prefDate ? " on " + d.prefDate : ""}${d.prefTime ? " around " + d.prefTime : ""}. This is a request, not a confirmed booking. Our receptionist will call you after ${opens} to confirm availability.`);
  return done(generatedReply || `Thank you, ${d.name}. I've noted your message and our receptionist will call you after ${opens}.`);
}
