-- 30_reading_activity_logs_policies.sql
-- Make activity-log inserts reliable for uploader accounts and allow admin cleanup.

alter table reading_activity_logs enable row level security;

drop policy if exists "Reading group members can insert own activity logs" on reading_activity_logs;
create policy "Authenticated users can insert own activity logs"
  on reading_activity_logs
  for insert
  to authenticated
  with check (actor_user_id = auth.uid());

drop policy if exists "Admins can delete activity logs" on reading_activity_logs;
create policy "Admins can delete activity logs"
  on reading_activity_logs
  for delete
  to authenticated
  using (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );
