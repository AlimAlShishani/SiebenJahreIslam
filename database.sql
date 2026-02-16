-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Public Profile Data)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. Learning Levels Table
create table learning_levels (
  id serial primary key,
  level_number int not null unique,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default levels
insert into learning_levels (level_number, title, description) values
(1, 'Alphabet', 'Lerne die arabischen Buchstaben'),
(2, 'Vokale', 'Buchstaben mit Fatha, Kasra, Damma'),
(3, 'Kurze Wörter', 'Erste Wörter aus dem Koran lesen'),
(4, 'Längere Wörter', 'Fortgeschrittene Wörter und Sätze');

-- RLS for Learning Levels
alter table learning_levels enable row level security;

create policy "Levels are viewable by everyone."
  on learning_levels for select
  using ( true );

-- Only admins can modify levels (requires admin check function or manual policy)
-- For simplicity, we'll allow authenticated users to read only.

-- 3. Learning Items Table
create table learning_items (
  id uuid default uuid_generate_v4() primary key,
  level_id int references learning_levels(level_number) on delete cascade not null,
  content text not null, -- The letter or word
  transliteration text,
  audio_url text,
  order_index int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Learning Items
alter table learning_items enable row level security;

create policy "Items are viewable by everyone."
  on learning_items for select
  using ( true );

create policy "Admins can insert/update items."
  on learning_items for all
  using ( exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

-- 4. User Progress Table
create table user_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  item_id uuid references learning_items(id) on delete cascade not null,
  is_completed boolean default false,
  completed_at timestamp with time zone,
  unique(user_id, item_id)
);

-- RLS for User Progress
alter table user_progress enable row level security;

create policy "Users can view own progress."
  on user_progress for select
  using ( auth.uid() = user_id );

create policy "Users can update own progress."
  on user_progress for all
  using ( auth.uid() = user_id );

-- 5. Juz Tracking Table
create table juz_tracking (
  id uuid default uuid_generate_v4() primary key,
  date date not null, -- The Ramadan date
  juz_number int not null check (juz_number between 1 and 30),
  assigned_user_id uuid references profiles(id) on delete set null,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(date, juz_number)
);

-- RLS for Juz Tracking
alter table juz_tracking enable row level security;

create policy "Juz tracking is viewable by everyone."
  on juz_tracking for select
  using ( true );

create policy "Admins or System can assign juz."
  on juz_tracking for insert
  with check ( true ); -- Simplify for now, ideally restrict to admin/system

create policy "Assigned user can update status."
  on juz_tracking for update
  using ( auth.uid() = assigned_user_id or exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage Bucket Setup (Run this in SQL Editor if not using UI)
insert into storage.buckets (id, name, public) values ('audio-files', 'audio-files', true);

create policy "Audio files are viewable by everyone"
  on storage.objects for select
  using ( bucket_id = 'audio-files' );

create policy "Admins can upload audio files"
  on storage.objects for insert
  with check ( bucket_id = 'audio-files' and exists ( select 1 from profiles where id = auth.uid() and role = 'admin' ) );
