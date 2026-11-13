# SIAR — Estado del MVP

Este documento resume qué parte de los requisitos del proyecto ya está construida, comparando el documento de inicio (*Sistema Integral de Administración para Restaurantes (SIAR)*) y las *Historias de Usuario SIAR* con el código del repositorio. Cada requisito se evalúa por separado en dos partes:

- **API (backend):** endpoints, reglas de negocio, seguridad y base de datos.
- **Vista (frontend):** pantallas en React que usa el personal del restaurante.

> **Corte:** 4 de noviembre de 2026.
> Se incorporan los avances de interfaz de los módulos de mesas, reservas y pedidos, además de las vistas de menú que ya estaban construidas.

Leyenda: ✅ completo · 🟡 parcial · ❌ pendiente · ⛔ fuera del alcance actual

## 1. Resumen

**La API del MVP está construida en los módulos operativos principales.** Cubre el ciclo de pedidos y facturación: el mesero registra el pedido, cocina lo prepara, el mesero lo entrega y caja lo factura, cobra (incluso con pago mixto) y emite el comprobante. La API está protegida con inicio de sesión y permisos por rol, y se puede probar con la colección de Postman.

**En el frontend ya están construidas las vistas de categorías, productos, mesas, reservas y pedidos.** El módulo de pedidos incluye el listado, el formulario de creación y edición de detalles, y las acciones para gestionar sus estados. Todavía no hay pantalla de login, una pantalla de cocina independiente ni interfaz de caja para facturar y cobrar. Del lado de la API, siguen pendientes aspectos de gestión de usuarios, reportes y algunas validaciones señaladas en las historias de usuario.

| Módulo | API | Vistas |
|---|---|---|
| 1. Gestión de usuarios | 🟡 Login y roles; falta CRUD de usuarios | ❌ Ninguna (ni login) |
| 2. Gestión de menú | ✅ Completa (1 detalle pendiente) | 🟡 Categorías y productos, sin login |
| 3. Gestión de mesas y reservas | 🟡 CRUD listo; faltan validaciones de reservas | ✅ Mesas y reservas construidas |
| 4. Gestión de pedidos | ✅ Completa | ✅ Listado, formulario y acciones de pedidos |
| 5. Gestión de inventario | ⛔ Fuera del alcance actual | ⛔ |
| 6. Facturación | ✅ Completa en lo esencial | ❌ Ninguna |
| 7. Reportes | ❌ Pendiente | ❌ Pendiente |

**Historias de usuario (33) evaluadas por la API:** 16 completas, 8 parciales, 8 pendientes y 1 fuera de alcance (HU31, inventario).
**Por vistas:** HU08 a HU12 (menú), HU13 a HU17 (mesas y reservas) y HU18 a HU23 (pedidos) cuentan con interfaz.

### ⚠️ Bloqueo actual entre API y vistas

La API exige token JWT desde que se integró la seguridad, pero el frontend todavía no cuenta con una pantalla de login ni con el flujo completo de envío de `Authorization: Bearer <token>`. Por eso, **las vistas que consumen endpoints protegidos pueden recibir 401** mientras no se incorpore la autenticación en el frontend. La prioridad es implementar el inicio de sesión y centralizar el envío del token en las peticiones. Este bloqueo afecta la integración funcional de las vistas ya construidas, no significa que estas pantallas estén pendientes de desarrollo.

## 2. Flujo que la API ya resuelve

```
Login (JWT) ─► Mesa OCUPADA ─► Pedido PENDIENTE ─► agregar productos
            ─► enviar a cocina (EN_PREPARACION) ─► cocina: LISTO ─► mesero: ENTREGADO
            ─► caja: factura (descuento + impuesto) ─► pago mixto con cambio ─► comprobante
```

Cada paso valida el rol del usuario y el estado anterior. Por ejemplo, un cocinero no puede crear pedidos, no se puede facturar un pedido que no esté ENTREGADO y no se puede cancelar uno FACTURADO. Las interfaces de mesas, reservas y gestión de pedidos ya están construidas. Sin embargo, todavía no existe una pantalla de login, un panel de cocina independiente ni la interfaz de caja para demostrar de extremo a extremo todo el flujo desde el frontend; la API se puede probar con Postman.

