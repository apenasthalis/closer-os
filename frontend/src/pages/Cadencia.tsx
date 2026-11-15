import { useState } from 'react'
import { showToast } from '../lib/toast'

const CAD: Record<string, [string, [string, string][]]> = {
  poscall: ['Pós-call', [['D0', '{nome}, foi muito bom falar com você hoje. Resumindo: sua prioridade é resolver [dor] e o próximo passo é [passo]. Qualquer dúvida, me chama por aqui.'], ['D1', '{nome}, passei para ver se ficou alguma dúvida sobre o que conversamos. Consegue me dar um retorno até amanhã?'], ['D3', '{nome}, lembrei de você quando vi o resultado de um cliente com o mesmo desafio. Posso te mostrar como ele resolveu?'], ['D7', '{nome}, queria entender onde ficamos. Faz sentido seguir, ou prefere que eu encerre por aqui sem problema?']]],
  proposta: ['Proposta enviada', [['D0', '{nome}, enviei a proposta. Ela cobre [dor] com o prazo que combinamos. Me avisa quando abrir que eu tiro qualquer dúvida.'], ['D2', '{nome}, conseguiu olhar a proposta? Se preferir, explico em 10 minutos por áudio ou ligação.'], ['D4', '{nome}, algum ponto da proposta travou a decisão? Se eu souber qual é, consigo te ajudar a resolver.'], ['D8', '{nome}, vou manter sua condição até sexta. Quer que eu reserve sua vaga?']]],
  noshow: ['No-show', [['D0', '{nome}, tivemos nossa call agora e não consegui falar com você. Está tudo bem? Posso remarcar para hoje mais tarde ou amanhã.'], ['D1', '{nome}, sem problema, imprevistos acontecem. Tenho horário às [horário] e às [horário]. Qual fica melhor?'], ['D3', '{nome}, última tentativa de remarcar nossa conversa. Se ainda for importante para você, me responde com "sim".']]],
  frio: ['Lead frio', [['D0', '{nome}, tudo bem? Faz um tempo que conversamos. Como está [dor] por aí?'], ['D3', '{nome}, separei um conteúdo curto que ajuda com [dor]. Posso te enviar?'], ['D10', '{nome}, abri poucas vagas este mês. Faz sentido retomarmos nossa conversa?']]],
}

export default function Cadencia() {
  const [sit, setSit] = useState('poscall')
  const [name, setName] = useState('')
  const s = CAD[sit]

  function copy(text: string) {
    const filled = text.replace(/\{nome\}/g, name || '[nome]')
    navigator.clipboard?.writeText(filled).then(() => showToast('Copiado')).catch(() => showToast('Não foi possível copiar', 'err'))
  }

  return (
    <div>
      <div className="head">
        <div><h1>Cadência de follow-up</h1><p>Mensagens prontas por situação. Ajuste os campos entre colchetes e envie.</p></div>
      </div>
      <section className="card">
        <div className="grid g2" style={{ marginBottom: 16 }}>
          <div className="field">
            <label>Situação</label>
            <div className="seg">
              {Object.keys(CAD).map(k => <button key={k} onClick={() => setSit(k)} aria-pressed={k === sit}>{CAD[k][0]}</button>)}
            </div>
          </div>
          <div className="field">
            <label htmlFor="cn">Nome do lead</label>
            <input className="in" id="cn" value={name} onChange={e => setName(e.target.value)} placeholder="Nome para preencher as mensagens" />
          </div>
        </div>
        <div className="steps">
          {s[1].map((x, i) => (
            <div className="step" key={i}>
              <div className="d">{x[0]}</div>
              <div className="say">
                {x[1].replace(/\{nome\}/g, name || '[nome]')}
                <div style={{ marginTop: 10 }}><button className="btn" onClick={() => copy(x[1])}>Copiar</button></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
