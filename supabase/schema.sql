-- Production path: replace browser storage with these tables and add row-level security per clinic.
create table clinics (id uuid primary key default gen_random_uuid(), name text not null, timezone text default 'Asia/Kolkata', opens time, closes time);
create table patients (id uuid primary key default gen_random_uuid(), clinic_id uuid references clinics, name text, phone text, preferred_language text);
create table calls (id uuid primary key default gen_random_uuid(), clinic_id uuid references clinics, patient_id uuid references patients, call_time timestamptz default now(), duration_s int, call_status text, channel text default 'simulated', provider_event_id text unique);
create table enquiries (id uuid primary key default gen_random_uuid(), clinic_id uuid references clinics, patient_id uuid references patients, call_id uuid references calls, intent text, priority text default 'Normal', summary text, status text default 'New', transcript jsonb, created_at timestamptz default now());
create table appointment_requests (id uuid primary key default gen_random_uuid(), enquiry_id uuid references enquiries, service text, preferred_date text, preferred_time text, confirmation_status text default 'Pending confirmation');
create table follow_ups (id uuid primary key default gen_random_uuid(), enquiry_id uuid references enquiries, assigned_to text, due_at timestamptz, completed_at timestamptz);

-- Demo persistence adapter used by the hosted prototype. Keep the service-role
-- key server-side; never expose it to the browser.
create table if not exists demo_enquiries (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table demo_enquiries enable row level security;
create policy "Demo enquiries are readable by the browser"
  on demo_enquiries for select using (true);
alter publication supabase_realtime add table public.demo_enquiries;
