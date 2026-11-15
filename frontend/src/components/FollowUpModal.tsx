import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, toLocalInput } from '../lib/format'
import { showToast } from '../lib/toast'
import Modal from './Modal'

export default function FollowUpModal({ leadId, onClose, onSaved }: { leadId?: number; onClose: () => void; onSaved?: () => void }) {
  const qc = useQueryClient()
  const { data: leadsData } = useQuery({ queryKey: ['leads', 'followup-picker'], queryFn: async () => (await api.get('/leads', { params: { per_page: 500 } })).data })
  const { data: templates } = useQuery({ queryKey: ['follow-templates'], queryFn: async () => (await api.get('/follow-up-templates')).data })
  const leads = leadsData?.data || []
  const defaultLead = leadId ?? leads[0]?.id ?? ''
  const [form, setForm] = useState<any>({ lead_id: defaultLead, scheduled_at: toLocalInput(new Date(Date.now() + 3600_000)), message: '', template_id: '' })
  const [err, setErr] = useState('')

  const lead = useMemo(() => leads.find((l: any) => l.id === Number(form.lead_id)), [leads, form.lead_id])

  useEffect(() => {
    if (!form.lead_id && leads.length) setForm((f: any) => ({ ...f, lead_id: leads[0].id }))
  }, [leads])

  function applyTemplate(id: string) {
    const t = (templates || []).find((x: any) => x.id === Number(id))
    if (!t) return setForm({ ...form, template_id: id })
    const name = lead?.name?.split(' ')[0] ?? '[nome]'
    setForm({ ...form, template_id: id, message: t.body.replace(/\{nome\}/g, name) })
  }

  const save = useMutation({
    mutationFn: async () => (await api.post('/follow-ups', {
      lead_id: Number(form.lead_id),
      scheduled_at: form.scheduled_at,
      message: form.message,
    })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow-ups'] })
      qc.invalidateQueries({ queryKey: ['follow-summary'] })
      qc.invalidateQueries({ queryKey: ['lead'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      showToast('Follow-up agendado.')
      onSaved?.()
      onClose()
    },
    onError: (e: any) => setErr(apiError(e)),
  })

  return (
    <Modal
      title="Novo follow-up"
      sub="Agende o próximo contato e registre o resultado depois."
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={!form.lead_id || !form.message.trim() || save.isPending} onClick={() => { setErr(''); save.mutate() }}>{save.isPending ? 'Salvando...' : 'Agendar'}</button></>}
    >
      {!leads.length ? <p className="muted">Nenhum lead disponível.</p> : <>
        <div className="field"><label>Lead</label><select className="in" value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}>{leads.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
        <div className="two">
          <div className="field"><label>Data e hora</label><input className="in" type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} /></div>
          <div className="field"><label>Modelo</label><select className="in" value={form.template_id} onChange={e => applyTemplate(e.target.value)}><option value="">Mensagem livre</option>{(templates || []).map((t: any) => <option key={t.id} value={t.id}>{t.day_label} · {t.title}</option>)}</select></div>
        </div>
        <div className="field"><label>Mensagem / ação planejada</label><textarea className="in" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
        {err && <p className="msg">{err}</p>}
      </>}
    </Modal>
  )
}
