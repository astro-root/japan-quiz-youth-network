import { createClient } from '@/lib/supabase/server'

export default async function Clubs() {
  const supabase = await createClient()
  const { data: clubs } = await supabase.from('organization_stats').select('*')

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-xl font-bold mb-6">全国クイズ研究部一覧</h1>
      <div className="grid gap-4">
        {clubs?.map(c => (
          <a key={c.organization_id} href={`/clubs/${c.organization_id}`} className="border rounded-lg p-4 block hover:bg-gray-50">
            <div className="font-bold">{c.school_name} {c.name}</div>
            <div className="text-sm text-gray-600">
              部員数: {c.member_count}名 / 部長: {c.captain_name ?? '未設定'} /
              男女比 {c.male_count}:{c.female_count}
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}
