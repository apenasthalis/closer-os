import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

function toCents(s: string) { const n = parseFloat((s || '').replace(/\./g, '').replace(',', '.')); return isNaN(n) ? 0 : Math.round(n * 100) }
function fromCents(c: number) { return (c / 100).toFixed(2).replace('.', ',') }
function isCash(m: string) { return m === 'pix' || m === 'card' }
function normPay(p: any) {
  const m = p.method
  const v = toCents(p.valor)
  if (m === 'boleto') return { method: m, amount_cents: v, installments: 1, gateway_fee_cents: 0, status: 'paid', received_at: null }
  if (m === 'pix') return { method: m, amount_cents: v, installments: 1, gateway_fee_cents: 0, status: p.status, received_at: p.status === 'paid' ? p.recebidoEm : null }
  return { method: m, amount_cents: v, installments: +p.parcelas || 1, gateway_fee_cents: toCents(p.taxa), status: p.status, received_at: p.status === 'paid' ? p.recebidoEm : null }
}
function calc(pags: any[]) {
  let fat = 0, bruto = 0, taxa = 0, aberto = 0
  pags.forEach(p => {
    const n = normPay(p)
    fat += n.amount_cents
    if (isCash(n.method)) {
      if (n.status === 'paid') { bruto += n.amount_cents; if (n.method === 'card') taxa += n.gateway_fee_cents } else aberto += n.amount_cents
    }
  })
  return { fat, caixa: bruto - taxa, aberto }
}

