import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function Objecoes() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['objections'], queryFn: async () => (await api.get('/objections')).data })
  const { data: stats } = useQuery({ queryKey: ['objection-stats'], queryFn: async () => (await api.get('/objections/stats')).data })
  const [q, setQ] = useState('')
  const [occ, setOcc] = useState<any>(null)
  const objs = (data || []).filter((o:any) => !q || (o.name+o.category).toLowerCase().includes(q.toLowerCase()))
  const reg = useMutation({
    mutationFn: async (d:any) => (await api.post('/objections/occurrences', d)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['objection-stats'] }); setOcc(null) },
  })
  return (
    <div className="flex flex-col gap-4">
      <div className="head"><div><h1>Banco de objeções</h1><p className="text-muted">As respostas que funcionam, a um toque da call.</p></div></div>
      <section className="card">
        <input className="in mb-3" placeholder="Buscar objeção" value={q} onChange={e=>setQ(e.target.value)} />
        <div className="text-muted text-sm mb-3">Ocorrências: {stats?.total||0} · Contornadas: {stats?.resolved||0} · Vendas: {stats?.sales||0} · Conversão: {stats?.conversion||0}%</div>
        <div className="flex flex-col gap-3">
          {objs.map((o:any) => (
            <div key={o.id} className="row flex items-start gap-3 border-t border-line py-3">
              <div className="grow flex-1 min-w-[220px]">
                <strong>"{o.name}"</strong>
                <div className="flex gap-2 mt-1"><span className="pill">{o.category}</span><span className="pill ok num">ref {o.reference_conversion}%</span></div>
              </div>
              <div className="flex-[2] min-w-[240px] say bg-bg border border-line rounded-xl p-3 text-sm whitespace-pre-wrap">{o.suggested_response}</div>
              <div className="flex flex-col gap-2">
                <button className="btn" onClick={() => navigator.clipboard.writeText(o.suggested_response)}>Copiar</button>
                <button className="btn sm" onClick={() => setOcc(o)}>Registrar</button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {occ && (
        <div className="mback fixed inset-0 bg-black/66 z-30 flex items-center justify-center p-4" onClick={()=>setOcc(null)}>
          <div className="mdlg bg-surface border border-line rounded-2xl w-full max-w-lg p-5" onClick={e=>e.stopPropagation()}>
            <h2 className="mb-3">Registrar ocorrência: {occ.name}</h2>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2"><input type="checkbox" id="res" /> Contornada</label>
              <label className="flex items-center gap-2"><input type="checkbox" id="sale" /> Venda aconteceu</label>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn" onClick={()=>setOcc(null)}>Cancelar</button>
              <button className="btn primary" onClick={() => reg.mutate({ objection_id: occ.id, resolved: (document.getElementById('res') as HTMLInputElement).checked, sale_happened: (document.getElementById('sale') as HTMLInputElement).checked })}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
