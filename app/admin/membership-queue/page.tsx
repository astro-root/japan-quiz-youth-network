'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MembershipQueue() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, membership_applied_at, schools(name)')
      .eq('membership_status', 'applied')
      .order('membership_applied_at')
    setRows(data ?? [])

    const { data: memberOrgs } = await supabase
      .from('organization_stats')
      .select('*')
      .eq('membership_status', 'member')
      .order('prefecture')
    setMembers(memberOrgs ?? [])
  }
  useEffect(() => { load() }, [])

  async function approve(id: string) {
    setBusyId(id)
    const { error } = await supabase.rpc('approve_membership', { p_organization_id: id })
    setBusyId(null)
    if (error) return alert(error.message)
    load()
  }

  async function removeOrganization(id: string, label: string) {
    if (!confirm(`「${label}」の加盟を取り消し、団体を削除します。所属していた会員は未所属に戻ります。よろしいですか？`)) return
    setBusyId(id)
    const { error } = await supabase.rpc('admin_delete_organization', { p_organization_id: id })
    setBusyId(null)
    if (error) return alert(error.message)
    load()
  }

  return (
    <main className="page-container">
      <div className="page-reading">
        <p className="eyebrow mb-2">Queue</p>
        <h1 className="page-title mb-6">加盟申請キュー</h1>
        {rows.length === 0 && <p className="text-sm text-ink/50">申請待ちの団体はありません。</p>}
        <div className="mb-12 space-y-3">
          {rows.map(r => (
            <div key={r.id} className="card flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="font-display font-bold text-navy">{(r as any).schools?.name} {r.name}</div>
                <div className="font-mono text-xs text-ink/50">
                  申請日: {r.membership_applied_at ? new Date(r.membership_applied_at).toLocaleDateString('ja-JP') : '-'}
                </div>
              </div>
              <button onClick={() => approve(r.id)} disabled={busyId === r.id} className="btn-primary w-full sm:w-auto">
                {busyId === r.id ? '処理中...' : '承認する'}
              </button>
            </div>
          ))}
        </div>

        <h2 className="page-title mb-4">加盟団体一覧（{members.length}団体）</h2>
        {members.length === 0 && <p className="text-sm text-ink/50">加盟団体はまだありません。</p>}
        <div className="space-y-3">
          {members.map(m => (
            <div key={m.organization_id} className="card flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="font-display font-bold text-navy">{m.school_name} {m.name}</div>
                <div className="font-mono text-xs text-ink/50">{m.prefecture} / 部員数 {m.member_count}名</div>
              </div>
              <button
                onClick={() => removeOrganization(m.organization_id, `${m.school_name ?? ''} ${m.name ?? ''}`.trim())}
                disabled={busyId === m.organization_id}
                className="font-display text-xs font-bold text-akane underline disabled:opacity-40">
                {busyId === m.organization_id ? '処理中...' : '加盟を削除'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
