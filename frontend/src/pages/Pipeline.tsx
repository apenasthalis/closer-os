import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext, DragOverlay, PointerSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, brl, dateBR, STAGES, STAGE_LABEL } from '../lib/format'
import { showToast } from '../lib/toast'
import { useAuth } from '../stores/auth'
import LeadModal from '../components/LeadModal'
import SaleModal from '../components/SaleModal'
import ReasonModal from '../components/ReasonModal'

function saleTotal(sale: any): number {
  if (!sale || sale.refund) return 0
  return (sale.payments || []).reduce((sum: number, p: any) => sum + p.amount_cents, 0)
}

function Card({ lead, onOpen, onSale }: { lead: any; onOpen: () => void; onSale: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id })
  const total = saleTotal(lead.sale)
  return (
    <article ref={setNodeRef} className={`kcard ${isDragging ? 'dragging' : ''}`} onClick={onOpen}>
      <div className="kc-top">
        <strong>{lead.name}</strong>
        <button className="drag" {...listeners} {...attributes} onClick={e => e.stopPropagation()} aria-label="Arrastar lead">⠿</button>
      </div>
      <div className="kc-meta">
        {lead.company?.name && <span>{lead.company.name}</span>}
        {lead.closer?.name && <span>{lead.closer.name}</span>}
        {lead.call_at && <span>{dateBR(lead.call_at)}</span>}
      </div>
      <div className="kc-bot">
        {lead.no_show_count > 0 && <span className="pill danger">{lead.no_show_count} no-show</span>}
        {total > 0 && <span className="pill ok">{brl(total)}</span>}
        {lead.stage === 'fechado' && !lead.sale && <button className="btn sm primary" onClick={e => { e.stopPropagation(); onSale() }}>Registrar venda</button>}
      </div>
    </article>
  )
}

function Column({ stage, label, leads, onOpen, onSale }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  return (
    <section ref={setNodeRef} className={`kcol ${isOver ? 'over' : ''}`}>
      <header><span>{label}</span><b>{leads.length}</b></header>
      <div className="kbody">
        {leads.map((lead: any) => <Card key={lead.id} lead={lead} onOpen={() => onOpen(lead)} onSale={() => onSale(lead)} />)}
        {leads.length === 0 && <p className="kempty">Solte um lead aqui</p>}
      </div>
    </section>
  )
}

export default function Pipeline() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuth()
  const [filters, setFilters] = useState({ q: '', company_id: '', department_id: '', closer_id: '' })
  const [newLead, setNewLead] = useState(false)
  const [saleLead, setSaleLead] = useState<any>(null)
  const [reason, setReason] = useState<{ lead: any; stage: 'loss' | 'desqualificado' } | null>(null)
  const [dragging, setDragging] = useState<any>(null)

  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: async () => (await api.get('/companies')).data })
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: async () => (await api.get('/departments')).data })
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users')).data, enabled: user?.role === 'admin', retry: false })
  const { data, isLoading, error } = useQuery({ queryKey: ['pipeline', filters], queryFn: async () => (await api.get('/pipeline/board', { params: filters })).data })

  const depts = (departments || []).filter((d: any) => !filters.company_id || d.company_id === Number(filters.company_id))

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['pipeline'] })
    qc.invalidateQueries({ queryKey: ['leads'] })
    qc.invalidateQueries({ queryKey: ['lead'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const transition = useMutation({
    mutationFn: async ({ lead, stage, reason, note }: any) => (await api.post(`/leads/${lead.id}/transition`, { stage, loss_reason: reason, loss_note: note })).data,
    onSuccess: () => { showToast('Lead movido.'); invalidate() },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function drop(leadId: number, stage: string) {
    const lead = data?.columns?.flatMap((c: any) => c.leads).find((l: any) => l.id === leadId)
    if (!lead || lead.stage === stage) return
    if (stage === 'fechado') return setSaleLead(lead)
    if (stage === 'reembolso') return showToast('Reembolso só é criado pela exclusão de uma venda.', 'err')
    if (stage === 'loss' || stage === 'desqualificado') return setReason({ lead, stage })
    transition.mutate({ lead, stage })
  }

  const metrics = data?.metrics || { counts: {}, total: 0, no_show_rate: 0 }

  return (
    <div className="flex flex-col gap-4">
      <div className="head">
        <div><h1>Pipeline</h1><p>Arraste para mover. Fechou abre a venda; Loss e Desqualificado pedem motivo; Reembolso só pela venda.</p></div>
        <div className="acts"><button className="btn primary" onClick={() => setNewLead(true)}>Novo lead</button></div>
      </div>

      <section className="card">
        <div className="kstrip">
          <div><span>Total</span><b className="num">{metrics.total}</b></div>
          <div><span>No-show rate</span><b className="num">{metrics.no_show_rate}%</b></div>
          {STAGES.map(([stage, label]) => <div key={stage}><span>{label}</span><b className="num">{metrics.counts?.[stage] ?? 0}</b></div>)}
        </div>
        <div className="grid g4" style={{ marginTop: 12 }}>
          <div className="field"><label>Busca</label><input className="in" value={filters.q} onChange={e => setFilters({ ...filters, q: e.target.value })} placeholder="Nome ou telefone" /></div>
          <div className="field"><label>Empresa</label><select className="in" value={filters.company_id} onChange={e => setFilters({ ...filters, company_id: e.target.value, department_id: '' })}><option value="">Todas</option>{(companies || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="field"><label>Gerência</label><select className="in" value={filters.department_id} onChange={e => setFilters({ ...filters, department_id: e.target.value })}><option value="">Todas</option>{depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          {user?.role === 'admin' && <div className="field"><label>Closer</label><select className="in" value={filters.closer_id} onChange={e => setFilters({ ...filters, closer_id: e.target.value })}><option value="">Todos</option>{(users || []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>}
        </div>
      </section>

      {isLoading && <p className="muted">Carregando pipeline...</p>}
      {error && <div className="alert"><h3>Erro ao carregar</h3><p className="sub">{apiError(error)}</p></div>}

      {data && (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={(e) => setDragging(data.columns.flatMap((c: any) => c.leads).find((l: any) => l.id === Number(e.active.id)))}
          onDragEnd={(e) => { setDragging(null); if (e.over) drop(Number(e.active.id), String(e.over.id)) }}
          onDragCancel={() => setDragging(null)}
        >
          <div className="kanban">
            {data.columns.map((col: any) => <Column key={col.stage} stage={col.stage} label={col.label} leads={col.leads} onOpen={(lead: any) => navigate(`/lead/${lead.id}`)} onSale={(lead: any) => setSaleLead(lead)} />)}
          </div>
          <DragOverlay>{dragging && <div className="kcard overlay"><strong>{dragging.name}</strong><span className="sub">{STAGE_LABEL[dragging.stage]}</span></div>}</DragOverlay>
        </DndContext>
      )}

      {newLead && <LeadModal onClose={() => setNewLead(false)} onSaved={(l: any) => navigate(`/lead/${l.id}`)} />}
      {saleLead && <SaleModal leadId={saleLead.id} leadName={saleLead.name} onClose={() => setSaleLead(null)} onSaved={invalidate} />}
      {reason && <ReasonModal stage={reason.stage} leadName={reason.lead.name} onClose={() => setReason(null)} onConfirm={(r, n) => { transition.mutate({ lead: reason.lead, stage: reason.stage, reason: r, note: n }); setReason(null) }} />}
    </div>
  )
}
