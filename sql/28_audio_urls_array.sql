-- 28_audio_urls_array.sql
-- Mehrere Audios pro Aufteilung: audio_urls als Array, Backfill aus audio_url.

alter table daily_reading_status add column if not exists audio_urls text[] default '{}';

-- Backfill: bestehende audio_url in audio_urls übernehmen
update daily_reading_status
set audio_urls = array[audio_url]
where (audio_urls is null or array_length(audio_urls, 1) is null)
  and audio_url is not null and trim(audio_url) <> '';
