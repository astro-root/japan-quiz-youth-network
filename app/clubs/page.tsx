import { createClient } from '@/lib/supabase/server'
import { REGIONS } from '@/lib/regions'
import ClubsList from './ClubsList'

export default async function Clubs() {
  const supabase = await createClient()
  const { data: clubs } = await supabase
    .from('organization_stats')
    .select('*')
    .eq('membership_status', 'member')
    .order('prefecture')

  const prefectureToRegion: Record<string, string> = {}
  for (const [region, prefs] of Object.entries(REGIONS)) {
    for (const p of prefs) prefectureToRegion[p] = region
  }

  return (
    <main className="page-container">
      <div className="page-reading">
      <p className="eyebrow mb-2">Clubs</p>
      <h1 className="page-title mb-8">加盟クイズ研究部一覧</h1>
      <ClubsList
        clubs={clubs ?? []}
        regionOrder={[...Object.keys(REGIONS), 'その他']}
        prefectureToRegion={prefectureToRegion}
      />
      </div>
    </main>
  )
}
