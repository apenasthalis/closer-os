import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function Hoje() {
  const { data: leads } = useQuery({ queryKey: ['leads'], queryFn: async () => (await api.get('/leads')).data })
  const { data: fin } = useQuery({ queryKey: ['finance'], queryFn: async () => (await api.get('/metrics/finance')).data })
  const today = new Date().toISOString().slice(0,10)
  const ag = (leads?.data || []).filter((l:any) => l.call_at?.slice(0,10) === today)
  const sem = (leads?.data || []).filter((l:any) => !['fechado','loss','desqualificado'].includes(l.stage) && (!l.call_at || l.call_at.slice(0,10) < today))
  return (
    <div className="flex flex-col gap-4">
      <div className="head">
        <div><h1>Hoje</h1><p className="text-muted">Sua agenda de calls, o que precisa de nova data e o resumo financeiro do mês.</p></div>
      </div>
      <div className="kgrid grid grid-cols-4 gap-3">
        <div className="card kpi"><div className="eyebrow">Faturamento do mês</div><strong className="num text-2xl">{(fin?.faturamento/100||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></div>
        <div className="card kpi"><div className="eyebrow">Caixa do mês</div><strong className="num text-2xl text-accent-text">{(fin?.caixa_liquido/100||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></div>
        <div className="card kpi"><div className="eyebrow">Calls hoje</div><strong className="num text-2xl">{ag.length}</strong></div>
        <div className="card kpi"><div className="eyebrow">Precisam de nova data</div><strong className="num text-2xl text-warn">{sem.length}</strong></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <section className="card">
          <h2 className="mb-3">Agenda de hoje</h2>
          {ag.length===0 && <p className="text-muted">Nenhuma call marcada para hoje.</p>}
          {ag.map((l:any) => (
            <div key={l.id} className="row flex items-center gap-3 py-2 border-t border-line">
              <span className="time font-semibold w-12">{l.call_at?.slice(11,16)}</span>
              <div className="grow flex-1"><strong>{l.name}</strong><span className="text-muted text-sm block">{l.stage}</span></div>
            </div>
          ))}
        </section>
        <section className="card">
          <h2 className="mb-3">Precisam de nova data</h2>
          {sem.length===0 && <p className="text-muted">Todos os leads em aberto têm uma call futura.</p>}
          {sem.map((l:any) => (
            <div key={l.id} className="row flex items-center gap-3 py-2 border-t border-line">
              <div className="grow flex-1"><strong>{l.name}</strong><span className="text-muted text-sm block">{l.stage}</span></div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
