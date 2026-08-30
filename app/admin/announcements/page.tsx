'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminAnnouncements() {
  const supabase = createClient()
  const [items, setItems] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setItems(data ?? [])
  }
  useEffect(() => { load() }, [])

  async function create() {
    if (!title || !body) return alert('タイトルと本文を入力してください')
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('announcements').insert({ title, body, created_by: user?.id })
    setBusy(false)
    if (error) return alert(error.message)
    setTitle(''); setBody('')
    load()
  }

  async function togglePublish(item: any) {
    const publishing = item.status !== 'published'
    const { error } = await supabase.from('announcements').update({
      status: publishing ? 'published' : 'draft',
      published_at: publishing ? new Date().toISOString() : null,
    }).eq('id', item.id)
    if (error) return alert(error.message)
    load()
  }

  async function remove(id: string) {
    if (!confirm('このお知らせを削除しますか？')) return
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) return alert(error.message)
    load()
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-12">
      <p className="eyebrow mb-2">Announcements</p>
      <h1 className="page-title mb-6">お知らせ配信</h1>

      <div className="card mb-8 space-y-3">
        <input placeholder="タイトル" value={title} onChange={e => setTitle(e.target.value)} className="input-base" />
        <textarea placeholder="本文" value={body} onChange={e => setBody(e.target.value)} className="input-base min-h-32" />
        <button onClick={create} disabled={busy} className="btn-primary">下書きとして作成</button>
      </div>

      <div className="space-y-3">
        {items.map(a => (
          <div key={a.id} className="card">
            <div className="mb-2 flex items-center justify-between">
              <span className={a.status === 'published' ? 'badge-navy' : 'badge-gold'}>
                {a.status === 'published' ? '公開中' : '下書き'}
              </span>
              <div className="flex gap-3">
                <button onClick={() => togglePublish(a)} className="font-display text-xs font-bold text-navy underline">
                  {a.status === 'published' ? '非公開に戻す' : '公開する'}
                </button>
                <button onClick={() => remove(a.id)} className="font-display text-xs font-bold text-akane underline">削除</button>
              </div>
            </div>
            <h2 className="font-display font-bold text-navy">{a.title}</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink/70">{a.body}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
