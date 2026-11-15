import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuth } from '../stores/auth'
import { apiError, toLocalInput } from '../lib/format'
import { showToast } from '../lib/toast'
import Modal from './Modal'

export default function LeadModal({ lead, onClose, onSaved }: { lead?: any; onClose: () => void; onSaved?: (lead: any) => void }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [form, setForm] = useState<any>({
    name: lead?.name ?? '',
    phone: lead?.phone ?? '',
    email: lead?.email ?? '',
    description: lead?.description ?? '',
    call_at: toLocalInput(lead?.call_at),
    company_id: lead?.company_id ?? '',
    department_id: lead?.department_id ?? '',
    user_id: lead?.user_id ?? user?.id ?? '',
  })
  const [err, setErr] = useState('')

  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: async () => (await api.get('/companies')).data })
  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: async () => (await api.get('/departments')).data })
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data,
    enabled: user?.role === 'admin',
    retry: false,
  })

  const depts = (departments || []).filter((d: any) => !form.company_id || d.company_id === Number(form.company_id))

  useEffect(() => {
    if (form.department_id && !depts.some((d: any) => d.id === Number(form.department_id))) {
      setForm((f: any) => ({ ...f, department_id: '' }))
    }
  }, [form.company_id])

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name.trim(),
        phone: form.phone || null,
        email: form.email || null,
        description: form.description || null,
        call_at: form.call_at || null,
        company_id: form.company_id ? Number(form.company_id) : null,
        department_id: form.department_id ? Number(form.department_id) : null,
      }
      if (user?.role === 'admin') payload.user_id = form.user_id ? Number(form.user_id) : null
      if (lead) return (await api.put(`/leads/${lead.id}`, payload)).data
      return (await api.post('/leads', payload)).data
    },
    onSuccess: (data: any) => {
      const saved = data?.lead ?? data
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['lead', saved?.id] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      if (data?.duplicate_phone) showToast('Lead salvo. Já existe outro lead com este telefone.', 'err')
      else showToast(lead ? 'Lead atualizado.' : 'Lead criado.')
      onSaved?.(saved)
      onClose()
    },
    onError: (e: any) => setErr(apiError(e)),
  })

  return (
    <Modal
      title={lead ? 'Editar lead' : 'Novo lead'}
      sub="Cadastro enxuto. Qualificação e histórico ficam no Lead 360."
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={!form.name.trim() || save.isPending} onClick={() => { setErr(''); save.mutate() }}>{save.isPending ? 'Salvando...' : 'Salvar'}</button></>}
    >
      <div className="two">
        <div className="field"><label>Nome</label><input className="in" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome do lead" /></div>
        <div className="field"><label>Telefone</label><input className="in" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" /></div>
        <div className="field"><label>E-mail</label><input className="in" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" /></div>
        <div className="field"><label>Data e hora da call</label><input className="in" type="datetime-local" value={form.call_at} onChange={e => setForm({ ...form, call_at: e.target.value })} /></div>
        <div className="field"><label>Empresa</label><select className="in" value={form.company_id} onChange={e => setForm({ ...form, company_id: e.target.value })}><option value="">Sem empresa</option>{(companies || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div className="field"><label>Gerência</label><select className="in" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}><option value="">Sem gerência</option>{depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        {user?.role === 'admin' && <div className="field"><label>Closer responsável</label><select className="in" value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}>{(users || []).filter((u: any) => u.active).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>}
      </div>
      <div className="field"><label>Descrição pessoal</label><textarea className="in" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Contexto, dor, observações" /></div>
      {err && <p className="msg">{err}</p>}
    </Modal>
  )
}
