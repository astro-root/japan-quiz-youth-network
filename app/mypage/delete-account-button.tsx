'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DeleteAccountButton() {
  const supabase = createClient()
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    if (!confirm('アカウントを削除します。ログイン情報とプロフィールは完全に削除され、元に戻せません。よろしいですか？')) return
    if (!confirm('本当によろしいですか？大会参加履歴などの記録は連盟側に残りますが、あなた個人のアカウントとの紐付けは失われます。')) return
    setBusy(true)
    const res = await fetch('/api/delete-account', { method: 'POST' })
    const result = await res.json()
    if (!res.ok) {
      setBusy(false)
      return alert(`削除に失敗しました: ${result.error}`)
    }
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <button onClick={handleDelete} disabled={busy} className="text-xs font-bold text-akane underline disabled:opacity-50">
      {busy ? '削除中...' : 'アカウントを削除する'}
    </button>
  )
}
