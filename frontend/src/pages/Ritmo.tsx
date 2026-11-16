import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, brl, GOAL_LABEL, toCents } from '../lib/format'
import { showToast } from '../lib/toast'
import { useAuth } from '../stores/auth'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Ring from '../components/Ring'

const MONEY = ['revenue_cents', 'cash_cents', 'commission_cents']
const METRICS = ['calls_scheduled', 'calls_held', 'sales', 'revenue_cents', 'cash_cents', 'commission_cents']

function monthNow() { return new Date().toISOString().slice(0, 7) }

export default function Ritmo() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [month, setMonth] = useState(monthNow())
  const [closerId, setCloserId] = useState('')
  const [goalModal, setGoalModal] = useState<any>(null)
  const [removing, setRemoving] = useState<any>(null)

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users')).data, enabled: user?.role === 'admin', retry: false })
  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: async () => (await api.get('/companies')).data })
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: async () => (await api.get('/departments')).data })

  useEffect(() => {
    if (user?.role === 'admin' && !closerId && users?.length) setCloserId(String(users[0].id))
  }, [users])

  const params = { month, ...(user?.role === 'admin' && closerId ? { user_id: closerId } : {}) }
  const { data: goals, isLoading: loadingGoals } = useQuery({ queryKey: ['goals', params], queryFn: async () => (await api.get('/goals', { params })).data })
  const { data: comp, isLoading: loadingComp } = useQuery({ queryKey: ['compensation', params], queryFn: async () => (await api.get('/compensation', { params })).data })
  const { data: history } = useQuery({ queryKey: ['compensation-history', params], queryFn: async () => (await api.get('/compensation/history', { params: { ...params, months: 12 } })).data, enabled: Boolean(comp) })

  const saveGoal = useMutation({
    mutationFn: async (form: any) => {
      if (form.id) return (await api.put(`/goals/${form.id}`, { target_value: MONEY.includes(form.metric) ? toCents(form.target) : Number(form.target) })).data
      return (await api.post('/goals', {
        user_id: user?.role === 'admin' ? Number(form.user_id) : user!.id,
        company_id: Number(form.company_id),
        department_id: form.department_id ? Number(form.department_id) : null,
        month,
        metric: form.metric,
        target_value: MONEY.includes(form.metric) ? toCents(form.target) : Number(form.target),
      })).data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); setGoalModal(null); showToast('Meta salva.') },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })
  const remove = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/goals/${id}`)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); setRemoving(null); showToast('Meta removida.') },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })

  const historyMax = Math.max(1, ...(history || []).map((h: any) => h.total_cents))
  const fixedStatus = comp?.fixed_status === 'fixo_integral' ? 'Fixo integral' : comp?.fixed_status === 'fixo_parcial' ? 'Fixo parcial' : 'Sem fixo'
  const depts = (departments || []).filter((d: any) => !goalModal?.company_id || d.company_id === Number(goalModal.company_id))

  return (
    <div className="page-stack">
      <div className="head">
        <div><h1>Ritmo & Comissão</h1><p>Metas do mês, progresso e a regra de remuneração com snapshot histórico.</p></div>
        <div className="acts">
          <input className="in" type="month" style={{ width: 160 }} value={month} onChange={e => setMonth(e.target.value)} />
          {user?.role === 'admin' && <select className="in" style={{ width: 190 }} value={closerId} onChange={e => setCloserId(e.target.value)}>{(users || []).filter((u: any) => u.active).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>}
          <button className="btn primary" onClick={() => setGoalModal({ metric: 'calls_scheduled', target: '', company_id: companies?.[0]?.id ?? '', department_id: '', user_id: closerId || user?.id })}>Nova meta</button>
        </div>
      </div>

      <section className="card">
        <div className="top"><div><h2>Metas de {month}</h2><p className="sub">Progresso calculado a partir dos dados reais do mês.</p></div></div>
        {loadingGoals ? <p className="muted">Carregando metas...</p> : (goals || []).length === 0 ? <div className="empty"><h3>Nenhuma meta neste mês</h3><p>Cadastre metas para acompanhar o ritmo.</p><button className="btn primary" onClick={() => setGoalModal({ metric: 'calls_scheduled', target: '', company_id: companies?.[0]?.id ?? '', department_id: '', user_id: closerId || user?.id })}>Criar meta</button></div> : (
          <div className="grid g3">
            {(goals || []).map((g: any) => {
              const isMoney = MONEY.includes(g.metric)
              return (
                <article className="card" key={g.id}>
                  <div className="top"><div><span className="eyebrow">{GOAL_LABEL[g.metric]}</span><h3 style={{ marginTop: 2 }}>{isMoney ? brl(g.current_value) : g.current_value} <span className="sub">de {isMoney ? brl(g.target_value) : g.target_value}</span></h3></div><Ring value={g.percent} size={64} /></div>
                  <div className="bar" style={{ marginTop: 8 }}><i style={{ width: `${Math.min(100, g.percent)}%` }} /></div>
                  <p className="sub" style={{ marginTop: 6 }}>{g.percent}% · faltam {isMoney ? brl(g.missing) : g.missing} · projeção {isMoney ? brl(g.projection) : g.projection}{g.user ? ` · ${g.user}` : ''}</p>
                  {user?.role === 'admin' && <div className="acts" style={{ marginTop: 8 }}><button className="btn sm" onClick={() => setGoalModal({ ...g, target: isMoney ? (g.target_value / 100).toFixed(2).replace('.', ',') : String(g.target_value) })}>Editar</button><button className="btn sm danger" onClick={() => setRemoving(g)}>Excluir</button></div>}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <div className="grid g2">
        <section className="card">
          <div className="top"><div><h2>Remuneração do mês</h2><p className="sub">Meta alcançada e quanto você vai receber (fixo + comissão).</p></div><span className={`pill ${comp?.fixed_status === 'fixo_integral' ? 'ok' : comp?.fixed_status === 'fixo_parcial' ? 'warm' : 'danger'}`}>{fixedStatus}</span></div>
          {loadingComp ? <p className="muted">Calculando...</p> : comp && <>
            <div className="kgrid">
              <div><span className="eyebrow">Meta alcançada</span><strong className="num">{brl(comp.cash_received_cents)} <span className="sub">de {brl(comp.target_cents)}</span></strong></div>
              <div><span className="eyebrow">% da meta</span><strong className="num">{comp.percent}%</strong></div>
              <div><span className="eyebrow">A receber (fixo + comissão)</span><strong className="num">{brl(comp.total_cents)}</strong></div>
            </div>
            <div className="bar" style={{ margin: '10px 0' }}><i style={{ width: `${Math.min(100, comp.percent)}%` }} /></div>
            <div className="row"><span className="grow">Fixo do mês</span><b className="num">{brl(comp.fixed_cents)}</b></div>
            <div className="row"><span className="grow">Comissão do mês</span><b className="num">{brl(comp.commission_cents)}</b></div>
            <div className="row"><span className="grow"><strong>Total a receber</strong></span><b className="num">{brl(comp.total_cents)}</b></div>
            <p className="sub" style={{ marginTop: 8 }}>Faltam {brl(comp.missing_intermediate_cents)} para o fixo parcial ({comp.intermediate_percent}%) e {brl(comp.missing_full_cents)} para o fixo integral.</p>
          </>}
        </section>
        <section className="card">
          <div className="top"><div><h2>Fixo e remuneração por mês</h2><p className="sub">Histórico de 12 meses: caixa, fixo, comissão e total a receber.</p></div></div>
          <div className="bars" style={{ height: 130 }}>
            {(history || []).map((h: any, i: number) => <div className="bcol" key={i}><div className="bwrap"><div className="bar-v" style={{ height: `${Math.max(2, (h.total_cents / historyMax) * 100)}%` }} title={`${brl(h.total_cents)}`} /></div><span>{h.month.slice(5)}</span><em>{(h.total_cents / 100 / 1000).toFixed(1)}k</em></div>)}
          </div>
          <table className="tbl" style={{ marginTop: 10 }}>
            <thead><tr><th>Mês</th><th>Caixa</th><th>Fixo</th><th>Comissão</th><th>Total</th></tr></thead>
            <tbody>{(history || []).slice().reverse().map((h: any) => <tr key={h.month}><td>{h.month}</td><td className="num">{brl(h.cash_received_cents)}</td><td className="num">{brl(h.fixed_cents)}</td><td className="num">{brl(h.commission_cents)}</td><td className="num"><strong>{brl(h.total_cents)}</strong></td></tr>)}</tbody>
          </table>
        </section>
      </div>

      {comp?.snapshot && <section className="card"><div className="top"><div><h2>Snapshot histórico</h2><p className="sub">Configuração congelada do mês. Meses passados não mudam quando a regra atual muda.</p></div></div><div className="grid g4"><div><span className="eyebrow">Meta congelada</span><b className="num">{brl(comp.snapshot.target_cents)}</b></div><div><span className="eyebrow">Fixo integral</span><b className="num">{brl(comp.snapshot.full_fixed_cents)}</b></div><div><span className="eyebrow">Fixo parcial</span><b className="num">{brl(comp.snapshot.intermediate_fixed_cents)}</b></div><div><span className="eyebrow">Percentual parcial</span><b className="num">{comp.snapshot.intermediate_percent}%</b></div></div></section>}

      {goalModal && <GoalModal initial={goalModal} companies={companies || []} departments={depts} users={users || []} isAdmin={user?.role === 'admin'} busy={saveGoal.isPending} onClose={() => setGoalModal(null)} onSave={(f: any) => saveGoal.mutate(f)} />}
      {removing && <ConfirmDialog title="Excluir meta?" message={`${GOAL_LABEL[removing.metric]} de ${month} será removida.`} confirmLabel="Excluir" danger busy={remove.isPending} onClose={() => setRemoving(null)} onConfirm={() => remove.mutate(removing.id)} />}
    </div>
  )
}

function GoalModal({ initial, companies, departments, users, isAdmin, busy, onClose, onSave }: any) {
  const [form, setForm] = useState<any>(initial)
  return (
    <Modal title={initial.id ? 'Editar meta' : 'Nova meta'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={!form.target || (!initial.id && (!form.company_id || !form.user_id)) || busy} onClick={() => onSave(form)}>{busy ? 'Salvando...' : 'Salvar'}</button></>}>
      {!initial.id && <>
        <div className="two">
          <div className="field"><label>Métrica</label><select className="in" value={form.metric} onChange={e => setForm({ ...form, metric: e.target.value })}>{METRICS.map(m => <option key={m} value={m}>{GOAL_LABEL[m]}</option>)}</select></div>
          <div className="field"><label>Meta ({MONEY.includes(form.metric) ? 'R$' : 'quantidade'})</label><input className="in" inputMode="decimal" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} placeholder={MONEY.includes(form.metric) ? '18000,00' : '100'} /></div>
        </div>
        <div className="two">
          <div className="field"><label>Empresa</label><select className="in" value={form.company_id} onChange={e => setForm({ ...form, company_id: e.target.value, department_id: '' })}>{companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="field"><label>Gerência (opcional)</label><select className="in" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}><option value="">Todas</option>{departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        </div>
        {isAdmin && <div className="field"><label>Closer</label><select className="in" value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}>{users.filter((u: any) => u.active).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>}
      </>}
      {initial.id && <div className="field"><label>Nova meta ({MONEY.includes(form.metric) ? 'R$' : 'quantidade'})</label><input className="in" inputMode="decimal" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} /></div>}
    </Modal>
  )
}
