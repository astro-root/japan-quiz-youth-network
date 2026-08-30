'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Contact() {
  const supabase = createClient()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    const { error } = await supabase.from('inquiries').insert(form)
    setSending(false)
    if (error) return alert(error.message)
    setSent(true)
  }

  if (sent) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 md:px-6 md:py-12">
        <div className="card"><p className="text-sm text-ink/70">お問い合わせを受け付けました。内容を確認の上、ご連絡いたします。</p></div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10 md:px-6 md:py-12">
      <p className="eyebrow mb-2">Contact</p>
      <h1 className="page-title mb-6">お問い合わせ</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input placeholder="お名前" required onChange={e => setForm({ ...form, name: e.target.value })} className="input-base" />
        <input placeholder="メールアドレス" type="email" required onChange={e => setForm({ ...form, email: e.target.value })} className="input-base" />
        <textarea placeholder="お問い合わせ内容" required onChange={e => setForm({ ...form, message: e.target.value })} className="input-base min-h-40" />
        <button disabled={sending} className="btn-primary w-full">{sending ? '送信中...' : '送信する'}</button>
      </form>
    </main>
  )
}
