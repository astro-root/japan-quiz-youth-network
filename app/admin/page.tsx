'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Admin() {
  const supabase = createClient()
  const [stats, setStats] = useState<any>(null)
  const [promoting, setPromoting] = useState(false)

  async function loadStats() {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: schoolCount } = await supabase.from('schools').select('*', { count: 'exact', head: true }).gt('id', '00000000-0000-0000-0000-000000000000')
    const { count: maleCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('gender', 'male')
    const { count: femaleCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('gender', 'female')
    const { data: schoolsWithMembers } = await supabase.from('profiles').select('school_id').not('school_id', 'is', null)
    const registeredSchoolCount = new Set(schoolsWithMembers?.map(s => s.school_id)).size
    setStats({ userCount, schoolCount, maleCount, femaleCount, registeredSchoolCount })
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

  if (!stats) return <p className="p-12">読み込み中...</p>

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-xl font-bold mb-6">管理画面</h1>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border rounded-lg p-4"><div className="text-sm text-gray-500">登録ユーザー数</div><div className="text-2xl font-bold">{stats.userCount}</div></div>
        <div className="border rounded-lg p-4"><div className="text-sm text-gray-500">登録校数</div><div className="text-2xl font-bold">{stats.registeredSchoolCount}</div></div>
        <div className="border rounded-lg p-4"><div className="text-sm text-gray-500">男女比</div><div className="text-2xl font-bold">{stats.maleCount}:{stats.femaleCount}</div></div>
      </div>
      <button onClick={handlePromote} disabled={promoting}
        className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
        {promoting ? '処理中...' : '年次進級を一斉実行'}
      </button>
    </main>
  )
}
