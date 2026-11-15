import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError } from '../lib/format'
import { showToast } from '../lib/toast'
import Modal from './Modal'

export default function ObjectionOccurrenceModal({ objection, leadId, callId, onClose, onSaved }: {
  objection?: any; leadId?: number; callId?: number; onClose: () => void; onSaved?: () => void
}) {
  const qc = useQueryClient()
  const { data: objections } = useQuery({ queryKey: ['objections'], queryFn: async () => (await api.get('/objections')).data })
  const { data: leadsData } = useQuery({ queryKey: ['leads', 'objection-picker'], queryFn: async () => (await api.get('/leads', { params: { per_page: 500 } })).data })
  const { data: callsData } = useQuery({ queryKey: ['calls', 'objection-picker'], queryFn: async () => (await api.get('/calls', { params: { per_page: 200 } })).data })
  const [form, setForm] = useState<any>({
    objection_id: objection?.id ?? objections?.[0]?.id ?? '',
    lead_id: leadId ?? '',
    call_id: callId ?? '',
    resolved: false,
    sale_happened: false,
    notes: '',
  })
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!form.objection_id && objections?.length) setForm((f: any) => ({ ...f, objection_id: objections[0].id }))
  }, [objections])

  const save = useMutation({
    mutationFn: async () => (await api.post('/objections/occurrences', {
      objection_id: Number(form.objection_id),
      lead_id: form.lead_id ? Number(form.lead_id) : null,
      call_id: form.call_id ? Number(form.call_id) : null,
      resolved: form.resolved,
      sale_happened: form.sale_happened,
      notes: form.notes || null,
    })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['objections'] })
      qc.invalidateQueries({ queryKey: ['objection-stats'] })
      qc.invalidateQueries({ queryKey: ['objection-occurrences'] })
      qc.invalidateQueries({ queryKey: ['lead'] })
      showToast('Ocorrência registrada.')
      onSaved?.()
      onClose()
    },
    onError: (e: any) => setErr(apiError(e)),
  })

  return (
    <Modal
      title="Registrar objeção"
      sub={objection?.name}
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={!form.objection_id || save.isPending} onClick={() => { setErr(''); save.mutate() }}>{save.isPending ? 'Salvando...' : 'Registrar'}</button></>}
    >
      {!objection && <div className="field"><label>Objeção</label><select className="in" value={form.objection_id} onChange={e => setForm({ ...form, objection_id: e.target.value })}>{(objections || []).map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>}
      <div className="two">
        <div className="field"><label>Lead</label><select className="in" value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}><option value="">Sem lead</option>{(leadsData?.data || []).map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
        <div className="field"><label>Call</label><select className="in" value={form.call_id} onChange={e => setForm({ ...form, call_id: e.target.value })}><option value="">Sem call</option>{(callsData?.data || []).map((c: any) => <option key={c.id} value={c.id}>{c.lead?.name ?? 'Call'} · {String(c.call_at || '').slice(0, 10)}</option>)}</select></div>
      </div>
      <div className="two">
        <button type="button" className="tog" aria-pressed={form.resolved} onClick={() => setForm({ ...form, resolved: !form.resolved })}><span className="bx" />Objeção contornada</button>
        <button type="button" className="tog" aria-pressed={form.sale_happened} onClick={() => setForm({ ...form, sale_happened: !form.sale_happened })}><span className="bx" />Venda aconteceu</button>
      </div>
      <div className="field"><label>Observações</label><textarea className="in" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
      {err && <p className="msg">{err}</p>}
    </Modal>
  )
}
