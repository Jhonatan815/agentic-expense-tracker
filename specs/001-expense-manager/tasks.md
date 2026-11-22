---
description: "Task list for feature implementation - Gestor de Gastos Personales (expenses)"
---

# Tasks: Gestor de Gastos Personales (expenses)

**Input**: Design documents from `/specs/001-expense-manager/`

**Prerequisites**: plan.md (required), spec.md (required para user stories), research.md, data-model.md, contracts/

**Tests**: Incluidos porque el usuario solicita explícitamente la suite completa con `@testing-library/user-event`.

**Organization**: Cuatro fases incrementales por capa (utilidades compartidas → tipos/API/hooks → componentes/barrel → integración y tests). Cada fase cierra con un checkpoint de `typecheck`, `lint` y `test`. Las tareas de UI y de tests llevan etiqueta `[USn]` para mantener la trazabilidad con `spec.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Se puede ejecutar en paralelo (archivos distintos, sin dependencias de tareas incompletas).
- **[Story]**: User story de `spec.md` a la que sirve la tarea (`US1`…`US4`). Solo aparece en tareas de UI y de tests; las fases de setup, foundational e integración no lo llevan.
- Todas las descripciones incluyen la ruta exacta del archivo.

## Path Conventions

- SPA de un solo proyecto: `src/` en la raíz, con únicamente `src/app/`, `src/common/` y `src/features/expenses/`.
- Las pruebas se colocan junto al archivo que validan (patrón de Vitest ya configurado); no se crea una carpeta `tests/`.
- `src/app/App.tsx` importa la feature solo desde `@/features/expenses`; los archivos internos usan rutas relativas dentro de la feature.

---

## Phase 1: Prerrequisitos y utilidades comunes (Setup)

**Purpose**: Estructura permitida por la constitución y formateadores puros compartidos, sin lógica de dominio.

- [X] T001 Crear la estructura de directorios `src/common/utils/` y `src/features/expenses/{types,api,hooks,utils,components}/` según `plan.md`, sin añadir carpetas fuera de `src/app`, `src/common` o `src/features/expenses/`.
- [X] T002 [P] Implementar `formatCurrency` en `src/common/utils/formatCurrency.ts` con `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })` para mostrar siempre dos decimales y el símbolo `€` (FR-007, R-006).
- [X] T003 [P] Implementar `formatDate` en `src/common/utils/formatDate.ts` con `Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })` para producir `DD/MM/YYYY` a partir de un ISO 8601 (FR-001, R-005).
- [X] T004 [P] Crear `src/common/utils/formatCurrency.test.ts` con los casos `3.5 → "3,50 €"`, `0 → "0,00 €"` y redondeo a dos decimales.
- [X] T005 [P] Crear `src/common/utils/formatDate.test.ts` con casos ISO 8601 → `DD/MM/YYYY` (p. ej. `2026-11-21T10:00:00.000Z` → `21/11/2026`).
- [X] T006 Checkpoint Fase 1: en `tsconfig.app.json` y `src/common/utils/`, verificar que `strict: true` sigue activo y ejecutar `pnpm run typecheck`, `pnpm run lint` y `pnpm test`, corrigiendo cualquier fallo antes de continuar.

**Checkpoint**: Utilidades compartidas funcionando y quality gates en verde. Los stories aún no pueden empezar: falta la capa de datos.

---

## Phase 2: Tipos, API simulada y hooks de React Query (Foundational)

**Purpose**: Contratos de datos, repositorio asíncrono simulado y estado asíncrono. Bloquea cualquier trabajo de UI e integración.

**⚠️ CRITICAL**: Ninguna tarea de la Fase 3 o 4 puede empezar hasta cerrar esta fase.

- [X] T007 Definir `Expense`, `ExpenseCategory`, `CreateExpenseInput`, `ExpenseFilter` y `ExpenseSummary` en `src/features/expenses/types/expense.types.ts` tomando cada campo de su definición canónica en `data-model.md`: `Expense.id` (string, UUID), `Expense.concept` (string no vacío tras recortar), `Expense.amount` (number positivo con hasta dos decimales), `Expense.category` (una de las cinco categorías), `Expense.date` (string ISO 8601 automático), `CreateExpenseInput.concept`, `CreateExpenseInput.amount`, `CreateExpenseInput.category` (opcional, por defecto `Otros`), `ExpenseFilter` (`'all' | ExpenseCategory`) y `ExpenseSummary.total`/`ExpenseSummary.count` (derivados, nunca persistidos). `ExpenseCategory` es la unión literal `'Alimentación' | 'Transporte' | 'Ocio' | 'Hogar' | 'Otros'`.
- [X] T008 Implementar `listExpenses`, `createExpense` y `deleteExpense` en `src/features/expenses/api/expenses.api.ts` según `contracts/expenses-api.md`: latencia de ~250 ms, clave `expenses.v1` con un array JSON de `Expense`, lectura sin datos → `[]`, fallback en memoria ante almacenamiento ilegible, validación de `Expense.concept` y `Expense.amount` y de `CreateExpenseInput.concept`/`CreateExpenseInput.amount` según `data-model.md`, `id` generado con `crypto.randomUUID()` y `date` ISO asignado automáticamente según `data-model.md`, y `CreateExpenseInput.category = 'Otros'` por defecto según `data-model.md`; `deleteExpense` con id inexistente resuelve sin cambios.
- [X] T009 Añadir `setExpenseRepositoryFailure`, `resetExpenseRepository` y `getExpenseStorageWarning` en `src/features/expenses/api/expenses.api.ts` según `contracts/expenses-api.md`: rechazo determinista de la siguiente operación, reinicio del flag y del array en memoria para `beforeEach`, y mensaje de degradación no bloqueante; no reexportar estos helpers desde `src/features/expenses/index.ts`.
- [X] T010 [P] Crear `src/features/expenses/api/expenses.api.test.ts` (prueba de módulo, sin DOM) verificando latencia observable, persistencia en `expenses.v1`, validación de `Expense.concept`/`Expense.amount` según `data-model.md`, borrado por id inexistente, inyección de fallo con `setExpenseRepositoryFailure(true)` y señal de almacenamiento degradado.
- [X] T011 Implementar `filterExpensesByCategory` y `calculateExpenseSummary` en `src/features/expenses/utils/expenseCalculations.ts`: ordenación descendente por `Expense.date` (FR-002, R-004), filtrado según `ExpenseFilter` (`'all'` devuelve todo) y cálculo de `ExpenseSummary.total` y `ExpenseSummary.count` siempre sobre el conjunto filtrado, según `data-model.md`.
- [X] T012 [P] Crear `src/features/expenses/utils/expenseCalculations.test.ts` con casos de filtrado para cada categoría y para `'all'`, resumen sobre los gastos visibles y ordenación por fecha, incluido el desempate de gastos del mismo día.
- [X] T013 Implementar `useExpenses` en `src/features/expenses/hooks/useExpenses.ts`: `useQuery` con `queryKey: ['expenses']` sobre `listExpenses` y dos `useMutation` (crear y eliminar) que invalidan `['expenses']` en `onSuccess`, exponiendo estados `isPending`/`isError` y la función de reintento de la query (R-007, principio V de la constitución).
- [X] T014 Checkpoint Fase 2: ejecutar `pnpm run typecheck`, `pnpm run lint` y `pnpm test` sobre `src/features/expenses/types/`, `api/`, `hooks/` y `utils/`, corrigiendo cualquier fallo antes de iniciar los componentes.

**Checkpoint**: Repositorio y hooks listos; los quality gates siguen en verde. A partir de aquí las user stories pueden implementarse en paralelo.

---

## Phase 3: Componentes UI y barrel file `index.ts`

**Purpose**: Interfaces observables de `contracts/expenses-ui.md`, accesibilidad básica WCAG 2.1 AA e iconos exclusivamente de `lucide-react`.

- [X] T015 [P] [US1] Implementar `ExpenseForm` en `src/features/expenses/components/ExpenseForm.tsx`: campos etiquetados «Concepto», «Importe (€)» y «Categoría» con «Otros» como valor inicial según `CreateExpenseInput.category`, botón «Añadir gasto», validación visible con `role="alert"` de `CreateExpenseInput.concept` y `CreateExpenseInput.amount` según `data-model.md`, conservar los datos si falla la mutación y limpiar el formulario solo tras éxito; deshabilitar el botón mientras la mutación está en curso (FR-020).
- [X] T016 [P] [US1] Implementar `ExpenseList` en `src/features/expenses/components/ExpenseList.tsx`: mostrar cada `Expense` con concepto, importe formateado, categoría y fecha `DD/MM/YYYY` (FR-001), orden descendente por `Expense.date`, estado vacío informativo, indicador `role="status"` con «Cargando gastos…» durante la query y un botón accesible «Eliminar gasto» por fila con icono de `lucide-react` marcado `aria-hidden="true"` (preparado para US4).
- [X] T017 [P] [US2] Implementar `ExpenseFilters` en `src/features/expenses/components/ExpenseFilters.tsx`: control etiquetado «Filtrar por categoría» con la opción «Todas» y las cinco categorías de `ExpenseCategory`, operable por teclado y tipado con `ExpenseFilter` (`'all'` para «Todas»).
- [X] T018 [P] [US2] Implementar `ExpenseSummary` en `src/features/expenses/components/ExpenseSummary.tsx`: mostrar `ExpenseSummary.total` mediante `formatCurrency` y `ExpenseSummary.count` como «N movimiento»/«N movimientos», calculados sobre los gastos filtrados recibidos como props.
- [X] T019 [US1] Implementar `ExpensesDashboard` en `src/features/expenses/components/ExpensesDashboard.tsx`: componente sin props que compone `ExpenseForm`, `ExpenseFilters`, `ExpenseSummary` y `ExpenseList`, mantiene el filtro en estado local inicializado a `'all'` (no persistido, FR-013), deriva los gastos visibles con `expenseCalculations`, obtiene el resumen con `calculateExpenseSummary` y conecta la mutación de registro usando `useExpenses`.
- [X] T020 [US3] Ampliar `src/features/expenses/components/ExpensesDashboard.tsx` (mismo archivo que T019, secuencial) con el feedback de operaciones: indicador `role="status"` «Cargando gastos…», mensajes comprensibles con `role="alert"` y reintento sin perder los datos introducidos ante fallo de consulta o registro, y aviso no bloqueante `role="status"` con el resultado de `getExpenseStorageWarning`.
- [X] T021 [US4] Ampliar `src/features/expenses/components/ExpensesDashboard.tsx` (mismo archivo que T020, secuencial) con la mutación de eliminación por `Expense.id`: deshabilitar el botón de eliminar mientras su mutación está en curso (FR-020), mostrar error con reintento si falla y dejar que la invalidación de `['expenses']` recalcule listado y resumen.
- [X] T022 Crear el barrel público `src/features/expenses/index.ts` exportando `ExpensesDashboard` y los tipos `Expense`, `ExpenseCategory`, `CreateExpenseInput` y `ExpenseFilter` según `contracts/expenses-ui.md`, sin reexportar los helpers internos de fallo ni la API.
- [X] T023 Checkpoint Fase 3: ejecutar `pnpm run typecheck`, `pnpm run lint` y `pnpm test` sobre `src/features/expenses/components/` e `index.ts`, confirmando que no aparecen violaciones de `boundaries/element-types` ni de `boundaries/no-private` y corrigiendo cualquier fallo antes de integrar en `src/app/`.

**Checkpoint**: La feature completa es funcional de forma aislada. Todavía no está montada en la aplicación y su comportamiento de extremo a extremo no está verificado con `user-event`.

---

## Phase 4: Integración en `src/app/` y suite completa con `@testing-library/user-event`

**Purpose**: Montaje de la SPA, prueba de humo del provider y cobertura automatizada de los cuatro stories con interacción realista de usuario.

- [X] T024 Integrar `src/app/App.tsx`: crear un `QueryClient`, envolver la vista en `QueryClientProvider`, importar `@/app/index.css` para aplicar Tailwind CSS y renderizar `<ExpensesDashboard />` importado exclusivamente desde `@/features/expenses`, sin modificar `eslint.config.js`.
- [X] T025 [P] Crear `src/app/App.test.tsx` como prueba de humo: montar `App` y comprobar que el `QueryClientProvider` y el dashboard renderizan sus controles accesibles, usando `userEvent.setup()` para una interacción mínima.
- [X] T026 [US1] Crear `src/features/expenses/components/ExpensesDashboard.test.tsx` con el montaje común (`QueryClientProvider` con `retry: false`, `localStorage.clear()` y `resetExpenseRepository()` en `beforeEach`, `userEvent.setup()` en cada test) y cubrir US1: carga inicial y estado vacío con resumen `0,00 €`/`0 movimientos`, registro de «Café» con importe `3.50` en Alimentación mostrando concepto, `3,50 €`, categoría y fecha `DD/MM/YYYY`, nuevo gasto primero, resumen actualizado, y rechazo con `role="alert"` de concepto vacío/espacios y de importe vacío, texto, `0`, negativo o `1.234`; comprobar además el valor por defecto `Otros` de `CreateExpenseInput.category` según `data-model.md`.
- [X] T027 [US2] Ampliar `src/features/expenses/components/ExpensesDashboard.test.tsx` (mismo archivo que T026, secuencial) con US2: gastos de varias categorías, filtrar por Transporte mostrando solo esos gastos, «Todas» restaurando el conjunto completo, resumen calculado únicamente sobre los visibles y filtro sin coincidencias con estado vacío y `0,00 €`/`0 movimientos`.
- [X] T028 [US3] Ampliar `src/features/expenses/components/ExpensesDashboard.test.tsx` (mismo archivo que T027, secuencial) con US3: persistencia tras desmontar y remontar el dashboard con el mismo `localStorage`, indicador «Cargando gastos…» con `role="status"` durante la query, `setExpenseRepositoryFailure(true)` produciendo error con `role="alert"` y reintento que conserva los datos del formulario, y aviso de almacenamiento degradado con `role="status"` sin bloquear la vista.
- [X] T029 [US4] Ampliar `src/features/expenses/components/ExpensesDashboard.test.tsx` (mismo archivo que T028, secuencial) con US4: pulsar «Eliminar gasto» y verificar que desaparece y el resumen disminuye, eliminar el único gasto visible bajo un filtro activo → estado vacío, y fallo inyectado en la eliminación → el gasto permanece y aparece error con opción de reintento; verificar que el botón se deshabilita mientras la mutación está en curso.
- [X] T030 Checkpoint final: ejecutar `pnpm run typecheck`, `pnpm run lint`, `pnpm test` y `pnpm run build` desde la raíz, y validar los nueve escenarios de `specs/001-expense-manager/quickstart.md` antes de dar la feature por cerrada.

**Checkpoint**: Los cuatro stories son funcionales, independientemente verificables y la suite completa pasa con los tres quality gates obligatorios.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Fase 1 → Fase 2 → Fase 3 → Fase 4**: secuenciales. Cada checkpoint debe estar en verde antes de iniciar la fase siguiente.
- **Fase 2 bloquea la Fase 3**: los componentes consumen los tipos, la API simulada, las utilidades de cálculo y los hooks.
- **Fase 4 bloquea el cierre**: sin integración en `src/app/` y sin suite con `user-event` la feature no se considera terminada.

### User Story Dependencies

- **US1 (P1, MVP)**: T015, T016, T019, T026. Depende de las Fases 1 y 2; no depende de otros stories.
- **US2 (P2)**: T017, T018, T027. Depende de la Fase 2 y del dashboard de US1 (T019) para filtrar el conjunto registrado.
- **US3 (P2)**: T020, T028. Depende de la Fase 2 y del dashboard de US1 (T019); usa los helpers de fallo implementados en T009.
- **US4 (P3)**: T016 (botón de eliminación), T021, T029. Depende de US1 porque necesita gastos que listar y de la Fase 2 porque usa la mutación de `deleteExpense`.

### Within Each User Story

1. Tipos y utilidades de la Fase 2 ya disponibles.
2. Componentes marcados [P] se implementan primero y en paralelo cuando sea posible.
3. `ExpensesDashboard` integra los componentes del story (T019 → T020 → T021, secuenciales por ser el mismo archivo).
4. Las pruebas en `ExpensesDashboard.test.tsx` se amplían en orden T026 → T027 → T028 → T029 (mismo archivo, no paralelizables entre sí).
5. Ningún story se cierra sin `pnpm run typecheck`, `pnpm run lint` y `pnpm test` en verde.

---

## Parallel Examples

### Parallel Example: US1

```bash
# Tras la Fase 2, implementar en paralelo (archivos distintos):
Task: T015 [US1] ExpenseForm en src/features/expenses/components/ExpenseForm.tsx
Task: T016 [US1] ExpenseList en src/features/expenses/components/ExpenseList.tsx

