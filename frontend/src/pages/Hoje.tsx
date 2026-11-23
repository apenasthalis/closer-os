import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, brl, dateBR, dateTimeBR, STAGE_LABEL, timeBR } from '../lib/format'
import { showToast } from '../lib/toast'
import SaleModal from '../components/SaleModal'
import LeadModal from '../components/LeadModal'

const CADENCE_LABEL: Record<string, string> = {
  '24h': '24h · Reabrir conversa',
  '3d': '3 dias · Identificar medo',
  '5d': '5 dias · Conectar com problema',
  '8d': '8 dias · Decisão financeira',
  '14d': '14 dias · Encerramento',
  '30d': '30 dias · Reativação',
}

export default function Hoje() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: async () => (await api.get('/dashboard/today')).data })
  const [newLead, setNewLead] = useState(false)
  const [saleLead, setSaleLead] = useState<any>(null)
  const [fupTab, setFupTab] = useState<'next' | 'done'>('next')

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

  const completeFollowUp = useMutation({
    mutationFn: async (id: number) => (await api.post(`/follow-ups/${id}/complete`, {})).data,
    onSuccess: () => {
      showToast('Follow-up concluído.')
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['follow-ups'] })
      qc.invalidateQueries({ queryKey: ['follow-summary'] })
    },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })

  if (isLoading) return <p className="muted">Carregando seu dia...</p>
  if (error) return <div className="alert"><h3>Não foi possível carregar o dashboard</h3><p className="sub">{apiError(error)}</p></div>
  if (!data) return null

  const f = data.finance || {}
  const ag = data.leads_today || []
  const pending = data.pending_money || { total_cents: 0, items: [] }
  const pendingItems = pending.items || []
  const overdue = data.follow_ups_overdue || []
  const upcoming = data.follow_ups_upcoming || []
  const doneFollowUps = data.follow_ups_done || []
  const lossLeads = data.loss_leads || []
  const nextFollowUps = [...overdue, ...upcoming]

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

      <section className="card" style={{ marginTop: 16 }}>
        <div className="top">
          <div><h2>Follow-ups</h2><p className="sub">Controle os próximos passos da cadência e os follow-ups já feitos.</p></div>
          <div className="acts">
            <div className="seg">
              <button aria-pressed={fupTab === 'next'} onClick={() => setFupTab('next')}>Próximos</button>
              <button aria-pressed={fupTab === 'done'} onClick={() => setFupTab('done')}>Feitos</button>
            </div>
            <button className="btn sm" onClick={() => navigate('/cadencia')}>Ver cadência</button>
          </div>
        </div>
        <div className="list">
          {fupTab === 'next' ? (
            nextFollowUps.length ? nextFollowUps.map((f: any) => {
              const isOverdue = f.scheduled_at && new Date(f.scheduled_at).getTime() < Date.now()
              return (
                <div className="row" key={f.id}>
                  <div className="grow">
                    <strong>{f.lead?.name || 'Lead'}</strong>
                    <span>
                      {f.cadence_step ? <span className="pill" style={{ marginRight: 6 }}>{CADENCE_LABEL[f.cadence_step] || f.cadence_step}</span> : null}
                      {isOverdue ? <span style={{ color: 'var(--crit)' }}>Atrasado · </span> : null}
                      {dateTimeBR(f.scheduled_at)}
                      {f.message ? ` · ${String(f.message).slice(0, 90)}${String(f.message).length > 90 ? '…' : ''}` : ''}
                    </span>
                  </div>
                  {isOverdue && <span className="pill hot">Atrasado</span>}
                  {f.lead_id && <button className="btn sm" onClick={() => navigate(`/lead/${f.lead_id}`)}>Abrir</button>}
                  <button className="btn sm primary" disabled={completeFollowUp.isPending} onClick={() => completeFollowUp.mutate(f.id)}>Concluir</button>
                </div>
              )
            }) : <p className="muted">Nenhum follow-up pendente. Leads que entrarem em Loss terão cadência automática.</p>
          ) : (
            doneFollowUps.length ? doneFollowUps.map((f: any) => (
              <div className="row" key={f.id}>
                <div className="grow">
                  <strong>{f.lead?.name || 'Lead'}</strong>
                  <span>
                    {f.cadence_step ? <span className="pill" style={{ marginRight: 6 }}>{CADENCE_LABEL[f.cadence_step] || f.cadence_step}</span> : null}
                    Feito em {dateTimeBR(f.completed_at || f.scheduled_at)}
                    {f.message ? ` · ${String(f.message).slice(0, 80)}${String(f.message).length > 80 ? '…' : ''}` : ''}
                  </span>
                </div>
                {f.had_response === true && <span className="pill ok">Respondeu</span>}
                {f.had_response === false && <span className="pill hot">Sem resposta</span>}
                {f.lead_id && <button className="btn sm" onClick={() => navigate(`/lead/${f.lead_id}`)}>Abrir</button>}
              </div>
            )) : <p className="muted">Nenhum follow-up concluído ainda.</p>
          )}
        </div>
      </section>

      {lossLeads.length > 0 && (
        <div className="alert" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <h3>Leads em Loss para reativar</h3>
              <p className="sub">Assim que um lead entra em Loss, a cadência de 14 dias deve ser acompanhada. Confira os próximos passos e registre os follow-ups.</p>
            </div>
            <button className="btn sm" onClick={() => navigate('/cadencia')}>Abrir cadência</button>
          </div>
          <div className="list" style={{ marginTop: 8 }}>
            {lossLeads.slice(0, 5).map((l: any) => (
              <div className="row" key={l.id}>
                <div className="grow">
                  <strong>{l.name}</strong>
                  <span>{l.loss_reason || 'Sem motivo informado'}{l.stage_changed_at ? ` · entrou em loss em ${dateBR(String(l.stage_changed_at).slice(0, 10))}` : ''}</span>
                </div>
                <button className="btn sm" onClick={() => navigate(`/lead/${l.id}`)}>Abrir lead</button>
                <button className="btn sm primary" onClick={() => navigate('/cadencia')}>Ver cadência</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {newLead && <LeadModal onClose={() => setNewLead(false)} onSaved={(l: any) => navigate(`/lead/${l.id}`)} />}
      {saleLead && <SaleModal leadId={saleLead.id} leadName={saleLead.name} onClose={() => setSaleLead(null)} onSaved={invalidate} />}
    </>
  )
}
