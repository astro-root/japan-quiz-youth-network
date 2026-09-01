-- ============================================================================
-- 0017_security_hardening.sql
-- Quiz-Youth 改善点まとめ（2026-09-01）対応
-- ============================================================================

-- ============================================================================
-- 1-3. profiles の全列公開ポリシーを廃止し、限定列のviewに置き換える
--
-- 修正版の注記:
--   改善点まとめ側の記載は「security_invoker 付きの view」だが、これは逆効果。
--   security_invoker を付けると、view を実行するロール（この場合 anon）自身の
--   RLS がそのまま適用されるため、profiles 側の公開ポリシーを削除した後は
--   anon から 0 件しか返らなくなり、運営体制ページ自体が表示できなくなる。
--   ここでは view をテーブル所有者権限（デフォルト = security_invoker なし）
--   で作成し、露出する列を id / handle_name / federation_roles の3列のみに
--   限定することで、行単位ポリシーではなく列単位でPIIを遮断する。
-- ============================================================================
drop policy if exists "public read federation roles" on profiles;

drop view if exists public_federation_roles;
create view public_federation_roles as
select id, handle_name, federation_roles
from profiles
where federation_roles <> array['member']::text[];

grant select on public_federation_roles to anon, authenticated;

-- ============================================================================
-- 1-1. 学校所属・部内役職の自己申告なりすまし対策
--
-- 方針:
--   captain / advisor への昇格を「即時反映」ではなく「運営レビュー待ちの申請」
--   に変換する。組織の verified フラグは、運営（federation_president /
--   admin / cto）による admin_approve_role_request() 経由でのみ true になる。
-- ============================================================================

-- 自己申告のroleだけでverified=trueにしていた旧トリガーを廃止
drop trigger if exists trg_auto_verify_organization on profiles;
drop function if exists auto_verify_organization();

alter table profiles add column if not exists requested_role text
  check (requested_role in ('captain','advisor'));
alter table profiles add column if not exists requested_role_at timestamptz;

create or replace function handle_role_promotion_request()
returns trigger as $$
begin
  -- 運営（has_admin_page_access）による変更はそのまま通す
  if has_admin_page_access() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role in ('captain','advisor') then
      new.requested_role := new.role;
      new.requested_role_at := now();
      new.role := 'member';
    end if;
    return new;
  end if;

  -- tg_op = 'UPDATE'
  if new.role in ('captain','advisor') and new.role is distinct from old.role then
    new.requested_role := new.role;
    new.requested_role_at := now();
    new.role := old.role;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_handle_role_promotion_request on profiles;
create trigger trg_handle_role_promotion_request
  before insert or update on profiles
  for each row execute function handle_role_promotion_request();

-- 運営が申請を承認する（役職を確定し、団体を確認済みにする）
create or replace function admin_approve_role_request(p_user_id uuid)
returns void as $$
declare
  v_role text;
  v_org_id uuid;
begin
  if not has_admin_page_access() then
    raise exception '権限がありません';
  end if;

  select requested_role, organization_id into v_role, v_org_id
  from profiles where id = p_user_id;

  if v_role is null then
    raise exception '承認待ちの申請がありません';
  end if;

  update profiles
  set role = v_role, requested_role = null, requested_role_at = null
  where id = p_user_id;

  if v_org_id is not null then
    update organizations
    set verified = true,
        verified_by = coalesce(verified_by, auth.uid()),
        verified_at = coalesce(verified_at, now())
    where id = v_org_id and verified = false;
  end if;
end;
$$ language plpgsql security definer;

-- 運営が申請を却下する
create or replace function admin_reject_role_request(p_user_id uuid)
returns void as $$
begin
  if not has_admin_page_access() then
    raise exception '権限がありません';
  end if;
  update profiles set requested_role = null, requested_role_at = null where id = p_user_id;
end;
$$ language plpgsql security definer;

-- 運営向け: 承認待ち一覧（メールアドレスは含めない）
create or replace function admin_list_role_requests()
returns table (
  id uuid,
  handle_name text,
  last_name text,
  first_name text,
  requested_role text,
  requested_role_at timestamptz,
  school_name text,
  organization_id uuid
) as $$
  select p.id, p.handle_name, p.last_name, p.first_name,
         p.requested_role, p.requested_role_at, s.name, p.organization_id
  from profiles p
  left join schools s on s.id = p.school_id
  where has_admin_page_access() and p.requested_role is not null
  order by p.requested_role_at;
$$ language sql security definer stable;

-- organization_stats: captain_name / member_count 等は
-- 「確認済み(verified) かつ 加盟団体(membership_status='member')」のみ表示する
drop view if exists organization_stats;
create view organization_stats as
select
  o.id as organization_id,
  o.name,
  s.name as school_name,
  case when o.verified and o.membership_status = 'member'
    then count(p.id) filter (where p.status = 'student')
    else 0 end as member_count,
  case when o.verified and o.membership_status = 'member'
    then count(p.id) filter (where p.status = 'student' and p.gender = 'male')
    else 0 end as male_count,
  case when o.verified and o.membership_status = 'member'
    then count(p.id) filter (where p.status = 'student' and p.gender = 'female')
    else 0 end as female_count,
  case when o.verified and o.membership_status = 'member' then (
    select jsonb_object_agg(g.grade, g.cnt)
    from (
      select grade, count(*) as cnt
      from profiles
      where organization_id = o.id and status = 'student'
      group by grade
    ) g
  ) else null end as grade_counts,
  case when o.verified and o.membership_status = 'member' then (
    select p2.handle_name from profiles p2
    where p2.organization_id = o.id and p2.role = 'captain' and p2.status = 'student'
    limit 1
  ) else null end as captain_name,
  o.membership_status,
  o.verified,
  s.prefecture,
  s.address
