import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, dateTimeBR } from '../lib/format'
import { showToast } from '../lib/toast'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import FollowUpModal from '../components/FollowUpModal'

const EMPTY = { situation: 'Primeiro contato', day_label: 'D0', title: '', body: '' }

export default function Cadencia() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any>(null)
  const [removing, setRemoving] = useState<any>(null)
  const [followUp, setFollowUp] = useState(false)

  const { data: templates, isLoading } = useQuery({ queryKey: ['follow-templates'], queryFn: async () => (await api.get('/follow-up-templates')).data })
  const { data: summary } = useQuery({ queryKey: ['follow-summary'], queryFn: async () => (await api.get('/follow-ups/summary')).data })
  const { data: tasks } = useQuery({ queryKey: ['follow-ups', 'pending'], queryFn: async () => (await api.get('/follow-ups', { params: { status: 'pending' } })).data })

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const t of templates || []) (map[t.situation || 'Sem situação'] ||= []).push(t)
    return Object.entries(map)
  }, [templates])

  const save = useMutation({
    mutationFn: async (form: any) => {
      const payload = { situation: form.situation || null, day_label: form.day_label || null, title: form.title, body: form.body }
      if (form.id) return (await api.put(`/follow-up-templates/${form.id}`, payload)).data
      return (await api.post('/follow-up-templates', payload)).data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['follow-templates'] }); setEditing(null); showToast('Modelo salvo.') },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })
  const remove = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/follow-up-templates/${id}`)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['follow-templates'] }); setRemoving(null); showToast('Modelo excluído.') },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })
  const complete = useMutation({
    mutationFn: async (id: number) => (await api.post(`/follow-ups/${id}/complete`, { result: null })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['follow-ups'] }); qc.invalidateQueries({ queryKey: ['follow-summary'] }); showToast('Follow-up concluído.') },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="head">
        <div><h1>Cadência</h1><p>Modelos de mensagem e follow-ups pendentes. O lead certo, na hora certa, com o texto pronto.</p></div>
        <div className="acts"><button className="btn" onClick={() => setFollowUp(true)}>Novo follow-up</button><button className="btn primary" onClick={() => setEditing({ ...EMPTY })}>Novo modelo</button></div>
      </div>

      <div className="kgrid">
        <section className="card kpi"><div className="eyebrow">Pendentes</div><strong className="num">{summary?.pending ?? 0}</strong><span>follow-ups abertos</span></section>
        <section className="card kpi"><div className="eyebrow">Atrasados</div><strong className="num" style={{ color: summary?.overdue ? 'var(--danger)' : 'inherit' }}>{summary?.overdue ?? 0}</strong><span>passaram do horário</span></section>
        <section className="card kpi"><div className="eyebrow">Concluídos hoje</div><strong className="num">{summary?.done_today ?? 0}</strong><span>contatos feitos</span></section>
        <section className="card kpi"><div className="eyebrow">Modelos</div><strong className="num">{(templates || []).length}</strong><span>mensagens cadastradas</span></section>
      </div>

      <section className="card">
        <div className="top"><div><h2>Fila de follow-ups</h2><p className="sub">Conclua direto daqui ou abra o Lead 360.</p></div></div>
        <div className="list">
          {(tasks?.data || []).length === 0 && <p className="muted">Fila vazia.</p>}
          {(tasks?.data || []).map((t: any) => (
            <div className="row" key={t.id}>
              <div className="grow"><strong>{t.lead?.name ?? 'Lead'}</strong><span>{t.message}</span></div>
              <span className="sub">{dateTimeBR(t.scheduled_at)}</span>
              <Link className="btn sm" to={`/lead/${t.lead_id}`}>Abrir</Link>
              <button className="btn sm primary" onClick={() => complete.mutate(t.id)}>Concluir</button>
            </div>
          ))}
        </div>
      </section>

      <div className="head" style={{ marginTop: 4 }}><div><h2>Modelos de mensagem</h2><p className="sub">Use {'{nome}'} para personalizar com o primeiro nome do lead.</p></div><button className="btn sm" onClick={() => setEditing({ ...EMPTY })}>Novo modelo</button></div>
      {isLoading ? <p className="muted">Carregando modelos...</p> : grouped.length === 0 ? <div className="empty"><h3>Nenhum modelo ainda</h3><p>Crie o primeiro modelo de cadência.</p><button className="btn primary" onClick={() => setEditing({ ...EMPTY })}>Criar modelo</button></div> : grouped.map(([situation, list]) => (
        <section key={situation}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{situation}</div>
          <div className="grid g3">
            {list.map((t: any) => (
              <article className="card" key={t.id}>
                <div className="top"><span className="chip">{t.day_label || '—'}</span><div className="acts"><button className="btn sm" onClick={() => setEditing({ ...t })}>Editar</button><button className="btn sm danger" onClick={() => setRemoving(t)}>Excluir</button></div></div>
                <h3 style={{ marginTop: 8 }}>{t.title}</h3>
                <p className="sub" style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{t.body}</p>
              </article>
            ))}
          </div>
        </section>
      ))}

      {editing && <TemplateModal initial={editing} busy={save.isPending} onClose={() => setEditing(null)} onSave={(form: any) => save.mutate(form)} />}
      {removing && <ConfirmDialog title="Excluir modelo?" message={`"${removing.title}" será removido.`} confirmLabel="Excluir" danger busy={remove.isPending} onClose={() => setRemoving(null)} onConfirm={() => remove.mutate(removing.id)} />}
      {followUp && <FollowUpModal onClose={() => setFollowUp(false)} onSaved={() => { qc.invalidateQueries({ queryKey: ['follow-ups'] }); qc.invalidateQueries({ queryKey: ['follow-summary'] }) }} />}
    </div>
  )
}

function TemplateModal({ initial, busy, onClose, onSave }: { initial: any; busy: boolean; onClose: () => void; onSave: (f: any) => void }) {
  const [form, setForm] = useState(initial)
  return (
    <Modal title={initial.id ? 'Editar modelo' : 'Novo modelo'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={!form.title.trim() || !form.body.trim() || busy} onClick={() => onSave(form)}>{busy ? 'Salvando...' : 'Salvar'}</button></>}>
      <div className="two">
        <div className="field"><label>Situação</label><input className="in" value={form.situation || ''} onChange={e => setForm({ ...form, situation: e.target.value })} placeholder="Primeiro contato, no-show..." /></div>
        <div className="field"><label>Dia</label><input className="in" value={form.day_label || ''} onChange={e => setForm({ ...form, day_label: e.target.value })} placeholder="D0, D1, D3..." /></div>
      </div>
      <div className="field"><label>Título</label><input className="in" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
      <div className="field"><label>Mensagem</label><textarea className="in" rows={6} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Oi {nome}, tudo bem?..." /></div>
    </Modal>
  )
}
