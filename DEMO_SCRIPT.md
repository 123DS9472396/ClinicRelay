# ClinicRelay demo recording script

Target length: 2-3 minutes. Use fictional patient data only.

1. Open the dashboard and point out the demo-mode notice.
2. Show the overview cards and recent enquiries.
3. Open **Call inbox**, search for `Priya`, and open the enquiry detail.
4. Click **Start test call** and use the scenario “I want to book a cleaning tomorrow at 6 pm”.
5. Reply with a fictional name and 10-digit mobile number. Show that the assistant asks for missing information and saves a request rather than confirming a booking.
6. Open **Appointments**, confirm the request, and explain that the clinic—not the AI—controls availability.
7. Open **Analytics** and **Settings** to show operational visibility and editable clinic hours.
8. Optional: while the dev server is running, execute `node scripts/simulate-telephony.mjs` and show the acknowledged webhook response.
9. Close by stating that real telephony, provider signature verification, and production persistence are integration steps, not hidden claims of the prototype.
