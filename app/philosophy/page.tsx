const MISSIONS = [
  {
    no: '01',
    title: 'つなぐ',
    body: '全国の学校・団体・プレイヤーをつなぐ。',
  },
  {
    no: '02',
    title: '広げる',
    body: '地域や学校の壁を越えて、クイズに触れる機会を広げる。',
  },
  {
    no: '03',
    title: '支える',
    body: '大会や活動を行う人たちを支え、中高クイズ界の運営基盤を整える。',
  },
  {
    no: '04',
    title: '残す',
    body: '大会・活動・記録を蓄積し、中高クイズの歴史を次の世代へ残す。',
  },
]

export default function Philosophy() {
  return (
    <main className="page-container">
      <div className="page-reading">
        <p className="eyebrow mb-3">Philosophy</p>
        <h1 className="font-display text-2xl font-black leading-snug text-navy sm:text-3xl md:text-4xl">
          全国の中高生が、クイズを通じてつながり、挑戦できる環境を。
        </h1>

        <div className="mt-8 space-y-4 text-ink/80">
          <p>
            クイズは、知識を競うだけのものではない。
            同じ問題に向き合い、仲間と考え、互いの知識や考え方に触れる中で、新しい興味やつながりが生まれる。
          </p>
          <p>
            現在、日本各地の中学校・高等学校では、クイズ研究部や同好会、個人による活動など、さまざまな形でクイズが行われている。
            しかし、学校や地域を越えたつながりはまだ十分とはいえない。
            大会や活動に関する情報が分散していたり、他校と交流する機会が限られていたり、クイズを始めたいと思っても身近に活動できる場所が見つからないこともある。
          </p>
          <p>私たちは、こうした壁を越えたい。</p>
          <p>
            全国中高クイズ連盟は、全国の中高生、クイズ研究部・同好会、大会運営者などをつなぎ、中高クイズ界の発展を支える基盤となることを目指す。
          </p>
          <p>
            大会やイベントの情報をつなぐ。
            学校や地域を越えた交流の機会をつくる。
            クイズ活動を始めるきっかけを増やす。
            そして、一人ひとりの挑戦を支える。
          </p>
          <p>
            全国のどこにいても、クイズを通じて誰かとつながり、新しいことに挑戦できる。
            そんな中高クイズ界を、私たちはつくっていく。
          </p>
        </div>

        <div className="my-12 border-y border-line py-8 text-center sm:py-10">
          <p className="font-display text-xl font-black leading-snug text-akane sm:text-2xl md:text-3xl">
            全国の中高クイズを、<br className="sm:hidden" />ひとつの舞台へ。
          </p>
        </div>

        <h2 className="page-title mb-6">私たちが目指す4つのこと</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {MISSIONS.map(m => (
            <div key={m.no} className="card">
              <p className="eyebrow mb-2">{m.no}</p>
              <h3 className="mb-2 font-display text-lg font-bold text-navy">{m.title}</h3>
              <p className="text-sm text-ink/70">{m.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
