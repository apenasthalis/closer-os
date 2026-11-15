import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, dateBR, REACTIVATE_HINT } from '../lib/format'
import { showToast } from '../lib/toast'
import ConfirmDialog from '../components/ConfirmDialog'
import LeadModal from '../components/LeadModal'

export default function Perdas() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ q: '', reason: '' })
  const [reactivating, setReactivating] = useState<any>(null)
  const [newLead, setNewLead] = useState(false)

  const { data: loss } = useQuery({ queryKey: ['leads', 'losers-loss'], queryFn: async () => (await api.get('/leads', { params: { stage: 'loss', per_page: 500 } })).data })
  const { data: dq } = useQuery({ queryKey: ['leads', 'losers-dq'], queryFn: async () => (await api.get('/leads', { params: { stage: 'desqualificado', per_page: 500 } })).data })

  const leads = useMemo(() => {
    const all = [...(loss?.data || []), ...(dq?.data || [])]
    return all.filter((l: any) => (!filters.q || l.name.toLowerCase().includes(filters.q.toLowerCase())) && (!filters.reason || l.loss_reason === filters.reason))
  }, [loss, dq, filters])

  const reasons = useMemo(() => {
    const map: Record<string, number> = {}
    for (const l of [...(loss?.data || []), ...(dq?.data || [])]) map[l.loss_reason || 'Sem motivo'] = (map[l.loss_reason || 'Sem motivo'] || 0) + 1
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [loss, dq])

  const reactivate = useMutation({
    mutationFn: async (lead: any) => (await api.post(`/leads/${lead.id}/reactivate`)).data,
    onSuccess: (lead: any) => { showToast('Lead reativado.'); qc.invalidateQueries({ queryKey: ['leads'] }); setReactivating(null); navigate(`/lead/${lead.id}`) },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })

  return (
    <>
      <div className="head">
        <div><h1>Perdas</h1><p>Motivo, nota e o que fazer diferente. Reativar cria um novo lead em Lead Agendado.</p></div>
        <div className="acts"><button className="btn primary" onClick={() => setNewLead(true)}>Novo lead</button></div>
      </div>

      <div className="kgrid">
        <section className="card kpi"><div className="eyebrow">Loss</div><strong className="num">{(loss?.data || []).length}</strong><span>com motivo de perda</span></section>
        <section className="card kpi"><div className="eyebrow">Desqualificados</div><strong className="num">{(dq?.data || []).length}</strong><span>sem fit</span></section>
        <section className="card kpi"><div className="eyebrow">Total</div><strong className="num">{leads.length}</strong><span>no filtro atual</span></section>
        <section className="card kpi"><div className="eyebrow">Principal motivo</div><strong className="num" style={{ fontSize: 20 }}>{reasons[0]?.[0] ?? '—'}</strong><span>{reasons[0]?.[1] ?? 0} lead(s)</span></section>
      </div>

      <section className="card">
        <div className="top"><div><h2>Motivos</h2><p className="sub">Clique para filtrar.</p></div></div>
        <div className="flex flex-wrap gap-2">
          <button className={`btn sm ${!filters.reason ? 'primary' : ''}`} onClick={() => setFilters({ ...filters, reason: '' })}>Todos</button>
          {reasons.map(([reason, count]) => <button key={reason} className={`btn sm ${filters.reason === reason ? 'primary' : ''}`} onClick={() => setFilters({ ...filters, reason })}>{reason} ({count})</button>)}
        </div>
        <div className="field" style={{ marginTop: 12 }}><label>Busca</label><input className="in" value={filters.q} onChange={e => setFilters({ ...filters, q: e.target.value })} placeholder="Nome do lead" /></div>
      </section>

      <section className="card">
        <div className="top"><div><h2>Leads perdidos</h2><p className="sub">Veja o histórico completo antes de reativar.</p></div></div>
        <table className="tbl">
          <thead><tr><th>Lead</th><th>Etapa</th><th>Motivo</th><th>Nota</th><th>Desde</th><th /></tr></thead>
          <tbody>
            {leads.map((l: any) => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td><span className="pill danger">{l.stage === 'loss' ? 'Loss' : 'Desqualificado'}</span></td>
                <td>{l.loss_reason || '—'}</td>
                <td>{l.loss_note || '—'}</td>
                <td>{dateBR(String(l.stage_changed_at || l.updated_at || '').slice(0, 10))}</td>
                <td style={{ whiteSpace: 'nowrap' }}><button className="btn sm" onClick={() => navigate(`/lead/${l.id}`)}>Abrir</button><button className="btn sm primary" onClick={() => setReactivating(l)}>Reativar</button></td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td colSpan={6} className="muted">Nenhum lead perdido com este filtro.</td></tr>}
          </tbody>
        </table>
      </section>

      {reactivating && <ConfirmDialog title="Reativar lead?" message={<>{reactivating.name} voltará como novo lead em Lead Agendado, com o mesmo contato e histórico zerado. <strong>{REACTIVATE_HINT[reactivating.loss_reason] ?? 'Retome com uma abordagem diferente.'}</strong></>} confirmLabel="Reativar" busy={reactivate.isPending} onClose={() => setReactivating(null)} onConfirm={() => reactivate.mutate(reactivating)} />}
      {newLead && <LeadModal onClose={() => setNewLead(false)} onSaved={(l: any) => navigate(`/lead/${l.id}`)} />}
    </>
  )
}
