<!--
  SYNC IMPACT REPORT
  ------------------
  Version change: sin versión ratificada (plantilla sin resolver) → 1.0.0
  Modified principles:
    - Plantilla P1 → I. Uso Exclusivo de pnpm
    - Plantilla P2 → II. Arquitectura Modular Estricta
    - Plantilla P3 → III. Fronteras de Código Inquebrantables
    - Plantilla P4 → IV. TypeScript Estricto Obligatorio
    - Plantilla P5 → V. Estado Asíncrono con TanStack Query
    - Nuevo → VI. Iconografía con lucide-react
    - Nuevo → VII. Verificación Obligatoria antes de Cerrar Tareas
  Added sections:
    - Stack y Restricciones Adicionales
    - Flujo de Desarrollo y Quality Gates
    - Reglas de gobierno detalladas (enmiendas, versionado, cumplimiento)
  Removed sections: Ninguna
  Deferred TODOs: Ninguno
  Nota: este reporte es temporal; eliminarlo antes de hacer commit de la
  constitución enmendada.
-->

# agentic-expense-tracker Constitution

## Core Principles

### I. Uso Exclusivo de pnpm
Toda operación de gestión de dependencias y ejecución de scripts MUST realizarse
con `pnpm`. `npm` y `yarn` están prohibidos para instalar, actualizar o ejecutar
dependencias, incluyendo hooks, CI y documentación.

**Rationale:** Un único gestor garantiza un lockfile determinista, instalaciones
reproducibles y evita discrepancias entre entornos locales y de CI.

### II. Arquitectura Modular Estricta
`src/` MUST contener únicamente tres capas: `src/app/`, `src/common/` y
`src/features/<feature-name>/`. No se permite crear carpetas fuera de ellas.

- `src/app/`: inicialización global, providers (p. ej. `QueryClientProvider`),
  estilos base (`index.css`), setup de tests (`test-setup.ts`) y shell principal.
- `src/common/`: utilidades y componentes compartidos transversales
  (`components/`, `utils/`), sin lógica de dominio específica.
- `src/features/<feature-name>/`: módulos aislados por dominio de negocio. Cada
  feature MUST exponer su API pública exclusivamente mediante su barrel file
  `index.ts` y MUST NOT importar archivos privados de otras features.

**Rationale:** El aislamiento por dominio evita acoplamiento invisible y hace que
los límites entre módulos sean explícitos, auditables y verificables.

### III. Fronteras de Código Inquebrantables
Las reglas de `eslint-plugin-boundaries` MUST cumplirse en todo el código. Está
prohibido usar `eslint-disable` (o mecanismos equivalentes) para saltárselas, así
como relajar la configuración para permitir importaciones entre capas o features.

**Rationale:** Las fronteras solo protegen la arquitectura si el linter las aplica
sin excepciones; una sola excepción silenciosa invalida toda la garantía.

### IV. TypeScript Estricto Obligatorio
Todo código fuente MUST estar escrito en TypeScript con las opciones estrictas
del compilador activadas. `pnpm run typecheck` (`tsc --noEmit`) MUST pasar sin
errores en cualquier cambio.

**Rationale:** La verificación estática rigurosa detecta defectos antes de la
ejecución y documenta los contratos entre módulos; es la base de la arquitectura
modular.

### V. Estado Asíncrono con TanStack Query
Todo estado asíncrono (obtención de datos, caché, revalidación y mutaciones)
MUST gestionarse con `@tanstack/react-query`, con un `QueryClientProvider`
configurado en `src/app/`.

**Rationale:** Centralizar la lógica de comunicación con el servidor evita
condiciones de carrera y estados duplicados, y hace predecible la invalidación
de caché.

### VI. Iconografía con lucide-react
Todos los iconos MUST importarse de `lucide-react`. No se introducen otras
librerías de iconos ni dependencias no declaradas en `package.json`.

**Rationale:** Un único conjunto de iconos garantiza consistencia visual y evita
dependencias inventadas que no forman parte del stack del proyecto.

### VII. Verificación Obligatoria antes de Cerrar Tareas
Ninguna tarea puede darse por cerrada sin ejecutar y superar sin errores estos
tres comandos: `pnpm run typecheck`, `pnpm run lint` y `pnpm test` (Vitest). Si
alguno falla, la tarea MUST permanecer abierta hasta corregirse.

**Rationale:** Estos comandos definen "terminado"; ejecutarlos de forma
consistente impide que regresiones de tipos, fronteras o comportamiento lleguen
a la rama principal.

## Stack y Restricciones Adicionales
- Frontend: React + TypeScript, Vite y Tailwind CSS (`@tailwindcss/vite`).
- Testing: Vitest y `@testing-library/react` (comando `pnpm test`).
- Lint y hooks: ESLint con `eslint-plugin-boundaries`, Husky y `lint-staged`.
- Se usan únicamente dependencias instaladas y declaradas en `package.json`;
  está prohibido incorporar librerías sin verificar que ya están disponibles.
- El flujo spec-driven es obligatorio y sigue este orden estricto:
  `constitution` → `specify` → `clarify` → `plan` → `tasks` → `implement`.
- Las especificaciones, planes y tareas se almacenan en `specs/`; la constitución
  vive en `.specify/memory/constitution.md`.

## Flujo de Desarrollo y Quality Gates
- Las verificaciones del principio VII se ejecutan siempre con `pnpm` y son
  requisito de aceptación para cualquier cambio de código, incluidos refactors.
- Los hooks de `lint-staged` ejecutan `eslint --fix` sobre `src/**/*.{ts,tsx}`;
  no sustituyen a la ejecución completa de `pnpm run lint`.
- Toda revisión MUST comprobar el cumplimiento de los siete principios. Cualquier
  excepción MUST documentarse y aprobarse como enmienda a esta constitución.

## Governance
Esta constitución prevalece sobre cualquier otra práctica o convención del
repositorio. `AGENTS.md` actúa como espejo operativo y no puede contradecirla.

**Enmiendas:** Toda propuesta de cambio MUST documentar el motivo, enumerar los
principios o secciones afectados e incluir un Sync Impact Report. Las enmiendas
se revisan y aprueban antes de aplicarse; cualquier migración de código
necesaria MUST planificarse dentro del ciclo `/speckit.*` correspondiente.

**Versionado:** Se aplica SemVer a la gobernanza: MAJOR para eliminación o
redefinición incompatible de principios; MINOR para principios o secciones
nuevos y ampliación material de las guías; PATCH para aclaraciones y correcciones
sin cambio semántico.

**Revisión de cumplimiento:** Cada PR y cada cierre de tarea MUST verificar los
principios y los quality gates. La complejidad adicional MUST justificarse por
escrito en el plan; no se aceptan excepciones implícitas a las fronteras ni a
las verificaciones.

**Version**: 1.0.0 | **Ratified**: 2026-11-20 | **Last Amended**: 2026-11-20
