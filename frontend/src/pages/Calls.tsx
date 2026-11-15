import { useState } from 'react'

const CHECK: [string, number][] = [
  ['Abri com contrato de tempo e objetivo da call', 10],
  ['Mapeei a situação atual do lead', 15],
  ['O lead disse a dor com as próprias palavras', 15],
  ['Quantifiquei o custo de não resolver', 15],
  ['Defini critério e prazo de decisão', 10],
  ['Apresentei a solução ligada à dor', 15],
  ['Pedi o fechamento de forma direta', 10],
  ['Combinei próximo passo com data e hora', 10],
]

export default function Calls() {
  const [c, setC] = useState<boolean[]>(Array(CHECK.length).fill(false))
  const [ratio, setRatio] = useState(40)
  const total = CHECK.reduce((a, x, i) => a + (c[i] ? x[1] : 0), 0)
  const pen = ratio >= 30 && ratio <= 50 ? 0 : ratio >= 20 && ratio <= 60 ? 5 : 10
  const final = Math.max(0, total - pen)
  const past = [62, 70, 58, 74, 66, 81, 77, final]
  const miss = CHECK.map((x, i) => ({ t: x[0], w: x[1], i })).filter(x => !c[x.i]).sort((a, b) => b.w - a.w)[0]
  const rtxt = ratio < 30 ? 'Você falou pouco. Pergunte menos e dê mais contexto.' : ratio > 50 ? 'Você falou demais. Pergunte mais e deixe o lead desenvolver.' : 'Boa proporção. O lead falou mais da metade da call.'

  return (
    <div>
      <div className="head">
        <div><h1>Scorecard de calls</h1><p>Depois de cada call, marque o que aconteceu. A nota mostra onde você perde força antes de perder a venda.</p></div>
      </div>

      <div className="grid g2">
        <section className="card">
          <div className="top"><div><h2>Call de hoje</h2><p className="sub">Descoberta</p></div></div>
          <div className="leadlist">
            {CHECK.map((x, i) => (
              <button key={i} className="tog" aria-pressed={c[i]} onClick={() => { const n = c.slice(); n[i] = !n[i]; setC(n) }}>
                <span className="bx" />{x[0]}<em>+{x[1]}</em>
              </button>
            ))}
          </div>
          <div className="field" style={{ marginTop: 16 }}>
            <label htmlFor="rt">Quanto da call você falou: <b className="num" id="rtv">{ratio}%</b></label>
            <input id="rt" type="range" min={10} max={80} value={ratio} onChange={e => setRatio(+e.target.value)} />
            <p className="sub">{rtxt} Ideal entre 30% e 50%.</p>
          </div>
        </section>

        <div className="grid" style={{ alignContent: 'start' }}>
          <section className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="ring" style={{ ['--v' as any]: final, width: 92, height: 92 }}><span>{final}</span></div>
            <div><h2>Nota {final}</h2><p className="sub">{pen ? `Descontei ${pen} pontos pela proporção de fala.` : 'Sem desconto por proporção de fala.'}</p></div>
          </section>

          <section className="card">
            <h3 style={{ marginBottom: 6 }}>Foco da próxima call</h3>
            <p>{miss ? <><strong>{miss.t}</strong><br /><span className="muted">É o critério de maior peso que ficou de fora ({miss.w} pontos).</span></> : 'Todos os critérios cumpridos. Mantenha o padrão.'}</p>
          </section>

          <section className="card">
            <h3 style={{ marginBottom: 22 }}>Últimas 8 calls</h3>
            <div className="trend">
              {past.map((v, i) => <div key={i} style={{ height: `${Math.max(4, v)}%`, ...(i === 7 ? {} : { opacity: 0.55 }) }}><span>{v}</span></div>)}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
