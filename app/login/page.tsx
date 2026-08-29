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
    <main className="mx-auto max-w-sm px-6 py-12">
      <p className="eyebrow mb-2">Sign in</p>
      <h1 className="page-title mb-6">ログイン</h1>
      <form onSubmit={handleLogin} className="space-y-3">
        <input placeholder="メールアドレス" type="email" onChange={e => setEmail(e.target.value)} className="input-base" />
        <input placeholder="パスワード" type="password" onChange={e => setPassword(e.target.value)} className="input-base" />
        <button className="btn-primary w-full">ログイン</button>
      </form>
    </main>
  )
}
