'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { REGIONS } from '@/lib/regions'

type School = { id: string; name: string; prefecture: string; school_type: string }

const SCHOOL_TYPES = ['中学', '高校', '中等教育学校', '高等専門学校']

const GRADE_RANGE: Record<string, number[]> = {
  '中学': [1, 2, 3],
  '高校': [1, 2, 3],
  '中等教育学校': [1, 2, 3, 4, 5, 6],
  '高等専門学校': [1, 2, 3, 4, 5],
}

const ROLE_HINT: Record<string, string> = {
  member: '通常の部員として登録します。迷ったらこちらを選んでください。',
  captain: '部の代表者です。登録後、マイページから連盟への加盟申請ができるようになります。',
  vice_captain: '部長を補佐する立場です。加盟申請の権限はありません。',
  advisor: '部活動顧問の先生です。部長と同様に、登録後マイページから連盟への加盟申請ができます。',
}

export default function Register() {
  const supabase = createClient()
  const [region, setRegion] = useState('')
  const [prefecture, setPrefecture] = useState('')
  const [schoolType, setSchoolType] = useState('')
  const [schoolQuery, setSchoolQuery] = useState('')
  const [schools, setSchools] = useState<School[]>([])
  const [schoolId, setSchoolId] = useState('')
  const [selectedSchoolLabel, setSelectedSchoolLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '',
    lastName: '', firstName: '', lastNameKana: '', firstNameKana: '',
    handleName: '', birthday: '', gender: 'no_answer', grade: '1', role: 'member',
  })

  async function searchSchools(q: string) {
    setSchoolQuery(q)
    setSchoolId('')
    if (!prefecture || !schoolType) return setSchools([])
    const { data } = await supabase.from('schools')
      .select('id,name,prefecture,school_type')
      .eq('prefecture', prefecture)
      .eq('school_type', schoolType)
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(20)
    setSchools(data ?? [])
  }

  function handleSchoolTypeChange(t: string) {
    setSchoolType(t)
    setSchoolQuery('')
    setSchools([])
    setSchoolId('')
    setForm(f => ({ ...f, grade: '1' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!schoolId) return alert('学校名を検索し、候補から選択してください')
    setSubmitting(true)

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email, password: form.password,
    })
    if (signUpError || !signUpData.user) {
      setSubmitting(false)
      return alert(`登録に失敗しました: ${signUpError?.message ?? '不明なエラー'}`)
    }

    if (!signUpData.session) {
      setSubmitting(false)
      alert('確認メールを送信しました。メール内のリンクからログインし直してから、もう一度この画面でプロフィールを入力してください。')
      window.location.href = '/login'
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: signUpData.user.id,
      last_name: form.lastName,
      first_name: form.firstName,
      last_name_kana: form.lastNameKana,
      first_name_kana: form.firstNameKana,
      handle_name: form.handleName,
      birthday: form.birthday,
      gender: form.gender,
      grade: Number(form.grade),
      role: form.role,
      school_id: schoolId,
    })

    setSubmitting(false)

    if (profileError) {
      alert(`プロフィールの保存に失敗しました: ${profileError.message}\nお手数ですがログイン後もう一度お試しください。`)
      window.location.href = '/login'
      return
    }

    window.location.href = '/mypage'
  }

  const gradeOptions = schoolType ? GRADE_RANGE[schoolType] : [1, 2, 3]

  return (
    <main className="page-container">
      <div className="page-narrow">
        <p className="eyebrow mb-2">Join</p>
        <h1 className="page-title mb-2">新規登録</h1>
        <p className="mb-8 text-sm text-ink/70">
          個人としての会員登録フォームです。下記の1〜4をすべて入力し、一番下の「登録する」ボタンを押してください。
          すべての項目が必須です。所属団体（クイズ研究部）は、選択した学校をもとに自動で紐づきます。
        </p>

        <form onSubmit={handleSubmit} className="space-y-9">
          <section className="space-y-3">
            <h2 className="font-display text-sm font-bold text-navy">1. ログイン情報</h2>
            <div>
              <label className="field-label" htmlFor="email">メールアドレス</label>
              <input id="email" placeholder="example@school.ac.jp" type="email" required
                onChange={e => setForm({ ...form, email: e.target.value })} className="input-base" />
            </div>
            <div>
              <label className="field-label" htmlFor="password">パスワード</label>
              <input id="password" placeholder="8文字以上を推奨します" type="password" required
                onChange={e => setForm({ ...form, password: e.target.value })} className="input-base" />
              <p className="mt-1 text-xs text-ink/40">今後ログインする際に使用します。忘れないよう保管してください。</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-sm font-bold text-navy">2. 本人情報</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">姓</label>
                <input placeholder="例: 山田" required
                  onChange={e => setForm({ ...form, lastName: e.target.value })} className="input-base" />
              </div>
              <div>
                <label className="field-label">名</label>
                <input placeholder="例: 太郎" required
                  onChange={e => setForm({ ...form, firstName: e.target.value })} className="input-base" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">せい（ふりがな）</label>
                <input placeholder="例: やまだ" required
                  onChange={e => setForm({ ...form, lastNameKana: e.target.value })} className="input-base" />
              </div>
              <div>
                <label className="field-label">めい（ふりがな）</label>
                <input placeholder="例: たろう" required
                  onChange={e => setForm({ ...form, firstNameKana: e.target.value })} className="input-base" />
              </div>
            </div>
            <div>
              <label className="field-label">ハンドルネーム</label>
              <input placeholder="大会結果や連盟のページに表示される名前です" required
                onChange={e => setForm({ ...form, handleName: e.target.value })} className="input-base" />
            </div>
            <div>
              <label className="field-label">生年月日</label>
              <input type="date" required
                onChange={e => setForm({ ...form, birthday: e.target.value })} className="input-base" />
            </div>
            <div>
              <label className="field-label">性別</label>
              <select onChange={e => setForm({ ...form, gender: e.target.value })} className="input-base">
                <option value="no_answer">回答しない</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
              </select>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-sm font-bold text-navy">3. 学校情報</h2>
            <p className="text-xs text-ink/50">地域 → 都道府県 → 学校種の順に選ぶと、学校名の候補が絞り込まれます。</p>
            <div>
              <label className="field-label">地域</label>
              <select value={region} required
                onChange={e => { setRegion(e.target.value); setPrefecture(''); handleSchoolTypeChange('') }}
                className="input-base">
                <option value="">地域を選択</option>
                {Object.keys(REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {region && (
              <div>
                <label className="field-label">都道府県</label>
                <select value={prefecture} required
                  onChange={e => { setPrefecture(e.target.value); handleSchoolTypeChange('') }}
                  className="input-base">
                  <option value="">都道府県を選択</option>
                  {REGIONS[region].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            {prefecture && (
              <div>
                <label className="field-label">学校種</label>
                <select value={schoolType} required
                  onChange={e => handleSchoolTypeChange(e.target.value)}
                  className="input-base">
                  <option value="">学校種を選択</option>
                  {SCHOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            {prefecture && schoolType && (
              <div className="relative">
                <label className="field-label">学校名</label>
                <input placeholder="学校名の一部を入力して検索" value={schoolQuery}
                  onChange={e => searchSchools(e.target.value)} className="input-base" />
                {schools.length > 0 && (
                  <ul className="absolute z-10 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-white shadow-lg">
                    {schools.map(s => (
                      <li key={s.id} className="cursor-pointer p-2 hover:bg-paper"
                        onClick={() => {
                          setSchoolId(s.id)
                          setSelectedSchoolLabel(s.name)
                          setSchoolQuery(s.name)
                          setSchools([])
                        }}>
                        {s.name}
                      </li>
                    ))}
                  </ul>
                )}
                {schoolId
                  ? <p className="mt-1 text-xs text-akane">選択中: {selectedSchoolLabel}</p>
                  : <p className="mt-1 text-xs text-ink/40">候補が表示されない場合は、学校名の表記（漢字/かな）を変えてお試しください。</p>}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-sm font-bold text-navy">4. 部活動での立場</h2>
            <div>
              <label className="field-label">学年</label>
              <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="input-base">
                {gradeOptions.map(g => <option key={g} value={g}>{g}年生</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">部内の役職</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-base">
                <option value="member">部員</option>
                <option value="captain">部長</option>
                <option value="vice_captain">副部長</option>
                <option value="advisor">顧問</option>
              </select>
              <p className="mt-1 text-xs text-ink/50">{ROLE_HINT[form.role]}</p>
            </div>
          </section>

          <button disabled={submitting} className="btn-primary w-full">
            {submitting ? '登録中...' : '登録する'}
          </button>
        </form>
      </div>
    </main>
  )
}
