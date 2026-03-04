-- 38: Kahf-Fenster VON/BIS (Tag + Uhrzeit) statt nur Maghrib-Zeit
-- Migration: Nutzt maghrib_time für Start/End-Zeit falls vorhanden

insert into app_settings (key, value, updated_at)
select 'kahf_start_day', '4', now()
where not exists (select 1 from app_settings where key = 'kahf_start_day');

insert into app_settings (key, value, updated_at)
select 'kahf_start_time', coalesce((select value from app_settings where key = 'maghrib_time'), '19:30'), now()
where not exists (select 1 from app_settings where key = 'kahf_start_time');

insert into app_settings (key, value, updated_at)
select 'kahf_end_day', '5', now()
where not exists (select 1 from app_settings where key = 'kahf_end_day');

insert into app_settings (key, value, updated_at)
select 'kahf_end_time', coalesce((select value from app_settings where key = 'maghrib_time'), '19:30'), now()
where not exists (select 1 from app_settings where key = 'kahf_end_time');
