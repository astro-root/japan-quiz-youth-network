'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const PART_ROLE_LABELS: Record<string, string> = { captain: '部長', advisor: '顧問' }

export default function RoleRequests() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    const { data, error } = await supabase.rpc('admin_list_role_requests')
    if (error) alert(error.message)
    setRows(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function approve(id: string) {
    if (!confirm('この役職申請を承認しますか？団体の確認済みフラグも同時に更新されます。')) return
    setBusyId(id)
    const { error } = await supabase.rpc('admin_approve_role_request', { p_user_id: id })
    setBusyId(null)
    if (error) return alert(error.message)
    load()
  }

  async function reject(id: string) {
    if (!confirm('この役職申請を却下しますか？')) return
    setBusyId(id)
    const { error } = await supabase.rpc('admin_reject_role_request', { p_user_id: id })
    setBusyId(null)
    if (error) return alert(error.message)
    load()
  }

  if (loading) return <p className="p-12 font-mono text-sm text-ink/50">読み込み中...</p>

  return (
    <main className="page-container">
      <div className="page-wide">
        <p className="eyebrow mb-2">Admin</p>
        <h1 className="page-title mb-2">役職承認待ち</h1>
        <p className="mb-6 text-sm text-ink/70">
          部長・顧問への昇格は自己申告だけでは確定しません。学校・団体の実態を確認したうえで承認してください。
        </p>

        {rows.length === 0 && <p className="text-sm text-ink/50">承認待ちの申請はありません。</p>}
        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.id} className="card flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="font-display font-bold text-navy">
                  {r.last_name} {r.first_name}（{r.handle_name}） → {PART_ROLE_LABELS[r.requested_role] ?? r.requested_role}
                </div>
                <div className="font-mono text-xs text-ink/50">
                  {r.school_name ?? '学校未設定'} / 申請日: {r.requested_role_at ? new Date(r.requested_role_at).toLocaleDateString('ja-JP') : '-'}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => approve(r.id)} disabled={busyId === r.id} className="btn-primary">
                  {busyId === r.id ? '処理中...' : '承認する'}
                </button>
                <button onClick={() => reject(r.id)} disabled={busyId === r.id} className="font-display text-xs font-bold text-akane underline">
                  却下する
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
