"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Enquiry, Msg, Settings, Status, STATUSES, defaultSettings, intentLabel, seed } from "@/lib/data";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

// ── Navigation & Views ────────────────────────────────────────────────────────
type View = "Overview" | "Call inbox" | "Appointment requests" | "AI receptionist" | "Performance" | "Settings";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const card = "rounded-2xl border border-slate-200/90 bg-white shadow-card transition-shadow hover:shadow-elevated";
const btn = "inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]";
const btnP = "inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98]";
const btnBrand = "inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-teal-700 active:scale-[0.98]";
const inp = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/15";

// ── Formatting Helpers ────────────────────────────────────────────────────────
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const initials = (name: string) =>
  (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

// ── Status Chips ──────────────────────────────────────────────────────────────
const chipCls: Record<Status, string> = {
  New: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  "Callback pending": "bg-amber-50 text-amber-700 border-amber-200/80",
  Contacted: "bg-slate-100 text-slate-700 border-slate-200",
  Booked: "bg-teal-50 text-teal-800 border-teal-200",
  Closed: "bg-stone-100 text-stone-600 border-stone-200",
};

function StatusChip({ s }: { s: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${chipCls[s]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {s}
    </span>
  );
}

function PriorityBadge({ p }: { p: string }) {
  return p === "High" ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
      High
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
      Normal
    </span>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function IconGrid() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function IconInbox() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconBot() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4M8 16h.01M16 16h.01" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" viewBox="0 0 24 24">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013 7.82a19.79 19.79 0 01-3.07-8.67A2 2 0 011.72 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L5.9 9.91a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ── Activity Sparkline Chart ──────────────────────────────────────────────────
function ActivityChart({ rows }: { rows: Enquiry[] }) {
  const days = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const ds = d.toDateString();
      return {
        label: d.toLocaleDateString("en-IN", { weekday: "short" }),
        count: rows.filter((r) => new Date(r.at).toDateString() === ds).length,
      };
    });
  }, [rows]);

  const max = Math.max(...days.map((d) => d.count), 2);
  const W = 520, H = 160, PX = 28, PY = 16;
  const chartH = H - PY * 2 - 20;

  const pts = days.map((d, i) => ({
    x: PX + (i / 6) * (W - PX * 2),
    y: PY + ((max - d.count) / max) * chartH,
    label: d.label,
    count: d.count,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(PY + chartH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PY + chartH).toFixed(1)} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-hidden="true">
        <defs>
          <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Subtle grid lines */}
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={PX}
            y1={(PY + f * chartH).toFixed(1)}
            x2={W - PX}
            y2={(PY + f * chartH).toFixed(1)}
            stroke="#F1F5F9"
            strokeWidth="1.2"
          />
        ))}
        {/* Gradient fill */}
        <path d={areaPath} fill="url(#actGrad)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Points & Labels */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="5" fill="#FFFFFF" stroke="#059669" strokeWidth="2.5" />
            <text x={p.x.toFixed(1)} y={H - 2} textAnchor="middle" fontSize="10.5" fill="#64748B" fontWeight="500">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Main Dashboard Component ──────────────────────────────────────────────────
