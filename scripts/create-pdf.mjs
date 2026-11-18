import fs from "node:fs";

const lines = [
  "ClinicRelay implementation note",
  "",
  "ClinicRelay is a responsive after-hours dental enquiry dashboard.",
  "It includes inbox search, appointment requests, callback notes,",
  "analytics, clinic settings, fictional seed data, and a simulated",
  "receptionist conversation.",
  "",
  "AI: Groq is optional, Gemini is a fallback, and the deterministic",
  "rule engine works without an API key. Replies use approved templates",
  "and never invent diagnoses, prices, availability, or confirmations.",
  "",
  "Telephony: POST /api/telephony/webhook accepts the",
  "clinicrelay.telephony.v1 contract. The local simulator is",
  "scripts/simulate-telephony.mjs. Real provider authentication,",
  "persistence, and phone routing remain production integration work.",
  "",
  "Verify with: npm test, npm run build, npm run dev",
];

const esc = (text) => text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
const stream = ["BT", "/F1 12 Tf", "72 760 Td", ...lines.map((line, i) => `${i ? "0 -18 Td" : ""} (${esc(line)}) Tj`), "ET"].join("\n");
const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
];
let pdf = "%PDF-1.4\n";
const offsets = [0];
for (let i = 0; i < objects.length; i++) {
  offsets.push(Buffer.byteLength(pdf));
  pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
}
const xref = Buffer.byteLength(pdf);
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (let i = 1; i < offsets.length; i++) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
fs.writeFileSync("IMPLEMENTATION_NOTE.pdf", pdf);
console.log("Wrote IMPLEMENTATION_NOTE.pdf");
