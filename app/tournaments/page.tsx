import { createClient } from '@/lib/supabase/server'

function formatDate(d: string | null) {
  if (!d) return '未定'
  return new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatDeadline(d: string | null) {
  if (!d) return '未定'
  return new Date(d).toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function Tournaments() {
  const supabase = await createClient()
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, description, event_date, location, entry_deadline, capacity')
    .eq('status', 'recruiting')
    .order('event_date', { ascending: true })

  return (
    <main className="page-container">
      <div className="page-wide">
        <p className="eyebrow mb-2">Tournaments</p>
        <h1 className="page-title mb-2">エントリー受付中の大会</h1>
        <p className="mb-8 text-sm text-ink/70">
          現在エントリーを受け付けている大会の一覧です。大会名をタップすると詳細とエントリーフォームに進めます。
        </p>

        {(!tournaments || tournaments.length === 0) && (
          <div className="card">
            <p className="text-sm text-ink/60">現在エントリー受付中の大会はありません。</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tournaments?.map(t => (
            <a key={t.id} href={`/tournaments/${t.id}`} className="card block transition hover:border-akane">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="font-display font-bold text-navy">{t.name}</h2>
                <span className="badge-navy shrink-0">募集中</span>
              </div>
              {t.description && <p className="mb-3 text-sm text-ink/70 line-clamp-2">{t.description}</p>}
              <dl className="grid grid-cols-1 gap-1 font-mono text-xs text-ink/60 sm:grid-cols-2">
                <div>開催日: {formatDate(t.event_date)}</div>
                <div>会場: {t.location ?? '未定'}</div>
                <div>締切: {formatDeadline(t.entry_deadline)}</div>
                <div>定員: {t.capacity ? `${t.capacity}名` : '未定'}</div>
              </dl>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
