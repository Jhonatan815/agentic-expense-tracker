import { describe, expect, it } from 'vitest'
import { formatDate } from './formatDate'

describe('formatDate', () => {
  it('convierte una fecha ISO 8601 a DD/MM/YYYY', () => {
    expect(formatDate('2026-11-21T12:00:00.000Z')).toBe('21/11/2026')
  })

  it('usa dos dígitos para día y mes', () => {
    expect(formatDate('2026-01-05T12:00:00.000Z')).toBe('05/01/2026')
  })
})
