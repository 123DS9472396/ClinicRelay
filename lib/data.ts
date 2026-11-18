export type Status = "New" | "Callback pending" | "Contacted" | "Booked" | "Closed";
export const STATUSES: Status[] = ["New", "Callback pending", "Contacted", "Booked", "Closed"];
export type Intent = "appointment" | "reschedule" | "timings" | "location" | "urgent" | "general";
export type Msg = { role: "ai" | "patient"; text: string };
export type Enquiry = {
  id: string; name: string; phone: string; intent: Intent; priority: "Normal" | "High"; status: Status;
  service: string; prefDate: string; prefTime: string; at: string; duration: number; summary: string;
  transcript: Msg[]; notes: string; appt: "" | "Pending confirmation" | "Confirmed" | "Declined"; source: string;
};
export type Settings = { name: string; address: string; open: string; close: string; weeklyOff: string };
export const defaultSettings: Settings = { name: "Smile Dental Clinic", address: "Shop 4, Station Road, Thane West", open: "10:00", close: "20:00", weeklyOff: "Sunday" };
export const intentLabel: Record<Intent, string> = { appointment: "New appointment", reschedule: "Reschedule", timings: "Clinic timings", location: "Location", urgent: "Urgent callback", general: "General enquiry" };

const GREET = "Hello! Thank you for calling Smile Dental Clinic. Our clinic is currently closed. I'm the virtual receptionist. How can I help you?";
export function seed(): Enquiry[] {
  const ago = (h: number) => new Date(Date.now() - h * 3600e3).toISOString();
  const mk = (i: number, name: string, phone: string, intent: Intent, status: Status, h: number, said: string, summary: string, service = "", prefDate = "", prefTime = "", appt: Enquiry["appt"] = ""): Enquiry => ({
    id: "seed" + i, name, phone, intent, priority: intent === "urgent" ? "High" : "Normal", status, service, prefDate, prefTime, at: ago(h), duration: 60 + i * 17, summary,
    transcript: [{ role: "ai", text: GREET }, { role: "patient", text: said }], notes: "", appt, source: "Sample data" });
  return [
    mk(1, "Priya S.", "9820012345", "appointment", "New", 1.2, "I'd like a cleaning appointment this week.", "Wants a dental cleaning this week.", "Dental cleaning", "This week", "Evening", "Pending confirmation"),
    mk(2, "Rahul M.", "9867054321", "reschedule", "Callback pending", 2.1, "I need to move my Friday appointment.", "Wants to move a Friday appointment.", "", "Friday", "", "Pending confirmation"),
    mk(3, "Ananya K.", "9930011223", "urgent", "New", 3.0, "My tooth is swollen and I'm in a lot of pain.", "Swelling and pain. Needs a priority callback."),
    mk(4, "Imran Q.", "9702233445", "general", "Contacted", 5.5, "Do you do braces for adults?", "Asked about adult braces."),
    mk(5, "Neha D.", "9819099887", "appointment", "Booked", 20, "Root canal consultation please.", "Root canal consultation.", "Root canal", "Saturday", "11:00 AM", "Confirmed"),
    mk(6, "", "", "general", "New", 26, "Hello? Is anyone there?", "Caller hung up before sharing details."),
    mk(7, "Dipesh", "9702575007", "appointment", "New", 0.5, "I want to book a cleaning tomorrow at 6 pm.", "Dipesh wants dental cleaning tomorrow around 6:00 PM.", "Dental cleaning", "tomorrow", "6:00 PM"),
  ];
}
