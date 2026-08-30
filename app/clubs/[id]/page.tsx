import { createClient } from '@/lib/supabase/server'

export default async function ClubDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: club } = await supabase.from('organization_stats').select('*').eq('organization_id', id).single()

  return (
    <main className="page-container">
      <div className="page-reading">
      <p className="eyebrow mb-2">Club</p>
      <h1 className="page-title mb-1">{club?.school_name} {club?.name}</h1>
      {club?.address && <p className="mb-4 text-sm text-ink/50">{club.address}</p>}
      <div className="card">
        <dl className="space-y-2 font-mono text-sm">
          <div>部員数: {club?.member_count}名</div>
          <div>部長: {club?.captain_name ?? '未設定'}</div>
          <div>男女比: {club?.male_count}:{club?.female_count}</div>
        </dl>
      </div>
      </div>
    </main>
  )
}
