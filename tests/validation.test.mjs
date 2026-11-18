import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEnquiry, normalizeSettings } from "../lib/validation.ts";

test("accepts a valid consent-gated enquiry", () => {
  const row = normalizeEnquiry({
    id: "test-1",
    name: "Raj Sonar",
    phone: "8689859822",
    intent: "reschedule",
    priority: "Normal",
    status: "New",
    service: "",
    prefDate: "Friday",
    prefTime: "6:00 PM",
    at: "2026-11-18T12:00:00.000Z",
    duration: 120,
    summary: "Wants to reschedule.",
    transcript: [],
    notes: "",
    appt: "Pending confirmation",
    source: "Simulated call",
    callbackConsent: true,
    language: "English"
  });
  assert.ok(row);
  assert.equal(row.callbackConsent, true);
});

test("rejects an invalid phone number in an enquiry", () => {
  assert.equal(normalizeEnquiry({
    id: "test-2",
    intent: "general",
    status: "New",
    phone: "123",
    at: "2026-11-18T12:00:00.000Z"
  }), null);
});

test("normalizes valid clinic settings", () => {
  const settings = normalizeSettings({
    name: "Smile Dental Clinic",
    address: "Thane",
    open: "10:00",
    close: "20:00",
    weeklyOff: "Sunday",
    languages: ["English", "Hindi"],
    faqs: [{ id: "faq-1", question: "Timings?", answer: "10 AM to 8 PM." }]
  });
  assert.ok(settings);
  assert.deepEqual(settings.languages, ["English", "Hindi"]);
});
