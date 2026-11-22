const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
})

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount)
}
