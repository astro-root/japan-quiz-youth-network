import './globals.css'
import Header from './components/Header'

export const metadata = {
  title: '全国中高クイズ連盟 | Japan Youth Quiz Network',
  description: '全国の中高クイズ団体・大会・プレイヤーをつなぐプラットフォーム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@500;700;900&family=Noto+Sans+JP:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body">
        <Header />
        {children}
      </body>
    </html>
  )
}
