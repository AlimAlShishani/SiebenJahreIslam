-- ═══════════════════════════════════════════════════════════════════════════
-- 11_schema_intro_video_and_storage.sql
-- Intro-Video pro Stufe + Storage: Admin darf Audio/Video ändern & löschen
-- Einmal in Supabase SQL Editor ausführen.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Stufen-Intro-Video (URL aus Storage oder extern)
alter table learning_levels add column if not exists intro_video_url text;

-- 2. Storage: Admins dürfen in audio-files auch aktualisieren/löschen (für Umbenennen, Löschen)
drop policy if exists "Admins can update audio files" on storage.objects;
create policy "Admins can update audio files" on storage.objects for update
  using (bucket_id = 'audio-files' and exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can delete audio files" on storage.objects;
create policy "Admins can delete audio files" on storage.objects for delete
  using (bucket_id = 'audio-files' and exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 3. Bucket für Stufen-Videos (öffentlich lesbar, nur Admins schreiben)
insert into storage.buckets (id, name, public) values ('level-videos', 'level-videos', true)
on conflict (id) do nothing;

drop policy if exists "Level videos are viewable by everyone" on storage.objects;
create policy "Level videos are viewable by everyone" on storage.objects for select
  using (bucket_id = 'level-videos');

drop policy if exists "Admins can upload level videos" on storage.objects;
create policy "Admins can upload level videos" on storage.objects for insert
  with check (bucket_id = 'level-videos' and exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can update level videos" on storage.objects;
create policy "Admins can update level videos" on storage.objects for update
  using (bucket_id = 'level-videos' and exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can delete level videos" on storage.objects;
create policy "Admins can delete level videos" on storage.objects for delete
  using (bucket_id = 'level-videos' and exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
