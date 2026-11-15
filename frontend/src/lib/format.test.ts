// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { STAGES, dateBR, fromCents, scoreLead, temp, toCents } from './format'

describe('money', () => {
  it('parses pt-BR formatted values into cents', () => {
    expect(toCents('1.234,56')).toBe(123456)
    expect(toCents('1200')).toBe(120000)
    expect(toCents(89.9)).toBe(8990)
    expect(toCents('')).toBe(0)
  })

  it('formats cents for editable inputs', () => {
    expect(fromCents(123456)).toBe('1234,56')
    expect(fromCents(0)).toBe('0,00')
  })
})

describe('dates', () => {
  it('keeps date-only values stable', () => {
    expect(dateBR('2026-11-15')).toBe('15/11/2026')
    expect(dateBR(null)).toBe('—')
  })
})

describe('lead score', () => {
  it('combines BANT and timeline engagement capped at 100', () => {
    expect(scoreLead({ qualification: { budget: true, authority: true, need: false, timing: false }, events: [] })).toBe(40)
    expect(scoreLead({ qualification: { budget: true, authority: true, need: true, timing: true }, events: Array(10) })).toBe(100)
  })

  it('uses 70 and 40 as temperature thresholds', () => {
    expect(temp(70)[0]).toBe('Quente')
    expect(temp(40)[0]).toBe('Morno')
    expect(temp(39)[0]).toBe('Frio')
  })
})

describe('stages', () => {
  it('keeps refund before loss and disqualified in the board', () => {
    expect(STAGES.map(([key]) => key)).toEqual([
      'lead_agendado', 'no_show', 'fup', 'remarcado', 'negociacao', 'fechado', 'reembolso', 'loss', 'desqualificado',
    ])
  })
})
