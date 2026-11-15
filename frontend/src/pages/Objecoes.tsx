import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, dateBR, firstOfMonth, todayInput } from '../lib/format'
import { showToast } from '../lib/toast'
import { useAuth } from '../stores/auth'
import Modal from '../components/Modal'
import ObjectionOccurrenceModal from '../components/ObjectionOccurrenceModal'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Objecoes() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ from: firstOfMonth(), to: todayInput() })
  const [editing, setEditing] = useState<any>(null)
  const [occurrence, setOccurrence] = useState<any>(null)
  const [removing, setRemoving] = useState<any>(null)

  const { data: objections, isLoading } = useQuery({ queryKey: ['objections'], queryFn: async () => (await api.get('/objections')).data })
  const { data: stats } = useQuery({ queryKey: ['objection-stats', filters], queryFn: async () => (await api.get('/objections/stats', { params: filters })).data })
  const { data: occurrences } = useQuery({ queryKey: ['objection-occurrences', filters], queryFn: async () => (await api.get('/objections/occurrences', { params: filters })).data })

  const save = useMutation({
    mutationFn: async (form: any) => {
      const payload = { name: form.name, category: form.category || null, suggested_response: form.suggested_response, reference_conversion: form.reference_conversion === '' ? null : Number(form.reference_conversion) }
      if (form.id) return (await api.put(`/objections/${form.id}`, payload)).data
      return (await api.post('/objections', payload)).data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['objections'] }); qc.invalidateQueries({ queryKey: ['objection-stats'] }); setEditing(null); showToast('Objeção salva.') },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })
  const remove = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/objections/${id}`)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['objections'] }); qc.invalidateQueries({ queryKey: ['objection-stats'] }); setRemoving(null); showToast('Objeção removida.') },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="head">
        <div><h1>Objeções</h1><p>O que trava a venda, como contornar e qual objeção mais derruba conversão.</p></div>
        <div className="acts">{user?.role === 'admin' && <button className="btn" onClick={() => setEditing({})}>Nova objeção</button>}<button className="btn primary" onClick={() => setOccurrence({})}>Registrar objeção</button></div>
      </div>

      <section className="card">
        <div className="grid g2">
          <div className="field"><label>De</label><input className="in" type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} /></div>
          <div className="field"><label>Até</label><input className="in" type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} /></div>
        </div>
      </section>

      <div className="kgrid">
        <section className="card kpi"><div className="eyebrow">Ocorrências</div><strong className="num">{stats?.total ?? 0}</strong><span>no período</span></section>
        <section className="card kpi"><div className="eyebrow">Contornadas</div><strong className="num" style={{ color: 'var(--accent-text)' }}>{stats?.resolved ?? 0}</strong><span>{stats?.bypass_rate ?? 0}% de contorno</span></section>
        <section className="card kpi"><div className="eyebrow">Vendas com objeção</div><strong className="num">{stats?.sales ?? 0}</strong><span>ocorrências que fecharam</span></section>
        <section className="card kpi"><div className="eyebrow">Objeções cadastradas</div><strong className="num">{(objections || []).length}</strong><span>ativas no playbook</span></section>
      </div>

      <div className="grid g2">
        <section className="card">
          <div className="top"><div><h2>Por objeção</h2><p className="sub">Ocorrências, contorno e conversão.</p></div></div>
          <table className="tbl">
            <thead><tr><th>Objeção</th><th>Ocorr.</th><th>Contorno</th><th>Vendas</th><th>Conv.</th></tr></thead>
            <tbody>
              {(stats?.by_objection || []).map((o: any) => <tr key={o.name}><td>{o.name}</td><td className="num">{o.occurrences}</td><td className="num">{o.bypass_rate}%</td><td className="num">{o.sales}</td><td className="num">{o.conversion}%</td></tr>)}
              {(stats?.by_objection || []).length === 0 && <tr><td colSpan={5} className="muted">Nenhuma ocorrência no período.</td></tr>}
            </tbody>
          </table>
        </section>
        <section className="card">
          <div className="top"><div><h2>Por closer</h2><p className="sub">Quem contorna melhor.</p></div></div>
          <table className="tbl">
            <thead><tr><th>Closer</th><th>Ocorr.</th><th>Contorno</th><th>Vendas</th></tr></thead>
            <tbody>
              {(stats?.by_closer || []).map((c: any) => <tr key={c.name}><td>{c.name}</td><td className="num">{c.occurrences}</td><td className="num">{c.bypass_rate}%</td><td className="num">{c.sales}</td></tr>)}
              {(stats?.by_closer || []).length === 0 && <tr><td colSpan={4} className="muted">Sem dados.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>

      <section>
        <div className="head" style={{ marginBottom: 8 }}><div><h2>Playbook</h2><p className="sub">Resposta sugerida e conversão de referência.</p></div></div>
        {isLoading ? <p className="muted">Carregando...</p> : (
          <div className="grid g3">
            {(objections || []).map((o: any) => (
              <article className="card" key={o.id}>
                <div className="top"><span className="chip">{o.category || 'Geral'}</span>{user?.role === 'admin' && <div className="acts"><button className="btn sm" onClick={() => setEditing(o)}>Editar</button><button className="btn sm danger" onClick={() => setRemoving(o)}>Excluir</button></div>}</div>
                <h3 style={{ marginTop: 8 }}>{o.name}</h3>
                <p className="sub" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{o.suggested_response}</p>
                <div className="kc-bot" style={{ marginTop: 10 }}><span className="pill">{o.occurrences_count ?? 0} ocorr.</span><span className="pill ok">{o.resolved_count ?? 0} contornadas</span>{o.reference_conversion != null && <span className="pill">ref. {o.reference_conversion}%</span>}<button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => setOccurrence({ objection_id: o.id })}>Registrar</button></div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="top"><div><h2>Ocorrências recentes</h2><p className="sub">Últimos registros do período.</p></div></div>
        <table className="tbl">
          <thead><tr><th>Data</th><th>Objeção</th><th>Lead</th><th>Closer</th><th>Contornada</th><th>Vendeu</th><th>Notas</th></tr></thead>
          <tbody>
            {(occurrences?.data || []).map((o: any) => (
              <tr key={o.id}>
                <td>{dateBR(String(o.created_at).slice(0, 10))}</td>
                <td>{o.objection?.name}</td>
                <td>{o.lead_id ? <Link to={`/lead/${o.lead_id}`}>{o.lead?.name ?? `#${o.lead_id}`}</Link> : '—'}</td>
                <td>{o.closer?.name ?? '—'}</td>
                <td>{o.resolved ? <span className="pill ok">Sim</span> : <span className="pill danger">Não</span>}</td>
                <td>{o.sale_happened ? <span className="pill ok">Sim</span> : '—'}</td>
                <td>{o.notes || '—'}</td>
              </tr>
            ))}
            {(occurrences?.data || []).length === 0 && <tr><td colSpan={7} className="muted">Nenhuma ocorrência.</td></tr>}
          </tbody>
        </table>
      </section>

      {editing && <ObjectionModal initial={editing} busy={save.isPending} onClose={() => setEditing(null)} onSave={(f: any) => save.mutate(f)} />}
      {occurrence && <ObjectionOccurrenceModal objection={(objections || []).find((o: any) => o.id === occurrence.objection_id)} onClose={() => setOccurrence(null)} onSaved={() => { qc.invalidateQueries({ queryKey: ['objection-stats'] }); qc.invalidateQueries({ queryKey: ['objection-occurrences'] }); qc.invalidateQueries({ queryKey: ['objections'] }) }} />}
      {removing && <ConfirmDialog title="Excluir objeção?" message={`"${removing.name}" será removida ou arquivada se tiver ocorrências.`} confirmLabel="Excluir" danger busy={remove.isPending} onClose={() => setRemoving(null)} onConfirm={() => remove.mutate(removing.id)} />}
    </div>
  )
}

function ObjectionModal({ initial, busy, onClose, onSave }: { initial: any; busy: boolean; onClose: () => void; onSave: (f: any) => void }) {
  const [form, setForm] = useState<any>({ name: initial.name ?? '', category: initial.category ?? '', suggested_response: initial.suggested_response ?? '', reference_conversion: initial.reference_conversion ?? '' })
  return (
    <Modal title={initial.id ? 'Editar objeção' : 'Nova objeção'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={!form.name.trim() || !form.suggested_response.trim() || busy} onClick={() => onSave({ ...form, id: initial.id })}>{busy ? 'Salvando...' : 'Salvar'}</button></>}>
      <div className="two">
        <div className="field"><label>Nome</label><input className="in" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Está caro" /></div>
        <div className="field"><label>Categoria</label><input className="in" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Preço, timing..." /></div>
      </div>
      <div className="field"><label>Resposta sugerida</label><textarea className="in" rows={4} value={form.suggested_response} onChange={e => setForm({ ...form, suggested_response: e.target.value })} /></div>
      <div className="field"><label>Conversão de referência (%)</label><input className="in" inputMode="decimal" value={form.reference_conversion} onChange={e => setForm({ ...form, reference_conversion: e.target.value })} /></div>
    </Modal>
  )
}
