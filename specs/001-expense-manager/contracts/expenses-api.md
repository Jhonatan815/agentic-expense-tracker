# Contract: Repositorio asíncrono de gastos

**Feature**: `001-expense-manager` | **Ruta**: `src/features/expenses/api/expenses.api.ts`

Este contrato describe la interfaz interna de la feature. No es una API HTTP ni pública fuera del módulo `expenses`.

## Funciones

```ts
listExpenses(): Promise<Expense[]>
createExpense(input: CreateExpenseInput): Promise<Expense>
deleteExpense(id: string): Promise<void>
```

### `listExpenses`

- Devuelve todos los gastos persistidos, sin filtrar ni ordenar (el orden lo aplica la capa de presentación).
- Si no hay datos, devuelve `[]`.
- Resuelve tras ~250 ms de latencia artificial (R-001).

### `createExpense`

- Valida `concept` y `amount` según `data-model.md`; si la validación falla, rechaza con un `Error` cuyo mensaje explica el motivo.
- Asigna `id` con `crypto.randomUUID()`, `date` con la fecha/hora actual y `category = input.category ?? 'Otros'`.
- Persiste el array resultante y devuelve el gasto creado.
- Resuelve tras ~250 ms.

### `deleteExpense`

- Elimina el gasto con el `id` indicado. Si no existe, no modifica el almacenamiento y resuelve normalmente.
- Persiste el array resultante.
- Resuelve tras ~250 ms.

## Fallos controlados (solo pruebas)

```ts
setExpenseRepositoryFailure(shouldFail: boolean): void
resetExpenseRepository(): void
```

- `setExpenseRepositoryFailure(true)` hace que la **siguiente** llamada a `listExpenses`, `createExpense` o `deleteExpense` rechace con un `Error` de mensaje comprensible.
- `resetExpenseRepository()` restablece el flag y limpia el estado en memoria; se usa en `beforeEach` de las pruebas.
- Estos helpers NO se exportan desde `src/features/expenses/index.ts`: forman parte del detalle interno de la feature.
- En ejecución normal el flag permanece desactivado: no hay fallos aleatorios (aclaración 2026-11-21).

## Señal de almacenamiento degradado

```ts
getExpenseStorageWarning(): string | null
```

- Devuelve `null` cuando `localStorage` funciona con normalidad.
- Devuelve un mensaje breve cuando se usa el array en memoria por almacenamiento bloqueado o datos ilegibles.
- El dashboard muestra este mensaje sin impedir el uso de la vista.

## Garantías

| Garantía | Contrato |
|---|---|
| Latencia | ~250 ms observable en lectura, creación y eliminación |
| Determinismo | Sin azar: los fallos solo se activan desde pruebas |
| Persistencia | `localStorage['expenses.v1']` contiene un array JSON de `Expense` |
| Aislamiento | Ninguna función accede a React ni a TanStack Query |