export default function SaleModal({ leadId, leadName, sale, onClose, onSaved }: any) {
  const qc = useQueryClient()
  const { data: ops } = useQuery({ queryKey: ['operations'], queryFn: async () => (await api.get('/operations')).data })
  const activeOps = (ops || []).filter((o: any) => !o.archived_at)
  const [form, setForm] = useState<any>(() => {
    if (sale) {
      return {
        opId: sale.operation_id,
        fechadoEm: sale.closed_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        descricao: sale.description || '',
        pags: sale.payments.map((p: any) => ({
          method: p.method, valor: fromCents(p.amount_cents), parcelas: String(p.installments || 1),
          taxa: fromCents(p.gateway_fee_cents), status: p.status, recebidoEm: p.received_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        })),
      }
    }
    return {
      opId: activeOps[0]?.id || '',
      fechadoEm: new Date().toISOString().slice(0, 10),
      descricao: '',
      pags: [{ method: 'pix', valor: '', parcelas: '1', taxa: '', status: 'pago', recebidoEm: new Date().toISOString().slice(0, 10) }],
    }
  })
  const [err, setErr] = useState('')
  useEffect(() => {
    if (!form.opId && activeOps.length) setForm((f: any) => ({ ...f, opId: activeOps[0].id }))
  }, [activeOps.length])

  const op = (ops || []).find((o: any) => o.id === form.opId)
  const c = calc(form.pags)
  const pct = sale && sale.operation_id === form.opId ? sale.commission_percent : (op?.commission_percent || 0)
  const com = Math.round(c.caixa * pct / 100)

  const save = useMutation({
    mutationFn: async () => {
      const pags = form.pags.map(normPay)
      for (let i = 0; i < pags.length; i++) {
        if (pags[i].amount_cents <= 0) throw new Error(`Informe o valor do pagamento ${i + 1}.`)
        if (isCash(pags[i].method) && pags[i].status === 'paid' && !pags[i].received_at) throw new Error(`Informe a data de recebimento do pagamento ${i + 1}.`)
      }
      if (sale) {
        return (await api.put(`/sales/${sale.id}`, { operation_id: form.opId, description: form.descricao, closed_at: form.fechadoEm, payments: pags })).data
      }
      return (await api.post('/sales', { lead_id: leadId, operation_id: form.opId, description: form.descricao, closed_at: form.fechadoEm, payments: pags })).data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); qc.invalidateQueries({ queryKey: ['sales'] }); qc.invalidateQueries({ queryKey: ['finance'] }); onSaved?.(); onClose() },
    onError: (e: any) => setErr(e?.response?.data?.message || e?.message || 'Erro ao salvar'),
  })

  function updPay(i: number, k: string, v: any) {
    const n = [...form.pags]; n[i] = { ...n[i], [k]: v }; setForm({ ...form, pags: n })
  }
  function changeMethod(i: number, m: string) {
    const n = [...form.pags]
    n[i] = { ...n[i], method: m }
    if (isCash(m) && !n[i].recebidoEm) n[i].recebidoEm = new Date().toISOString().slice(0, 10)
    setForm({ ...form, pags: n })
  }

  return (
    <div className="mback fixed inset-0 bg-black/66 z-30 flex items-center justify-center p-4" onClick={onClose}>
      <div className="mdlg bg-surface border border-line rounded-2xl w-full max-w-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-3"><h2>{sale ? 'Editar venda' : 'Registrar venda'}</h2><button className="btn sm" onClick={onClose}>Fechar</button></div>
        <p className="text-muted text-sm mb-3">Lead: {leadName}</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-muted text-sm">Operação</label>
            <select className="in" value={form.opId} onChange={e => setForm({ ...form, opId: e.target.value })}>
              {activeOps.map((o: any) => <option key={o.id} value={o.id}>{o.name} ({o.commission_percent}%)</option>)}
            </select>
          </div>
          <div>
            <label className="text-muted text-sm">Data de fechamento</label>
            <input className="in" type="date" value={form.fechadoEm} onChange={e => setForm({ ...form, fechadoEm: e.target.value })} />
          </div>
        </div>

        {form.pags.map((p: any, i: number) => (
          <div key={i} className="pcard border border-line rounded-xl p-3 mb-3 bg-bg">
            <div className="flex justify-between items-center mb-2">
              <span className="eyebrow text-xs">Pagamento {i + 1}</span>
              <div className="flex gap-2">
                <span className={`pill text-xs ${isCash(p.method) ? 'ok' : ''}`}>{isCash(p.method) ? 'Entra no caixa' : 'Só faturamento'}</span>
                {form.pags.length > 1 && <button className="btn sm danger" onClick={() => setForm({ ...form, pags: form.pags.filter((_: any, idx: number) => idx !== i) })}>Remover</button>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-muted text-sm">Forma</label>
                <select className="in" value={p.method} onChange={e => changeMethod(i, e.target.value)}>
                  <option value="pix">Pix</option>
                  <option value="card">Cartão</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>
              <div>
                <label className="text-muted text-sm">Valor (R$)</label>
                <input className="in" value={p.valor} onChange={e => updPay(i, 'valor', e.target.value)} />
              </div>
            </div>
            {p.method === 'card' && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="text-muted text-sm">Parcelas</label>
                  <select className="in" value={p.parcelas} onChange={e => updPay(i, 'parcelas', e.target.value)}>
                    {Array.from({ length: 12 }, (_, n) => n + 1).map(n => <option key={n} value={n}>{n}x</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-muted text-sm">Taxa gateway (R$)</label>
                  <input className="in" value={p.taxa} onChange={e => updPay(i, 'taxa', e.target.value)} />
                </div>
              </div>
            )}
            {isCash(p.method) && (
              <div className="mt-2">
                <label className="text-muted text-sm">Status</label>
                <div className="seg flex gap-2 mt-1">
                  <button onClick={() => updPay(i, 'status', 'pago')} className={`px-3 py-1 rounded-full border ${p.status === 'pago' ? 'bg-accent text-accent-ink border-accent' : 'border-line text-muted'}`}>Pago</button>
                  <button onClick={() => updPay(i, 'status', 'pendente')} className={`px-3 py-1 rounded-full border ${p.status === 'pendente' ? 'bg-accent text-accent-ink border-accent' : 'border-line text-muted'}`}>Pendente</button>
                </div>
                {p.status === 'pago' && (
                  <div className="mt-2">
                    <label className="text-muted text-sm">Data de recebimento</label>
                    <input className="in" type="date" value={p.recebidoEm} onChange={e => updPay(i, 'recebidoEm', e.target.value)} />
                  </div>
                )}
              </div>
            )}
            {!isCash(p.method) && <p className="text-muted text-xs mt-2">Conta como faturamento. Não entra no caixa. Sempre pago.</p>}
          </div>
        ))}

        <button className="btn w-full mb-3" style={{ borderStyle: 'dashed' }} onClick={() => setForm({ ...form, pags: [...form.pags, { method: 'pix', valor: '', parcelas: '1', taxa: '', status: 'pago', recebidoEm: new Date().toISOString().slice(0, 10) }] })}>Adicionar pagamento</button>

        <div className="mb-3">
          <label className="text-muted text-sm">Descrição da venda</label>
          <textarea className="in" rows={3} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
        </div>

        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="card bg-bg"><span className="eyebrow text-xs">Faturamento</span><strong className="num block mt-1">{(c.fat / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
          <div className="card bg-bg"><span className="eyebrow text-xs">Caixa líquido</span><strong className="num block mt-1 text-accent-text">{(c.caixa / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
          <div className="card bg-bg"><span className="eyebrow text-xs">A receber</span><strong className="num block mt-1">{(c.aberto / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
          <div className="card bg-bg"><span className="eyebrow text-xs">Comissão ({pct}%)</span><strong className="num block mt-1">{(com / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></div>
        </div>

        {err && <p className="text-crit text-sm mb-2">{err}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={() => save.mutate()} disabled={save.isPending}>Salvar venda</button>
        </div>
      </div>
    </div>
  )
}
