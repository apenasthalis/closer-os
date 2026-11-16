import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, brl, dateBR, dateTimeBR, scoreLead, STAGE_LABEL, temp } from '../lib/format'
import { showToast } from '../lib/toast'
import LeadModal from '../components/LeadModal'
import SaleModal from '../components/SaleModal'

const BANT = ['Budget: tem verba', 'Authority: decide sozinho', 'Need: dor clara e urgente', 'Timing: prazo definido']
const BANT_KEYS = ['budget', 'authority', 'need', 'timing'] as const

function saleCalc(payments: any[]) {
  let fat = 0, caixa = 0, aberto = 0
  for (const p of payments || []) {
    fat += p.amount_cents || 0
    const cash = p.method === 'pix' || p.method === 'card'
    if (cash && p.status === 'paid') caixa += (p.amount_cents || 0) - (p.method === 'card' ? (p.gateway_fee_cents || 0) : 0)
    else if (cash) aberto += p.amount_cents || 0
  }
  return { fat, caixa, aberto }
}

export default function Lead360() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const leadId = Number(id)
  const [lq, setLq] = useState('')
  const [note, setNote] = useState('')
  const [editing, setEditing] = useState(false)
  const [saleOpen, setSaleOpen] = useState(false)

  const { data: listData } = useQuery({ queryKey: ['leads', 'picker'], queryFn: async () => (await api.get('/leads', { params: { per_page: 100 } })).data })
  const leads = (listData?.data || []) as any[]
  const filtered = leads.filter(l => !lq || (l.name || '').toLowerCase().includes(lq.toLowerCase()))

  useEffect(() => {
    if (!leadId && leads.length) navigate(`/lead/${leads[0].id}`, { replace: true })
  }, [leadId, leads.length, navigate])

  const { data: lead, isLoading, error } = useQuery({ queryKey: ['lead', leadId], queryFn: async () => (await api.get(`/leads/${leadId}`)).data, enabled: Boolean(leadId) })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['lead', leadId] })
    qc.invalidateQueries({ queryKey: ['leads', 'picker'] })
    qc.invalidateQueries({ queryKey: ['pipeline'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const bantMut = useMutation({
    mutationFn: async ({ key, value }: any) => (await api.patch(`/leads/${leadId}/qualification`, { [key]: value })).data,
    onSuccess: invalidate,
    onError: (e: any) => showToast(apiError(e), 'err'),
  })
  const addNote = useMutation({
    mutationFn: async () => (await api.post(`/leads/${leadId}/notes`, { note })).data,
    onSuccess: () => { setNote(''); showToast('Nota registrada.'); invalidate() },
    onError: (e: any) => showToast(apiError(e), 'err'),
  })

  const [engDraft, setEngDraft] = useState<number | null>(null)
  useEffect(() => { setEngDraft(null) }, [leadId, lead?.qualification?.engagement])

  const selectedDisplayScore = (() => {
    if (!lead || lead.id !== leadId) return null
    const b = lead.qualification || {}
    const bantPts = BANT_KEYS.filter(k => b[k]).length * 20
    const autoEngPts = Math.min(20, Math.max(0, ((lead.events?.length ?? 0) - 1) * 4))
    const autoEngPct = Math.round((autoEngPts / 20) * 100)
    const storedEng = b.engagement
    const baseEngPct = storedEng !== undefined && storedEng !== null && storedEng !== '' ? Math.max(0, Math.min(100, Number(storedEng))) : autoEngPct
    const engPct = engDraft !== null ? engDraft : baseEngPct
    return Math.min(100, bantPts + Math.round((engPct / 100) * 20))
  })()

  return (
    <div className="page-stack l360">
      <div className="head">
        <div><h1>Lead 360</h1><p>Tudo sobre uma pessoa em uma tela: qualificação, descrição, venda e histórico.</p></div>
      </div>
      <div className="grid gsplit l360-grid">
        <section className="card l360-list">
          <h3 style={{ marginBottom: 10 }}>Leads</h3>
          <input className="in" value={lq} onChange={e => setLq(e.target.value)} placeholder="Buscar por nome" aria-label="Buscar lead por nome" style={{ marginBottom: 10 }} />
          <div className="leadlist">
            {filtered.length ? filtered.map(x => {
              const sc = x.id === leadId && selectedDisplayScore !== null ? selectedDisplayScore : scoreLead(x)
              return <button className="lbtn" key={x.id} onClick={() => navigate(`/lead/${x.id}`)} aria-pressed={x.id === leadId} style={{justifyContent:'flex-start'}}>
                <span className="num" title={`Score ${sc}`} style={{width:34,height:34,borderRadius:'50%',display:'grid',placeItems:'center',fontSize:12,fontWeight:700,flex:'none',background:`conic-gradient(var(--accent) ${sc*3.6}deg, var(--raise) 0deg)`}}><span style={{width:26,height:26,borderRadius:'50%',background:'var(--surface)',display:'grid',placeItems:'center'}}>{sc}</span></span>
                <div><strong>{x.name}</strong><span>{STAGE_LABEL[x.stage] || x.stage}</span></div>
              </button>
            }) : <p className="muted">Nenhum lead encontrado.</p>}
          </div>
        </section>

        {!leadId ? <section className="card"><p className="muted">Selecione um lead na lista.</p></section>
        : isLoading ? <section className="card"><p className="muted">Carregando lead...</p></section>
        : error ? <section className="card"><div className="alert"><h3>Erro ao carregar lead</h3><p className="sub">{apiError(error)}</p></div></section>
        : !lead ? <section className="card"><p className="muted">Lead não encontrado.</p></section>
        : (() => {
          const b = lead.qualification || {}
          const s = lead.sale
          const c = s ? saleCalc(s.payments || []) : null
          const com = s && c ? Math.round(c.caixa * Number(s.commission_percent || 0) / 100) : 0
          const events = [...(lead.events || [])].reverse()
          const bantCount = BANT_KEYS.filter(k => b[k]).length
          const bantPts = bantCount * 20
          const autoEngPts = Math.min(20, Math.max(0, ((lead.events?.length ?? 0) - 1) * 4))
          const autoEngPct = Math.round((autoEngPts / 20) * 100)
          const storedEng = b.engagement
          const baseEngPct = storedEng !== undefined && storedEng !== null && storedEng !== '' ? Math.max(0, Math.min(100, Number(storedEng))) : autoEngPct
          const engPct = engDraft !== null ? engDraft : baseEngPct
          const engPts = Math.round((engPct / 100) * 20)
          const displayScore = Math.min(100, bantPts + engPts)
          const [dLabel, dCls] = temp(displayScore)
          const days = lead.stage_changed_at ? Math.max(0, Math.floor((Date.now() - new Date(lead.stage_changed_at).getTime()) / 86400000)) : 0
          const open = !['fechado','loss','desqualificado','reembolso'].includes(lead.stage)
          return <div className="grid l360-detail" style={{ minWidth: 0 }}>
            <section className="card">
              <div className="top" style={{ marginBottom: 0 }}>
                <div>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className="num" title={`Score ${displayScore}`} style={{width:38,height:38,borderRadius:'50%',display:'inline-grid',placeItems:'center',fontSize:13,fontWeight:700,background:`conic-gradient(var(--accent) ${displayScore*3.6}deg, var(--raise) 0deg)`,flex:'none'}}><span style={{width:30,height:30,borderRadius:'50%',background:'var(--surface)',display:'grid',placeItems:'center'}}>{displayScore}</span></span>
                    {lead.name}
                  </h2>
                  <p className="sub">{lead.phone || 'Sem telefone'} · {lead.email || 'Sem e-mail'}</p>
                  <div className="opts" style={{ marginTop: 8 }}>
                    <span className={`pill ${dCls}`}>{dLabel}</span>
                    <span className="pill">{STAGE_LABEL[lead.stage] || lead.stage}</span>
                    {open && <span className="pill num">{days} dias na etapa</span>}
                    {lead.no_show_count ? <span className="pill hot">{lead.no_show_count} no-show</span> : null}
                  </div>
                </div>
                <button className="btn" onClick={() => setEditing(true)}>Editar lead</button>
              </div>
              <div style={{ marginTop: 14 }}>
                <div className="card" style={{ background: 'var(--bg)', padding: 12 }}>
                  <span className="eyebrow">Engajamento</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                    <strong className="num" style={{ fontSize: 22 }}>{engPct}%</strong>
                    <span className="sub">{engPts} de 20 pts</span>
                  </div>
                  <input className="in" type="range" min={0} max={100} value={engPct} onChange={e => setEngDraft(Number(e.target.value))} onMouseUp={() => bantMut.mutate({ engagement: engPct })} onTouchEnd={() => bantMut.mutate({ engagement: engPct })} style={{ marginTop: 8, padding: 0, border: 0, background: 'transparent' }} aria-label="Engajamento" />
                  <div className="bar" style={{ marginTop: 6 }}><i style={{ width: `${engPct}%` }} /></div>
                  <p className="sub" style={{ marginTop: 4 }}>Ajuste de 0 a 100% (conta nos 20 pts finais do score).</p>
                </div>
              </div>
            </section>

            <div className="grid g2">
              <section className="card">
                <h3 style={{ marginBottom: 4 }}>Qualificação BANT</h3>
                <p className="sub" style={{ marginBottom: 12 }}>20 pontos por critério (80 pts) e engajamento até 20 pts.</p>
                <div className="leadlist">
                  {BANT.map((n, i) => (
                    <button key={i} className="tog" aria-pressed={Boolean(b[BANT_KEYS[i]])} onClick={() => bantMut.mutate({ key: BANT_KEYS[i], value: !b[BANT_KEYS[i]] })}>
                      <span className="bx" />{n}
                    </button>
                  ))}
                </div>
              </section>
              <section className="card">
                <h3 style={{ marginBottom: 6 }}>Descrição pessoal</h3>
                <p className="say" style={{ marginBottom: 14 }}>{lead.description ? lead.description : <span className="muted">Sem descrição. Use Editar lead para adicionar.</span>}</p>
                <h3 style={{ marginBottom: 6 }}>Próxima call</h3>
                <p>{lead.call_at ? <strong>{dateTimeBR(lead.call_at)}</strong> : <span className="pill warm">Nenhuma marcada</span>}</p>
              </section>
            </div>

            {s && c && <section className="card">
              <div className="top"><div><h2>Venda</h2><p className="sub">{s.operation?.name || 'Operação'} · comissão de {Number(s.commission_percent || 0)}% · fechada em {dateBR(String(s.closed_at || '').slice(0,10))}</p></div><button className="btn" onClick={() => setSaleOpen(true)}>Editar venda</button></div>
              <div className="tot" style={{ marginBottom: 12 }}>
                <div className="card"><span className="eyebrow">Faturamento</span><strong className="num">{brl(c.fat)}</strong></div>
                <div className="card cx"><span className="eyebrow">Caixa líquido</span><strong className="num">{brl(c.caixa)}</strong></div>
                <div className="card"><span className="eyebrow">A receber</span><strong className="num">{brl(c.aberto)}</strong></div>
                <div className="card"><span className="eyebrow">Comissão</span><strong className="num">{brl(com)}</strong></div>
              </div>
              <h3 style={{ marginBottom: 6 }}>Descrição da venda</h3>
              <p className="say">{s.description ? s.description : <span className="muted">Sem descrição da venda.</span>}</p>
            </section>}

            <section className="card">
              <div className="top"><h3>Linha do tempo</h3></div>
              <form onSubmit={e => { e.preventDefault(); if (note.trim()) addNote.mutate() }} style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <input className="in" style={{ flex: 1, minWidth: 180 }} value={note} onChange={e => setNote(e.target.value)} placeholder="Anotar contato rápido" aria-label="Anotar contato rápido" />
                <button className="btn primary" type="submit" disabled={!note.trim() || addNote.isPending}>Adicionar</button>
              </form>
              <ul className="tl">
                {events.length ? events.map((ev: any) => (
                  <li key={ev.id}><div>{ev.type === 'note' ? (ev.payload?.note || 'Nota') : ev.type === 'stage_changed' ? `${STAGE_LABEL[ev.from_stage] || ev.from_stage || ''} → ${STAGE_LABEL[ev.to_stage] || ev.to_stage || ''}` : ev.type === 'sale_saved' ? 'Venda registrada' : ev.type === 'call_scheduled' ? `Call marcada para ${dateTimeBR(ev.payload?.call_at)}` : ev.type === 'created' ? 'Lead criado' : ev.type}<small>{dateTimeBR(ev.created_at)}</small></div></li>
                )) : <li><div><span className="muted">Sem eventos ainda.</span></div></li>}
              </ul>
            </section>

            {editing && <LeadModal lead={lead} onClose={() => setEditing(false)} onSaved={invalidate} />}
            {saleOpen && s && <SaleModal sale={s} leadName={lead.name} onClose={() => setSaleOpen(false)} onSaved={invalidate} />}
          </div>
        })()}
      </div>
    </div>
  )
}