# Después, secuencial: T019 (dashboard) → T026 (tests de US1 en Fase 4).
```

### Parallel Example: US2

```bash
# Tras T019, implementar en paralelo (archivos distintos):
Task: T017 [US2] ExpenseFilters en src/features/expenses/components/ExpenseFilters.tsx
Task: T018 [US2] ExpenseSummary en src/features/expenses/components/ExpenseSummary.tsx

# Después: T027 (tests de US2), secuencial tras T026.
```

### Parallel Example: US3

```bash
# T020 (estados de carga/error en ExpensesDashboard) puede implementarse
# en cuanto T019 termine, sin esperar a T017/T018.
Task: T020 [US3] src/features/expenses/components/ExpensesDashboard.tsx

# La prueba T028 depende de T020 y del archivo de tests creado en T026.
```

### Parallel Example: US4

```bash
# T021 puede implementarse en cuanto T020 termine; T016 ya expone el botón.
Task: T021 [US4] src/features/expenses/components/ExpensesDashboard.tsx

# La prueba T029 depende de T021 y de la suite montada en T026.
```

### Paralelía adicional entre fases

- Fase 1: T002, T003, T004 y T005 son paralelizables (archivos distintos).
- Fase 2: T010 y T012 son paralelizables entre sí una vez implementados T008/T009 y T011.
- Fase 4: T025 (`src/app/App.test.tsx`) es paralelizable con T026 (`ExpensesDashboard.test.tsx`, archivo distinto).

---

## Implementation Strategy

### MVP First (Fase 1 + Fase 2 + US1)

1. Completar Fase 1 (prerrequisitos y utilidades comunes) y verificar quality gates.
2. Completar Fase 2 (tipos, API simulada, cálculos y hooks) y verificar quality gates: es un bloqueo para todo lo demás.
3. Completar US1: T015, T016, T019 y el bloque de tests T026 (con el montaje común de T026).
4. **STOP and VALIDATE**: ejecutar los gates y comprobar el escenario 2 de `quickstart.md`: registrar «Café» `3.50` en Alimentación y verlo con resumen `3,50 €`/`1 movimiento`.
5. Integrar en `src/app/` (T024) y mostrar el MVP si se quiere una demo anticipada.

### Incremental Delivery

1. Fases 1 y 2 → base lista.
2. US1 → MVP funcional y testeable.
3. US2 → filtrado y resumen sobre visibles; verificar de forma independiente con T027.
4. US3 → persistencia y feedback de carga/error/reintento; verificar con T028.
5. US4 → eliminación; verificar con T029.
6. Cada incremento conserva los anteriores en verde; T030 valida la feature completa y el build.

### Parallel Team Strategy

Con varias personas, tras completar juntas las Fases 1 y 2:

- Desarrollador A: US1 (T015, T016, T019) y suite base T026.
- Desarrollador B: US2 (T017, T018) y T027.
- Desarrollador C: US3 (T020) y T028; después US4 (T021) y T029.
- La integración T024 y la prueba de humo T025 pueden avanzar en paralelo con los stories siempre que el barrel T022 ya exista.

---

## Notes

- `[P]` implica archivos distintos y ninguna dependencia de una tarea incompleta; no marcar así T019/T020/T021 ni T026-T029 porque comparten archivo.
- La etiqueta `[Story]` solo aparece en tareas de UI y tests; setup, foundational, barrel e integración no la llevan.
- `data-model.md` es la fuente canónica de las restricciones de campos; las tareas T007, T008, T011, T015, T020 y T026 las citan explícitamente en lugar de duplicarlas.
- No se añaden dependencias, no se usa `eslint-disable` y no se modifica `eslint.config.js` (constitución, principios I, III y VI).
- Comandos de verificación obligatorios tras cada fase: `pnpm run typecheck`, `pnpm run lint`, `pnpm test` (y `pnpm run build` en el checkpoint final).
