-- ═══════════════════════════════════════════════════════════════════════════
-- 05_schema_popups_audio.sql – Spalten für editierbare Popups & Hilfe-/Regel-Audio
-- Einmal ausführen, wenn deine DB schon vorher mit 01_schema angelegt wurde.
-- ═══════════════════════════════════════════════════════════════════════════

alter table learning_levels add column if not exists modal_content text;
alter table learning_levels add column if not exists modal_audio_url text;
alter table learning_items add column if not exists help_audio_url text;
alter table learning_items add column if not exists rule_audio_url text;

-- Admins dürfen Stufen (z. B. Popup-Inhalt) bearbeiten
drop policy if exists "Admins can update levels." on learning_levels;
create policy "Admins can update levels." on learning_levels for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
