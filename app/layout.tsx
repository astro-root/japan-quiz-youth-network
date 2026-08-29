import './globals.css'

export const metadata = {
  title: '全国中高クイズ統括団体',
  description: '全国の中高クイズ団体・大会・プレイヤーをつなぐプラットフォーム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
