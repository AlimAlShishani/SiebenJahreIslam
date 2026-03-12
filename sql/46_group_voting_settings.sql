-- 46: Voting-Einstellungen pro Gruppe (Optionen + Deadline)
-- Group Owner kann wählen: welche Uhrzeiten zur Auswahl stehen, bis wann gevotet werden kann.

alter table reading_groups add column if not exists vote_options text[] default array['5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','0','1','2'];
alter table reading_groups add column if not exists vote_deadline_minutes integer; -- Minuten seit Mitternacht (z.B. 21:00 = 21*60 = 1260), null = kein Deadline

comment on column reading_groups.vote_options is 'Erlaubte Uhrzeiten für Voting (1-23, 0). Nachholen und Abgeben sind immer verfügbar.';
comment on column reading_groups.vote_deadline_minutes is 'Voting schließt um diese Minute des Tages (0-1439). null = kein Deadline.';

-- Vote-Check erweitern: alle Stunden 0-23 + nachlesen + abgeben erlauben (für konfigurierbare Optionen)
alter table if exists daily_reading_votes drop constraint if exists daily_reading_votes_vote_check;
alter table if exists daily_reading_votes
  add constraint daily_reading_votes_vote_check
  check (
    cardinality(vote) > 0
    and vote <@ array['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','nachlesen','abgeben']::text[]
  );
