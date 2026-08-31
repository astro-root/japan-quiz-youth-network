'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PROFILE_PREFILL_MAP, PROFILE_WRITEBACK_MAP, QuestionType } from '@/lib/entryTemplates'

type Question = {
  id: string
  position: number
  template_key: string | null
  label: string
  question_type: QuestionType
  required: boolean
  options: string[] | null
  placeholder: string | null
}

export default function TournamentEntry() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tournament, setTournament] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [alreadyEntered, setAlreadyEntered] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/login?next=/tournaments/${id}/entry`)
        return
      }

      const { data: t } = await supabase.from('tournaments').select('*').eq('id', id).maybeSingle()
      if (!t) { setLoading(false); return }
      setTournament(t)

      const { data: qs } = await supabase.from('entry_form_questions')
        .select('*').eq('tournament_id', id).order('position', { ascending: true })
      const questionList = (qs ?? []) as Question[]
      setQuestions(questionList)

      const { data: existing } = await supabase.from('entries')
        .select('answers').eq('tournament_id', id).eq('user_id', user.id).maybeSingle()

      if (existing) {
        setAlreadyEntered(true)
        setAnswers(existing.answers ?? {})
      } else {
        const { data: profile } = await supabase.from('profiles')
          .select('last_name, first_name, last_name_kana, first_name_kana, handle_name, handle_name_kana')
          .eq('id', user.id).maybeSingle()

        const initial: Record<string, any> = {}
        for (const q of questionList) {
          if (q.template_key && q.template_key in PROFILE_PREFILL_MAP) {
            const field = PROFILE_PREFILL_MAP[q.template_key]
            initial[q.id] = field === 'email' ? (user.email ?? '') : ((profile as any)?.[field] ?? '')
          } else if (q.question_type === 'checkbox') {
            initial[q.id] = []
          } else {
            initial[q.id] = ''
          }
        }
        setAnswers(initial)
      }
      setLoading(false)
    }
    load()
  }, [id])

  function setAnswer(qid: string, value: any) {
    setAnswers(a => ({ ...a, [qid]: value }))
  }

  function toggleCheckbox(qid: string, option: string) {
    setAnswers(a => {
      const current: string[] = Array.isArray(a[qid]) ? a[qid] : []
      const next = current.includes(option) ? current.filter(o => o !== option) : [...current, option]
      return { ...a, [qid]: next }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    for (const q of questions) {
      if (!q.required) continue
      const v = answers[q.id]
      const empty = q.question_type === 'checkbox' ? !Array.isArray(v) || v.length === 0 : !v || String(v).trim() === ''
      if (empty) return alert(`「${q.label}」は必須項目です`)
    }

    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    const { error } = await supabase.from('entries').upsert({
      tournament_id: id,
      user_id: user.id,
      answers,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tournament_id,user_id' })

    if (error) {
      setSubmitting(false)
      return alert(`エントリーに失敗しました: ${error.message}`)
    }

    const profileUpdate: Record<string, any> = {}
    for (const q of questions) {
      if (q.template_key && q.template_key in PROFILE_WRITEBACK_MAP) {
        const field = PROFILE_WRITEBACK_MAP[q.template_key]
        const v = answers[q.id]
        if (v && String(v).trim() !== '') profileUpdate[field] = v
      }
    }
    if (Object.keys(profileUpdate).length > 0) {
      await supabase.from('profiles').update(profileUpdate).eq('id', user.id)
    }

    setSubmitting(false)
    alert(alreadyEntered ? 'エントリー内容を更新しました' : 'エントリーが完了しました')
    router.push('/mypage')
  }

  if (loading) return <p className="p-12 font-mono text-sm text-ink/50">読み込み中...</p>
  if (!tournament) {
    return (
      <main className="page-container">
        <div className="page-narrow"><p className="text-sm text-ink/50">大会が見つかりませんでした。</p></div>
      </main>
    )
  }

  const deadlinePassed = tournament.entry_deadline ? new Date(tournament.entry_deadline) < new Date() : false
  const closed = tournament.status !== 'recruiting' || deadlinePassed

  if (closed && !alreadyEntered) {
    return (
      <main className="page-container">
        <div className="page-narrow">
          <p className="eyebrow mb-2">Entry</p>
          <h1 className="page-title mb-4">{tournament.name}</h1>
          <div className="card"><p className="text-sm text-ink/60">この大会は現在エントリーを受け付けていません。</p></div>
        </div>
      </main>
    )
  }

  return (
    <main className="page-container">
      <div className="page-narrow">
        <p className="eyebrow mb-2">Entry</p>
        <h1 className="page-title mb-2">{tournament.name} エントリーフォーム</h1>
        {alreadyEntered && <p className="mb-6 badge-gold">この大会にはエントリー済みです。内容を変更して再送信できます。</p>}
        {!alreadyEntered && <p className="mb-8 text-sm text-ink/70">ログイン中のプロフィール情報が自動で入力されています。内容を確認・修正のうえ送信してください。</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map(q => (
            <div key={q.id}>
              <label className="field-label">{q.label}{q.required && <span className="ml-1 text-akane">*</span>}</label>

              {q.question_type === 'text' && (
                <input value={answers[q.id] ?? ''} placeholder={q.placeholder ?? ''} required={q.required}
                  onChange={e => setAnswer(q.id, e.target.value)} className="input-base" />
              )}
              {q.question_type === 'email' && (
                <input type="email" value={answers[q.id] ?? ''} placeholder={q.placeholder ?? ''} required={q.required}
                  onChange={e => setAnswer(q.id, e.target.value)} className="input-base" />
              )}
              {q.question_type === 'tel' && (
                <input type="tel" value={answers[q.id] ?? ''} placeholder={q.placeholder ?? ''} required={q.required}
                  onChange={e => setAnswer(q.id, e.target.value)} className="input-base" />
              )}
              {q.question_type === 'textarea' && (
                <textarea value={answers[q.id] ?? ''} placeholder={q.placeholder ?? ''} required={q.required}
                  onChange={e => setAnswer(q.id, e.target.value)} className="input-base min-h-28" />
              )}
              {q.question_type === 'select' && (
                <select value={answers[q.id] ?? ''} required={q.required}
                  onChange={e => setAnswer(q.id, e.target.value)} className="input-base">
                  <option value="">選択してください</option>
                  {(q.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
              {q.question_type === 'radio' && (
                <div className="space-y-1">
                  {(q.options ?? []).map(o => (
                    <label key={o} className="flex items-center gap-2 text-sm">
                      <input type="radio" name={q.id} value={o} checked={answers[q.id] === o}
                        onChange={() => setAnswer(q.id, o)} />
                      {o}
                    </label>
                  ))}
                </div>
              )}
              {q.question_type === 'checkbox' && (
                <div className="space-y-1">
                  {(q.options ?? []).map(o => (
                    <label key={o} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={Array.isArray(answers[q.id]) && answers[q.id].includes(o)}
                        onChange={() => toggleCheckbox(q.id, o)} />
                      {o}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {questions.length === 0 && <p className="text-sm text-ink/50">この大会にはまだ質問項目が設定されていません。運営にお問い合わせください。</p>}

          <button disabled={submitting || questions.length === 0} className="btn-primary w-full">
            {submitting ? '送信中...' : alreadyEntered ? '内容を更新する' : 'エントリーする'}
          </button>
        </form>
      </div>
    </main>
  )
}
