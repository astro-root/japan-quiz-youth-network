create extension if not exists pg_trgm;

create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prefecture text not null,
  school_type text not null check (school_type in ('中学','高校','中高一貫')),
  created_at timestamptz default now()
);
create index schools_name_idx on schools using gin (name gin_trgm_ops);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  name text not null default 'クイズ研究部',
  type text not null default 'school_club',
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  real_name text not null,
  handle_name text not null,
  birthday date not null,
  gender text not null check (gender in ('male','female','other','no_answer')),
  grade smallint,
  school_id uuid references schools(id),
  organization_id uuid references organizations(id),
  role text not null default 'member' check (role in ('member','captain','vice_captain','advisor','alumni_member','staff')),
  status text not null default 'student' check (status in ('student','alumni','staff','external')),
  needs_reaffiliation boolean not null default false,
  created_at timestamptz default now()
);

create table affiliations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  organization_id uuid references organizations(id),
  role text not null,
  grade_at_time smallint,
  started_on date not null default current_date,
  ended_on date
);

create view organization_stats as
select
  o.id as organization_id,
  o.name,
  s.name as school_name,
  count(p.id) filter (where p.status = 'student') as member_count,
  count(p.id) filter (where p.status = 'student' and p.gender = 'male') as male_count,
  count(p.id) filter (where p.status = 'student' and p.gender = 'female') as female_count,
  (select p2.handle_name from profiles p2 where p2.organization_id = o.id and p2.role = 'captain' and p2.status = 'student' limit 1) as captain_name
from organizations o
left join schools s on s.id = o.school_id
left join profiles p on p.organization_id = o.id
group by o.id, o.name, s.name;

create or replace function admin_promote_all_grades()
returns void as $$
begin
  update affiliations a
  set grade_at_time = p.grade
  from profiles p
  where a.user_id = p.id and a.ended_on is null;

  update affiliations
  set ended_on = current_date
  where user_id in (
    select id from profiles
    where status = 'student' and grade = 3
      and school_id in (select id from schools where school_type = '高校')
  ) and ended_on is null;

  update profiles
  set status = 'alumni'
  where status = 'student' and grade = 3
    and school_id in (select id from schools where school_type = '高校');

  update profiles
  set needs_reaffiliation = true
  where status = 'student' and grade = 3
    and school_id in (select id from schools where school_type = '中学');

  update profiles
  set grade = grade + 1
  where status = 'student'
    and not (grade = 3);
end;
$$ language plpgsql security definer;

alter table profiles enable row level security;
alter table affiliations enable row level security;
create policy "self read/write profile" on profiles for all using (auth.uid() = id);
create policy "public read organizations" on organizations for select using (true);
create policy "public read schools" on schools for select using (true);
