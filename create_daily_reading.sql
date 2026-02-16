-- Neue Tabelle für täglichen Lesefortschritt (Seiten-basiert)
-- Ersetzt juz_tracking für die neue Logik

create table daily_reading_status (
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

-- RLS Policies
alter table daily_reading_status enable row level security;

create policy "Reading status is viewable by everyone."
  on daily_reading_status for select
  using ( true );

create policy "Users can insert their own status (or via app logic)."
  on daily_reading_status for insert
  with check ( true ); 

create policy "Users can update their own status."
  on daily_reading_status for update
  using ( auth.uid() = user_id );

-- Optional: Clean up old table if desired, but keeping it for safety for now.
-- drop table juz_tracking;
