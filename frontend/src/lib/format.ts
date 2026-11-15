export const brl = (cents: number | null | undefined) =>
  ((cents ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function kfmt(cents: number | null | undefined) {
  const v = (cents ?? 0) / 100
  if (Math.abs(v) >= 1000000) return `R$ ${(v / 1000000).toFixed(1).replace('.', ',')}m`
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(1).replace('.', ',')}k`
  return brl(cents)
}

export function dateOnly(value?: string | null): string | null {
  if (!value) return null
  return String(value).slice(0, 10)
}

export function dateBR(value?: string | null): string {
  if (!value) return '—'
  const raw = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.split('-').reverse().join('/')
  try {
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(raw))
  } catch {
    return raw
  }
}

export function dateTimeBR(value?: string | null): string {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return String(value)
  }
}

export function timeBR(value?: string | null): string {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch {
    return '—'
  }
}

export function toLocalInput(value?: string | Date | null): string {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

export function todayInput() {
  return toLocalInput(new Date()).slice(0, 10)
}

export function firstOfMonth() {
  return todayInput().slice(0, 8) + '01'
}

export function toCents(value: string | number): number {
  if (typeof value === 'number') return Math.round(value * 100)
  const n = parseFloat(String(value || '').replace(/\./g, '').replace(',', '.'))
  return Number.isNaN(n) ? 0 : Math.round(n * 100)
}

export function fromCents(cents?: number | null): string {
  return ((cents ?? 0) / 100).toFixed(2).replace('.', ',')
}

export const STAGES = [
  ['lead_agendado', 'Lead Agendado'],
  ['no_show', 'No-show'],
  ['fup', 'FUP'],
  ['remarcado', 'Remarcado'],
  ['negociacao', 'Negociação'],
  ['fechado', 'Fechado'],
  ['reembolso', 'Reembolso'],
  ['loss', 'Loss'],
  ['desqualificado', 'Desqualificado'],
] as const

export const STAGE_LABEL: Record<string, string> = Object.fromEntries(STAGES)

export const LOSS_REASONS = ['Preço', 'Sem tempo / timing', 'Decide com terceiro', 'Concorrente', 'Sem fit', 'Sem resposta']

export const REACTIVATE_HINT: Record<string, string> = {
  'Preço': 'Voltar com opção de entrada menor ou parcelamento maior.',
  'Sem tempo / timing': 'Retomar na data que o lead indicou, com uma pergunta curta.',
  'Decide com terceiro': 'Propor uma call de 15 minutos com quem decide.',
  'Concorrente': 'Perguntar como está a experiência e mostrar o diferencial.',
  'Sem fit': 'Não reativar. Manter como desqualificado.',
  'Sem resposta': 'Enviar a cadência de lead frio.',
}

export const PAYMENT_LABEL: Record<string, string> = { pix: 'Pix', card: 'Cartão', boleto: 'Boleto' }

export const GOAL_LABEL: Record<string, string> = {
  calls_scheduled: 'Calls agendadas',
  calls_held: 'Calls realizadas',
  sales: 'Vendas',
  revenue_cents: 'Faturamento',
  cash_cents: 'Caixa',
  commission_cents: 'Comissões',
}

export function scoreLead(lead: any): number {
  const bant = Object.values(lead?.qualification ?? {}).filter(Boolean).length * 20
  const engagement = Math.min(20, Math.max(0, ((lead?.events?.length ?? 0) - 1) * 4))
  return Math.min(100, bant + engagement)
}

export function temp(score: number): [string, string] {
  if (score >= 70) return ['Quente', 'hot']
  if (score >= 40) return ['Morno', 'warm']
  return ['Frio', 'cold']
}

export function apiError(e: any): string {
  const d = e?.response?.data
  if (typeof d?.message === 'string') return d.message
  if (d?.errors) {
    const first = Object.values(d.errors)[0]
    if (Array.isArray(first) && first[0]) return String(first[0])
  }
  return e?.message || 'Algo deu errado.'
}

export function money(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
