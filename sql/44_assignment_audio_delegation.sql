-- 44: Erlaubte Audio-Aufnehmer pro Assignment (Delegation)
-- Ermöglicht, dass ein Gruppenmitglied für die eigenen Seiten jemanden bevollmächtigen kann, Audio aufzunehmen.

alter table daily_reading_status add column if not exists allowed_audio_user_ids uuid[] default '{}';

comment on column daily_reading_status.allowed_audio_user_ids is 'User-IDs, die für dieses Assignment Audio aufnehmen dürfen (vom Besitzer delegiert).';
