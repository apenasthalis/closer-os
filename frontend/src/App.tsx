import { Routes, Route, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from './lib/api'
import { useAuth } from './stores/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Hoje from './pages/Hoje'
import Faturamento from './pages/Faturamento'
import Pipeline from './pages/Pipeline'
import Lead360 from './pages/Lead360'
import Cadencia from './pages/Cadencia'
import Calls from './pages/Calls'
import Objecoes from './pages/Objecoes'
import Perdas from './pages/Perdas'
import Ritmo from './pages/Ritmo'
import Operacoes from './pages/Operacoes'
import Admin from './pages/Admin'
import Prompt from './pages/Prompt'

export default function App() {
  const { user, setUser } = useAuth()
  const { isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/me')
      setUser(data.user)
      return data.user
    },
    retry: false,
    enabled: !user,
  })
  if (isLoading && !user) return <div style={{ padding: 32 }} className="muted">Carregando...</div>
  if (!user) return <Login />
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/hoje" replace />} />
        <Route path="/hoje" element={<Hoje />} />
        <Route path="/faturamento" element={<Faturamento />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/lead" element={<Lead360 />} />
        <Route path="/lead/:id" element={<Lead360 />} />
        <Route path="/cadencia" element={<Cadencia />} />
        <Route path="/calls" element={<Calls />} />
        <Route path="/objecoes" element={<Objecoes />} />
        <Route path="/perdas" element={<Perdas />} />
        <Route path="/ritmo" element={<Ritmo />} />
        <Route path="/operacoes" element={<Operacoes />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/prompt" element={<Prompt />} />
        <Route path="*" element={<Navigate to="/hoje" replace />} />
      </Routes>
    </Layout>
  )
}
