-- 大会エントリー機能: 大会・エントリーフォーム設問・応募情報

alter table profiles add column if not exists handle_name_kana text;

create table tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  event_date date,
  location text,
  entry_deadline timestamptz,
  capacity integer,
  status text not null default 'draft' check (status in ('draft','recruiting','closed')),
  quiznavi_url text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table entry_form_questions (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  position integer not null default 0,
  template_key text,
  label text not null,
  question_type text not null check (question_type in ('text','textarea','email','tel','radio','checkbox','select')),
  required boolean not null default true,
  options jsonb,
  placeholder text,
  created_at timestamptz not null default now()
);
create index entry_form_questions_tournament_idx on entry_form_questions(tournament_id, position);

create table entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, user_id)
);
create index entries_user_idx on entries(user_id);

alter table tournaments enable row level security;
alter table entry_form_questions enable row level security;
alter table entries enable row level security;

create policy "public read recruiting tournaments" on tournaments
  for select using (status = 'recruiting' or has_admin_page_access());
create policy "admin manage tournaments" on tournaments
  for all using (has_admin_page_access());

create policy "public read questions of visible tournaments" on entry_form_questions
  for select using (
    exists (
      select 1 from tournaments t
      where t.id = tournament_id and (t.status = 'recruiting' or has_admin_page_access())
    )
  );
create policy "admin manage questions" on entry_form_questions
  for all using (has_admin_page_access());

create policy "self read own entries" on entries
  for select using (auth.uid() = user_id or has_admin_page_access());
create policy "self insert own entry" on entries
  for insert with check (auth.uid() = user_id);
create policy "self update own entry" on entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin manage entries" on entries
  for all using (has_admin_page_access());
