'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TEMPLATE_QUESTIONS, QUESTION_TYPE_LABELS, QuestionType } from '@/lib/entryTemplates'

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

const QUESTION_TYPES: QuestionType[] = ['text', 'textarea', 'email', 'tel', 'radio', 'checkbox', 'select']
const OPTION_TYPES: QuestionType[] = ['radio', 'checkbox', 'select']

export default function AdminTournamentEdit() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tournament, setTournament] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [entries, setEntries] = useState<any[]>([])

  const [customLabel, setCustomLabel] = useState('')
  const [customType, setCustomType] = useState<QuestionType>('text')
  const [customRequired, setCustomRequired] = useState(true)
  const [customOptions, setCustomOptions] = useState('')
  const [addingCustom, setAddingCustom] = useState(false)

  async function load() {
    const { data: t } = await supabase.from('tournaments').select('*').eq('id', id).maybeSingle()
    setTournament(t)
    const { data: qs } = await supabase.from('entry_form_questions').select('*')
      .eq('tournament_id', id).order('position', { ascending: true }).order('created_at', { ascending: true })
    setQuestions((qs ?? []) as Question[])
    const { data: es } = await supabase.from('entries')
      .select('id, created_at, answers, profiles(handle_name, last_name, first_name)')
      .eq('tournament_id', id).order('created_at', { ascending: true })
    setEntries(es ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [id])

  async function saveTournament() {
    setSaving(true)
    const { error } = await supabase.from('tournaments').update({
      name: tournament.name,
      description: tournament.description,
      event_date: tournament.event_date || null,
      location: tournament.location,
      entry_deadline: tournament.entry_deadline || null,
      capacity: tournament.capacity === '' || tournament.capacity === null ? null : Number(tournament.capacity),
      status: tournament.status,
      quiznavi_url: tournament.quiznavi_url,
    }).eq('id', id)
    setSaving(false)
    if (error) return alert(error.message)
    alert('保存しました')
  }

  async function addTemplateQuestion(tq: typeof TEMPLATE_QUESTIONS[number]) {
    const { error } = await supabase.from('entry_form_questions').insert({
      tournament_id: id,
      position: questions.length,
      template_key: tq.templateKey,
      label: tq.label,
      question_type: tq.questionType,
      required: tq.required,
      options: tq.options,
      placeholder: tq.placeholder,
    })
    if (error) return alert(error.message)
    load()
  }

  async function addCustomQuestion() {
    if (!customLabel.trim()) return alert('質問文を入力してください')
    setAddingCustom(true)
    const options = OPTION_TYPES.includes(customType)
      ? customOptions.split('\n').map(s => s.trim()).filter(Boolean)
      : null
    if (options && options.length === 0) {
      setAddingCustom(false)
      return alert('選択肢を1つ以上入力してください')
    }
    const { error } = await supabase.from('entry_form_questions').insert({
      tournament_id: id,
      position: questions.length,
      template_key: null,
      label: customLabel.trim(),
      question_type: customType,
      required: customRequired,
      options,
      placeholder: null,
    })
    setAddingCustom(false)
    if (error) return alert(error.message)
    setCustomLabel(''); setCustomOptions(''); setCustomType('text'); setCustomRequired(true)
    load()
  }

  async function removeQuestion(qid: string) {
    if (!confirm('この質問項目を削除しますか？')) return
    const { error } = await supabase.from('entry_form_questions').delete().eq('id', qid)
    if (error) return alert(error.message)
    load()
  }

  async function moveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= questions.length) return
    const a = questions[index]
    const b = questions[target]
    const { error } = await supabase.from('entry_form_questions').update({ position: b.position }).eq('id', a.id)
    if (error) return alert(error.message)
    await supabase.from('entry_form_questions').update({ position: a.position }).eq('id', b.id)
    load()
  }

  if (loading) return <p className="p-12 font-mono text-sm text-ink/50">読み込み中...</p>
  if (!tournament) {
    return <main className="page-container"><div className="page-reading"><p className="text-sm text-ink/50">大会が見つかりませんでした。</p></div></main>
  }

  const usedTemplateKeys = new Set(questions.map(q => q.template_key).filter(Boolean))
  const availableTemplates = TEMPLATE_QUESTIONS.filter(tq => !usedTemplateKeys.has(tq.templateKey))

  return (
    <main className="page-container">
      <div className="page-reading">
        <p className="eyebrow mb-2">Admin</p>
        <h1 className="page-title mb-6">{tournament.name || '大会編集'}</h1>

        <section className="card mb-8 space-y-3">
          <h2 className="font-display font-bold text-navy">大会情報</h2>
          <div>
            <label className="field-label">大会名</label>
            <input value={tournament.name ?? ''} onChange={e => setTournament({ ...tournament, name: e.target.value })} className="input-base" />
          </div>
          <div>
            <label className="field-label">大会概要</label>
            <textarea value={tournament.description ?? ''} onChange={e => setTournament({ ...tournament, description: e.target.value })} className="input-base min-h-24" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">開催日</label>
              <input type="date" value={tournament.event_date ?? ''} onChange={e => setTournament({ ...tournament, event_date: e.target.value })} className="input-base" />
            </div>
            <div>
              <label className="field-label">会場</label>
              <input value={tournament.location ?? ''} onChange={e => setTournament({ ...tournament, location: e.target.value })} className="input-base" />
            </div>
            <div>
              <label className="field-label">エントリー締切</label>
              <input type="datetime-local" value={tournament.entry_deadline ? tournament.entry_deadline.slice(0, 16) : ''}
                onChange={e => setTournament({ ...tournament, entry_deadline: e.target.value ? new Date(e.target.value).toISOString() : '' })} className="input-base" />
            </div>
            <div>
              <label className="field-label">定員</label>
              <input type="number" min="0" value={tournament.capacity ?? ''} onChange={e => setTournament({ ...tournament, capacity: e.target.value })} className="input-base" />
            </div>
          </div>
          <div>
            <label className="field-label">QuizNaviの大会ページURL（任意）</label>
            <input value={tournament.quiznavi_url ?? ''} placeholder="https://quiznavi.example.com/tournaments/..."
              onChange={e => setTournament({ ...tournament, quiznavi_url: e.target.value })} className="input-base" />
          </div>
          <div>
            <label className="field-label">公開状態</label>
            <select value={tournament.status} onChange={e => setTournament({ ...tournament, status: e.target.value })} className="input-base">
              <option value="draft">下書き（非公開）</option>
              <option value="recruiting">募集中（一覧に表示・エントリー可）</option>
              <option value="closed">締切（エントリー不可）</option>
            </select>
          </div>
          <button onClick={saveTournament} disabled={saving} className="btn-primary">{saving ? '保存中...' : '大会情報を保存'}</button>
        </section>

        <section className="card mb-8 space-y-4">
          <h2 className="font-display font-bold text-navy">エントリーフォームの質問項目</h2>

          {questions.length === 0 && <p className="text-sm text-ink/50">まだ質問項目がありません。下記から追加してください。</p>}

          <div className="space-y-2">
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
                <div>
                  <div className="font-display text-sm font-bold text-navy">
                    {q.label} {q.required && <span className="text-akane">*</span>}
                  </div>
                  <div className="font-mono text-xs text-ink/50">
                    {QUESTION_TYPE_LABELS[q.question_type]}{q.options ? `（${q.options.join(' / ')}）` : ''}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => moveQuestion(i, -1)} disabled={i === 0} className="text-xs text-ink/50 disabled:opacity-30">↑</button>
                  <button onClick={() => moveQuestion(i, 1)} disabled={i === questions.length - 1} className="text-xs text-ink/50 disabled:opacity-30">↓</button>
                  <button onClick={() => removeQuestion(q.id)} className="font-display text-xs font-bold text-akane underline">削除</button>
                </div>
              </div>
            ))}
          </div>

          {availableTemplates.length > 0 && (
            <div>
              <p className="field-label mb-2">よく使う質問から追加</p>
              <div className="flex flex-wrap gap-2">
                {availableTemplates.map(tq => (
                  <button key={tq.templateKey} onClick={() => addTemplateQuestion(tq)} className="btn-secondary text-xs">
                    ＋ {tq.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-line pt-4">
            <p className="field-label mb-2">質問を自由に作成</p>
            <div className="space-y-2">
              <input placeholder="質問文（例: 所属団体名）" value={customLabel} onChange={e => setCustomLabel(e.target.value)} className="input-base" />
              <div className="grid grid-cols-2 gap-2">
                <select value={customType} onChange={e => setCustomType(e.target.value as QuestionType)} className="input-base">
                  {QUESTION_TYPES.map(t => <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={customRequired} onChange={e => setCustomRequired(e.target.checked)} />
                  必須項目にする
                </label>
              </div>
              {OPTION_TYPES.includes(customType) && (
                <textarea placeholder={'選択肢を改行区切りで入力\n例:\nA\nB\nC'} value={customOptions}
                  onChange={e => setCustomOptions(e.target.value)} className="input-base min-h-20" />
              )}
              <button onClick={addCustomQuestion} disabled={addingCustom} className="btn-secondary">質問を追加</button>
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="mb-4 font-display font-bold text-navy">応募一覧（{entries.length}件）</h2>
          {entries.length === 0 && <p className="text-sm text-ink/50">まだ応募がありません。</p>}
          <div className="space-y-3">
            {entries.map(en => (
              <div key={en.id} className="rounded-lg border border-line p-3">
                <div className="mb-2 font-mono text-xs text-ink/40">
                  {new Date(en.created_at).toLocaleString('ja-JP')} / {en.profiles?.handle_name ?? '（会員情報なし）'}
                </div>
                <dl className="space-y-1">
                  {questions.map(q => (
                    <div key={q.id} className="flex gap-2 text-sm">
                      <dt className="shrink-0 text-ink/50">{q.label}:</dt>
                      <dd>{Array.isArray(en.answers?.[q.id]) ? en.answers[q.id].join('、') : (en.answers?.[q.id] || '－')}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
