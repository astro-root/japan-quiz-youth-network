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

export default function Register() {
  const supabase = createClient()
  const [region, setRegion] = useState('')
  const [prefecture, setPrefecture] = useState('')
  const [schoolType, setSchoolType] = useState('')
  const [schoolQuery, setSchoolQuery] = useState('')
  const [schools, setSchools] = useState<School[]>([])
  const [schoolId, setSchoolId] = useState('')
  const [selectedSchoolLabel, setSelectedSchoolLabel] = useState('')
  const [form, setForm] = useState({
    email: '', password: '', realName: '', handleName: '',
    birthday: '', gender: 'no_answer', grade: '1', role: 'member',
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
    if (!schoolId) return alert('学校を選択してください')
    const { data, error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
    })
    if (error || !data.user) return alert(error?.message)
    await supabase.from('profiles').insert({
      id: data.user.id,
      real_name: form.realName,
      handle_name: form.handleName,
      birthday: form.birthday,
      gender: form.gender,
      grade: Number(form.grade),
      role: form.role,
      school_id: schoolId,
    })
    window.location.href = '/mypage'
  }

  const gradeOptions = schoolType ? GRADE_RANGE[schoolType] : [1, 2, 3]

  return (
    <main className="max-w-md mx-auto px-6 py-12">
      <h1 className="text-xl font-bold mb-6">新規登録</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input placeholder="メールアドレス" type="email" required
          onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border p-2 rounded" />
        <input placeholder="パスワード" type="password" required
          onChange={e => setForm({ ...form, password: e.target.value })} className="w-full border p-2 rounded" />
        <input placeholder="本名" required
          onChange={e => setForm({ ...form, realName: e.target.value })} className="w-full border p-2 rounded" />
        <input placeholder="ハンドルネーム" required
          onChange={e => setForm({ ...form, handleName: e.target.value })} className="w-full border p-2 rounded" />

        <select value={region} required
          onChange={e => { setRegion(e.target.value); setPrefecture(''); handleSchoolTypeChange('') }}
          className="w-full border p-2 rounded">
          <option value="">地域を選択</option>
          {Object.keys(REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        {region && (
          <select value={prefecture} required
            onChange={e => { setPrefecture(e.target.value); handleSchoolTypeChange('') }}
            className="w-full border p-2 rounded">
            <option value="">都道府県を選択</option>
            {REGIONS[region].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}

        {prefecture && (
          <select value={schoolType} required
            onChange={e => handleSchoolTypeChange(e.target.value)}
            className="w-full border p-2 rounded">
            <option value="">学校種を選択</option>
            {SCHOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}

        {prefecture && schoolType && (
          <div className="relative">
            <input placeholder="学校名を検索" value={schoolQuery}
              onChange={e => searchSchools(e.target.value)} className="w-full border p-2 rounded" />
            {schools.length > 0 && (
              <ul className="absolute z-10 bg-white border w-full rounded shadow max-h-56 overflow-y-auto">
                {schools.map(s => (
                  <li key={s.id} className="p-2 hover:bg-gray-100 cursor-pointer"
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
            {schoolId && <p className="text-xs text-green-600 mt-1">選択中: {selectedSchoolLabel}</p>}
          </div>
        )}

        <input placeholder="誕生日" type="date" required
          onChange={e => setForm({ ...form, birthday: e.target.value })} className="w-full border p-2 rounded" />
        <select onChange={e => setForm({ ...form, gender: e.target.value })} className="w-full border p-2 rounded">
          <option value="no_answer">回答しない</option>
          <option value="male">男性</option>
          <option value="female">女性</option>
          <option value="other">その他</option>
        </select>
        <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="w-full border p-2 rounded">
          {gradeOptions.map(g => <option key={g} value={g}>{g}年生</option>)}
        </select>
        <select onChange={e => setForm({ ...form, role: e.target.value })} className="w-full border p-2 rounded">
          <option value="member">部員</option>
          <option value="captain">部長</option>
          <option value="vice_captain">副部長</option>
          <option value="advisor">顧問</option>
        </select>
        <button className="w-full bg-black text-white p-2 rounded">登録する</button>
      </form>
    </main>
  )
}
