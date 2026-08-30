-- 住所列の追加
alter table schools add column if not exists address text;

-- 役職システム: 複数選択可能な配列に変更
alter table profiles add column if not exists federation_roles text[] not null default array['member'];
alter table profiles add constraint federation_roles_valid check (
  federation_roles <@ array['member','federation_president','admin','staff','engineer','cto']::text[]
);

update profiles set federation_roles = array['federation_president','cto','admin']
  where is_super_admin = true;
update profiles set federation_roles = array['staff']
  where is_staff = true and is_super_admin = false;

-- adminページへのアクセス権限（連盟長・最高技術責任者・管理者）
create or replace function has_admin_page_access()
returns boolean as $$
  select coalesce(
    (select federation_roles && array['federation_president','cto','admin']
     from profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- 権限の付与・剥奪ができるのは連盟長・最高技術責任者のみ
create or replace function can_manage_roles()
returns boolean as $$
  select coalesce(
    (select federation_roles && array['federation_president','cto']
     from profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

-- 既存ポリシー・RPCをfederation_rolesベースに置き換え
drop policy if exists "staff read all profiles" on profiles;
create policy "staff read all profiles" on profiles
  for select using (has_admin_page_access());

drop policy if exists "staff manage billing" on organization_billing;
create policy "staff manage billing" on organization_billing
  for all using (has_admin_page_access());

create or replace function approve_membership(p_organization_id uuid)
returns void as $$
begin
  if not has_admin_page_access() then raise exception '権限がありません'; end if;
  update organizations set membership_status = 'member', membership_approved_at = now()
  where id = p_organization_id and membership_status = 'applied';
end;
$$ language plpgsql security definer;

create or replace function admin_promote_all_grades()
returns void as $$
begin
  if not has_admin_page_access() then raise exception '権限がありません'; end if;

  update affiliations a set grade_at_time = p.grade
  from profiles p where a.user_id = p.id and a.ended_on is null;

  update profiles p set needs_reaffiliation = true
  from schools s
  where p.school_id = s.id and p.status = 'student' and s.school_type = '中学' and p.grade = 3;

  update affiliations a set ended_on = current_date
  from profiles p join schools s on s.id = p.school_id
  where a.user_id = p.id and a.ended_on is null and p.status = 'student'
    and ((s.school_type = '高校' and p.grade = 3) or (s.school_type = '中等教育学校' and p.grade = 6) or (s.school_type = '高等専門学校' and p.grade = 5));

  update profiles p set status = 'alumni'
  from schools s
  where p.school_id = s.id and p.status = 'student'
    and ((s.school_type = '高校' and p.grade = 3) or (s.school_type = '中等教育学校' and p.grade = 6) or (s.school_type = '高等専門学校' and p.grade = 5));

  update profiles p set grade = p.grade + 1
  from schools s
  where p.school_id = s.id and p.status = 'student'
    and not ((s.school_type = '高校' and p.grade = 3) or (s.school_type = '中等教育学校' and p.grade = 6) or (s.school_type = '高等専門学校' and p.grade = 5) or (s.school_type = '中学' and p.grade = 3));
end;
$$ language plpgsql security definer;

create or replace function admin_issue_invoices(p_fiscal_year int, p_amount int)
returns void as $$
begin
  if not has_admin_page_access() then raise exception '権限がありません'; end if;
  insert into organization_billing (organization_id, fiscal_year, amount, status, invoiced_at)
  select id, p_fiscal_year, p_amount, 'invoiced', now()
  from organizations where membership_status = 'member'
  on conflict (organization_id, fiscal_year) do nothing;
end;
$$ language plpgsql security definer;

create or replace function admin_deactivate_overdue(p_fiscal_year int)
returns void as $$
begin
  if not has_admin_page_access() then raise exception '権限がありません'; end if;
  update organization_billing set status = 'overdue'
  where fiscal_year = p_fiscal_year and status = 'invoiced' and invoiced_at < now() - interval '90 days';
  update organizations set membership_status = 'inactive'
  where id in (select organization_id from organization_billing where fiscal_year = p_fiscal_year and status = 'overdue');
end;
$$ language plpgsql security definer;

-- 役職の付与・剥奪（連盟長・最高技術責任者のみ実行可、自分自身は変更不可）
drop function if exists set_admin_access(uuid, boolean);
create or replace function set_user_role(p_user_id uuid, p_role text, p_grant boolean)
returns void as $$
begin
  if not can_manage_roles() then raise exception '権限がありません'; end if;
  if p_user_id = auth.uid() then raise exception '自分自身の役職は変更できません'; end if;
  if p_role not in ('member','federation_president','admin','staff','engineer','cto') then
    raise exception '不正な役職です';
  end if;

  if p_grant then
    update profiles set federation_roles = array(select distinct unnest(federation_roles || array[p_role]))
    where id = p_user_id;
  else
    update profiles set federation_roles = array(select unnest(federation_roles) except select p_role)
    where id = p_user_id;
  end if;
end;
$$ language plpgsql security definer;

-- 新規登録時の自動昇格をfederation_rolesベースに変更
create or replace function auto_assign_super_admin()
returns trigger as $$
declare
  target_email text;
begin
  select email into target_email from auth.users where id = new.id;
  if target_email = 'astro.root.quiz@gmail.com' then
    new.federation_roles := array['federation_president','cto','admin'];
  end if;
  return new;
end;
$$ language plpgsql security definer;

alter table profiles drop column if exists is_staff;
alter table profiles drop column if exists is_super_admin;

-- organization_stats: 都道府県・住所・加盟状況を追加（列順を保つためdrop→create）
drop view if exists organization_stats;
create view organization_stats as
select
  o.id as organization_id,
  o.name,
  s.name as school_name,
  count(p.id) filter (where p.status = 'student') as member_count,
  count(p.id) filter (where p.status = 'student' and p.gender = 'male') as male_count,
  count(p.id) filter (where p.status = 'student' and p.gender = 'female') as female_count,
  (select p2.handle_name from profiles p2 where p2.organization_id = o.id and p2.role = 'captain' and p2.status = 'student' limit 1) as captain_name,
  o.membership_status,
  s.prefecture,
  s.address
from organizations o
left join schools s on s.id = o.school_id
left join profiles p on p.organization_id = o.id
group by o.id, o.name, s.name, o.membership_status, s.prefecture, s.address;

-- お知らせ
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
alter table announcements enable row level security;
create policy "public read published announcements" on announcements
  for select using (status = 'published');
create policy "admin manage announcements" on announcements
  for all using (has_admin_page_access());

-- 問い合わせ
create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'new' check (status in ('new','in_progress','resolved')),
  created_at timestamptz default now()
);
alter table inquiries enable row level security;
create policy "anyone can submit inquiry" on inquiries
  for insert with check (true);
create policy "admin manage inquiries" on inquiries
  for select using (has_admin_page_access());
create policy "admin update inquiries" on inquiries
  for update using (has_admin_page_access());
