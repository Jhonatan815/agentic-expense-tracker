# Research: Gestor de Gastos Personales (expenses)

**Feature**: `001-expense-manager` | **Fecha**: 2026-11-21

## Decisiones

### R-001: Latencia artificial de ~250 ms

- **Decision**: El repositorio simulado espera ~250 ms (`await new Promise(r => setTimeout(r, 250))`) antes de resolver cada operación de lectura, creación y eliminación.
- **Rationale**: Cumple SC-005 (feedback de carga en <1 s y finalización en <3 s) y mantiene el estado de carga observable sin ralentizar las pruebas ni el uso real. La mención del spec a «aproximadamente 1 segundo» se interpreta como cota superior de latencia perceptible, no como valor obligatorio.
- **Alternatives considered**: 1 s literal (empeora SC-001 y hace las pruebas lentas); 0 ms (oculta los estados de carga exigidos por FR-018).

### R-002: Fallos solo inyectables desde pruebas

- **Decision**: `expenses.api.ts` expone un helper de prueba (no reexportado por `index.ts`) que permite forzar el rechazo de la siguiente operación. En ejecución normal el repositorio nunca falla aleatoriamente.
- **Rationale**: Materializa la aclaración de la sesión 2026-11-21 y hace deterministas los escenarios de error/reintento de US3 y US4 sin controles visibles para el usuario.
- **Alternatives considered**: Fallo aleatorio porcentual (pruebas flaky); toggle de depuración en la UI (fuera de alcance); `vi.mock` del módulo completo (acopla las pruebas a la forma del módulo y es más frágil que un simple helper).

### R-003: Persistencia y degradación

- **Decision**: Clave única `expenses.v1` en `localStorage` con un array JSON de gastos. Si `localStorage` no está disponible o el JSON es ilegible, el repositorio usa un array en memoria para la sesión y expone una señal de advertencia que el dashboard muestra de forma no bloqueante.
- **Rationale**: Implementa FR-017 y la aclaración sobre almacenamiento no disponible; el usuario conserva la funcionalidad aunque no haya persistencia.
- **Alternatives considered**: Pantalla de error bloqueante (impide usar la feature); silenciar el problema (contradice la aclaración); limpiar datos automáticamente sin aviso (pierde información del usuario).

### R-004: Identidad y ordenación de gastos

- **Decision**: `id` generado con `crypto.randomUUID()`. El campo `date` almacena un ISO 8601 completo (fecha y hora locales serializadas). La presentación usa `formatDate` (DD/MM/YYYY) y la ordenación es descendente por `date`, lo que sitúa primero el gasto recién creado incluso cuando varios comparten día.
- **Rationale**: Cubre FR-002, FR-008 y el escenario US1.2 sin añadir un campo `createdAt` redundante.
- **Alternatives considered**: Solo `YYYY-MM-DD` (no desempata gastos del mismo día); índices del array como id (se invalidan tras eliminar).

### R-005: Formato de fecha DD/MM/YYYY

- **Decision**: `src/common/utils/formatDate.ts` devuelve `DD/MM/YYYY` (p. ej., `21/11/2026`) mediante `Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })`.
- **Rationale**: Aplica la aclaración de la sesión 2026-11-21 y coincide con el idioma de la interfaz.
- **Alternatives considered**: ISO `YYYY-MM-DD` (rechazado por el usuario en clarify); formato relativo «Hoy/Ayer» (no cubre todas las fechas).

### R-006: Moneda: entrada con punto, salida en es-ES

- **Decision**: El formulario acepta y valida decimales con punto (`3.50`); `formatCurrency.ts` muestra `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })` (p. ej., `3,50 €`).
- **Rationale**: Concilia la suposición del spec («separador decimal por punto») con los ejemplos aceptados («3,50 €»): el punto aplica a la entrada y la presentación usa el locale de la interfaz. FR-007 solo exige símbolo € y dos decimales.
- **Alternatives considered**: `en-US` (`€3.50`, contradice los ejemplos del spec); punto también en pantalla (contradice los escenarios de aceptación).

