-- Luka's — Stage 4 (Live Conversation) schema additions
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query > paste > Run),
-- after 0001_init.sql has already been applied.

-- ---------------------------------------------------------------------------
-- call_queue: add call_format so voice and video requests are matched
-- separately (a voice-call user should never be paired into a video call).
-- ---------------------------------------------------------------------------
alter table call_queue
  add column call_format text not null default 'video' check (call_format in ('audio', 'video'));

alter table call_queue alter column call_format drop default;

-- ---------------------------------------------------------------------------
-- call_sessions: add call_format + denormalized target languages so the call
-- screen can label the two conversation phases without extra profile joins
-- (and so relabeling stays correct even if a profile's target_language
-- changes after the session already happened).
-- ---------------------------------------------------------------------------
alter table call_sessions
  add column call_format text not null default 'video' check (call_format in ('audio', 'video')),
  add column user_a_target text not null default '',
  add column user_b_target text not null default '';

alter table call_sessions alter column call_format drop default;
alter table call_sessions alter column user_a_target drop default;
alter table call_sessions alter column user_b_target drop default;

-- ---------------------------------------------------------------------------
-- reports: constrain reason to a fixed set of categories shown in the app
-- ---------------------------------------------------------------------------
alter table reports
  add constraint reports_reason_check
  check (reason in ('harassment', 'inappropriate_content', 'spam_or_bot', 'technical_issue', 'other'));

-- ---------------------------------------------------------------------------
-- stage4_join_queue: atomically find a reciprocal partner or join the queue.
-- "Reciprocal" means: the candidate's native language is what I'm learning,
-- AND the candidate is learning my native language, in the same call format.
-- `for update skip locked` makes this race-safe if two people join at once.
--
-- security definer so it can read/write across users. Only ever call this
-- from server-only code (via the service-role/admin client) after verifying
-- the caller's own identity server-side — never let a client pass an
-- arbitrary p_user_id. Execute is revoked from anon/authenticated below so it
-- can't be invoked directly from the browser.
-- ---------------------------------------------------------------------------
create or replace function stage4_join_queue(
  p_user_id uuid,
  p_native_language text,
  p_target_language text,
  p_call_format text
) returns table (matched boolean, session_id uuid, room_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner_id uuid;
  v_session_id uuid;
  v_room_name text;
begin
  -- Opportunistically reap anyone who's been waiting past the client-side
  -- timeout (5 min) and never came back to leave the queue themselves (e.g.
  -- closed the tab). Without this, a stale row could later be matched into
  -- a "ghost" session whose other participant never joins.
  delete from call_queue where joined_at < now() - interval '5 minutes';

  select user_id into v_partner_id
  from call_queue
  where native_language = p_target_language
    and target_language = p_native_language
    and call_format = p_call_format
    and user_id <> p_user_id
  order by joined_at asc
  limit 1
  for update skip locked;

  if v_partner_id is not null then
    delete from call_queue where user_id = v_partner_id;
    delete from call_queue where user_id = p_user_id;

    v_session_id := gen_random_uuid();
    v_room_name := 'stage4-' || replace(v_session_id::text, '-', '');

    insert into call_sessions (id, user_a, user_b, room_name, call_format, user_a_target, user_b_target)
    values (v_session_id, p_user_id, v_partner_id, v_room_name, p_call_format, p_target_language, p_native_language);

    return query select true, v_session_id, v_room_name;
  else
    insert into call_queue (user_id, native_language, target_language, call_format, joined_at)
    values (p_user_id, p_native_language, p_target_language, p_call_format, now())
    on conflict (user_id) do update
      set native_language = excluded.native_language,
          target_language = excluded.target_language,
          call_format = excluded.call_format,
          joined_at = now();

    return query select false, null::uuid, null::text;
  end if;
end;
$$;

revoke execute on function stage4_join_queue(uuid, text, text, text) from public;
revoke execute on function stage4_join_queue(uuid, text, text, text) from anon, authenticated;
