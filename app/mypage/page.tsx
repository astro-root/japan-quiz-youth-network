import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MembershipApplyButton from './apply-button'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, schools(name, prefecture), organizations(id, name, verified, membership_status)')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 md:px-6 md:py-12">
        <p className="eyebrow mb-2">My Page</p>
        <h1 className="page-title mb-4">プロフィールが見つかりません</h1>
        <div className="card">
          <p className="text-sm text-ink/70">
            会員登録は完了していますが、プロフィール情報が保存されていないようです。
            お手数ですが、もう一度登録をお試しいただくか、サポートまでご連絡ください。
          </p>
          {error && <p className="mt-2 font-mono text-xs text-akane">エラー詳細: {error.message}</p>}
        </div>
      </main>
    )
  }

  const org = profile.organizations as any

  return (
    <main className="mx-auto max-w-md px-4 py-10 md:px-6 md:py-12">
      <p className="eyebrow mb-2">My Page</p>
      <h1 className="page-title mb-6">マイページ</h1>

      {(profile.is_staff || profile.is_super_admin) && (
        <div className="mb-4 flex gap-2">
          {profile.is_super_admin && <span className="badge-gold">最高管理者</span>}
          {profile.is_staff && <span className="badge-navy">運営スタッフ</span>}
        </div>
      )}

      <div className="card mb-6">
        <dl className="space-y-3">
          <div><dt className="font-mono text-xs text-ink/50">氏名</dt><dd>{profile.last_name} {profile.first_name}（{profile.last_name_kana} {profile.first_name_kana}）</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">ハンドルネーム</dt><dd>{profile.handle_name}</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">学校</dt><dd>{profile.schools?.name}</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">学年</dt><dd>{profile.grade}年生</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">役職</dt><dd>{profile.role}</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">ステータス</dt><dd>{profile.status}</dd></div>
        </dl>
      </div>

      {org && (profile.role === 'captain' || profile.role === 'advisor') && (
        <div className="card">
          <p className="mb-3 font-display font-bold text-navy">{org.name} の連盟加盟</p>
          {org.membership_status === 'unclaimed' && org.verified && (
            <MembershipApplyButton organizationId={org.id} />
          )}
          {org.membership_status === 'unclaimed' && !org.verified && (
            <p className="text-sm text-ink/60">代表者確定の処理中です。しばらくお待ちください。</p>
          )}
          {org.membership_status === 'applied' && <p className="badge-gold">審査中</p>}
          {org.membership_status === 'member' && <p className="badge-navy">加盟団体</p>}
        </div>
      )}
    </main>
  )
}
