'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function EditProfile() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    lastName: '', firstName: '', lastNameKana: '', firstNameKana: '',
    handleName: '', handleNameKana: '', birthday: '', gender: 'no_answer',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      const { data } = await supabase.from('profiles')
        .select('last_name, first_name, last_name_kana, first_name_kana, handle_name, handle_name_kana, birthday, gender')
        .eq('id', user.id).single()
      if (data) {
        setForm({
          lastName: data.last_name, firstName: data.first_name,
          lastNameKana: data.last_name_kana, firstNameKana: data.first_name_kana,
          handleName: data.handle_name, handleNameKana: data.handle_name_kana ?? '',
          birthday: data.birthday, gender: data.gender,
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({
      last_name: form.lastName, first_name: form.firstName,
      last_name_kana: form.lastNameKana, first_name_kana: form.firstNameKana,
      handle_name: form.handleName, handle_name_kana: form.handleNameKana,
      birthday: form.birthday, gender: form.gender,
    }).eq('id', user.id)
    setSaving(false)
    if (error) return alert(error.message)
    router.push('/mypage')
  }

  if (loading) return <p className="p-12 font-mono text-sm text-ink/50">読み込み中...</p>

  return (
    <main className="page-container">
      <div className="page-narrow">
        <p className="eyebrow mb-2">Edit</p>
        <h1 className="page-title mb-6">プロフィール編集</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
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
          <div className="flex gap-3">
            <button disabled={saving} className="btn-primary flex-1">{saving ? '保存中...' : '保存する'}</button>
            <a href="/mypage" className="btn-secondary flex-1 text-center">キャンセル</a>
          </div>
        </form>
        <p className="mt-4 text-xs text-ink/40">学校・学年の変更は現在対応していません。変更が必要な場合はお問い合わせください。</p>
      </div>
    </main>
  )
}
