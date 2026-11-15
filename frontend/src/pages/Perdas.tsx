import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function Perdas() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['leads'], queryFn: async () => (await api.get('/leads')).data })
  const leads = (data?.data || []).filter((l:any) => l.stage === 'loss' || l.stage === 'desqualificado')
  const [sel, setSel] = useState('')
  const cnt: Record<string, number> = {}
  leads.forEach((l:any) => { const m = l.loss_reason || 'Sem motivo'; cnt[m] = (cnt[m]||0)+1 })
  const motivos = Object.entries(cnt).sort((a,b)=>b[1]-a[1])
  if (!sel && motivos.length) setSel(motivos[0][0])
  const filtered = leads.filter((l:any) => (l.loss_reason||'Sem motivo') === sel)
  const max = motivos.length ? motivos[0][1] : 1
  const reativar = useMutation({
    mutationFn: async (l:any) => {
      await api.post('/leads', { name: l.name, phone: l.phone, email: l.email, description: l.description, call_at: l.call_at })
      await api.delete(`/leads/${l.id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
  return (
    <div className="flex flex-col gap-4">
      <div className="head"><div><h1>Perdas e recuperação</h1><p className="text-muted">Saber por que perdeu vale mais do que saber quanto perdeu.</p></div></div>
      {motivos.length === 0 && <section className="card"><p className="text-muted">Nenhum lead perdido ou desqualificado ainda.</p></section>}
      {motivos.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <section className="card">
            <h2 className="mb-3">Motivos</h2>
            {motivos.map(([m,n]) => (
              <button key={m} onClick={() => setSel(m)} className={`hbar w-full grid grid-cols-[150px_1fr_40px] items-center gap-2.5 py-1.5 text-left ${sel===m?'text-accent-text font-bold':''}`}>
                <span>{m}</span>
                <span className="bar h-3 bg-raise rounded-full overflow-hidden"><i className="block h-full bg-accent" style={{width:`${n/max*100}%`}}></i></span>
                <b className="num text-right">{n}</b>
              </button>
            ))}
          </section>
          <section className="card">
            <h2 className="mb-3">Reativar: {sel}</h2>
            <div className="flex flex-col gap-2">
              {filtered.map((l:any) => (
                <div key={l.id} className="row flex items-center gap-3 border-t border-line py-2">
                  <div className="grow flex-1"><strong>{l.name}</strong><span className="text-muted text-xs block">{l.stage} · {l.loss_note}</span></div>
                  <button className="btn sm" onClick={() => reativar.mutate(l)}>Reativar</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
