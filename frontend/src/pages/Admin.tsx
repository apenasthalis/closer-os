import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, dateTimeBR } from '../lib/format'
import { showToast } from '../lib/toast'
import { useAuth } from '../stores/auth'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Admin() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'users' | 'audit'>('users')
  const [editing, setEditing] = useState<any>(null)
  const [deactivating, setDeactivating] = useState<any>(null)
  const [auditFilters, setAuditFilters] = useState({ action: '', entity_type: '' })

  const isAdmin = user?.role === 'admin'
  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: async () => (await api.get('/users')).data, enabled: isAdmin, retry: false })
  const { data: logs } = useQuery({ queryKey: ['audit-logs', auditFilters], queryFn: async () => (await api.get('/audit-logs', { params: auditFilters })).data, enabled: isAdmin && tab === 'audit', retry: false })

  const save = useMutation({
    mutationFn: async (form: any) => {
      const payload: any = { name: form.name, email: form.email, role: form.role, active: form.active }
      if (form.password) payload.password = form.password
      if (form.id) return (await api.put(`/users/${form.id}`, payload)).data
      return (await api.post('/users', payload)).data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setEditing(null); showToast('Usuário salvo.') },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })
  const deactivate = useMutation({
    mutationFn: async (u: any) => (await api.delete(`/users/${u.id}`)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setDeactivating(null); showToast('Usuário desativado.') },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })

  if (!isAdmin) return <div className="alert"><h3>Acesso restrito</h3><p className="sub">Apenas administradores podem gerenciar usuários e ver a auditoria.</p></div>

  return (
    <div className="page-stack">
      <div className="head">
        <div><h1>Administração</h1><p>Usuários, permissões e trilha de auditoria.</p></div>
        <div className="acts"><div className="seg"><button aria-pressed={tab === 'users'} onClick={() => setTab('users')}>Usuários</button><button aria-pressed={tab === 'audit'} onClick={() => setTab('audit')}>Auditoria</button></div>{tab === 'users' && <button className="btn primary" onClick={() => setEditing({ role: 'closer', active: true })}>Novo usuário</button>}</div>
      </div>

      {tab === 'users' && <section className="card">
        <div className="top"><div><h2>Usuários</h2><p className="sub">Admin vê tudo; closer vê apenas os próprios leads.</p></div></div>
        {isLoading ? <p className="muted">Carregando...</p> : <table className="tbl"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th /></tr></thead><tbody>
          {(users || []).map((u: any) => <tr key={u.id}><td>{u.name}{u.id === user?.id ? ' (você)' : ''}</td><td>{u.email}</td><td><span className={`pill ${u.role === 'admin' ? 'warm' : ''}`}>{u.role}</span></td><td>{u.active ? <span className="pill ok">Ativo</span> : <span className="pill danger">Inativo</span>}</td><td style={{ whiteSpace: 'nowrap' }}><button className="btn sm" onClick={() => setEditing(u)}>Editar</button>{u.id !== user?.id && <button className="btn sm danger" onClick={() => setDeactivating(u)} disabled={!u.active}>Desativar</button>}</td></tr>)}
        </tbody></table>}
      </section>}

      {tab === 'audit' && <>
        <section className="card">
          <div className="two">
            <div className="field"><label>Ação</label><input className="in" value={auditFilters.action} onChange={e => setAuditFilters({ ...auditFilters, action: e.target.value })} placeholder="lead_created, sale_created..." /></div>
            <div className="field"><label>Entidade</label><input className="in" value={auditFilters.entity_type} onChange={e => setAuditFilters({ ...auditFilters, entity_type: e.target.value })} placeholder="lead, sale, user..." /></div>
          </div>
        </section>
        <section className="card">
          <div className="top"><div><h2>Trilha de auditoria</h2><p className="sub">Últimos 50 registros, mais recentes primeiro.</p></div></div>
          <table className="tbl"><thead><tr><th>Data</th><th>Ator</th><th>Ação</th><th>Entidade</th><th>ID</th><th>Detalhes</th></tr></thead><tbody>
            {(logs?.data || []).map((l: any) => <tr key={l.id}><td>{dateTimeBR(l.created_at)}</td><td>{l.actor?.name ?? l.actor_user_id ?? 'Sistema'}</td><td>{l.action}</td><td>{l.entity_type}</td><td>{l.entity_id}</td><td><code style={{ fontSize: 11 }}>{l.meta ? JSON.stringify(l.meta) : '—'}</code></td></tr>)}
            {(logs?.data || []).length === 0 && <tr><td colSpan={6} className="muted">Nenhum registro.</td></tr>}
          </tbody></table>
        </section>
      </>}

      {editing && <UserModal initial={editing} busy={save.isPending} onClose={() => setEditing(null)} onSave={(f: any) => save.mutate(f)} />}
      {deactivating && <ConfirmDialog title="Desativar usuário?" message={`${deactivating.name} perderá o acesso ao sistema. O histórico é preservado.`} confirmLabel="Desativar" danger busy={deactivate.isPending} onClose={() => setDeactivating(null)} onConfirm={() => deactivate.mutate(deactivating)} />}
    </div>
  )
}

function UserModal({ initial, busy, onClose, onSave }: any) {
  const [form, setForm] = useState<any>({ id: initial.id, name: initial.name ?? '', email: initial.email ?? '', role: initial.role ?? 'closer', active: initial.active ?? true, password: '' })
  return (
    <Modal title={initial.id ? 'Editar usuário' : 'Novo usuário'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={!form.name.trim() || !form.email.trim() || (!initial.id && form.password.length < 6) || busy} onClick={() => onSave(form)}>{busy ? 'Salvando...' : 'Salvar'}</button></>}>
      <div className="field"><label>Nome</label><input className="in" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
      <div className="field"><label>E-mail</label><input className="in" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
      <div className="two">
        <div className="field"><label>Perfil</label><select className="in" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="closer">Closer</option><option value="admin">Admin</option></select></div>
        <div className="field"><label>{initial.id ? 'Nova senha (opcional)' : 'Senha'}</label><input className="in" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
      </div>
      <button type="button" className="tog" aria-pressed={form.active} onClick={() => setForm({ ...form, active: !form.active })}><span className="bx" />Usuário ativo</button>
    </Modal>
  )
}
