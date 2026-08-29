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
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-xl font-bold mb-6">年会費管理（{CURRENT_FISCAL_YEAR}年度）</h1>

      <div className="flex items-center gap-2 mb-8">
        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))}
          className="border p-2 rounded w-32" />
        <span>円 / 団体</span>
        <button onClick={issueInvoices} disabled={busy}
          className="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50">
          {busy ? '処理中...' : '加盟団体へ一斉請求発行'}
        </button>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">団体</th><th>金額</th><th>状態</th><th>請求日</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-b">
              <td className="py-2">{r.organizations?.schools?.name} {r.organizations?.name}</td>
              <td>{r.amount.toLocaleString()}円</td>
              <td>
                <span className={
                  r.status === 'paid' ? 'text-green-600' :
                  r.status === 'overdue' ? 'text-red-600' : 'text-gray-600'
                }>{r.status}</span>
              </td>
              <td>{r.invoiced_at ? new Date(r.invoiced_at).toLocaleDateString('ja-JP') : '-'}</td>
              <td>
                {r.status !== 'paid' && (
                  <button onClick={() => markPaid(r.id)} className="text-blue-600 underline">振込確認済にする</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