## 3. Detalle por historia de usuario

La columna "Observaciones" se refiere a la API.

### Módulo 1. Gestión de usuarios

| HU | Historia | API | Vista | Observaciones |
|---|---|---|---|---|
| HU01 | Registrar usuario | ❌ | ❌ | No hay endpoint. Solo existe el admin inicial que crea el backend al arrancar y el script de usuarios de prueba. |
| HU02 | Editar usuario | ❌ | ❌ | Sin endpoint. |
| HU03 | Eliminar / desactivar usuario | ❌ | ❌ | Sin endpoint. Un usuario con `activo = false` ya no puede iniciar sesión. |
| HU04 | Asignar rol a usuario | 🟡 | ❌ | Cada usuario tiene un rol (ADMINISTRADOR, CAJERO, MESERO, COCINERO) y los permisos se aplican en toda la API, pero el rol se asigna por base de datos. |
| HU05 | Administrar catálogo de roles | 🟡 | ❌ | Roles cargados por script y tablas `PERMISO` / `ROL_PERMISO` listas; los permisos viajan en el token. No hay CRUD de roles. |
| HU06 | Iniciar sesión | ✅ | ❌ | `POST /api/auth/login` con usuario o correo, BCrypt, token JWT, mensaje de error genérico y `GET /api/auth/me`. Bloqueo por intentos fallidos (opcional) no está. |
| HU07 | Recuperar contraseña | ❌ | ❌ | Sin implementar (requiere envío de correo). |

### Módulo 2. Gestión de menú

| HU | Historia | API | Vista | Observaciones |
|---|---|---|---|---|
| HU08 | Crear productos | ✅ | ✅ | Nombre, precio y categoría obligatorios; valida precio positivo y categoría activa. |
| HU09 | Modificar productos | ✅ | ✅ | Los pedidos guardan el precio del momento, así que un cambio de precio no altera pedidos ya tomados. |
| HU10 | Eliminar productos | 🟡 | ✅ | Borrado lógico (activo/inactivo). **Falta** bloquear la baja si el producto está en un pedido activo. |
| HU11 | Categorizar productos | ✅ | ✅ | CRUD de categorías con desactivación lógica; filtro de productos por categoría. |
| HU12 | Disponibilidad en tiempo real | ✅ | 🟡 | `PATCH /api/productos/{id}/disponibilidad` (administrador o cocinero); un producto agotado no se puede agregar a un pedido. La vista cambia la disponibilidad, pero sin actualización en tiempo real en otras pantallas. |

> Las vistas del menú existen, pero su integración con la API protegida requiere implementar el inicio de sesión y el envío del token JWT (ver sección 1).

### Módulo 3. Gestión de mesas y reservas

| HU | Historia | API | Vista | Observaciones |
|---|---|---|---|---|
| HU13 | Crear mesa | ✅ | ✅ | Número no duplicado, campos obligatorios, estado inicial DISPONIBLE. La interfaz permite gestionar las mesas. |
| HU14 | Modificar mesa | ✅ | ✅ | Valida que el nuevo número no esté en uso. La interfaz incluye la gestión de los datos de las mesas. |
| HU15 | Consultar estado de mesas | ✅ | ✅ | Listado visual de mesas y consulta de su estado. |
| HU16 | Reservar mesa | 🟡 | ✅ | La interfaz permite gestionar reservas. La API cuenta con CRUD, confirmación y cancelación, con permisos por rol. **Falta** validar choques de horario y pasar la mesa a RESERVADA al confirmar. |
| HU17 | Liberar mesa | 🟡 | ✅ | La interfaz permite gestionar el estado de las mesas. **Falta** validar que el estado enviado por la API sea uno de los permitidos (hoy acepta cualquier texto). |

### Módulo 4. Gestión de pedidos

