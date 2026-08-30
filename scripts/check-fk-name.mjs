import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data, error } = await supabase.rpc('pg_catalog_lookup').catch(() => ({ data: null, error: 'skip' }))
console.log('このスクリプトでは確認できません。Supabaseダッシュボードで確認してください。')
