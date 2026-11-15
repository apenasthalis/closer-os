import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, csrf } from '../lib/api'
import { useAuth } from '../stores/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const { setUser } = useAuth()
  const nav = useNavigate()
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    try {
      await csrf()
      const { data } = await api.post('/auth/login', { email, password })
      setUser(data.user)
      nav('/hoje')
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Falha no login')
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="card w-full max-w-md flex flex-col gap-4">
        <h1 className="font-display text-2xl">Closer OS Pro</h1>
        <p className="text-muted">Entrar</p>
        <input className="in" value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail" />
        <input className="in" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Senha" />
        {err && <p className="text-crit text-sm">{err}</p>}
        <button className="btn primary" type="submit">Entrar</button>
      </form>
    </div>
  )
}
