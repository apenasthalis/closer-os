import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError, dateTimeBR, toLocalInput } from '../lib/format'
import { showToast } from '../lib/toast'

const CAD: Record<string, [string, [string, string][]]> = {
  poscall: ['Pós-call', [['D0', '{nome}, foi muito bom falar com você hoje. Resumindo: sua prioridade é resolver [dor] e o próximo passo é [passo]. Qualquer dúvida, me chama por aqui.'], ['D1', '{nome}, passei para ver se ficou alguma dúvida sobre o que conversamos. Consegue me dar um retorno até amanhã?'], ['D3', '{nome}, lembrei de você quando vi o resultado de um cliente com o mesmo desafio. Posso te mostrar como ele resolveu?'], ['D7', '{nome}, queria entender onde ficamos. Faz sentido seguir, ou prefere que eu encerre por aqui sem problema?']]],
  proposta: ['Proposta enviada', [['D0', '{nome}, enviei a proposta. Ela cobre [dor] com o prazo que combinamos. Me avisa quando abrir que eu tiro qualquer dúvida.'], ['D2', '{nome}, conseguiu olhar a proposta? Se preferir, explico em 10 minutos por áudio ou ligação.'], ['D4', '{nome}, algum ponto da proposta travou a decisão? Se eu souber qual é, consigo te ajudar a resolver.'], ['D8', '{nome}, vou manter sua condição até sexta. Quer que eu reserve sua vaga?']]],
  noshow: ['No-show', [['D0', '{nome}, tivemos nossa call agora e não consegui falar com você. Está tudo bem? Posso remarcar para hoje mais tarde ou amanhã.'], ['D1', '{nome}, sem problema, imprevistos acontecem. Tenho horário às [horário] e às [horário]. Qual fica melhor?'], ['D3', '{nome}, última tentativa de remarcar nossa conversa. Se ainda for importante para você, me responde com "sim".']]],
  frio: ['Lead frio', [['D0', '{nome}, tudo bem? Faz um tempo que conversamos. Como está [dor] por aí?'], ['D3', '{nome}, separei um conteúdo curto que ajuda com [dor]. Posso te enviar?'], ['D10', '{nome}, abri poucas vagas este mês. Faz sentido retomarmos nossa conversa?']]],
}

type FollowUpForm = {
  lead_id: string
  completed_at: string
  message: string
  had_response: 'yes' | 'no' | 'unknown'
  result: string
}

const emptyForm = (): FollowUpForm => ({
  lead_id: '',
  completed_at: toLocalInput(new Date()),
  message: '',
  had_response: 'unknown',
  result: '',
})

function responseLabel(value: boolean | null | undefined) {
  if (value === true) return <span className="pill ok">Sim</span>
  if (value === false) return <span className="pill hot">Não</span>
  return <span className="pill">Sem registro</span>
}

function LeadSearch({
  leads,
  value,
  onChange,
  id,
  placeholder,
  allowAll,
  allLabel = 'Todos os leads em loss',
}: {
  leads: any[]
  value: string
  onChange: (id: string) => void
  id: string
  placeholder: string
  allowAll?: boolean
  allLabel?: string
}) {
  const selected = leads.find((l) => String(l.id) === value)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) setQuery(selected ? selected.name : '')
  }, [selected?.id, open])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return leads
    return leads.filter((l) => `${l.name} ${l.loss_reason || ''}`.toLowerCase().includes(q))
  }, [leads, query])

  function pick(idValue: string) {
    onChange(idValue)
    const lead = leads.find((l) => String(l.id) === idValue)
    setQuery(lead ? lead.name : '')
    setOpen(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        className="in"
        id={id}
        value={open ? query : (selected ? selected.name : query)}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => { setOpen(true); setQuery('') }}
        onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); (e.target as HTMLInputElement).blur() } }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value && allowAll) onChange('') }}
      />
      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 30,
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10,
            maxHeight: 260, overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,.35)',
          }}
        >
          {allowAll && (
            <button
              type="button"
              className="lbtn"
              style={{ border: 0, borderRadius: 0, background: !value ? 'var(--accent-soft)' : 'transparent' }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick('')}
            >
              <div><strong>{allLabel}</strong></div>
            </button>
          )}
          {filtered.length ? filtered.map((l: any) => (
            <button
              key={l.id}
              type="button"
              className="lbtn"
              style={{ border: 0, borderRadius: 0, background: String(l.id) === value ? 'var(--accent-soft)' : 'transparent' }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(String(l.id))}
            >
              <div>
                <strong>{l.name}</strong>
                <span>{l.loss_reason || 'Sem motivo informado'}</span>
              </div>
            </button>
          )) : <div className="muted" style={{ padding: '10px 12px' }}>Nenhum lead encontrado.</div>}
        </div>
      )}
    </div>
  )
}

