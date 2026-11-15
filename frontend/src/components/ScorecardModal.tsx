import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { apiError } from '../lib/format'
import { showToast } from '../lib/toast'
import Modal from './Modal'
import Ring from './Ring'

export default function ScorecardModal({ call, onClose, onSaved }: { call: any; onClose: () => void; onSaved?: () => void }) {
  const qc = useQueryClient()
  const { data: criteria, isLoading } = useQuery({ queryKey: ['call-criteria'], queryFn: async () => (await api.get('/calls/criteria')).data })
  const [checked, setChecked] = useState<Record<string, boolean>>(call?.scorecard?.criteria ?? {})
  const [ratio, setRatio] = useState<number>(call?.scorecard?.talk_ratio ?? 42)
  const [err, setErr] = useState('')

  const result = useMemo(() => {
    let total = 0
    let missing: any = null
    for (const c of criteria || []) {
      if (checked[c.key]) total += c.weight
      else if (!missing || c.weight > missing.weight) missing = c
    }
    const penalty = ratio >= 30 && ratio <= 50 ? 0 : ratio >= 20 && ratio <= 60 ? 5 : 10
    return { score: Math.max(0, total - penalty), total, penalty, missing }
  }, [criteria, checked, ratio])

  const save = useMutation({
    mutationFn: async () => (await api.post(`/calls/${call.id}/scorecard`, { criteria: checked, talk_ratio: ratio })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calls'] })
      qc.invalidateQueries({ queryKey: ['call-stats'] })
      qc.invalidateQueries({ queryKey: ['lead'] })
      showToast('Scorecard salvo.')
      onSaved?.()
      onClose()
    },
    onError: (e: any) => setErr(apiError(e)),
  })

  return (
    <Modal
      title="Avaliar call"
      sub={`${call?.lead?.name ?? 'Sem lead'}${call?.closer?.name ? ` · ${call.closer.name}` : ''}`}
      wide
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={save.isPending} onClick={() => { setErr(''); save.mutate() }}>{save.isPending ? 'Salvando...' : 'Salvar scorecard'}</button></>}
    >
      {isLoading ? <p className="muted">Carregando critérios...</p> : (
        <div className="grid g2">
          <div>
            <div className="leadlist">
              {(criteria || []).map((c: any) => (
                <button key={c.key} className="tog" aria-pressed={Boolean(checked[c.key])} onClick={() => setChecked({ ...checked, [c.key]: !checked[c.key] })} type="button">
                  <span className="bx" />{c.label}<em>+{c.weight}</em>
                </button>
              ))}
            </div>
            <div className="field" style={{ marginTop: 16 }}>
              <label>Quanto da call o closer falou: <b className="num">{ratio}%</b></label>
              <input type="range" min={10} max={80} value={ratio} onChange={e => setRatio(Number(e.target.value))} />
              <p className="sub">{ratio < 30 ? 'Falou pouco. Dê mais contexto e conduza melhor.' : ratio > 50 ? 'Falou demais. Pergunte mais e deixe o lead desenvolver.' : 'Boa proporção. O lead falou mais da metade da call.'} Ideal entre 30% e 50%.</p>
            </div>
          </div>
          <div className="grid" style={{ alignContent: 'start' }}>
            <section className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <Ring value={result.score} size={92} label="Nota" />
              <div><h2>Nota {result.score}</h2><p className="sub">{result.penalty ? `Desconto de ${result.penalty} pontos pela proporção de fala.` : 'Sem desconto por proporção de fala.'}</p></div>
            </section>
            <section className="card">
              <h3>Foco da próxima call</h3>
              <p style={{ marginTop: 6 }}>{result.missing ? <><strong>{result.missing.label}</strong><br /><span className="sub">Maior peso não cumprido ({result.missing.weight} pontos).</span></> : 'Todos os critérios cumpridos. Mantenha o padrão.'}</p>
            </section>
            {err && <p className="msg">{err}</p>}
          </div>
        </div>
      )}
    </Modal>
  )
}
