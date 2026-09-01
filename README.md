# japan-quiz-youth-network（全国中高クイズ連盟サイト）

全国の中学・高校のクイズ研究部を対象とした「全国中高クイズ連盟」公式サイト。部員登録、学校・団体の連盟加盟申請、大会エントリー管理、年会費請求、お知らせ配信などを扱う。

## 技術スタック

- [Next.js 14](https://nextjs.org/)（App Router）
- React 18 / TypeScript
- [Supabase](https://supabase.com/)（Postgres + Auth + Row Level Security）
- Tailwind CSS

## ディレクトリ構成

```
app/                Next.js App Router のページ・APIルート
  admin/            管理画面（連盟長・管理者・最高技術責任者のみアクセス可）
  clubs/            団体（部活動）一覧・詳細の公開ページ
  mypage/           会員本人のマイページ・編集
  register/         新規登録
  tournaments/      大会一覧・大会エントリー・大会主催者向け管理画面
  team/             運営体制の公開ページ
lib/
  supabase/         Supabaseクライアント（server / client / middleware）
  roles.ts          連盟役職（federation_roles）の定義とラベル
  regions.ts        都道府県・地方区分
  entryTemplates.ts 大会エントリーフォームの質問テンプレート定義
supabase/migrations/ DBスキーマ・RLSポリシー・関数の変更履歴（マイグレーション）
scripts/            運営作業用のワンショットNode.jsスクリプト
middleware.ts        /admin, /mypage 配下のアクセス制御
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数

`.env.local.example` を `.env.local` にコピーし、Supabaseプロジェクトの値を設定する。

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

`scripts/` 配下のスクリプトを実行する場合は、別途以下も必要（サービスロールキーは秘匿情報。絶対にクライアント側やリポジトリに含めないこと）。

```
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. DBマイグレーションの適用

Supabase CLIでプロジェクトにリンクした上で実行する。

```bash
supabase link --project-ref <project-ref>
supabase db push
```

`supabase/migrations/` に置かれたファイルが番号順に適用される。ローカルにSupabaseスタックを立てて開発する場合は `supabase start` を使う。

### 4. 開発サーバー起動

```bash
npm run dev
```

## 権限モデル

役職には2種類ある。混同しないこと。

| 種別 | カラム | 意味 | 例 |
|---|---|---|---|
| 部内の役職 | `profiles.role` | 部活動内での立場 | `member`（部員） / `captain`（部長） / `vice_captain`（副部長） / `advisor`（顧問） / `alumni_member` |
| 連盟の役職 | `profiles.federation_roles`（配列） | サイト運営側の権限 | `member` / `federation_president`（連盟長） / `admin`（管理者） / `cto`（最高技術責任者） / `staff` / `engineer` |

管理画面（`/admin` 配下）と個人情報（会員のメールアドレス等）へのアクセスは、`federation_roles` に `federation_president` / `admin` / `cto` のいずれかを含むユーザーのみに限定している（`has_admin_page_access()` および `middleware.ts` の `ADMIN_PAGE_ROLES`）。役職の付与・剥奪自体は `federation_president` / `cto` / `admin` が `set_user_role()` RPC経由でのみ実行できる。

部長・顧問（`captain` / `advisor`）への昇格は自己申告のみでは確定しない。ユーザーが登録・編集画面で選択すると `profiles.requested_role` に「申請中」として記録され、運営が `/admin/role-requests` から内容を確認した上で承認した場合にのみ `role` が確定し、所属団体が連盟加盟申請可能な「確認済み（`verified`）」状態になる。

## 大会（トーナメント）の公開フロー

マイページ登録者であれば誰でも大会を作成できるが、`status` を `recruiting`（募集中）に直接変更することはできない。保存時にDBトリガーが自動的に `pending_review`（運営レビュー中）へ差し戻す。運営が `/admin/tournaments` から内容を確認し、承認（`admin_approve_tournament`）して初めて `/tournaments` の一覧に公開される。承認時に「公式」「ユーザー主催」の区分も設定する。

エントリーフォームの質問項目は、`lib/entryTemplates.ts` にある運営許可のテンプレート（氏名・ハンドルネーム・メールアドレス等）のみ追加できる。テンプレートにない自由記述の質問はDB側で拒否される。

## セキュリティ運用上の注意

- `profiles` テーブルには生年月日・本名・かな・性別などのPIIが含まれる。直接SELECTできるのは本人と運営3役職のみで、公開ページ（`/team`）向けには `handle_name` と `federation_roles` のみを返す `public_federation_roles` ビューを経由している。新しく公開ページを追加する際は、`profiles` を直接クライアントから読ませず、必要最小限の列だけを返すビュー・RPCを用意すること。
- 役職（`role` / `federation_roles`）・所属校（`school_id`）・BAN状態（`banned`）の変更は `profile_change_audit` テーブルに監査ログとして自動記録される（閲覧は運営3役職のみ）。不審な変更があった場合はここを確認する。
- `entries.answers`（JSONB）はDBトリガーで、対応する大会の設問に存在しないキーや、必須項目の未入力を拒否する。
- 重要な状態遷移（役職承認、大会承認、加盟承認、BAN、団体削除など）は、クライアントからのテーブル直接UPDATEではなく `SECURITY DEFINER` のRPC経由に統一している。新機能を追加する際もこの方針を踏襲すること。

過去の脆弱性の詳細と対応履歴は `supabase/migrations/0015_admin_participant_management.sql` 以降のコメント、および `0017_security_hardening.sql` を参照。

## `scripts/` について

- `scripts/import-schools.mjs`：CSVから学校マスタを一括投入する。
- `scripts/check-admin.mjs`：**要修正**。`profiles.is_staff` / `profiles.is_super_admin` を参照しているが、これらの列は `0010_roles_and_features.sql` で `federation_roles` 配列に統合され既に削除済み。現状のスキーマでは動作しない。使う場合は `federation_roles` ベースに書き換えること。
- `scripts/check-fk-name.mjs`：現状は説明メッセージを出すだけで実質的な処理を行っていない。

## デプロイ

Vercel等、Next.js App Routerに対応したホスティングを想定。環境変数（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`）をホスティング側にも設定すること。DBマイグレーションはデプロイパイプラインとは別に、`supabase db push` で明示的に適用する運用とし、コードのpushだけでは自動反映されない点に注意する。
