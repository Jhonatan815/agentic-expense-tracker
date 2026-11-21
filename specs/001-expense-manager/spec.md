# Feature Specification: Gestor de Gastos Personales (expenses)

**Feature Branch**: `001-expense-manager`

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: `Crea la especificación funcional para la feature "expenses" (gestor de gastos personales). Requisitos funcionales: 1. Listado de gastos: mostrar cada gasto con título/concepto, importe en euros (€), categoría (Alimentación, Transporte, Ocio, Hogar, Otros) y fecha. 2. Añadir gasto: formulario para registrar un nuevo gasto validando que el concepto no esté vacío y el importe sea un número positivo mayor que 0. 3. Eliminar gasto: permitir borrar un gasto existente de la lista. 4. Filtrado por categoría: permitir filtrar el listado por "Todas" o por una categoría concreta. 5. Resumen financiero: mostrar el importe total acumulado de los gastos visibles según el filtro activo y el número de movimientos. 6. Persistencia simulada asíncrona: los datos deben gestionarse mediante un servicio asíncrono simulado con latencia realista (usando localStorage por debajo para mantener datos entre recargas) con estados visibles de carga y error.`

## Clarifications

### Session 2026-11-21

- Q: ¿Cómo debe producir fallos el servicio asíncrono simulado para que los mensajes de error y los reintentos puedan validarse de forma consistente? → A: Los fallos se inyectan únicamente en las pruebas, simulando un rechazo del servicio; la aplicación real no falla de forma aleatoria.
- Q: ¿Qué debe hacer la aplicación cuando el almacenamiento del navegador no está disponible o contiene datos ilegibles? → A: Mostrar una advertencia visible y seguir funcionando en memoria durante la sesión actual.
- Q: ¿En qué formato exacto debe mostrarse la fecha de registro de cada gasto en el listado? → A: DD/MM/YYYY (p. ej., 21/11/2026).
- Q: ¿Debe recordarse el filtro de categoría activo después de recargar la página o debe reiniciarse a «Todas»? → A: Se reinicia a «Todas» en cada recarga.
- Q: ¿Qué estándar mínimo de accesibilidad deben cumplir el formulario y el listado de gastos? → A: Criterios básicos de WCAG 2.1 AA: etiquetas, operación por teclado, foco visible y anuncio de errores.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar un gasto y verlo en el listado (Priority: P1)

Como usuario personal, quiero registrar un gasto indicando concepto, importe y
categoría, y verlo de inmediato en el listado junto a su fecha, para llevar un
control claro de lo que gasto.

**Why this priority**: Es el núcleo de valor de la feature; sin registro y
consulta básicos no existe un gestor de gastos útil.

**Independent Test**: Partir de una vista sin gastos, registrar un gasto válido y
comprobar que aparece con sus cuatro datos y que el resumen pasa a 1 movimiento
con el importe correcto.

**Acceptance Scenarios**:

1. **Given** una vista sin gastos, **When** registro «Café» por 3,50 € en la
   categoría Alimentación, **Then** el gasto aparece con concepto, 3,50 €,
   Alimentación y la fecha de hoy, y el resumen muestra 3,50 € y 1 movimiento.
2. **Given** un listado con gastos existentes, **When** registro otro gasto
   válido, **Then** el nuevo gasto se muestra en la parte superior y el resumen
   incrementa el total y el número de movimientos.
3. **Given** un formulario con el concepto vacío o con un importe que no sea un
   número positivo mayor que 0, **When** intento registrar, **Then** no se añade
   ningún gasto y veo un mensaje que explica el error.

---

### User Story 2 - Filtrar por categoría y entender el resumen (Priority: P2)

Como usuario, quiero filtrar el listado por «Todas» o por una categoría concreta
y ver un resumen que solo considere los gastos visibles, para responder rápido a
preguntas como «cuánto he gastado en transporte».

**Why this priority**: Aporta el valor analítico de la feature una vez que ya es
posible acumular gastos.

**Independent Test**: Con gastos de varias categorías, seleccionar una categoría
y verificar que solo se muestran los gastos de esa categoría y que el resumen
coincide con ellos; al volver a «Todas», se restaura el conjunto completo.

**Acceptance Scenarios**:

1. **Given** gastos de Alimentación, Transporte y Ocio, **When** filtro por
   Transporte, **Then** solo se muestran los gastos de Transporte y el resumen
   refleja exclusivamente su total y su número de movimientos.
2. **Given** un filtro de categoría activo, **When** selecciono «Todas»,
   **Then** se muestran todos los gastos registrados y el resumen se calcula
   sobre la totalidad de ellos.
3. **Given** un filtro sin gastos coincidentes, **When** aplico ese filtro,
   **Then** veo un estado vacío informativo y el resumen marca 0 € y 0
   movimientos.

---

