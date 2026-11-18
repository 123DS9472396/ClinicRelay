"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Enquiry, Msg, Settings, Status, STATUSES, defaultSettings, intentLabel, seed } from "@/lib/data";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const NAV = ["Overview", "Call inbox", "Appointments", "Analytics", "Settings"] as const;
type View = (typeof NAV)[number];
const card = "rounded-xl border border-line bg-paper shadow-[0_1px_2px_rgba(20,33,61,0.04)]";
const btn = "rounded-lg border border-line bg-paper px-3 py-1.5 text-sm font-medium transition-colors hover:border-teal/40 hover:bg-teal-soft";
const btnP = "rounded-lg bg-navy px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal";
const inp = "w-full rounded-md border border-line bg-white px-3 py-2 text-sm";
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const chip: Record<Status, string> = { New: "bg-teal-soft text-teal", "Callback pending": "bg-goldsoft text-gold", Contacted: "bg-slate-100 text-slate-600", Booked: "bg-navy text-white", Closed: "bg-stone-200 text-stone-600" };
const Chip = ({ s }: { s: Status }) => <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${chip[s]}`}>{s}</span>;
const Prio = ({ p }: { p: string }) => <span className={`text-xs font-medium ${p === "High" ? "text-alert" : "text-mute"}`}>{p}</span>;
const Stat = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className={`${card} p-4`}><div className="text-sm text-mute">{label}</div><div className="mt-1 text-3xl font-semibold tabular-nums">{value}</div>{hint && <div className="mt-1 text-xs text-mute">{hint}</div>}</div>
);

export default function App() {
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [cfg, setCfg] = useState<Settings>(defaultSettings);
  const [view, setView] = useState<View>("Overview");
  const [sel, setSel] = useState<string | null>(null);
  const [call, setCall] = useState(false);
  const [q, setQ] = useState("");
  const [f, setF] = useState<"All" | Status>("All");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = localStorage.getItem("cr.rows"), s = localStorage.getItem("cr.cfg");
        const saved = r ? JSON.parse(r) as Enquiry[] : (await fetch("/api/enquiries").then((response) => response.json())).rows as Enquiry[];
        const demoDipesh = seed().find((row) => row.id === "seed7");
        const rowsWithDemoMigration = demoDipesh && !saved.some((row) => row.id === demoDipesh.id) ? [...saved, demoDipesh] : saved;
        if (active) {
          setRows(rowsWithDemoMigration);
          if (s) setCfg(JSON.parse(s));
          setReady(true);
        }
      } catch (error) {
        console.error("Could not load local enquiries", error);
        if (active) { setRows(seed()); setReady(true); }
      }
    };
    void load();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("cr.rows", JSON.stringify(rows));
    localStorage.setItem("cr.cfg", JSON.stringify(cfg));
    void fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) })
      .catch((error) => console.error("Could not persist local enquiries", error));
  }, [rows, cfg, ready]);
  useEffect(() => {
    if (!ready) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase.channel("clinicrelay-enquiries")
      .on("postgres_changes", { event: "*", schema: "public", table: "demo_enquiries" }, (payload) => {
        const row = payload.new as { payload?: Enquiry };
        if (payload.eventType === "DELETE") {
          const deleted = payload.old as { id?: string };
          if (deleted.id) setRows((current) => current.filter((item) => item.id !== deleted.id));
          return;
        }
        const incoming = row.payload;
        if (incoming?.id) {
          setRows((current) => [...current.filter((item) => item.id !== incoming.id), incoming]);
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [ready]);
  const patch = (id: string, p: Partial<Enquiry>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const sorted = useMemo(() => [...rows].sort((a, b) => b.at.localeCompare(a.at)), [rows]);
  const m = useMemo(() => {
    const total = rows.length, captured = rows.filter((r) => r.phone).length;
    const pending = rows.filter((r) => r.status === "New" || r.status === "Callback pending").length;
    const appts = rows.filter((r) => r.appt), booked = appts.filter((r) => r.appt === "Confirmed").length;
    const cb = rows.filter((r) => r.phone && r.intent !== "timings" && r.intent !== "location");
    const done = cb.filter((r) => ["Contacted", "Booked", "Closed"].includes(r.status)).length;
    const pc = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
    return { total, captured, pending, appts: appts.length, booked, cap: pc(captured, total), cb: pc(done, cb.length), conv: pc(booked, appts.length) };
  }, [rows]);
  if (!ready) return null;
  const hr = new Date().getHours();
  const realtimeReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const list = sorted.filter((r) => (f === "All" || r.status === f) && (`${r.name} ${r.phone} ${r.summary}`.toLowerCase().includes(q.toLowerCase())));
  const cur = rows.find((r) => r.id === sel);
  const open = (id: string) => { setSel(id); setView("Call inbox"); };

  const Detail = cur && (
    <aside className={`${card} space-y-4 p-4`}>
      <div className="flex items-start justify-between"><div><h3 className="font-semibold">{cur.name || "Unknown caller"}</h3><p className="text-sm text-mute">{cur.phone || "No number captured"}</p></div><Chip s={cur.status} /></div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-mute">Call time</dt><dd>{when(cur.at)}, {Math.floor(cur.duration / 60)}m {cur.duration % 60}s</dd></div>
        <div><dt className="text-mute">Detected intent</dt><dd>{intentLabel[cur.intent]}</dd></div>
        <div><dt className="text-mute">Preference</dt><dd>{[cur.service, cur.prefDate, cur.prefTime].filter(Boolean).join(", ") || "None given"}</dd></div>
        <div><dt className="text-mute">Source</dt><dd>{cur.source}</dd></div>
      </dl>
      <p className="rounded-md bg-sand p-3 text-sm">{cur.summary}</p>
      <div className="max-h-48 space-y-2 overflow-y-auto text-sm">{cur.transcript.map((t, i) => <p key={i}><span className="font-medium">{t.role === "ai" ? "Receptionist" : "Patient"}:</span> {t.text}</p>)}</div>
      <label className="block text-sm">Callback notes<textarea className={`${inp} mt-1`} rows={2} value={cur.notes} onChange={(e) => patch(cur.id, { notes: e.target.value })} /></label>
      <div className="flex flex-wrap gap-2">
        <button className={btn} onClick={() => patch(cur.id, { status: "Contacted" })}>Mark as contacted</button>
        {cur.appt && cur.appt !== "Confirmed" && <button className={btnP} onClick={() => patch(cur.id, { appt: "Confirmed", status: "Booked" })}>Create appointment</button>}
        <button className={btn} onClick={() => patch(cur.id, { status: "Closed" })}>Close enquiry</button>
      </div>
    </aside>
  );

  return (
    <div className="md:flex">
      <aside className="bg-navy text-white md:min-h-screen md:w-60 md:shrink-0">
        <div className="border-b border-white/10 px-5 py-5"><div className="flex items-center gap-2 text-lg font-semibold tracking-tight"><span className="h-2 w-2 rounded-full bg-teal" />ClinicRelay</div><div className="mt-1 text-sm text-white/60">{cfg.name}</div><div className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/45"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />Demo workspace</div></div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col">
          {NAV.map((n) => <button key={n} onClick={() => setView(n)} className={`whitespace-nowrap rounded-md px-3 py-2 text-left text-sm ${view === n ? "bg-white/15 font-medium" : "text-white/75 hover:bg-white/10"}`}>{n}</button>)}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 space-y-6 p-4 md:p-8">
        <div className="overflow-hidden rounded-xl border border-teal/25 bg-teal-soft text-sm text-navy" aria-label="Demo status">
          <div className="overflow-hidden" role="marquee" aria-label="Demo status">
            <div className="clinicrelay-marquee-track flex w-max items-center py-2.5" style={{ animationDuration: "12s" }}>
              <span className="mx-6 inline-flex items-center gap-10"><strong className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-teal" />DEMO WORKSPACE</strong><span>Calls are simulated in the browser</span><span>Patients are fictional</span><span>No live phone line is connected</span><span aria-hidden="true">•</span><strong>Start a test call to explore the workflow</strong></span>
              <span className="mx-6 inline-flex items-center gap-10" aria-hidden="true"><strong className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-teal" />DEMO WORKSPACE</strong><span>Calls are simulated in the browser</span><span>Patients are fictional</span><span>No live phone line is connected</span><span aria-hidden="true">•</span><strong>Start a test call to explore the workflow</strong></span>
            </div>
          </div>
        </div>

        {view === "Overview" && <>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
            <div><div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal">After-hours operations</div><h1 className="text-3xl font-semibold tracking-tight">{hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening"}</h1><p className="mt-1 text-mute">Here is what came in while the clinic was closed.</p></div>
            <button className={btnP} onClick={() => setCall(true)}>Start test call</button>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="After-hours calls" value={m.total} /><Stat label="Enquiries captured" value={m.captured} hint="Caller left a number" />
            <Stat label="Callbacks pending" value={m.pending} /><Stat label="Appointment requests" value={m.appts} hint={`${m.booked} confirmed`} />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.35fr_.8fr]">
            <section className="rounded-xl bg-navy p-5 text-white shadow-[0_12px_30px_rgba(20,33,61,0.12)]">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Night-shift brief</span><div className="flex gap-2"><span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">Guarded AI</span><span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">{realtimeReady ? "Realtime cloud" : "Local sync"}</span></div></div>
              <h2 className="mt-5 max-w-md text-2xl font-semibold tracking-tight">{m.pending ? `${m.pending} callers are waiting for a clinic follow-up.` : "The callback queue is clear."}</h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-white/65">ClinicRelay turns missed conversations into a clean handoff: intent, contact details, urgency, and the next action.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-teal/20 px-3 py-1.5 text-teal">Capture {m.cap}%</span><span className="rounded-full bg-white/10 px-3 py-1.5 text-white/75">{m.booked} confirmed</span><span className="rounded-full bg-white/10 px-3 py-1.5 text-white/75">{m.appts - m.booked} to review</span></div>
            </section>
            <section className={`${card} p-5`}>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Recovery signals</div>
              <div className="mt-5 space-y-4">
                <div><div className="flex justify-between text-sm"><span>Caller details captured</span><strong>{m.cap}%</strong></div><div className="mt-2 h-2 rounded-full bg-sand"><div className="h-2 rounded-full bg-teal" style={{ width: `${m.cap}%` }} /></div></div>
                <div><div className="flex justify-between text-sm"><span>Callback completion</span><strong>{m.cb}%</strong></div><div className="mt-2 h-2 rounded-full bg-sand"><div className="h-2 rounded-full bg-navy" style={{ width: `${m.cb}%` }} /></div></div>
                <p className="text-xs leading-5 text-mute">Demo metrics update as you work the inbox and appointment queue.</p>
              </div>
            </section>
          </div>
          <section className={card}>
            <div className="flex items-center justify-between border-b border-line px-4 py-3"><h2 className="font-semibold">Recent enquiries</h2><button className="text-sm text-teal" onClick={() => setView("Call inbox")}>View all</button></div>
            {sorted.slice(0, 5).map((r) => (
              <button key={r.id} onClick={() => open(r.id)} className="flex w-full items-center justify-between gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-sand">
                <div><div className="text-sm font-medium">{r.name || "Unknown caller"}</div><div className="text-sm text-mute">{intentLabel[r.intent]}, {clock(r.at)}</div></div><Chip s={r.status} />
              </button>))}
          </section>
        </>}

        {view === "Call inbox" && <>
          <h1 className="text-2xl font-semibold">Call inbox</h1>
          <div className="flex flex-wrap gap-2">
            <input className={`${inp} max-w-xs`} placeholder="Search name, number or summary" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className={`${inp} w-auto`} value={f} onChange={(e) => setF(e.target.value as "All" | Status)}><option>All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
            <div className={`${card} overflow-x-auto`}>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-mute"><tr>{["Patient", "Enquiry", "Time", "Priority", "Status"].map((h) => <th key={h} className="px-4 py-2 font-medium">{h}</th>)}</tr></thead>
                <tbody>{list.map((r) => (
                  <tr key={r.id} onClick={() => setSel(r.id)} className={`cursor-pointer border-b border-line last:border-0 hover:bg-sand ${sel === r.id ? "bg-teal-soft/60" : ""}`}>
                    <td className="px-4 py-3 font-medium">{r.name || "Unknown caller"}</td><td className="px-4 py-3">{intentLabel[r.intent]}</td><td className="px-4 py-3">{clock(r.at)}</td><td className="px-4 py-3"><Prio p={r.priority} /></td><td className="px-4 py-3"><Chip s={r.status} /></td></tr>))}
                  {!list.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-mute">No enquiries match. Clear the filter or start a test call.</td></tr>}</tbody>
              </table>
            </div>
            {Detail || <div className={`${card} p-6 text-sm text-mute`}>Select an enquiry to see the transcript and take action.</div>}
          </div>
        </>}

        {view === "Appointments" && <>
          <div><h1 className="text-2xl font-semibold">Appointment requests</h1><p className="text-mute">These are requests. Confirm only after checking the dentist&apos;s availability.</p></div>
          <div className={`${card} overflow-x-auto`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-mute"><tr>{["Patient", "Service", "Requested date", "Preferred time", "Status", ""].map((h) => <th key={h} className="px-4 py-2 font-medium">{h}</th>)}</tr></thead>
              <tbody>{sorted.filter((r) => r.appt).map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{r.name}<div className="font-normal text-mute">{r.phone}</div></td><td className="px-4 py-3">{r.service || intentLabel[r.intent]}</td><td className="px-4 py-3">{r.prefDate || "Not given"}</td><td className="px-4 py-3">{r.prefTime || "Not given"}</td>
                  <td className="px-4 py-3">{r.appt}</td>
                  <td className="space-x-2 whitespace-nowrap px-4 py-3">{r.appt === "Pending confirmation" && <><button className={btnP} onClick={() => patch(r.id, { appt: "Confirmed", status: "Booked" })}>Confirm</button><button className={btn} onClick={() => patch(r.id, { appt: "Declined", status: "Closed" })}>Decline</button></>}</td></tr>))}
                {!m.appts && <tr><td colSpan={6} className="px-4 py-8 text-center text-mute">No appointment requests yet.</td></tr>}</tbody>
            </table>
          </div>
        </>}

        {view === "Analytics" && <>
          <div><h1 className="text-2xl font-semibold">Analytics</h1><p className="text-mute">Calculated from the records in this demo. These are not real clinic results.</p></div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat label="After-hours calls" value={m.total} /><Stat label="Capture rate" value={`${m.cap}%`} hint="Calls with a number" /><Stat label="Callback completion" value={`${m.cb}%`} /><Stat label="Request to booking" value={`${m.conv}%`} /><Stat label="Awaiting follow-up" value={m.pending} />
          </div>
          <section className={`${card} space-y-3 p-4`}>
            <h2 className="font-semibold">Why people called</h2>
            {(Object.keys(intentLabel) as (keyof typeof intentLabel)[]).map((k) => { const n = rows.filter((r) => r.intent === k).length; return (
              <div key={k} className="flex items-center gap-3 text-sm"><span className="w-36 shrink-0">{intentLabel[k]}</span><div className="h-2 flex-1 rounded bg-sand"><div className="h-2 rounded bg-teal" style={{ width: `${m.total ? (n / m.total) * 100 : 0}%` }} /></div><span className="w-6 text-right tabular-nums">{n}</span></div>); })}
          </section>
        </>}

        {view === "Settings" && <>
          <h1 className="text-2xl font-semibold">Clinic settings</h1>
          <section className={`${card} grid max-w-2xl gap-4 p-4 sm:grid-cols-2`}>
            <label className="text-sm sm:col-span-2">Clinic name<input className={`${inp} mt-1`} value={cfg.name} onChange={(e) => setCfg({ ...cfg, name: e.target.value })} /></label>
            <label className="text-sm sm:col-span-2">Address<input className={`${inp} mt-1`} value={cfg.address} onChange={(e) => setCfg({ ...cfg, address: e.target.value })} /></label>
            <label className="text-sm">Opens<input type="time" className={`${inp} mt-1`} value={cfg.open} onChange={(e) => setCfg({ ...cfg, open: e.target.value })} /></label>
            <label className="text-sm">Closes<input type="time" className={`${inp} mt-1`} value={cfg.close} onChange={(e) => setCfg({ ...cfg, close: e.target.value })} /></label>
            <label className="text-sm">Weekly holiday<select className={`${inp} mt-1`} value={cfg.weeklyOff} onChange={(e) => setCfg({ ...cfg, weeklyOff: e.target.value })}>{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => <option key={d}>{d}</option>)}</select></label>
            <p className="self-end text-sm text-mute">The receptionist reads these values when it answers timing and location questions.</p>
          </section>
          <button className={btn} onClick={() => { const fresh = seed(); setRows(fresh); setSel(null); void fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: fresh }) }); }}>Reset demo data</button>
        </>}
      </main>
      {call && <TestCall cfg={cfg} onClose={() => setCall(false)} onSave={(e) => { setRows((r) => [e, ...r]); setSel(e.id); }} />}
    </div>
  );
}

const SCENARIOS = ["I want to book a cleaning tomorrow at 6 pm", "I need to reschedule my appointment to Friday", "What are your clinic timings?", "Where is the clinic located?", "My tooth is swollen and I'm in severe pain", "Hi"];

function TestCall({ cfg, onClose, onSave }: { cfg: Settings; onClose: () => void; onSave: (e: Enquiry) => void }) {
  const greet = `Hello! Thank you for calling ${cfg.name}. Our clinic is currently closed. I'm the virtual receptionist. How can I help you?`;
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "ai", text: greet }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [provider, setProvider] = useState("not checked");
  const [data, setData] = useState<Record<string, string> | null>(null);
  const t0 = useRef(Date.now());
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const save = (transcript: Msg[], d: Record<string, string>, summary: string) => {
    const intent = (d.intent || "general") as Enquiry["intent"];
    onSave({ id: Date.now().toString(36), name: d.name || "", phone: d.phone || "", intent, priority: intent === "urgent" ? "High" : "Normal", status: "New", service: d.service || "", prefDate: d.prefDate || "", prefTime: d.prefTime || "", at: new Date().toISOString(), duration: Math.round((Date.now() - t0.current) / 1000), summary, transcript, notes: "", appt: intent === "appointment" || intent === "reschedule" ? "Pending confirmation" : "", source: "Simulated call" });
    setSaved(true);
  };
  const send = async (raw: string) => {
    const v = raw.trim(); if (!v || busy || saved) return;
    const next: Msg[] = [...msgs, { role: "patient", text: v }]; setMsgs(next); setText(""); setBusy(true);
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next, cfg }) });
      if (!r.ok) throw new Error();
      const j = await r.json(); const all: Msg[] = [...next, { role: "ai", text: j.reply }];
      setProvider(typeof j.source === "string" ? j.source : "unknown");
      setMsgs(all); setData(j.data); if (j.done) save(all, j.data, j.summary);
    } catch { setMsgs([...next, { role: "ai", text: "Sorry, I had trouble with that. Please say it again, or leave your number and we will call you back." }]); }
    setBusy(false);
  };
  const hangUp = () => { if (!saved && data && (data.name || data.phone)) save(msgs, data, "Caller hung up before finishing. Details are incomplete."); onClose(); };

  return (
    <div className="fixed inset-0 z-10 flex items-end justify-center bg-navy/40 p-0 sm:items-center sm:p-4" role="dialog" aria-label="Test call">
      <div className="flex h-[85vh] w-full max-w-lg flex-col rounded-t-xl bg-paper sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3"><div><div className="font-semibold">Test call</div><div className="flex items-center gap-2 text-xs text-mute"><span>Simulated, after hours</span><span className="rounded-full bg-teal-soft px-2 py-0.5 text-teal">Extraction: {provider}</span></div></div><button className={btn} onClick={hangUp}>{saved ? "Close" : "Hang up"}</button></div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.map((x, i) => <div key={i} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${x.role === "ai" ? "bg-sand" : "ml-auto bg-navy text-white"}`}>{x.text}</div>)}
          {busy && <div className="text-sm text-mute">Receptionist is typing</div>}
          {saved && <div className="rounded-lg border border-teal bg-teal-soft p-3 text-sm"><div className="font-medium">Saved to the call inbox</div><div>Awaiting clinic callback. Nothing is confirmed until the clinic checks availability.</div></div>}
          <div ref={end} />
        </div>
        {!saved && <div className="space-y-2 border-t border-line p-3">
          <div className="flex gap-2 overflow-x-auto pb-1">{SCENARIOS.map((s) => <button key={s} onClick={() => send(s)} className="whitespace-nowrap rounded-full border border-line px-3 py-1 text-xs hover:bg-sand">{s}</button>)}</div>
          <div className="flex gap-2"><input className={inp} value={text} placeholder="Type what the patient says" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(text)} /><button className={btnP} onClick={() => send(text)} disabled={busy}>Send</button></div>
        </div>}
      </div>
    </div>
  );
}
