import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MembershipApplyButton from './apply-button'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, schools(name, prefecture), organizations(id, name, verified, membership_status)')
    .eq('id', user.id)
    .single()

  const org = profile?.organizations as any

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <p className="eyebrow mb-2">My Page</p>
      <h1 className="page-title mb-6">マイページ</h1>

      <div className="card mb-6">
        <dl className="space-y-3">
          <div><dt className="font-mono text-xs text-ink/50">本名</dt><dd>{profile?.real_name}</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">ハンドルネーム</dt><dd>{profile?.handle_name}</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">学校</dt><dd>{profile?.schools?.name}</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">学年</dt><dd>{profile?.grade}年生</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">役職</dt><dd>{profile?.role}</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">ステータス</dt><dd>{profile?.status}</dd></div>
        </dl>
      </div>

      {org && (profile?.role === 'captain' || profile?.role === 'advisor') && (
        <div className="card">
          <p className="font-display font-bold text-navy mb-3">{org.name} の連盟加盟</p>
          {org.membership_status === 'unclaimed' && org.verified && (
            <MembershipApplyButton organizationId={org.id} />
          )}
          {org.membership_status === 'unclaimed' && !org.verified && (
            <p className="text-sm text-ink/60">代表者確定の処理中です。しばらくお待ちください。</p>
          )}
          {org.membership_status === 'applied' && (
            <p className="badge-gold">審査中</p>
          )}
          {org.membership_status === 'member' && (
            <p className="badge-navy">加盟団体</p>
          )}
        </div>
      )}
    </main>
  )
}