export default function Cadencia() {
  const qc = useQueryClient()
  const [sit, setSit] = useState('poscall')
  const [name, setName] = useState('')
  const [selectedLead, setSelectedLead] = useState('')
  const [form, setForm] = useState<FollowUpForm>(emptyForm())
  const [err, setErr] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const { data: lossData, isLoading: loadingLoss } = useQuery({
    queryKey: ['leads', 'loss-cadencia'],
    queryFn: async () => (await api.get('/leads', { params: { stage: 'loss', per_page: 500 } })).data,
  })
  const { data: followData, isLoading: loadingFollowUps } = useQuery({
    queryKey: ['follow-ups', 'loss-cadencia'],
    queryFn: async () => (await api.get('/follow-ups', { params: { lead_stage: 'loss', per_page: 100, sort: 'completed_at', dir: 'desc' } })).data,
  })

  const lossLeads = (lossData?.data || []) as any[]
  const followUps = (followData?.data || []) as any[]

  const filteredFollowUps = useMemo(() => {
    if (!selectedLead) return followUps
    return followUps.filter((f: any) => String(f.lead_id) === selectedLead)
  }, [followUps, selectedLead])

  const selectedLossLead = lossLeads.find((l: any) => String(l.id) === (form.lead_id || selectedLead))

  const create = useMutation({
    mutationFn: async () => {
      const payload: any = {
        lead_id: Number(form.lead_id),
        scheduled_at: form.completed_at,
        completed_at: form.completed_at,
        message: form.message.trim(),
        status: 'done',
        result: form.result.trim() || null,
        had_response: form.had_response === 'unknown' ? null : form.had_response === 'yes',
      }
      return (await api.post('/follow-ups', payload)).data
    },
    onSuccess: () => {
      showToast('Follow-up registrado.')
      setErr('')
      setForm((f) => ({ ...emptyForm(), lead_id: f.lead_id }))
      qc.invalidateQueries({ queryKey: ['follow-ups'] })
      qc.invalidateQueries({ queryKey: ['follow-summary'] })
      qc.invalidateQueries({ queryKey: ['lead'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (e: any) => setErr(apiError(e)),
  })

  const update = useMutation({
    mutationFn: async () => {
      const payload: any = {
        lead_id: Number(form.lead_id),
        scheduled_at: form.completed_at,
        completed_at: form.completed_at,
        message: form.message.trim(),
        status: 'done',
        result: form.result.trim() || null,
        had_response: form.had_response === 'unknown' ? null : form.had_response === 'yes',
      }
      return (await api.patch(`/follow-ups/${editingId}`, payload)).data
    },
    onSuccess: () => {
      showToast('Follow-up atualizado.')
      setErr('')
      setEditingId(null)
      setForm(emptyForm())
      qc.invalidateQueries({ queryKey: ['follow-ups'] })
      qc.invalidateQueries({ queryKey: ['follow-summary'] })
      qc.invalidateQueries({ queryKey: ['lead'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (e: any) => setErr(apiError(e)),
  })

  function startEdit(f: any) {
    setEditingId(f.id)
    setErr('')
    setForm({
      lead_id: String(f.lead_id || ''),
      completed_at: toLocalInput(f.completed_at || f.scheduled_at || new Date()),
      message: f.message || '',
      had_response: f.had_response === true ? 'yes' : f.had_response === false ? 'no' : 'unknown',
      result: f.result || '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setErr('')
    setForm(emptyForm())
  }

  function copy(text: string) {
    const filled = text.replace(/\{nome\}/g, name || '[nome]')
    navigator.clipboard?.writeText(filled).then(() => showToast('Copiado')).catch(() => showToast('Não foi possível copiar', 'err'))
  }

  function applyTemplateMessage(text: string) {
    const leadName = selectedLossLead?.name?.split(' ')[0] || name || '[nome]'
    setForm((f) => ({ ...f, message: text.replace(/\{nome\}/g, leadName) }))
  }

  const s = CAD[sit]

  return (
    <div>
      <div className="head">
        <div>
          <h1>Cadência de follow-up</h1>
          <p>Acompanhe os leads em loss, registre cada contato feito e controle quem respondeu.</p>
        </div>
      </div>

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="top">
          <div>
            <h2>Leads em Loss</h2>
            <p className="sub">Selecione um lead em loss para registrar e acompanhar os follow-ups.</p>
          </div>
        </div>

        <div className="grid g2" style={{ marginBottom: 16 }}>
          <div className="field">
            <label htmlFor="loss-lead">Lead em loss</label>
            <LeadSearch
              id="loss-lead"
              leads={lossLeads}
              value={selectedLead}
              allowAll
              placeholder="Digite para buscar um lead em loss"
              onChange={(id) => {
                setSelectedLead(id)
                setForm((f) => ({ ...f, lead_id: id || f.lead_id }))
              }}
            />
          </div>
          <div className="field">
            <label>Resumo</label>
            <div className="opts">
              <span className="pill">{lossLeads.length} lead(s) em loss</span>
              <span className="pill">{filteredFollowUps.length} follow-up(s)</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--bg)', marginBottom: 16 }}>
          <h3 style={{ marginBottom: 12 }}>{editingId ? 'Editar follow-up' : 'Registrar follow-up'}</h3>
          <div className="grid g3">
            <div className="field">
              <label htmlFor="fup-lead">Lead</label>
              <LeadSearch
                id="fup-lead"
                leads={lossLeads}
                value={form.lead_id}
                placeholder="Digite para buscar um lead em loss"
                onChange={(id) => setForm({ ...form, lead_id: id })}
              />
            </div>
            <div className="field">
              <label htmlFor="fup-date">Data do follow-up</label>
              <input className="in" id="fup-date" type="datetime-local" value={form.completed_at} onChange={(e) => setForm({ ...form, completed_at: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="fup-response">Teve resposta?</label>
              <select className="in" id="fup-response" value={form.had_response} onChange={(e) => setForm({ ...form, had_response: e.target.value as FollowUpForm['had_response'] })}>
                <option value="unknown">Sem registro</option>
                <option value="yes">Sim</option>
                <option value="no">Não</option>
              </select>
            </div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="fup-message">Mensagem enviada</label>
            <textarea className="in" id="fup-message" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Qual mensagem foi enviada no follow-up?" />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="fup-result">Observação / resultado</label>
            <input className="in" id="fup-result" value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder="Ex.: pediu retorno na próxima semana" />
          </div>
          {err && <p className="msg" style={{ marginTop: 10 }}>{err}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn primary"
              disabled={!form.lead_id || !form.completed_at || !form.message.trim() || create.isPending || update.isPending}
              onClick={() => { setErr(''); editingId ? update.mutate() : create.mutate() }}
            >
              {(create.isPending || update.isPending) ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Registrar follow-up'}
            </button>
            {editingId && <button className="btn" onClick={cancelEdit}>Cancelar edição</button>}
            {selectedLossLead && (
              <span className="muted" style={{ alignSelf: 'center' }}>
                Lead selecionado: <strong>{selectedLossLead.name}</strong>{selectedLossLead.loss_reason ? ` · ${selectedLossLead.loss_reason}` : ''}
              </span>
            )}
          </div>
        </div>

        <div className="top">
          <div>
            <h3>Acompanhamento</h3>
            <p className="sub">Data do follow-up, mensagem enviada e se houve resposta.</p>
          </div>
        </div>
        <table className="tbl" style={{ width: '100%', minWidth: 'max(700px, 100%)' }}>
          <thead>
            <tr>
              <th>Lead</th>
              <th>Data do follow-up</th>
              <th>Mensagem</th>
              <th>Teve resposta?</th>
              <th>Resultado</th>
              <th style={{ width: 96 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loadingLoss || loadingFollowUps ? (
              <tr><td colSpan={6} className="muted">Carregando...</td></tr>
            ) : filteredFollowUps.length ? filteredFollowUps.map((f: any) => (
              <tr key={f.id} style={editingId === f.id ? { background: 'var(--accent-soft)' } : undefined}>
                <td>
                  <strong>{f.lead?.name || '—'}</strong>
                  {f.lead?.loss_reason ? <div className="muted" style={{ fontSize: 12 }}>{f.lead.loss_reason}</div> : null}
                </td>
                <td>{f.completed_at ? dateTimeBR(f.completed_at) : f.scheduled_at ? dateTimeBR(f.scheduled_at) : '—'}</td>
                <td style={{ whiteSpace: 'pre-wrap' }}>{f.message || '—'}</td>
                <td>{responseLabel(f.had_response)}</td>
                <td>{f.result || '—'}</td>
                <td><button className="btn sm" onClick={() => startEdit(f)}>Editar</button></td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="muted">Nenhum follow-up registrado para os leads em loss{selectedLead ? ' selecionado' : ''}.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card">
        <div className="top">
          <div>
            <h2>Modelos de mensagem</h2>
            <p className="sub">Use um modelo como ponto de partida e registre o contato no acompanhamento acima.</p>
          </div>
        </div>
        <div className="grid g2" style={{ marginBottom: 16 }}>
          <div className="field">
            <label>Situação</label>
            <div className="seg">
              {Object.keys(CAD).map((k) => <button key={k} onClick={() => setSit(k)} aria-pressed={k === sit}>{CAD[k][0]}</button>)}
            </div>
          </div>
          <div className="field">
            <label htmlFor="cn">Nome do lead</label>
            <input className="in" id="cn" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome para preencher as mensagens" />
          </div>
        </div>
        <div className="steps">
          {s[1].map((x, i) => (
            <div className="step" key={i}>
              <div className="d">{x[0]}</div>
              <div className="say">
                {x[1].replace(/\{nome\}/g, name || selectedLossLead?.name?.split(' ')[0] || '[nome]')}
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn" onClick={() => copy(x[1])}>Copiar</button>
                  <button className="btn" onClick={() => applyTemplateMessage(x[1])} disabled={!form.lead_id && !selectedLead}>Usar no registro</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!form.lead_id && !selectedLead && <p className="muted" style={{ marginTop: 12 }}>Selecione um lead em loss para usar um modelo direto no registro.</p>}
      </section>
    </div>
  )
}
