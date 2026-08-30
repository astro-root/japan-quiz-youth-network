'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUS_LABELS: Record<string, string> = { new: '新規', in_progress: '対応中', resolved: '対応済み' }

export default function AdminInquiries() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])

  async function load() {
    const { data } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false })
    setRows(data ?? [])
  }
  useEffect(() => { load() }, [])

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('inquiries').update({ status }).eq('id', id)
    if (error) return alert(error.message)
    load()
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-12">
      <p className="eyebrow mb-2">Inquiries</p>
      <h1 className="page-title mb-6">お問い合わせ管理</h1>
      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.id} className="card">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="font-display font-bold text-navy">{r.name}（{r.email}）</div>
              <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)} className="input-base w-auto text-xs">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <p className="whitespace-pre-wrap text-sm text-ink/70">{r.message}</p>
            <p className="mt-2 font-mono text-xs text-ink/40">{new Date(r.created_at).toLocaleString('ja-JP')}</p>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-ink/50">お問い合わせはありません。</p>}
      </div>
    </main>
  )
}
