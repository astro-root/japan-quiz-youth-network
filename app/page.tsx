import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const { count: memberCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: clubCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('membership_status', 'member')
  const { data: prefData } = await supabase.from('organizations').select('schools(prefecture)').eq('membership_status', 'member')
  const prefectureCount = new Set((prefData ?? []).map((r: any) => r.schools?.prefecture).filter(Boolean)).size
  const { data: latestNews } = await supabase.from('announcements').select('id, title, published_at').eq('status', 'published').order('published_at', { ascending: false }).limit(2)

  const faqs = [
    { q: 'Q1', title: '個人はどう登録する？', body: '学校を選んで登録するだけ。部員・部長・顧問、どの立場でも今すぐ始められます。' },
    { q: 'Q2', title: '部としての加盟は？', body: '部長・顧問はマイページから連盟への加盟を申請できます。審査後、正式な加盟団体として一覧に掲載されます。' },
    { q: 'Q3', title: '卒業したらどうなる？', body: 'アカウントも実績も消えません。OB/OGとして緩く繋がるか、運営協力者として関わり続けられます。' },
  ]

  return (
    <main>
      {/* ヒーロー: 濃紺のフルブリード帯 */}
      <section className="relative overflow-hidden bg-navy">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:gap-12 md:py-28 lg:px-8">
          <div>
            <p className="eyebrow mb-4 text-gold">Japan Youth Quiz Network</p>
            <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight text-paper sm:text-6xl md:text-7xl">
              全国の中高クイズを、
              <br />
              <span className="text-akane">ひとつの舞台</span>へ。
            </h1>
            <p className="mt-6 max-w-md text-paper/70">
              全国中高クイズ連盟は、全国の中高クイズ団体・大会・プレイヤーをつなぎ、
              クイズ大会運営の負担を減らし、中高クイズ界全体の基盤となることを目指します。
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="/register" className="btn-primary">新規登録</a>
              <a href="/clubs" className="btn-secondary !border-paper !bg-transparent !text-paper hover:!bg-paper hover:!text-navy">
                加盟クイズ研究部一覧
              </a>
            </div>
            <a href="/login" className="mt-6 inline-block font-display font-bold text-paper/60 underline underline-offset-4 hover:text-gold">
              ログインはこちら →
            </a>
          </div>

          <div className="flex justify-center md:justify-end">
            <svg viewBox="0 0 400 400" className="buzzer-pulse w-56 -rotate-3 sm:w-72 md:w-[26rem]" role="img" aria-label="早押しボタン">
              <defs>
                <radialGradient id="buzzerDome" cx="35%" cy="30%" r="75%">
                  <stop offset="0%" stopColor="#FF6B54" />
                  <stop offset="55%" stopColor="#FF3B30" />
                  <stop offset="100%" stopColor="#E22A1F" />
                </radialGradient>
              </defs>
              <circle cx="200" cy="200" r="185" fill="none" stroke="#F4F5F1" strokeOpacity="0.15" strokeWidth="2" />
              <circle cx="200" cy="200" r="150" fill="none" stroke="#FFC845" strokeWidth="3" strokeDasharray="3 12" />
              <circle cx="200" cy="200" r="122" fill="#000000" opacity="0.18" />
              <circle cx="200" cy="200" r="118" fill="url(#buzzerDome)" />
              <circle cx="200" cy="200" r="118" fill="none" stroke="#FFC845" strokeWidth="7" />
              <ellipse cx="165" cy="155" rx="46" ry="26" fill="#FFFFFF" opacity="0.22" />
              <text x="200" y="216" textAnchor="middle" fontFamily="'Zen Kaku Gothic New'" fontWeight="900" fontSize="56" fill="#F4F5F1">Q</text>
            </svg>
          </div>
        </div>
      </section>

      {/* 統計帯: 明るい色で反転させ、ヒーローとの強いコントラストを作る */}
      <section className="border-b-2 border-navy bg-gold/25">
        <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x-2 divide-navy px-4 py-10 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="font-mono text-3xl font-bold text-navy sm:text-4xl md:text-5xl">{memberCount ?? 0}</div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-wide text-navy/60 sm:text-xs">登録会員数</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-3xl font-bold text-navy sm:text-4xl md:text-5xl">{clubCount ?? 0}</div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-wide text-navy/60 sm:text-xs">加盟クイズ研究部</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-3xl font-bold text-navy sm:text-4xl md:text-5xl">{prefectureCount}</div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-wide text-navy/60 sm:text-xs">都道府県に展開</div>
          </div>
        </div>
      </section>

      <div className="page-container">
        <div className="page-wide">
          <section className="mt-4 md:mt-8">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {faqs.map(f => (
                <div key={f.q} className="card">
                  <p className="font-mono text-4xl font-black text-akane/20">{f.q}</p>
                  <h2 className="mt-1 font-display text-lg font-black tracking-tight text-navy">{f.title}</h2>
                  <p className="mt-2 text-sm text-ink/70">{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          {latestNews && latestNews.length > 0 && (
            <section className="mt-16 md:mt-20">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="page-title">お知らせ</h2>
                <a href="/announcements" className="text-sm font-bold text-navy underline">すべて見る</a>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {latestNews.map(n => (
                  <a key={n.id} href="/announcements" className="card block">
                    <p className="mb-1 font-mono text-xs text-ink/50">{n.published_at ? new Date(n.published_at).toLocaleDateString('ja-JP') : ''}</p>
                    <p className="font-display font-bold text-navy">{n.title}</p>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* CTA: もう一度フルブリードの濃紺帯に戻り、締めのリズムを作る */}
      <section className="border-y-2 border-navy bg-navy">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div>
            <p className="badge-gold mb-3">代表者の方へ</p>
            <h2 className="font-display text-2xl font-black tracking-tight text-paper md:text-3xl">
              クイズ研究部の部長・顧問の方へ
            </h2>
            <p className="mt-2 max-w-lg text-sm text-paper/70">
              部員として登録すると、部長・顧問はマイページから連盟への加盟を申請できます。
            </p>
          </div>
          <a href="/register" className="btn-primary mt-8 inline-flex shrink-0 md:mt-0">今すぐ登録</a>
        </div>
      </section>
    </main>
  )
}
