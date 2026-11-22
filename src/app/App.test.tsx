import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('monta el proveedor de React Query y el dashboard accesible', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Gestor de Gastos' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Filtrar por categoría')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Añadir gasto/i }))
    expect(
      screen.getByText('El concepto no puede estar vacío.'),
    ).toBeInTheDocument()
  })
})