### User Story 3 - Confiar en la persistencia y en el feedback de operaciones (Priority: P2)

Como usuario, quiero que mis gastos sigan disponibles después de recargar la
vista y entender cuándo una operación está en curso o ha fallado, para poder
confiar en los datos que introduzco.

**Why this priority**: Sin persistencia ni estados visibles, cualquier error o
recarga genera dudas sobre si el gasto se guardó.

**Independent Test**: Registrar un gasto, recargar la vista y comprobar que
sigue visible; provocar un fallo de operación y comprobar que aparece un mensaje
de error y que se puede reintentar conservando los datos introducidos.

**Acceptance Scenarios**:

1. **Given** un gasto registrado correctamente, **When** recargo la vista,
   **Then** el gasto sigue visible con concepto, importe, categoría y fecha, y el
   resumen se recalcula con el mismo valor.
2. **Given** una operación en curso, **When** la operación todavía no ha
   terminado, **Then** veo un indicador de carga y no se acepta un segundo envío
   de registro o eliminación.
3. **Given** una operación que no puede completarse, **When** finaliza el
   intento, **Then** veo un mensaje de error comprensible, el listado permanece
   coherente y puedo reintentar sin volver a escribir los datos.

---

### User Story 4 - Eliminar un gasto (Priority: P3)

Como usuario, quiero borrar un gasto que registré por error o que ya no es
relevante, para que el listado y el resumen reflejen solo los movimientos que
deseo conservar.

**Why this priority**: Es importante para corregir la información, pero depende
de que ya existan gastos que listar y filtrar.

**Independent Test**: Con un gasto existente, eliminarlo y verificar que
desaparece del listado y que el resumen deja de contarlo.

**Acceptance Scenarios**:

1. **Given** un gasto visible, **When** lo elimino, **Then** desaparece del
   listado y el total y el número de movimientos del resumen disminuyen en
   consecuencia.
2. **Given** un filtro de categoría activo, **When** elimino el único gasto
   visible de esa categoría, **Then** aparece el estado vacío y el resumen marca
   0 € y 0 movimientos.
3. **Given** una eliminación que falla, **When** finaliza el intento, **Then**
   el gasto permanece en el listado y veo un mensaje de error con opción de
   reintento.

---

### Edge Cases

- El concepto contiene solo espacios o caracteres invisibles: el registro se
  rechaza como si estuviera vacío.
- El importe está vacío, es texto, es 0, es negativo o tiene más de dos
  decimales: el registro se rechaza con un mensaje específico.
- No se elige categoría al registrar: se usa «Otros» como categoría por defecto.
- No hay gastos registrados o el filtro activo no coincide con ninguno: se
  muestra el estado vacío y un resumen de 0 € y 0 movimientos.
- La operación de carga, registro o eliminación falla: se muestra el error, no
  se altera el listado y se permite reintentar.
- Se pulsa dos veces seguidas el botón de registrar o eliminar mientras la
  primera operación sigue en curso: solo se procesa una vez.
- Se recarga la vista inmediatamente después de un registro correcto: el gasto
  sigue disponible con todos sus datos.
- Se elimina el último gasto existente: el listado queda vacío y el resumen
  vuelve a 0 € y 0 movimientos.
- Los fallos de operación se provocan de forma determinista en las pruebas;
  la aplicación en uso normal no genera fallos aleatorios.
- El almacenamiento del navegador no está disponible o contiene datos
  ilegibles: se muestra una advertencia visible y la aplicación sigue
  funcionando en memoria durante la sesión actual.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar cada gasto registrado con su concepto,
  importe expresado en euros (€), categoría y fecha en formato DD/MM/YYYY
  (p. ej., 21/11/2026).
- **FR-002**: El sistema MUST presentar el listado ordenado por fecha, de más
  reciente a más antiguo.
- **FR-003**: El sistema MUST ofrecer un formulario para registrar un gasto
  indicando concepto, importe y categoría.
- **FR-004**: El sistema MUST rechazar el registro cuando el concepto esté vacío
  o contenga únicamente espacios, mostrando un mensaje que lo indique.
- **FR-005**: El sistema MUST rechazar el registro cuando el importe esté vacío,
  no sea un número, sea igual a 0 o sea negativo, mostrando un mensaje que lo
  indique.
- **FR-006**: El sistema MUST aceptar únicamente importes positivos con hasta
  dos decimales y MUST rechazar los que tengan más precisión.
- **FR-007**: El sistema MUST mostrar todos los importes con el símbolo € y dos
  decimales.
- **FR-008**: El sistema MUST asignar automáticamente la fecha del día del
  registro a cada gasto nuevo, sin exigir que el usuario la introduzca.
- **FR-009**: El sistema MUST permitir elegir la categoría entre Alimentación,
  Transporte, Ocio, Hogar y Otros, usando «Otros» como valor inicial.
