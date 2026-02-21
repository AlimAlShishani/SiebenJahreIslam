-- ═══════════════════════════════════════════════════════════════════════════
-- 18_schema_reading_group.sql – Lese-Gruppe (nur diese Nutzer in Quran-Seite)
-- Nur Admins dürfen Mitglieder hinzufügen/entfernen. Neue Registrierungen
-- sind nicht automatisch in der Gruppe.
-- Nach dem ersten Ausführen: Admin in „Gruppe verwalten“ auf der Quran-Seite
-- hinzufügen und ggf. Freunde. Bestehende Admins werden einmalig eingetragen.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists reading_group_members (
  user_id uuid references profiles(id) on delete cascade not null primary key
);

alter table reading_group_members enable row level security;

-- Alle eingeloggten Nutzer dürfen lesen (damit die Quran-Seite die Gruppe anzeigen kann)
drop policy if exists "Reading group is viewable by authenticated users." on reading_group_members;
create policy "Reading group is viewable by authenticated users."
  on reading_group_members for select
  to authenticated
  using (true);

-- Nur Admins dürfen hinzufügen oder entfernen
drop policy if exists "Only admins can manage reading group." on reading_group_members;
create policy "Only admins can manage reading group."
  on reading_group_members for all
  to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Einmalig: Alle aktuellen Admins in die Lese-Gruppe aufnehmen (damit du sofort drin bist)
insert into reading_group_members (user_id)
  select id from profiles where role = 'admin'
  on conflict (user_id) do nothing;