| HU | Historia | API | Vista | Observaciones |
|---|---|---|---|---|
| HU18 | Crear pedido | ✅ | ✅ | Solo en mesas OCUPADA o RESERVADA; inicia PENDIENTE y registra fecha/hora y mesero. La interfaz incluye el formulario de creación. |
| HU19 | Agregar productos | ✅ | ✅ | Cantidad y observación por producto; total automático; solo en PENDIENTE o EN_PREPARACION. La interfaz permite agregar productos al pedido. |
| HU20 | Modificar pedido | ✅ | ✅ | Editar cantidad u observación y quitar productos, solo en PENDIENTE; recalcula el total. La interfaz permite editar los detalles según el estado. |
| HU21 | Cancelar pedido | ✅ | ✅ | Estado CANCELADO, salvo si ya está FACTURADO. La interfaz incorpora la acción de cancelación. Motivo de cancelación (opcional) no está. |
| HU22 | Enviar a cocina | ✅ | ✅ | PENDIENTE → EN_PREPARACION, registra la hora de envío y desde ahí ya no se modifica. La interfaz incorpora la acción de envío a cocina. |
| HU23 | Consultar estado | ✅ | ✅ | La interfaz muestra el listado, los estados, filtros y detalles de los pedidos, e incorpora acciones para avanzar su estado. Flujo LISTO (cocina) → ENTREGADO (mesero) → FACTURADO (caja); historial de cambios (opcional) no está. No existe todavía un panel de cocina independiente. |

### Módulo 5. Gestión de inventario

| HU | Historia | API | Vista | Observaciones |
|---|---|---|---|---|
| HU31 | Reporte de consumo de inventario | ⛔ | ⛔ | El equipo dejó inventario fuera del alcance de esta fase. Por eso tampoco se cubre el objetivo OBJ-01 ni el descuento automático de insumos. |

### Módulo 6. Facturación

| HU | Historia | API | Vista | Observaciones |
|---|---|---|---|---|
| HU24 | Generar factura | ✅ | ❌ | Solo pedidos ENTREGADOS; número único y consecutivo; registra fecha, hora y cajero; incluye el detalle del pedido. |
| HU25 | Calcular impuestos | 🟡 | ❌ | Tasa configurable (8 % por defecto) sobre subtotal menos descuento, desglosada; previsualización sin guardar. **Falta** tasa distinta por producto (el modelo de datos no la tiene). |
| HU26 | Aplicar descuentos | 🟡 | ❌ | Por porcentaje o monto fijo a nivel de pedido; por encima del 20 % requiere un ADMINISTRADOR. **Falta** descuento por producto (la factura guarda un solo descuento). |
| HU27 | Registrar pago | ✅ | ❌ | Efectivo, tarjeta, transferencia o mixto; valida que cubra el total y calcula el cambio; la factura queda PAGADA. |
| HU28 | Emitir comprobante | 🟡 | ❌ | Comprobante con datos del negocio, detalle, impuestos, descuento, total y pagos, guardado como histórico. Se entrega en JSON; **falta** el PDF o envío por correo, que puede generar la vista. |

### Módulo 7. Reportes

| HU | Historia | API | Vista |
|---|---|---|---|
| HU29 | Ventas por periodo | ❌ | ❌ |
| HU30 | Productos más vendidos | ❌ | ❌ |
| HU32 | Ocupación de mesas | ❌ | ❌ |
| HU33 | Indicadores financieros | ❌ | ❌ |

Los datos necesarios (facturas, pagos, detalle de pedidos, mesas) ya se registran, así que los reportes se pueden construir sobre lo existente.

## 4. Vistas: lo que hay y lo que falta

| Vista | Estado | API que consume |
|---|---|---|
| Categorías (CRUD) | ✅ Construida (hoy recibe 401, falta el token) | `/api/categorias` ✅ |
| Productos (CRUD y disponibilidad) | ✅ Construida (hoy recibe 401, falta el token) | `/api/productos` ✅ |
| Login y manejo de sesión | ❌ | `/api/auth/login`, `/api/auth/me` ✅ |
| Mesas y reservas | ✅ Construidas (gestión de mesas y agenda/gestión de reservas) | `/api/mesas`, `/api/reservas` ✅ |
| Toma y gestión de pedidos (mesero) | ✅ Construida (listado, formulario, detalles, filtros y acciones de estado) | `/api/pedidos` ✅ |
| Pantalla de cocina independiente | ❌ | `/api/pedidos?estado=EN_PREPARACION`, `PATCH .../listo` ✅ |
| Caja: facturar, cobrar y comprobante | ❌ | `/api/facturas` ✅ |
| Gestión de usuarios | ❌ | ❌ (falta también la API) |
| Reportes / dashboard | ❌ | ❌ (falta también la API) |

