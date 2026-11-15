import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

const CHECK = [['Abri com contrato de tempo e objetivo da call',10],['Mapeei a situação atual do lead',15],['O lead disse a dor com as próprias palavras',15],['Quantifiquei o custo de não resolver',15],['Defini critério e prazo de decisão',10],['Apresentei a solução ligada à dor',15],['Pedi o fechamento de forma direta',10],['Combinei próximo passo com data e hora',10]]

export default function Calls() {
  const qc = useQueryClient()
  const { data: leads } = useQuery({ queryKey: ['leads'], queryFn: async () => (await api.get('/leads')).data })
  const { data: calls } = useQuery({ queryKey: ['calls'], queryFn: async () => (await api.get('/calls')).data })
  const [c, setC] = useState<boolean[]>(CHECK.map(()=>false))
  const [ratio, setRatio] = useState(42)
  const [leadId, setLeadId] = useState('')
  const total = CHECK.reduce((a,x,i) => a + (c[i]?(x[1] as number):0), 0)
  const pen = (ratio>=30 && ratio<=50) ? 0 : (ratio>=20 && ratio<=60) ? 5 : 10
  const final = Math.max(0, total - pen)
  const save = useMutation({
    mutationFn: async () => {
      const call = (await api.post('/calls', { lead_id: leadId || null, call_at: new Date().toISOString() })).data
      await api.post(`/calls/${call.id}/scorecard`, { criteria: c, talk_ratio: ratio, weights: CHECK.map(x=>x[1]) })
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calls'] }); setC(CHECK.map(()=>false)) },
  })
  return (
    <div className="flex flex-col gap-4">
      <div className="head"><div><h1>Scorecard de calls</h1><p className="text-muted">Depois de cada call, marque o que aconteceu.</p></div></div>
      <div className="grid grid-cols-2 gap-4">
        <section className="card">
          <h2 className="mb-3">Call de hoje</h2>
          <select className="in mb-3" value={leadId} onChange={e=>setLeadId(e.target.value)}>
            <option value="">Lead (opcional)</option>
            {(leads?.data||[]).map((l:any) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <div className="flex flex-col gap-2">
            {CHECK.map((x,i) => (
              <button key={i} onClick={() => { const n=[...c]; n[i]=!n[i]; setC(n) }} className={`tog flex items-center justify-between border border-line rounded-xl p-2.5 text-left ${c[i]?'border-accent bg-accent/10':''}`}>
                <span className="flex items-center gap-2"><span className={`bx w-4 h-4 rounded border-2 ${c[i]?'bg-accent border-accent':''}`}></span>{x[0]}</span>
                <em className="text-muted text-xs">+{x[1]}</em>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <label className="text-muted text-sm">Quanto da call você falou: <b className="num">{ratio}%</b></label>
            <input type="range" min={10} max={80} value={ratio} onChange={e=>setRatio(+e.target.value)} className="w-full" />
            <p className="text-muted text-xs mt-1">{ratio<30?'Você falou pouco.':ratio>50?'Você falou demais.':'Boa proporção.'} Ideal entre 30% e 50%.</p>
          </div>
          <button className="btn primary mt-4" onClick={() => save.mutate()}>Salvar call</button>
        </section>
        <div className="flex flex-col gap-4">
          <section className="card flex gap-4 items-center">
            <div className="w-20 h-20 rounded-full border-4 border-accent grid place-items-center font-display font-bold text-2xl">{final}</div>
            <div><h2>Nota {final}</h2><p className="text-muted text-sm">{pen?`Descontei ${pen} pontos pela proporção.`:'Sem desconto.'}</p></div>
          </section>
          <section className="card">
            <h3 className="mb-3">Histórico de calls</h3>
            <div className="flex flex-col gap-2">
              {(calls?.data||[]).slice(0,8).map((cl:any) => (
                <div key={cl.id} className="row flex justify-between border-t border-line py-2">
                  <span>{cl.lead?.name || 'Sem lead'}</span>
                  <span className="num">{cl.scorecard?.score ?? '-'}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
