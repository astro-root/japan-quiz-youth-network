export default function Home() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-4">全国中高クイズ統括団体</h1>
      <p className="text-gray-600 mb-8">
        全国の中高クイズ団体・大会・プレイヤーをつなぎ、クイズ大会運営の負担を減らし、
        中高クイズ界全体の基盤となることを目指します。
      </p>
      <div className="flex gap-4 mb-12">
        <a href="/register" className="px-6 py-3 bg-black text-white rounded-lg">新規登録</a>
        <a href="/clubs" className="px-6 py-3 border rounded-lg">加盟クイズ研究部一覧</a>
        <a href="/login" className="px-6 py-3 border rounded-lg">ログイン</a>
      </div>
      <div className="border-t pt-8">
        <h2 className="text-lg font-bold mb-2">クイズ研究部の代表者の方へ</h2>
        <p className="text-gray-600 text-sm">
          部員として登録すると、部長・顧問はマイページから連盟への加盟を申請できます。
          審査後、正式な加盟団体としてクイズ研究部一覧に掲載されます。
        </p>
      </div>
    </main>
  )
}
