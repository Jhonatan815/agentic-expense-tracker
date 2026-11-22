import { useRef, useState } from 'react'
import { getExpenseStorageWarning } from '../api/expenses.api'
import { useExpenses } from '../hooks/useExpenses'
import {
  calculateExpenseSummary,
  filterExpensesByCategory,
} from '../utils/expenseCalculations'
import type { CreateExpenseInput, ExpenseFilter } from '../types/expense.types'
import { ExpenseFilters } from './ExpenseFilters'
import { ExpenseForm } from './ExpenseForm'
import { ExpenseList } from './ExpenseList'
import { ExpenseSummary } from './ExpenseSummary'

export function ExpensesDashboard() {
  const [filter, setFilter] = useState<ExpenseFilter>('all')
  const [formKey, setFormKey] = useState(0)
  const lastCreateInput = useRef<CreateExpenseInput | null>(null)
  const lastDeleteId = useRef<string | null>(null)

  const {
    expenses,
    isLoadingExpenses,
    isErrorLoadingExpenses,
    expensesError,
    refetchExpenses,
    createExpense,
    isCreating,
    createError,
    deleteExpense,
    isDeleting,
    deleteError,
  } = useExpenses()

  const visibleExpenses = filterExpensesByCategory(expenses, filter)
  const summary = calculateExpenseSummary(visibleExpenses)
  const storageWarning = getExpenseStorageWarning()

  function handleCreate(input: CreateExpenseInput) {
    lastCreateInput.current = input
    createExpense(input, {
      onSuccess: () => {
        lastCreateInput.current = null
        setFormKey((key) => key + 1)
      },
    })
  }

  function handleRetryCreate() {
    const input = lastCreateInput.current
    if (input !== null) {
      handleCreate(input)
    }
  }

  function handleDelete(id: string) {
    lastDeleteId.current = id
    deleteExpense(id, {
      onSuccess: () => {
        lastDeleteId.current = null
      },
    })
  }

  function handleRetryDelete() {
    const id = lastDeleteId.current
    if (id !== null) {
      handleDelete(id)
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Gestor de Gastos</h1>

      <ExpenseForm
        key={formKey}
        onSubmit={handleCreate}
        isSubmitting={isCreating}
      />

      {storageWarning !== null && (
        <p role="status" className="rounded bg-amber-100 p-3 text-amber-900">
          {storageWarning}
        </p>
      )}

      {createError !== null && (
        <div role="alert" className="flex flex-col gap-2 text-red-700">
          <p>No se pudo registrar el gasto. Inténtalo de nuevo.</p>
          <button
            type="button"
            onClick={handleRetryCreate}
            className="self-start rounded border border-red-400 px-3 py-1 focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            Reintentar registro
          </button>
        </div>
      )}

      <ExpenseFilters filter={filter} onFilterChange={setFilter} />
      <ExpenseSummary summary={summary} />

      <ExpenseList
        expenses={visibleExpenses}
        isLoading={isLoadingExpenses}
        isError={isErrorLoadingExpenses}
        onRetryLoad={() => {
          void refetchExpenses()
        }}
        onDelete={handleDelete}
        isDeleting={isDeleting}
        deleteError={deleteError}
        onRetryDelete={handleRetryDelete}
      />

      {isErrorLoadingExpenses && expensesError !== null && (
        <p className="sr-only" aria-live="polite">
          {expensesError.message}
        </p>
      )}
    </main>
  )
}
