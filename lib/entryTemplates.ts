export type QuestionType = 'text' | 'textarea' | 'email' | 'tel' | 'radio' | 'checkbox' | 'select'

export type TemplateQuestion = {
  templateKey: string
  label: string
  questionType: QuestionType
  required: boolean
  options: string[] | null
  placeholder: string | null
}

export const TEMPLATE_QUESTIONS: TemplateQuestion[] = [
  { templateKey: 'last_name', label: '名字', questionType: 'text', required: true, options: null, placeholder: '例: 山田' },
  { templateKey: 'first_name', label: '名前', questionType: 'text', required: true, options: null, placeholder: '例: 太郎' },
  { templateKey: 'last_name_kana', label: '名字（かな）', questionType: 'text', required: true, options: null, placeholder: '例: やまだ' },
  { templateKey: 'first_name_kana', label: '名前（かな）', questionType: 'text', required: true, options: null, placeholder: '例: たろう' },
  { templateKey: 'handle_name', label: 'ハンドルネーム', questionType: 'text', required: true, options: null, placeholder: null },
  { templateKey: 'handle_name_kana', label: 'ハンドルネーム（かな）', questionType: 'text', required: true, options: null, placeholder: null },
  { templateKey: 'email', label: 'メールアドレス', questionType: 'email', required: true, options: null, placeholder: null },
  { templateKey: 'name_usage_consent', label: '本名の使用', questionType: 'checkbox', required: false, options: ['得点表示', '記録集'], placeholder: null },
  { templateKey: 'contact', label: '連絡', questionType: 'textarea', required: false, options: null, placeholder: '運営への連絡事項があればご記入ください' },
]

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  text: '一行テキスト',
  textarea: '複数行テキスト',
  email: 'メールアドレス',
  tel: '電話番号',
  radio: '単一選択',
  checkbox: '複数選択',
  select: 'プルダウン選択',
}

// ログイン中ユーザーのプロフィールから自動入力できるテンプレート項目のマッピング
export const PROFILE_PREFILL_MAP: Record<string, 'last_name' | 'first_name' | 'last_name_kana' | 'first_name_kana' | 'handle_name' | 'handle_name_kana' | 'email'> = {
  last_name: 'last_name',
  first_name: 'first_name',
  last_name_kana: 'last_name_kana',
  first_name_kana: 'first_name_kana',
  handle_name: 'handle_name',
  handle_name_kana: 'handle_name_kana',
  email: 'email',
}

// 応募時にフォームの回答をプロフィールへ書き戻すマッピング（次回以降の大会で再利用できるように）
// 本名の使用可否・連絡事項は大会ごとの内容のため書き戻さない
export const PROFILE_WRITEBACK_MAP: Record<string, string> = {
  last_name: 'last_name',
  first_name: 'first_name',
  last_name_kana: 'last_name_kana',
  first_name_kana: 'first_name_kana',
  handle_name: 'handle_name',
  handle_name_kana: 'handle_name_kana',
}
