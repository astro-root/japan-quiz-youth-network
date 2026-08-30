-- ============================================================
-- 不具合修正: 加盟申請ボタンが表示されない
--
-- 原因: 新規登録時にprofiles.organization_idを設定する処理が
-- どこにも実装されておらず、organizationsの行も自動作成されて
-- いなかった。そのためマイページ側の「org &&」の条件が常にfalse
-- となり、部長・顧問であっても加盟申請ボタンが出ない状態だった。
-- ============================================================

-- 1. 既存の重複するorganizations（同一school_idが複数）を1件に統合する
--    （本来発生しないはずだが、手動作成分があれば整理しておく）
with keep as (
  select school_id, min(id) as keep_id
  from organizations
  where school_id is not null
  group by school_id
)
update profiles p
set organization_id = k.keep_id
from organizations o
join keep k on k.school_id = o.school_id
where p.organization_id = o.id and o.id <> k.keep_id;

with keep as (
  select school_id, min(id) as keep_id
  from organizations
  where school_id is not null
  group by school_id
)
update organization_billing b
set organization_id = k.keep_id
from organizations o
join keep k on k.school_id = o.school_id
where b.organization_id = o.id and o.id <> k.keep_id;

with keep as (
  select school_id, min(id) as keep_id
  from organizations
  where school_id is not null
  group by school_id
)
delete from organizations o
using keep k
where o.school_id = k.school_id and o.id <> k.keep_id;

-- 2. 1校につき団体は1つに制約する
alter table organizations
  add constraint organizations_school_id_unique unique (school_id);

-- 3. 学校IDから団体を取得し、無ければ作成する関数
create or replace function get_or_create_organization_for_school(p_school_id uuid)
returns uuid as $$
declare
  v_org_id uuid;
begin
  if p_school_id is null then
    return null;
  end if;

  select id into v_org_id from organizations where school_id = p_school_id;
  if v_org_id is not null then
    return v_org_id;
  end if;

  insert into organizations (school_id)
  values (p_school_id)
  on conflict (school_id) do nothing
  returning id into v_org_id;

  if v_org_id is null then
    select id into v_org_id from organizations where school_id = p_school_id;
  end if;

  return v_org_id;
end;
$$ language plpgsql security definer;

-- 4. profiles登録時・学校変更時にorganization_idを自動で割り当てる
create or replace function assign_organization_before_upsert()
returns trigger as $$
begin
  if new.school_id is not null
     and (tg_op = 'INSERT' or new.school_id is distinct from old.school_id or new.organization_id is null) then
    new.organization_id := get_or_create_organization_for_school(new.school_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_assign_organization on profiles;
create trigger trg_assign_organization
  before insert or update of school_id on profiles
  for each row execute function assign_organization_before_upsert();

-- 5. 既存プロフィールをバックフィル
--    （このUPDATEはorganization_idを更新するため、既存のトリガー
--    trg_auto_verify_organizationが連動して発火し、既に部長・顧問と
--    して登録済みのユーザーがいる団体は自動でverified=trueになる）
update profiles p
set organization_id = get_or_create_organization_for_school(p.school_id)
where p.school_id is not null and p.organization_id is null;

-- ============================================================
-- 権限追加: 管理者（admin）にも役職の付与・剥奪を許可する
-- 従来は連盟長・最高技術責任者の2役職のみに限定されていた
-- ============================================================
create or replace function can_manage_roles()
returns boolean as $$
  select coalesce(
    (select federation_roles && array['federation_president','cto','admin']
     from profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;
