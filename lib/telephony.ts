export type TelephonyEvent = {
  eventId: string;
  provider: string;
  callId: string;
  from: string;
  to: string;
  transcript: string;
  occurredAt: string;
};

export type TelephonyInput = Partial<TelephonyEvent> & { type?: string };

export function normalizeTelephonyEvent(input: TelephonyInput): TelephonyEvent {
  const required = ["eventId", "callId", "from", "to", "transcript"] as const;
  for (const field of required) {
    if (typeof input[field] !== "string" || !input[field]?.trim()) throw new Error(`Missing telephony field: ${field}`);
  }
  return {
    eventId: input.eventId!.trim(),
    provider: (input.provider || "simulator").trim(),
    callId: input.callId!.trim(),
    from: input.from!.trim(),
    to: input.to!.trim(),
    transcript: input.transcript!.trim().slice(0, 5000),
    occurredAt: input.occurredAt || new Date().toISOString()
  };
}
