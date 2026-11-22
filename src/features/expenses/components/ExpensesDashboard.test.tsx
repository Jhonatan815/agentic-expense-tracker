import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  resetExpenseRepository,
  setExpenseRepositoryFailure,
} from '../api/expenses.api'
import type { ExpenseCategory } from '../types/expense.types'
import { ExpensesDashboard } from './ExpensesDashboard'

type User = ReturnType<typeof userEvent.setup>

const WAIT_FOR = { timeout: 3000 }

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const user = userEvent.setup()
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ExpensesDashboard />
    </QueryClientProvider>,
  )

  return { user, ...result }
}

async function waitForEmptyList() {
  expect(
    await screen.findByText(/No hay gastos registrados/i, {}, WAIT_FOR),
  ).toBeInTheDocument()
}

async function addExpense(
  user: User,
  concept: string,
  amount: string,
  category?: ExpenseCategory,
) {
  await user.type(screen.getByLabelText('Concepto'), concept)
  await user.type(screen.getByLabelText('Importe (€)'), amount)
  if (category !== undefined) {
    await user.selectOptions(screen.getByLabelText('Categoría'), category)
  }
  await user.click(screen.getByRole('button', { name: /Añadir gasto/i }))
}

function listItems() {
  return screen.getAllByRole('listitem')
}

