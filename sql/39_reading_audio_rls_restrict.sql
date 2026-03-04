-- ═══════════════════════════════════════════════════════════════════════════
-- 39_reading_audio_rls_restrict.sql – RLS für reading-audio einschränken
-- Nutzer dürfen nur Dateien in ihrem eigenen Ordner (user_id/...) bearbeiten/löschen.
-- Neue Uploads müssen unter {user_id}/... gespeichert werden.
-- Alte Dateien (ohne user_id-Prefix) bleiben aus Kompatibilität bearbeitbar.
-- Einmal in Supabase SQL Editor ausführen.
-- ═══════════════════════════════════════════════════════════════════════════

-- INSERT: Nur in eigenem Ordner (Pfad muss mit auth.uid() beginnen)
drop policy if exists "Authenticated can upload reading audio" on storage.objects;
create policy "Authenticated can upload reading audio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'reading-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: Nur eigene Dateien (user_id/...) oder alte Dateien (einzelner Pfad)
drop policy if exists "Authenticated can update reading audio" on storage.objects;
create policy "Authenticated can update reading audio" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'reading-audio'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or array_length(storage.foldername(name), 1) = 1
    )
  );

-- DELETE: Nur eigene Dateien (user_id/...) oder alte Dateien (einzelner Pfad)
drop policy if exists "Authenticated can delete reading audio" on storage.objects;
create policy "Authenticated can delete reading audio" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'reading-audio'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or array_length(storage.foldername(name), 1) = 1
    )
  );
