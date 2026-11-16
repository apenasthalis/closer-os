import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, brl, dateBR, fromCents, toCents } from '../lib/format'
import { showToast } from '../lib/toast'
import { useAuth } from '../stores/auth'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

type Kind = 'company' | 'department' | 'operation' | 'rule' | null

export default function Operacoes() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const admin = user?.role === 'admin'
  const [modal, setModal] = useState<{ kind: Kind; item?: any }>({ kind: null })
  const [removing, setRemoving] = useState<{ kind: Kind; item: any } | null>(null)

  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: async () => (await api.get('/companies')).data })
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: async () => (await api.get('/departments')).data })
  const { data: operations } = useQuery({ queryKey: ['operations', 'all'], queryFn: async () => (await api.get('/operations', { params: { include_archived: 1 } })).data })
  const { data: rules } = useQuery({ queryKey: ['comp-rules'], queryFn: async () => (await api.get('/compensation-rules')).data })

  const invalidate = () => {
    for (const key of ['companies', 'departments', 'operations', 'comp-rules']) qc.invalidateQueries({ queryKey: [key] })
  }
  const save = useMutation({
    mutationFn: async ({ kind, form }: any) => {
      if (kind === 'company') return form.id ? (await api.put(`/companies/${form.id}`, { name: form.name })).data : (await api.post('/companies', { name: form.name })).data
      if (kind === 'department') return form.id ? (await api.put(`/departments/${form.id}`, { name: form.name, company_id: Number(form.company_id) })).data : (await api.post('/departments', { name: form.name, company_id: Number(form.company_id) })).data
      if (kind === 'operation') {
        const payload = { name: form.name, company_id: form.company_id ? Number(form.company_id) : null, department_id: form.department_id ? Number(form.department_id) : null, commission_percent: Number(form.commission_percent) }
        return form.id ? (await api.put(`/operations/${form.id}`, payload)).data : (await api.post('/operations', payload)).data
      }
      const payload = {
        name: form.name, company_id: Number(form.company_id), department_id: form.department_id ? Number(form.department_id) : null,
        monthly_cash_target_cents: toCents(form.target), full_fixed_cents: toCents(form.full_fixed),
        intermediate_percent: Number(form.intermediate_percent), intermediate_fixed_cents: toCents(form.intermediate_fixed),
        effective_from: form.effective_from, effective_to: form.effective_to || null,
      }
      return form.id ? (await api.put(`/compensation-rules/${form.id}`, payload)).data : (await api.post('/compensation-rules', payload)).data
    },
    onSuccess: () => { invalidate(); setModal({ kind: null }); showToast('Registro salvo.') },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })
  const remove = useMutation({
    mutationFn: async ({ kind, item }: any) => {
      const path = kind === 'company' ? 'companies' : kind === 'department' ? 'departments' : kind === 'operation' ? 'operations' : 'compensation-rules'
      return (await api.delete(`/${path}/${item.id}`)).data
    },
    onSuccess: () => { invalidate(); setRemoving(null); showToast('Registro removido ou arquivado.') },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })
  const toggleArchive = useMutation({
    mutationFn: async (op: any) => (await api.post(`/operations/${op.id}/archive`)).data,
    onSuccess: () => { invalidate(); showToast('Operação atualizada.') },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })


  return (
    <div className="page-stack">
      <div className="head">
        <div><h1>Operações</h1><p>Empresas, gerências, operações e regras de comissão. {admin ? 'Gerencie tudo por aqui.' : 'Visão somente leitura.'}</p></div>
      </div>

      <section className="card">
        <div className="top"><div><h2>Empresas</h2><p className="sub">Vínculo raiz dos leads e vendas.</p></div>{admin && <button className="btn sm primary" onClick={() => setModal({ kind: 'company', item: {} })}>Nova empresa</button>}</div>
        <table className="tbl"><thead><tr><th>Nome</th><th>Gerências</th>{admin && <th />}</tr></thead><tbody>
          {(companies || []).map((c: any) => <tr key={c.id}><td>{c.name}</td><td>{(c.departments || []).map((d: any) => d.name).join(', ') || '—'}</td>{admin && <td><button className="btn sm" onClick={() => setModal({ kind: 'company', item: c })}>Editar</button><button className="btn sm danger" onClick={() => setRemoving({ kind: 'company', item: c })}>Excluir</button></td>}</tr>)}
          {(companies || []).length === 0 && <tr><td colSpan={3} className="muted">Nenhuma empresa.</td></tr>}
        </tbody></table>
      </section>

      <section className="card">
        <div className="top"><div><h2>Gerências</h2><p className="sub">Subdivisões da empresa.</p></div>{admin && <button className="btn sm primary" onClick={() => setModal({ kind: 'department', item: { company_id: companies?.[0]?.id } })}>Nova gerência</button>}</div>
        <table className="tbl"><thead><tr><th>Nome</th><th>Empresa</th>{admin && <th />}</tr></thead><tbody>
          {(departments || []).map((d: any) => <tr key={d.id}><td>{d.name}</td><td>{d.company?.name ?? '—'}</td>{admin && <td><button className="btn sm" onClick={() => setModal({ kind: 'department', item: d })}>Editar</button><button className="btn sm danger" onClick={() => setRemoving({ kind: 'department', item: d })}>Excluir</button></td>}</tr>)}
          {(departments || []).length === 0 && <tr><td colSpan={3} className="muted">Nenhuma gerência.</td></tr>}
        </tbody></table>
      </section>

      <section className="card">
        <div className="top"><div><h2>Operações & comissão</h2><p className="sub">O percentual fica congelado na venda no momento do fechamento.</p></div>{admin && <button className="btn sm primary" onClick={() => setModal({ kind: 'operation', item: { company_id: companies?.[0]?.id, commission_percent: 7 } })}>Nova operação</button>}</div>
        <table className="tbl"><thead><tr><th>Operação</th><th>Empresa</th><th>Gerência</th><th>Comissão</th><th>Status</th>{admin && <th />}</tr></thead><tbody>
          {(operations || []).map((o: any) => <tr key={o.id}><td>{o.name}</td><td>{o.company?.name ?? '—'}</td><td>{o.department?.name ?? '—'}</td><td className="num">{o.commission_percent}%</td><td>{o.archived_at ? <span className="pill danger">Arquivada</span> : <span className="pill ok">Ativa</span>}</td>{admin && <td style={{ whiteSpace: 'nowrap' }}><button className="btn sm" onClick={() => setModal({ kind: 'operation', item: o })}>Editar</button><button className="btn sm" onClick={() => toggleArchive.mutate(o)}>{o.archived_at ? 'Reativar' : 'Arquivar'}</button><button className="btn sm danger" onClick={() => setRemoving({ kind: 'operation', item: o })}>Excluir</button></td>}</tr>)}
          {(operations || []).length === 0 && <tr><td colSpan={6} className="muted">Nenhuma operação.</td></tr>}
        </tbody></table>
      </section>

      <section className="card">
        <div className="top"><div><h2>Regras de comissão</h2><p className="sub">Meta de caixa, fixo e percentual intermediário, com vigência.</p></div>{admin && <button className="btn sm primary" onClick={() => setModal({ kind: 'rule', item: { company_id: companies?.[0]?.id, intermediate_percent: 70, effective_from: new Date().toISOString().slice(0, 10) } })}>Nova regra</button>}</div>
        <table className="tbl"><thead><tr><th>Nome</th><th>Empresa</th><th>Meta caixa</th><th>Fixo integral</th><th>Parcial</th><th>Vigência</th>{admin && <th />}</tr></thead><tbody>
          {(rules || []).map((r: any) => <tr key={r.id}><td>{r.name}</td><td>{r.company?.name ?? '—'}{r.department ? ` / ${r.department.name}` : ''}</td><td className="num">{brl(r.monthly_cash_target_cents)}</td><td className="num">{brl(r.full_fixed_cents)}</td><td className="num">{r.intermediate_percent}% · {brl(r.intermediate_fixed_cents)}</td><td>{dateBR(r.effective_from)}{r.effective_to ? ` → ${dateBR(r.effective_to)}` : ' → atual'}</td>{admin && <td style={{ whiteSpace: 'nowrap' }}><button className="btn sm" onClick={() => setModal({ kind: 'rule', item: r })}>Editar</button><button className="btn sm danger" onClick={() => setRemoving({ kind: 'rule', item: r })}>Excluir</button></td>}</tr>)}
          {(rules || []).length === 0 && <tr><td colSpan={7} className="muted">Nenhuma regra.</td></tr>}
        </tbody></table>
      </section>

      {modal.kind && <EntityModal kind={modal.kind} initial={modal.item || {}} companies={companies || []} allDepartments={departments || []} busy={save.isPending} onClose={() => setModal({ kind: null })} onSave={(form: any) => save.mutate({ kind: modal.kind, form })} />}
      {removing && <ConfirmDialog title="Remover registro?" message="Se houver vínculos, o registro será arquivado para preservar o histórico." confirmLabel="Remover" danger busy={remove.isPending} onClose={() => setRemoving(null)} onConfirm={() => remove.mutate(removing)} />}
    </div>
  )
}

