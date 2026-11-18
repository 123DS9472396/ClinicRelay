import { NextResponse } from "next/server";
import { defaultSettings, type Intent, type Language, type Msg, type Settings } from "@/lib/data";
import { normalizeSettings } from "@/lib/validation";

export const runtime = "nodejs";

type D = {
  intent: Intent;
  name: string;
  phone: string;
  service: string;
  prefDate: string;
  prefTime: string;
  callbackConsent: boolean | null;
  language: Language;
};

type ModelData = Partial<D> & { reply?: string };

const INTENTS: Intent[] = ["appointment", "reschedule", "timings", "location", "urgent", "general"];

const SERVICES: [RegExp, string][] = [
  [/clean|scaling|polish/i, "Dental cleaning"],
  [/root canal|\brct\b/i, "Root canal"],
  [/brace|aligner|invisalign/i, "Braces consultation"],
  [/whiten|bleach/i, "Teeth whitening"],
  [/check.?up|exam|consult/i, "Check-up"],
  [/extract|pull.*tooth|wisdom/i, "Extraction"],
  [/filling|cavity/i, "Filling"],
  [/implant/i, "Implant"],
];

const h12 = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

function getSystemPrompt(cfg: Settings): string {
  return `You are the virtual after-hours receptionist for ${cfg.name}.
Clinic Timings: ${h12(cfg.open)} to ${h12(cfg.close)}, closed on ${cfg.weeklyOff}.
Clinic Address: ${cfg.address}.

Follow these strict clinical receptionist instructions:
1. Match the caller's language (English, Hindi, or Marathi). If they write in Hinglish (e.g. "muje appointment book karna hai"), reply in clear, polite Hindi or Hinglish.
2. If they have not stated their name, or wrote an incomplete phrase like "mera name hai" or "my name is", politely ask them for their actual full name.
3. If they want an appointment or reschedule, ask what dental service they need and their preferred date/time.
4. Ask for their 10-digit Indian mobile number for a callback.
5. Ask for callback consent ("Can our receptionist call you on this number to confirm availability?").
6. CRITICAL SAFETY GUARDRAIL: Never diagnose diseases, never suggest medicines/painkillers. If acute pain or swelling is reported, flag intent as "urgent", give emergency advice (visit nearest hospital ER if severe), and offer a priority callback.
7. CRITICAL BOOKING GUARDRAIL: Never claim an appointment is confirmed or promise chair availability. All requests remain requests awaiting clinic review.
8. You MUST respond with a JSON object with these EXACT keys:
{
  "intent": "appointment" | "reschedule" | "timings" | "location" | "urgent" | "general",
  "name": string | null,
  "phone": string | null,
  "service": string | null,
  "prefDate": string | null,
  "prefTime": string | null,
  "callbackConsent": boolean | null,
  "language": "English" | "Hindi" | "Marathi",
  "reply": string
}`;
}

const cleanModelData = (o: Record<string, unknown>): ModelData => {
  const s = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 80) : "");
  const reply = typeof o.reply === "string" ? o.reply.trim().slice(0, 600) : "";
  
  // Flexible intent mapping
  const rawIntent = String(o.intent || "").toLowerCase();
  let intent: Intent | undefined = undefined;
  if (rawIntent.includes("appointment") || rawIntent.includes("book")) intent = "appointment";
  else if (rawIntent.includes("resched")) intent = "reschedule";
  else if (rawIntent.includes("urgent") || rawIntent.includes("pain") || rawIntent.includes("emerg")) intent = "urgent";
  else if (rawIntent.includes("timing") || rawIntent.includes("hour")) intent = "timings";
  else if (rawIntent.includes("locat") || rawIntent.includes("address")) intent = "location";
  else if (rawIntent.includes("general")) intent = "general";

  // Name validation: avoid incomplete phrases
  let name = s(o.name);
  if (/^(mera naam|mera name|my name|naam|name|hai|is)$/i.test(name)) name = "";

  // Phone validation: 10-digit Indian mobile
  const digits = s(o.phone).replace(/\D/g, "");
  const phone = digits.length === 10 && /^[6-9]/.test(digits) ? digits : "";

  // Language mapping
  const rawLang = String(o.language || "").toLowerCase();
  const language: Language = rawLang.includes("marathi") ? "Marathi" : rawLang.includes("hindi") ? "Hindi" : "English";

  return {
    intent,
    name,
    phone,
    service: s(o.service),
    prefDate: s(o.prefDate),
    prefTime: s(o.prefTime),
    callbackConsent: typeof o.callbackConsent === "boolean" ? o.callbackConsent : null,
    language,
    reply,
  };
};

