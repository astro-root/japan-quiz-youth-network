'use client'
import { useMemo, useState } from 'react'

export default function ClubsList({ clubs, regionOrder, prefectureToRegion }: {
  clubs: any[]
  regionOrder: string[]
  prefectureToRegion: Record<string, string>
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return clubs
    const q = query.trim()
    return clubs.filter(c =>
      c.school_name?.includes(q) || c.name?.includes(q) || c.prefecture?.includes(q) || c.address?.includes(q)
    )
  }, [clubs, query])

  const grouped: Record<string, Record<string, any[]>> = {}
  for (const club of filtered) {
    const region = prefectureToRegion[club.prefecture] ?? 'その他'
    grouped[region] = grouped[region] ?? {}
    grouped[region][club.prefecture] = grouped[region][club.prefecture] ?? []
    grouped[region][club.prefecture].push(club)
  }

  return (
    <>
      <input
        placeholder="学校名・都道府県・住所で検索"
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="input-base mb-8"
      />

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

      {filtered.length === 0 && <p className="text-sm text-ink/50">該当する団体が見つかりませんでした。</p>}
    </>
  )
}
