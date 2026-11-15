import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, csrf } from '../lib/api'
import { useAuth } from '../stores/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const { setUser } = useAuth()
  const nav = useNavigate()
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await csrf()
      const { data } = await api.post('/auth/login', { email, password })
      setUser(data.user)
      nav('/hoje')
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'E-mail ou senha incorretos.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="grid g2" style={{ width: '100%', maxWidth: 860, alignItems: 'center' }}>
        <div>
          <div className="brand" style={{ marginBottom: 18 }}><i>CO</i><span>Closer OS <small>PRO</small></span></div>
          <h1>O sistema operacional do closer.</h1>
          <p className="sub" style={{ marginTop: 10, fontSize: 14, maxWidth: '46ch' }}>Pipeline, vendas, caixa, comissão, scorecard de calls e cadência em um só lugar. Entre para continuar.</p>
          <div className="note" style={{ marginTop: 18 }}><span>Primeiro acesso? Use o usuário administrador configurado no seed.</span></div>
        </div>
        <form onSubmit={submit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><h2>Entrar</h2><p className="sub">Acesse com seu e-mail e senha.</p></div>
          <div className="field"><label>E-mail</label><input className="in" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@empresa.com" required /></div>
          <div className="field"><label>Senha</label><input className="in" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" required /></div>
          {err && <p className="msg">{err}</p>}
          <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  )
}
