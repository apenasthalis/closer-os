import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, dateTimeBR, firstOfMonth, todayInput, toLocalInput } from '../lib/format'
import { showToast } from '../lib/toast'
import { useAuth } from '../stores/auth'
import Modal from '../components/Modal'
import Ring from '../components/Ring'
import ScorecardModal from '../components/ScorecardModal'

export default function Calls() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ from: firstOfMonth(), to: todayInput(), closer_id: '', company_id: '', department_id: '' })
  const [scoring, setScoring] = useState<any>(null)
  const [creating, setCreating] = useState(false)

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users')).data, enabled: user?.role === 'admin', retry: false })
  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: async () => (await api.get('/companies')).data })
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: async () => (await api.get('/departments')).data })
  const { data: stats, isLoading } = useQuery({ queryKey: ['call-stats', filters], queryFn: async () => (await api.get('/calls/stats', { params: filters })).data })
  const { data: calls } = useQuery({ queryKey: ['calls', filters], queryFn: async () => (await api.get('/calls', { params: { ...filters, per_page: 100 } })).data })
  const { data: conversion } = useQuery({ queryKey: ['conversion', filters], queryFn: async () => (await api.get('/metrics/conversion', { params: filters })).data })

  const depts = (departments || []).filter((d: any) => !filters.company_id || d.company_id === Number(filters.company_id))
  const maxScore = Math.max(100, ...(stats?.evolution || []).map((e: any) => e.score))

  return (
    <div className="flex flex-col gap-4">
      <div className="head">
        <div><h1>Calls & Scorecard</h1><p>Nota por critério, proporção de fala e evolução. Cada call avaliada vira dado para coaching.</p></div>
        <div className="acts"><button className="btn primary" onClick={() => setCreating(true)}>Registrar call</button></div>
      </div>

      <section className="card">
        <div className="top"><div><h2>Filtros</h2><p className="sub">Período, closer, empresa e gerência.</p></div></div>
        <div className="grid g4">
          <div className="field"><label>De</label><input className="in" type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} /></div>
          <div className="field"><label>Até</label><input className="in" type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} /></div>
          {user?.role === 'admin' && <div className="field"><label>Closer</label><select className="in" value={filters.closer_id} onChange={e => setFilters({ ...filters, closer_id: e.target.value })}><option value="">Todos</option>{(users || []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>}
          <div className="field"><label>Empresa</label><select className="in" value={filters.company_id} onChange={e => setFilters({ ...filters, company_id: e.target.value, department_id: '' })}><option value="">Todas</option>{(companies || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="field"><label>Gerência</label><select className="in" value={filters.department_id} onChange={e => setFilters({ ...filters, department_id: e.target.value })}><option value="">Todas</option>{depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        </div>
      </section>

      {isLoading && <p className="muted">Carregando...</p>}
      {stats && <>
        <div className="kgrid">
          <section className="card kpi"><div className="eyebrow">Calls no período</div><strong className="num">{stats.total_calls}</strong><span>{stats.held} realizadas · {stats.no_shows} no-show</span></section>
          <section className="card kpi"><div className="eyebrow">Avaliadas</div><strong className="num">{stats.evaluated}</strong><span>com scorecard</span></section>
          <section className="card kpi"><div className="eyebrow">Nota média</div><strong className="num" style={{ color: 'var(--accent-text)' }}>{stats.average_score}</strong><span>penalidade média {stats.average_penalty} pts</span></section>
          <section className="card kpi"><div className="eyebrow">Conversão</div><strong className="num" style={{ color: 'var(--accent-text)' }}>{conversion?.conversion ?? 0}%</strong><span>{conversion?.sales ?? 0} venda(s) ativa(s) / {conversion?.calls_held ?? 0} call(s)</span></section>
        </div>

        <div className="grid g2">
          <section className="card">
            <div className="top"><div><h2>Média por critério</h2><p className="sub">% de calls em que o critério foi cumprido.</p></div><Ring value={stats.average_score} label="Média" /></div>
            {(stats.by_criterion || []).map((c: any) => (
              <div key={c.key} style={{ margin: '9px 0' }}>
                <div className="row" style={{ borderTop: 0, padding: '2px 0' }}><span className="grow">{c.label}</span><span className="sub">{c.checked}/{c.total} · {c.percent}%</span></div>
                <div className="bar"><i style={{ width: `${c.percent}%` }} /></div>
              </div>
            ))}
          </section>
          <section className="card">
            <div className="top"><div><h2>Evolução da nota</h2><p className="sub">Últimas calls avaliadas.</p></div></div>
            <div className="bars" style={{ height: 150 }}>
              {(stats.evolution || []).map((e: any, i: number) => <div className="bcol" key={i}><div className="bwrap"><div className="bar-v" style={{ height: `${(e.score / maxScore) * 100}%` }} title={`${e.score} · ${e.closer ?? ''}`} /></div><span>{String(e.date || '').slice(8, 10)}/{String(e.date || '').slice(5, 7)}</span><em>{e.score}</em></div>)}
            </div>
            <h3 style={{ marginTop: 14 }}>Por closer</h3>
            {(stats.by_closer || []).map((c: any) => <div className="row" key={c.name}><span className="grow">{c.name}</span><span className="sub">{c.evaluations} avaliações</span><b className="num">{c.average}</b></div>)}
            {(stats.by_closer || []).length === 0 && <p className="muted">Nenhuma call avaliada no período.</p>}
          </section>
        </div>
      </>}

      <section className="card">
        <div className="top"><div><h2>Histórico de calls</h2><p className="sub">Avalie ou reavalie o scorecard.</p></div></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Data</th><th>Lead</th><th>Closer</th><th>Status</th><th>Nota</th><th>Proporção</th><th /></tr></thead>
            <tbody>
              {(calls?.data || []).map((c: any) => (
                <tr key={c.id}>
                  <td>{dateTimeBR(c.call_at)}</td>
                  <td>{c.lead_id ? <Link to={`/lead/${c.lead_id}`}>{c.lead?.name ?? `#${c.lead_id}`}</Link> : '—'}</td>
                  <td>{c.closer?.name ?? '—'}</td>
                  <td><span className={`pill ${c.status === 'held' ? 'ok' : c.status === 'no_show' ? 'danger' : ''}`}>{c.status}</span></td>
                  <td className="num">{c.scorecard ? c.scorecard.score : '—'}</td>
                  <td className="num">{c.scorecard ? `${c.scorecard.talk_ratio}%` : '—'}</td>
                  <td><button className="btn sm" onClick={() => setScoring(c)}>{c.scorecard ? 'Reavaliar' : 'Avaliar'}</button></td>
                </tr>
              ))}
              {(calls?.data || []).length === 0 && <tr><td colSpan={7} className="muted">Nenhuma call no período.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {scoring && <ScorecardModal call={scoring} onClose={() => setScoring(null)} onSaved={() => { qc.invalidateQueries({ queryKey: ['calls'] }); qc.invalidateQueries({ queryKey: ['call-stats'] }) }} />}
      {creating && <NewCallModal onClose={() => setCreating(false)} onSaved={(call: any) => { setCreating(false); setScoring(call); qc.invalidateQueries({ queryKey: ['calls'] }); qc.invalidateQueries({ queryKey: ['call-stats'] }) }} />}
    </div>
  )
}

function NewCallModal({ onClose, onSaved }: { onClose: () => void; onSaved: (call: any) => void }) {
  const { user } = useAuth()
  const { data: leadsData } = useQuery({ queryKey: ['leads', 'call-picker'], queryFn: async () => (await api.get('/leads', { params: { per_page: 500 } })).data })
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users')).data, enabled: user?.role === 'admin', retry: false })
  const [form, setForm] = useState<any>({ lead_id: '', call_at: toLocalInput(new Date()), status: 'held', user_id: user?.id ?? '' })
  const create = useMutation({
    mutationFn: async () => (await api.post('/calls', { lead_id: form.lead_id ? Number(form.lead_id) : null, call_at: form.call_at, status: form.status, user_id: user?.role === 'admin' ? Number(form.user_id) : undefined })).data,
    onSuccess: (call: any) => { showToast('Call registrada.'); onSaved(call) },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })
  return (
    <Modal title="Registrar call" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={!form.call_at || create.isPending} onClick={() => create.mutate()}>{create.isPending ? 'Salvando...' : 'Registrar'}</button></>}>
      <div className="field"><label>Lead</label><select className="in" value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}><option value="">Sem lead</option>{(leadsData?.data || []).map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
      <div className="two">
        <div className="field"><label>Data e hora</label><input className="in" type="datetime-local" value={form.call_at} onChange={e => setForm({ ...form, call_at: e.target.value })} /></div>
        <div className="field"><label>Status</label><select className="in" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="held">Realizada</option><option value="no_show">No-show</option><option value="scheduled">Agendada</option></select></div>
      </div>
      {user?.role === 'admin' && <div className="field"><label>Closer</label><select className="in" value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}>{(users || []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>}
    </Modal>
  )
}
