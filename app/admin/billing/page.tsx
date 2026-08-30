'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const CURRENT_FISCAL_YEAR = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1

export default function AdminBilling() {
  const supabase = createClient()
  const [rows, setRows] = useState<any[]>([])
  const [amount, setAmount] = useState(10000)
  const [busy, setBusy] = useState(false)

  async function load() {
    const { data } = await supabase
      .from('organization_billing')
      .select('*, organizations(name, schools(name))')
      .eq('fiscal_year', CURRENT_FISCAL_YEAR)
      .order('status')
    setRows(data ?? [])
  }
  useEffect(() => { load() }, [])

  async function issueInvoices() {
    if (!confirm(`${CURRENT_FISCAL_YEAR}年度分として、加盟団体全てに${amount}円の請求を発行します。よろしいですか？`)) return
    setBusy(true)
    const { error } = await supabase.rpc('admin_issue_invoices', { p_fiscal_year: CURRENT_FISCAL_YEAR, p_amount: amount })
    setBusy(false)
    if (error) return alert(error.message)
    load()
  }

  async function markPaid(id: string) {
    const { error } = await supabase.from('organization_billing')
      .update({ status: 'paid', paid_at: new Date().toISOString(), payment_method: 'bank_transfer' })
      .eq('id', id)
    if (error) return alert(error.message)
    load()
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="eyebrow mb-2">Billing</p>
      <h1 className="page-title mb-6">年会費管理（{CURRENT_FISCAL_YEAR}年度）</h1>

      <div className="mb-8 flex items-center gap-2">
        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="input-base w-32" />
        <span className="text-sm text-ink/60">円 / 団体</span>
        <button onClick={issueInvoices} disabled={busy} className="btn-primary">
          {busy ? '処理中...' : '加盟団体へ一斉請求発行'}
        </button>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-xs text-ink/50">
              <th className="p-3">団体</th><th>金額</th><th>状態</th><th>請求日</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="p-3">{r.organizations?.schools?.name} {r.organizations?.name}</td>
                <td>{r.amount.toLocaleString()}円</td>
                <td>
                  <span className={
                    r.status === 'paid' ? 'badge-navy' :
                    r.status === 'overdue' ? 'rounded-full bg-akane/10 px-3 py-1 text-xs font-bold text-akane' :
                    'badge-gold'
                  }>{r.status}</span>
                </td>
                <td>{r.invoiced_at ? new Date(r.invoiced_at).toLocaleDateString('ja-JP') : '-'}</td>
                <td>
                  {r.status !== 'paid' && (
                    <button onClick={() => markPaid(r.id)} className="font-display text-xs font-bold text-akane underline">振込確認済にする</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
