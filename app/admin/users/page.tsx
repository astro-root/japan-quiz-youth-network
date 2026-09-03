'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FEDERATION_ROLES, FEDERATION_ROLE_LABELS, type FederationRole } from '@/lib/roles'

type Row = {
  id: string
  last_name: string
  first_name: string
  handle_name: string
  email: string | null
  federation_roles: FederationRole[]
  banned: boolean
  school_name: string | null
}

export default function AdminUsers() {
  const supabase = createClient()
  const [myRoles, setMyRoles] = useState<FederationRole[]>([])
  const [myId, setMyId] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [query, setQuery] = useState('')
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const canManage = myRoles.includes('federation_president') || myRoles.includes('cto') || myRoles.includes('admin')

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setMyId(user.id)
    const { data: myProfile } = await supabase.from('profiles').select('federation_roles').eq('id', user.id).single()
    setMyRoles(myProfile?.federation_roles ?? [])

    const { data, error } = await supabase.rpc('admin_list_profiles')
    if (error) {
      console.error(error)
      return
    }
    setRows((data ?? []) as Row[])
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return rows
    const q = query.trim()
    return rows.filter(r =>
      `${r.last_name}${r.first_name}`.includes(q) ||
      r.handle_name?.includes(q) ||
      r.school_name?.includes(q) ||
      r.email?.includes(q)
    )
  }, [rows, query])

  async function toggleRole(userId: string, role: FederationRole, grant: boolean) {
    setBusyKey(`role-${userId}-${role}`)
    const { error } = await supabase.rpc('set_user_role', { p_user_id: userId, p_role: role, p_grant: grant })
    setBusyKey(null)
    if (error) return alert(error.message)
    load()
  }

  async function toggleBan(userId: string, banned: boolean) {
    const message = banned ? 'このアカウントをBANしますか？ログインできなくなります。' : 'このアカウントのBANを解除しますか？'
    if (!confirm(message)) return
    setBusyKey(`ban-${userId}`)
    const { error } = await supabase.rpc('admin_set_banned', { p_user_id: userId, p_banned: banned })
    setBusyKey(null)
    if (error) return alert(error.message)
    load()
  }

  return (
    <main className="page-container">
      <div className="page-wide">
        <p className="eyebrow mb-2">Users</p>
        <h1 className="page-title mb-6">参加者・役職管理</h1>

        <input
          placeholder="氏名・ハンドルネーム・学校名・メールアドレスで検索"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="input-base mb-6"
        />

        {!canManage && <p className="mb-6 text-sm text-ink/60">閲覧のみ可能です。役職・BANの変更は連盟長・最高技術責任者・管理者のみ行えます。</p>}

        <div className="space-y-3">
          {filtered.map(r => {
            const roles: FederationRole[] = r.federation_roles ?? ['member']
            const isSelf = r.id === myId
            return (
              <div key={r.id} className={`card ${r.banned ? 'border-akane/50 bg-akane/5' : ''}`}>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <a href={`/admin/users/${r.id}`} className="font-display font-bold text-navy hover:text-akane hover:underline">
                    {r.last_name} {r.first_name}（{r.handle_name}）
                  </a>
                  <div className="flex items-center gap-2">
                    {r.banned && <span className="rounded-full bg-akane/15 px-3 py-1 text-xs font-bold text-akane">BAN中</span>}
                    <div className="text-xs text-ink/50">{r.school_name ?? '-'}</div>
                  </div>
                </div>
                <p className="mb-3 font-mono text-xs text-ink/50">{r.email ?? 'メールアドレス不明'}</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    {FEDERATION_ROLES.map(role => {
                      const active = roles.includes(role)
                      const key = `role-${r.id}-${role}`
                      return (
                        <button key={role} disabled={!canManage || isSelf || busyKey === key}
                          onClick={() => toggleRole(r.id, role, !active)}
                          className={active
                            ? 'rounded-full bg-navy px-3 py-1 text-xs font-bold text-paper disabled:opacity-50'
                            : 'rounded-full border border-line px-3 py-1 text-xs font-bold text-ink/50 disabled:opacity-50'}>
                          {FEDERATION_ROLE_LABELS[role]}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    disabled={!canManage || isSelf || busyKey === `ban-${r.id}`}
                    onClick={() => toggleBan(r.id, !r.banned)}
                    className="font-display text-xs font-bold text-akane underline disabled:opacity-40">
                    {r.banned ? 'BAN解除' : 'BANする'}
                  </button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <p className="text-sm text-ink/50">該当する参加者が見つかりませんでした。</p>}
        </div>
      </div>
    </main>
  )
}
