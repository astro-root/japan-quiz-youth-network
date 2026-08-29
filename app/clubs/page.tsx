import { createClient } from '@/lib/supabase/server'

export default async function Clubs() {
  const supabase = await createClient()
  const { data: clubs } = await supabase.from('organization_stats').select('*')

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="eyebrow mb-2">Clubs</p>
      <h1 className="page-title mb-6">全国クイズ研究部一覧</h1>
      <div className="grid gap-4">
        {clubs?.map(c => (
          <a key={c.organization_id} href={`/clubs/${c.organization_id}`} className="card block transition hover:border-akane">
            <div className="font-display font-bold text-navy">{c.school_name} {c.name}</div>
            <div className="mt-1 font-mono text-sm text-ink/60">
              部員数 {c.member_count} / 部長 {c.captain_name ?? '未設定'} / 男女比 {c.male_count}:{c.female_count}
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}