- **FR-010**: Tras un registro correcto, el sistema MUST incorporar el gasto al
  listado y actualizar el resumen.
- **FR-011**: El sistema MUST permitir eliminar cualquier gasto existente del
  listado.
- **FR-012**: Tras una eliminación correcta, el sistema MUST retirar el gasto
  del listado y recalcular el resumen.
- **FR-013**: El sistema MUST ofrecer un control de filtrado con la opción
  «Todas» y una opción para cada una de las cinco categorías. El filtro
  MUST reiniciarse a «Todas» después de recargar la vista.
- **FR-014**: El sistema MUST limitar el listado a los gastos de la categoría
  seleccionada y MUST mostrar todos los gastos cuando el filtro sea «Todas».
- **FR-015**: El sistema MUST calcular el resumen únicamente sobre los gastos
  visibles después de aplicar el filtro activo.
- **FR-016**: El resumen MUST mostrar el importe total acumulado en euros y el
  número de movimientos visibles.
- **FR-017**: El sistema MUST conservar los gastos registrados entre recargas de
  la vista, sin requerir identificación del usuario ni conexión a un servidor.
- **FR-018**: Las operaciones de consulta, registro y eliminación MUST tener una
  latencia perceptible y MUST mostrar un estado de carga mientras se completan.
- **FR-019**: Si una operación no puede completarse, el sistema MUST mostrar un
  mensaje de error comprensible y permitir reintentarla sin perder los datos ya
  introducidos.
- **FR-020**: El sistema MUST impedir envíos duplicados mientras una operación
  de registro o eliminación está en curso.
- **FR-021**: Cuando no haya gastos o ninguno coincida con el filtro, el sistema
  MUST mostrar un estado vacío informativo y un resumen de 0 € y 0 movimientos.

### Key Entities *(include if feature involves data)*

- **Gasto**: movimiento económico registrado por el usuario. Atributos: concepto
  descriptivo, importe positivo en euros, categoría (Alimentación, Transporte,
  Ocio, Hogar u Otros), fecha de registro y un identificador que permite
  distinguirlo para eliminarlo.
- **Filtro de categoría**: selección activa que decide qué gastos son visibles.
  Valores posibles: «Todas» o una de las cinco categorías.
- **Resumen financiero**: resultado derivado del conjunto de gastos visibles;
  contiene el importe total acumulado y el número de movimientos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona puede registrar un gasto válido y verlo en el listado
  en menos de 30 segundos desde que abre la vista.
- **SC-002**: El 100 % de los intentos de registro con el concepto vacío o con un
  importe no positivo se rechazan con un mensaje visible y no modifican el
  listado ni el resumen.
- **SC-003**: Tras recargar la vista, el 100 % de los gastos registrados siguen
  visibles con concepto, importe, categoría y fecha correctos.
- **SC-004**: En el 100 % de los casos, el importe total y el número de
  movimientos del resumen coinciden exactamente con la suma y el recuento de los
  gastos visibles tras aplicar el filtro.
- **SC-005**: En condiciones normales, cada operación muestra feedback de carga
  en menos de 1 segundo y completa en menos de 3 segundos.
- **SC-006**: Ante un fallo de operación, el 100 % de los casos muestra un
  mensaje de error comprensible y permite reintentar sin pérdida de datos.
- **SC-007**: Al menos el 90 % de las personas que usan la vista por primera vez
  completan sin ayuda las cinco tareas principales (registrar, consultar,
  filtrar, eliminar e interpretar el resumen) en menos de 5 minutos.
- **SC-008**: El 100 % de los controles interactivos del formulario y del
  listado son operables con teclado, tienen etiqueta accesible y exponen los
  mensajes de error, conforme a los criterios básicos de WCAG 2.1 AA.

## Assumptions

- La aplicación la usa una única persona, sin cuentas de usuario ni
  autenticación; los datos permanecen en el dispositivo donde se registran.
- Dependencia de entorno: el navegador debe permitir conservar datos
  localmente entre recargas; no se requieren servicios externos de terceros.
- No existe un servicio remoto real: las operaciones se simulan con una latencia
  breve y perceptible, de aproximadamente 1 segundo, para hacer visibles los
  estados de carga y error.
- La fecha se asigna automáticamente al día del registro y no es editable en
  esta versión.
- Los importes se expresan en euros, con hasta dos decimales y separador decimal
  por punto.
- Si el usuario no elige categoría, se aplica «Otros»; no se permiten categorías
  personalizadas en esta versión.
- El listado se ordena de la fecha más reciente a la más antigua.
- La eliminación no solicita una confirmación adicional; muestra el resultado de
  la operación.
- Quedan fuera de alcance la edición de gastos, la exportación de datos, los
  presupuestos, los informes avanzados y la sincronización entre dispositivos.
