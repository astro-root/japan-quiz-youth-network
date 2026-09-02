-- ============================================================================
-- 0018_relax_entry_and_tournament_review.sql
-- 大会の運営承認制、およびエントリーフォーム質問項目のテンプレート固定を廃止する
-- （0017_security_hardening.sql の一部を撤回）
-- ============================================================================

-- ------------------------------------------------------------------
-- 大会の運営承認制を廃止する
-- ------------------------------------------------------------------

-- 承認待ちのまま止まっている大会があれば、募集中に戻しておく
update tournaments set status = 'recruiting' where status = 'pending_review';

drop trigger if exists trg_enforce_tournament_review on tournaments;
drop function if exists enforce_tournament_review();

drop function if exists admin_approve_tournament(uuid, boolean);
drop function if exists admin_reject_tournament(uuid);

alter table tournaments drop column if exists is_official;

alter table tournaments drop constraint if exists tournaments_status_check;
alter table tournaments add constraint tournaments_status_check
  check (status in ('draft','recruiting','closed'));

-- ------------------------------------------------------------------
-- エントリーフォーム質問項目のテンプレート固定を廃止する
-- ------------------------------------------------------------------
drop trigger if exists trg_restrict_self_service_questions on entry_form_questions;
drop function if exists restrict_self_service_questions();
