-- 参加者管理の拡張: メールアドレス閲覧・アカウントBAN・加盟団体削除・団体一覧の学年別人数

-- ------------------------------------------------------------------
-- 0. 既存の抜け穴を修正
-- 「self read/write profile」ポリシーは列を区別しないため、
-- 一般ユーザーが自分自身のfederation_rolesやbannedを直接書き換えて
-- 権限昇格・BAN解除できてしまう状態だった。トリガーで無効化する。
-- ------------------------------------------------------------------
create or replace function prevent_self_privilege_escalation()
returns trigger as $$
begin
  if not has_admin_page_access() then
    if new.federation_roles is distinct from old.federation_roles then
      new.federation_roles := old.federation_roles;
    end if;
    if new.banned is distinct from old.banned then
      new.banned := old.banned;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------------
-- 1. BANステータス
-- ------------------------------------------------------------------
alter table profiles add column if not exists banned boolean not null default false;

drop trigger if exists trg_prevent_self_privilege_escalation on profiles;
create trigger trg_prevent_self_privilege_escalation
before update on profiles
for each row execute function prevent_self_privilege_escalation();

create or replace function admin_set_banned(p_user_id uuid, p_banned boolean)
returns void as $$
begin
  if not has_admin_page_access() then raise exception '権限がありません'; end if;
  if p_user_id = auth.uid() then raise exception '自分自身はBANできません'; end if;

  update auth.users set banned_until = case when p_banned then 'infinity'::timestamptz else null end
  where id = p_user_id;

  update profiles set banned = p_banned where id = p_user_id;
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------------
-- 2. 管理者向け: メールアドレス付きの参加者一覧・個別取得
-- （auth.usersはクライアントから直接読めないため、管理者判定込みの関数で仲介する）
-- ------------------------------------------------------------------
create or replace function admin_list_profiles()
returns table (
  id uuid,
  last_name text,
  first_name text,
  handle_name text,
  email text,
  federation_roles text[],
  banned boolean,
  school_name text
) as $$
  select p.id, p.last_name, p.first_name, p.handle_name, u.email, p.federation_roles, p.banned, s.name
  from profiles p
  left join auth.users u on u.id = p.id
  left join schools s on s.id = p.school_id
  where has_admin_page_access()
  order by p.last_name;
$$ language sql security definer stable;

create or replace function admin_get_profile_email(p_user_id uuid)
returns text as $$
  select case when has_admin_page_access() then u.email else null end
  from auth.users u where u.id = p_user_id;
$$ language sql security definer stable;

-- ------------------------------------------------------------------
-- 3. 加盟団体の削除（所属していた会員は「未所属」に戻す）
-- ------------------------------------------------------------------
create or replace function admin_delete_organization(p_organization_id uuid)
returns void as $$
begin
  if not has_admin_page_access() then raise exception '権限がありません'; end if;
  update profiles set organization_id = null where organization_id = p_organization_id;
  delete from organization_billing where organization_id = p_organization_id;
  delete from organizations where id = p_organization_id;
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------------
-- 4. 団体一覧: 男女比の代わりに学年別人数を返す
-- ------------------------------------------------------------------
drop view if exists organization_stats;
create view organization_stats as
select
  o.id as organization_id,
  o.name,
  s.name as school_name,
  count(p.id) filter (where p.status = 'student') as member_count,
  count(p.id) filter (where p.status = 'student' and p.gender = 'male') as male_count,
  count(p.id) filter (where p.status = 'student' and p.gender = 'female') as female_count,
  (
    select jsonb_object_agg(g.grade, g.cnt)
    from (
      select grade, count(*) as cnt
      from profiles
      where organization_id = o.id and status = 'student'
      group by grade
    ) g
  ) as grade_counts,
  (select p2.handle_name from profiles p2 where p2.organization_id = o.id and p2.role = 'captain' and p2.status = 'student' limit 1) as captain_name,
  o.membership_status,
  s.prefecture,
  s.address
from organizations o
left join schools s on s.id = o.school_id
left join profiles p on p.organization_id = o.id
group by o.id, o.name, s.name, o.membership_status, s.prefecture, s.address;
