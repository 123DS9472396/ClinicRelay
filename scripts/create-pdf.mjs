import fs from "node:fs";

function generateSubmissionNotePdf() {
  const lines = [
    { text: "ClinicRelay: Recovering a Dental Clinic's After-Hours Calls", font: "F2", size: 14, dy: 0 },
    { text: "Dipesh Sharma · AI Implementation Strategist Intern Assessment · Submitted to SavedCalls (info@savedcalls.com)", font: "F1", size: 8.5, dy: -16 },
    { text: "", font: "F1", size: 8.5, dy: -6 },
    { text: "1. THE PROBLEM AS I READ IT", font: "F2", size: 10, dy: -14 },
    { text: "A Mumbai dental clinic loses ~30% of its calls outside operating hours. A patient calling at 9:45 PM with pain or looking for an", font: "F1", size: 8.5, dy: -12 },
    { text: "appointment who reaches a dead line will almost immediately call another nearby clinic. The owner is non-technical and has a strict", font: "F1", size: 8.5, dy: -11 },
    { text: "Rs 5,000/month operational budget. A human night receptionist costs 3x-4x that budget. The goal is simple: ensure no after-hours", font: "F1", size: 8.5, dy: -11 },
    { text: "call ends without the clinic capturing who called, what they needed, their callback consent, and their urgency level.", font: "F1", size: 8.5, dy: -11 },
    { text: "", font: "F1", size: 8.5, dy: -6 },
    { text: "2. WHAT I CHOSE AND BUILT", font: "F2", size: 10, dy: -14 },
    { text: "A hybrid solution: a virtual receptionist handles intake; a human staff member confirms availability and bookings.", font: "F1", size: 8.5, dy: -12 },
    { text: "• Controlled Virtual Receptionist: Conversational flow in English, Hindi & Marathi capturing intent, name, 10-digit mobile, and consent.", font: "F1", size: 8.5, dy: -11 },
    { text: "• Request Queue (No Auto-Bookings): Requests remain \"Pending confirmation\". The AI never promises slots without chair access.", font: "F1", size: 8.5, dy: -11 },
    { text: "• Urgent Safety Guardrails: Escalates swelling and acute pain to high priority; provides emergency advice; never diagnoses or quotes prices.", font: "F1", size: 8.5, dy: -11 },
    { text: "• Clinic Operations Desk: Searchable inbox, priority flags, callback queue, notes, analytics, and configurable clinic hours/FAQs.", font: "F1", size: 8.5, dy: -11 },
    { text: "• Safe Architecture: Deterministic rule engine (Rs 0 cost, 100% uptime) with optional Groq LLM. Zero crash dependency on external APIs.", font: "F1", size: 8.5, dy: -11 },
    { text: "", font: "F1", size: 8.5, dy: -6 },
    { text: "3. WHAT I REJECTED, AND WHY", font: "F2", size: 10, dy: -14 },
    { text: "• Website Chatbot Only: Fails to catch phone callers. Patients already calling while driving or in pain will not visit a website.", font: "F1", size: 8.5, dy: -12 },
    { text: "• Fully Autonomous AI Booking: Dangerous without live dental chair synchronization; leads to double-bookings and broken clinic trust.", font: "F1", size: 8.5, dy: -11 },
    { text: "• Unconstrained LLM Voice Agent: High risk of hallucinated dental pricing, unapproved promises, or unauthorized medical advice.", font: "F1", size: 8.5, dy: -11 },
    { text: "• Full Practice Management Suite: Unnecessary bloat that exceeds both the 48-hour prototype window and the Rs 5,000 budget.", font: "F1", size: 8.5, dy: -11 },
    { text: "• Human Night Shift / Call Center: Answering services in Mumbai cost Rs 15,000-Rs 25,000/month, far exceeding the budget.", font: "F1", size: 8.5, dy: -11 },
    { text: "", font: "F1", size: 8.5, dy: -6 },
    { text: "4. COST MODEL AGAINST Rs 5,000/MONTH BUDGET (ASSUMPTIONS)", font: "F2", size: 10, dy: -14 },
    { text: "Assuming 400 total calls/month -> ~120 after-hours calls (30%) -> ~300 talk minutes at 2.5 min/call:", font: "F1", size: 8.5, dy: -12 },
    { text: "• Virtual DID / Landline Number: Rs 299/mo | Telephony Inbound (Rs 5/min x 300 min): Rs 1,500/mo | AI Inference (Groq): ~Rs 150/mo", font: "F1", size: 8.5, dy: -11 },
    { text: "• GST (18% on voice/number): Rs 324/mo | Cloud DB & Webhooks (Supabase/Vercel free tier): Rs 0/mo", font: "F1", size: 8.5, dy: -11 },
    { text: "• Total Estimated Monthly Spend: ~Rs 2,273/mo (leaving a healthy ~Rs 2,727 buffer within the Rs 5,000 limit).", font: "F2", size: 8.5, dy: -11 },
    { text: "• Break-Even: At an average consultation fee of Rs 1,000-Rs 1,500, recovering just 2 appointments per month covers the entire system.", font: "F1", size: 8.5, dy: -11 },
    { text: "", font: "F1", size: 8.5, dy: -6 },
    { text: "5. RISKS AND LIMITS", font: "F2", size: 10, dy: -14 },
    { text: "• Simulated Boundary: The prototype runs locally in-browser with synthetic data; connecting live telephony requires telecom carrier onboarding.", font: "F1", size: 8.5, dy: -12 },
    { text: "• Speech Recognition: Accents and background noise require a caller-ID fallback and human review for unclear transcripts.", font: "F1", size: 8.5, dy: -11 },
    { text: "• Patient Privacy: Real deployment requires verified patient consent disclosures, clinic authentication, and strict retention rules.", font: "F1", size: 8.5, dy: -11 },
    { text: "", font: "F1", size: 8.5, dy: -6 },
    { text: "6. WHAT I WOULD DO NEXT (6-WEEK PILOT ROADMAP)", font: "F2", size: 10, dy: -14 },
    { text: "• Week 1: Audit 2 weeks of real clinic call logs to identify peak after-hours call windows. Configure call-forwarding on missed calls.", font: "F1", size: 8.5, dy: -12 },
    { text: "• Week 2: Connect an Indian voice provider on a dedicated pilot number; deploy clinic staff sign-in and email/SMS alerts.", font: "F1", size: 8.5, dy: -11 },
    { text: "• Weeks 3-4: Live pilot restricted to after-hours (8 PM - 9 AM and Sundays). Front desk reviews the callback queue each morning.", font: "F1", size: 8.5, dy: -11 },
    { text: "• Weeks 5-6: Measure actual recovery percentage, time-to-callback, and booked revenue against the Rs 5,000 operational spend.", font: "F1", size: 8.5, dy: -11 },
  ];

  const esc = (text) => text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

  let content = "BT\n";
  let isFirst = true;
  for (const item of lines) {
    if (isFirst) {
      content += `/${item.font} ${item.size} Tf\n54 752 Td\n(${esc(item.text)}) Tj\n`;
      isFirst = false;
    } else {
      content += `/${item.font} ${item.size} Tf\n0 ${item.dy} Td\n(${esc(item.text)}) Tj\n`;
    }
  }
  content += "ET\n";

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
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

  fs.writeFileSync("Dipesh-Sharma-ClinicRelay-Submission-Note.pdf", pdf);
  fs.writeFileSync("IMPLEMENTATION_NOTE.pdf", pdf);
  console.log("Wrote Dipesh-Sharma-ClinicRelay-Submission-Note.pdf and IMPLEMENTATION_NOTE.pdf");
}

generateSubmissionNotePdf();
