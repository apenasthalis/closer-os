import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, brl, dateBR, STAGE_LABEL, timeBR } from '../lib/format'
import { showToast } from '../lib/toast'
import SaleModal from '../components/SaleModal'
import LeadModal from '../components/LeadModal'

export default function Hoje() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: async () => (await api.get('/dashboard/today')).data })
  const [newLead, setNewLead] = useState(false)
  const [saleLead, setSaleLead] = useState<any>(null)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['dashboard'] })
    qc.invalidateQueries({ queryKey: ['leads'] })
    qc.invalidateQueries({ queryKey: ['pipeline'] })
  }

  const move = useMutation({
    mutationFn: async ({ id, stage }: any) => (await api.post(`/leads/${id}/transition`, { stage })).data,
    onSuccess: () => { showToast('Etapa atualizada.'); invalidate() },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })

  if (isLoading) return <p className="muted">Carregando seu dia...</p>
  if (error) return <div className="alert"><h3>Não foi possível carregar o dashboard</h3><p className="sub">{apiError(error)}</p></div>
  if (!data) return null

  const f = data.finance || {}
  const ag = data.leads_today || []
  const pending = data.pending_money || { total_cents: 0, items: [] }
  const pendingItems = pending.items || []

  return (
    <>
      <div className="head">
        <div><h1>Bom dia, {(data.greeting_name || 'Closer').split(' ')[0]}</h1><p>Sua agenda de calls de hoje e o dinheiro pendente para acompanhar.</p></div>
        <div className="acts"><button className="btn primary" onClick={() => setNewLead(true)}>Novo lead</button></div>
      </div>

      <div className="kgrid">
        <section className="card kpi"><div className="eyebrow">Faturamento do mês</div><strong className="num">{brl(f.faturamento_bruto)}</strong><span>contratado</span></section>
        <section className="card kpi"><div className="eyebrow">Caixa do mês</div><strong className="num" style={{ color: 'var(--accent-text)' }}>{brl(f.caixa_liquido)}</strong><span>líquido recebido</span></section>
        <section className="card kpi"><div className="eyebrow">Calls hoje</div><strong className="num">{ag.length}</strong><span>agendadas</span></section>
        <section className="card kpi"><div className="eyebrow">Dinheiro pendente</div><strong className="num" style={{ color: pending.total_cents ? 'var(--warn)' : 'inherit' }}>{brl(pending.total_cents)}</strong><span>a receber</span></section>
      </div>

      <div className="grid g2">
        <section className="card">
          <div className="top"><div><h2>Calls de hoje</h2><p className="sub">Marque o resultado de cada call sem sair da tela.</p></div></div>
          <div className="list">
            {ag.length ? ag.map((l: any) => (
              <div className="row" key={l.id}>
                <span className="time num">{timeBR(l.call_at)}</span>
                <div className="grow"><strong>{l.name}</strong><span>{STAGE_LABEL[l.stage] || l.stage}{l.no_show_count ? ` · ${l.no_show_count} no-show(s)` : ''}</span></div>
                <button className="btn sm" onClick={() => navigate(`/lead/${l.id}`)}>Abrir</button>
                {l.stage === 'fechado'
                  ? <span className="pill ok">Fechado</span>
                  : <>
                      <button className="btn sm" onClick={() => move.mutate({ id: l.id, stage: 'no_show' })}>No-show</button>
                      <button className="btn sm primary" onClick={() => setSaleLead(l)}>Fechou</button>
                    </>}
              </div>
            )) : <p className="muted">Nenhuma call marcada para hoje. Use "Novo lead" para agendar.</p>}
          </div>
        </section>

        <section className="card">
          <div className="top"><div><h2>Dinheiro pendente</h2><p className="sub">Pagamentos de Pix e cartão ainda não recebidos.</p></div></div>
          <div className="list">
            {pendingItems.length ? pendingItems.map((p: any) => (
              <div className="row" key={p.id}>
                <div className="grow">
                  <strong>{p.lead_name || 'Venda'}</strong>
                  <span>{p.method === 'pix' ? 'Pix' : 'Cartão'}{p.received_at ? ` · previsto ${dateBR(p.received_at)}` : ''}</span>
                </div>
                <span className="pill num" style={{ color: 'var(--warn)' }}>{brl(p.amount_cents)}</span>
                {p.lead_id && <button className="btn sm" onClick={() => navigate(`/lead/${p.lead_id}`)}>Abrir</button>}
              </div>
            )) : <p className="muted">Nenhum pagamento pendente no momento.</p>}
          </div>
        </section>
      </div>

      {newLead && <LeadModal onClose={() => setNewLead(false)} onSaved={(l: any) => navigate(`/lead/${l.id}`)} />}
      {saleLead && <SaleModal leadId={saleLead.id} leadName={saleLead.name} onClose={() => setSaleLead(null)} onSaved={invalidate} />}
    </>
  )
}
