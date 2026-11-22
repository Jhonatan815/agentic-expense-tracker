import {
  EXPENSE_CATEGORIES,
  type CreateExpenseInput,
  type Expense,
  type ExpenseCategory,
} from '../types/expense.types'

const STORAGE_KEY = 'expenses.v1'
const LATENCY_MS = 250
const STORAGE_WARNING =
  'El almacenamiento del navegador no está disponible; los gastos se conservan solo durante esta sesión.'

let memoryExpenses: Expense[] = []
let storageWarning: string | null = null
let failNextOperation = false

function waitLatency(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, LATENCY_MS)
  })
}

function consumeInjectedFailure(): void {
  if (!failNextOperation) return
  failNextOperation = false
  throw new Error('No se pudo completar la operación. Inténtalo de nuevo.')
}

function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return (
    typeof value === 'string' &&
    (EXPENSE_CATEGORIES as readonly string[]).includes(value)
  )
}

function isExpense(value: unknown): value is Expense {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.concept === 'string' &&
    candidate.concept.trim().length > 0 &&
    typeof candidate.amount === 'number' &&
    Number.isFinite(candidate.amount) &&
    candidate.amount > 0 &&
    isExpenseCategory(candidate.category) &&
    typeof candidate.date === 'string'
  )
}

function readExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      storageWarning = null
      return memoryExpenses
    }

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.every(isExpense)) {
      storageWarning = STORAGE_WARNING
      return memoryExpenses
    }

    storageWarning = null
    return parsed
  } catch {
    storageWarning = STORAGE_WARNING
    return memoryExpenses
  }
}

function persistExpenses(expenses: Expense[]): void {
  memoryExpenses = expenses

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
    storageWarning = null
  } catch {
    storageWarning = STORAGE_WARNING
  }
}

function validateInput(input: CreateExpenseInput): void {
  if (input.concept.trim().length === 0) {
    throw new Error('El concepto no puede estar vacío.')
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('El importe debe ser un número mayor que 0.')
  }

  if (Math.round(input.amount * 100) !== input.amount * 100) {
    throw new Error('El importe no puede tener más de dos decimales.')
  }
}

export async function listExpenses(): Promise<Expense[]> {
  await waitLatency()
  consumeInjectedFailure()
  return readExpenses()
}

export async function createExpense(
  input: CreateExpenseInput,
): Promise<Expense> {
  await waitLatency()
  consumeInjectedFailure()
  validateInput(input)

  const expense: Expense = {
    id: crypto.randomUUID(),
    concept: input.concept.trim(),
    amount: input.amount,
    category: input.category ?? 'Otros',
    date: new Date().toISOString(),
  }

  persistExpenses([expense, ...readExpenses()])
  return expense
}

export async function deleteExpense(id: string): Promise<void> {
  await waitLatency()
  consumeInjectedFailure()
  persistExpenses(readExpenses().filter((expense) => expense.id !== id))
}

export function setExpenseRepositoryFailure(shouldFail: boolean): void {
  failNextOperation = shouldFail
}

export function resetExpenseRepository(): void {
  failNextOperation = false
  memoryExpenses = []
  storageWarning = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    storageWarning = STORAGE_WARNING
  }
}

export function getExpenseStorageWarning(): string | null {
  return storageWarning
}
