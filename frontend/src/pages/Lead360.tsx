import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, brl, dateBR, dateTimeBR, PAYMENT_LABEL, REACTIVATE_HINT, scoreLead, STAGE_LABEL, temp, toLocalInput } from '../lib/format'
import { showToast } from '../lib/toast'
import Modal from '../components/Modal'
import LeadModal from '../components/LeadModal'
import SaleModal from '../components/SaleModal'
import ScorecardModal from '../components/ScorecardModal'
import FollowUpModal from '../components/FollowUpModal'
import ObjectionOccurrenceModal from '../components/ObjectionOccurrenceModal'
import ConfirmDialog from '../components/ConfirmDialog'

const BANT = [['budget', 'Budget', 'Tem verba?'], ['authority', 'Authority', 'Decide?'], ['need', 'Need', 'Tem dor real?'], ['timing', 'Timing', 'Quer agora?']] as const

const EVENT_LABEL: Record<string, string> = {
  created: 'Lead criado', edited: 'Lead editado', call_scheduled: 'Call agendada', stage_changed: 'Etapa alterada',
  no_show: 'No-show registrado', note: 'Nota', call_evaluated: 'Call avaliada', follow_up_done: 'Follow-up concluído',
  reactivated: 'Lead reativado',
}

export default function Lead360() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const leadId = Number(id)
  const [note, setNote] = useState('')
  const [editing, setEditing] = useState(false)
  const [saleOpen, setSaleOpen] = useState(false)
  const [scorecardCall, setScorecardCall] = useState<any>(null)
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [objectionOpen, setObjectionOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmReactivate, setConfirmReactivate] = useState(false)
  const [completing, setCompleting] = useState<any>(null)
  const [result, setResult] = useState('')

  const { data: picker } = useQuery({ queryKey: ['leads', 'picker'], queryFn: async () => (await api.get('/leads', { params: { per_page: 100 } })).data, enabled: !leadId })
  const { data: lead, isLoading, error } = useQuery({ queryKey: ['lead', leadId], queryFn: async () => (await api.get(`/leads/${leadId}`)).data, enabled: Boolean(leadId) })
  const { data: tasks } = useQuery({ queryKey: ['follow-ups', leadId], queryFn: async () => (await api.get('/follow-ups', { params: { lead_id: leadId } })).data, enabled: Boolean(leadId) })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['lead', leadId] })
    qc.invalidateQueries({ queryKey: ['leads'] })
    qc.invalidateQueries({ queryKey: ['pipeline'] })
    qc.invalidateQueries({ queryKey: ['follow-ups'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const bant = useMutation({
    mutationFn: async ({ key, value }: any) => (await api.patch(`/leads/${leadId}/qualification`, { [key]: value })).data,
    onSuccess: invalidate,
    onError: (e: any) => showToast(apiError(e), 'err'),
  })
  const addNote = useMutation({
    mutationFn: async () => (await api.post(`/leads/${leadId}/notes`, { note })).data,
    onSuccess: () => { setNote(''); showToast('Nota registrada.'); invalidate() },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })
  const newCall = useMutation({
    mutationFn: async () => (await api.post('/calls', { lead_id: leadId, call_at: toLocalInput(new Date()), status: 'held' })).data,
    onSuccess: (call: any) => { showToast('Call registrada. Avalie o scorecard.'); setScorecardCall(call); invalidate() },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })
  const complete = useMutation({
    mutationFn: async () => (await api.post(`/follow-ups/${completing.id}/complete`, { result: result || null })).data,
    onSuccess: () => { setCompleting(null); setResult(''); showToast('Follow-up concluído.'); invalidate() },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })
  const remove = useMutation({
    mutationFn: async () => (await api.delete(`/leads/${leadId}`)).data,
    onSuccess: () => { showToast('Lead excluído.'); navigate('/pipeline') },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })
  const reactivate = useMutation({
    mutationFn: async () => (await api.post(`/leads/${leadId}/reactivate`)).data,
    onSuccess: (created: any) => { showToast('Lead reativado.'); navigate(`/lead/${created.id}`) },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })

  const score = useMemo(() => scoreLead(lead), [lead])
  const [label] = temp(score)

  if (!leadId) {
    return (
      <div className="flex flex-col gap-4">
        <div className="head"><div><h1>Lead 360</h1><p>Selecione um lead para ver qualificação, histórico e próximos passos.</p></div></div>
        <section className="card">
          <div className="field"><label>Lead</label><select className="in" onChange={e => navigate(`/lead/${e.target.value}`)} defaultValue=""><option value="" disabled>Escolha um lead</option>{(picker?.data || []).map((l: any) => <option key={l.id} value={l.id}>{l.name} · {STAGE_LABEL[l.stage]}</option>)}</select></div>
        </section>
      </div>
    )
  }
  if (isLoading) return <p className="muted">Carregando lead...</p>
  if (error) return <div className="alert"><h3>Erro ao carregar lead</h3><p className="sub">{apiError(error)}</p></div>
  if (!lead) return null

  const events = lead.events || []
  const calls = [...(lead.calls || [])].sort((a: any, b: any) => String(b.call_at).localeCompare(String(a.call_at)))
  const openTasks = (tasks?.data || []).filter((t: any) => t.status === 'pending')
  const closed = Boolean(lead.sale)
  const refunded = Boolean(lead.sale?.refund)
  const canReactivate = ['loss', 'desqualificado'].includes(lead.stage)
  const bantDone = Object.values(lead.qualification || {}).filter(Boolean).length

  function eventText(ev: any) {
    if (ev.type === 'stage_changed' || ev.type === 'no_show') return `${EVENT_LABEL[ev.type]}${ev.from_stage ? `: ${STAGE_LABEL[ev.from_stage]} → ${STAGE_LABEL[ev.to_stage] ?? ''}` : ''}`
    if (ev.type === 'call_evaluated') return `Call avaliada · nota ${ev.payload?.score ?? '—'}`
    if (ev.type === 'note') return `Nota: ${ev.payload?.note ?? ''}`
    if (ev.type === 'reactivated') return 'Lead reativado a partir de um lead anterior'
    return EVENT_LABEL[ev.type] ?? ev.type
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="head">
        <div className="leadhead">
          <div className="avatar">{(lead.name || '?').slice(0, 1).toUpperCase()}</div>
          <div>
            <h1>{lead.name} {lead.stage === 'fechado' && <span className="pill ok">Fechado</span>}{refunded && <span className="pill danger">Reembolsado</span>}</h1>
            <p>{STAGE_LABEL[lead.stage]} · {lead.company?.name ?? 'Sem empresa'} · {lead.department?.name ?? 'Sem gerência'} · closer {lead.closer?.name ?? '—'}</p>
          </div>
        </div>
        <div className="acts">
          <button className="btn" onClick={() => setEditing(true)}>Editar</button>
          <button className="btn" onClick={() => setFollowUpOpen(true)}>Follow-up</button>
          <button className="btn" onClick={() => newCall.mutate()} disabled={newCall.isPending}>Registrar call</button>
          <button className="btn primary" onClick={() => setSaleOpen(true)} disabled={refunded}>{closed ? 'Editar venda' : 'Registrar venda'}</button>
          {canReactivate && <button className="btn" onClick={() => setConfirmReactivate(true)}>Reativar</button>}
          {!closed && <button className="btn danger" onClick={() => setConfirmDelete(true)}>Excluir</button>}
        </div>
      </div>

      <div className="grid g3">
        <section className="card">
          <div className="eyebrow">Temperatura</div>
          <div className="goal" style={{ marginTop: 8 }}><RingInline score={score} /><div><strong style={{ fontSize: 20 }}>{label}</strong><p className="sub">{bantDone}/4 critérios BANT · {events.length} interações</p></div></div>
          <div className="bar" style={{ marginTop: 10 }}><i style={{ width: `${score}%` }} /></div>
          <p className="sub" style={{ marginTop: 6 }}>{bantDone * 20} pts de BANT + até 20 pts de engajamento.</p>
        </section>
        <section className="card">
          <div className="eyebrow">Contato</div>
          <p style={{ marginTop: 8 }}><strong>{lead.phone || 'Sem telefone'}</strong><br /><span className="sub">{lead.email || 'Sem e-mail'}</span></p>
          <div className="row" style={{ borderTop: 0, paddingBottom: 0 }}><span className="grow">Próxima call</span><b>{dateTimeBR(lead.call_at)}</b></div>
          <div className="row" style={{ borderTop: 0, paddingBottom: 0 }}><span className="grow">No-shows</span><b>{lead.no_show_count}</b></div>
        </section>
        <section className="card">
          <div className="eyebrow">BANT</div>
          <div className="bant">
            {BANT.map(([key, title, hint]) => (
              <button key={key} type="button" className="tog" aria-pressed={Boolean(lead.qualification?.[key])} onClick={() => bant.mutate({ key, value: !lead.qualification?.[key] })}>
                <span className="bx" /><span><strong>{title}</strong><em>{hint}</em></span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="grid g2">
        <div className="flex flex-col gap-4">
          <section className="card">
            <div className="top"><div><h2>Venda</h2><p className="sub">Faturamento, caixa e comissão congelada no fechamento.</p></div>{lead.sale && !refunded && <button className="btn sm" onClick={() => setSaleOpen(true)}>Editar venda</button>}</div>
            {!lead.sale ? <p className="muted">Nenhuma venda registrada.</p> : <>
              <div className="kgrid">
                <div><span className="eyebrow">Faturamento</span><strong className="num">{brl((lead.sale.payments || []).reduce((s: number, p: any) => s + p.amount_cents, 0))}</strong></div>
                <div><span className="eyebrow">Caixa</span><strong className="num">{brl((lead.sale.payments || []).filter((p: any) => p.status === 'paid' && ['pix', 'card'].includes(p.method)).reduce((s: number, p: any) => s + p.amount_cents - (p.method === 'card' ? p.gateway_fee_cents : 0), 0))}</strong></div>
                <div><span className="eyebrow">Comissão ({lead.sale.commission_percent}%)</span><strong className="num">{brl(Math.round((lead.sale.payments || []).filter((p: any) => p.status === 'paid' && ['pix', 'card'].includes(p.method)).reduce((sum: number, p: any) => sum + p.amount_cents - (p.method === 'card' ? p.gateway_fee_cents : 0), 0) * Number(lead.sale.commission_percent) / 100))}</strong></div>
              </div>
              <div className="list" style={{ marginTop: 10 }}>
                {(lead.sale.payments || []).map((p: any) => (
                  <div className="row" key={p.id}><span className="grow">{PAYMENT_LABEL[p.method]} {p.method === 'card' ? `(${p.installments}x)` : ''}</span><span className={`pill ${p.status === 'paid' ? 'ok' : p.status === 'cancelled' ? 'danger' : ''}`}>{p.status}</span><b className="num">{brl(p.amount_cents)}</b></div>
                ))}
              </div>
              {refunded && <div className="alert" style={{ marginTop: 10 }}><h3>Reembolsada em {dateBR(String(lead.sale.refund.refunded_at).slice(0, 10))}</h3><p className="sub">Venda preservada. Caixa estornado {brl(lead.sale.refund.cash_refunded_cents)} e comissão {brl(lead.sale.refund.commission_reversed_cents)}.</p></div>}
            </>}
            {lead.description && <p className="sub" style={{ marginTop: 10 }}>{lead.description}</p>}
          </section>

          <section className="card">
            <div className="top"><div><h2>Follow-ups</h2><p className="sub">Próximos contatos deste lead.</p></div><button className="btn sm" onClick={() => setFollowUpOpen(true)}>Novo</button></div>
            {openTasks.length === 0 && <p className="muted">Nenhum follow-up pendente.</p>}
            {openTasks.map((t: any) => (
              <div className="row" key={t.id}><div className="grow"><strong>{dateTimeBR(t.scheduled_at)}</strong><span>{t.message}</span></div><button className="btn sm primary" onClick={() => { setCompleting(t); setResult('') }}>Concluir</button></div>
            ))}
            {(tasks?.data || []).filter((t: any) => t.status !== 'pending').slice(0, 4).map((t: any) => (
              <div className="row" key={t.id}><div className="grow"><strong>{dateTimeBR(t.scheduled_at)}</strong><span>{t.message}</span></div><span className="pill">{t.status === 'done' ? 'Concluído' : 'Cancelado'}</span></div>
            ))}
          </section>

          <section className="card">
            <div className="top"><div><h2>Objeções</h2><p className="sub">Registre objeções para alimentar o dashboard.</p></div><button className="btn sm" onClick={() => setObjectionOpen(true)}>Registrar</button></div>
            {(lead.objections || []).length === 0 && <p className="muted">Nenhuma objeção registrada.</p>}
            {(lead.objections || []).map((o: any) => (
              <div className="row" key={o.id}><div className="grow"><strong>{o.objection?.name}</strong><span>{dateBR(String(o.created_at).slice(0, 10))}{o.notes ? ` · ${o.notes}` : ''}</span></div><span className={`pill ${o.resolved ? 'ok' : 'danger'}`}>{o.resolved ? 'Contornada' : 'Aberta'}</span>{o.sale_happened && <span className="pill ok">Vendeu</span>}</div>
            ))}
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="card">
            <div className="top"><div><h2>Histórico de calls</h2><p className="sub">Avalie cada call para calcular o scorecard.</p></div></div>
            {calls.length === 0 && <p className="muted">Nenhuma call registrada.</p>}
            {calls.map((c: any) => (
              <div className="row" key={c.id}>
                <div className="grow"><strong>{dateTimeBR(c.call_at)}</strong><span>{c.closer?.name ?? 'Closer'} · {c.status}</span></div>
                {c.scorecard ? <span className="pill ok">Nota {c.scorecard.score}</span> : <button className="btn sm" onClick={() => setScorecardCall(c)}>Avaliar</button>}
                {c.scorecard && <button className="btn sm" onClick={() => setScorecardCall(c)}>Reavaliar</button>}
              </div>
            ))}
          </section>

          <section className="card">
            <div className="top"><div><h2>Timeline</h2><p className="sub">Tudo que aconteceu com este lead.</p></div></div>
            <div className="field"><textarea className="in" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Adicionar nota ao histórico" /></div>
            <button className="btn sm" disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()} style={{ marginBottom: 12 }}>Salvar nota</button>
            <div className="timeline">
              {[...events].reverse().map((ev: any) => (
                <div className="tev" key={ev.id}>
                  <i />
                  <div><strong>{eventText(ev)}</strong><span>{dateTimeBR(ev.created_at)} · {ev.actor?.name ?? 'Sistema'}</span></div>
                </div>
              ))}
              {events.length === 0 && <p className="muted">Sem eventos.</p>}
            </div>
          </section>
        </div>
      </div>

      {editing && <LeadModal lead={lead} onClose={() => setEditing(false)} onSaved={invalidate} />}
      {saleOpen && <SaleModal leadId={lead.id} leadName={lead.name} sale={lead.sale || undefined} onClose={() => setSaleOpen(false)} onSaved={invalidate} />}
      {scorecardCall && <ScorecardModal call={scorecardCall} onClose={() => setScorecardCall(null)} onSaved={invalidate} />}
      {followUpOpen && <FollowUpModal leadId={lead.id} onClose={() => setFollowUpOpen(false)} onSaved={invalidate} />}
      {objectionOpen && <ObjectionOccurrenceModal leadId={lead.id} onClose={() => setObjectionOpen(false)} onSaved={invalidate} />}
      {completing && (
        <Modal title="Concluir follow-up" onClose={() => setCompleting(null)} footer={<><button className="btn" onClick={() => setCompleting(null)}>Cancelar</button><button className="btn primary" disabled={complete.isPending} onClick={() => complete.mutate()}>Concluir</button></>}>
          <div className="field"><label>Resultado do contato</label><textarea className="in" rows={4} value={result} onChange={e => setResult(e.target.value)} /></div>
        </Modal>
      )}
      {confirmDelete && <ConfirmDialog title="Excluir lead?" message="O lead, calls, follow-ups e histórico serão removidos. Leads com venda registrada não podem ser excluídos." confirmLabel="Excluir" danger busy={remove.isPending} onClose={() => setConfirmDelete(false)} onConfirm={() => remove.mutate()} />}
      {confirmReactivate && <ConfirmDialog title="Reativar lead?" message={`Será criado um novo lead em Lead Agendado, com o mesmo contato e histórico zerado. ${REACTIVATE_HINT[lead.loss_reason] ?? ''}`} confirmLabel="Reativar" busy={reactivate.isPending} onClose={() => setConfirmReactivate(false)} onConfirm={() => reactivate.mutate()} />}
    </div>
  )
}

function RingInline({ score }: { score: number }) {
  return <div className="ring" style={{ ['--v' as any]: score, width: 72, height: 72 }}><span>{score}</span></div>
}
