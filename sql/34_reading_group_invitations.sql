-- 34: Einladungen: reading_group_invitations + RLS; Member-Insert bei Einladung erlauben

create table if not exists reading_group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references reading_groups(id) on delete cascade,
  invited_by uuid not null references profiles(id) on delete cascade,
  invitee_user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  unique(group_id, invitee_user_id)
);

create index if not exists idx_reading_group_invitations_invitee on reading_group_invitations(invitee_user_id);
create index if not exists idx_reading_group_invitations_group on reading_group_invitations(group_id);

alter table reading_group_invitations enable row level security;

-- Lesen: eigene Einladungen (als Eingeladener) oder Mitglieder der Gruppe (um „bereits eingeladen“ zu sehen)
drop policy if exists "Invitations readable by invitee or group members" on reading_group_invitations;
create policy "Invitations readable by invitee or group members"
  on reading_group_invitations for select to authenticated
  using (
    invitee_user_id = auth.uid()
    or exists (select 1 from reading_group_members m where m.group_id = reading_group_invitations.group_id and m.user_id = auth.uid())
  );

-- Einladen: nur Owner der Gruppe
drop policy if exists "Group owner can create invitations" on reading_group_invitations;
create policy "Group owner can create invitations"
  on reading_group_invitations for insert to authenticated
  with check (
    invited_by = auth.uid()
    and exists (select 1 from reading_groups g where g.id = group_id and g.owner_id = auth.uid())
    and invitee_user_id <> auth.uid()
  );

-- Update (Accept/Decline): nur der Eingeladene
drop policy if exists "Invitee can update status" on reading_group_invitations;
create policy "Invitee can update status"
  on reading_group_invitations for update to authenticated
  using (invitee_user_id = auth.uid())
  with check (invitee_user_id = auth.uid());

-- Member-Insert beim Annehmen: Nutzer darf sich in Gruppe eintragen, wenn er eine pending Einladung hat
drop policy if exists "Member insert: self when invited" on reading_group_members;
create policy "Member insert: self when invited"
  on reading_group_members for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from reading_group_invitations i
      where i.group_id = reading_group_members.group_id and i.invitee_user_id = auth.uid() and i.status = 'pending'
    )
  );
