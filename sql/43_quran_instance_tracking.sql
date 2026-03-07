-- 43: Quran Instance Tracking – Sessions pro User/Instanz
create table if not exists quran_instance_tracking (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  slot_id text not null,
  started_at timestamp with time zone not null,
  ended_at timestamp with time zone not null,
  duration_ms int not null check (duration_ms >= 0),
  pages_read int not null default 0 check (pages_read >= 0),
  ayahs_read int not null default 0 check (ayahs_read >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_quran_instance_tracking_user_id
  on quran_instance_tracking(user_id);

create index if not exists idx_quran_instance_tracking_user_started_at
  on quran_instance_tracking(user_id, started_at desc);

create index if not exists idx_quran_instance_tracking_user_slot_started_at
  on quran_instance_tracking(user_id, slot_id, started_at desc);

alter table quran_instance_tracking enable row level security;

drop policy if exists "Users can view own instance tracking" on quran_instance_tracking;
create policy "Users can view own instance tracking"
  on quran_instance_tracking
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own instance tracking" on quran_instance_tracking;
create policy "Users can insert own instance tracking"
  on quran_instance_tracking
  for insert
  with check (auth.uid() = user_id);
