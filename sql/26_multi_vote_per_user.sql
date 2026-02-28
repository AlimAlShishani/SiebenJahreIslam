-- 26_multi_vote_per_user.sql
-- Erlaubt Mehrfach-Votes pro Nutzer/Tag als text[].

alter table if exists daily_reading_votes
  drop constraint if exists daily_reading_votes_vote_check;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'daily_reading_votes'
      and column_name = 'vote'
      and udt_name = 'text'
  ) then
    alter table daily_reading_votes
      alter column vote type text[]
      using array[vote];
  end if;
end $$;

alter table if exists daily_reading_votes
  add constraint daily_reading_votes_vote_check
  check (
    cardinality(vote) > 0
    and vote <@ array['20','21','22','23','0','1','nachlesen','abgeben']::text[]
  );
