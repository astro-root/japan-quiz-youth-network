'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MembershipQueue() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, membership_applied_at, schools(name)')
      .eq('membership_status', 'applied')
      .order('membership_applied_at')
    setRows(data ?? [])
  }
  useEffect(() => { load() }, [])

  async function approve(id: string) {
    setBusyId(id)
    const { error } = await supabase.rpc('approve_membership', { p_organization_id: id })
    setBusyId(null)
    if (error) return alert(error.message)
    load()
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="eyebrow mb-2">Queue</p>
      <h1 className="page-title mb-6">加盟申請キュー</h1>
      {rows.length === 0 && <p className="text-sm text-ink/50">申請待ちの団体はありません。</p>}
      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.id} className="card flex items-center justify-between">
            <div>
              <div className="font-display font-bold text-navy">{(r as any).schools?.name} {r.name}</div>
              <div className="font-mono text-xs text-ink/50">
                申請日: {r.membership_applied_at ? new Date(r.membership_applied_at).toLocaleDateString('ja-JP') : '-'}
              </div>
            </div>
            <button onClick={() => approve(r.id)} disabled={busyId === r.id} className="btn-primary">
              {busyId === r.id ? '処理中...' : '承認する'}
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}
