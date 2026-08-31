-- エントリーフォーム（大会）の作成を、マイページ登録者なら誰でもできるようにする

-- 自分が作成した大会は、下書き中も含めて自分自身で閲覧・編集・削除できる
create policy "owners manage own tournaments" on tournaments
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

-- 自分の大会の質問項目は自分で管理できる
create policy "owners manage own tournament questions" on entry_form_questions
  for all using (
    exists (select 1 from tournaments t where t.id = tournament_id and t.created_by = auth.uid())
  ) with check (
    exists (select 1 from tournaments t where t.id = tournament_id and t.created_by = auth.uid())
  );

-- 自分の大会に届いたエントリーは自分で閲覧できる
create policy "owners read entries of own tournaments" on entries
  for select using (
    exists (select 1 from tournaments t where t.id = tournament_id and t.created_by = auth.uid())
  );
