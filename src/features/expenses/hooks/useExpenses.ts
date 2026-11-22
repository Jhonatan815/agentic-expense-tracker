import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createExpense, deleteExpense, listExpenses } from '../api/expenses.api'
import type { CreateExpenseInput } from '../types/expense.types'

const EXPENSES_QUERY_KEY = ['expenses'] as const

export function useExpenses() {
  const queryClient = useQueryClient()

  const expensesQuery = useQuery({
    queryKey: EXPENSES_QUERY_KEY,
    queryFn: listExpenses,
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateExpenseInput) => createExpense(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY })
    },
  })

  return {
    expenses: expensesQuery.data ?? [],
    isLoadingExpenses: expensesQuery.isPending,
    isErrorLoadingExpenses: expensesQuery.isError,
    expensesError: expensesQuery.error,
    refetchExpenses: expensesQuery.refetch,
    createExpense: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    resetCreateError: createMutation.reset,
    deleteExpense: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
    resetDeleteError: deleteMutation.reset,
  }
}
