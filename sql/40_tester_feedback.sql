-- Tester-Feedback: Nutzer können Feedback abgeben, Admins können es lesen
create table if not exists tester_feedback (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table tester_feedback enable row level security;

-- Nutzer können eigenes Feedback einfügen
drop policy if exists "Users can insert own feedback" on tester_feedback;
create policy "Users can insert own feedback" on tester_feedback
  for insert with check (auth.uid() = user_id);

-- Admins können alle Feedbacks lesen
drop policy if exists "Admins can read all feedback" on tester_feedback;
create policy "Admins can read all feedback" on tester_feedback
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
