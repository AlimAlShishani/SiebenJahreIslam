-- ═══════════════════════════════════════════════════════════════════════════
-- 39_reading_audio_rls_user_path.sql – RLS für reading-audio: nur eigene Dateien
-- Pfadformat: {user_id}/{assignmentId}_{timestamp}.webm
-- Einmal in Supabase SQL Editor ausführen.
-- ═══════════════════════════════════════════════════════════════════════════

-- Alte Policies entfernen
drop policy if exists "Authenticated can upload reading audio" on storage.objects;
drop policy if exists "Authenticated can update reading audio" on storage.objects;
drop policy if exists "Authenticated can delete reading audio" on storage.objects;

-- Neue Policies: Pfad muss mit auth.uid()/ beginnen (user_id/...)
create policy "Users can upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'reading-audio'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Users can update own reading audio"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'reading-audio'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Users can delete own reading audio"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'reading-audio'
    and split_part(name, '/', 1) = auth.uid()::text
  );
