import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const { count: memberCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: clubCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('membership_status', 'member')
  const { data: prefData } = await supabase.from('organizations').select('schools(prefecture)').eq('membership_status', 'member')
  const prefectureCount = new Set((prefData ?? []).map((r: any) => r.schools?.prefecture).filter(Boolean)).size
  const { data: latestNews } = await supabase.from('announcements').select('id, title, published_at').eq('status', 'published').order('published_at', { ascending: false }).limit(2)

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
      <section className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
        <div>
          <p className="eyebrow mb-3">Japan Youth Quiz Network</p>
          <h1 className="font-display text-3xl font-black leading-tight text-navy sm:text-4xl md:text-5xl">
            全国の中高クイズを、<br />ひとつの舞台へ。
          </h1>
          <p className="mt-6 text-ink/70">
            全国中高クイズ連盟は、全国の中高クイズ団体・大会・プレイヤーをつなぎ、
            クイズ大会運営の負担を減らし、中高クイズ界全体の基盤となることを目指します。
          </p>
          <div className="mt-8 flex flex-wrap gap-3 md:gap-4">
            <a href="/register" className="btn-primary">新規登録</a>
            <a href="/clubs" className="btn-secondary">加盟クイズ研究部一覧</a>
            <a href="/login" className="font-display font-bold text-navy underline underline-offset-4">ログイン</a>
          </div>
        </div>

        <div className="flex justify-center">
          <svg viewBox="0 0 400 400" className="buzzer-pulse w-48 sm:w-64 md:w-80" role="img" aria-label="早押しボタン">
            <circle cx="200" cy="200" r="185" fill="none" stroke="#DCD6C7" strokeWidth="2" />
            <circle cx="200" cy="200" r="150" fill="none" stroke="#14213D" strokeWidth="3" strokeDasharray="3 12" />
            <circle cx="200" cy="200" r="118" fill="#BE2A28" />
            <circle cx="200" cy="200" r="118" fill="none" stroke="#C9A227" strokeWidth="7" />
            <text x="200" y="216" textAnchor="middle" fontFamily="'Zen Kaku Gothic New'" fontWeight="900" fontSize="56" fill="#FAF7EF">Q</text>
          </svg>
        </div>
      </section>

      <section className="mt-16 grid grid-cols-3 gap-4 border-y border-line py-8 md:mt-20">
        <div className="text-center">
          <div className="font-mono text-3xl font-bold text-navy md:text-4xl">{memberCount ?? 0}</div>
          <div className="mt-1 text-xs text-ink/50">登録会員数</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-3xl font-bold text-navy md:text-4xl">{clubCount ?? 0}</div>
          <div className="mt-1 text-xs text-ink/50">加盟クイズ研究部</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-3xl font-bold text-navy md:text-4xl">{prefectureCount}</div>
          <div className="mt-1 text-xs text-ink/50">都道府県に展開</div>
        </div>
      </section>

      <section className="mt-16 border-t border-line pt-12 md:mt-20 md:pt-16">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <p className="eyebrow mb-2">Q1.</p>
            <h2 className="page-title mb-2 text-lg">個人はどう登録する？</h2>
            <p className="text-sm text-ink/70">学校を選んで登録するだけ。部員・部長・顧問、どの立場でも今すぐ始められます。</p>
          </div>
          <div>
            <p className="eyebrow mb-2">Q2.</p>
            <h2 className="page-title mb-2 text-lg">部としての加盟は？</h2>
            <p className="text-sm text-ink/70">部長・顧問はマイページから連盟への加盟を申請できます。審査後、正式な加盟団体として一覧に掲載されます。</p>
          </div>
          <div>
            <p className="eyebrow mb-2">Q3.</p>
            <h2 className="page-title mb-2 text-lg">卒業したらどうなる？</h2>
            <p className="text-sm text-ink/70">アカウントも実績も消えません。OB/OGとして緩く繋がるか、運営協力者として関わり続けられます。</p>
          </div>
        </div>
      </section>

      {latestNews && latestNews.length > 0 && (
        <section className="mt-12 md:mt-16">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="page-title">お知らせ</h2>
            <a href="/announcements" className="text-sm font-bold text-navy underline">すべて見る</a>
          </div>
          <div className="space-y-3">
            {latestNews.map(n => (
              <a key={n.id} href="/announcements" className="card block transition hover:border-akane">
                <p className="mb-1 font-mono text-xs text-ink/50">{n.published_at ? new Date(n.published_at).toLocaleDateString('ja-JP') : ''}</p>
                <p className="font-display font-bold text-navy">{n.title}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 md:mt-16">
        <div className="card">
          <p className="badge-gold mb-3">代表者の方へ</p>
          <h2 className="page-title mb-2">クイズ研究部の部長・顧問の方へ</h2>
          <p className="text-sm text-ink/70">部員として登録すると、部長・顧問はマイページから連盟への加盟を申請できます。</p>
        </div>
      </section>
    </main>
  )
}
