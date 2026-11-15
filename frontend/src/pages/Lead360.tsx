import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import SaleModal from '../components/SaleModal'
function comissaoCents(payments:any[], pct:number){ const caixa = (payments||[]).filter((p:any)=>['pix','card'].includes(p.method)&&p.status==='paid').reduce((a:any,p:any)=>a+p.amount_cents-(p.method==='card'?p.gateway_fee_cents:0),0); return Math.round(caixa*pct/100) }

function score(l:any){ const b=(l.qualification?Object.values(l.qualification).filter(Boolean).length:0)*20; const eng=Math.min(20,Math.max(0,((l.events||[]).length-1)*4)); return b+eng }
function temp(s:number){ return s>=70?['Quente','hot']:s>=40?['Morno','warm']:['Frio','cold'] }

export default function Lead360() {
  const qc = useQueryClient()
  const [lq, setLq] = useState('')
  const [saleTarget, setSaleTarget] = useState<any>(null)
  const [selected, setSelected] = useState<string>('')
  const { data } = useQuery({ queryKey: ['leads', lq], queryFn: async () => (await api.get('/leads', { params: { q: lq } })).data })
  const leads = data?.data || []
  const lead = leads.find((x:any) => x.id === (selected || leads[0]?.id))
  const ld = useQuery({ queryKey: ['lead', lead?.id], queryFn: async () => (await api.get(`/leads/${lead.id}`)).data, enabled: !!lead?.id })

  const bant = useMutation({
    mutationFn: async ({ key, val }: any) => (await api.patch(`/leads/${lead.id}/qualification`, { [key]: val })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); qc.invalidateQueries({ queryKey: ['lead', lead.id] }) },
  })
  const note = useMutation({
    mutationFn: async (n: string) => (await api.post(`/leads/${lead.id}/notes`, { note: n })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead', lead.id] }),
  })

  const d = ld.data || lead
  const sc = d ? score(d) : 0
  const tp = temp(sc)
  const b = d?.qualification || {}

  return (
    <div className="flex flex-col gap-4">
      <div className="head"><div><h1>Lead 360</h1><p className="text-muted">Tudo sobre uma pessoa em uma tela.</p></div></div>
      <div className="grid grid-cols-[300px_1fr] gap-4">
        <section className="card">
          <input className="in mb-3" placeholder="Buscar por nome" value={lq} onChange={e=>setLq(e.target.value)} />
          <div className="flex flex-col gap-2">
            {leads.map((x:any) => (
              <button key={x.id} onClick={() => setSelected(x.id)} className={`lbtn flex justify-between items-center border border-line rounded-xl p-2.5 text-left ${lead?.id===x.id?'border-accent bg-accent/10':''}`}>
                <div><strong>{x.name}</strong><span className="text-muted text-xs block">{x.stage}</span></div>
                <span className="pill num">{score(x)}</span>
              </button>
            ))}
          </div>
        </section>
        <div className="flex flex-col gap-4">
          {d && (
            <>
              <section className="card flex gap-4 items-center">
                <div className="ring w-16 h-16 rounded-full border-4 border-accent grid place-items-center font-display font-bold">{sc}</div>
                <div>
                  <h2>{d.name}</h2>
                  <p className="text-muted text-sm">{d.phone} · {d.email}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`pill ${tp[1]}`}>{tp[0]}</span>
                    <span className="pill">{d.stage}</span>
                    {d.no_show_count > 0 && <span className="pill hot">{d.no_show_count} no-show</span>}
                  </div>
                </div>
              </section>
              <div className="grid grid-cols-2 gap-4">
                <section className="card">
                  <h3 className="mb-2">Qualificação BANT</h3>
                  <p className="text-muted text-xs mb-3">20 pontos por critério, mais até 20 por engajamento.</p>
                  <div className="flex flex-col gap-2">
                    {[['budget','Budget: tem verba'],['authority','Authority: decide sozinho'],['need','Need: dor clara e urgente'],['timing','Timing: prazo definido']].map(([k,label]) => (
                      <button key={k} onClick={() => bant.mutate({ key: k, val: !b[k] })} className={`tog flex items-center gap-2 border border-line rounded-xl p-2.5 text-left ${b[k]?'border-accent bg-accent/10':''}`}>
                        <span className={`bx w-4 h-4 rounded border-2 ${b[k]?'bg-accent border-accent':''}`}></span>
                        {label}
                      </button>
                    ))}
                  </div>
                </section>
                <section className="card">
                  <h3 className="mb-2">Descrição pessoal</h3>
                  <p className="text-sm whitespace-pre-wrap">{d.description || 'Sem descrição.'}</p>
                  <h3 className="mt-4 mb-2">Próxima call</h3>
                  <p>{d.call_at ? new Date(d.call_at).toLocaleString('pt-BR') : 'Nenhuma marcada'}</p>
                </section>
              </div>
              {d.sale && (
                <section className="card">
                  <div className="flex justify-between items-center mb-2"><h2>Venda</h2><button className="btn sm" onClick={()=>setSaleTarget({lead:{id:d.id,name:d.name}, sale:d.sale})}>Editar venda</button></div>
                  <p className="text-muted text-sm mb-3">{d.sale.operation?.name} · {d.sale.commission_percent}% · fechada em {d.sale.closed_at?.slice(0,10)}</p>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="card bg-bg"><span className="eyebrow text-xs">Faturamento</span><strong className="num block mt-1">{((d.sale.payments||[]).reduce((a:any,p:any)=>a+p.amount_cents,0)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></div>
                    <div className="card bg-bg"><span className="eyebrow text-xs">Caixa líquido</span><strong className="num block mt-1 text-accent-text">{(((d.sale.payments||[]).filter((p:any)=>['pix','card'].includes(p.method)&&p.status==='paid').reduce((a:any,p:any)=>a+p.amount_cents-(p.method==='card'?p.gateway_fee_cents:0),0))/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></div>
                    <div className="card bg-bg"><span className="eyebrow text-xs">A receber</span><strong className="num block mt-1">{(((d.sale.payments||[]).filter((p:any)=>['pix','card'].includes(p.method)&&p.status==='pending').reduce((a:any,p:any)=>a+p.amount_cents,0))/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></div>
                    <div className="card bg-bg"><span className="eyebrow text-xs">Comissão</span><strong className="num block mt-1">{(comissaoCents(d.sale.payments, d.sale.commission_percent)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong></div>
                  </div>
                  <h3 className="mt-4 mb-1">Descrição da venda</h3>
                  <p className="text-sm whitespace-pre-wrap">{d.sale.description || 'Sem descrição.'}</p>
                </section>
              )}
              <section className="card">
                <h3 className="mb-3">Linha do tempo</h3>
                <form onSubmit={(e) => { e.preventDefault(); const v = (document.getElementById('nt') as HTMLInputElement).value.trim(); if (v) { note.mutate(v); (document.getElementById('nt') as HTMLInputElement).value = '' } }} className="flex gap-2 mb-3">
                  <input id="nt" className="in flex-1" placeholder="Anotar contato rápido" />
                  <button className="btn primary" type="submit">Adicionar</button>
                </form>
                <ul className="flex flex-col gap-2">
                  {(d.events || []).slice().reverse().map((n: any) => (
                    <li key={n.id} className="border-l-2 border-accent pl-3">
                      <div className="text-sm">{n.payload?.note || n.type}</div>
                      <small className="text-muted text-xs">{new Date(n.created_at).toLocaleString('pt-BR')}</small>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    {saleTarget && (
      <SaleModal leadId={saleTarget.lead.id} leadName={saleTarget.lead.name} sale={saleTarget.sale} onClose={()=>setSaleTarget(null)} onSaved={()=>{ setSaleTarget(null); qc.invalidateQueries({queryKey:['lead',lead?.id]}) }} />
    )}
    </div>
  )
}
