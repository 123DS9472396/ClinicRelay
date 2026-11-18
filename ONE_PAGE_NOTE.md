# ClinicRelay: Recovering a Dental Clinic's After-Hours Calls

**Candidate:** Dipesh Sharma  
**Role:** AI Implementation Strategist Intern Test  
**Prototype:** Live Next.js Web Application (ClinicRelay)  
**Submission to:** Akash Vardhan (info@savedcalls.com), SavedCalls  

---

## 1. The Problem As I Read It

A Mumbai dental clinic loses approximately 30% of its incoming calls outside normal operating hours (evenings, early mornings, and weekly holidays). A patient who calls at 9:45 PM with pain or looking for an appointment and reaches a dead line will almost immediately call another nearby clinic. 

The clinic owner is **non-technical** and operating within a strict **Rs 5,000/month** budget. A full-time human night receptionist costs 3x-4x that budget, while doing nothing leaves revenue and urgent patients on the table. 

**Core objective:** The system does not need to handle complex dentistry or autonomous bookings. It must ensure that **no after-hours call ends without the clinic capturing who called, what they needed, whether they consented to a callback, and their urgency level.**

---

## 2. What I Chose and Built

A **hybrid virtual receptionist & clinic operations desk**:
- **Controlled virtual receptionist**: Guides patients through intent identification, name, 10-digit Indian mobile number (+91), preferred date/time, and explicit callback consent. Works in **English, Hindi, and Marathi**.
- **Human-in-the-loop appointment queue**: Appointment requests are saved with status **"Pending confirmation"**. The system strictly **never confirms a booking autonomously**, because it does not have live access to the dentist's physical chair or chair-time schedule.
- **Urgent triage guardrails**: If severe pain, bleeding, or swelling is reported, the system immediately flags the enquiry as **High Priority**, provides safe emergency guidance (go to nearest emergency room if swelling spreads), and never prescribes painkillers or medical diagnosis.
- **Staff Operations Desk**: Clean, responsive web dashboard showing captured calls, pending callbacks, an appointment review queue, call transcripts, and callback notes.
- **Resilient AI architecture**: Operates on a deterministic rule engine (Rs 0 cost, 100% uptime) with optional Groq LLM assistance. If external AI fails or has no key, the receptionist continues working uninterrupted.

---

## 3. What I Rejected, and Why

| Approach | Reason for Rejection |
| :--- | :--- |
| **Website Chatbot Only** | Rejected because after-hours patients are already calling the telephone number; patients in pain or driving will not switch to a website chatbot. |
| **Fully Autonomous AI Booking** | Rejected because without real-time synchronization with the dentist's chair and procedure durations, an AI hallucinating confirmed slots causes disastrous double-bookings. |
| **Unconstrained LLM Voice Agent** | Rejected because open-ended LLMs can invent dental prices, give dangerous medical advice, or make promises a clinic cannot honor. Guarded extraction with approved templates is vastly safer. |
| **Enterprise Practice Management Suite (PMS)** | Rejected because building or buying a massive PMS exceeds the 48-hour timeline and the Rs 5,000 budget. |
| **Night Human Answering Service** | Rejected because outsourced human call centers in Mumbai cost Rs 15,000-Rs 25,000/month, far exceeding the Rs 5,000 boundary. |

---

## 4. Cost Model Against Rs 5,000/Month Budget

Assuming an active Mumbai dental clinic receiving **400 total calls/month**:
- **After-hours volume (30%)**: ~120 calls/month.
- **Average duration**: 2.5 minutes per call = ~300 connected voice minutes.

| Line Item | Estimated Cost |
| :--- | :--- |
| Virtual DID / Landline Number Rental | Rs 299 / month |
| Inbound Telephony (Rs 5.00 / minute x 300 min) | Rs 1,500 / month |
| AI Inference (Groq Llama 3 / Deterministic Fallback) | ~Rs 150 / month |
| Cloud Database & Webhook Hosting (Supabase / Vercel Free Tier) | Rs 0 / month |
| Subtotal | Rs 1,949 / month |
| GST (18% on Telephony) | ~Rs 324 / month |
| **Total Projected Monthly Spend** | **~Rs 2,273 / month** |
| **Remaining Cushion (from Rs 5,000 budget)** | **+Rs 2,727 / month** |

**Break-even analysis:** At an average Mumbai dental consultation/cleaning fee of Rs 1,000-Rs 1,500, recovering just **2 to 3 appointments per month** completely covers the operational cost of the system.

---

## 5. Risks & Limits

1. **Simulated Environment:** Current prototype runs in a browser-based simulator with synthetic patient data. Live telephony requires connecting a telecom provider (e.g., Exotel, Tata Tele, or Twilio India).
2. **Indian Accents & Dialects:** Voice-to-text on noisy cell connections can mishear names; our system solves this by always capturing caller ID as an immutable fallback and repeating the 10-digit number for confirmation.
3. **Privacy & Data Retention:** Real patient data requires clinic consent disclosures, access controls, and a data deletion policy before production launch.

---

## 6. What I Would Do Next (6-Week Pilot Roadmap)

- **Week 1 (Audit & Telephony Setup):** Review two weeks of the clinic's actual call logs to verify peak after-hours call windows. Configure call forwarding on "No Answer / Busy" after 8:00 PM to a test pilot number.
- **Week 2 (Provider & Front Desk Integration):** Connect an India-based voice provider via signed webhook. Deploy clinic authentication so only verified clinic staff can access patient numbers.
- **Weeks 3-4 (Supervised Pilot):** Run the virtual receptionist strictly outside clinic hours (8:00 PM - 9:00 AM and Sundays). Front desk reviews the callback queue each morning at 9:00 AM.
- **Weeks 5-6 (Evaluation & Optimization):** Measure actual call capture rate, callback response time, and confirmed appointment revenue against the Rs 5,000 spend.
