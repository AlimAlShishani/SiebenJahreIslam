-- 41: user_quran_slots – Quran-Instanzen pro User (Account-Sync)
create table if not exists user_quran_slots (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  slot_id text not null,
  label text not null,
  theme text not null default 'green' check (theme in ('green', 'purple', 'blue', 'gold')),
  created_at bigint not null,
  expires_at bigint,
  goal jsonb,
  goal_start_page int,
  goal_end_page int,
  unique(user_id, slot_id)
);

create index if not exists idx_user_quran_slots_user_id on user_quran_slots(user_id);

alter table user_quran_slots enable row level security;
drop policy if exists "Users can view own slots" on user_quran_slots;
create policy "Users can view own slots" on user_quran_slots for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own slots" on user_quran_slots;
create policy "Users can insert own slots" on user_quran_slots for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own slots" on user_quran_slots;
create policy "Users can update own slots" on user_quran_slots for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own slots" on user_quran_slots;
create policy "Users can delete own slots" on user_quran_slots for delete using (auth.uid() = user_id);
