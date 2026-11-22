import { EXPENSE_CATEGORIES, type ExpenseFilter } from '../types/expense.types'

interface ExpenseFiltersProps {
  filter: ExpenseFilter
  onFilterChange: (filter: ExpenseFilter) => void
}

export function ExpenseFilters({ filter, onFilterChange }: ExpenseFiltersProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="expense-filter" className="text-sm font-medium text-slate-700">
        Filtrar por categoría
      </label>
      <select
        id="expense-filter"
        value={filter}
        onChange={(event) => onFilterChange(event.target.value as ExpenseFilter)}
        className="rounded border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-blue-500"
      >
        <option value="all">Todas</option>
        {EXPENSE_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  )
}
