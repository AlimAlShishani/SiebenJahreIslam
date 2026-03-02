-- 29_reading_activity_logs.sql
-- Activity-Log fuer Gruppenmitglieder (z. B. Audio hinzugefuegt)

create table if not exists reading_activity_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  juz_number integer not null,
  activity_type text not null check (activity_type in ('audio_added')),
  actor_user_id uuid not null references profiles(id) on delete cascade,
  assignment_user_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_reading_activity_logs_date_created_at
  on reading_activity_logs(date, created_at desc);

alter table reading_activity_logs enable row level security;

drop policy if exists "Reading group members can read activity logs" on reading_activity_logs;
create policy "Reading group members can read activity logs"
  on reading_activity_logs
  for select
  using (
    exists (
      select 1
      from reading_group_members m
      where m.user_id = auth.uid()
    )
  );

drop policy if exists "Reading group members can insert own activity logs" on reading_activity_logs;
create policy "Reading group members can insert own activity logs"
  on reading_activity_logs
  for insert
  with check (
    actor_user_id = auth.uid()
    and exists (
      select 1
      from reading_group_members m
      where m.user_id = auth.uid()
    )
  );
