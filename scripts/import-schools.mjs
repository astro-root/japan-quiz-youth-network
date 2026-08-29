import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を環境変数で指定してください')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const VALID_TYPES = ['中学', '高校', '中等教育学校', '高等専門学校']

async function main() {
  const raw = await readFile('school.csv', 'utf-8')
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)

  const first = lines[0].split(',').map(s => s.trim())
  const hasHeader = first[0] === '地域' && first[1] === '都道府県' && first[2] === '区分' && first[3] === '学校名'
  const dataLines = hasHeader ? lines.slice(1) : lines

  const rowMap = new Map()
  const skipped = []
  const duplicates = []

  for (const line of dataLines) {
    const [, prefecture, schoolType, name] = line.split(',').map(s => s.trim())
    if (!prefecture || !schoolType || !name) { skipped.push(line); continue }
    if (!VALID_TYPES.includes(schoolType)) { skipped.push(line); continue }

    const key = `${prefecture}__${name}`
    if (rowMap.has(key)) { duplicates.push(line) }
    rowMap.set(key, { name, prefecture, school_type: schoolType })
  }

  const rows = Array.from(rowMap.values())

  console.log(`取り込み対象: ${rows.length}件 / 不正な行でスキップ: ${skipped.length}件 / 重複でスキップ: ${duplicates.length}件`)
  if (skipped.length > 0) {
    console.log('不正な行（区分が不正、または列が不足しています）:')
    skipped.forEach(l => console.log(' -', l))
  }
  if (duplicates.length > 0) {
    console.log('重複していた行（都道府県+学校名が同一、後勝ちで1件のみ登録）:')
    duplicates.forEach(l => console.log(' -', l))
  }

  const chunkSize = 500
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase
      .from('schools')
      .upsert(chunk, { onConflict: 'name,prefecture', ignoreDuplicates: false })
    if (error) {
      console.error(`chunk ${i / chunkSize + 1} でエラー:`, error.message)
      process.exit(1)
    }
    console.log(`${Math.min(i + chunk.length, rows.length)} / ${rows.length} 件 完了`)
  }

  console.log('取り込み完了')
}

main()
