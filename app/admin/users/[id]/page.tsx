import { createClient } from '@/lib/supabase/server'
import { FEDERATION_ROLE_LABELS, type FederationRole } from '@/lib/roles'

export default async function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, schools(name, prefecture, school_type), organizations!profiles_organization_id_fkey(name, membership_status)')
    .eq('id', id)
    .maybeSingle()

  if (!profile) {
    return <main className="mx-auto max-w-md px-4 py-10 md:px-6 md:py-12"><p className="text-sm text-ink/50">参加者が見つかりませんでした。</p></main>
  }

  const roles: FederationRole[] = profile.federation_roles ?? ['member']
  const org = profile.organizations as any

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-12">
      <p className="eyebrow mb-2">User Detail</p>
      <h1 className="page-title mb-2">{profile.last_name} {profile.first_name}</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        {roles.map(r => <span key={r} className={r === 'member' ? 'badge-navy' : 'badge-gold'}>{FEDERATION_ROLE_LABELS[r]}</span>)}
      </div>

      <div className="card">
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <div><dt className="font-mono text-xs text-ink/50">氏名（かな）</dt><dd>{profile.last_name_kana} {profile.first_name_kana}</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">ハンドルネーム</dt><dd>{profile.handle_name}</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">生年月日</dt><dd>{profile.birthday}</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">性別</dt><dd>{profile.gender}</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">学校</dt><dd>{profile.schools?.name}（{profile.schools?.school_type}）</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">都道府県</dt><dd>{profile.schools?.prefecture}</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">学年</dt><dd>{profile.grade}年生</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">部内の役職</dt><dd>{profile.role}</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">所属団体</dt><dd>{org?.name ?? '-'}（{org?.membership_status ?? '-'}）</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">ステータス</dt><dd>{profile.status}</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">再所属が必要か</dt><dd>{profile.needs_reaffiliation ? 'はい' : 'いいえ'}</dd></div>
          <div><dt className="font-mono text-xs text-ink/50">登録日</dt><dd>{new Date(profile.created_at).toLocaleDateString('ja-JP')}</dd></div>
        </dl>
      </div>

      <a href="/admin/users" className="mt-4 inline-block text-sm font-bold text-navy underline">一覧に戻る</a>
    </main>
  )
}
