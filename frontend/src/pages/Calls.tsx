import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { dateTimeBR } from '../lib/format'

export default function Calls() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const { data, isLoading, error } = useQuery({
    queryKey: ['call-stats', from, to],
    queryFn: async () => (await api.get('/calls/stats', { params: { from: from || undefined, to: to || undefined } })).data,
  })

  const worst = useMemo(() => {
    const list = (data?.by_criterion || []).filter((c: any) => c.total > 0)
    if (!list.length) return null
    return [...list].sort((a: any, b: any) => b.fails - a.fails || a.percent - b.percent)[0]
  }, [data])

  const failedCalls = useMemo(() => {
    if (!worst) return []
    return (data?.calls || []).filter((c: any) => c.criteria && c.criteria[worst.key] === false)
  }, [data, worst])

  return (
    <div>
      <div className="head">
        <div><h1>Scorecard de calls</h1><p>Média do dia e da semana, critério que você mais deixa de cumprir e as calls do período.</p></div>
      </div>

      <section className="card">
        <div className="filters">
          <div className="field"><label htmlFor="cf">De</label><input className="in" type="date" id="cf" value={from} onChange={e => setFrom(e.target.value)} /></div>
          <div className="field"><label htmlFor="ct">Até</label><input className="in" type="date" id="ct" value={to} onChange={e => setTo(e.target.value)} /></div>
          {(from || to) && <button className="btn" onClick={() => { setFrom(''); setTo('') }}>Limpar período</button>}
        </div>
      </section>

      {isLoading && <p className="muted">Carregando scorecards...</p>}
      {error && <div className="alert"><h3>Erro ao carregar</h3><p className="sub">Não foi possível carregar os dados.</p></div>}

      {data && <>
        <div className="kgrid">
          <section className="card kpi"><div className="eyebrow">Média do dia</div><strong className="num">{data.average_today ?? '—'}</strong><span>calls avaliadas hoje</span></section>
          <section className="card kpi"><div className="eyebrow">Média da semana</div><strong className="num">{data.average_week ?? '—'}</strong><span>calls avaliadas na semana</span></section>
          <section className="card kpi"><div className="eyebrow">Média do período</div><strong className="num">{data.average_score || 0}</strong><span>{data.evaluated || 0} calls avaliadas</span></section>
        </div>

        <div className="grid g2">
          <section className="card">
            <div className="top"><div><h2>Critério que você mais deixa de cumprir</h2><p className="sub">{worst ? `${worst.fails} falha(s) em ${worst.total} call(s) · ${worst.percent}% de cumprimento` : 'Sem avaliações no período.'}</p></div></div>
            {worst ? <>
              <p style={{ marginBottom: 14 }}><strong>{worst.label}</strong> <span className="muted">({worst.points} pontos)</span></p>
              <h3 style={{ marginBottom: 10 }}>Calls em que este critério falhou</h3>
              <div className="list">
                {failedCalls.length ? failedCalls.map((c: any) => (
                  <div className="row" key={c.id}>
                    <div className="grow"><strong>{c.lead_name || 'Sem lead'}</strong><span>{dateTimeBR(c.call_at)} · nota {c.score} · falou {c.talk_ratio}%</span></div>
                  </div>
                )) : <p className="muted">Nenhuma falha registrada para este critério no período.</p>}
              </div>
            </> : <p className="muted">Avalie calls no pipeline para ver o critério com mais falhas.</p>}
          </section>

          <section className="card">
            <div className="top"><div><h2>Calls do período</h2><p className="sub">Todas as calls avaliadas no filtro selecionado.</p></div></div>
            <div className="list">
              {(data.calls || []).length ? (data.calls || []).map((c: any) => (
                <div className="row" key={c.id}>
                  <div className="grow"><strong>{c.lead_name || 'Sem lead'}</strong><span>{dateTimeBR(c.call_at)}{c.closer ? ` · ${c.closer}` : ''}</span></div>
                  <span className="pill ok num">Nota {c.score}</span>
                </div>
              )) : <p className="muted">Nenhuma call avaliada neste período.</p>}
            </div>
          </section>
        </div>
      </>}
    </div>
  )
}
