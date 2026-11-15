import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, brl, dateBR, kfmt, todayInput } from '../lib/format'
import SaleModal from '../components/SaleModal'

function iso(d: Date) { return d.toISOString().slice(0,10) }
function firstOfMonth() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` }

export default function Faturamento() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo] = useState(todayInput())
  const [op, setOp] = useState('')
  const [preset, setPreset] = useState('mes')
  const [nsl, setNsl] = useState('')
  const [openSale, setOpenSale] = useState<{lead:any,sale?:any}|null>(null)

  const { data: ops } = useQuery({ queryKey: ['operations'], queryFn: async () => (await api.get('/operations')).data })
  const { data: fin, isLoading, error } = useQuery({ queryKey: ['finance', from, to, q, op], queryFn: async () => (await api.get('/metrics/finance', { params: { from, to, q: q || undefined, operation_id: op || undefined } })).data })
  const { data: closedData } = useQuery({ queryKey: ['leads','closed'], queryFn: async () => (await api.get('/leads', { params: { stage: 'fechado', per_page: 200 } })).data })

  const closed = (closedData?.data || []) as any[]
  const selected = closed.find(l => String(l.id) === String(nsl))
  const rows = (fin?.sales || []).slice().sort((a:any,b:any)=> String(a.closed_at).localeCompare(String(b.closed_at)) ? 1 : -1)

  // build last 6 months from sales in range-agnostic way? finance returns months? fallback compute from rows not ideal; show if available
  const months = (fin?.months || []) as any[]
  const mx = Math.max(1, ...months.map((x:any)=>Math.max(x.contratado||0, x.caixa||0)))
  const anyM = months.some((x:any)=> (x.contratado||x.caixa))

  const byOp = (()=>{ const m:Record<string,number>={}; for(const s of rows) m[s.operation]=(m[s.operation]||0)+(s.faturamento||0); return Object.entries(m).sort((a,b)=>b[1]-a[1]) })()

  function setPre(p:string){
    setPreset(p)
    const now=new Date()
    if(p==='mes'){ setFrom(firstOfMonth()); setTo(todayInput()) }
    else if(p==='ant'){ const d=new Date(now.getFullYear(),now.getMonth()-1,1); const e=new Date(now.getFullYear(),now.getMonth(),0); setFrom(iso(d)); setTo(iso(e)) }
    else if(p==='30'){ const d=new Date(now); d.setDate(d.getDate()-30); setFrom(iso(d)); setTo(todayInput()) }
    else if(p==='tudo'){ setFrom('2020-01-01'); setTo(todayInput()) }
  }

  return (
    <>
      <div className="head">
        <div><h1>Faturamento e caixa</h1><p>Faturamento é tudo que foi contratado. Caixa é só o que entrou por Pix e cartão, já sem a taxa do gateway.</p></div>
      </div>

      <section className="card">
        <div className="filters">
          <div className="field" style={{flex:1,minWidth:200}}><label htmlFor="fq">Buscar cliente</label><input className="in" id="fq" value={q} onChange={e=>setQ(e.target.value)} placeholder="Nome do cliente" /></div>
          <div className="field"><label htmlFor="ff">De</label><input className="in" type="date" id="ff" value={from} onChange={e=>{setFrom(e.target.value);setPreset('')}} /></div>
          <div className="field"><label htmlFor="ft">Até</label><input className="in" type="date" id="ft" value={to} onChange={e=>{setTo(e.target.value);setPreset('')}} /></div>
          <div className="field"><label htmlFor="fo">Operação</label><select className="in" id="fo" value={op} onChange={e=>setOp(e.target.value)}><option value="">Todas</option>{(ops||[]).map((o:any)=><option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
        </div>
        <div className="seg" style={{marginTop:12}}>
          {[['mes','Este mês'],['ant','Mês passado'],['30','Últimos 30 dias'],['tudo','Tudo']].map(p=><button key={p[0]} onClick={()=>setPre(p[0])} aria-pressed={preset===p[0]}>{p[1]}</button>)}
        </div>
      </section>

      {isLoading && <p className="muted">Carregando...</p>}
      {error && <div className="alert"><h3>Erro ao carregar</h3><p className="sub">{apiError(error)}</p></div>}

      {fin && <>
        <div className="kgrid">
          <section className="card kpi"><div className="eyebrow">Faturamento contratado</div><strong className="num">{brl(fin.faturamento_bruto)}</strong><span>{(fin.vendas||0)} venda(s) no período</span></section>
          <section className="card kpi"><div className="eyebrow">Caixa líquido</div><strong className="num" style={{color:'var(--accent-text)'}}>{brl(fin.caixa_liquido)}</strong><span>Pix e cartão pagos no período</span></section>
          <section className="card kpi"><div className="eyebrow">A receber</div><strong className="num" style={{color:(fin.a_receber? 'var(--warn)':'inherit')}}>{brl(fin.a_receber)}</strong><span>Pix e cartão pendentes</span></section>
          <section className="card kpi"><div className="eyebrow">Ticket médio</div><strong className="num">{brl(fin.ticket_medio)}</strong><span>faturamento / vendas</span></section>
          <section className="card kpi"><div className="eyebrow">Comissão gerada</div><strong className="num">{brl(fin.comissao_liquida ?? fin.comissao_gerada)}</strong><span>% da operação sobre o caixa líquido</span></section>
        </div>

        <div className="grid g2">
          <section className="card">
            <div className="top"><div><h2>Contratado x caixa</h2><p className="sub">Últimos 6 meses</p></div><div className="legend"><span className="c">Contratado</span><span>Caixa</span></div></div>
            {anyM ? <div className="mbars">{months.map((x:any)=>(
              <div className="mcol" key={x.month||x.label}><div className="mpair"><i className="c" style={{height:`${((x.contratado||0)/mx*100)}%`}} title={`Contratado ${brl(x.contratado)}`}></i><i className="r" style={{height:`${((x.caixa||0)/mx*100)}%`}} title={`Caixa ${brl(x.caixa)}`}></i></div><b>{kfmt(x.caixa||0)}</b><small>{x.label||''}</small></div>
            ))}</div> : <p className="muted">Registre a primeira venda para ver a evolução mês a mês.</p>}
          </section>
          <section className="card">
            <div className="top"><h2>Contratado por operação</h2></div>
            {byOp.length ? byOp.map(([name,val])=>(
              <div className="hbar solid" key={name}><span className="lab">{name}</span><span className="bar"><i style={{width:`${(val/(byOp[0][1]||1)*100)}%`}}></i></span><b className="num">{kfmt(val)}</b></div>
            )) : <p className="muted">Nenhuma venda no período.</p>}
          </section>
        </div>

        <section className="card">
          <div className="top">
            <div><h2>Vendas do período</h2><p className="sub">{rows.length} registro(s). A venda nasce no pipeline, quando o lead vai para Fechado. Aqui você abre a venda de um lead já fechado.</p></div>
            <div className="filters">
              <div className="field"><label htmlFor="nsl">Lead fechado</label>
                <select className="in" id="nsl" value={nsl} onChange={e=>setNsl(e.target.value)}>
                  <option value="">{closed.length?'Escolha um lead fechado':'Nenhum lead fechado'}</option>
                  {closed.map(l=>{ const has=l.sale; const tot=has?(l.sale.payments||[]).reduce((a:number,p:any)=>a+(p.amount_cents||0),0):0; return <option key={l.id} value={l.id}>{l.name}{has?` · ${brl(tot)}`:' · sem venda'}</option> })}
                </select>
              </div>
              <button className="btn primary" disabled={!nsl} onClick={()=>{ if(!selected) return; setOpenSale({lead:selected, sale:selected.sale||undefined}) }}>Abrir venda</button>
            </div>
          </div>
          {!rows.length ? <p className="muted">Nenhuma venda neste período. Amplie o período ou registre uma venda.</p> : (
            <div className="tbl"><table><thead><tr><th>Fechamento</th><th>Cliente</th><th className="r">Faturamento</th><th className="r">Caixa líquido</th><th className="r">A receber</th><th className="r">Comissão</th><th></th></tr></thead><tbody>
              {rows.map((s:any)=>{
                const fat=s.faturamento||0, caixa=s.caixa||0, ab=s.a_receber||0, com=s.comissao||0
                return <tr key={s.id}><td className="num">{dateBR(String(s.closed_at||'').slice(0,10))}</td><td><strong>{s.lead_name}</strong><div className="muted" style={{fontSize:'calc(var(--u)*12)'}}>{s.operation} · {Number(s.commission_percent||0)}%</div></td><td className="r">{brl(fat)}</td><td className="r">{brl(caixa)}</td><td className="r">{ab? <span className="pill warm">{brl(ab)}</span>:'—'}</td><td className="r">{brl(com)}</td><td style={{textAlign:'right',whiteSpace:'nowrap'}}><button className="btn sm" onClick={()=>setOpenSale({lead:{id:s.lead_id,name:s.lead_name}, sale:s})}>Editar</button></td></tr>
              })}
            </tbody></table></div>
          )}
        </section>
      </>}

      {openSale && <SaleModal leadId={openSale.lead?.id} leadName={openSale.lead?.name} sale={openSale.sale} onClose={()=>setOpenSale(null)} onSaved={()=>{ qc.invalidateQueries({queryKey:['finance']}); qc.invalidateQueries({queryKey:['leads']}); qc.invalidateQueries({queryKey:['pipeline']}) }} />}
    </>
  )
}