Las interfaces de menú, mesas, reservas y pedidos ya están construidas. Las vistas que siguen pendientes son login, cocina independiente, caja, gestión de usuarios y reportes; en los módulos de usuarios y reportes también falta completar la API.

## 5. Requisitos no funcionales y arquitectura

| Aspecto | Estado | Detalle |
|---|---|---|
| Arquitectura en capas | ✅ | `presentacion` → `negocio` → `persistencia`, más `config`. |
| Seguridad | ✅ | Spring Security con JWT, contraseñas con BCrypt y permisos por rol en todos los endpoints. |
| Errores uniformes | ✅ | Todas las respuestas de error usan `{estado, error, mensaje}` con 400, 401, 403, 404 o 409. |
| Base de datos | ✅ | MySQL con el script DDL alineado al MER, más scripts de roles y usuarios de prueba. |
| Pruebas | 🟡 | 39 pruebas unitarias (seguridad, pedidos y facturación) y una colección Postman de 93 peticiones / 186 verificaciones. Falta la matriz de pruebas y cubrir menú y mesas. |
| Auditoría (RNF06) | ❌ | No se registran acciones de usuarios. |
| Caché con Redis | ❌ | Prevista en la arquitectura, sin integrar. |
| Despliegue en internet | ❌ | Planeado para la semana 15. |

### Patrones de diseño del documento de inicio

| Patrón | Estado | Dónde |
|---|---|---|
| Repository | ✅ | Un repositorio por entidad (Spring Data JPA). |
| MVC | ✅ | Controladores REST en el backend y vistas en React. |
| Singleton | ✅ | Servicios, repositorios y configuración son beans únicos de Spring; la conexión la gestiona el pool HikariCP. |
| DTO | 🟡 | Usado en autenticación, pedidos y facturación. Menú y mesas todavía devuelven las entidades. |
| Strategy | ❌ | Los métodos de pago se resuelven con condicionales; falta la interfaz común por método de pago. |
| Observer | ❌ | No hay notificaciones en tiempo real (por ejemplo, WebSocket) para cocina o disponibilidad. |

## 6. Avance frente al cronograma

| Corte | Planeado | API | Vistas |
|---|---|---|---|
| 1 | Usuarios, Menú, Mesas | Menú y mesas listos; usuarios solo con login y roles | Menú y gestión de mesas |
| 2 | Pedidos, Inventario, Facturación, pruebas | Pedidos y facturación listos; inventario fuera de alcance; pruebas iniciadas | Gestión de pedidos; facturación pendiente |
| 3 | Reportes, Dashboard, Reservas, despliegue | Reservas con CRUD básico; lo demás pendiente | Reservas implementadas; reportes, dashboard y despliegue pendientes |

## 7. Pendientes sugeridos (por prioridad)

**Vistas (frontend):**
1. **Login** y envío del token en todas las peticiones, para habilitar la integración de las vistas protegidas.
2. **Panel de cocina independiente y caja**, para completar el flujo operativo desde la interfaz; sus endpoints principales ya existen.
3. Comprobante imprimible o en PDF a partir del JSON que entrega la API (HU28).

**API (backend):**
1. **Gestión de usuarios** (HU01–HU03) con asignación de rol (HU04).
2. **Completar reservas** (HU16): validar choques de horario y pasar la mesa a RESERVADA; validar los estados de mesa (HU17).
3. **Reportes** (HU29, HU30, HU32, HU33) sobre los datos que ya se registran.
4. Bloquear la baja de productos que estén en pedidos activos (HU10).
5. Recuperación de contraseña (HU07) y auditoría (RNF06).

## 8. Cómo probar el MVP (API)

1. Seguir el [README](README.md) (secciones 9 a 11) para configurar el `.env`, crear la base y levantar el backend.
2. Ejecutar `docs/configuracion/Script DML usuarios prueba SIAR.sql`.
3. Importar en Postman `docs/postman/SIAR_COLLECTION.postman_collection.json` y `docs/postman/SIAR_ENVIRONMENT.postman_environment.json`.
4. Ejecutar la colección completa en orden. La carpeta 5 recorre el flujo de pedidos y la 6 el de facturación.
