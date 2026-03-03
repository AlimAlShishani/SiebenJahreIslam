-- Allow plan_cleared in reading_activity_logs (Verteilung löschen).
alter table public.reading_activity_logs
drop constraint if exists reading_activity_logs_activity_type_check;

alter table public.reading_activity_logs
add constraint reading_activity_logs_activity_type_check
check (activity_type in ('audio_added', 'plan_updated', 'plan_cleared'));
