-- ═══════════════════════════════════════════════════════════════════════════
-- 01_schema.sql – Basis-Schema (Tabellen, RLS, Trigger, Storage)
-- Einmal ausführen: bei neuer DB alles anlegen, bei bestehender DB nur
-- fehlende Teile (IF NOT EXISTS). learning_items.level_id = learning_levels.level_number.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- 1. Profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- 2. Learning Levels (level_number 1–13, level_id in learning_items = level_number)
create table if not exists learning_levels (
  id serial primary key,
  level_number int not null unique,
  title text not null,
  description text,
  unlock_requirement text,
  modal_content text,
  modal_audio_url text,
  modal_audio_urls jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table learning_levels add column if not exists unlock_requirement text;
alter table learning_levels add column if not exists modal_content text;
alter table learning_levels add column if not exists modal_audio_url text;
alter table learning_levels add column if not exists modal_audio_urls jsonb;

alter table learning_levels enable row level security;
drop policy if exists "Levels are viewable by everyone." on learning_levels;
create policy "Levels are viewable by everyone." on learning_levels for select using (true);
drop policy if exists "Admins can update levels." on learning_levels;
create policy "Admins can update levels." on learning_levels for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 3. Learning Items (level_id = learning_levels.level_number)
create table if not exists learning_items (
  id uuid default uuid_generate_v4() primary key,
  level_id int not null references learning_levels(level_number) on delete cascade,
  content text not null,
  transliteration text,
  audio_url text,
  order_index int default 0,
  options jsonb,
  help_audio_url text,
  rule_audio_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table learning_items add column if not exists options jsonb;
alter table learning_items add column if not exists help_audio_url text;
alter table learning_items add column if not exists rule_audio_url text;

alter table learning_items enable row level security;
drop policy if exists "Items are viewable by everyone." on learning_items;
create policy "Items are viewable by everyone." on learning_items for select using (true);
drop policy if exists "Admins can insert/update items." on learning_items;
create policy "Admins can insert/update items." on learning_items for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 4. User Progress
create table if not exists user_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  item_id uuid references learning_items(id) on delete cascade not null,
  is_completed boolean default false,
  completed_at timestamp with time zone,
  unique(user_id, item_id)
);

alter table user_progress enable row level security;
drop policy if exists "Users can view own progress." on user_progress;
create policy "Users can view own progress." on user_progress for select using (auth.uid() = user_id);
drop policy if exists "Users can update own progress." on user_progress;
create policy "Users can update own progress." on user_progress for all using (auth.uid() = user_id);

-- 5. Daily Reading (Koran-Plan, seitenbasiert)
create table if not exists daily_reading_status (
  id uuid default uuid_generate_v4() primary key,
  date date not null,
  juz_number int not null,
  user_id uuid references profiles(id) on delete cascade not null,
  start_page int not null,
  end_page int not null,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(date, user_id)
);

alter table daily_reading_status enable row level security;
-- Policies werden in 03_daily_reading_rls.sql gesetzt (für Plan-Generierung)

-- 6. Trigger: Neuer Auth-User → Profil anlegen
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Storage Bucket (Audio)
insert into storage.buckets (id, name, public) values ('audio-files', 'audio-files', true)
on conflict (id) do nothing;

drop policy if exists "Audio files are viewable by everyone" on storage.objects;
create policy "Audio files are viewable by everyone" on storage.objects for select using (bucket_id = 'audio-files');
drop policy if exists "Admins can upload audio files" on storage.objects;
create policy "Admins can upload audio files" on storage.objects for insert
  with check (bucket_id = 'audio-files' and exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
