-- 27_votes_delete_policy.sql
-- Erlaubt Nutzern, den eigenen Vote zu löschen (damit „Vote entfernen“ nach Reload erhalten bleibt).

drop policy if exists "Users can delete own vote" on daily_reading_votes;
create policy "Users can delete own vote" on daily_reading_votes
  for delete to authenticated
  using (auth.uid() = user_id);