function EntityModal({ kind, initial, companies, allDepartments, busy, onClose, onSave }: any) {
  const [form, setForm] = useState<any>({
    ...initial,
    target: initial.monthly_cash_target_cents != null ? fromCents(initial.monthly_cash_target_cents) : '',
    full_fixed: initial.full_fixed_cents != null ? fromCents(initial.full_fixed_cents) : '',
    intermediate_fixed: initial.intermediate_fixed_cents != null ? fromCents(initial.intermediate_fixed_cents) : '',
    commission_percent: initial.commission_percent ?? 7,
    intermediate_percent: initial.intermediate_percent ?? 70,
    effective_from: initial.effective_from ? String(initial.effective_from).slice(0, 10) : new Date().toISOString().slice(0, 10),
    effective_to: initial.effective_to ? String(initial.effective_to).slice(0, 10) : '',
  })
  const title = kind === 'company' ? 'Empresa' : kind === 'department' ? 'Gerência' : kind === 'operation' ? 'Operação' : 'Regra de comissão'

  return (
    <Modal
      title={`${initial.id ? 'Editar' : 'Nova'} ${title.toLowerCase()}`}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={busy || !form.name?.trim() || (kind !== 'company' && !form.company_id)} onClick={() => onSave({ ...form, id: initial.id })}>{busy ? 'Salvando...' : 'Salvar'}</button></>}
    >
      <div className="field"><label>Nome</label><input className="in" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
      {kind !== 'company' && <div className="field"><label>Empresa</label><select className="in" value={form.company_id || ''} onChange={e => setForm({ ...form, company_id: e.target.value, department_id: '' })}>{companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>}
      {(kind === 'department' || kind === 'operation' || kind === 'rule') && <div className="field"><label>Gerência (opcional)</label><select className="in" value={form.department_id || ''} onChange={e => setForm({ ...form, department_id: e.target.value })}><option value="">Todas</option>{allDepartments.filter((d: any) => !form.company_id || d.company_id === Number(form.company_id)).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>}
      {kind === 'operation' && <div className="field"><label>Comissão (%)</label><input className="in" inputMode="decimal" value={form.commission_percent} onChange={e => setForm({ ...form, commission_percent: e.target.value })} /></div>}
      {kind === 'rule' && <>
        <div className="two">
          <div className="field"><label>Meta de caixa (R$)</label><input className="in" inputMode="decimal" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} placeholder="18.000,00" /></div>
          <div className="field"><label>Fixo integral (R$)</label><input className="in" inputMode="decimal" value={form.full_fixed} onChange={e => setForm({ ...form, full_fixed: e.target.value })} placeholder="1.800,00" /></div>
          <div className="field"><label>Percentual parcial (%)</label><input className="in" inputMode="decimal" value={form.intermediate_percent} onChange={e => setForm({ ...form, intermediate_percent: e.target.value })} /></div>
          <div className="field"><label>Fixo parcial (R$)</label><input className="in" inputMode="decimal" value={form.intermediate_fixed} onChange={e => setForm({ ...form, intermediate_fixed: e.target.value })} placeholder="900,00" /></div>
          <div className="field"><label>Vigência de</label><input className="in" type="date" value={form.effective_from} onChange={e => setForm({ ...form, effective_from: e.target.value })} /></div>
          <div className="field"><label>Vigência até</label><input className="in" type="date" value={form.effective_to} onChange={e => setForm({ ...form, effective_to: e.target.value })} /></div>
        </div>
      </>}
    </Modal>
  )
}
