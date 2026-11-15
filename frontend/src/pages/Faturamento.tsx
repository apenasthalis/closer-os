import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import SaleModal from '../components/SaleModal'

function brl(c:number){ return (c/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }

export default function Faturamento() {
  const [saleTarget, setSaleTarget] = useState<any>(null)
  const [q, setQ] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const { data } = useQuery({ queryKey: ['finance', q, from, to], queryFn: async () => (await api.get('/metrics/finance', { params: { q, from, to } })).data })
  return (
    <div className="flex flex-col gap-4">
      <div className="head"><div><h1>Faturamento e caixa</h1><p className="text-muted">Faturamento é tudo que foi contratado. Caixa é só o que entrou.</p></div></div>
      <section className="card">
        <div className="filters flex flex-wrap gap-3 items-end">
          <div className="field flex-1 min-w-[200px]"><label className="text-muted text-sm">Buscar cliente</label><input className="in" value={q} onChange={e=>setQ(e.target.value)} /></div>
          <div className="field"><label className="text-muted text-sm">De</label><input className="in" type="date" value={from} onChange={e=>setFrom(e.target.value)} /></div>
          <div className="field"><label className="text-muted text-sm">Até</label><input className="in" type="date" value={to} onChange={e=>setTo(e.target.value)} /></div>
        </div>
      </section>
      <div className="kgrid grid grid-cols-5 gap-3">
        <div className="card kpi"><div className="eyebrow">Faturamento contratado</div><strong className="num text-xl">{brl(data?.faturamento||0)}</strong></div>
        <div className="card kpi"><div className="eyebrow">Caixa líquido</div><strong className="num text-xl text-accent-text">{brl(data?.caixa_liquido||0)}</strong></div>
        <div className="card kpi"><div className="eyebrow">A receber</div><strong className="num text-xl text-warn">{brl(data?.a_receber||0)}</strong></div>
        <div className="card kpi"><div className="eyebrow">Ticket médio</div><strong className="num text-xl">{brl(data?.ticket_medio||0)}</strong></div>
        <div className="card kpi"><div className="eyebrow">Comissão</div><strong className="num text-xl">{brl(data?.comissao||0)}</strong></div>
      </div>
      <section className="card">
        <h2 className="mb-3">Vendas do período</h2>
        <div className="tbl overflow-x-auto">
          <table className="w-full">
            <thead><tr className="text-left text-xs uppercase text-muted border-b border-line"><th className="py-2">Fechamento</th><th>Cliente</th><th className="text-right">Faturamento</th><th className="text-right">Caixa</th><th className="text-right">A receber</th><th className="text-right">Comissão</th><th></th></tr></thead>
            <tbody>
            {(data?.sales||[]).map((s:any) => (
              <tr key={s.id} className="border-b border-line">
                <td className="py-2 num">{s.closed_at?.slice(0,10)}</td>
                <td><strong>{s.lead?.name}</strong><div className="text-muted text-xs">{s.operation?.name} · {s.commission_percent}%</div></td>
                <td className="text-right num">{brl((s.payments||[]).reduce((a:any,p:any)=>a+p.amount_cents,0))}</td>
                <td className="text-right num">{brl((s.payments||[]).filter((p:any)=>['pix','card'].includes(p.method)&&p.status==='paid').reduce((a:any,p:any)=>a+p.amount_cents-(p.method==='card'?p.gateway_fee_cents:0),0))}</td>
                <td className="text-right num">{brl((s.payments||[]).filter((p:any)=>['pix','card'].includes(p.method)&&p.status==='pending').reduce((a:any,p:any)=>a+p.amount_cents,0))}</td>
                <td className="text-right num">{brl(Math.round(((s.payments||[]).filter((p:any)=>['pix','card'].includes(p.method)&&p.status==='paid').reduce((a:any,p:any)=>a+p.amount_cents-(p.method==='card'?p.gateway_fee_cents:0),0))*s.commission_percent/100))}</td>
              <td className="text-right"><button className="btn sm" onClick={()=>setSaleTarget({lead:{id:s.lead_id,name:s.lead?.name}, sale:s})}>Editar</button></td></tr>
            ))}
            </tbody>
          </table>
        </div>
      </section>
    {saleTarget && (
      <SaleModal leadId={saleTarget.lead.id} leadName={saleTarget.lead.name} sale={saleTarget.sale} onClose={()=>setSaleTarget(null)} onSaved={()=>{ setSaleTarget(null) }} />
    )}
    </div>
  )
}
