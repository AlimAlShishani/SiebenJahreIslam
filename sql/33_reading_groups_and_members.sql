-- 33: Multi-Gruppen: reading_groups anlegen, reading_group_members auf (group_id, user_id) umstellen
-- Vorhandene Daten: eine Default-Gruppe, Owner = erster Admin, alle bisherigen Members in diese Gruppe

-- 1. Tabelle reading_groups
create table if not exists reading_groups (
  id uuid primary key default gen_random_uuid(),
  name text,
  owner_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table reading_groups enable row level security;

drop policy if exists "Reading groups viewable by authenticated" on reading_groups;
create policy "Reading groups viewable by authenticated"
  on reading_groups for select to authenticated using (true);

drop policy if exists "Users can create group as owner" on reading_groups;
create policy "Users can create group as owner"
  on reading_groups for insert to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Only owner can update or delete group" on reading_groups;
create policy "Only owner can update or delete group"
  on reading_groups for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- 2. Default-Gruppe aus bestehenden Members (falls Tabelle schon Daten hat)
insert into reading_groups (id, name, owner_id)
select
  gen_random_uuid(),
  'Lese-Gruppe',
  (select id from profiles where role = 'admin' limit 1)
where exists (select 1 from reading_group_members limit 1)
  and not exists (select 1 from reading_groups limit 1);

-- Falls reading_groups leer ist aber reading_group_members Einträge hat: eine Gruppe mit erstem Member als Owner
insert into reading_groups (id, name, owner_id)
select
  gen_random_uuid(),
  'Lese-Gruppe',
  (select user_id from reading_group_members limit 1)
where exists (select 1 from reading_group_members limit 1)
  and not exists (select 1 from reading_groups limit 1);

-- 3. reading_group_members erweitern: group_id hinzufügen
alter table reading_group_members add column if not exists group_id uuid references reading_groups(id) on delete cascade;

-- Bestehende Zeilen der (einzigen) Gruppe zuordnen
update reading_group_members
set group_id = (select id from reading_groups limit 1)
where group_id is null and exists (select 1 from reading_groups limit 1);

-- group_id not null
alter table reading_group_members alter column group_id set not null;

-- Alte PK entfernen, neue PK (group_id, user_id)
alter table reading_group_members drop constraint if exists reading_group_members_pkey;
alter table reading_group_members add primary key (group_id, user_id);

create index if not exists idx_reading_group_members_user_id on reading_group_members(user_id);

-- 4. RLS für reading_group_members
drop policy if exists "Reading group is viewable by authenticated users." on reading_group_members;
drop policy if exists "Only admins can manage reading group." on reading_group_members;

create policy "Members viewable by authenticated"
  on reading_group_members for select to authenticated using (true);

-- Insert: nur Owner fügt sich selbst ein (beim Erstellen der Gruppe). Einladungs-Annehmen kommt in Migration 34.
create policy "Insert: owner adds self when creating group"
  on reading_group_members for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from reading_groups g where g.id = group_id and g.owner_id = auth.uid())
  );

-- Delete: selbst (Gruppe verlassen) oder Owner entfernt Member
create policy "Member delete: leave or owner removes"
  on reading_group_members for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from reading_groups g where g.id = group_id and g.owner_id = auth.uid())
  );
