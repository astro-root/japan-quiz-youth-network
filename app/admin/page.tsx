'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Admin() {
  const supabase = createClient()
  const [stats, setStats] = useState<any>(null)
  const [promoting, setPromoting] = useState(false)

  async function loadStats() {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: maleCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('gender', 'male')
    const { count: femaleCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('gender', 'female')
    const { data: schoolsWithMembers } = await supabase.from('profiles').select('school_id').not('school_id', 'is', null)
    const registeredSchoolCount = new Set(schoolsWithMembers?.map(s => s.school_id)).size
    setStats({ userCount, maleCount, femaleCount, registeredSchoolCount })
  }

  useEffect(() => { loadStats() }, [])

  async function handlePromote() {
    if (!confirm('全ユーザーの学年を一斉に繰り上げます。よろしいですか？')) return
    setPromoting(true)
    const { error } = await supabase.rpc('admin_promote_all_grades')
    setPromoting(false)
    if (error) return alert(error.message)
    alert('進級処理が完了しました')
    loadStats()
  }

  if (!stats) return <p className="p-12 font-mono text-sm text-ink/50">読み込み中...</p>

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="eyebrow mb-2">Admin</p>
      <h1 className="page-title mb-6">管理画面</h1>
      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="card"><div className="font-mono text-xs text-ink/50">登録ユーザー数</div><div className="font-display text-2xl font-bold text-navy">{stats.userCount}</div></div>
        <div className="card"><div className="font-mono text-xs text-ink/50">登録校数</div><div className="font-display text-2xl font-bold text-navy">{stats.registeredSchoolCount}</div></div>
        <div className="card"><div className="font-mono text-xs text-ink/50">男女比</div><div className="font-display text-2xl font-bold text-navy">{stats.maleCount}:{stats.femaleCount}</div></div>
      </div>
      <button onClick={handlePromote} disabled={promoting} className="btn-primary">
        {promoting ? '処理中...' : '年次進級を一斉実行'}
      </button>
    </main>
  )
}
