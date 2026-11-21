# Quickstart: Verificación local de expenses

**Feature**: `001-expense-manager` | **Rama**: `001-expense-manager`

## Prerrequisitos

- Node.js y `pnpm` instalados. El proyecto usa **exclusivamente pnpm** (constitución, principio I).
- Dependencias ya declaradas en `package.json`; no instalar paquetes adicionales.
- Navegador con `localStorage` disponible para comprobar persistencia.

## Arranque

```bash
pnpm install
pnpm dev
```

Abrir la URL que muestra Vite. La vista de gastos se monta desde `src/app/App.tsx`, que solo importa desde `@/features/expenses`.

## Quality gates (obligatorios)

```bash
pnpm run typecheck
pnpm run lint
pnpm test
```

Los tres comandos deben terminar sin errores. `pnpm run lint` no debe introducir `eslint-disable` ni cambios en `eslint.config.js` (constitución, principios II y III).

## Escenarios de validación

| # | Escenario | Pasos | Resultado esperado | Referencia |
|---|---|---|---|---|
| 1 | Carga inicial vacía | Abrir la vista con `localStorage` limpio | Estado vacío informativo; resumen `0,00 €` y `0 movimientos` | `contracts/expenses-ui.md` §2 |
| 2 | Registrar gasto válido | Concepto «Café», importe `3.50`, categoría Alimentación, pulsar «Añadir gasto» | Aparece «Café», `3,50 €`, Alimentación y fecha `DD/MM/YYYY`; resumen `3,50 €` / `1 movimiento` | `data-model.md` §Expense |
| 3 | Validación | Enviar concepto vacío; después importe `0` y `1.234` | No se añade ningún gasto; mensajes con `role="alert"` | FR-004 a FR-006 |
| 4 | Persistencia | Registrar un gasto y recargar | El gasto sigue visible con sus cuatro datos y el resumen se recalcula | `contracts/expenses-api.md` §Persistencia |
| 5 | Filtrado | Registrar gastos de varias categorías y elegir Transporte | Solo se muestran los de Transporte; el resumen coincide; «Todas» restaura el total | FR-013 a FR-016 |
| 6 | Eliminación | Pulsar «Eliminar gasto» en un gasto visible | Desaparece del listado y el resumen disminuye; sin confirmación adicional | FR-011, FR-012 |
| 7 | Error y reintento | En una prueba, activar `setExpenseRepositoryFailure(true)` y registrar | Mensaje de error visible, el listado no se altera y los datos del formulario se conservan al reintentar | `contracts/expenses-api.md` §Fallos controlados |
| 8 | Almacenamiento degradado | Simular `localStorage` bloqueado o dato corrupto | Aviso no bloqueante; la vista sigue funcionando en memoria | `data-model.md` §Persistencia |
| 9 | Accesibilidad | Navegar solo con teclado por formulario, filtros, listado y eliminación | Foco visible, etiquetas leídas y errores anunciados | SC-008 |

## Pruebas automatizadas

```bash
pnpm test
```

Cubre:

- `expenseCalculations.test.ts`: filtrado, resumen y ordenación.
- `formatCurrency.test.ts`: formato `es-ES` con dos decimales y símbolo €.
- `ExpensesDashboard.test.tsx`: flujo completo (renderizado inicial, alta con validación, filtrado, eliminación y resumen), además de error/reintento y estado vacío. La interacción se simula con `userEvent.setup()` en cada test.

Detalles de montaje y aserciones: `contracts/expenses-ui.md` §Contrato de pruebas de integración.
