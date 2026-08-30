-- SECURITY DEFINERでprofilesのRLSをバイパスして自分の権限だけ調べる関数
-- （ポリシー内からこの関数を呼んでも、関数自体はRLSの外で実行されるため再帰しない）
create or replace function is_current_user_staff()
returns boolean as $$
  select coalesce(
    (select is_staff or is_super_admin from profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;

drop policy if exists "staff read all profiles" on profiles;
create policy "staff read all profiles" on profiles
  for select using (is_current_user_staff());
