-- roleは「部内の役職」専用に戻し、管理者権限は別列に分離する
alter table profiles add column if not exists is_staff boolean not null default false;
alter table profiles add column if not exists is_super_admin boolean not null default false;

update profiles set is_staff = true where role = 'staff';
update profiles set is_super_admin = true where role = 'super_admin';
update profiles set role = 'member' where role in ('staff','super_admin');

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('member','captain','vice_captain','advisor','alumni_member'));

-- 氏名を姓名・かなに分割
alter table profiles add column if not exists last_name text not null default '';
alter table profiles add column if not exists first_name text not null default '';
alter table profiles add column if not exists last_name_kana text not null default '';
alter table profiles add column if not exists first_name_kana text not null default '';
alter table profiles alter column last_name drop default;
alter table profiles alter column first_name drop default;
alter table profiles alter column last_name_kana drop default;
alter table profiles alter column first_name_kana drop default;
alter table profiles drop column if exists real_name;

-- 指定メールアドレスに最高権限を自動付与
create or replace function auto_assign_super_admin()
returns trigger as $$
declare
  target_email text;
begin
  select email into target_email from auth.users where id = new.id;
  if target_email = 'astro.root.quiz@gmail.com' then
    new.is_super_admin := true;
    new.is_staff := true;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_auto_assign_super_admin on profiles;
create trigger trg_auto_assign_super_admin
  before insert on profiles
  for each row execute function auto_assign_super_admin();

-- admin権限の付与・剥奪（super_adminのみ実行可、自分自身は変更不可）
create or replace function set_admin_access(p_user_id uuid, p_grant boolean)
returns void as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_super_admin = true) then
    raise exception '権限がありません';
  end if;
  if p_user_id = auth.uid() then
    raise exception '自分自身の権限は変更できません';
  end if;
  update profiles set is_staff = p_grant where id = p_user_id and is_super_admin = false;
end;
$$ language plpgsql security definer;

-- 既存ポリシー・RPCをis_staff列に合わせて更新
drop policy if exists "staff read all profiles" on profiles;
create policy "staff read all profiles" on profiles
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and (p.is_staff = true or p.is_super_admin = true))
  );

drop policy if exists "staff manage billing" on organization_billing;
create policy "staff manage billing" on organization_billing
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_staff = true)
  );

create or replace function approve_membership(p_organization_id uuid)
returns void as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_staff = true) then
    raise exception '権限がありません';
  end if;
  update organizations
  set membership_status = 'member', membership_approved_at = now()
  where id = p_organization_id and membership_status = 'applied';
end;
$$ language plpgsql security definer;

-- これまで権限チェックが無かった3つのRPCに、is_staff必須のチェックを追加
create or replace function admin_promote_all_grades()
returns void as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_staff = true) then
    raise exception '権限がありません';
  end if;

  update affiliations a
  set grade_at_time = p.grade
  from profiles p
  where a.user_id = p.id and a.ended_on is null;

  update profiles p
  set needs_reaffiliation = true
  from schools s
  where p.school_id = s.id and p.status = 'student' and s.school_type = '中学' and p.grade = 3;

  update affiliations a
  set ended_on = current_date
  from profiles p
  join schools s on s.id = p.school_id
  where a.user_id = p.id and a.ended_on is null and p.status = 'student'
    and ((s.school_type = '高校' and p.grade = 3) or (s.school_type = '中等教育学校' and p.grade = 6) or (s.school_type = '高等専門学校' and p.grade = 5));

  update profiles p
  set status = 'alumni'
  from schools s
  where p.school_id = s.id and p.status = 'student'
    and ((s.school_type = '高校' and p.grade = 3) or (s.school_type = '中等教育学校' and p.grade = 6) or (s.school_type = '高等専門学校' and p.grade = 5));

  update profiles p
  set grade = p.grade + 1
  from schools s
  where p.school_id = s.id and p.status = 'student'
    and not ((s.school_type = '高校' and p.grade = 3) or (s.school_type = '中等教育学校' and p.grade = 6) or (s.school_type = '高等専門学校' and p.grade = 5) or (s.school_type = '中学' and p.grade = 3));
end;
$$ language plpgsql security definer;

create or replace function admin_issue_invoices(p_fiscal_year int, p_amount int)
returns void as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_staff = true) then
    raise exception '権限がありません';
  end if;
  insert into organization_billing (organization_id, fiscal_year, amount, status, invoiced_at)
  select id, p_fiscal_year, p_amount, 'invoiced', now()
  from organizations
  where membership_status = 'member'
  on conflict (organization_id, fiscal_year) do nothing;
end;
$$ language plpgsql security definer;

create or replace function admin_deactivate_overdue(p_fiscal_year int)
returns void as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_staff = true) then
    raise exception '権限がありません';
  end if;
  update organization_billing
  set status = 'overdue'
  where fiscal_year = p_fiscal_year and status = 'invoiced' and invoiced_at < now() - interval '90 days';
  update organizations
  set membership_status = 'inactive'
  where id in (select organization_id from organization_billing where fiscal_year = p_fiscal_year and status = 'overdue');
end;
$$ language plpgsql security definer;
