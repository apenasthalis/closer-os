import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function Operacoes() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['operations'], queryFn: async () => (await api.get('/operations')).data })
  const ops = data || []
  const [name, setName] = useState('')
  const [pct, setPct] = useState('0')
  const create = useMutation({
    mutationFn: async () => (await api.post('/operations', { name, commission_percent: +pct })).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['operations'] }); setName(''); setPct('0') },
  })
  const update = useMutation({
    mutationFn: async ({ id, data }: any) => (await api.put(`/operations/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operations'] }),
  })
  const archive = useMutation({
    mutationFn: async (id: string) => (await api.post(`/operations/${id}/archive`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['operations'] }),
  })
  return (
    <div className="flex flex-col gap-4">
      <div className="head"><div><h1>Operações e comissão</h1><p className="text-muted">Cada operação tem o seu percentual.</p></div></div>
      <div className="grid grid-cols-2 gap-4">
        <section className="card">
          <h2 className="mb-3">Operações</h2>
          {ops.length === 0 && <p className="text-muted mb-3">Nenhuma operação cadastrada.</p>}
          <div className="flex flex-col gap-3">
            {ops.map((o:any) => (
              <div key={o.id} className="row flex items-center gap-3 border-t border-line py-3">
                <div className="grow flex-1 min-w-[180px]">
                  <input className="in" defaultValue={o.name} onBlur={e => { if (e.target.value.trim() && e.target.value !== o.name) update.mutate({ id: o.id, data: { name: e.target.value } }) }} />
                  <span className="text-muted text-xs block mt-1">{o.archived_at ? 'arquivada' : 'ativa'}</span>
                </div>
                <div className="w-[110px]">
                  <label className="text-muted text-xs">Comissão %</label>
                  <input className="in num" type="number" min={0} max={100} step={0.5} defaultValue={o.commission_percent} onBlur={e => update.mutate({ id: o.id, data: { commission_percent: +e.target.value } })} />
                </div>
                <button className="btn sm" onClick={() => archive.mutate(o.id)}>{o.archived_at ? 'Reativar' : 'Arquivar'}</button>
              </div>
            ))}
          </div>
          <form onSubmit={e => { e.preventDefault(); if (name.trim()) create.mutate() }} className="filters flex gap-3 mt-4 pt-4 border-t border-line">
            <div className="field flex-1"><label className="text-muted text-sm">Nova operação</label><input className="in" value={name} onChange={e=>setName(e.target.value)} /></div>
            <div className="field w-[110px]"><label className="text-muted text-sm">Comissão %</label><input className="in num" type="number" value={pct} onChange={e=>setPct(e.target.value)} /></div>
            <button className="btn primary" type="submit">Adicionar</button>
          </form>
        </section>
        <section className="card">
          <h2 className="mb-3">Como o dinheiro é contado</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="row border-t border-line py-2"><div className="grow"><strong>Pix e cartão</strong><span className="text-muted block">Faturamento. Entram no caixa quando pagos. No cartão, desconta a taxa.</span></div></div>
            <div className="row border-t border-line py-2"><div className="grow"><strong>Boleto</strong><span className="text-muted block">Só faturamento. Sempre pago, nunca entra no caixa.</span></div></div>
            <div className="row border-t border-line py-2"><div className="grow"><strong>Comissão</strong><span className="text-muted block">Caixa líquido × percentual da operação.</span></div></div>
          </div>
        </section>
      </div>
    </div>
  )
}
