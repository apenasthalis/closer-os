import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, brl, dateBR, dateOnly, firstOfMonth, kfmt, PAYMENT_LABEL, todayInput } from '../lib/format'
import { showToast } from '../lib/toast'
import { useAuth } from '../stores/auth'
import SaleModal from '../components/SaleModal'
import ConfirmDialog from '../components/ConfirmDialog'

type Filters = { from: string; to: string; company_id: string; department_id: string; closer_id: string; operation_id: string; method: string; q: string }

export default function Faturamento() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [filters, setFilters] = useState<Filters>({ from: firstOfMonth(), to: todayInput(), company_id: '', department_id: '', closer_id: '', operation_id: '', method: '', q: '' })
  const [editing, setEditing] = useState<any>(null)
  const [refunding, setRefunding] = useState<any>(null)

  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: async () => (await api.get('/companies')).data })
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: async () => (await api.get('/departments')).data })
  const { data: operations } = useQuery({ queryKey: ['operations'], queryFn: async () => (await api.get('/operations')).data })
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users')).data, enabled: user?.role === 'admin', retry: false })

  const { data, isLoading, error } = useQuery({
    queryKey: ['finance', filters],
    queryFn: async () => (await api.get('/metrics/finance', { params: filters })).data,
  })

  const depts = (departments || []).filter((d: any) => !filters.company_id || d.company_id === Number(filters.company_id))
  const maxMonth = useMemo(() => Math.max(1, ...(data?.months || []).map((m: any) => m.contratado)), [data])

  const pay = useMutation({
    mutationFn: async (payment: any) => (await api.post(`/sales/${payment.sale_id}/pay`, { payment_id: payment.id })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] })
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      showToast('Pagamento recebido.')
    },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })

  const refund = useMutation({
    mutationFn: async (sale: any) => (await api.delete(`/sales/${sale.id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] })
      qc.invalidateQueries({ queryKey: ['pipeline'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setRefunding(null)
      showToast('Reembolso registrado.')
    },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })

  function set(key: keyof Filters, value: string) {
    if (key === 'company_id') return setFilters(f => ({ ...f, company_id: value, department_id: '' }))
    setFilters(f => ({ ...f, [key]: value }))
  }
  function preset(kind: 'month' | 'last' | 'year') {
    const now = new Date()
    if (kind === 'month') setFilters(f => ({ ...f, from: firstOfMonth(), to: todayInput() }))
    if (kind === 'last') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      setFilters(f => ({ ...f, from: fmt(prev), to: fmt(end) }))
    }
    if (kind === 'year') setFilters(f => ({ ...f, from: `${now.getFullYear()}-01-01`, to: todayInput() }))
  }

  const totalByCompany = Object.entries(data?.by_company || {})
  const totalByDept = Object.entries(data?.by_department || {})
  const totalByCloser = Object.entries(data?.by_closer || {})
  const totalByOp = Object.entries(data?.by_operation || {})

  return (
    <div className="flex flex-col gap-4">
      <div className="head">
        <div><h1>Faturamento</h1><p>Contratado, caixa, reembolsos e a receber. A venda nasce no fechamento do lead e o caixa segue a data efetiva de recebimento.</p></div>
      </div>

      <section className="card">
        <div className="top"><div><h2>Filtros</h2><p className="sub">Período, vínculo, closer e forma de pagamento.</p></div><div className="acts"><button className="btn sm" onClick={() => preset('month')}>Este mês</button><button className="btn sm" onClick={() => preset('last')}>Mês passado</button><button className="btn sm" onClick={() => preset('year')}>Este ano</button></div></div>
        <div className="grid g4">
          <div className="field"><label>De</label><input className="in" type="date" value={filters.from} onChange={e => set('from', e.target.value)} /></div>
          <div className="field"><label>Até</label><input className="in" type="date" value={filters.to} onChange={e => set('to', e.target.value)} /></div>
          <div className="field"><label>Empresa</label><select className="in" value={filters.company_id} onChange={e => set('company_id', e.target.value)}><option value="">Todas</option>{(companies || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="field"><label>Gerência</label><select className="in" value={filters.department_id} onChange={e => set('department_id', e.target.value)}><option value="">Todas</option>{depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div className="field"><label>Operação</label><select className="in" value={filters.operation_id} onChange={e => set('operation_id', e.target.value)}><option value="">Todas</option>{(operations || []).filter((o: any) => !o.archived_at).map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
          <div className="field"><label>Forma</label><select className="in" value={filters.method} onChange={e => set('method', e.target.value)}><option value="">Todas</option>{Object.entries(PAYMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          {user?.role === 'admin' && <div className="field"><label>Closer</label><select className="in" value={filters.closer_id} onChange={e => set('closer_id', e.target.value)}><option value="">Todos</option>{(users || []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>}
          <div className="field"><label>Busca</label><input className="in" value={filters.q} onChange={e => set('q', e.target.value)} placeholder="Nome do lead" /></div>
        </div>
      </section>

      {isLoading && <p className="muted">Carregando...</p>}
      {error && <div className="alert"><h3>Erro ao carregar</h3><p className="sub">{apiError(error)}</p></div>}

      {data && <>
        <div className="kgrid">
          <section className="card kpi"><div className="eyebrow">Faturamento bruto</div><strong className="num">{brl(data.faturamento_bruto)}</strong><span>{data.vendas} venda(s) · ticket {brl(data.ticket_medio)}</span></section>
          <section className="card kpi"><div className="eyebrow">Reembolsos</div><strong className="num" style={{ color: data.reembolsos ? 'var(--danger)' : 'inherit' }}>{brl(data.reembolsos)}</strong><span>faturamento líquido {brl(data.faturamento_liquido)}</span></section>
          <section className="card kpi"><div className="eyebrow">Caixa líquido</div><strong className="num" style={{ color: 'var(--accent-text)' }}>{brl(data.caixa_liquido)}</strong><span>entradas {brl(data.caixa_entradas)} · estornos {brl(data.caixa_estornos)}</span></section>
          <section className="card kpi"><div className="eyebrow">A receber</div><strong className="num">{brl(data.a_receber)}</strong><span>pix/cartão pendentes</span></section>
          <section className="card kpi"><div className="eyebrow">Comissão líquida</div><strong className="num">{brl(data.comissao_liquida)}</strong><span>gerada {brl(data.comissao_gerada)} · estornada {brl(data.comissao_estornada)}</span></section>
        </div>

        <div className="grid g2">
          <section className="card">
            <div className="top"><div><h2>Contratado nos últimos 6 meses</h2><p className="sub">Mês atual destacado. Barras em R$.</p></div></div>
            <div className="bars">
              {(data.months || []).map((m: any) => (
                <div className={`bcol ${m.month === new Date().toISOString().slice(0, 7) ? 'cur' : ''}`} key={m.month}>
                  <div className="bwrap"><div className="bar-v" style={{ height: `${Math.max(3, (m.contratado / maxMonth) * 100)}%` }} title={brl(m.contratado)} /></div>
                  <span>{m.label}</span><em>{kfmt(m.contratado)}</em>
                </div>
              ))}
            </div>
            <div className="legend"><span><i className="dot ok" />contratado</span><span><i className="dot danger" />reembolsos</span><span><i className="dot" />caixa</span></div>
            <table className="tbl" style={{ marginTop: 12 }}>
              <thead><tr><th>Mês</th><th>Contratado</th><th>Reembolsos</th><th>Líquido</th><th>Caixa</th></tr></thead>
              <tbody>{(data.months || []).map((m: any) => <tr key={m.month}><td>{m.label}/{m.month.slice(2, 4)}</td><td className="num">{brl(m.contratado)}</td><td className="num">{brl(m.reembolsos)}</td><td className="num">{brl(m.faturamento_liquido)}</td><td className="num">{brl(m.caixa)}</td></tr>)}</tbody>
            </table>
          </section>
          <section className="card">
            <div className="top"><div><h2>Distribuição no período</h2><p className="sub">Faturamento por operação, empresa, gerência e closer.</p></div></div>
            {[['Operação', totalByOp], ['Empresa', totalByCompany], ['Gerência', totalByDept], ['Closer', totalByCloser]].map(([label, rows]: any) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div className="eyebrow">{label}</div>
                {rows.length === 0 && <p className="muted">Sem dados.</p>}
                {rows.map(([name, value]: any) => (
                  <div key={name} style={{ margin: '6px 0' }}>
                    <div className="row" style={{ borderTop: 0, padding: '2px 0' }}><span className="grow">{name}</span><b className="num">{brl(value)}</b></div>
                    <div className="bar"><i style={{ width: `${data.faturamento_bruto ? (value / data.faturamento_bruto) * 100 : 0}%` }} /></div>
                  </div>
                ))}
              </div>
            ))}
          </section>
        </div>

        <section className="card">
          <div className="top"><div><h2>Vendas do período</h2><p className="sub">Editar, receber pendências e solicitar reembolso.</p></div></div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Lead</th><th>Fechamento</th><th>Operação</th><th>Closer</th><th>Faturamento</th><th>Caixa</th><th>A receber</th><th>Comissão</th><th>Status</th><th /></tr></thead>
              <tbody>
                {(data.sales || []).map((s: any) => (
                  <tr key={s.id}>
                    <td><Link to={`/lead/${s.lead_id}`}>{s.lead_name}</Link></td>
                    <td>{dateBR(s.closed_at)}</td>
                    <td>{s.operation}</td>
                    <td>{s.closer}</td>
                    <td className="num">{brl(s.faturamento)}</td>
                    <td className="num">{brl(s.caixa)}</td>
                    <td className="num">{brl(s.a_receber)}</td>
                    <td className="num">{brl(s.comissao)}</td>
                    <td>{s.refunded ? <span className="pill danger">Reembolsada</span> : <span className="pill ok">Ativa</span>}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {!s.refunded && <>
                        {(s.payments || []).filter((p: any) => p.status === 'pending').map((p: any) => <button key={p.id} className="btn sm" onClick={() => pay.mutate({ ...p, sale_id: s.id })}>Receber {PAYMENT_LABEL[p.method]}</button>)}
                        <button className="btn sm" onClick={() => setEditing(s)}>Editar</button>
                        <button className="btn sm danger" onClick={() => setRefunding(s)}>Reembolso</button>
                      </>}
                    </td>
                  </tr>
                ))}
                {(data.sales || []).length === 0 && <tr><td colSpan={10} className="muted">Nenhuma venda no período.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="top"><div><h2>Reembolsos do período</h2><p className="sub">A venda original permanece preservada no histórico.</p></div></div>
          <table className="tbl">
            <thead><tr><th>Data</th><th>Venda</th><th>Valor</th><th>Caixa estornado</th><th>Comissão estornada</th><th>Motivo</th></tr></thead>
            <tbody>
              {(data.refunds || []).map((r: any) => (
                <tr key={r.id}><td>{dateBR(dateOnly(r.refunded_at))}</td><td>#{r.sale_id}</td><td className="num">{brl(r.amount_cents)}</td><td className="num">{brl(r.cash_refunded_cents)}</td><td className="num">{brl(r.commission_reversed_cents)}</td><td>{r.reason || '—'}</td></tr>
              ))}
              {(data.refunds || []).length === 0 && <tr><td colSpan={6} className="muted">Nenhum reembolso no período.</td></tr>}
            </tbody>
          </table>
        </section>
      </>}

      {editing && <SaleModal sale={editing} leadName={editing.lead_name} onClose={() => setEditing(null)} onSaved={() => qc.invalidateQueries({ queryKey: ['finance'] })} />}
      {refunding && <ConfirmDialog title="Confirmar reembolso?" message={`A venda de ${refunding.lead_name} será preservada, o caixa de ${brl(refunding.caixa)} e a comissão de ${brl(refunding.comissao)} serão estornados, as pendências canceladas e o lead movido para Reembolso.`} confirmLabel="Reembolsar" danger busy={refund.isPending} onClose={() => setRefunding(null)} onConfirm={() => refund.mutate(refunding)} />}
    </div>
  )
}