function rules(patient: string[], lastAi: string): D {
  const t = patient.join(" . ");
  const digits = t.replace(/(\d)[\s-](?=\d)/g, "$1");
  const phone = (digits.match(/(?:\+?91)?([6-9]\d{9})(?!\d)/) || [])[1] || "";
  
  let name = "";
  const nameMatch = t.match(/(?:my name is|i am|i'm|this is|mera naam hai|mera naam|mera name hai|mera name)\s+([A-Za-z\u0900-\u097f]{2,}(?:\s[A-Za-z\u0900-\u097f]{2,})?)/i);
  if (nameMatch) {
    const cand = nameMatch[1].trim();
    if (!/^(hai|is|a|an|the|nahi|not)$/i.test(cand)) name = cand;
  }
  
  const last = patient[patient.length - 1] || "";
  if (!name && /your name|अपना नाम|नाव/i.test(lastAi)) {
    const candidate = last.trim().replace(/^(it's|its|mera naam hai|mera naam|mera name hai|mera name|my name is|my name|naam)\s*/i, "").trim();
    if (candidate.length >= 2 && !/^(hai|is|name|naam|mera|my|the|a|an|nahi)$/i.test(candidate)) {
      name = candidate;
    }
  }

  const intent: Intent = /pain|swell|bleed|emergency|urgent|broken|knocked|fever|dard|sujan|दर्द|सूजन|सूज|वेदना/i.test(t)
    ? "urgent"
    : /reschedul|postpone|move my|change my appointment|cancel|बदल/i.test(t)
    ? "reschedule"
    : /book|appointment|cleaning|check.?up|root canal|braces|whiten|consult|slot|अपॉइंटमेंट|बुक/i.test(t)
    ? "appointment"
    : /timing|open|close|hours|what time|समय|वेळ|खुल/i.test(t)
    ? "timings"
    : /where|address|location|direction|how to reach|कहाँ|कहां|कुठे|पत्ता/i.test(t)
    ? "location"
    : "general";

  const service = SERVICES.find(([r]) => r.test(t))?.[1] || "";
  const prefDate = (t.match(/\b(today|tomorrow|day after tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|कल|आज|उद्या)\b/i) || [])[1] || "";
  const tm = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|बजे|वाजता)\b/i);
  const prefTime = tm ? `${tm[1]}:${tm[2] || "00"} ${tm[3].toUpperCase()}` : (t.match(/\b(morning|afternoon|evening|सुबह|शाम|संध्याकाळ)\b/i) || [])[1] || "";
  
  const consent = /^(yes|y|haan|haa|ha|हाँ|हां|हो|होय|theek|ok)$/i.test(last.trim())
    ? true
    : /^(no|n|nahi|nahin|नहीं|नाही|नको)$/i.test(last.trim())
    ? false
    : null;

  const isHindi = /[\u0900-\u097f]|karna|hai|mera|muje|aap|namaste|baje/i.test(t);
  const isMarathi = /[\u0900-\u097f]/.test(t) && /वेळ|आहे|नक्की|करा|होय|नाही/i.test(t);
  const language: Language = isMarathi ? "Marathi" : isHindi ? "Hindi" : "English";

  return { intent, name, phone, service, prefDate, prefTime, callbackConsent: consent, language };
}

async function groq(messages: Msg[], cfg: Settings): Promise<ModelData | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: getSystemPrompt(cfg) },
          ...messages.map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.text,
          })),
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });
    if (!r.ok) return null;
    const json = await r.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    return cleanModelData(JSON.parse(content));
  } catch {
    return null;
  }
}

