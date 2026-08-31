'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { REGIONS } from '@/lib/regions'

type School = { id: string; name: string; prefecture: string; school_type: string }

const SCHOOL_TYPES = ['中学', '高校', '中等教育学校', '高等専門学校']

const GRADE_RANGE: Record<string, number[]> = {
  '中学': [1, 2, 3],
  '高校': [1, 2, 3],
  '中等教育学校': [1, 2, 3, 4, 5, 6],
  '高等専門学校': [1, 2, 3, 4, 5],
}

const prefectureToRegion: Record<string, string> = {}
for (const [region, prefs] of Object.entries(REGIONS)) {
  for (const p of prefs) prefectureToRegion[p] = region
}

export default function EditProfile() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [region, setRegion] = useState('')
  const [prefecture, setPrefecture] = useState('')
  const [schoolType, setSchoolType] = useState('')
  const [schoolQuery, setSchoolQuery] = useState('')
  const [schools, setSchools] = useState<School[]>([])
  const [schoolId, setSchoolId] = useState('')
  const [selectedSchoolLabel, setSelectedSchoolLabel] = useState('')

  const [form, setForm] = useState({
    lastName: '', firstName: '', lastNameKana: '', firstNameKana: '',
    handleName: '', handleNameKana: '', birthday: '', gender: 'no_answer',
    grade: '1', role: 'member',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      const { data } = await supabase.from('profiles')
        .select('last_name, first_name, last_name_kana, first_name_kana, handle_name, handle_name_kana, birthday, gender, grade, role, school_id, schools(name, prefecture, school_type)')
        .eq('id', user.id).single()
      if (data) {
        setForm({
          lastName: data.last_name, firstName: data.first_name,
          lastNameKana: data.last_name_kana, firstNameKana: data.first_name_kana,
          handleName: data.handle_name, handleNameKana: data.handle_name_kana ?? '',
          birthday: data.birthday, gender: data.gender,
          grade: String(data.grade), role: data.role,
        })
        const school = data.schools as any
        if (school) {
          setPrefecture(school.prefecture)
          setRegion(prefectureToRegion[school.prefecture] ?? '')
          setSchoolType(school.school_type)
          setSchoolId(data.school_id)
          setSelectedSchoolLabel(school.name)
          setSchoolQuery(school.name)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

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
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({
      last_name: form.lastName, first_name: form.firstName,
      last_name_kana: form.lastNameKana, first_name_kana: form.firstNameKana,
      handle_name: form.handleName, handle_name_kana: form.handleNameKana,
      birthday: form.birthday, gender: form.gender,
      grade: Number(form.grade), role: form.role,
      school_id: schoolId,
    }).eq('id', user.id)
    setSaving(false)
    if (error) return alert(error.message)
    router.push('/mypage')
  }

  if (loading) return <p className="p-12 font-mono text-sm text-ink/50">読み込み中...</p>

  const gradeOptions = schoolType ? GRADE_RANGE[schoolType] : [1, 2, 3]

  return (
    <main className="page-container">
      <div className="page-narrow">
        <p className="eyebrow mb-2">Edit</p>
        <h1 className="page-title mb-6">プロフィール編集</h1>
        <form onSubmit={handleSubmit} className="space-y-9">
          <section className="space-y-3">
            <h2 className="font-display text-sm font-bold text-navy">本人情報</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">姓</label>
                <input placeholder="姓" value={form.lastName} required
                  onChange={e => setForm({ ...form, lastName: e.target.value })} className="input-base" />
              </div>
              <div>
                <label className="field-label">名</label>
                <input placeholder="名" value={form.firstName} required
                  onChange={e => setForm({ ...form, firstName: e.target.value })} className="input-base" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">せい（ふりがな）</label>
                <input placeholder="せい（かな）" value={form.lastNameKana} required
                  onChange={e => setForm({ ...form, lastNameKana: e.target.value })} className="input-base" />
              </div>
              <div>
                <label className="field-label">めい（ふりがな）</label>
                <input placeholder="めい（かな）" value={form.firstNameKana} required
                  onChange={e => setForm({ ...form, firstNameKana: e.target.value })} className="input-base" />
              </div>
            </div>
            <div>
              <label className="field-label">ハンドルネーム</label>
              <input placeholder="ハンドルネーム" value={form.handleName} required
                onChange={e => setForm({ ...form, handleName: e.target.value })} className="input-base" />
            </div>
            <div>
              <label className="field-label">ハンドルネーム（かな）</label>
              <input placeholder="ハンドルネーム（かな）" value={form.handleNameKana} required
                onChange={e => setForm({ ...form, handleNameKana: e.target.value })} className="input-base" />
            </div>
            <div>
              <label className="field-label">生年月日</label>
              <input type="date" value={form.birthday} required
                onChange={e => setForm({ ...form, birthday: e.target.value })} className="input-base" />
            </div>
            <div>
              <label className="field-label">性別</label>
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="input-base">
                <option value="no_answer">回答しない</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
              </select>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-sm font-bold text-navy">学校情報</h2>
            <p className="text-xs text-ink/50">転校・進学などで学校が変わった場合は、こちらから変更できます。</p>
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
            <h2 className="font-display text-sm font-bold text-navy">部活動での立場</h2>
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
            </div>
          </section>

          <div className="flex gap-3">
            <button disabled={saving} className="btn-primary flex-1">{saving ? '保存中...' : '保存する'}</button>
            <a href="/mypage" className="btn-secondary flex-1 text-center">キャンセル</a>
          </div>
        </form>
      </div>
    </main>
  )
}
