-- 35: group_id in daily_reading_status, daily_reading_votes, reading_activity_logs, reading_group_member_settings
-- + Daten migrieren (einer Default-Gruppe zuordnen) + RLS auf „nur eigene Gruppe“

-- Default-Gruppe für Migration (eine beliebige bestehende Gruppe)
do $$
declare
  default_gid uuid;
begin
  select id into default_gid from reading_groups limit 1;
  if default_gid is null then
    return;
  end if;

  -- 1. daily_reading_status
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'daily_reading_status' and column_name = 'group_id') then
    alter table daily_reading_status add column group_id uuid references reading_groups(id) on delete cascade;
    update daily_reading_status set group_id = default_gid where group_id is null;
    alter table daily_reading_status alter column group_id set not null;
    alter table daily_reading_status drop constraint if exists daily_reading_status_date_user_id_key;
    alter table daily_reading_status add constraint daily_reading_status_group_date_user_key unique (group_id, date, user_id);
  end if;

  -- 2. daily_reading_votes
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'daily_reading_votes' and column_name = 'group_id') then
    alter table daily_reading_votes add column group_id uuid references reading_groups(id) on delete cascade;
    update daily_reading_votes set group_id = default_gid where group_id is null;
    alter table daily_reading_votes alter column group_id set not null;
    alter table daily_reading_votes drop constraint if exists daily_reading_votes_date_user_id_key;
    alter table daily_reading_votes add constraint daily_reading_votes_group_date_user_key unique (group_id, date, user_id);
  end if;

  -- 3. reading_activity_logs
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'reading_activity_logs' and column_name = 'group_id') then
    alter table reading_activity_logs add column group_id uuid references reading_groups(id) on delete cascade;
    update reading_activity_logs set group_id = default_gid where group_id is null;
    alter table reading_activity_logs alter column group_id set not null;
  end if;
end $$;

-- Fallback falls do-Block keine Spalte angelegt hat (z. B. schon vorhanden): Spalten einzeln
alter table daily_reading_status add column if not exists group_id uuid references reading_groups(id) on delete cascade;
alter table daily_reading_votes add column if not exists group_id uuid references reading_groups(id) on delete cascade;
alter table reading_activity_logs add column if not exists group_id uuid references reading_groups(id) on delete cascade;

update daily_reading_status set group_id = (select id from reading_groups limit 1) where group_id is null and exists (select 1 from reading_groups limit 1);
update daily_reading_votes set group_id = (select id from reading_groups limit 1) where group_id is null and exists (select 1 from reading_groups limit 1);
update reading_activity_logs set group_id = (select id from reading_groups limit 1) where group_id is null and exists (select 1 from reading_groups limit 1);

alter table daily_reading_status alter column group_id set not null;
alter table daily_reading_votes alter column group_id set not null;
alter table reading_activity_logs alter column group_id set not null;

alter table daily_reading_status drop constraint if exists daily_reading_status_date_user_id_key;
alter table daily_reading_status drop constraint if exists daily_reading_status_group_date_user_key;
alter table daily_reading_status add constraint daily_reading_status_group_date_user_key unique (group_id, date, user_id);

alter table daily_reading_votes drop constraint if exists daily_reading_votes_date_user_id_key;
alter table daily_reading_votes drop constraint if exists daily_reading_votes_group_date_user_key;
alter table daily_reading_votes add constraint daily_reading_votes_group_date_user_key unique (group_id, date, user_id);

create index if not exists idx_daily_reading_status_group_date on daily_reading_status(group_id, date);
create index if not exists idx_daily_reading_votes_group_date on daily_reading_votes(group_id, date);
create index if not exists idx_reading_activity_logs_group on reading_activity_logs(group_id);

-- RLS daily_reading_status: nur eigene Gruppe
alter table daily_reading_status enable row level security;
drop policy if exists "Enable all access for authenticated users" on daily_reading_status;
create policy "Group members can manage reading status"
  on daily_reading_status for all to authenticated
  using (exists (select 1 from reading_group_members m where m.group_id = daily_reading_status.group_id and m.user_id = auth.uid()))
  with check (exists (select 1 from reading_group_members m where m.group_id = daily_reading_status.group_id and m.user_id = auth.uid()));

-- RLS daily_reading_votes: nur eigene Gruppe
alter table daily_reading_votes enable row level security;
drop policy if exists "Votes viewable by authenticated" on daily_reading_votes;
drop policy if exists "Users can insert own vote" on daily_reading_votes;
drop policy if exists "Users can update own vote" on daily_reading_votes;
drop policy if exists "Users can delete own vote" on daily_reading_votes;
create policy "Group members can manage votes"
  on daily_reading_votes for all to authenticated
  using (exists (select 1 from reading_group_members m where m.group_id = daily_reading_votes.group_id and m.user_id = auth.uid()))
  with check (exists (select 1 from reading_group_members m where m.group_id = daily_reading_votes.group_id and m.user_id = auth.uid()));

-- RLS reading_activity_logs: nur eigene Gruppe lesen/schreiben; Löschen weiterhin Admin
drop policy if exists "Reading group members can read activity logs" on reading_activity_logs;
create policy "Group members can read activity logs"
  on reading_activity_logs for select to authenticated
  using (exists (select 1 from reading_group_members m where m.group_id = reading_activity_logs.group_id and m.user_id = auth.uid()));

drop policy if exists "Authenticated users can insert own activity logs" on reading_activity_logs;
create policy "Group members can insert own activity logs"
  on reading_activity_logs for insert to authenticated
  with check (
    actor_user_id = auth.uid()
    and exists (select 1 from reading_group_members m where m.group_id = reading_activity_logs.group_id and m.user_id = auth.uid())
  );

-- 4. reading_group_member_settings: (group_id, user_id) statt (user_id)
alter table reading_group_member_settings add column if not exists group_id uuid references reading_groups(id) on delete cascade;
update reading_group_member_settings set group_id = (select id from reading_groups limit 1) where group_id is null and exists (select 1 from reading_groups limit 1);
alter table reading_group_member_settings alter column group_id set not null;
alter table reading_group_member_settings drop constraint if exists reading_group_member_settings_pkey;
alter table reading_group_member_settings add primary key (group_id, user_id);

alter table reading_group_member_settings enable row level security;
drop policy if exists "Member settings viewable by authenticated" on reading_group_member_settings;
drop policy if exists "Only admins can manage member settings" on reading_group_member_settings;
create policy "Group members can view settings"
  on reading_group_member_settings for select to authenticated
  using (exists (select 1 from reading_group_members m where m.group_id = reading_group_member_settings.group_id and m.user_id = auth.uid()));
create policy "Group members can manage own or owner manages all"
  on reading_group_member_settings for all to authenticated
  using (exists (select 1 from reading_group_members m where m.group_id = reading_group_member_settings.group_id and m.user_id = auth.uid()))
  with check (exists (select 1 from reading_group_members m where m.group_id = reading_group_member_settings.group_id and m.user_id = auth.uid()));
