import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: authUser } = await supabase.auth.admin.listUsers()
const target = authUser.users.find(u => u.email === 'astro.root.quiz@gmail.com')

if (!target) {
  console.log('このメールアドレスでの登録がまだありません。先にアプリから登録を済ませてください。')
  process.exit(0)
}

const { data: profile } = await supabase.from('profiles').select('is_staff, is_super_admin').eq('id', target.id).single()
console.log('現在の権限:', profile)

if (profile && !profile.is_super_admin) {
  const { error } = await supabase.from('profiles').update({ is_staff: true, is_super_admin: true }).eq('id', target.id)
  if (error) { console.error(error.message); process.exit(1) }
  console.log('最高管理者権限を付与しました')
} else if (profile) {
  console.log('既に最高管理者です')
}
