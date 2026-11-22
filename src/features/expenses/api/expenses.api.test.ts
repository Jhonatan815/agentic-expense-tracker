import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createExpense,
  deleteExpense,
  getExpenseStorageWarning,
  listExpenses,
  resetExpenseRepository,
  setExpenseRepositoryFailure,
} from './expenses.api'

const LATENCY_MS = 250

describe('expenses.api', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetExpenseRepository()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  async function settle<T>(promise: Promise<T>): Promise<T> {
    await vi.advanceTimersByTimeAsync(LATENCY_MS)
    return promise
  }

  async function expectFailure<T>(
    promise: Promise<T>,
    message: RegExp,
  ): Promise<void> {
    const assertion = expect(promise).rejects.toThrow(message)
    await vi.advanceTimersByTimeAsync(LATENCY_MS)
    await assertion
  }

  it('devuelve un array vacío cuando no hay datos', async () => {
    expect(await settle(listExpenses())).toEqual([])
  })

  it('aplica una latencia perceptible antes de resolver', async () => {
    let resolved = false
    const pending = listExpenses().then((value) => {
      resolved = true
      return value
    })

    await vi.advanceTimersByTimeAsync(LATENCY_MS - 1)
    expect(resolved).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    expect(await pending).toEqual([])
  })

  it('recorta el concepto, asigna id y fecha y persiste en expenses.v1', async () => {
    const created = await settle(
      createExpense({
        concept: '  Café  ',
        amount: 3.5,
        category: 'Alimentación',
      }),
    )

    expect(created.concept).toBe('Café')
    expect(created.amount).toBe(3.5)
    expect(created.category).toBe('Alimentación')
    expect(created.id).toEqual(expect.any(String))
    expect(created.date).toMatch(/^\d{4}-\d{2}-\d{2}T/)

    const stored: unknown = JSON.parse(localStorage.getItem('expenses.v1') ?? 'null')
    expect(stored).toEqual([created])
    expect(await settle(listExpenses())).toEqual([created])
  })

  it('usa Otros como categoría por defecto', async () => {
    const created = await settle(createExpense({ concept: 'Libro', amount: 12 }))
    expect(created.category).toBe('Otros')
  })

  it('rechaza conceptos vacíos e importes no válidos sin persistir', async () => {
    await expectFailure(
      createExpense({ concept: '   ', amount: 3.5 }),
      /concepto/i,
    )
    await expectFailure(createExpense({ concept: 'Café', amount: 0 }), /importe/i)
    await expectFailure(createExpense({ concept: 'Café', amount: -2 }), /importe/i)
    await expectFailure(
      createExpense({ concept: 'Café', amount: Number.NaN }),
      /importe/i,
    )
    await expectFailure(
      createExpense({ concept: 'Café', amount: 1.234 }),
      /decimales/i,
    )

    expect(await settle(listExpenses())).toEqual([])
  })

  it('elimina por id y tolera un id inexistente', async () => {
    const first = await settle(createExpense({ concept: 'Café', amount: 3.5 }))
    const second = await settle(
      createExpense({ concept: 'Billete', amount: 2, category: 'Transporte' }),
    )

    await settle(deleteExpense(first.id))
    expect(await settle(listExpenses())).toEqual([second])

    await settle(deleteExpense('no-existe'))
    expect(await settle(listExpenses())).toEqual([second])
  })

  it('inyecta un fallo determinista solo en la siguiente operación', async () => {
    setExpenseRepositoryFailure(true)
    await expectFailure(
      listExpenses(),
      /No se pudo completar la operación/,
    )
    expect(await settle(listExpenses())).toEqual([])

    setExpenseRepositoryFailure(true)
    await expectFailure(
      createExpense({ concept: 'Café', amount: 3.5 }),
      /No se pudo completar la operación/,
    )
    expect(await settle(listExpenses())).toEqual([])
  })

  it('avisa cuando localStorage no está disponible', async () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('Storage bloqueado')
      })

    expect(await settle(listExpenses())).toEqual([])
    expect(getExpenseStorageWarning()).toMatch(/almacenamiento/i)
    getItem.mockRestore()
  })

  it('usa el array en memoria cuando los datos guardados son ilegibles', async () => {
    localStorage.setItem('expenses.v1', '{"no":"es un array"}')

    expect(await settle(listExpenses())).toEqual([])
    expect(getExpenseStorageWarning()).toMatch(/almacenamiento/i)
  })

  it('rechaza gastos persistidos con más de dos decimales', async () => {
    localStorage.setItem(
      'expenses.v1',
      JSON.stringify([
        {
          id: '00000000-0000-4000-8000-000000000000',
          concept: 'Café',
          amount: 1.234,
          category: 'Alimentación',
          date: '2026-11-21T10:00:00.000Z',
        },
      ]),
    )

    expect(await settle(listExpenses())).toEqual([])
    expect(getExpenseStorageWarning()).toMatch(/almacenamiento/i)
  })
})
