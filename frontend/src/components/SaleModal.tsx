import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, brl, fromCents, todayInput, toCents, PAYMENT_LABEL } from '../lib/format'
import { showToast } from '../lib/toast'
import Modal from './Modal'

function isCash(method: string) { return method === 'pix' || method === 'card' }

function emptyPayment() {
  return { method: 'pix', amount: '', installments: '1', fee: '', status: 'paid', receivedAt: todayInput() }
}

export default function SaleModal({ leadId, leadName, sale, onClose, onSaved }: {
  leadId?: number; leadName?: string; sale?: any; onClose: () => void; onSaved?: () => void
}) {
  const qc = useQueryClient()
  const { data: ops } = useQuery({ queryKey: ['operations'], queryFn: async () => (await api.get('/operations')).data })
  const activeOps = (ops || []).filter((o: any) => !o.archived_at)
  const [form, setForm] = useState<any>(() => {
    if (sale) {
      return {
        opId: sale.operation_id ?? '',
        closedAt: String(sale.closed_at ?? '').slice(0, 10) || todayInput(),
        description: sale.description ?? '',
        payments: (sale.payments || []).map((p: any) => ({
          method: p.method, amount: fromCents(p.amount_cents), installments: String(p.installments || 1),
          fee: fromCents(p.gateway_fee_cents), status: p.status, receivedAt: String(p.received_at || '').slice(0, 10),
        })),
      }
    }
    return { opId: activeOps[0]?.id ?? '', closedAt: todayInput(), description: '', payments: [emptyPayment()] }
  })
  const [err, setErr] = useState('')
  const [confirmRefund, setConfirmRefund] = useState(false)

  useEffect(() => {
    if (!form.opId && activeOps.length) setForm((f: any) => ({ ...f, opId: activeOps[0].id }))
  }, [activeOps.length])

  const selectedOp = (ops || []).find((o: any) => o.id === Number(form.opId))
  const percent = sale ? Number(sale.commission_percent ?? 0) : Number(selectedOp?.commission_percent ?? 0)
  const totals = (form.payments || []).reduce((acc: any, p: any) => {
    const amount = toCents(p.amount)
    acc.fat += amount
    if (isCash(p.method) && p.status === 'paid') {
      acc.cash += amount - (p.method === 'card' ? toCents(p.fee) : 0)
    } else if (isCash(p.method)) {
      acc.open += amount
    }
    return acc
  }, { fat: 0, cash: 0, open: 0 })
  const commission = Math.round(totals.cash * percent / 100)

  function update(i: number, key: string, value: any) {
    const payments = [...form.payments]
    payments[i] = { ...payments[i], [key]: value }
    setForm({ ...form, payments })
  }
  function changeMethod(i: number, method: string) {
    const payments = [...form.payments]
    payments[i] = { ...payments[i], method }
    if (method === 'boleto') payments[i] = { ...payments[i], status: 'paid', fee: '', receivedAt: '', installments: '1' }
    if (method === 'card' && !payments[i].receivedAt) payments[i].receivedAt = todayInput()
    setForm({ ...form, payments })
  }

  const save = useMutation({
    mutationFn: async () => {
      const payments = (form.payments || []).map((p: any) => {
        const amount = toCents(p.amount)
        if (amount <= 0) throw new Error('Informe o valor de todos os pagamentos.')
        if (p.method === 'boleto') return { method: 'boleto', amount_cents: amount, installments: 1, gateway_fee_cents: 0, status: 'paid', received_at: null }
        return {
          method: p.method,
          amount_cents: amount,
          installments: p.method === 'card' ? Number(p.installments || 1) : 1,
          gateway_fee_cents: p.method === 'card' ? toCents(p.fee) : 0,
          status: p.status,
          received_at: p.status === 'paid' ? (p.receivedAt || todayInput()) : null,
        }
      })
      const payload: any = { description: form.description || null, closed_at: form.closedAt || todayInput(), payments }
      if (sale) return (await api.put(`/sales/${sale.id}`, payload)).data
      if (!form.opId) throw new Error('Escolha a operação.')
      payload.lead_id = leadId
      payload.operation_id = Number(form.opId)
      return (await api.post('/sales', payload)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['lead'] })
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      qc.invalidateQueries({ queryKey: ['finance'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      showToast(sale ? 'Venda atualizada.' : 'Venda registrada.')
      onSaved?.()
      onClose()
    },
    onError: (e: any) => setErr(apiError(e)),
  })

  const refund = useMutation({
    mutationFn: async () => (await api.delete(`/sales/${sale.id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['lead'] })
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      qc.invalidateQueries({ queryKey: ['finance'] })
      showToast('Reembolso registrado. A venda foi preservada e o lead movido para Reembolso.')
      onSaved?.()
      onClose()
    },
    onError: (e: any) => { setErr(apiError(e)); setConfirmRefund(false) },
  })

  const refunded = Boolean(sale?.refund)

  return (
    <Modal
      title={sale ? 'Editar venda' : 'Registrar venda'}
      sub={leadName ? `Lead: ${leadName}` : undefined}
      wide
      onClose={onClose}
      footer={<>
        {sale && !refunded && <button className="btn danger" style={{ marginRight: 'auto' }} onClick={() => setConfirmRefund(true)}>Excluir venda / reembolso</button>}
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn primary" disabled={refunded || save.isPending || !form.payments?.length} onClick={() => { setErr(''); save.mutate() }}>{save.isPending ? 'Salvando...' : 'Salvar venda'}</button>
      </>}
    >
      {refunded && <div className="alert"><h3>Venda reembolsada</h3><p className="sub">O registro financeiro original foi preservado. Esta venda não pode mais ser alterada.</p></div>}
      <div className="two">
        <div className="field">
          <label>Operação</label>
          <select className="in" value={form.opId} disabled={Boolean(sale)} onChange={e => setForm({ ...form, opId: e.target.value })}>
            {!activeOps.length && <option value="">Nenhuma operação ativa</option>}
            {activeOps.map((o: any) => <option key={o.id} value={o.id}>{o.name} ({o.commission_percent}%)</option>)}
          </select>
        </div>
        <div className="field"><label>Data de fechamento</label><input className="in" type="date" value={form.closedAt} onChange={e => setForm({ ...form, closedAt: e.target.value })} /></div>
      </div>

      {(form.payments || []).map((p: any, i: number) => (
        <div className="pcard" key={i}>
          <div className="ph">
            <span className="eyebrow">Pagamento {i + 1}</span>
            <div>
              <span className={`pill ${isCash(p.method) ? 'ok' : ''}`}>{isCash(p.method) ? 'Entra no caixa' : 'Só faturamento'}</span>
              {form.payments.length > 1 && <button className="btn sm danger" onClick={() => setForm({ ...form, payments: form.payments.filter((_: any, idx: number) => idx !== i) })}>Remover</button>}
            </div>
          </div>
          <div className="two">
            <div className="field"><label>Forma</label><select className="in" value={p.method} onChange={e => changeMethod(i, e.target.value)}>{Object.entries(PAYMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div className="field"><label>Valor (R$)</label><input className="in" inputMode="decimal" value={p.amount} onChange={e => update(i, 'amount', e.target.value)} placeholder="0,00" /></div>
          </div>
          {p.method === 'card' && <div className="two">
            <div className="field"><label>Parcelas</label><select className="in" value={p.installments} onChange={e => update(i, 'installments', e.target.value)}>{Array.from({ length: 12 }, (_, n) => n + 1).map(n => <option key={n} value={n}>{n}x</option>)}</select></div>
            <div className="field"><label>Taxa gateway (R$)</label><input className="in" inputMode="decimal" value={p.fee} onChange={e => update(i, 'fee', e.target.value)} placeholder="0,00" /></div>
          </div>}
          {isCash(p.method) && <div className="two">
            <div className="field"><label>Status</label><div className="seg"><button type="button" aria-pressed={p.status === 'paid'} onClick={() => update(i, 'status', 'paid')}>Pago</button><button type="button" aria-pressed={p.status === 'pending'} onClick={() => update(i, 'status', 'pending')}>Pendente</button></div></div>
            {p.status === 'paid' && <div className="field"><label>Data efetiva de recebimento</label><input className="in" type="date" value={p.receivedAt} onChange={e => update(i, 'receivedAt', e.target.value)} /></div>}
          </div>}
          {p.method === 'boleto' && <p className="sub">Boleto é sempre considerado pago, entra só no faturamento e nunca no caixa.</p>}
        </div>
      ))}
      <button className="btn" style={{ borderStyle: 'dashed' }} onClick={() => setForm({ ...form, payments: [...form.payments, emptyPayment()] })}>Adicionar pagamento</button>
      <div className="field"><label>Descrição da venda</label><textarea className="in" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <div className="tot">
        <div className="card"><span className="eyebrow">Faturamento</span><strong className="num">{brl(totals.fat)}</strong></div>
        <div className="card cx"><span className="eyebrow">Caixa líquido</span><strong className="num">{brl(totals.cash)}</strong></div>
        <div className="card"><span className="eyebrow">A receber</span><strong className="num">{brl(totals.open)}</strong></div>
        <div className="card"><span className="eyebrow">Comissão ({percent}%)</span><strong className="num">{brl(commission)}</strong></div>
      </div>
      {err && <p className="msg">{err}</p>}
      {confirmRefund && <div className="alert"><h3>Confirmar reembolso?</h3><p className="sub">A venda original será preservada. O sistema registrará reembolso de 100%, estornará caixa e comissão, cancelará pendências e moverá o lead para Reembolso.</p><div className="acts"><button className="btn" onClick={() => setConfirmRefund(false)}>Cancelar</button><button className="btn danger" disabled={refund.isPending} onClick={() => refund.mutate()}>{refund.isPending ? 'Processando...' : 'Confirmar reembolso'}</button></div></div>}
    </Modal>
  )
}
