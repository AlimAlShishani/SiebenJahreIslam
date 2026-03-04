-- 37: app_settings für Maghrib-Zeit (Surah Kahf Licht)
-- Maghrib-Zeit im Format HH:mm (z.B. 19:30), Admin kann bearbeiten

create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table app_settings enable row level security;

-- Alle können lesen (für Kahf-Fenster-Berechnung)
drop policy if exists "Anyone can read app_settings" on app_settings;
create policy "Anyone can read app_settings" on app_settings for select using (true);

-- Nur Admins können schreiben
drop policy if exists "Admins can manage app_settings" on app_settings;
create policy "Admins can manage app_settings" on app_settings for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Default Maghrib 19:30
insert into app_settings (key, value) values ('maghrib_time', '19:30')
on conflict (key) do nothing;
