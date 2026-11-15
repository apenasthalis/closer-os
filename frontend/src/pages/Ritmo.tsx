import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function Ritmo() {
  const { data: m } = useQuery({ queryKey: ['pipeline-metrics'], queryFn: async () => (await api.get('/metrics/pipeline')).data })
  return (
    <div className="flex flex-col gap-4">
      <div className="head"><div><h1>Metas e ritmo</h1><p className="text-muted">O funil do mês e os dias em que você mais conversa.</p></div></div>
      <div className="grid grid-cols-4 gap-3">
        <div className="card"><div className="eyebrow">Calls agendadas</div><div className="kpi mt-1.5"><strong className="num text-2xl">{m?.agendadas||0}</strong></div></div>
        <div className="card"><div className="eyebrow">Compareceram</div><div className="kpi mt-1.5"><strong className="num text-2xl">{m?.agendadas - (m?.noShows||0) || 0}</strong></div></div>
        <div className="card"><div className="eyebrow">Leads que faltaram</div><div className="kpi mt-1.5"><strong className="num text-2xl">{m?.noShows||0}</strong></div></div>
        <div className="card"><div className="eyebrow">Fechamentos</div><div className="kpi mt-1.5"><strong className="num text-2xl">{m?.funnel?.fechado||0}</strong></div></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <section className="card">
          <h2 className="mb-3">Funil do mês</h2>
          <div className="flex flex-col gap-2">
            {Object.entries(m?.funnel || {}).map(([k,v]) => (
              <div key={k} className="fstep grid grid-cols-[110px_1fr_60px] items-center gap-2.5">
                <span className="text-sm">{k}</span>
                <div className="bar h-6 bg-raise rounded-lg overflow-hidden"><i className="block h-full bg-accent opacity-80" style={{width:`${m?.agendadas? (v as number)/m.agendadas*100 : 0}%`}}></i></div>
                <span className="num text-right">{v as number}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <h2 className="mb-3">Métricas de no-show</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between"><span>Taxa de no-show</span><b className="num">{m?.taxaNoShow||0}%</b></div>
            <div className="flex justify-between"><span>Recuperados</span><b className="num">{m?.recuperados||0}</b></div>
            <div className="flex justify-between"><span>Desqualificados</span><b className="num">{m?.desqualificados||0}</b></div>
            <div className="flex justify-between"><span>Taxa de desqualificação</span><b className="num">{m?.taxaDesq||0}%</b></div>
          </div>
        </section>
      </div>
    </div>
  )
}
