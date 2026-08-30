import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MembershipApplyButton from './apply-button'
import DeleteAccountButton from './delete-account-button'
import { FEDERATION_ROLE_LABELS, type FederationRole } from '@/lib/roles'

const ADMIN_PAGE_ROLES: FederationRole[] = ['federation_president', 'cto', 'admin']

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, schools(name, prefecture), organizations!profiles_organization_id_fkey(id, name, verified, membership_status)')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return (
      <main className="page-container">
        <div className="page-narrow">
          <p className="eyebrow mb-2">My Page</p>
          <h1 className="page-title mb-4">プロフィールが見つかりません</h1>
          <div className="card">
            <p className="text-sm text-ink/70">
              会員登録は完了していますが、プロフィール情報が保存されていないようです。
              お手数ですが、もう一度登録をお試しいただくか、サポートまでご連絡ください。
            </p>
            {error && <p className="mt-2 font-mono text-xs text-akane">エラー詳細: {error.message}</p>}
          </div>
        </div>
      </main>
    )
  }

  const org = profile.organizations as any
  const roles: FederationRole[] = profile.federation_roles ?? ['member']
  const hasAdminAccess = roles.some(r => ADMIN_PAGE_ROLES.includes(r))

  return (
    <main className="page-container">
      <div className="page-narrow">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="eyebrow mb-2">My Page</p>
            <h1 className="page-title">マイページ</h1>
          </div>
          <a href="/mypage/edit" className="btn-secondary text-sm">編集する</a>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {roles.map(r => (
            <span key={r} className={r === 'member' ? 'badge-navy' : 'badge-gold'}>
              {FEDERATION_ROLE_LABELS[r]}
            </span>
          ))}
        </div>

        {hasAdminAccess && (
          <a href="/admin" className="card mb-6 block border-akane/40 bg-akane/5 transition hover:border-akane">
            <p className="font-display font-bold text-akane">管理画面を開く →</p>
            <p className="text-xs text-ink/60">お知らせ配信・参加者管理・年会費管理などはこちらから</p>
          </a>
        )}

        <div className="card mb-6">
          <dl className="space-y-3">
            <div><dt className="font-mono text-xs text-ink/50">氏名</dt><dd>{profile.last_name} {profile.first_name}（{profile.last_name_kana} {profile.first_name_kana}）</dd></div>
            <div><dt className="font-mono text-xs text-ink/50">ハンドルネーム</dt><dd>{profile.handle_name}</dd></div>
            <div><dt className="font-mono text-xs text-ink/50">学校</dt><dd>{profile.schools?.name}</dd></div>
            <div><dt className="font-mono text-xs text-ink/50">学年</dt><dd>{profile.grade}年生</dd></div>
            <div><dt className="font-mono text-xs text-ink/50">部内の役職</dt><dd>{profile.role}</dd></div>
            <div><dt className="font-mono text-xs text-ink/50">ステータス</dt><dd>{profile.status}</dd></div>
          </dl>
        </div>

        {org && (profile.role === 'captain' || profile.role === 'advisor') && (
          <div className="card mb-6">
            <p className="mb-3 font-display font-bold text-navy">{org.name} の連盟加盟</p>
            {org.membership_status === 'unclaimed' && org.verified && <MembershipApplyButton organizationId={org.id} />}
            {org.membership_status === 'unclaimed' && !org.verified && <p className="text-sm text-ink/60">代表者確定の処理中です。しばらくお待ちください。</p>}
            {org.membership_status === 'applied' && <p className="badge-gold">審査中</p>}
            {org.membership_status === 'member' && <p className="badge-navy">加盟団体</p>}
          </div>
        )}

        {org && profile.role !== 'captain' && profile.role !== 'advisor' && (
          <div className="card mb-6">
            <p className="mb-1 font-display font-bold text-navy">{org.name} の連盟加盟</p>
            <p className="text-sm text-ink/60">
              加盟申請ができるのは部長・顧問のみです。{org.membership_status === 'member' ? 'この団体は加盟済みです。' : '部長または顧問の方に申請をご依頼ください。'}
            </p>
          </div>
        )}

        <div className="border-t border-line pt-4 text-right">
          <DeleteAccountButton />
        </div>
      </div>
    </main>
  )
}
