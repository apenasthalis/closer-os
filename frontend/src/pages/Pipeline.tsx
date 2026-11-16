import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext, DragOverlay, PointerSensor, pointerWithin, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, brl, dateBR, STAGE_LABEL } from '../lib/format'
import { showToast } from '../lib/toast'
import LeadModal from '../components/LeadModal'
import SaleModal from '../components/SaleModal'
import ReasonModal from '../components/ReasonModal'
import ScorecardModal from '../components/ScorecardModal'

const SCORE_STAGES = new Set(['remarcado', 'negociacao', 'fechado', 'loss', 'desqualificado'])
const SCORE_ICON = '<path d="M4 14v-2a8 8 0 0116 0v2"/><rect x="3" y="14" width="4" height="6" rx="1"/><rect x="17" y="14" width="4" height="6" rx="1"/>'

function saleTotal(sale: any): number {
  if (!sale || sale.refund) return 0
  return (sale.payments || []).reduce((sum: number, p: any) => sum + p.amount_cents, 0)
}
function daysInStage(l: any){ const t = l.stage_changed_at ? new Date(l.stage_changed_at).getTime() : Date.now(); return Math.max(0, Math.floor((Date.now()-t)/86400000)); }
function ageCls(d:number){ return d>=6?'crit':d>=3?'warn':'ok'; }

function Card({ lead, onOpen, onSale, onScore }: { lead: any; onOpen: () => void; onSale: () => void; onScore: (lead: any) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id })
  const total = saleTotal(lead.sale)
  const d = daysInStage(lead)
  const open = !['fechado','loss','desqualificado','reembolso'].includes(lead.stage)
  const canScore = SCORE_STAGES.has(lead.stage)
  return (
    <article ref={setNodeRef} className={`kc${isDragging ? ' dragging' : ''}`} onClick={onOpen} {...listeners} {...attributes}>
      <div className="kc-head"><strong className="kc-name">{lead.name}</strong>{total > 0 && <span className="pill ok num">{brl(total)}</span>}</div>
      <div className="meta"><span>{lead.call_at ? dateBR(lead.call_at) : 'Sem call'}</span>{open && <span className={`age ${ageCls(d)}`}>{d}d</span>}</div>
      <div className="meta">{lead.no_show_count > 0 ? <span className="pill hot">{lead.no_show_count} no-show</span> : <span></span>}{lead.loss_reason ? <span className="pill">{lead.loss_reason}</span> : <span></span>}</div>
      {(canScore || lead.stage === 'fechado') && <div className="kc-actions">
        {canScore && <button className="btn sm iconb" title="Avaliar call" aria-label="Avaliar call" onClick={e => { e.stopPropagation(); onScore(lead) }}><svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SCORE_ICON }} /></button>}
        {lead.stage === 'fechado' && <button className="btn sm" onClick={e => { e.stopPropagation(); onSale() }}>Abrir venda</button>}
      </div>}
    </article>
  )
}

function Column({ stage, label, leads, onOpen, onSale, onScore }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  return (
    <div ref={setNodeRef} className={`col${isOver ? ' over' : ''}`} data-stage={stage}>
      <header><h3>{label}</h3><span className="pill num">{leads.length}</span></header>
      <div className="cards">
        {leads.map((lead: any) => <Card key={lead.id} lead={lead} onOpen={() => onOpen(lead)} onSale={() => onSale(lead)} onScore={onScore} />)}
        {leads.length === 0 && <div className="empty">Solte um card aqui</div>}
      </div>
    </div>
  )
}

