export const EXPENSE_CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Ocio',
  'Hogar',
  'Otros',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export interface Expense {
  id: string
  concept: string
  amount: number
  category: ExpenseCategory
  date: string
}

export interface CreateExpenseInput {
  concept: string
  amount: number
  category?: ExpenseCategory
}

export type ExpenseFilter = 'all' | ExpenseCategory

export interface ExpenseSummary {
  total: number
  count: number
}
