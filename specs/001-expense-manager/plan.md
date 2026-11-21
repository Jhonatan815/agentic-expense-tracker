# Implementation Plan: Gestor de Gastos Personales (expenses)

**Branch**: `001-expense-manager` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Especificación funcional y aclaraciones de la sesión 2026-11-21 en `/specs/001-expense-manager/spec.md`.

## Summary

Construir una SPA local que permita registrar, listar, filtrar y eliminar gastos personales, con un resumen financiero derivado del conjunto filtrado. Los datos se persisten en `localStorage` a través de un repositorio asíncrono simulado con ~250 ms de latencia y fallos inyectables solo desde pruebas. El estado asíncrono se gestiona con TanStack Query; la UI usa Tailwind CSS e iconos de `lucide-react`, y se organiza en una única feature `expenses` con un barrel público. El detalle de las decisiones está en [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 6.0.3 (activar `strict: true` en `tsconfig.app.json` como paso previo), React 19.3.1

**Primary Dependencies**: `@tanstack/react-query` ^5.108.0, `lucide-react` ^1.75.0, React/DOM 19.3.1, Tailwind CSS 4 con `@tailwindcss/vite`

**Storage**: `localStorage` (`expenses.v1`, array JSON de `Expense`) con fallback en memoria y aviso no bloqueante

**Testing**: Vitest 5.1 + `@testing-library/react` 16.3 + `@testing-library/jest-dom` 7 + `@testing-library/user-event` 14.6 + jsdom 31 (ya configurados en `vite.config.ts` y `src/app/test-setup.ts`). Las pruebas de integración y de componentes usan `userEvent.setup()` para simular la interacción; las pruebas unitarias de utilidades no necesitan DOM.

**Target Platform**: Navegador moderno; SPA servida por Vite 8, sin backend ni servicios externos

**Project Type**: Aplicación web (frontend SPA, un solo proyecto)

**Performance Goals**: SC-001 (registrar y ver en <30 s), SC-005 (feedback de carga en <1 s, operación completada en <3 s), latencia simulada de ~250 ms

**Constraints**: Constitución del proyecto (pnpm exclusivo, solo `src/app`, `src/common`, `src/features/*`, fronteras ESLint sin `eslint-disable`, TanStack Query para todo estado asíncrono, iconos solo de `lucide-react`, quality gates obligatorios); sin dependencias nuevas; accesibilidad básica WCAG 2.1 AA; interfaz en español

**Scale/Scope**: Una persona, cinco categorías fijas, sin autenticación, sin sincronización, sin edición ni exportación

## Constitution Check

*GATE: debe pasar antes de Phase 0 y se reevalúa tras Phase 1.*

| Principio | Estado | Evidencia / acción |
|---|---|---|
| I. Uso exclusivo de pnpm | PASS | Todos los comandos usan `pnpm`; no se añaden dependencias. |
| II. Arquitectura modular estricta | PASS | Solo `src/app`, `src/common/utils` y `src/features/expenses`; sin carpetas nuevas fuera de esas capas. |
| III. Fronteras inquebrantables | PASS | `app` importa la feature únicamente desde `@/features/expenses`; los internos usan rutas relativas dentro de la feature; se verificó con ESLint sobre la estructura prevista que no aparecen violaciones de `boundaries/element-types` ni `boundaries/no-private`. Sin `eslint-disable` ni cambios de configuración (R-010). |
| IV. TypeScript estricto | PASS con acción previa | `tsconfig.app.json` no declara `"strict": true`; se activa antes de implementar. `pnpm run typecheck` y `pnpm run build` (`tsc -b`) deben pasar. |
| V. Estado asíncrono con TanStack Query | PASS | `QueryClientProvider` en `src/app/App.tsx`; `useQuery`/`useMutation` en `useExpenses.ts` con invalidación de `['expenses']` (R-007). |
| VI. Iconografía con lucide-react | PASS | Iconos importados solo desde `lucide-react`; ninguna otra librería de iconos. |
| VII. Verificación obligatoria | PASS | `pnpm run typecheck`, `pnpm run lint` y `pnpm test` son requisitos de cierre (quickstart.md). |

**Reevaluación post-diseño**: el diseño no introduce violaciones. La única acción previa identificada es activar `strict: true` en `tsconfig.app.json`; no se requiere justificación en Complexity Tracking porque refuerza, no relaja, la constitución.

## Project Structure

### Documentation (this feature)

```text
specs/001-expense-manager/
├── spec.md
├── plan.md                 # este archivo
├── research.md             # Phase 0
├── data-model.md           # Phase 1
├── quickstart.md           # Phase 1
├── contracts/
│   ├── expenses-api.md     # contrato del repositorio simulado
│   └── expenses-ui.md      # contrato de la interfaz y API pública
├── checklists/
│   └── requirements.md
└── tasks.md                # Phase 2 (/speckit.tasks, NO creado aquí)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── App.tsx                         # QueryClientProvider + <ExpensesDashboard />
│   ├── index.css                       # @import "tailwindcss" (ya existente)
│   ├── test-setup.ts                   # jest-dom (ya existente)
│   └── App.test.tsx                    # opcional: humo del provider
├── common/
│   └── utils/
│       ├── formatCurrency.ts
│       ├── formatCurrency.test.ts
│       └── formatDate.ts
├── features/
│   └── expenses/
│       ├── types/
│       │   └── expense.types.ts
│       ├── api/
│       │   ├── expenses.api.ts
│       │   └── expenses.api.test.ts    # opcional: contrato del repositorio
│       ├── hooks/
│       │   └── useExpenses.ts
│       ├── utils/
│       │   ├── expenseCalculations.ts
│       │   └── expenseCalculations.test.ts
│       ├── components/
│       │   ├── ExpenseForm.tsx
│       │   ├── ExpenseFilters.tsx
│       │   ├── ExpenseSummary.tsx
│       │   ├── ExpenseList.tsx
│       │   ├── ExpensesDashboard.tsx
│       │   └── ExpensesDashboard.test.tsx
│       └── index.ts                    # único barrel público
└── main.tsx                            # punto de montaje (ya existente)
```

**Structure Decision**: SPA de un solo proyecto. `src/app` contiene providers y estilos globales; `src/common/utils` solo formateadores sin lógica de dominio; `src/features/expenses` concentra todo el dominio de gastos y expone exclusivamente `ExpensesDashboard` y sus tipos mediante `index.ts`. No se crean carpetas `models/`, `services/` ni directorios `tests/` paralelos: las pruebas se colocan junto al archivo que validan, según el patrón de Vitest ya configurado.

**Nota de estado actual**: `src/main.tsx` no importa `index.css` en este momento; durante la implementación se debe importar `@/app/index.css` desde `src/app/App.tsx` (o restablecer el import en `main.tsx`) para que Tailwind CSS se aplique. Este cambio no altera las fronteras de la arquitectura.

## Complexity Tracking

Sin violaciones de la constitución que requieran justificación. No se relaja ninguna regla de fronteras ni se añaden dependencias.
