import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ExpensesDashboard } from '@/features/expenses'
import '@/app/index.css'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ExpensesDashboard />
    </QueryClientProvider>
  )
}
