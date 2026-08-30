import { createClient } from '@/lib/supabase/server'
import { FEDERATION_ROLE_LABELS, type FederationRole } from '@/lib/roles'

const DISPLAY_ORDER: FederationRole[] = ['federation_president', 'cto', 'admin', 'engineer', 'staff']

export default async function Team() {
  const supabase = await createClient()
  const { data: people } = await supabase
    .from('profiles')
    .select('handle_name, federation_roles')
    .neq('federation_roles', '{member}')

  const byRole: Record<string, string[]> = {}
  for (const person of people ?? []) {
    for (const role of (person.federation_roles ?? [])) {
      if (role === 'member') continue
      byRole[role] = byRole[role] ?? []
      byRole[role].push(person.handle_name)
    }
  }

  return (
    <main className="page-container">
      <div className="page-reading">
      <p className="eyebrow mb-2">Team</p>
      <h1 className="page-title mb-8">運営体制</h1>
      <div className="space-y-8">
        {DISPLAY_ORDER.filter(role => byRole[role]?.length).map(role => (
          <div key={role}>
            <h2 className="mb-3 font-display text-lg font-bold text-navy">{FEDERATION_ROLE_LABELS[role]}</h2>
            <div className="flex flex-wrap gap-2">
              {byRole[role].map((name, i) => (
                <span key={i} className="badge-gold">{name}</span>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(byRole).length === 0 && <p className="text-sm text-ink/50">現在、公開できる役職者情報はありません。</p>}
      </div>
      </div>
    </main>
  )
}
