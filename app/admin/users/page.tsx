'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminUsers() {
  const supabase = createClient()
  const [me, setMe] = useState<any>(null)
  const [rows, setRows] = useState<any[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: myProfile } = await supabase.from('profiles').select('is_super_admin').eq('id', user.id).single()
    setMe(myProfile)

    const { data } = await supabase
      .from('profiles')
      .select('id, last_name, first_name, handle_name, is_staff, is_super_admin, schools(name)')
      .order('last_name')
    setRows(data ?? [])
  }
  useEffect(() => { load() }, [])

  async function toggleAdmin(userId: string, grant: boolean) {
    setBusyId(userId)
    const { error } = await supabase.rpc('set_admin_access', { p_user_id: userId, p_grant: grant })
    setBusyId(null)
    if (error) return alert(error.message)
    load()
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-12">
      <p className="eyebrow mb-2">Users</p>
      <h1 className="page-title mb-6">参加者・管理者権限</h1>

      {me && !me.is_super_admin && (
        <p className="mb-6 text-sm text-ink/60">閲覧のみ可能です。権限の変更は最高管理者のみ行えます。</p>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-xs text-ink/50">
              <th className="p-3">氏名</th><th>学校</th><th>権限</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="p-3">{r.last_name} {r.first_name}（{r.handle_name}）</td>
                <td className="text-ink/70">{(r as any).schools?.name ?? '-'}</td>
                <td>
                  {r.is_super_admin && <span className="badge-gold">最高管理者</span>}
                  {r.is_staff && !r.is_super_admin && <span className="badge-navy">運営スタッフ</span>}
                  {!r.is_staff && !r.is_super_admin && <span className="text-xs text-ink/40">一般</span>}
                </td>
                <td>
                  {me?.is_super_admin && !r.is_super_admin && (
                    <button
                      onClick={() => toggleAdmin(r.id, !r.is_staff)}
                      disabled={busyId === r.id}
                      className="font-display text-xs font-bold text-akane underline disabled:opacity-50">
                      {busyId === r.id ? '処理中...' : r.is_staff ? '権限を剥奪' : '権限を付与'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
