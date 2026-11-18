import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTelephonyEvent } from "../lib/telephony.ts";

test("normalizes a valid telephony event", () => {
  const event = normalizeTelephonyEvent({ eventId: "evt-1", callId: "call-1", from: "+919820012345", to: "+912212345678", transcript: "  hello  " });
  assert.equal(event.provider, "simulator");
  assert.equal(event.transcript, "hello");
});

test("rejects incomplete telephony events", () => {
  assert.throws(() => normalizeTelephonyEvent({ eventId: "evt-1" }), /Missing telephony field: callId/);
});
