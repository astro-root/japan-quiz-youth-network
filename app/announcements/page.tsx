import { createClient } from '@/lib/supabase/server'

export default async function Announcements() {
  const supabase = await createClient()
  const { data: items } = await supabase
    .from('announcements')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-12">
      <p className="eyebrow mb-2">News</p>
      <h1 className="page-title mb-8">お知らせ</h1>
      <div className="space-y-4">
        {items?.map(a => (
          <div key={a.id} className="card">
            <p className="mb-1 font-mono text-xs text-ink/50">
              {a.published_at ? new Date(a.published_at).toLocaleDateString('ja-JP') : ''}
            </p>
            <h2 className="mb-2 font-display font-bold text-navy">{a.title}</h2>
            <p className="whitespace-pre-wrap text-sm text-ink/70">{a.body}</p>
          </div>
        ))}
        {(!items || items.length === 0) && <p className="text-sm text-ink/50">お知らせはまだありません。</p>}
      </div>
    </main>
  )
}
