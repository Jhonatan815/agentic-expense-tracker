# Contract: Interfaz de usuario de expenses

**Feature**: `001-expense-manager` | **Barrel público**: `src/features/expenses/index.ts`

## API pública de la feature

```ts
export { ExpensesDashboard } from './components/ExpensesDashboard'
export type { Expense, ExpenseCategory, CreateExpenseInput, ExpenseFilter } from './types/expense.types'
```

`src/app/App.tsx` importa exclusivamente desde `@/features/expenses`. El resto de archivos de la feature son privados.

## Componentes internos

| Componente | Responsabilidad | Entradas observables |
|---|---|---|
| `ExpensesDashboard` | Compone formulario, filtros, resumen y listado; gestiona el filtro activo y el estado de las mutation | Ninguna (se monta sin props) |
| `ExpenseForm` | Registra un gasto | Campos «Concepto», «Importe (€)», «Categoría»; botón «Añadir gasto» |
| `ExpenseFilters` | Selecciona «Todas» o una categoría | Control etiquetado «Filtrar por categoría» |
| `ExpenseSummary` | Muestra total y número de movimientos | Textos «Total: 3,50 €» y «2 movimientos» |
| `ExpenseList` | Muestra los gastos visibles, estados vacío/carga/error y botón de eliminación | Uno por gasto, con botón accesible «Eliminar gasto» |

## Comportamiento observable

1. **Carga inicial**: mientras la query está pendiente se muestra un indicador con `role="status"` y texto «Cargando gastos…».
2. **Estado vacío**: sin gastos o sin coincidencias de filtro, se muestra un mensaje informativo y el resumen en `0,00 €` / `0 movimientos`.
3. **Registro válido**: tras enviar, el gasto aparece primero en el listado, el formulario se limpia y el resumen se recalcula.
4. **Validación**: concepto vacío o importe no positivo/con más de dos decimales impiden el registro y muestran un mensaje con `role="alert"`.
5. **Filtrado**: al elegir una categoría, el listado y el resumen consideran solo los gastos de esa categoría; «Todas» restaura el conjunto completo.
6. **Eliminación**: el gasto desaparece y el resumen se actualiza; no hay confirmación adicional.
7. **Error de operación**: mensaje comprensible con `role="alert"` y posibilidad de reintentar sin perder los datos del formulario.
8. **Doble envío**: los botones de registrar y eliminar se deshabilitan mientras su mutación está en curso.
9. **Advertencia de almacenamiento**: si el repositorio informa de degradación, se muestra un aviso no bloqueante con `role="status"`.

## Accesibilidad (SC-008)

- Cada control interactivo tiene una etiqueta accesible y foco visible.
- Toda la interfaz es operable con teclado.
- Errores y avisos se anuncian mediante `role="alert"` / `aria-live="polite"`.
- Los iconos de `lucide-react` son decorativos (`aria-hidden="true"`) cuando el texto adyacente ya describe la acción.

## Contrato de pruebas de integración

`ExpensesDashboard.test.tsx` monta el componente dentro de un `QueryClientProvider` con `retry: false`, limpia `localStorage` y llama a `resetExpenseRepository()` en `beforeEach`. Las aserciones se basan en roles y textos accesibles, no en selectores CSS frágiles.
