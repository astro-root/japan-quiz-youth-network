'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STATUS_LABELS: Record<string, string> = { draft: '下書き', recruiting: '募集中', closed: '締切' }

export default function MyTournaments() {
  const supabase = createClient()
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?next=/tournaments/manage')
      return
    }
    const { data } = await supabase.from('tournaments').select('*').eq('created_by', user.id).order('created_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function create() {
    if (!name.trim()) return alert('大会名を入力してください')
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setBusy(false); return router.push('/login?next=/tournaments/manage') }
    const { data, error } = await supabase.from('tournaments')
      .insert({ name: name.trim(), created_by: user.id })
      .select('id').single()
    setBusy(false)
    if (error) return alert(error.message)
    window.location.href = `/tournaments/manage/${data.id}`
  }

  async function remove(id: string) {
    if (!confirm('この大会を削除しますか？エントリー情報も含めて完全に削除されます。')) return
    const { error } = await supabase.from('tournaments').delete().eq('id', id)
    if (error) return alert(error.message)
    load()
  }

  if (loading) return <p className="p-12 font-mono text-sm text-ink/50">読み込み中...</p>

  return (
    <main className="page-container">
      <div className="page-reading">
        <p className="eyebrow mb-2">Organize</p>
        <h1 className="page-title mb-6">自分が主催する大会</h1>

        <div className="card mb-8 space-y-3">
          <label className="field-label">新しい大会を作成</label>
          <div className="flex gap-2">
            <input placeholder="大会名" value={name} onChange={e => setName(e.target.value)} className="input-base" />
            <button onClick={create} disabled={busy} className="btn-primary shrink-0">作成</button>
          </div>
          <p className="text-xs text-ink/40">
            マイページに登録していれば、どなたでも大会を作成できます。作成後の画面で、大会情報とエントリーフォームの質問項目を設定できます。
          </p>
        </div>

        <div className="space-y-3">
          {items.map(t => (
            <div key={t.id} className="card">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={t.status === 'recruiting' ? 'badge-navy' : 'badge-gold'}>{STATUS_LABELS[t.status]}</span>
                <div className="flex gap-3">
                  <a href={`/tournaments/manage/${t.id}`} className="font-display text-xs font-bold text-navy underline">編集</a>
                  <button onClick={() => remove(t.id)} className="font-display text-xs font-bold text-akane underline">削除</button>
                </div>
              </div>
              <h2 className="font-display font-bold text-navy">{t.name}</h2>
              <p className="mt-1 font-mono text-xs text-ink/50">
                開催日: {t.event_date ?? '未定'} / 締切: {t.entry_deadline ? new Date(t.entry_deadline).toLocaleString('ja-JP') : '未定'}
              </p>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-ink/50">まだ大会を作成していません。上のフォームから作成できます。</p>}
        </div>
      </div>
    </main>
  )
}
