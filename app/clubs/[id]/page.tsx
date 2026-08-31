import { createClient } from '@/lib/supabase/server'

export default async function ClubDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: club } = await supabase.from('organization_stats').select('*').eq('organization_id', id).single()
  const gradeCounts: Record<string, number> = club?.grade_counts ?? {}
  const gradeEntries = Object.entries(gradeCounts).sort((a, b) => Number(a[0]) - Number(b[0]))

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
          <div>学年別人数: {gradeEntries.length > 0 ? gradeEntries.map(([g, n]) => `${g}年 ${n}人`).join(' / ') : '未設定'}</div>
        </dl>
      </div>
      </div>
    </main>
  )
}