export default function Pipeline() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ q: '', from: '', to: '', company_id: '', department_id: '', closer_id: '' })
  const [newLead, setNewLead] = useState(false)
  const [saleLead, setSaleLead] = useState<any>(null)
  const [reason, setReason] = useState<{ lead: any; stage: 'loss' | 'desqualificado' } | null>(null)
  const [dragging, setDragging] = useState<any>(null)
  const [scoreCall, setScoreCall] = useState<any>(null)

  const { data, isLoading, error } = useQuery({ queryKey: ['pipeline', filters], queryFn: async () => (await api.get('/pipeline/board', { params: filters })).data })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['pipeline'] }); qc.invalidateQueries({ queryKey: ['leads'] }); qc.invalidateQueries({ queryKey: ['lead'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); qc.invalidateQueries({ queryKey: ['calls'] }); qc.invalidateQueries({ queryKey: ['call-stats'] })
  }

  async function openScore(lead: any) {
    try {
      const r = await api.get('/calls', { params: { lead_id: lead.id, per_page: 20 } })
      const list = r.data?.data ?? r.data ?? []
      const call = list.find((c: any) => c.status !== 'no_show') || list[0]
      setScoreCall(call ? { ...call, lead } : { lead, lead_id: lead.id })
    } catch {
      setScoreCall({ lead, lead_id: lead.id })
    }
  }
  const transition = useMutation({
    mutationFn: async ({ lead, stage, reason, note }: any) => (await api.post(`/leads/${lead.id}/transition`, { stage, loss_reason: reason, loss_note: note })).data,
    onSuccess: () => { showToast('Lead movido.'); invalidate() },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const allLeads = useMemo(()=> (data?.columns||[]).flatMap((c:any)=>c.leads), [data])

  function drop(leadId: number, stage: string) {
    const lead = allLeads.find((l: any) => l.id === leadId)
    if (!lead || lead.stage === stage) return
    if (stage === 'fechado') return setSaleLead(lead)
    if (stage === 'reembolso') return showToast('Reembolso só é criado pela exclusão de uma venda.', 'err')
    if (stage === 'loss' || stage === 'desqualificado') return setReason({ lead, stage })
    transition.mutate({ lead, stage })
  }

  const m = data?.metrics || { counts: {}, total: 0, no_show_rate: 0, no_show_leads: 0, disqualified: 0, recovered: 0 }
  const ag = m.total || 0
  const ns = m.no_show_leads || 0
  const pct = (a:number,b:number)=> b? Math.round(a/b*100)+'%':'0%'

  return (
    <>
      <div className="pbar">
        <div><h1>Pipeline</h1><p className="sub" style={{marginTop:4,maxWidth:'60ch'}}>Arraste os cards entre as colunas. Fechado abre a venda; Loss e Desqualificado pedem o motivo.</p></div>
        <div className="filters">
          <div className="field" style={{minWidth:200}}><label htmlFor="pq">Buscar lead</label><input className="in" id="pq" value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})} placeholder="Nome do lead" /></div>
          <div className="field"><label htmlFor="pf">Call de</label><input className="in" type="date" id="pf" value={filters.from} onChange={e=>setFilters({...filters,from:e.target.value})} /></div>
          <div className="field"><label htmlFor="pt">Call até</label><input className="in" type="date" id="pt" value={filters.to} onChange={e=>setFilters({...filters,to:e.target.value})} /></div>
          {(filters.from||filters.to||filters.q) && <button className="btn" onClick={()=>setFilters({...filters,q:'',from:'',to:''})}>Limpar</button>}
          <button className="btn primary" onClick={()=>setNewLead(true)}>Novo lead</button>
          <span className="chip"><b></b>Salvo no banco</span>
        </div>
      </div>

      <div className="kstrip">
        {[['Calls agendadas', ag, 'leads com call no filtro',''], ['No-shows', ns, 'leads que faltaram', ns?'var(--crit)':''], ['Taxa de no-show', pct(ns,ag), 'no-shows / agendadas',''], ['Recuperados', m.recovered||0, 'voltaram após faltar','var(--accent-text)'], ['Desqualificados', m.disqualified||0, pct(m.disqualified||0,ag)+' dos leads','']].map((k:any)=>(
          <div className="ks" key={k[0]}><span className="eyebrow">{k[0]}</span><div><strong className="num" style={k[3]?{color:k[3]}:undefined}>{k[1]}</strong><small>{k[2]}</small></div></div>
        ))}
      </div>

      {isLoading && <p className="muted">Carregando pipeline...</p>}
      {error && <div className="alert"><h3>Erro ao carregar</h3><p className="sub">{apiError(error)}</p></div>}

      {data && (
        <DndContext sensors={sensors} collisionDetection={pointerWithin}
          onDragStart={(e) => setDragging(allLeads.find((l: any) => l.id === Number(e.active.id)))}
          onDragEnd={(e) => { setDragging(null); if (e.over) drop(Number(e.active.id), String(e.over.id)) }}
          onDragCancel={() => setDragging(null)}>
          <div className="kanban" id="kanban">
            {data.columns.map((col: any) => <Column key={col.stage} stage={col.stage} label={col.label} leads={col.leads} onOpen={(lead: any) => navigate(`/lead/${lead.id}`)} onSale={(lead: any) => setSaleLead(lead)} onScore={openScore} />)}
          </div>
          <DragOverlay>{dragging && <div className="kc ghost" style={{width:375}}><div className="kc-head"><strong className="kc-name">{dragging.name}</strong>{saleTotal(dragging.sale) > 0 && <span className="pill ok num">{brl(saleTotal(dragging.sale))}</span>}</div><div className="meta"><span>{STAGE_LABEL[dragging.stage]}</span></div></div>}</DragOverlay>
        </DndContext>
      )}

      {newLead && <LeadModal onClose={() => setNewLead(false)} onSaved={(l: any) => navigate(`/lead/${l.id}`)} />}
      {saleLead && <SaleModal leadId={saleLead.id} leadName={saleLead.name} onClose={() => setSaleLead(null)} onSaved={invalidate} />}
      {reason && <ReasonModal stage={reason.stage} leadName={reason.lead.name} onClose={() => setReason(null)} onConfirm={(r, n) => { transition.mutate({ lead: reason.lead, stage: reason.stage, reason: r, note: n }); setReason(null) }} />}
      {scoreCall && <ScorecardModal call={scoreCall} onClose={() => setScoreCall(null)} onSaved={invalidate} />}
    </>
  )
}
