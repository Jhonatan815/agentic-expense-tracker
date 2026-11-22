import { describe, expect, it } from 'vitest'
import type { Expense } from '../types/expense.types'
import {
  calculateExpenseSummary,
  filterExpensesByCategory,
} from './expenseCalculations'

function expense(
  id: string,
  category: Expense['category'],
  amount: number,
  date: string,
): Expense {
  return { id, concept: id, amount, category, date }
}

const expenses: Expense[] = [
  expense('a', 'Alimentación', 3.5, '2026-11-20T10:00:00.000Z'),
  expense('b', 'Transporte', 2.25, '2026-11-21T10:00:00.000Z'),
  expense('c', 'Transporte', 1.75, '2026-11-21T12:00:00.000Z'),
  expense('d', 'Ocio', 10, '2026-11-19T10:00:00.000Z'),
]

describe('filterExpensesByCategory', () => {
  it('devuelve todos los gastos y los ordena de más reciente a más antiguo', () => {
    expect(filterExpensesByCategory(expenses, 'all').map((item) => item.id)).toEqual([
      'c',
      'b',
      'a',
      'd',
    ])
  })

  it('filtra por una categoría concreta', () => {
    expect(
      filterExpensesByCategory(expenses, 'Transporte').map((item) => item.id),
    ).toEqual(['c', 'b'])
    expect(
      filterExpensesByCategory(expenses, 'Hogar'),
    ).toEqual([])
  })

  it('no modifica el array original', () => {
    const original = [...expenses]
    filterExpensesByCategory(expenses, 'all')
    expect(expenses).toEqual(original)
  })
})

describe('calculateExpenseSummary', () => {
  it('suma el total y cuenta los gastos visibles', () => {
    expect(calculateExpenseSummary(expenses)).toEqual({
      total: 17.5,
      count: 4,
    })
  })

  it('calcula el resumen solo sobre el conjunto filtrado', () => {
    const visible = filterExpensesByCategory(expenses, 'Transporte')
    expect(calculateExpenseSummary(visible)).toEqual({ total: 4, count: 2 })
  })

  it('devuelve cero para un conjunto vacío', () => {
    expect(calculateExpenseSummary([])).toEqual({ total: 0, count: 0 })
  })

  it('evita errores de coma flotante', () => {
    const decimals = [
      expense('e', 'Otros', 0.1, '2026-11-21T10:00:00.000Z'),
      expense('f', 'Otros', 0.2, '2026-11-21T11:00:00.000Z'),
    ]
    expect(calculateExpenseSummary(decimals)).toEqual({ total: 0.3, count: 2 })
  })
})
