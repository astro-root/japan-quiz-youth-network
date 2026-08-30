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
const VALID_PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県',
  '三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県',
  '鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県',
  '福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県',
]
const PREFECTURE_MAP = new Map()
for (const full of VALID_PREFECTURES) {
  PREFECTURE_MAP.set(full, full)
  const short = full.replace(/(都|道|府|県)$/, '')
  if (!PREFECTURE_MAP.has(short)) PREFECTURE_MAP.set(short, full)
}

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
    const [, prefectureRaw, schoolType, name, address] = line.split(',').map(s => s?.trim())
    const prefecture = PREFECTURE_MAP.get(prefectureRaw)
    if (!prefecture || !schoolType || !name) { skipped.push(line); continue }
    if (!VALID_TYPES.includes(schoolType)) { skipped.push(line); continue }

    const key = `${prefecture}__${name}`
    if (rowMap.has(key)) duplicates.push(line)
    rowMap.set(key, { name, prefecture, school_type: schoolType, address: address || null })
  }

  const rows = Array.from(rowMap.values())
  console.log(`取り込み対象: ${rows.length}件 / 不正: ${skipped.length}件 / 重複: ${duplicates.length}件`)
  if (skipped.length > 0) { console.log('不正な行:'); skipped.forEach(l => console.log(' -', l)) }
  if (duplicates.length > 0) { console.log('重複していた行:'); duplicates.forEach(l => console.log(' -', l)) }

  const chunkSize = 500
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from('schools').upsert(chunk, { onConflict: 'name,prefecture' })
    if (error) { console.error(`chunk ${i / chunkSize + 1} でエラー:`, error.message); process.exit(1) }
    console.log(`${Math.min(i + chunk.length, rows.length)} / ${rows.length} 件 完了`)
  }
  console.log('取り込み完了')
}
main()
