alter table organizations add column if not exists verified boolean not null default false;
alter table organizations add column if not exists created_by uuid references profiles(id);
alter table organizations add column if not exists verified_by uuid references profiles(id);
alter table organizations add column if not exists verified_at timestamptz;
alter table organizations add column if not exists membership_status text not null default 'unclaimed'
  check (membership_status in ('unclaimed','applied','member','inactive'));
alter table organizations add column if not exists membership_applied_at timestamptz;
alter table organizations add column if not exists membership_approved_at timestamptz;

create or replace function auto_verify_organization()
returns trigger as $$
begin
  if new.role in ('captain','advisor') and new.organization_id is not null then
    update organizations
    set verified = true,
        verified_by = coalesce(verified_by, new.id),
        verified_at = coalesce(verified_at, now())
    where id = new.organization_id and verified = false;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_auto_verify_organization on profiles;
create trigger trg_auto_verify_organization
  after insert or update of role, organization_id on profiles
  for each row execute function auto_verify_organization();

create or replace function apply_for_membership(p_organization_id uuid)
returns void as $$
declare
  caller_role text;
  caller_org uuid;
  org_verified boolean;
begin
  select role, organization_id into caller_role, caller_org
  from profiles where id = auth.uid();

  if caller_org is null or caller_org != p_organization_id then
    raise exception '自分の所属団体以外は申請できません';
  end if;

  if caller_role not in ('captain','advisor') then
    raise exception '部長または顧問のみ申請できます';
  end if;

  select verified into org_verified from organizations where id = p_organization_id;
  if not org_verified then
    raise exception '代表者が未確定の団体は申請できません';
  end if;

  update organizations
  set membership_status = 'applied', membership_applied_at = now()
  where id = p_organization_id and membership_status = 'unclaimed';
end;
$$ language plpgsql security definer;

create or replace function approve_membership(p_organization_id uuid)
returns void as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'staff') then
    raise exception '権限がありません';
  end if;

  update organizations
  set membership_status = 'member', membership_approved_at = now()
  where id = p_organization_id and membership_status = 'applied';
end;
$$ language plpgsql security definer;
