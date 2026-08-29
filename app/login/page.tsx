'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Login() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return alert(error.message)
    window.location.href = '/mypage'
  }

  return (
    <main className="max-w-sm mx-auto px-6 py-12">
      <h1 className="text-xl font-bold mb-6">ログイン</h1>
      <form onSubmit={handleLogin} className="space-y-3">
        <input placeholder="メールアドレス" type="email" onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded" />
        <input placeholder="パスワード" type="password" onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded" />
        <button className="w-full bg-black text-white p-2 rounded">ログイン</button>
      </form>
    </main>
  )
}
