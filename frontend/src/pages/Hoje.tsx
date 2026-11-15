import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, brl, GOAL_LABEL, STAGE_LABEL, timeBR } from '../lib/format'
import { showToast } from '../lib/toast'
import SaleModal from '../components/SaleModal'
import LeadModal from '../components/LeadModal'
import FollowUpModal from '../components/FollowUpModal'
import Modal from '../components/Modal'

export default function Hoje() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: async () => (await api.get('/dashboard/today')).data })
  const [newLead, setNewLead] = useState(false)
  const [saleLead, setSaleLead] = useState<any>(null)
  const [followUp, setFollowUp] = useState(false)
  const [completing, setCompleting] = useState<any>(null)
  const [result, setResult] = useState('')

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
  const complete = useMutation({
    mutationFn: async () => (await api.post(`/follow-ups/${completing.id}/complete`, { result: result || null })).data,
    onSuccess: () => { showToast('Follow-up concluído.'); setCompleting(null); setResult(''); invalidate() },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })

  if (isLoading) return <p className="muted">Carregando seu dia...</p>
  if (error) return <div className="alert"><h3>Não foi possível carregar o dashboard</h3><p className="sub">{apiError(error)}</p></div>
  if (!data) return null

  const f = data.finance || {}
  const goals = data.goals || []

  return (
    <div className="flex flex-col gap-4">
      <div className="head">
        <div><h1>Bom dia, {data.greeting_name?.split(' ')[0]}</h1><p>Sua agenda de calls, o que precisa de nova data e o resumo financeiro do mês.</p></div>
        <div className="acts"><button className="btn primary" onClick={() => setNewLead(true)}>Novo lead</button><span className="chip"><b />Salvo no banco</span></div>
      </div>

      <div className="kgrid">
        <section className="card kpi"><div className="eyebrow">Faturamento do mês</div><strong className="num">{brl(f.faturamento_bruto)}</strong><span>contratado</span></section>
        <section className="card kpi"><div className="eyebrow">Caixa do mês</div><strong className="num" style={{ color: 'var(--accent-text)' }}>{brl(f.caixa_liquido)}</strong><span>líquido recebido</span></section>
        <section className="card kpi"><div className="eyebrow">Calls hoje</div><strong className="num">{(data.leads_today || []).length}</strong><span>agendadas</span></section>
        <section className="card kpi"><div className="eyebrow">Precisam de nova data</div><strong className="num" style={{ color: (data.needs_new_date || []).length ? 'var(--warn)' : 'inherit' }}>{(data.needs_new_date || []).length}</strong><span>sem call futura ou no-show</span></section>
      </div>

      <div className="grid g2">
        <section className="card">
          <div className="top"><div><h2>Agenda de hoje</h2><p className="sub">Marque o resultado de cada call sem sair da tela.</p></div></div>
          <div className="list">
            {(data.leads_today || []).length === 0 && <p className="muted">Nenhuma call marcada para hoje. Use "Novo lead" para agendar.</p>}
            {(data.leads_today || []).map((l: any) => (
              <div className="row" key={l.id}>
                <span className="time num">{timeBR(l.call_at)}</span>
                <div className="grow"><strong>{l.name}</strong><span>{STAGE_LABEL[l.stage]}{l.no_show_count ? ` · ${l.no_show_count} no-show(s)` : ''}</span></div>
                <button className="btn sm" onClick={() => navigate(`/lead/${l.id}`)}>Abrir</button>
                {l.stage === 'fechado' ? <span className="pill ok">Fechado</span> : <>
                  <button className="btn sm" onClick={() => move.mutate({ id: l.id, stage: 'no_show' })}>No-show</button>
                  <button className="btn sm primary" onClick={() => setSaleLead(l)}>Fechou</button>
                </>}
              </div>
            ))}
          </div>
        </section>

        <section className="alert">
          <h3>Precisam de nova data</h3>
          {(data.needs_new_date || []).length === 0 && <p className="muted">Todos os leads em aberto têm uma call futura.</p>}
          {(data.needs_new_date || []).map((l: any) => (
            <div className="row" key={l.id} style={{ padding: '6px 0', borderColor: 'var(--warn)' }}>
              <div className="grow"><strong>{l.name}</strong><span>{STAGE_LABEL[l.stage]} · {l.call_at ? `call em ${new Date(l.call_at).toLocaleDateString('pt-BR')}` : 'sem call marcada'}</span></div>
              <button className="btn sm" onClick={() => navigate(`/lead/${l.id}`)}>Definir</button>
            </div>
          ))}
        </section>
      </div>

      <div className="grid g2">
        <section className="card">
          <div className="top"><div><h2>Follow-ups atrasados</h2><p className="sub">Contatos que já passaram do horário.</p></div><button className="btn sm" onClick={() => setFollowUp(true)}>Novo follow-up</button></div>
          <div className="list">
            {(data.follow_ups_overdue || []).length === 0 && <p className="muted">Nenhum follow-up atrasado.</p>}
            {(data.follow_ups_overdue || []).map((t: any) => (
              <div className="row" key={t.id}>
                <div className="grow"><strong>{t.lead?.name ?? 'Lead'}</strong><span>{t.message || 'Sem mensagem'} · {new Date(t.scheduled_at).toLocaleString('pt-BR')}</span></div>
                <Link className="btn sm" to={`/lead/${t.lead_id}`}>Abrir</Link>
                <button className="btn sm primary" onClick={() => { setCompleting(t); setResult('') }}>Concluir</button>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <div className="top"><div><h2>Próximos follow-ups</h2><p className="sub">O que vem pela frente.</p></div></div>
          <div className="list">
            {(data.follow_ups_upcoming || []).length === 0 && <p className="muted">Nenhum follow-up futuro.</p>}
            {(data.follow_ups_upcoming || []).map((t: any) => (
              <div className="row" key={t.id}>
                <div className="grow"><strong>{t.lead?.name ?? 'Lead'}</strong><span>{t.message || 'Sem mensagem'} · {new Date(t.scheduled_at).toLocaleString('pt-BR')}</span></div>
                <Link className="btn sm" to={`/lead/${t.lead_id}`}>Abrir</Link>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="top"><div><h2>Metas do mês</h2><p className="sub">Progresso das metas configuradas.</p></div><Link className="btn sm" to="/ritmo">Ver metas</Link></div>
        {goals.length === 0 ? <p className="muted">Nenhuma meta cadastrada para este mês.</p> : (
          <div className="grid g3">
            {goals.map((g: any) => (
              <div key={g.id}>
                <div className="row" style={{ borderTop: 0, paddingTop: 0 }}>
                  <div className="grow"><strong>{GOAL_LABEL[g.metric] ?? g.metric}</strong><span>{g.percent}% · faltam {g.metric.endsWith('_cents') ? brl(g.missing) : g.missing}</span></div>
                  <b className="num">{g.metric.endsWith('_cents') ? brl(g.current_value) : g.current_value}</b>
                </div>
                <div className="bar"><i style={{ width: `${Math.min(100, g.percent)}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </section>

      {newLead && <LeadModal onClose={() => setNewLead(false)} onSaved={(l: any) => navigate(`/lead/${l.id}`)} />}
      {saleLead && <SaleModal leadId={saleLead.id} leadName={saleLead.name} onClose={() => setSaleLead(null)} onSaved={invalidate} />}
      {followUp && <FollowUpModal onClose={() => setFollowUp(false)} onSaved={invalidate} />}
      {completing && (
        <Modal title="Concluir follow-up" sub={completing.lead?.name} onClose={() => setCompleting(null)} footer={<><button className="btn" onClick={() => setCompleting(null)}>Cancelar</button><button className="btn primary" disabled={complete.isPending} onClick={() => complete.mutate()}>Concluir</button></>}>
          <div className="field"><label>Resultado do contato</label><textarea className="in" rows={4} value={result} onChange={e => setResult(e.target.value)} placeholder="O que aconteceu? Próximo passo?" /></div>
        </Modal>
      )}
    </div>
  )
}