describe('ExpensesDashboard', () => {
  beforeEach(() => {
    localStorage.clear()
    resetExpenseRepository()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ---------------------------------------------------------------- US1
  it('muestra el estado vacío con resumen a cero tras la carga inicial', async () => {
    renderDashboard()

    expect(screen.getByText('Cargando gastos…')).toBeInTheDocument()
    await waitForEmptyList()
    expect(screen.getByText(/Total:/)).toHaveTextContent('0,00')
    expect(screen.getByText(/0 movimientos/)).toBeInTheDocument()
  })

  it('registra un gasto válido y actualiza listado, fecha y resumen', async () => {
    const { user } = renderDashboard()
    await waitForEmptyList()

    await addExpense(user, 'Café', '3.50', 'Alimentación')

    const item = await screen.findByText('Café', {}, WAIT_FOR)
    const row = item.closest('li')
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).getByText(/3,50/)).toBeInTheDocument()
    expect(
      within(row as HTMLElement).getByText(/Alimentación · \d{2}\/\d{2}\/\d{4}/),
    ).toBeInTheDocument()
    expect(screen.getByText(/Total:/)).toHaveTextContent('3,50')
    expect(screen.getByText(/1 movimiento/)).toBeInTheDocument()
    expect(screen.getByLabelText('Concepto')).toHaveValue('')
    expect(screen.getByLabelText('Importe (€)')).toHaveValue('')
  })

  it('muestra el gasto nuevo en la parte superior y usa Otros por defecto', async () => {
    const { user } = renderDashboard()
    await waitForEmptyList()

    await addExpense(user, 'Café', '3.50', 'Alimentación')
    await screen.findByText('Café', {}, WAIT_FOR)
    await addExpense(user, 'Billete', '2.25')

    await waitFor(() => expect(listItems()).toHaveLength(2), WAIT_FOR)
    expect(within(listItems()[0] as HTMLElement).getByText('Billete')).toBeInTheDocument()
    expect(within(listItems()[0] as HTMLElement).getByText(/Otros ·/)).toBeInTheDocument()
    expect(screen.getByText(/Total:/)).toHaveTextContent('5,75')
    expect(screen.getByText(/2 movimientos/)).toBeInTheDocument()
  })

  it('rechaza conceptos vacíos e importes inválidos con role=alert', async () => {
    const { user } = renderDashboard()
    await waitForEmptyList()

    await user.click(screen.getByRole('button', { name: /Añadir gasto/i }))
    expect(
      screen.getByText('El concepto no puede estar vacío.'),
    ).toBeInTheDocument()
    expect(screen.getByText('El importe es obligatorio.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Concepto'), 'Café')
    await user.type(screen.getByLabelText('Importe (€)'), '0')
    await user.click(screen.getByRole('button', { name: /Añadir gasto/i }))
    expect(
      screen.getByText('El importe debe ser un número mayor que 0.'),
    ).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Importe (€)'))
    await user.type(screen.getByLabelText('Importe (€)'), '1.234')
    await user.click(screen.getByRole('button', { name: /Añadir gasto/i }))
    expect(
      screen.getByText('El importe no puede tener más de dos decimales.'),
    ).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Importe (€)'))
    await user.type(screen.getByLabelText('Importe (€)'), 'abc')
    await user.click(screen.getByRole('button', { name: /Añadir gasto/i }))
    expect(
      screen.getByText('El importe debe ser un número mayor que 0.'),
    ).toBeInTheDocument()

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getByText(/Total:/)).toHaveTextContent('0,00')
    expect(screen.getByText(/0 movimientos/)).toBeInTheDocument()
  })

  it('deshabilita el botón de registro mientras la mutación está en curso', async () => {
    const { user } = renderDashboard()
    await waitForEmptyList()

    await user.type(screen.getByLabelText('Concepto'), 'Café')
    await user.type(screen.getByLabelText('Importe (€)'), '3.50')
    await user.click(screen.getByRole('button', { name: /Añadir gasto/i }))

    expect(screen.getByRole('button', { name: /Añadir gasto/i })).toBeDisabled()
    expect(await screen.findByText('Café', {}, WAIT_FOR)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Añadir gasto/i })).toBeEnabled()
  })

  it('permite operar los controles con teclado y anuncia errores', async () => {
    const { user } = renderDashboard()
    await waitForEmptyList()

    await user.tab()
    expect(screen.getByLabelText('Concepto')).toHaveFocus()
    await user.tab()
    expect(screen.getByLabelText('Importe (€)')).toHaveFocus()
    await user.tab()
    expect(screen.getByLabelText('Categoría')).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: /Añadir gasto/i })).toHaveFocus()

    await user.keyboard('{Enter}')
    const error = await screen.findByText('El concepto no puede estar vacío.')
    expect(error).toHaveAttribute('role', 'alert')

    await user.tab()
    expect(screen.getByLabelText('Filtrar por categoría')).toHaveFocus()
  })

  // ---------------------------------------------------------------- US2
  it('filtra por categoría, restaura Todas y calcula el resumen sobre los visibles', async () => {
    const { user } = renderDashboard()
    await waitForEmptyList()

    await addExpense(user, 'Café', '3.50', 'Alimentación')
    await screen.findByText('Café', {}, WAIT_FOR)
    await addExpense(user, 'Billete', '2.25', 'Transporte')
    await screen.findByText('Billete', {}, WAIT_FOR)
    await addExpense(user, 'Cine', '10', 'Ocio')
    await screen.findByText('Cine', {}, WAIT_FOR)

    await user.selectOptions(screen.getByLabelText('Filtrar por categoría'), 'Transporte')
    await waitFor(() => expect(listItems()).toHaveLength(1), WAIT_FOR)
    expect(within(listItems()[0] as HTMLElement).getByText('Billete')).toBeInTheDocument()
    expect(screen.getByText(/Total:/)).toHaveTextContent('2,25')
    expect(screen.getByText(/1 movimiento/)).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Filtrar por categoría'), 'all')
    await waitFor(() => expect(listItems()).toHaveLength(3), WAIT_FOR)
    expect(screen.getByText(/Total:/)).toHaveTextContent('15,75')
    expect(screen.getByText(/3 movimientos/)).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Filtrar por categoría'), 'Hogar')
    await waitForEmptyList()
    expect(screen.getByText(/Total:/)).toHaveTextContent('0,00')
    expect(screen.getByText(/0 movimientos/)).toBeInTheDocument()
  })

  // ---------------------------------------------------------------- US3
  it('conserva los gastos entre recargas de la vista', async () => {
    const { user, unmount } = renderDashboard()
    await waitForEmptyList()

    await addExpense(user, 'Café', '3.50', 'Alimentación')
    await screen.findByText('Café', {}, WAIT_FOR)
    unmount()

    renderDashboard()
    expect(await screen.findByText('Café', {}, WAIT_FOR)).toBeInTheDocument()
    expect(screen.getByText(/Total:/)).toHaveTextContent('3,50')
    expect(screen.getByText(/1 movimiento/)).toBeInTheDocument()
  })

  it('muestra el indicador de carga mientras la query está pendiente', async () => {
    renderDashboard()

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Cargando gastos…')
    await waitForEmptyList()
    expect(screen.queryByText('Cargando gastos…')).not.toBeInTheDocument()
  })

  it('muestra un error de consulta y permite reintentar', async () => {
    setExpenseRepositoryFailure(true)
    const { user } = renderDashboard()

    const alert = await screen.findByRole('alert', {}, WAIT_FOR)
    expect(alert).toHaveTextContent('No se pudieron cargar los gastos.')

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitForEmptyList()
  })

  it('conserva los datos del formulario al fallar el registro y permite reintentar', async () => {
    const { user } = renderDashboard()
    await waitForEmptyList()

    await user.type(screen.getByLabelText('Concepto'), 'Libro')
    await user.type(screen.getByLabelText('Importe (€)'), '12')
    await user.selectOptions(screen.getByLabelText('Categoría'), 'Otros')
    setExpenseRepositoryFailure(true)
    await user.click(screen.getByRole('button', { name: /Añadir gasto/i }))

    const createAlert = await screen.findByText(
      'No se pudo registrar el gasto. Inténtalo de nuevo.',
      {},
      WAIT_FOR,
    )
    expect(createAlert).toBeInTheDocument()
    expect(screen.getByLabelText('Concepto')).toHaveValue('Libro')
    expect(screen.getByLabelText('Importe (€)')).toHaveValue('12')

    await user.click(screen.getByRole('button', { name: 'Reintentar registro' }))
    expect(await screen.findByText('Libro', {}, WAIT_FOR)).toBeInTheDocument()
    expect(screen.getByLabelText('Concepto')).toHaveValue('')
    expect(screen.getByLabelText('Importe (€)')).toHaveValue('')
    expect(screen.getByText(/Total:/)).toHaveTextContent('12,00')
  })

  it('avisa de forma no bloqueante cuando el almacenamiento está degradado', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage bloqueado')
    })

    renderDashboard()

    const warning = await screen.findByText(/almacenamiento/i, {}, WAIT_FOR)
    expect(warning).toHaveAttribute('role', 'status')
    expect(screen.getByLabelText('Concepto')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------- US4
  it('elimina un gasto y recalcula el resumen', async () => {
    const { user } = renderDashboard()
    await waitForEmptyList()

    await addExpense(user, 'Café', '3.50', 'Alimentación')
    await screen.findByText('Café', {}, WAIT_FOR)
    await addExpense(user, 'Billete', '2.25', 'Transporte')
    await waitFor(() => expect(listItems()).toHaveLength(2), WAIT_FOR)

    await user.click(listItems()[0]?.querySelector('button') as HTMLElement)

    await waitFor(() => expect(listItems()).toHaveLength(1), WAIT_FOR)
    expect(within(listItems()[0] as HTMLElement).getByText('Café')).toBeInTheDocument()
    expect(screen.getByText(/Total:/)).toHaveTextContent('3,50')
    expect(screen.getByText(/1 movimiento/)).toBeInTheDocument()
  })

  it('muestra el estado vacío al eliminar el único gasto visible bajo un filtro', async () => {
    const { user } = renderDashboard()
    await waitForEmptyList()

    await addExpense(user, 'Café', '3.50', 'Alimentación')
    await screen.findByText('Café', {}, WAIT_FOR)
    await addExpense(user, 'Billete', '2.25', 'Transporte')
    await screen.findByText('Billete', {}, WAIT_FOR)

    await user.selectOptions(screen.getByLabelText('Filtrar por categoría'), 'Alimentación')
    await waitFor(() => expect(listItems()).toHaveLength(1), WAIT_FOR)
    await user.click(screen.getByRole('button', { name: /Eliminar gasto: Café/i }))

    await waitForEmptyList()
    expect(screen.getByText(/Total:/)).toHaveTextContent('0,00')
    expect(screen.getByText(/0 movimientos/)).toBeInTheDocument()
  })

  it('mantiene el gasto y permite reintentar cuando falla la eliminación', async () => {
    const { user } = renderDashboard()
    await waitForEmptyList()

    await addExpense(user, 'Café', '3.50', 'Alimentación')
    await screen.findByText('Café', {}, WAIT_FOR)

    setExpenseRepositoryFailure(true)
    await user.click(screen.getByRole('button', { name: /Eliminar gasto: Café/i }))

    const alert = await screen.findByText(
      'No se pudo eliminar el gasto.',
      {},
      WAIT_FOR,
    )
    expect(alert).toBeInTheDocument()
    expect(screen.getByText('Café')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar eliminación' }))
    await waitForEmptyList()
    expect(screen.getByText(/Total:/)).toHaveTextContent('0,00')
  })

  it('deshabilita el botón de eliminación mientras la mutación está en curso', async () => {
    const { user } = renderDashboard()
    await waitForEmptyList()

    await addExpense(user, 'Café', '3.50', 'Alimentación')
    await screen.findByText('Café', {}, WAIT_FOR)
    await user.click(screen.getByRole('button', { name: /Eliminar gasto: Café/i }))

    expect(
      screen.getByRole('button', { name: /Eliminar gasto: Café/i }),
    ).toBeDisabled()
    await waitForEmptyList()
  })
})
