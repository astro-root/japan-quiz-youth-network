'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FEDERATION_ROLES, FEDERATION_ROLE_LABELS, type FederationRole } from '@/lib/roles'

export default function AdminUsers() {
  const supabase = createClient()
  const [myRoles, setMyRoles] = useState<FederationRole[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const canManage = myRoles.includes('federation_president') || myRoles.includes('cto')

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: myProfile } = await supabase.from('profiles').select('federation_roles').eq('id', user.id).single()
    setMyRoles(myProfile?.federation_roles ?? [])

    const { data } = await supabase
      .from('profiles')
      .select('id, last_name, first_name, handle_name, federation_roles, schools(name)')
      .order('last_name')
    setRows(data ?? [])
  }
  useEffect(() => { load() }, [])

  async function toggleRole(userId: string, role: FederationRole, grant: boolean) {
    setBusyKey(`${userId}-${role}`)
    const { error } = await supabase.rpc('set_user_role', { p_user_id: userId, p_role: role, p_grant: grant })
    setBusyKey(null)
    if (error) return alert(error.message)
    load()
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-12">
      <p className="eyebrow mb-2">Users</p>
      <h1 className="page-title mb-6">参加者・役職管理</h1>

      {!canManage && (
        <p className="mb-6 text-sm text-ink/60">閲覧のみ可能です。役職の変更は連盟長・最高技術責任者のみ行えます。</p>
      )}

      <div className="space-y-3">
        {rows.map(r => {
          const roles: FederationRole[] = r.federation_roles ?? ['member']
          return (
            <div key={r.id} className="card">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="font-display font-bold text-navy">{r.last_name} {r.first_name}（{r.handle_name}）</div>
                <div className="text-xs text-ink/50">{(r as any).schools?.name ?? '-'}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {FEDERATION_ROLES.map(role => {
                  const active = roles.includes(role)
                  const key = `${r.id}-${role}`
                  return (
                    <button
                      key={role}
                      disabled={!canManage || busyKey === key}
                      onClick={() => toggleRole(r.id, role, !active)}
                      className={active
                        ? 'rounded-full bg-navy px-3 py-1 text-xs font-bold text-paper disabled:opacity-50'
                        : 'rounded-full border border-line px-3 py-1 text-xs font-bold text-ink/50 disabled:opacity-50'}
                    >
                      {FEDERATION_ROLE_LABELS[role]}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
