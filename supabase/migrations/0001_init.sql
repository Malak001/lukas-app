-- Luka's — initial schema
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query > paste > Run).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: one row per user, created on first login via app code (not a trigger,
-- so we can keep the "name" field editable during signup without extra plumbing).
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  native_language text,
  target_language text,
  is_admin boolean not null default false,
  stage4_suspended boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: read own" on profiles
  for select using (auth.uid() = id);

create policy "profiles: insert own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles: update own" on profiles
  for update using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- lessons: seeded content, read-only from the client
-- ---------------------------------------------------------------------------
create table lessons (
  id uuid primary key default gen_random_uuid(),
  language text not null,
  stage smallint not null default 1,
  lesson_order smallint not null,
  title text not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  unique (language, lesson_order)
);

alter table lessons enable row level security;

create policy "lessons: read all" on lessons
  for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- lesson_progress
-- ---------------------------------------------------------------------------
create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

alter table lesson_progress enable row level security;

create policy "lesson_progress: read own" on lesson_progress
  for select using (auth.uid() = user_id);

create policy "lesson_progress: insert own" on lesson_progress
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- exams: one question bank per language
-- ---------------------------------------------------------------------------
create table exams (
  id uuid primary key default gen_random_uuid(),
  language text not null unique,
  questions jsonb not null,
  created_at timestamptz not null default now()
);

alter table exams enable row level security;

create policy "exams: read all" on exams
  for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- exam_attempts
-- ---------------------------------------------------------------------------
create table exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_id uuid not null references exams (id) on delete cascade,
  score integer not null,
  passed boolean not null,
  answers jsonb not null,
  created_at timestamptz not null default now()
);

alter table exam_attempts enable row level security;

create policy "exam_attempts: read own" on exam_attempts
  for select using (auth.uid() = user_id);

create policy "exam_attempts: insert own" on exam_attempts
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- stage3_videos: curated YouTube clips + reference translations
-- ---------------------------------------------------------------------------
create table stage3_videos (
  id uuid primary key default gen_random_uuid(),
  language text not null,
  youtube_video_id text not null,
  title text not null,
  difficulty text not null default 'beginner',
  reference_transcript jsonb not null,
  created_at timestamptz not null default now()
);

alter table stage3_videos enable row level security;

create policy "stage3_videos: read all" on stage3_videos
  for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- stage3_attempts
-- ---------------------------------------------------------------------------
create table stage3_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id uuid not null references stage3_videos (id) on delete cascade,
  user_translation jsonb not null,
  ai_score integer not null,
  passed boolean not null,
  feedback jsonb not null,
  created_at timestamptz not null default now()
);

alter table stage3_attempts enable row level security;

create policy "stage3_attempts: read own" on stage3_attempts
  for select using (auth.uid() = user_id);

create policy "stage3_attempts: insert own" on stage3_attempts
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- user_stage: current unlocked stage per (user, language)
-- ---------------------------------------------------------------------------
create table user_stage (
  user_id uuid not null references auth.users (id) on delete cascade,
  language text not null,
  current_stage smallint not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, language)
);

alter table user_stage enable row level security;

create policy "user_stage: read own" on user_stage
  for select using (auth.uid() = user_id);

create policy "user_stage: insert own" on user_stage
  for insert with check (auth.uid() = user_id);

create policy "user_stage: update own" on user_stage
  for update using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- call_queue: Stage 4 matchmaking queue
-- ---------------------------------------------------------------------------
create table call_queue (
  user_id uuid primary key references auth.users (id) on delete cascade,
  native_language text not null,
  target_language text not null,
  joined_at timestamptz not null default now()
);

alter table call_queue enable row level security;

create policy "call_queue: read own" on call_queue
  for select using (auth.uid() = user_id);

create policy "call_queue: insert own" on call_queue
  for insert with check (auth.uid() = user_id);

create policy "call_queue: delete own" on call_queue
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- call_sessions
-- ---------------------------------------------------------------------------
create table call_sessions (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  room_name text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

alter table call_sessions enable row level security;

create policy "call_sessions: read own" on call_sessions
  for select using (auth.uid() = user_a or auth.uid() = user_b);

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reported_user_id uuid not null references auth.users (id) on delete cascade,
  call_session_id uuid references call_sessions (id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table reports enable row level security;

create policy "reports: read own as reporter" on reports
  for select using (auth.uid() = reporter_id);

create policy "reports: insert as reporter" on reports
  for insert with check (auth.uid() = reporter_id);

-- Note: call_queue matching, call_sessions creation, stage3 grading writes,
-- and the admin page all go through server-only routes using the Supabase
-- service role key, which bypasses RLS entirely. That's intentional — those
-- operations need to read/write across users, which no single-user RLS
-- policy could safely allow from the browser.
