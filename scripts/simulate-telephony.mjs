const baseUrl = process.argv[2] || "http://localhost:3000";
const payload = {
  eventId: `sim-${Date.now()}`,
  provider: "clinicrelay-simulator",
  callId: `call-${Date.now()}`,
  from: "+919820012345",
  to: "+912212345678",
  transcript: "I need a cleaning appointment tomorrow evening. My name is Priya and my number is 9820012345.",
  occurredAt: new Date().toISOString()
};

const response = await fetch(`${baseUrl}/api/telephony/webhook`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload)
});
console.log(`HTTP ${response.status}`);
console.log(JSON.stringify(await response.json(), null, 2));
if (!response.ok) process.exitCode = 1;
