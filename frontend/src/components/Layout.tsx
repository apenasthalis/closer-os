import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../stores/auth'
import { api } from '../lib/api'

const NAV = [
  { g: 'Operação', items: [
    { t: 'Hoje', to: '/hoje', id: 'hoje', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
    { t: 'Faturamento e caixa', to: '/faturamento', id: 'faturamento', icon: '<path d="M12 3v18"/><path d="M16 7.5c-.8-1.2-2.3-2-4-2-2.3 0-4 1.2-4 3 0 4 8 2 8 6 0 1.8-1.7 3-4 3-1.8 0-3.3-.8-4.2-2"/>' },
    { t: 'Pipeline', to: '/pipeline', id: 'pipeline', icon: '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="6" rx="1"/>' },
    { t: 'Lead 360', to: '/lead', id: 'lead', icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>' },
    { t: 'Cadência de FUP', to: '/cadencia', id: 'cadencia', icon: '<path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/>' },
  ]},
  { g: 'Inteligência comercial', items: [
    { t: 'Scorecard de calls', to: '/calls', id: 'calls', icon: '<path d="M4 14v-2a8 8 0 0116 0v2"/><rect x="3" y="14" width="4" height="6" rx="1"/><rect x="17" y="14" width="4" height="6" rx="1"/>' },
    { t: 'Banco de objeções', to: '/objecoes', id: 'objecoes', icon: '<path d="M4 5h16v11H9l-5 4z"/>' },
    { t: 'Perdas e recuperação', to: '/perdas', id: 'perdas', icon: '<path d="M3 6l6 6 4-4 8 8"/><path d="M15 16h6v-6"/>' },
    { t: 'Metas e ritmo', to: '/ritmo', id: 'ritmo', icon: '<path d="M3 12h4l3-8 4 16 3-8h4"/>' },
  ]},
  { g: 'Configurações', items: [
    { t: 'Operações e comissão', to: '/operacoes', id: 'operacoes', icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>' },
    { t: 'Administração', to: '/admin', id: 'admin', admin: true, icon: '<path d="M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7z"/><path d="M9 12l2 2 4-4"/>' },
  ]},
  { g: 'Documentação', items: [
    { t: 'Prompt do agente', to: '/prompt', id: 'prompt', icon: '<path d="M8 6l-5 6 5 6"/><path d="M16 6l5 6-5 6"/>' },
  ]},
]

function initials(name?: string) {
  if (!name) return 'CO'
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || 'CO'
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation()
  const { user, setUser } = useAuth()
  const cur = loc.pathname.split('/')[1] || 'hoje'
  async function logout() {
    try { await api.post('/auth/logout') } finally { setUser(null) }
  }
  return (
    <div className="app" id="app">
      <aside className="side" id="side">
        <div className="brand"><i>CO</i><span>Closer OS <small>PRO</small></span></div>
        <nav className="nav" id="nav" aria-label="Módulos">
          {NAV.map(group => {
            const items = group.items.filter((it: any) => !it.admin || user?.role === 'admin')
            if (!items.length) return null
            return (
              <div key={group.g} style={{display:'contents'}}>
                <span className="eyebrow grp">{group.g}</span>
                {items.map((it: any) => (
                  <Link key={it.to} to={it.to} title={it.t} aria-current={cur === it.id ? 'page' : undefined}>
                    <svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{__html: it.icon}} />
                    <span className="lbl">{it.t}</span>
                  </Link>
                ))}
              </div>
            )
          })}
        </nav>
        <div className="sfoot">
          <span className="av" aria-hidden="true">{initials(user?.name)}</span>
          <div className="who"><b>{user?.name || 'Usuário'}</b><span style={{textTransform:'capitalize'}}>{user?.role === 'admin' ? 'Administrador' : 'Closer'}</span></div>
          <button className="btn iconb" id="logout" title="Sair" aria-label="Sair" onClick={logout}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H5v16h4"/><path d="M16 8l4 4-4 4"/><path d="M20 12H9"/></svg></button>
        </div>
      </aside>
      <div className={`content${cur === 'pipeline' ? ' pipe' : ''}`} id="content"><main className="main" id="view">{children}</main></div>
    </div>
  )
}
