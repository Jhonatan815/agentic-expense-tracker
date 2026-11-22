import { describe, expect, it } from 'vitest'
import { formatCurrency } from './formatCurrency'

describe('formatCurrency', () => {
  it('muestra el importe con dos decimales y el símbolo €', () => {
    expect(formatCurrency(3.5)).toBe('3,50\u00a0€')
  })

  it('muestra 0,00 € cuando el importe es cero', () => {
    expect(formatCurrency(0)).toBe('0,00\u00a0€')
  })

  it('redondea a dos decimales', () => {
    expect(formatCurrency(3.456)).toBe('3,46\u00a0€')
  })
})