export default function App() {
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [cfg, setCfg] = useState<Settings>(defaultSettings);
  const [view, setView] = useState<View>("Overview");
  const [sel, setSel] = useState<string | null>(null);
  const [call, setCall] = useState(false);
  const [q, setQ] = useState("");
  const [f, setF] = useState<"All" | Status>("All");
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [notifsOpen, setNotifsOpen] = useState(false);
  const skipPersist = useRef(false);

  // ── Load enquiries & settings ──────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = localStorage.getItem("cr.rows"), s = localStorage.getItem("cr.cfg");
        const remote = await fetch("/api/enquiries").then(async (response) => {
          if (!response.ok) throw new Error(`Enquiry API returned ${response.status}`);
          return response.json() as Promise<{ rows: Enquiry[]; persistence?: string }>;
        });
        const saved = remote.rows.length ? remote.rows : r ? (JSON.parse(r) as Enquiry[]) : remote.rows;
        const settingsResponse = await fetch("/api/settings")
          .then(async (response) => {
            if (!response.ok) return { settings: defaultSettings };
            return response.json() as Promise<{ settings: Settings }>;
          })
          .catch(() => ({ settings: defaultSettings }));
        const demoDipesh = seed().find((row) => row.id === "seed7");
        const rowsWithDemoMigration =
          demoDipesh && !saved.some((row) => row.id === demoDipesh.id) ? [...saved, demoDipesh] : saved;
        if (active) {
          setRows(rowsWithDemoMigration);
          if (s) setCfg({ ...defaultSettings, ...JSON.parse(s), ...settingsResponse.settings });
          setReady(true);
        }
      } catch (error) {
        console.error("Could not load local enquiries", error);
        if (active) {
          const cached = localStorage.getItem("cr.rows");
          setLoadError("Cloud data could not be loaded. Showing cached or fictional demo data.");
          setRows(cached ? (JSON.parse(cached) as Enquiry[]) : seed());
          setReady(true);
        }
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  // ── Sync to local storage & backend ────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    if (skipPersist.current) { skipPersist.current = false; return; }
    localStorage.setItem("cr.rows", JSON.stringify(rows));
    localStorage.setItem("cr.cfg", JSON.stringify(cfg));
    void fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    }).catch((error) => console.error("Could not persist local enquiries", error));
  }, [rows, cfg, ready]);

  // ── Supabase Realtime Subscription ────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase
      .channel("clinicrelay-enquiries")
      .on("postgres_changes", { event: "*", schema: "public", table: "demo_enquiries" }, (payload) => {
        const row = payload.new as { payload?: Enquiry };
        if (payload.eventType === "DELETE") {
          const deleted = payload.old as { id?: string };
          if (deleted.id) {
            skipPersist.current = true;
            setRows((current) => current.filter((item) => item.id !== deleted.id));
          }
          return;
        }
        const incoming = row.payload;
        if (incoming?.id) {
          skipPersist.current = true;
          setRows((current) => [...current.filter((item) => item.id !== incoming.id), incoming]);
        }
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [ready]);

  // ── Enquiry status patcher ────────────────────────────────────────────────
  const patch = (id: string, p: Partial<Enquiry>) => {
    setSaveError("");
    skipPersist.current = true;
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x)));
    void fetch(`/api/enquiries/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Update failed with ${response.status}`);
        setToastMsg("Status updated successfully");
        setTimeout(() => setToastMsg(""), 2500);
      })
      .catch((error) => {
        console.error("Could not update enquiry", error);
        setSaveError("The change could not be confirmed by the server. It remains visible locally.");
      });
  };

  // ── Reset Demo Data ───────────────────────────────────────────────────────
  const resetDemo = () => {
    const fresh = seed();
    setRows(fresh);
    setSel(null);
    setToastMsg("Demo data reset to fresh 7 seed records");
    setTimeout(() => setToastMsg(""), 3000);
    void fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: fresh }),
    });
  };

  // ── Computed metrics ──────────────────────────────────────────────────────
  const sorted = useMemo(() => [...rows].sort((a, b) => b.at.localeCompare(a.at)), [rows]);
  const m = useMemo(() => {
    const total = rows.length;
    const captured = rows.filter((r) => r.phone).length;
    const pending = rows.filter((r) => r.status === "New" || r.status === "Callback pending").length;
    const appts = rows.filter((r) => r.appt);
    const booked = appts.filter((r) => r.appt === "Confirmed").length;
    const pendingAppts = appts.filter((r) => r.appt === "Pending confirmation").length;
    const cb = rows.filter((r) => r.phone && r.intent !== "timings" && r.intent !== "location");
    const done = cb.filter((r) => ["Contacted", "Booked", "Closed"].includes(r.status)).length;
    const pc = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
    return {
      total,
      captured,
      pending,
      appts: appts.length,
      booked,
      pendingAppts,
      cap: pc(captured, total),
      cb: pc(done, cb.length),
      conv: pc(booked, appts.length),
    };
  }, [rows]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-teal-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Loading ClinicRelay Desk…</p>
        </div>
      </div>
    );
  }

  const hr = new Date().getHours();
  const greeting = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const realtimeReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const filteredList = sorted
    .filter((r) => (f === "All" || r.status === f) && `${r.name} ${r.phone} ${r.summary}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.priority === "High" ? 1 : 0) - (a.priority === "High" ? 1 : 0));

  const cur = rows.find((r) => r.id === sel) || (filteredList.length > 0 ? filteredList[0] : null);

  const openEnquiry = (id: string) => {
    setSel(id);
    setView("Call inbox");
  };

  const callbackQueue = sorted.filter((r) => r.status === "New" || r.status === "Callback pending").slice(0, 3);
  const newCount = rows.filter((r) => r.status === "New").length;

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC]">
      {/* ══════════════════════════════════════════════════════════════════════
          SIDEBAR (Sleek SavedCalls / Linear Aesthetic)
      ══════════════════════════════════════════════════════════════════════ */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[220px] flex-col bg-[#0A0F1D] text-white select-none">
        {/* Brand header */}
        <div className="border-b border-white/[0.08] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
              <IconCheck />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                clinicrelay
                <span className="rounded bg-teal-500/20 px-1 py-0.5 text-[9px] font-semibold text-teal-400 uppercase tracking-wider">AI</span>
              </div>
              <div className="text-[10px] text-slate-400 tracking-wide">after-hours desk</div>
            </div>
          </div>
        </div>

        {/* Workspace pill */}
        <div className="border-b border-white/[0.08] px-3.5 py-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] p-2 hover:bg-white/[0.07] transition-colors cursor-pointer">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-[10px] font-extrabold text-white shadow-sm">
              {initials(cfg.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-white/90">{cfg.name}</div>
              <div className="text-[10px] text-slate-400 truncate">Clinic workspace</div>
            </div>
          </div>
        </div>

        {/* Nav list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <p className="mb-2 px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
            <div className="space-y-1">
              {[
                { id: "Overview" as View, label: "Overview", Icon: IconGrid, badge: newCount },
                { id: "Call inbox" as View, label: "Call inbox", Icon: IconInbox, badge: m.pending },
                { id: "Appointment requests" as View, label: "Appointment requests", Icon: IconCalendar, badge: m.pendingAppts },
                { id: "AI receptionist" as View, label: "AI receptionist", Icon: IconBot, badge: 0 },
              ].map(({ id, label, Icon: NavIcon, badge }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all ${
                    view === id
                      ? "bg-teal-500/15 text-teal-300 font-semibold shadow-sm"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <span className={view === id ? "text-teal-400" : "text-slate-400"}>
                    <NavIcon />
                  </span>
                  <span className="flex-1 text-left">{label}</span>
                  {badge > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                      view === id ? "bg-teal-500/25 text-teal-300" : "bg-white/10 text-slate-300"
                    }`}>
                      {String(badge).padStart(2, "0")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Insights</p>
            <div className="space-y-1">
              {[
                { id: "Performance" as View, label: "Performance", Icon: IconChart },
                { id: "Settings" as View, label: "Clinic settings", Icon: IconSettings },
              ].map(({ id, label, Icon: NavIcon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all ${
                    view === id
                      ? "bg-teal-500/15 text-teal-300 font-semibold shadow-sm"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <span className={view === id ? "text-teal-400" : "text-slate-400"}>
                    <NavIcon />
                  </span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Help block matching reference design */}
        <div className="px-3 pb-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3.5 text-left">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-bold">?</span>
              Need a hand?
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
              Your team stays in control. ClinicRelay captures the request; your receptionist confirms the next step.
            </p>
            <button
              onClick={() => setView("Settings")}
              className="mt-2 text-[11px] font-semibold text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1"
            >
              Review setup ↗
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="border-t border-white/[0.08] px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white border border-white/10">
              CR
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white/90">Clinic admin</div>
              <div className="text-[10px] text-slate-500 truncate">Smile Dental Clinic</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="ml-[220px] flex min-w-0 flex-1 flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/90 bg-white/90 px-6 backdrop-blur-md">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-800">{view}</span>
          </div>

          {/* Right badges & controls */}
          <div className="flex items-center gap-3">
            {/* Live Environment Badge */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-teal-200/60 bg-teal-50 px-3 py-1 text-[11px] font-bold tracking-wide text-teal-800 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse" />
              DEMO ENVIRONMENT
            </div>

            {/* Notification bell & dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifsOpen(!notifsOpen)}
                className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none"
                title="Notifications"
                aria-label="View notifications"
              >
                <IconBell />
                {m.pending > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs animate-pulse">
                    {m.pending}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notifsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setNotifsOpen(false)}
                  />
                  <div className="absolute right-0 top-10 z-40 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Notifications</span>
                        <span className="rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                          {m.pending} unaddressed
                        </span>
                      </div>
                      <button
                        onClick={() => setNotifsOpen(false)}
                        className="text-[11px] font-medium text-slate-400 hover:text-slate-600"
                      >
                        ✕ Close
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
                      {sorted
                        .filter((r) => r.status === "New" || r.status === "Callback pending")
                        .slice(0, 6)
                        .map((r) => (
                          <div
                            key={r.id}
                            onClick={() => {
                              openEnquiry(r.id);
                              setNotifsOpen(false);
                            }}
                            className="flex items-start gap-3 p-3 transition-colors hover:bg-slate-50 cursor-pointer rounded-xl"
                          >
                            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                              r.priority === "High"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-teal-50 text-teal-700"
                            }`}>
                              {initials(r.name || "?")}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-900 truncate">
                                  {r.name || "Unknown caller"}
                                </span>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                  {clock(r.at)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
                                {r.priority === "High" ? "🚨 " : ""}{r.summary}
                              </p>
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="text-[9px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100">
                                  {intentLabel[r.intent]}
                                </span>
                                {r.phone && (
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    +91 {r.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      {!m.pending && (
                        <div className="p-6 text-center text-xs text-slate-400">
                          All caught up! No pending notifications.
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50/50 p-2.5 text-center">
                      <button
                        onClick={() => {
                          setView("Call inbox");
                          setNotifsOpen(false);
                        }}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
                      >
                        View all in Call Inbox →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-sm">
                CR
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-slate-800 leading-tight">Clinic admin</div>
                <div className="text-[10px] text-slate-500 leading-tight">Owner access</div>
              </div>
            </div>
          </div>
        </header>

        {/* Notification Toast */}
        {toastMsg && (
          <div className="fixed top-16 right-6 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900 shadow-lg animate-bounce">
            {toastMsg}
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl">
          {/* Load or Save errors */}
          {(loadError || saveError) && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800 shadow-sm">
              {loadError || saveError}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW: OVERVIEW
          ══════════════════════════════════════════════════════════════════ */}
          {view === "Overview" && (
            <>
              {/* Hero Banner with Actions */}
              <div className="flex flex-wrap items-end justify-between gap-4 pb-1">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                    Your clinic, in control
                  </div>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {greeting}, Clinic Admin.
                  </h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Here&apos;s what happened while your front desk was away.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button onClick={resetDemo} className={btn} title="Reset to initial 7 seed enquiries">
                    Reset demo
                  </button>
                  <button onClick={() => setCall(true)} className={btnBrand}>
                    + Simulate a call
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {/* 1. After-hours calls */}
                <div className={`${card} p-5`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">After-hours calls</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <IconPhone />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-bold tabular-nums text-slate-900">{m.total}</div>
                  <div className="mt-1 text-[11px] text-slate-500">All captured demo calls</div>
                </div>

                {/* 2. Enquiries captured */}
                <div className={`${card} p-5`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Enquiries captured</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <IconInbox />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-bold tabular-nums text-slate-900">{m.captured}</div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <span>{m.cap}% capture rate</span>
                    <span className="text-slate-400 font-normal">· caller left number</span>
                  </div>
                </div>

                {/* 3. Callbacks to review */}
                <div className={`${card} p-5`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Callbacks to review</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <IconClock />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-bold tabular-nums text-slate-900">{m.pending}</div>
                  <div className="mt-1 text-[11px] text-slate-500">Needs a human follow-up</div>
                </div>

                {/* 4. Appointment requests */}
                <div className={`${card} p-5`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Appointment requests</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <IconCalendar />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-bold tabular-nums text-slate-900">{m.appts}</div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {m.booked} confirmed · {m.appts - m.booked} pending
                  </div>
                </div>
              </div>

              {/* Middle Section: Chart (Left) & Next Best Action + Callback Queue (Right) */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                {/* After-hours Activity Chart */}
                <div className={`${card} lg:col-span-7 xl:col-span-8 p-5 flex flex-col justify-between`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">After-hours activity</h2>
                        <p className="text-xs text-slate-500">Calls captured in this demo workspace over the past week</p>
                      </div>
                      <button
                        onClick={() => setView("Performance")}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
                      >
                        View performance ↗
                      </button>
                    </div>
                    <div className="mt-4">
                      <ActivityChart rows={rows} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-5 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="h-2 w-2 rounded-full bg-teal-600" />
                      Captured calls
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full border border-slate-300 bg-white" />
                      Activity by day
                    </span>
                  </div>
                </div>

                {/* Right Column: Next Best Action & Callback Queue */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
                  {/* The Next Best Action (Dark SavedCalls Pill aesthetic) */}
                  <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-[#0B1528] to-[#0A1A24] p-5 text-white shadow-elevated border border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-teal-500/20 border border-teal-500/30 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-teal-400">
                        The next best action
                      </span>
                      <span className="text-3xl font-extrabold tabular-nums text-white/20">
                        {String(m.pending).padStart(2, "0")}
                      </span>
                    </div>
                    <h2 className="mt-3 text-base font-bold leading-snug">
                      {m.pending > 0
                        ? `${m.pending} patient request${m.pending !== 1 ? "s" : ""} need${m.pending === 1 ? "s" : ""} your attention.`
                        : "All after-hours callbacks are clear!"}
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                      Review new enquiries, then let your receptionist confirm the next step with each patient.
                    </p>
                    <button
                      onClick={() => setView("Call inbox")}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:bg-white/20 active:scale-[0.98]"
                    >
                      Open call inbox <IconArrowRight />
                    </button>
                  </div>

                  {/* Callback Queue Card */}
                  <div className={`${card} p-4 flex-1`}>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">Callback queue</h3>
                        <p className="text-[10px] text-slate-500">Priority requests first</p>
                      </div>
                      <button
                        onClick={() => setView("Call inbox")}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                      >
                        See all →
                      </button>
                    </div>
                    <div className="mt-2.5 space-y-1.5">
                      {callbackQueue.length > 0 ? (
                        callbackQueue.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => openEnquiry(r.id)}
                            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-slate-50 border border-transparent hover:border-slate-200/60"
                          >
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                              r.priority === "High" ? "bg-rose-100 text-rose-700" : "bg-teal-50 text-teal-700"
                            }`}>
                              {initials(r.name || "?")}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-semibold text-slate-800">{r.name || "Unknown caller"}</div>
                              <div className="text-[10px] text-slate-500">
                                {intentLabel[r.intent]} · {clock(r.at)}
                              </div>
                            </div>
                            {r.priority === "High" && (
                              <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[9px] font-bold text-rose-700 uppercase">
                                High
                              </span>
                            )}
                          </button>
                        ))
                      ) : (
                        <p className="py-4 text-center text-xs text-slate-400">No pending callbacks in queue.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Patient Enquiries Table */}
              <div className={card}>
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Recent patient enquiries</h2>
                    <p className="text-xs text-slate-500">Every request captured after closing time</p>
                  </div>
                  <button
                    onClick={() => setView("Call inbox")}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                  >
                    Open full inbox ↗
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50/50">
                      <tr>
                        {["Patient", "Enquiry", "Received", "Priority", "Status"].map((h) => (
                          <th key={h} className="px-5 py-3 font-semibold uppercase tracking-wider text-slate-500 text-[10px]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sorted.slice(0, 5).map((r) => (
                        <tr
                          key={r.id}
                          onClick={() => openEnquiry(r.id)}
                          className="cursor-pointer transition-colors hover:bg-slate-50/80"
                        >
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-slate-900">{r.name || "Unknown caller"}</div>
                            <div className="text-[11px] text-slate-500">{r.phone ? `+91 ${r.phone}` : "No number"}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-medium text-slate-800">{intentLabel[r.intent]}</div>
                            <div className="max-w-xs truncate text-[11px] text-slate-500">{r.summary}</div>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">{when(r.at)}</td>
                          <td className="px-5 py-3.5">
                            <PriorityBadge p={r.priority} />
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusChip s={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW: CALL INBOX (Master-Detail Split View)
          ══════════════════════════════════════════════════════════════════ */}
          {view === "Call inbox" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Call inbox</h1>
                <p className="text-xs text-slate-500">Review patient voice recordings, transcripts, and assign next actions.</p>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  className={`${inp} max-w-sm`}
                  placeholder="Search by patient name, phone number or summary…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <select
                  className={`${inp} w-auto cursor-pointer font-medium`}
                  value={f}
                  onChange={(e) => setF(e.target.value as "All" | Status)}
                >
                  <option value="All">All Statuses ({rows.length})</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s} ({rows.filter((r) => r.status === s).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Split Layout: Table (Left) + Detail Panel (Right) */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                {/* Table Column */}
                <div className={`${card} lg:col-span-7 xl:col-span-7 overflow-x-auto`}>
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 bg-slate-50/60">
                      <tr>
                        {["Patient", "Enquiry", "Time", "Priority", "Status"].map((h) => (
                          <th key={h} className="px-4 py-3 font-semibold uppercase tracking-wider text-slate-500 text-[10px]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredList.map((r) => (
                        <tr
                          key={r.id}
                          onClick={() => setSel(r.id)}
                          className={`cursor-pointer transition-colors ${
                            cur?.id === r.id ? "bg-teal-50/70 border-l-2 border-teal-600" : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{r.name || "Unknown caller"}</div>
                            <div className="text-[10px] text-slate-500">{r.phone ? `+91 ${r.phone}` : "No number"}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">{intentLabel[r.intent]}</div>
                            <div className="max-w-[180px] truncate text-[10px] text-slate-500">{r.summary}</div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-500 text-[11px]">{clock(r.at)}</td>
                          <td className="px-4 py-3">
                            <PriorityBadge p={r.priority} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusChip s={r.status} />
                          </td>
                        </tr>
                      ))}
                      {!filteredList.length && (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-xs text-slate-400">
                            No enquiries match the current filter. Clear filter or simulate a call.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Detail Panel Column */}
                <div className="lg:col-span-5 xl:col-span-5">
                  {cur ? (
                    <div className={`${card} p-5 space-y-4 sticky top-20`}>
                      {/* Header */}
                      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{cur.name || "Unknown caller"}</h3>
                          <p className="text-xs font-semibold text-teal-700">
                            {cur.phone ? `+91 ${cur.phone}` : "No phone number left"}
                          </p>
                        </div>
                        <StatusChip s={cur.status} />
                      </div>

                      {/* Meta Details */}
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                        <div>
                          <dt className="text-[10px] uppercase font-bold text-slate-400">Call time</dt>
                          <dd className="font-medium text-slate-700">{when(cur.at)} ({cur.duration}s)</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] uppercase font-bold text-slate-400">Detected intent</dt>
                          <dd className="font-medium text-slate-700">{intentLabel[cur.intent]}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] uppercase font-bold text-slate-400">Requested preference</dt>
                          <dd className="font-medium text-slate-700 truncate">
                            {[cur.service, cur.prefDate, cur.prefTime].filter(Boolean).join(", ") || "None specified"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] uppercase font-bold text-slate-400">Callback consent</dt>
                          <dd className="font-medium text-slate-700">
                            {cur.callbackConsent === true ? "✓ Yes, consented" : cur.callbackConsent === false ? "✕ No consent" : "Not captured"}
                          </dd>
                        </div>
                      </dl>

                      {/* AI Summary */}
                      <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3 text-xs leading-relaxed text-slate-800">
                        <span className="font-bold text-teal-800">AI Summary: </span>
                        {cur.summary}
                      </div>

                      {/* Conversation Transcript */}
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
                          Call Transcript ({cur.transcript.length} turns)
                        </p>
                        <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs">
                          {cur.transcript.map((t, i) => (
                            <div key={i} className={`flex flex-col ${t.role === "ai" ? "items-start" : "items-end"}`}>
                              <span className="text-[9px] font-semibold text-slate-400 mb-0.5">
                                {t.role === "ai" ? "Virtual Receptionist" : cur.name || "Patient"}
                              </span>
                              <div className={`max-w-[85%] rounded-xl px-3 py-1.5 leading-relaxed ${
                                t.role === "ai"
                                  ? "bg-white text-slate-800 border border-slate-200/80 shadow-xs"
                                  : "bg-slate-900 text-white"
                              }`}>
                                {t.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Callback Notes */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">
                          Staff Callback Notes
                          <textarea
                            className={`${inp} mt-1`}
                            rows={2}
                            placeholder="Add notes from phone follow-up…"
                            value={cur.notes}
                            onChange={(e) => patch(cur.id, { notes: e.target.value })}
                          />
                        </label>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                        <button className={btn} onClick={() => patch(cur.id, { status: "Contacted" })}>
                          Mark as contacted
                        </button>
                        {cur.appt && cur.appt !== "Confirmed" && (
                          <button
                            className={btnBrand}
                            onClick={() => patch(cur.id, { appt: "Confirmed", status: "Booked" })}
                          >
                            Confirm appointment
                          </button>
                        )}
                        <button className={btn} onClick={() => patch(cur.id, { status: "Closed" })}>
                          Close enquiry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`${card} p-10 text-center text-xs text-slate-400`}>
                      Select an enquiry from the list to view call details.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW: APPOINTMENT REQUESTS
          ══════════════════════════════════════════════════════════════════ */}
          {view === "Appointment requests" && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Appointment requests</h1>
                <p className="text-xs text-slate-500">
                  Patient requests captured after hours. Check the dentist&apos;s physical calendar before confirming.
                </p>
              </div>

              <div className={`${card} overflow-x-auto`}>
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/60">
                    <tr>
                      {["Patient", "Service", "Requested date", "Preferred time", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-5 py-3 font-semibold uppercase tracking-wider text-slate-500 text-[10px]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sorted.filter((r) => r.appt).map((r) => (
                      <tr key={r.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">{r.name || "Unknown caller"}</div>
                          <div className="text-[11px] text-slate-500">{r.phone ? `+91 ${r.phone}` : "No number"}</div>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-800">
                          {r.service || intentLabel[r.intent]}
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">{r.prefDate || "Not given"}</td>
                        <td className="px-5 py-3.5 text-slate-700">{r.prefTime || "Not given"}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                            r.appt === "Confirmed"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : r.appt === "Declined"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}>
                            {r.appt}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5">
                          {r.appt === "Pending confirmation" ? (
                            <div className="flex gap-2">
                              <button
                                className={btnBrand}
                                onClick={() => patch(r.id, { appt: "Confirmed", status: "Booked" })}
                              >
                                Confirm
                              </button>
                              <button
                                className={btn}
                                onClick={() => patch(r.id, { appt: "Declined", status: "Closed" })}
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!m.appts && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-xs text-slate-400">
                          No appointment requests yet. Run a simulated call to create an appointment enquiry.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW: AI RECEPTIONIST (SavedCalls-Inspired Product Showcase)
          ══════════════════════════════════════════════════════════════════ */}
          {view === "AI receptionist" && (
            <div className="max-w-4xl space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Virtual AI Receptionist</h1>
                <p className="text-xs text-slate-500">
                  Automated after-hours receptionist designed for dental clinic operations.
                </p>
              </div>

              {/* Model status card */}
              <div className={`${card} p-6`}>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                      <IconBot />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">{cfg.name} Virtual Receptionist</h2>
                      <p className="text-xs text-slate-500">
                        Deterministic Safety Rules Engine + Optional Groq LLM ({realtimeReady ? "Supabase Realtime active" : "Local persistence"})
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setCall(true)} className={btnBrand}>
                    Simulate test call
                  </button>
                </div>

                {/* Guardrails comparison */}
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px]">✓</span>
                      Guarded Capabilities
                    </div>
                    <ul className="mt-3 space-y-2 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">·</span>
                        Captures patient intent (Appointment, Reschedule, Urgent pain, Timings, Location).
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">·</span>
                        Extracts 10-digit Indian phone numbers with explicit callback consent.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">·</span>
                        Provides accurate timings (10:00 - 20:00) and address (Thane West).
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">·</span>
                        Escalates severe pain and emergencies to priority review.
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-800">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[10px]">✕</span>
                      Strict Prohibitions
                    </div>
                    <ul className="mt-3 space-y-2 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold">·</span>
                        Never gives clinical diagnosis, medical advice, or prescriptions.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold">·</span>
                        Never quotes unapproved pricing or commits the dentist&apos;s chair.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold">·</span>
                        Never marks an appointment as confirmed without clinic staff sign-off.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-rose-600 font-bold">·</span>
                        Does not send unsolicited spam or marketing messages.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW: PERFORMANCE (Analytics)
          ══════════════════════════════════════════════════════════════════ */}
          {view === "Performance" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Performance & Analytics</h1>
                <p className="text-xs text-slate-500">
                  Calculated from the records in this demo workspace.
                </p>
              </div>

              {/* Big KPI Row */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className={`${card} p-5`}>
                  <p className="text-xs font-semibold uppercase text-slate-500">Capture rate</p>
                  <div className="mt-2 text-3xl font-extrabold text-teal-700">{m.cap}%</div>
                  <p className="mt-1 text-[11px] text-slate-500">Calls resulting in captured number</p>
                </div>
                <div className={`${card} p-5`}>
                  <p className="text-xs font-semibold uppercase text-slate-500">Callback completion</p>
                  <div className="mt-2 text-3xl font-extrabold text-slate-900">{m.cb}%</div>
                  <p className="mt-1 text-[11px] text-slate-500">Enquiries contacted or booked</p>
                </div>
                <div className={`${card} p-5`}>
                  <p className="text-xs font-semibold uppercase text-slate-500">Booking conversion</p>
                  <div className="mt-2 text-3xl font-extrabold text-slate-900">{m.conv}%</div>
                  <p className="mt-1 text-[11px] text-slate-500">Requests confirmed to appointments</p>
                </div>
                <div className={`${card} p-5`}>
                  <p className="text-xs font-semibold uppercase text-slate-500">Awaiting callback</p>
                  <div className="mt-2 text-3xl font-extrabold text-amber-600">{m.pending}</div>
                  <p className="mt-1 text-[11px] text-slate-500">Patients needing clinic outreach</p>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className={`${card} p-5`}>
                <h2 className="text-sm font-bold text-slate-900 mb-3">After-hours call capture volume</h2>
                <ActivityChart rows={rows} />
              </div>

              {/* Call Intent Breakdown */}
              <div className={`${card} p-5 space-y-4`}>
                <h2 className="text-sm font-bold text-slate-900">Why people called after hours</h2>
                <div className="space-y-3">
                  {(Object.keys(intentLabel) as (keyof typeof intentLabel)[]).map((k) => {
                    const n = rows.filter((r) => r.intent === k).length;
                    const pct = m.total ? Math.round((n / m.total) * 100) : 0;
                    return (
                      <div key={k} className="flex items-center gap-4 text-xs">
                        <span className="w-36 font-semibold text-slate-700">{intentLabel[k]}</span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-teal-600 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-16 text-right tabular-nums font-semibold text-slate-600">
                          {n} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW: SETTINGS
          ══════════════════════════════════════════════════════════════════ */}
          {view === "Settings" && (
            <div className="max-w-3xl space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Clinic settings</h1>
                <p className="text-xs text-slate-500">
                  The AI receptionist reads these details when responding to patient queries about location and hours.
                </p>
              </div>

              <div className={`${card} p-6 space-y-5`}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                    Clinic Name
                    <input
                      className={`${inp} mt-1`}
                      value={cfg.name}
                      onChange={(e) => setCfg({ ...cfg, name: e.target.value })}
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                    Address
                    <input
                      className={`${inp} mt-1`}
                      value={cfg.address}
                      onChange={(e) => setCfg({ ...cfg, address: e.target.value })}
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Opens At
                    <input
                      type="time"
                      className={`${inp} mt-1`}
                      value={cfg.open}
                      onChange={(e) => setCfg({ ...cfg, open: e.target.value })}
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-700">
                    Closes At
                    <input
                      type="time"
                      className={`${inp} mt-1`}
                      value={cfg.close}
                      onChange={(e) => setCfg({ ...cfg, close: e.target.value })}
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                    Weekly Off Day
                    <select
                      className={`${inp} mt-1`}
                      value={cfg.weeklyOff}
                      onChange={(e) => setCfg({ ...cfg, weeklyOff: e.target.value })}
                    >
                      {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Multilingual */}
                <div className="border-t border-slate-100 pt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Receptionist Languages
                  </span>
                  <div className="mt-2.5 flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
                    {(["English", "Hindi", "Marathi"] as const).map((lang) => (
                      <label key={lang} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
                          checked={cfg.languages.includes(lang)}
                          onChange={(e) =>
                            setCfg({
                              ...cfg,
                              languages: e.target.checked
                                ? [...new Set([...cfg.languages, lang])]
                                : cfg.languages.filter((item) => item !== lang),
                            })
                          }
                        />
                        {lang}
                      </label>
                    ))}
                  </div>
                </div>

                {/* FAQ Knowledge Base */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    FAQ Knowledge Base
                  </span>
                  {cfg.faqs.map((faq, index) => (
                    <div key={faq.id} className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-2">
                      <input
                        className={inp}
                        value={faq.question}
                        aria-label={`FAQ ${index + 1} Question`}
                        onChange={(e) =>
                          setCfg({
                            ...cfg,
                            faqs: cfg.faqs.map((item, i) => (i === index ? { ...item, question: e.target.value } : item)),
                          })
                        }
                      />
                      <textarea
                        className={inp}
                        rows={2}
                        value={faq.answer}
                        aria-label={`FAQ ${index + 1} Answer`}
                        onChange={(e) =>
                          setCfg({
                            ...cfg,
                            faqs: cfg.faqs.map((item, i) => (i === index ? { ...item, answer: e.target.value } : item)),
                          })
                        }
                      />
                    </div>
                  ))}
                </div>

                {/* Save button */}
                <div className="pt-2">
                  <button
                    className={btnBrand}
                    onClick={() => {
                      setSaveError("");
                      localStorage.setItem("clinicrelay-settings", JSON.stringify(cfg));
                      localStorage.setItem("cr.cfg", JSON.stringify(cfg));
                      void fetch("/api/settings", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(cfg),
                      })
                        .then(async (response) => {
                          if (!response.ok) throw new Error();
                          setToastMsg("Clinic settings saved successfully!");
                          setTimeout(() => setToastMsg(""), 3000);
                        })
                        .catch(() => setSaveError("Clinic settings could not be confirmed by the server. Local settings remain active."));
                    }}
                  >
                    Save clinic settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ══════════════════════════════════════════════════════════════════
            FOOTER DISCLOSURE
        ══════════════════════════════════════════════════════════════════ */}
        <footer className="mt-auto border-t border-slate-200/90 bg-white px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
            <p className="max-w-2xl leading-relaxed">
              <strong className="text-slate-700">Demo workspace.</strong> The sample names, numbers and call history are fictional. The call simulator demonstrates the end-to-end capture workflow; it does not place or answer a live telephone call.
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
              <span className="text-[10px] tracking-wider uppercase text-slate-400 font-bold">CLINICRELAY · BUILT FOR THE HOURS THAT MATTER</span>
              <span className="flex items-center gap-1.5 text-teal-700 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                Demo data only
              </span>
              <span className="font-medium text-slate-600">No live calls are connected</span>
            </div>
          </div>
        </footer>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TEST CALL MODAL (Interactive Virtual Phone Simulator)
      ══════════════════════════════════════════════════════════════════════ */}
      {call && (
        <TestCall
          cfg={cfg}
          onClose={() => setCall(false)}
          onSave={(e) => {
            setRows((r) => [e, ...r]);
            setSel(e.id);
            setToastMsg(`Call saved to inbox! "${e.name || "Patient"}"`);
            setTimeout(() => setToastMsg(""), 3000);
          }}
        />
      )}
    </div>
  );
}

// ── Interactive Call Simulator Modal ──────────────────────────────────────────
const SCENARIOS = [
  "I want to book a cleaning tomorrow at 6 pm",
  "I need to reschedule my appointment to Friday",
  "What are your clinic timings?",
  "Where is the clinic located?",
  "My tooth is swollen and I'm in severe pain",
  "Hi",
];

function TestCall({
  cfg,
  onClose,
  onSave,
}: {
  cfg: Settings;
  onClose: () => void;
  onSave: (e: Enquiry) => void;
}) {
  const greet = `Hello! Thank you for calling ${cfg.name}. Our clinic is currently closed. I'm the virtual receptionist. How can I help you?`;
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "ai", text: greet }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [provider, setProvider] = useState("checking…");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const t0 = useRef(Date.now());
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const save = (transcript: Msg[], d: Record<string, unknown>, summary: string) => {
    const intent = (typeof d.intent === "string" ? d.intent : "general") as Enquiry["intent"];
    const callbackConsent = typeof d.callbackConsent === "boolean" ? d.callbackConsent : null;
    onSave({
      id: Date.now().toString(36),
      name: typeof d.name === "string" ? d.name : "",
      phone: typeof d.phone === "string" ? d.phone : "",
      intent,
      priority: intent === "urgent" ? "High" : "Normal",
      status: callbackConsent === false ? "Closed" : "New",
      service: typeof d.service === "string" ? d.service : "",
      prefDate: typeof d.prefDate === "string" ? d.prefDate : "",
      prefTime: typeof d.prefTime === "string" ? d.prefTime : "",
      at: new Date().toISOString(),
      duration: Math.round((Date.now() - t0.current) / 1000),
      summary,
      transcript,
      notes: callbackConsent === false ? "Patient did not consent to a callback." : "",
      appt: callbackConsent === true && (intent === "appointment" || intent === "reschedule") ? "Pending confirmation" : "",
      source: "Simulated call",
      callbackConsent,
      language: d.language === "Hindi" || d.language === "Marathi" ? d.language : "English",
    });
    setSaved(true);
  };

  const send = async (raw: string) => {
    const v = raw.trim();
    if (!v || busy || saved) return;
    const next: Msg[] = [...msgs, { role: "patient", text: v }];
    setMsgs(next);
    setText("");
    setBusy(true);
    try {
      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, cfg }),
      });
      if (!r.ok) throw new Error();
      const j = await r.json();
      const all: Msg[] = [...next, { role: "ai", text: j.reply }];
      setProvider(typeof j.source === "string" ? j.source : "unknown");
      setMsgs(all);
      setData(j.data);
      if (j.done) save(all, j.data, j.summary);
    } catch {
      setMsgs([
        ...next,
        {
          role: "ai",
          text: "Sorry, I had trouble with that. Please say it again, or leave your number and we will call you back.",
        },
      ]);
    }
    setBusy(false);
  };

  const hangUp = () => {
    if (!saved && data && (data.name || data.phone)) {
      save(msgs, data, "Caller hung up before finishing. Details are incomplete.");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400">
              <IconPhone />
            </div>
            <div>
              <div className="text-sm font-bold">Simulated After-Hours Call</div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>Smile Dental Virtual Receptionist</span>
                <span className="rounded bg-teal-500/20 px-1.5 py-0.2 text-teal-300 font-semibold">
                  {provider === "rules" ? "Safety rules fallback" : provider}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={hangUp}
            className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
          >
            {saved ? "Close" : "Hang up"}
          </button>
        </div>

        {/* Chat Message Scroll */}
        <div className="flex-1 space-y-3 overflow-y-auto p-5 bg-slate-50/50">
          {msgs.map((x, i) => (
            <div
              key={i}
              className={`flex flex-col ${x.role === "ai" ? "items-start" : "items-end"}`}
            >
              <span className="text-[9px] font-semibold text-slate-400 mb-1 px-1">
                {x.role === "ai" ? "Virtual Receptionist" : "Patient"}
              </span>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  x.role === "ai"
                    ? "bg-white text-slate-800 border border-slate-200/80 shadow-xs"
                    : "bg-teal-600 text-white font-medium shadow-xs"
                }`}
              >
                {x.text}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 py-1">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              </div>
              Receptionist is answering…
            </div>
          )}

          {saved && (
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-teal-800">
                <IconCheck /> Saved to Call Inbox
              </div>
              <p className="mt-1 text-slate-600">
                Request recorded for clinic callback. No appointment is confirmed until verified by clinic staff.
              </p>
            </div>
          )}
          <div ref={end} />
        </div>

        {/* Prompt Suggestions & Input */}
        {!saved && (
          <div className="border-t border-slate-100 bg-white p-4 space-y-3">
            {/* Quick scenarios */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {SCENARIOS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-100 active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input bar */}
            <div className="flex gap-2">
              <input
                className={inp}
                value={text}
                placeholder="Speak as the patient (e.g. 'I want to book an appointment tomorrow')…"
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(text)}
              />
              <button onClick={() => send(text)} disabled={busy} className={btnBrand}>
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
