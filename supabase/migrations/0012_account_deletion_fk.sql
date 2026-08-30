do $$
declare cname text; col_num smallint;
begin
  select attnum into col_num from pg_attribute where attrelid = 'affiliations'::regclass and attname = 'user_id';
  select conname into cname from pg_constraint
    where conrelid = 'affiliations'::regclass and confrelid = 'profiles'::regclass and contype = 'f' and col_num = any(conkey);
  if cname is not null then execute format('alter table affiliations drop constraint %I', cname); end if;
end $$;
alter table affiliations add constraint affiliations_user_id_fkey foreign key (user_id) references profiles(id) on delete set null;

do $$
declare cname text; col_num smallint;
begin
  select attnum into col_num from pg_attribute where attrelid = 'organizations'::regclass and attname = 'created_by';
  select conname into cname from pg_constraint
    where conrelid = 'organizations'::regclass and confrelid = 'profiles'::regclass and contype = 'f' and col_num = any(conkey);
  if cname is not null then execute format('alter table organizations drop constraint %I', cname); end if;
end $$;
alter table organizations add constraint organizations_created_by_fkey foreign key (created_by) references profiles(id) on delete set null;

do $$
declare cname text; col_num smallint;
begin
  select attnum into col_num from pg_attribute where attrelid = 'organizations'::regclass and attname = 'verified_by';
  select conname into cname from pg_constraint
    where conrelid = 'organizations'::regclass and confrelid = 'profiles'::regclass and contype = 'f' and col_num = any(conkey);
  if cname is not null then execute format('alter table organizations drop constraint %I', cname); end if;
end $$;
alter table organizations add constraint organizations_verified_by_fkey foreign key (verified_by) references profiles(id) on delete set null;

do $$
declare cname text; col_num smallint;
begin
  select attnum into col_num from pg_attribute where attrelid = 'announcements'::regclass and attname = 'created_by';
  select conname into cname from pg_constraint
    where conrelid = 'announcements'::regclass and confrelid = 'profiles'::regclass and contype = 'f' and col_num = any(conkey);
  if cname is not null then execute format('alter table announcements drop constraint %I', cname); end if;
end $$;
alter table announcements add constraint announcements_created_by_fkey foreign key (created_by) references profiles(id) on delete set null;

-- 公開の運営体制ページ用: member以外の役職を持つ人は誰でも閲覧可
create policy "public read federation roles" on profiles
  for select using (federation_roles != array['member']::text[]);
