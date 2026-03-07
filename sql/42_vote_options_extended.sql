-- 42: Hatim Daily Vote – Stunden 5–2 (morgens bis nachts) + nachlesen + abgeben
alter table if exists daily_reading_votes
  drop constraint if exists daily_reading_votes_vote_check;

alter table if exists daily_reading_votes
  add constraint daily_reading_votes_vote_check
  check (
    cardinality(vote) > 0
    and vote <@ array['5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','0','1','2','nachlesen','abgeben']::text[]
  );
