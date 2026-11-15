import { useState } from 'react'
import { CAD } from '../lib/cadencia'

export default function Cadencia() {
  const [sit, setSit] = useState('poscall')
  const [name, setName] = useState('')
  const s = CAD[sit]
  function copy(t: string) { navigator.clipboard.writeText(t); alert('Copiado') }
  return (
    <div className="flex flex-col gap-4">
      <div className="head"><div><h1>Cadência de follow-up</h1><p className="text-muted">Mensagens prontas por situação.</p></div></div>
      <section className="card">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-muted text-sm">Situação</label>
            <div className="seg flex gap-2 flex-wrap mt-1">
              {Object.keys(CAD).map(k => (
                <button key={k} onClick={() => setSit(k)} className={`px-3 py-1.5 rounded-full border ${sit===k?'bg-accent text-accent-ink border-accent':'border-line text-muted'}`}>{CAD[k][0]}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-muted text-sm">Nome do lead</label>
            <input className="in mt-1" value={name} onChange={e=>setName(e.target.value)} placeholder="Nome" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {s[1].map((x: any, i: number) => (
            <div key={i} className="step flex gap-3">
              <div className="font-display font-bold text-accent-text pt-3 w-14">{x[0]}</div>
              <div className="say bg-bg border border-line rounded-xl p-3 flex-1 whitespace-pre-wrap">
                {x[1].replace(/\{nome\}/g, name || '[nome]')}
                <div className="mt-2"><button className="btn" onClick={() => copy(x[1].replace(/\{nome\}/g, name || '[nome]'))}>Copiar</button></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
