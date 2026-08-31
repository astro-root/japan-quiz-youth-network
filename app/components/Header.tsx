'use client'
import { useState } from 'react'

export default function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6 md:py-4">
        <a href="/" className="flex items-center gap-2">
          <img src="/logo.jpeg" alt="全国中高クイズ連盟" className="h-9 w-9 rounded-full object-cover" />
          <div className="leading-tight">
            <div className="font-display text-sm font-bold text-navy">全国中高クイズ連盟</div>
            <div className="font-mono text-[10px] text-ink/50">Japan Youth Quiz Network</div>
          </div>
        </a>

        <nav className="hidden gap-6 font-display text-sm font-bold text-navy md:flex">
          <a href="/philosophy" className="hover:text-akane">理念</a>
          <a href="/tournaments" className="hover:text-akane">大会エントリー</a>
          <a href="/clubs" className="hover:text-akane">クイズ研究部</a>
          <a href="/team" className="hover:text-akane">運営体制</a>
          <a href="/mypage" className="hover:text-akane">マイページ</a>
          <a href="/login" className="hover:text-akane">ログイン</a>
        </nav>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="メニューを開く">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#14213D" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-line px-4 py-3 font-display text-sm font-bold text-navy md:hidden">
          <a href="/philosophy" className="rounded-lg px-2 py-2 hover:bg-white" onClick={() => setOpen(false)}>理念</a>
          <a href="/tournaments" className="rounded-lg px-2 py-2 hover:bg-white" onClick={() => setOpen(false)}>大会エントリー</a>
          <a href="/clubs" className="rounded-lg px-2 py-2 hover:bg-white" onClick={() => setOpen(false)}>クイズ研究部</a>
          <a href="/team" className="rounded-lg px-2 py-2 hover:bg-white" onClick={() => setOpen(false)}>運営体制</a>
          <a href="/mypage" className="rounded-lg px-2 py-2 hover:bg-white" onClick={() => setOpen(false)}>マイページ</a>
          <a href="/login" className="rounded-lg px-2 py-2 hover:bg-white" onClick={() => setOpen(false)}>ログイン</a>
        </nav>
      )}
    </header>
  )
}
