-- Optional schema for CliparsCAM — run in Supabase SQL editor if you want persistence
-- Realtime + RLS not required for MVP (signaling is ephemeral via Realtime Broadcast)

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text unique not null,
  interests text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id text not null,
  reported_id text not null,
  reason text not null,
  created_at timestamptz default now()
);

-- enable RLS (optional, allow anon for demo)
alter table profiles enable row level security;
alter table reports enable row level security;
create policy "allow all" on profiles for all using (true) with check (true);
create policy "allow all" on reports for all using (true) with check (true);
