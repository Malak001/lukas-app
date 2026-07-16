-- Luka's — self-introduction essay gate for Stage 1 and Stage 2.
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query > paste > Run).

-- ---------------------------------------------------------------------------
-- self_intro_attempts: "introduce yourself" paragraph, required at the end of
-- Stage 1 (after all lessons) and Stage 2 (after passing the exam). Existence
-- of a row for (user, stage, language) is what satisfies the requirement —
-- there's no pass/fail threshold, the AI feedback is for learning, not gating.
-- ---------------------------------------------------------------------------
create table self_intro_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stage smallint not null check (stage in (1, 2)),
  language text not null,
  essay_text text not null,
  word_count integer not null,
  overall_feedback text not null,
  mistakes jsonb not null,
  created_at timestamptz not null default now()
);

alter table self_intro_attempts enable row level security;

create policy "self_intro_attempts: read own" on self_intro_attempts
  for select using (auth.uid() = user_id);

create policy "self_intro_attempts: insert own" on self_intro_attempts
  for insert with check (auth.uid() = user_id);
