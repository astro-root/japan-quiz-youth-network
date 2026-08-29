alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('member','captain','vice_captain','advisor','alumni_member','staff','super_admin'));

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'staff read all profiles'
  ) then
    create policy "staff read all profiles" on profiles
      for select using (
        exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('staff','super_admin'))
      );
  end if;
end $$;
