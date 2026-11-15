import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import SaleModal from '../components/SaleModal'

const ETAPAS = [['lead_agendado','Lead Agendado'],['no_show','No-show'],['fup','FUP'],['remarcado','Remarcado'],['negociacao','Negociação'],['fechado','Fechado'],['loss','Loss'],['desqualificado','Desqualificado']]
const MOTIVOS = ['Preço','Sem tempo / timing','Decide com terceiro','Concorrente','Sem fit','Sem resposta']

export default function Pipeline() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<any>(null)
  const { data } = useQuery({ queryKey: ['leads', q], queryFn: async () => (await api.get('/leads', { params: { q } })).data })
  const leads = data?.data || []
  const move = useMutation({
    mutationFn: async ({ id, stage, motivo, nota }: any) => {
      await api.post(`/leads/${id}/transition`, { stage, loss_reason: motivo, loss_note: nota })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
  const create = useMutation({
    mutationFn: async (form: any) => (await api.post('/leads', form)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); setModal(null) },
  })
  const [form, setForm] = useState<any>({ name: '', phone: '', email: '', description: '', call_at: '' })
  const [mv, setMv] = useState<any>(null)
  const [saleTarget, setSaleTarget] = useState<any>(null)

  return (
    <div className="flex flex-col gap-4">
      <div className="head">
        <div><h1>Pipeline</h1><p className="text-muted">Mova os cards entre as etapas.</p></div>
        <button className="btn primary" onClick={() => setModal('new')}>Novo lead</button>
      </div>
      <section className="card">
        <input className="in" placeholder="Buscar lead" value={q} onChange={e=>setQ(e.target.value)} />
      </section>
      <div className="kanban grid grid-cols-8 gap-3 overflow-x-auto">
        {ETAPAS.map(([key, label]) => (
          <div key={key} className="col bg-surface border border-line rounded-xl p-3 flex flex-col gap-2 min-h-[170px]">
            <header className="flex justify-between"><h3 className="text-sm font-semibold">{label}</h3><span className="pill num">{leads.filter((l:any)=>l.stage===key).length}</span></header>
            {leads.filter((l:any)=>l.stage===key).map((l:any) => (
              <div key={l.id} className="kc bg-bg border border-line rounded-lg p-2.5 flex flex-col gap-1.5 cursor-pointer" onClick={() => setModal({ type: 'edit', lead: l })}>
                <strong className="text-sm">{l.name}</strong>
                <div className="meta flex justify-between text-xs text-muted"><span>{l.call_at ? l.call_at.slice(0,16).replace('T',' ') : 'Sem call'}</span></div>
                {l.no_show_count > 0 && <span className="pill hot text-xs">{l.no_show_count} no-show</span>}
                <select className="in text-xs" value={l.stage} onChange={(e) => {
                  const v = e.target.value
                  if (v === 'fechado') { setSaleTarget({ lead: l, sale: null }); return }
                  if (v === 'loss' || v === 'desqualificado') { setMv({ id: l.id, stage: v }) } else { move.mutate({ id: l.id, stage: v }) }
                }} onClick={e=>e.stopPropagation()}>
                  {ETAPAS.map(([k,lab]) => <option key={k} value={k}>{lab}</option>)}
                </select>
              </div>
            ))}
          </div>
        ))}
      </div>

      {modal === 'new' && (
        <div className="mback fixed inset-0 bg-black/66 z-30 flex items-center justify-center p-4" onClick={()=>setModal(null)}>
          <div className="mdlg bg-surface border border-line rounded-2xl w-full max-w-lg p-5" onClick={e=>e.stopPropagation()}>
            <h2 className="mb-3">Novo lead</h2>
            <div className="flex flex-col gap-3">
              <input className="in" placeholder="Nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input className="in" placeholder="Telefone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
                <input className="in" placeholder="E-mail" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
              </div>
              <input className="in" type="datetime-local" value={form.call_at} onChange={e=>setForm({...form,call_at:e.target.value})} />
              <textarea className="in" rows={3} placeholder="Descrição pessoal" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn" onClick={()=>setModal(null)}>Cancelar</button>
              <button className="btn primary" onClick={()=>create.mutate(form)}>Criar</button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'edit' && (
        <div className="mback fixed inset-0 bg-black/66 z-30 flex items-center justify-center p-4" onClick={()=>setModal(null)}>
          <div className="mdlg bg-surface border border-line rounded-2xl w-full max-w-lg p-5" onClick={e=>e.stopPropagation()}>
            <h2 className="mb-3">Editar lead</h2>
            <p className="text-muted mb-3">{modal.lead.name}</p>
            <p className="text-sm">Etapa: {modal.lead.stage}</p>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn" onClick={()=>setModal(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {mv && (
        <div className="mback fixed inset-0 bg-black/66 z-30 flex items-center justify-center p-4" onClick={()=>setMv(null)}>
          <div className="mdlg bg-surface border border-line rounded-2xl w-full max-w-lg p-5" onClick={e=>e.stopPropagation()}>
            <h2 className="mb-3">Motivo</h2>
            <select className="in mb-3" id="mot" defaultValue={MOTIVOS[0]}>
              {MOTIVOS.map(m => <option key={m}>{m}</option>)}
            </select>
            <textarea className="in mb-3" id="nota" rows={3} placeholder="Nota" />
            <div className="flex justify-end gap-2">
              <button className="btn" onClick={()=>setMv(null)}>Cancelar</button>
              <button className="btn primary" onClick={() => {
                const motivo = (document.getElementById('mot') as HTMLSelectElement).value
                const nota = (document.getElementById('nota') as HTMLTextAreaElement).value
                move.mutate({ id: mv.id, stage: mv.stage, motivo, nota })
                setMv(null)
              }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    {saleTarget && (
      <SaleModal leadId={saleTarget.lead.id} leadName={saleTarget.lead.name} sale={saleTarget.sale} onClose={()=>setSaleTarget(null)} onSaved={()=>{ qc.invalidateQueries({queryKey:['leads']}); setSaleTarget(null) }} />
    )}
    </div>
  )
}
