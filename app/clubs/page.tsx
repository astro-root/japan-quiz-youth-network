import { createClient } from '@/lib/supabase/server'
import { REGIONS } from '@/lib/regions'

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

  const grouped: Record<string, Record<string, any[]>> = {}
  for (const club of clubs ?? []) {
    const region = prefectureToRegion[club.prefecture as string] ?? 'その他'
    grouped[region] = grouped[region] ?? {}
    grouped[region][club.prefecture as string] = grouped[region][club.prefecture as string] ?? []
    grouped[region][club.prefecture as string].push(club)
  }

  const regionOrder = [...Object.keys(REGIONS), 'その他']

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-12">
      <p className="eyebrow mb-2">Clubs</p>
      <h1 className="page-title mb-8">加盟クイズ研究部一覧</h1>

      {regionOrder.filter(r => grouped[r]).map(region => (
        <section key={region} className="mb-10">
          <h2 className="mb-4 font-display text-xl font-bold text-navy">{region}</h2>
          <div className="space-y-6">
            {Object.entries(grouped[region]).map(([prefecture, list]) => (
              <div key={prefecture}>
                <h3 className="mb-2 font-mono text-sm text-ink/60">{prefecture}（{list.length}団体）</h3>
                <div className="grid gap-3">
                  {list.map(c => (
                    <a key={c.organization_id} href={`/clubs/${c.organization_id}`} className="card block transition hover:border-akane">
                      <div className="font-display font-bold text-navy">{c.school_name} {c.name}</div>
                      {c.address && <div className="mt-1 text-xs text-ink/50">{c.address}</div>}
                      <div className="mt-1 font-mono text-sm text-ink/60">
                        部員数 {c.member_count} / 部長 {c.captain_name ?? '未設定'} / 男女比 {c.male_count}:{c.female_count}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {(!clubs || clubs.length === 0) && <p className="text-sm text-ink/50">現在、加盟団体はありません。</p>}
    </main>
  )
}
