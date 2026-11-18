import test from "node:test";
import assert from "node:assert/strict";

const required = ["eventId", "callId", "from", "to", "transcript"];
function normalize(input) {
  for (const field of required) {
    if (typeof input[field] !== "string" || !input[field].trim()) throw new Error(`Missing telephony field: ${field}`);
  }
  return { ...input, provider: (input.provider || "simulator").trim(), transcript: input.transcript.trim().slice(0, 5000), occurredAt: input.occurredAt || "generated" };
}

test("normalizes a valid telephony event", () => {
  const event = normalize({ eventId: "evt-1", callId: "call-1", from: "+919820012345", to: "+912212345678", transcript: "  hello  " });
  assert.equal(event.provider, "simulator");
  assert.equal(event.transcript, "hello");
});

test("rejects incomplete telephony events", () => {
  assert.throws(() => normalize({ eventId: "evt-1" }), /Missing telephony field: callId/);
});
