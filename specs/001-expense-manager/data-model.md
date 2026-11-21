# Data Model: Gestor de Gastos Personales (expenses)

**Feature**: `001-expense-manager` | **Fecha**: 2026-11-21

## Entidades

### Expense (Gasto)

Movimiento económico registrado por la persona usuaria.

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `id` | `string` | Sí | UUID generado con `crypto.randomUUID()`. Identifica el gasto para eliminarlo. |
| `concept` | `string` | Sí | Concepto no vacío después de recortar espacios. |
| `amount` | `number` | Sí | Importe positivo en euros, con hasta dos decimales. |
| `category` | `ExpenseCategory` | Sí | Una de las cinco categorías permitidas. |
| `date` | `string` | Sí | ISO 8601 completo asignado automáticamente al registrar. Se usa para ordenar y, formateado, para mostrar. |

**Reglas de validación**

- `concept.trim().length > 0`; en caso contrario se rechaza con mensaje visible (FR-004).
- `Number.isFinite(amount) && amount > 0`; en caso contrario se rechaza con mensaje visible (FR-005).
- `Math.round(amount * 100) === amount * 100` (tolerancia de coma flotante); más de dos decimales se rechaza (FR-006).
- `date` no es editable y se genera en el momento del registro (FR-008).
- Si no se elige categoría, se aplica `Otros` (FR-009).

### ExpenseCategory

Unión string: `'Alimentación' | 'Transporte' | 'Ocio' | 'Hogar' | 'Otros'`.

No se permiten categorías personalizadas en esta versión.

### CreateExpenseInput

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `concept` | `string` | Sí | Se valida y se recorta antes de persistir. |
| `amount` | `number` | Sí | Se valida antes de persistir. |
| `category` | `ExpenseCategory` | No | Por defecto `Otros`. |

### ExpenseFilter

Unión string: `'all' | ExpenseCategory`. `'all'` equivale a «Todas».

Estado transitorio de la vista: se reinicia a `'all'` al recargar (FR-013, aclaración 2026-11-21). No se persiste.

### ExpenseSummary

| Campo | Tipo | Descripción |
|---|---|---|
| `total` | `number` | Suma de los importes de los gastos visibles. |
| `count` | `number` | Número de gastos visibles. |

Se deriva siempre del conjunto filtrado; nunca se persiste (FR-015, FR-016, SC-004).

## Persistencia

- **Clave**: `expenses.v1` en `localStorage`.
- **Formato**: array JSON de `Expense`.
- **Lectura**: si la clave no existe se devuelve `[]`.
- **Degradación**: si `localStorage` es inaccesible o el JSON no es un array de gastos válido, se usa un array en memoria para la sesión y se muestra una advertencia no bloqueante (aclaración 2026-11-21).
- **Escritura**: tras crear o eliminar, se serializa el array completo.

## Relaciones y ciclo de vida

```text
CreateExpenseInput ──(validar + asignar id/date)──> Expense ──> localStorage
        │                                             │
        │                                             ├──(filtrar)──> Expense[] visible
        │                                             │                    │
        │                                             │                    └──(calcular)──> ExpenseSummary
        │                                             └──(eliminar por id)──> sin gasto
        └── categoría ausente ──> Otros
```

- No existe edición de gastos (fuera de alcance).
- No hay estados de aprobación ni transiciones adicionales.
- Tras cualquier mutación correcta se invalida la query `['expenses']` y se vuelve a leer el repositorio.

## No incluido en este modelo

- Usuarios, autenticación, sincronización entre dispositivos, presupuestos, informes avanzados ni exportación (fuera de alcance del spec).
