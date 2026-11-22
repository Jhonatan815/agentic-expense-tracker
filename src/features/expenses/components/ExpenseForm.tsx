import { type FormEvent, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  EXPENSE_CATEGORIES,
  type CreateExpenseInput,
  type ExpenseCategory,
} from '../types/expense.types'

interface ExpenseFormProps {
  onSubmit: (input: CreateExpenseInput) => void
  isSubmitting: boolean
}

interface FormErrors {
  concept?: string
  amount?: string
}

export function ExpenseForm({ onSubmit, isSubmitting }: ExpenseFormProps) {
  const [concept, setConcept] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Otros')
  const [errors, setErrors] = useState<FormErrors>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: FormErrors = {}
    const trimmedConcept = concept.trim()

    if (trimmedConcept.length === 0) {
      nextErrors.concept = 'El concepto no puede estar vacío.'
    }

    const parsedAmount = Number(amount.trim())
    if (amount.trim().length === 0) {
      nextErrors.amount = 'El importe es obligatorio.'
    } else if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = 'El importe debe ser un número mayor que 0.'
    } else if (Math.round(parsedAmount * 100) !== parsedAmount * 100) {
      nextErrors.amount = 'El importe no puede tener más de dos decimales.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      concept: trimmedConcept,
      amount: parsedAmount,
      category,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      aria-label="Registrar gasto"
    >
      <h2 className="text-lg font-semibold text-slate-800">Nuevo gasto</h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="expense-concept" className="text-sm font-medium text-slate-700">
          Concepto
        </label>
        <input
          id="expense-concept"
          name="concept"
          type="text"
          value={concept}
          onChange={(event) => setConcept(event.target.value)}
          aria-invalid={errors.concept !== undefined}
          aria-describedby={errors.concept ? 'expense-concept-error' : undefined}
          className="rounded border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-blue-500"
        />
        {errors.concept && (
          <p id="expense-concept-error" role="alert" className="text-sm text-red-600">
            {errors.concept}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="expense-amount" className="text-sm font-medium text-slate-700">
          Importe (€)
        </label>
        <input
          id="expense-amount"
          name="amount"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-invalid={errors.amount !== undefined}
          aria-describedby={errors.amount ? 'expense-amount-error' : undefined}
          className="rounded border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-blue-500"
        />
        {errors.amount && (
          <p id="expense-amount-error" role="alert" className="text-sm text-red-600">
            {errors.amount}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="expense-category" className="text-sm font-medium text-slate-700">
          Categoría
        </label>
        <select
          id="expense-category"
          name="category"
          value={category}
          onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
          className="rounded border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          {EXPENSE_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <Plus size={16} aria-hidden="true" />
        Añadir gasto
      </button>
    </form>
  )
}
