import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

function formatDate(d: string | null) {
  if (!d) return '未定'
  return new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
}
function formatDeadline(d: string | null) {
  if (!d) return '未定'
  return new Date(d).toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function TournamentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, description, event_date, location, entry_deadline, capacity, status, quiznavi_url')
    .eq('id', id)
    .maybeSingle()

  if (!tournament) notFound()

  const deadlinePassed = tournament.entry_deadline ? new Date(tournament.entry_deadline) < new Date() : false
  const canEnter = tournament.status === 'recruiting' && !deadlinePassed

  return (
    <main className="page-container">
      <div className="page-reading">
        <p className="eyebrow mb-2">Tournament</p>
        <h1 className="page-title mb-4">{tournament.name}</h1>

        <div className="card mb-6">
          <dl className="space-y-3">
            <div><dt className="font-mono text-xs text-ink/50">開催日</dt><dd>{formatDate(tournament.event_date)}</dd></div>
            <div><dt className="font-mono text-xs text-ink/50">会場</dt><dd>{tournament.location ?? '未定'}</dd></div>
            <div><dt className="font-mono text-xs text-ink/50">エントリー締切</dt><dd>{formatDeadline(tournament.entry_deadline)}</dd></div>
            <div><dt className="font-mono text-xs text-ink/50">定員</dt><dd>{tournament.capacity ? `${tournament.capacity}名` : '未定'}</dd></div>
            {tournament.description && (
              <div><dt className="font-mono text-xs text-ink/50">大会概要</dt><dd className="whitespace-pre-wrap">{tournament.description}</dd></div>
            )}
            {tournament.quiznavi_url && (
              <div>
                <dt className="font-mono text-xs text-ink/50">QuizNavi</dt>
                <dd><a href={tournament.quiznavi_url} target="_blank" rel="noopener noreferrer" className="text-akane underline">QuizNaviで詳細を見る →</a></dd>
              </div>
            )}
          </dl>
        </div>

        {canEnter
          ? <a href={`/tournaments/${tournament.id}/entry`} className="btn-primary w-full">この大会にエントリーする</a>
          : (
            <div className="card">
              <p className="text-sm text-ink/60">
                {tournament.status !== 'recruiting' ? 'この大会は現在エントリーを受け付けていません。' : 'エントリー締切を過ぎています。'}
              </p>
            </div>
          )}
      </div>
    </main>
  )
}
