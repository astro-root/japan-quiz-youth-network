export default function Footer() {
  return (
    <footer className="mt-16 border-t border-navy bg-navy py-8">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 text-center font-mono text-xs text-paper/50 md:flex-row md:justify-between sm:px-6">
        <span>© 全国中高クイズ連盟 / Japan Youth Quiz Network</span>
        <div className="flex gap-4">
          <a href="/announcements" className="hover:text-gold">お知らせ</a>
          <a href="/contact" className="hover:text-gold">お問い合わせ</a>
          <a href="/privacy" className="hover:text-gold">プライバシーポリシー</a>
          <a href="/terms" className="hover:text-gold">利用規約</a>
        </div>
      </div>
    </footer>
  )
}
