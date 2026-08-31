'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return alert(error.message)
    window.location.href = searchParams.get('next') || '/mypage'
  }

  return (
    <main className="page-container">
      <div className="page-narrow">
        <p className="eyebrow mb-2">Sign in</p>
        <h1 className="page-title mb-6">ログイン</h1>
        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="field-label" htmlFor="login-email">メールアドレス</label>
            <input id="login-email" placeholder="example@school.ac.jp" type="email" onChange={e => setEmail(e.target.value)} className="input-base" />
          </div>
          <div>
            <label className="field-label" htmlFor="login-password">パスワード</label>
            <input id="login-password" placeholder="パスワード" type="password" onChange={e => setPassword(e.target.value)} className="input-base" />
          </div>
          <button className="btn-primary w-full">ログイン</button>
        </form>
      </div>
    </main>
  )
}
