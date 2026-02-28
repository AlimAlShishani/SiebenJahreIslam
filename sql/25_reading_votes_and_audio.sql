-- ═══════════════════════════════════════════════════════════════════════════
-- 25_reading_votes_and_audio.sql – Voting, Sprach-Markierung, Lese-Audio
-- Einmal in Supabase SQL Editor ausführen.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Zeit-Voting pro Tag/Juz
create table if not exists daily_reading_votes (
  id uuid default uuid_generate_v4() primary key,
  date date not null,
  user_id uuid references profiles(id) on delete cascade not null,
  vote text not null check (vote in ('20','21','22','23','0','1','nachlesen','abgeben')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  unique(date, user_id)
);

alter table daily_reading_votes enable row level security;

drop policy if exists "Votes viewable by authenticated" on daily_reading_votes;
create policy "Votes viewable by authenticated" on daily_reading_votes for select to authenticated using (true);

drop policy if exists "Users can insert own vote" on daily_reading_votes;
create policy "Users can insert own vote" on daily_reading_votes for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own vote" on daily_reading_votes;
create policy "Users can update own vote" on daily_reading_votes for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Sprach-Markierung pro Nutzer (für Lese-Gruppe)
create table if not exists reading_group_member_settings (
  user_id uuid references profiles(id) on delete cascade not null primary key,
  reader_language text check (reader_language in ('ar','de')),
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table reading_group_member_settings enable row level security;

drop policy if exists "Member settings viewable by authenticated" on reading_group_member_settings;
create policy "Member settings viewable by authenticated" on reading_group_member_settings for select to authenticated using (true);

drop policy if exists "Only admins can manage member settings" on reading_group_member_settings;
create policy "Only admins can manage member settings" on reading_group_member_settings for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- 3. Audio-URL pro Aufteilung
alter table daily_reading_status add column if not exists audio_url text;

-- 4. Storage: Lese-Audios (alle lesbar, authentifizierte Nutzer können hochladen; App prüft Zugehörigkeit)
insert into storage.buckets (id, name, public) values ('reading-audio', 'reading-audio', true)
on conflict (id) do nothing;

drop policy if exists "Reading audio viewable by everyone" on storage.objects;
create policy "Reading audio viewable by everyone" on storage.objects for select
  using (bucket_id = 'reading-audio');

drop policy if exists "Authenticated can upload reading audio" on storage.objects;
create policy "Authenticated can upload reading audio" on storage.objects for insert to authenticated
  with check (bucket_id = 'reading-audio');

drop policy if exists "Authenticated can update reading audio" on storage.objects;
create policy "Authenticated can update reading audio" on storage.objects for update to authenticated
  using (bucket_id = 'reading-audio');

drop policy if exists "Authenticated can delete reading audio" on storage.objects;
create policy "Authenticated can delete reading audio" on storage.objects for delete to authenticated
  using (bucket_id = 'reading-audio');
