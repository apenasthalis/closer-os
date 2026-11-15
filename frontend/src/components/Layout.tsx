import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../stores/auth'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'

const NAV = [
  { g: 'Operação', items: [
    { id: 'hoje', t: 'Hoje', to: '/hoje' },
    { id: 'faturamento', t: 'Faturamento e caixa', to: '/faturamento' },
    { id: 'pipeline', t: 'Pipeline', to: '/pipeline' },
    { id: 'lead', t: 'Lead 360', to: '/lead' },
    { id: 'cadencia', t: 'Cadência de FUP', to: '/cadencia' },
  ]},
  { g: 'Inteligência comercial', items: [
    { id: 'calls', t: 'Scorecard de calls', to: '/calls' },
    { id: 'objecoes', t: 'Banco de objeções', to: '/objecoes' },
    { id: 'perdas', t: 'Perdas e recuperação', to: '/perdas' },
    { id: 'ritmo', t: 'Metas e ritmo', to: '/ritmo' },
  ]},
  { g: 'Configurações', items: [
    { id: 'operacoes', t: 'Operações e comissão', to: '/operacoes' },
  ]},
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation()
  const { user, setUser } = useAuth()
  const nav = useNavigate()
  async function logout() {
    await api.post('/auth/logout')
    setUser(null)
    nav('/login')
  }
  return (
    <div className="app grid grid-cols-[230px_1fr] gap-7 max-w-[1280px] mx-auto p-5">
      <aside className="side sticky top-5 flex flex-col gap-4">
        <div className="brand flex items-center gap-2.5 font-display font-bold text-lg">
          <i className="w-[30px] h-[30px] rounded-lg bg-accent text-accent-ink grid place-items-center not-italic text-xs font-bold">CO</i>
          <span>Closer OS <small className="text-muted text-[10px] font-medium">PRO</small></span>
        </div>
        <nav className="nav flex flex-col gap-0.5">
          {NAV.map((g) => (
            <div key={g.g}>
              <span className="grp block mx-2.5 my-3 text-[11px] uppercase tracking-widest text-muted font-semibold">{g.g}</span>
              {g.items.map((it) => (
                <Link key={it.id} to={it.to} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium ${loc.pathname===it.to?'bg-accent text-accent-ink':'text-muted hover:text-fg hover:bg-raise'}`}>
                  {it.t}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="mt-auto">
          <div className="text-muted text-xs">{user?.name}</div>
          <button onClick={logout} className="btn btn-sm mt-2">Sair</button>
        </div>
      </aside>
      <main className="main min-w-0 flex flex-col gap-4.5">{children}</main>
    </div>
  )
}