### R-007: Estado asíncrono con TanStack Query

- **Decision**: Un `QueryClient` creado en `src/app/App.tsx` y provisto mediante `QueryClientProvider`. `useExpenses` usa `useQuery` con `queryKey: ['expenses']` y dos `useMutation` (crear/eliminar) que invalidan esa clave en `onSuccess`. El filtro y el resumen son estado derivado local, no estado del servidor.
- **Rationale**: Cumple el principio V de la constitución; la invalidación por `queryKey` garantiza que listado y resumen se recalculen juntos tras cada mutación (FR-010, FR-012).
- **Alternatives considered**: `useState` + `useEffect` para la carga (prohibido por la constitución); mantener el resumen en caché separada (riesgo de desincronización con el filtro).

### R-008: Utilidades de cálculo puras

- **Decision**: `expenseCalculations.ts` expone `filterExpensesByCategory(expenses, filter)` y `calculateExpenseSummary(expenses)` (devuelve `{ total, count }`). El resumen se calcula siempre sobre el resultado del filtro activo.
- **Rationale**: Funciones puras, fácilmente testeables y reutilizables; implementan FR-014 a FR-016 y SC-004.
- **Alternatives considered**: Calcular totales dentro de los componentes (acopla lógica de dominio a la UI y dificulta las pruebas unitarias).

### R-009: Herramientas de prueba disponibles

- **Decision**: Las pruebas usan `vitest`, `@testing-library/react`, `@testing-library/jest-dom` y `@testing-library/user-event` (ya declarado en `devDependencies`). Las pruebas de integración y de componentes crean la instancia con `userEvent.setup()` en cada test; las pruebas unitarias de utilidades siguen siendo puras y sin DOM.
- **Rationale**: `userEvent.setup()` simula interacción real (incluye foco, teclado y secuencias de eventos), lo que da mejor cobertura de los flujos de US1-US4 y de la accesibilidad de SC-008 que `fireEvent`. La dependencia ya está instalada, por lo que no se infringe la constitución; `jsdom` está configurado en `vite.config.ts` y `src/app/test-setup.ts` importa `jest-dom`.
- **Alternatives considered**: `fireEvent` de React Testing Library (más simple, pero simula eventos aislados sin el comportamiento realista de usuario); tests de solo lógica sin renderizado (no cubren los flujos de US1-US4); añadir otra librería de interacción (innecesaria y no declarada).

### R-010: Compatibilidad con eslint-plugin-boundaries

- **Decision**: No modificar `eslint.config.js`. El código respeta la dirección permitida: `app` importa la feature solo desde `@/features/expenses`; los archivos internos de la feature usan rutas relativas dentro de su propia feature; `features` y `app` importan utilidades desde `@/common/...`.
- **Rationale**: Se verificó con una prueba temporal de ESLint sobre la estructura planificada: no se producen errores de `boundaries/element-types` ni de `boundaries/no-private`. El plugin emite advertencias de deprecated rule, pero no errores. La constitución prohíbe relajar la configuración para permitir importaciones entre capas.
- **Alternatives considered**: Cambiar los patrones de elementos a `src/app`, `src/features/*`, `src/common` (sería una corrección de configuración, pero innecesaria y explícitamente evitada para no tocar las reglas); usar `eslint-disable` (prohibido por la constitución).

### R-011: Accesibilidad mínima

- **Decision**: Todos los campos tienen `<label>` asociado, los botones son alcanzables por teclado con foco visible, y los errores de validación y de operación se renderizan con `role="alert"`/`aria-live="polite"`.
- **Rationale**: Materializa SC-008 (criterios básicos de WCAG 2.1 AA) sin añadir dependencias de auditoría.
- **Alternatives considered**: Solo atributos `aria-label` sin etiquetas visibles (peor usabilidad); omitir anuncios de error (incumple la aclaración).

## Resultado

No quedan `NEEDS CLARIFICATION` en el Technical Context. Todas las decisiones están acotadas a dependencias ya declaradas en `package.json`.
