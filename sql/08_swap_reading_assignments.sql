-- ═══════════════════════════════════════════════════════════════════════════
-- 08_swap_reading_assignments.sql – Reihenfolge im täglichen Juz-Plan tauschen
-- Tauscht die user_id zweier Einträge (gleiches Datum), damit man die Zuordnung
-- „Wer liest welche Seiten“ anpassen kann.
-- ═══════════════════════════════════════════════════════════════════════════

-- Einzelnes UPDATE, damit UNIQUE(date, user_id) nicht zwischen zwei Updates verletzt wird.
create or replace function public.swap_daily_reading_assignments(a_id uuid, b_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update daily_reading_status d
  set user_id = other.user_id
  from daily_reading_status other
  where (d.id = a_id and other.id = b_id)
     or (d.id = b_id and other.id = a_id);
  if not found then
    raise exception 'Assignment(s) not found';
  end if;
end;
$$;

comment on function public.swap_daily_reading_assignments(uuid, uuid) is
  'Tauscht die zugewiesene Person (user_id) zwischen zwei daily_reading_status Einträgen.';
