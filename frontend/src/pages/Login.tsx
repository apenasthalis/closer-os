import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, csrf } from '../lib/api'
import { useAuth } from '../stores/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const { setUser } = useAuth()
  const nav = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    const okE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!okE) { setErr('Informe um e-mail válido.'); return }
    if (password.length < 4) { setErr('Informe a senha (mínimo de 4 caracteres).'); return }
    setBusy(true)
    try {
      await csrf()
      const { data } = await api.post('/auth/login', { email, password, remember })
      setUser(data.user)
      nav('/hoje')
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'E-mail ou senha incorretos.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login" id="login">
      <section className="lg-art" aria-hidden="true">
        <div className="brand"><i>CO</i><span>Closer OS <small>PRO</small></span></div>
        <div>
          <h2>Cada call e cada real no lugar certo.</h2>
          <p>Pipeline com no-show, faturamento separado do caixa e comissão por operação, em uma tela só.</p>
        </div>
        <div className="lg-board"><div><b>Agendado</b><i className="on"></i><i></i></div><div><b>No-show</b><i className="s"></i></div><div><b>Negociação</b><i className="on"></i><i className="s"></i></div><div><b>Fechado</b><i className="on"></i></div></div>
        <div className="lg-pts"><span>Faturamento e caixa sem confusão</span><span>Comissão por operação, percentual por venda</span><span>Lead 360 com histórico e qualificação</span></div>
      </section>
      <section className="lg-form">
        <form id="lgf" noValidate onSubmit={submit}>
          <div className="lg-brand"><i style={{width:32,height:32,borderRadius:9,background:'var(--accent)',color:'var(--accent-ink)',display:'grid',placeItems:'center',fontStyle:'normal',fontSize:12}}>CO</i>Closer OS</div>
          <div><h1>Entrar</h1><p className="sub" style={{marginTop:6}}>Acesse o seu painel de vendas.</p></div>
          <div className="field"><label htmlFor="lg-email">E-mail</label><input className={`in${err && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? ' err' : ''}`} id="lg-email" type="email" autoComplete="username" placeholder="voce@empresa.com" value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div className="field"><label htmlFor="lg-pass">Senha</label><div className="pw"><input className={`in${err && password.length < 4 ? ' err' : ''}`} id="lg-pass" type={show?'text':'password'} autoComplete="current-password" placeholder="Sua senha" value={password} onChange={e=>setPassword(e.target.value)} /><button type="button" id="lg-eye" aria-label={show?'Ocultar senha':'Mostrar senha'} onClick={()=>setShow(s=>!s)}>{show?'Ocultar':'Mostrar'}</button></div></div>
          <div className="lg-row"><label><input type="checkbox" id="lg-rem" checked={remember} onChange={e=>setRemember(e.target.checked)} />Lembrar de mim</label><button type="button" className="linkb" id="lg-forgot" onClick={()=>alert('Peça ao administrador para redefinir a senha.')}>Esqueci minha senha</button></div>
          <div className="msg" id="lg-err" role="alert">{err}</div>
          <button className="btn primary" type="submit" disabled={busy}>{busy?'Entrando...':'Entrar'}</button>
          <p className="sub" style={{textAlign:'center'}}>Acesso autenticado via Laravel Sanctum.</p>
        </form>
      </section>
    </div>
  )
}