from organizations o
left join schools s on s.id = o.school_id
left join profiles p on p.organization_id = o.id
group by o.id, o.name, s.name, o.membership_status, o.verified, s.prefecture, s.address;

-- ============================================================================
-- 1-2. セルフサービス大会に運営承認フローを追加
-- ============================================================================
alter table tournaments drop constraint if exists tournaments_status_check;
alter table tournaments add constraint tournaments_status_check
  check (status in ('draft','pending_review','recruiting','closed'));

alter table tournaments add column if not exists is_official boolean not null default false;

create or replace function enforce_tournament_review()
returns trigger as $$
begin
  if has_admin_page_access() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_official := false;
    if new.status = 'recruiting' then
      new.status := 'pending_review';
    end if;
  else
    new.is_official := old.is_official;
    if new.status = 'recruiting' and new.status is distinct from old.status then
      new.status := 'pending_review';
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_enforce_tournament_review on tournaments;
create trigger trg_enforce_tournament_review
  before insert or update on tournaments
  for each row execute function enforce_tournament_review();

create or replace function admin_approve_tournament(p_tournament_id uuid, p_official boolean default false)
returns void as $$
begin
  if not has_admin_page_access() then
    raise exception '権限がありません';
  end if;
  update tournaments set status = 'recruiting', is_official = p_official where id = p_tournament_id;
end;
$$ language plpgsql security definer;

create or replace function admin_reject_tournament(p_tournament_id uuid)
returns void as $$
begin
  if not has_admin_page_access() then
    raise exception '権限がありません';
  end if;
  update tournaments set status = 'draft' where id = p_tournament_id;
end;
$$ language plpgsql security definer;

-- エントリーフォームのカスタム質問を運営許可のテンプレート範囲に制限する
-- （管理者が作成する大会は対象外。lib/entryTemplates.ts の templateKey と一致させること）
create or replace function restrict_self_service_questions()
returns trigger as $$
declare
  allowed_keys text[] := array[
    'last_name','first_name','last_name_kana','first_name_kana',
    'handle_name','handle_name_kana','email','name_usage_consent','contact'
  ];
begin
  if has_admin_page_access() then
    return new;
  end if;
  if new.template_key is null or not (new.template_key = any(allowed_keys)) then
    raise exception '運営が許可したテンプレート項目のみ追加できます';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_restrict_self_service_questions on entry_form_questions;
create trigger trg_restrict_self_service_questions
  before insert or update on entry_form_questions
  for each row execute function restrict_self_service_questions();

-- ============================================================================
-- 1-4. entries.answers のサーバー側スキーマ検証
-- ============================================================================
create or replace function validate_entry_answers()
returns trigger as $$
declare
  v_unknown_count int;
  v_missing_required int;
begin
  select count(*) into v_unknown_count
  from jsonb_object_keys(new.answers) as k
  where not exists (
    select 1 from entry_form_questions q
    where q.tournament_id = new.tournament_id and q.id::text = k
  );
  if v_unknown_count > 0 then
    raise exception '不正な設問キーが含まれています';
  end if;

  select count(*) into v_missing_required
  from entry_form_questions q
  where q.tournament_id = new.tournament_id
    and q.required = true
    and (
      not (new.answers ? q.id::text)
      or new.answers -> q.id::text = 'null'::jsonb
      or new.answers ->> q.id::text = ''
      or (
        jsonb_typeof(new.answers -> q.id::text) = 'array'
        and jsonb_array_length(new.answers -> q.id::text) = 0
      )
    );
  if v_missing_required > 0 then
    raise exception '必須項目が未入力です';
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_validate_entry_answers on entries;
create trigger trg_validate_entry_answers
  before insert or update on entries
  for each row execute function validate_entry_answers();

-- ============================================================================
-- 3. 監査ログ: role / federation_roles / school_id / banned の変更履歴
-- ============================================================================
create table if not exists profile_change_audit (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid references profiles(id) on delete set null,
  changed_by uuid references profiles(id) on delete set null,
  field text not null,
  old_value text,
  new_value text,
  changed_at timestamptz not null default now()
);
alter table profile_change_audit enable row level security;
drop policy if exists "admin read audit log" on profile_change_audit;
create policy "admin read audit log" on profile_change_audit
  for select using (has_admin_page_access());

create or replace function log_profile_privilege_changes()
returns trigger as $$
begin
  if new.role is distinct from old.role then
    insert into profile_change_audit (target_user_id, changed_by, field, old_value, new_value)
    values (new.id, auth.uid(), 'role', old.role, new.role);
  end if;
  if new.federation_roles is distinct from old.federation_roles then
    insert into profile_change_audit (target_user_id, changed_by, field, old_value, new_value)
    values (new.id, auth.uid(), 'federation_roles',
            array_to_string(old.federation_roles, ','), array_to_string(new.federation_roles, ','));
  end if;
  if new.school_id is distinct from old.school_id then
    insert into profile_change_audit (target_user_id, changed_by, field, old_value, new_value)
    values (new.id, auth.uid(), 'school_id', old.school_id::text, new.school_id::text);
  end if;
  if new.banned is distinct from old.banned then
    insert into profile_change_audit (target_user_id, changed_by, field, old_value, new_value)
    values (new.id, auth.uid(), 'banned', old.banned::text, new.banned::text);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_log_profile_privilege_changes on profiles;
create trigger trg_log_profile_privilege_changes
  after update on profiles
  for each row execute function log_profile_privilege_changes();
