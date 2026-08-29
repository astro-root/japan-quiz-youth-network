'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function MembershipApplyButton({ organizationId }: { organizationId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleApply() {
    if (!confirm('連盟への加盟を申請します。よろしいですか？')) return
    setBusy(true)
    const { error } = await supabase.rpc('apply_for_membership', { p_organization_id: organizationId })
    setBusy(false)
    if (error) return alert(error.message)
    router.refresh()
  }

  return (
    <button onClick={handleApply} disabled={busy} className="btn-primary">
      {busy ? '送信中...' : '連盟に加盟申請する'}
    </button>
  )
}
