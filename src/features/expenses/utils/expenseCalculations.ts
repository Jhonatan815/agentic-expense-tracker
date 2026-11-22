import type {
  Expense,
  ExpenseFilter,
  ExpenseSummary,
} from '../types/expense.types'

export function filterExpensesByCategory(
  expenses: Expense[],
  filter: ExpenseFilter,
): Expense[] {
  const visible =
    filter === 'all'
      ? [...expenses]
      : expenses.filter((expense) => expense.category === filter)

  return visible.sort((a, b) => b.date.localeCompare(a.date))
}

export function calculateExpenseSummary(expenses: Expense[]): ExpenseSummary {
  return {
    total: Number(
      expenses.reduce((total, expense) => total + expense.amount, 0).toFixed(2),
    ),
    count: expenses.length,
  }
}
