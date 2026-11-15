import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../stores/auth'
import { api } from '../lib/api'

const NAV = [
  { g: 'Operação', items: [
    { t: 'Hoje', to: '/hoje', icon: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
    { t: 'Faturamento e caixa', to: '/faturamento', icon: 'M4 5h16v14H4zM4 10h16M8 15h3' },
    { t: 'Pipeline', to: '/pipeline', icon: 'M4 4h5v16H4zM10.5 4h5v10h-5zM17 4h3v6h-3z' },
    { t: 'Lead 360', to: '/lead', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0' },
    { t: 'Cadência de FUP', to: '/cadencia', icon: 'M4 6h16M4 12h10M4 18h7M17 12l3 2-3 2z' },
  ]},
  { g: 'Inteligência comercial', items: [
    { t: 'Scorecard de calls', to: '/calls', icon: 'M4 4h16v12H4zM8 20h8M12 16v4M8 9l2 2 4-4' },
    { t: 'Banco de objeções', to: '/objecoes', icon: 'M12 3l9 16H3zM12 9v4M12 16h.01' },
    { t: 'Perdas e recuperação', to: '/perdas', icon: 'M4 7l7 6 7-6M4 7v10h16V7' },
    { t: 'Metas e ritmo', to: '/ritmo', icon: 'M4 19V9M10 19V5M16 19v-7M22 19H2' },
  ]},
  { g: 'Configurações', items: [
    { t: 'Operações e comissão', to: '/operacoes', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V21h-4v-.08a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3v-4h.08a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3h4v.08a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.14.62.66 1.05 1.3 1.05H21v4h-.08a1.7 1.7 0 0 0-1.55 1z' },
    { t: 'Administração', to: '/admin', admin: true, icon: 'M12 3l8 4v6c0 4.5-3.4 7.3-8 8-4.6-.7-8-3.5-8-8V7zM9 12l2 2 4-4' },
  ]},
  { g: 'Documentação', items: [
    { t: 'Prompt do produto', to: '/prompt', icon: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6' },
  ]},
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation()
  const { user, setUser } = useAuth()
  async function logout() {
    try { await api.post('/auth/logout') } finally { setUser(null) }
  }
  return (
    <div className="app">
      <aside className="side">
        <Link to="/hoje" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
          <i>CO</i>
          <span>Closer OS <small>PRO</small></span>
        </Link>
        <nav className="nav" aria-label="Módulos">
          {NAV.map(group => {
            const items = group.items.filter((it: any) => !it.admin || user?.role === 'admin')
            if (!items.length) return null
            return (
              <div key={group.g}>
                <span className="grp eyebrow">{group.g}</span>
                {items.map((it: any) => (
                  <Link key={it.to} to={it.to} aria-current={loc.pathname === it.to || (it.to !== '/hoje' && loc.pathname.startsWith(it.to)) ? 'page' : undefined}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d={it.icon} /></svg>
                    <span>{it.t}</span>
                  </Link>
                ))}
              </div>
            )
          })}
        </nav>
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--line)', paddingTop: 12 }}>
          <div style={{ fontWeight: 600 }}>{user?.name}</div>
          <div className="sub" style={{ textTransform: 'capitalize' }}>{user?.role} · {user?.email}</div>
          <button className="btn sm" style={{ marginTop: 8 }} onClick={logout}>Sair</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
