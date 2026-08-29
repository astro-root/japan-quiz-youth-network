import { createClient } from '@/lib/supabase/server'

export default async function ClubDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: club } = await supabase.from('organization_stats').select('*').eq('organization_id', id).single()

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-xl font-bold mb-2">{club?.school_name} {club?.name}</h1>
      <p>部員数: {club?.member_count}名</p>
      <p>部長: {club?.captain_name ?? '未設定'}</p>
      <p>男女比: {club?.male_count}:{club?.female_count}</p>
    </main>
  )
}
