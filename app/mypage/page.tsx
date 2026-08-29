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
    <main className="max-w-md mx-auto px-6 py-12">
      <h1 className="text-xl font-bold mb-6">マイページ</h1>
      <dl className="space-y-2 mb-8">
        <div><dt className="text-sm text-gray-500">本名</dt><dd>{profile?.real_name}</dd></div>
        <div><dt className="text-sm text-gray-500">ハンドルネーム</dt><dd>{profile?.handle_name}</dd></div>
        <div><dt className="text-sm text-gray-500">学校</dt><dd>{profile?.schools?.name}</dd></div>
        <div><dt className="text-sm text-gray-500">学年</dt><dd>{profile?.grade}年生</dd></div>
        <div><dt className="text-sm text-gray-500">役職</dt><dd>{profile?.role}</dd></div>
        <div><dt className="text-sm text-gray-500">ステータス</dt><dd>{profile?.status}</dd></div>
      </dl>

      {org && (profile?.role === 'captain' || profile?.role === 'advisor') && (
        <div className="border rounded-lg p-4">
          <div className="font-bold mb-2">{org.name} の連盟加盟</div>
          {org.membership_status === 'unclaimed' && org.verified && (
            <MembershipApplyButton organizationId={org.id} />
          )}
          {org.membership_status === 'unclaimed' && !org.verified && (
            <p className="text-sm text-gray-500">代表者確定の処理中です。しばらくお待ちください。</p>
          )}
          {org.membership_status === 'applied' && (
            <p className="text-sm text-orange-600">連盟事務局にて審査中です。</p>
          )}
          {org.membership_status === 'member' && (
            <p className="text-sm text-green-600">加盟団体として登録されています。</p>
          )}
        </div>
      )}
    </main>
  )
}
