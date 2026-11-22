import { formatCurrency } from '@/common/utils/formatCurrency'
import type { ExpenseSummary as ExpenseSummaryData } from '../types/expense.types'

interface ExpenseSummaryProps {
  summary: ExpenseSummaryData
}

export function ExpenseSummary({ summary }: ExpenseSummaryProps) {
  return (
    <section
      aria-label="Resumen financiero"
      className="rounded-lg bg-slate-100 p-4 text-slate-800"
    >
      <h2 className="text-lg font-semibold">Resumen</h2>
      <p className="text-xl font-bold">Total: {formatCurrency(summary.total)}</p>
      <p>
        {summary.count} {summary.count === 1 ? 'movimiento' : 'movimientos'}
      </p>
    </section>
  )
}
