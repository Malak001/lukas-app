-- Luka's — Friends, direct calls, and DM chat
-- Run this once in the Supabase SQL Editor, after 0001_init.sql and
-- 0002_stage4.sql have already been applied.

-- ---------------------------------------------------------------------------
-- friendships: request/accept model. One row per unordered pair regardless
-- of who requested — the unique index below enforces that with
-- least()/greatest() so (A,B) and (B,A) can't both exist.
-- ---------------------------------------------------------------------------
create table friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friendships_not_self check (requester_id <> recipient_id)
);

create unique index friendships_pair_unique on friendships (
  least(requester_id, recipient_id),
  greatest(requester_id, recipient_id)
);

alter table friendships enable row level security;

create policy "friendships: read own" on friendships
  for select using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "friendships: insert as requester" on friendships
  for insert with check (auth.uid() = requester_id);

-- Only the recipient can accept/decline. This also covers the "mutual tap"
-- case: if both people tap Add Friend around the same time, the second
-- insert hits the unique index, and the app layer falls back to updating
-- the existing row — which only works if that caller is its recipient_id,
-- i.e. they really are the other side of the original request.
create policy "friendships: recipient can respond" on friendships
  for update using (auth.uid() = recipient_id);

create policy "friendships: either side can delete" on friendships
  for delete using (auth.uid() = requester_id or auth.uid() = recipient_id);

-- ---------------------------------------------------------------------------
-- direct_call_invites: a friend-to-friend call ring/accept/decline flow,
-- delivered to the callee via Supabase Realtime (see publication below).
-- ---------------------------------------------------------------------------
create table direct_call_invites (
  id uuid primary key default gen_random_uuid(),
  caller_id uuid not null references auth.users (id) on delete cascade,
  callee_id uuid not null references auth.users (id) on delete cascade,
  call_format text not null check (call_format in ('audio', 'video')),
  room_name text not null,
  status text not null default 'ringing' check (status in ('ringing', 'accepted', 'declined', 'missed', 'cancelled')),
  call_session_id uuid references call_sessions (id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

alter table direct_call_invites enable row level security;

create policy "direct_call_invites: read own" on direct_call_invites
  for select using (auth.uid() = caller_id or auth.uid() = callee_id);

create policy "direct_call_invites: insert as caller" on direct_call_invites
  for insert with check (auth.uid() = caller_id);

create policy "direct_call_invites: either side can update" on direct_call_invites
  for update using (auth.uid() = caller_id or auth.uid() = callee_id);

-- ---------------------------------------------------------------------------
-- direct_messages: persisted friend-to-friend chat. translated_body/
-- translated_language are a cache filled in lazily the first time either
-- participant turns on the per-conversation translate toggle — see the
-- trigger below, which still lets either side write that cache without
-- letting anyone tamper with the original message content.
-- ---------------------------------------------------------------------------
create table direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  translated_body text,
  translated_language text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint direct_messages_not_self check (sender_id <> recipient_id)
);

create index direct_messages_sender_idx on direct_messages (sender_id, created_at);
create index direct_messages_recipient_idx on direct_messages (recipient_id, created_at);

alter table direct_messages enable row level security;

create policy "direct_messages: read own" on direct_messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "direct_messages: insert as sender" on direct_messages
  for insert with check (auth.uid() = sender_id);

-- Both sides can update the row (to fill the translation cache, or for the
-- recipient to set read_at) — the trigger below is what actually stops
-- either side from rewriting message content.
create policy "direct_messages: either side can update" on direct_messages
  for update using (auth.uid() = sender_id or auth.uid() = recipient_id);

create or replace function direct_messages_protect_core_fields()
returns trigger
language plpgsql
as $$
begin
  if new.sender_id <> old.sender_id
     or new.recipient_id <> old.recipient_id
     or new.body <> old.body
     or new.created_at <> old.created_at then
    raise exception 'cannot modify core message fields';
  end if;
  return new;
end;
$$;

create trigger direct_messages_protect_core_fields_trigger
before update on direct_messages
for each row execute function direct_messages_protect_core_fields();

-- ---------------------------------------------------------------------------
-- call_sessions: distinguish stranger-matched Stage 4 calls from direct
-- friend calls (which skip the 5+5 phase timer entirely), and relax the
-- target-language columns to optional since direct calls don't have them.
-- ---------------------------------------------------------------------------
alter table call_sessions
  add column session_type text not null default 'matched' check (session_type in ('matched', 'direct'));

alter table call_sessions alter column user_a_target drop not null;
alter table call_sessions alter column user_b_target drop not null;

-- ---------------------------------------------------------------------------
-- Realtime: make sure new-message and incoming-call events actually push to
-- clients regardless of the project's default publication settings.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table direct_messages;
alter publication supabase_realtime add table direct_call_invites;
alter publication supabase_realtime add table friendships;