async function ollama(messages: Msg[], cfg: Settings): Promise<ModelData | null> {
  if (process.env.OLLAMA_ENABLED === "false") return null;
  const timeoutMs = Math.min(Math.max(Number(process.env.OLLAMA_TIMEOUT_MS) || 12000, 1000), 30000);
  try {
    const r = await fetch(`${process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434"}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || "qwen3.5:9b",
        stream: false,
        format: "json",
        messages: [
          { role: "system", content: getSystemPrompt(cfg) },
          ...messages.map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.text,
          })),
        ],
      }),
    });
    if (!r.ok) return null;
    const body = (await r.json()) as { message?: { content?: string } };
    return body.message?.content ? cleanModelData(JSON.parse(body.message.content)) : null;
  } catch {
    return null;
  }
}

async function gemini(messages: Msg[], cfg: Settings): Promise<ModelData | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.0-flash"}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: getSystemPrompt(cfg) }] },
          contents: messages.map((m) => ({
            role: m.role === "ai" ? "model" : "user",
            parts: [{ text: m.text }],
          })),
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        }),
      }
    );
    if (!r.ok) return null;
    const json = await r.json();
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return null;
    return cleanModelData(JSON.parse(content));
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let input: { messages?: unknown; cfg?: unknown };
  try {
    input = (await req.json()) as { messages?: unknown; cfg?: unknown };
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!Array.isArray(input.messages) || input.messages.length > 100) {
    return NextResponse.json({ error: "messages must be an array with at most 100 items." }, { status: 422 });
  }

  const messages = input.messages.filter(
    (message): message is Msg =>
      Boolean(
        message &&
          typeof message === "object" &&
          (message.role === "ai" || message.role === "patient") &&
          typeof message.text === "string" &&
          message.text.length <= 1000
      )
  );

  if (messages.length !== input.messages.length) {
    return NextResponse.json({ error: "messages contains an invalid entry." }, { status: 422 });
  }

  const cfg: Settings = normalizeSettings(input.cfg) || defaultSettings;
  const patient = messages.filter((m) => m.role === "patient").map((m) => m.text.slice(0, 500));
  const lastAi = [...messages].reverse().find((m) => m.role === "ai")?.text || "";
  const lastText = patient[patient.length - 1] || "";

  // Base deterministic parsing
  const base = rules(patient, lastAi);

  // Invoke external LLM (Groq -> Gemini -> Ollama)
  const groqData = process.env.GROQ_API_KEY ? await groq(messages, cfg) : null;
  const geminiData = !groqData && process.env.GEMINI_API_KEY ? await gemini(messages, cfg) : null;
  const localData = !groqData && !geminiData ? await ollama(messages, cfg) : null;
  const ai = groqData || geminiData || localData;

  const d: D = { ...base };
  if (ai) {
    for (const k of ["intent", "name", "phone", "service", "prefDate", "prefTime", "callbackConsent", "language"] as const) {
      if (ai[k] !== undefined && ai[k] !== null && ai[k] !== "") {
        d[k] = ai[k] as never;
      }
    }
    // High-priority urgency guard
    if (base.intent === "urgent") d.intent = "urgent";
  }

  const { intent } = d;
  const opens = h12(cfg.open);
  const source = groqData ? "groq" : geminiData ? "gemini" : localData ? "ollama" : "rules";

  // Check generated reply for safety
  const generatedReply =
    typeof ai?.reply === "string" &&
    ai.reply.length > 0 &&
    !/(confirmed\b|booking is confirmed|available at|price is|cost is|prescri|take paracetamol|take ibuprofen)/i.test(ai.reply)
      ? ai.reply
      : "";

  const ask = (reply: string) => NextResponse.json({ reply, done: false, data: d, source });
  const done = (reply: string) => {
    const bits = [
      d.service && `wants ${d.service.toLowerCase()}`,
      d.prefDate && `on ${d.prefDate}`,
      d.prefTime && `around ${d.prefTime}`,
    ]
      .filter(Boolean)
      .join(" ");

    const summary = {
      appointment: `${d.name || "Caller"} ${bits || "asked for an appointment"}.`,
      reschedule: `${d.name || "Caller"} wants to reschedule ${bits}`.trim() + ".",
      urgent: `Urgent: ${lastText.slice(0, 120)}`,
      timings: "Asked for clinic timings.",
      location: "Asked for the clinic address.",
      general: `General enquiry: ${patient[0]?.slice(0, 100) || ""}`,
    }[intent];

    return NextResponse.json({ reply, done: true, data: d, summary, source });
  };

  // 1. FAQ & Info handlers
  if (intent === "timings") {
    return done(
      generatedReply ||
        `We are open ${h12(cfg.open)} to ${h12(cfg.close)}, closed on ${cfg.weeklyOff}. Would you like to leave an appointment request?`
    );
  }

  if (intent === "location") {
    return done(
      generatedReply || `${cfg.name} is located at ${cfg.address}. Would you like to leave an appointment request?`
    );
  }

  const faq = cfg.faqs.find((item) =>
    item.question
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3)
      .some((word) => lastText.toLowerCase().includes(word))
  );
  if (intent === "general" && faq) return done(faq.answer);

  // 2. Multilingual Fallback Prompts
  const lang = d.language;
  const promptName =
    lang === "Hindi"
      ? "कृपया अपना नाम बताइए।"
      : lang === "Marathi"
      ? "कृपया आपले नाव सांगा."
      : "May I know your name?";

  const promptWhen =
    lang === "Hindi"
      ? "आप किस दिन और समय पर आना चाहेंगे?"
      : lang === "Marathi"
      ? "तुम्हाला कोणत्या दिवशी आणि वेळी यायला आवडेल?"
      : "What date and time would suit you best?";

  const promptPhone =
    lang === "Hindi"
      ? "कृपया अपना 10 अंकों का मोबाइल नंबर बताएं ताकि हमारी टीम आपको कॉल कर सके।"
      : lang === "Marathi"
      ? "कृपया तुमचा 10 अंकी मोबाईल नंबर सांगा जेणेकरून आमची टीम तुम्हाला कॉल करू शकेल."
      : "May I have your 10-digit mobile number so our receptionist can call you back?";

  const promptConsent =
    lang === "Hindi"
      ? "क्या हमारी रिसेप्शनिस्ट इस नंबर पर कॉल करके अपॉइंटमेंट कन्फर्म कर सकती है? (हाँ / नहीं)"
      : lang === "Marathi"
      ? "आमची रिसेप्शनिस्ट या नंबरवर कॉल करू शकते का? (हो / नाही)"
      : "May we contact you on this number about your enquiry? Please reply yes or no.";

  // 3. Dialogue flow
  const needsWhen = intent === "appointment" || intent === "reschedule";

  // Step A: Name required (unless urgent issue)
  if (intent !== "urgent" && !d.name) {
    return ask(generatedReply || promptName);
  }

  // Step B: Timing preference required for appointments
  if (needsWhen && !d.prefDate && !d.prefTime) {
    return ask(generatedReply || promptWhen);
  }

  // Step C: Phone number required
  if (!d.phone) {
    return ask(generatedReply || promptPhone);
  }

  // Step D: Explicit callback consent
  if (d.callbackConsent === null) {
    return ask(generatedReply || promptConsent);
  }

  if (d.callbackConsent === false) {
    return done(
      lang === "Hindi"
        ? "धन्यवाद। मैंने दर्ज किया है कि आप कॉलबैक नहीं चाहते। कोई अपॉइंटमेंट बुक नहीं की गई है।"
        : lang === "Marathi"
        ? "धन्यवाद. तुम्हाला कॉलबॅक नको आहे हे नोंदवले आहे. कोणतीही अपॉइंटमेंट बुक केलेली नाही."
        : "Thank you. I have recorded that you do not want a callback. No appointment has been booked."
    );
  }

  // Step E: Urgent escalation
  if (intent === "urgent") {
    return done(
      generatedReply ||
        `I'm sorry you're in pain. I've flagged this for high-priority review when the clinic opens at ${opens}. If you have severe swelling, trouble breathing, or heavy bleeding, please visit the nearest hospital emergency room immediately.`
    );
  }

  // Step F: Complete appointment request
  if (needsWhen) {
    return done(
      generatedReply ||
        `Thank you${d.name ? ", " + d.name : ""}. I've recorded your appointment request. This is a request, not a confirmed booking. Our receptionist will call you after ${opens} to confirm availability.`
    );
  }

  return done(
    generatedReply ||
      `Thank you, ${d.name || "Patient"}. I've noted your message and our receptionist will call you after ${opens}.`
  );
}
