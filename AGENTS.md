# AGENTS.md — Constitución del Proyecto (`agentic-expense-tracker`)

## Stack y Herramientas

- **Gestor de paquetes:** `pnpm` (nunca usar `npm` ni `yarn`).
- **Frontend:** React + TypeScript (`tsc --noEmit`), Vite, Tailwind CSS (`@tailwindcss/vite`), `@tanstack/react-query`, `lucide-react`.
- **Testing:** Vitest (`pnpm test`) y `@testing-library/react`.
- **Lint y Fronteras:** ESLint con `eslint-plugin-boundaries`, Husky y `lint-staged`.

## Arquitectura Modular Obligatoria

La carpeta `src/` solo puede contener estas tres capas:

- `src/app/`: inicialización global, providers (ej. `QueryClientProvider`), estilos base (`index.css`), setup de tests (`test-setup.ts`) y shell principal.
- `src/common/`: utilidades y componentes compartidos transversales (`components/`, `utils/`). Sin lógica de dominio específica.
- `src/features/<feature-name>/`: módulos aislados por dominio de negocio. Cada feature debe exponer su API pública exclusivamente mediante `index.ts` y nunca importar archivos privados de otras features.

## Flujo Spec-Driven (Spec Kit + OpenCode)

1. Las especificaciones, planes y tareas de cada feature se gestionan mediante los comandos `/speckit.*` y se almacenan en `specs/` (y `.specify/memory/constitution.md`).
2. **Orden estricto:** `constitution` (principios) -> `specify` (requisitos) -> `clarify` (dudas) -> `plan` (arquitectura) -> `tasks` (desglose) -> `implement` (código + tests).
3. **Sin alucinaciones de librerías:** Usa solo dependencias instaladas en `package.json` (`@tanstack/react-query`, `lucide-react`, etc.). Para iconos, usa siempre `lucide-react`.
4. **Prohibiciones:**
   - No crees carpetas fuera de `src/app`, `src/common` y `src/features`.
   - No saltes reglas de `eslint-plugin-boundaries` ni uses `eslint-disable`.
   - No des una tarea por cerrada si fallan `typecheck`, `lint` o `test`.

## Verificación Obligatoria antes de Finalizar

Ejecuta y asegúrate de que pasan sin errores:

- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm test`
