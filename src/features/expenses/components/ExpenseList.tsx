import { Trash2 } from 'lucide-react'
import { formatCurrency } from '@/common/utils/formatCurrency'
import { formatDate } from '@/common/utils/formatDate'
import type { Expense } from '../types/expense.types'

interface ExpenseListProps {
  expenses: Expense[]
  isLoading: boolean
  isError: boolean
  onRetryLoad: () => void
  onDelete: (id: string) => void
  isDeleting: boolean
  deleteError: Error | null
  onRetryDelete: () => void
}

export function ExpenseList({
  expenses,
  isLoading,
  isError,
  onRetryLoad,
  onDelete,
  isDeleting,
  deleteError,
  onRetryDelete,
}: ExpenseListProps) {
  if (isLoading) {
    return <p role="status">Cargando gastos…</p>
  }

  if (isError) {
    return (
      <div role="alert" className="flex flex-col gap-2 text-red-700">
        <p>No se pudieron cargar los gastos.</p>
        <button
          type="button"
          onClick={onRetryLoad}
          className="self-start rounded border border-red-400 px-3 py-1 focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <section aria-label="Listado de gastos" className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-slate-800">Gastos</h2>

      {deleteError && (
        <div role="alert" className="flex flex-col gap-2 text-red-700">
          <p>No se pudo eliminar el gasto.</p>
          <button
            type="button"
            onClick={onRetryDelete}
            className="self-start rounded border border-red-400 px-3 py-1 focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            Reintentar eliminación
          </button>
        </div>
      )}

      {expenses.length === 0 ? (
        <p className="text-slate-600">
          No hay gastos registrados para este filtro.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {expenses.map((expense) => (
            <li
              key={expense.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3"
            >
              <div className="flex flex-col">
                <span className="font-medium text-slate-900">{expense.concept}</span>
                <span className="text-sm text-slate-600">
                  {expense.category} · {formatDate(expense.date)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-900">
                  {formatCurrency(expense.amount)}
                </span>
                <button
                  type="button"
                  aria-label={`Eliminar gasto: ${expense.concept}`}
                  disabled={isDeleting}
                  onClick={() => onDelete(expense.id)}
                  className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-blue-500"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Eliminar gasto
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
