import promptMd from '../../../prompt.md?raw'

export default function Prompt() {
  return (
    <div className="page-stack">
      <div className="head">
        <div><h1>Prompt do produto</h1><p>Especificação original do Closer OS Pro, embarcada no build para consulta.</p></div>
      </div>
      <section className="card">
        <div className="top"><div><h2>prompt.md</h2><p className="sub">Fonte da verdade das regras de negócio.</p></div><span className="chip"><b />{promptMd.length.toLocaleString('pt-BR')} caracteres</span></div>
        <div className="prompt">{promptMd}</div>
      </section>
    </div>
  )
}
