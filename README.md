# SIAR — Sistema Integral de Administración para Restaurantes

# 1. Descripción del proyecto

SIAR (Sistema Integral de Administración para Restaurantes) es un sistema de software orientado a centralizar y optimizar los procesos operativos de un restaurante.

El proyecto surge ante la desconexión de información entre el salón, la cocina y la administración, que puede generar retrasos en la atención, errores en los pedidos y dificultades para realizar el seguimiento de las operaciones.

SIAR busca integrar estos procesos en una plataforma que facilite la gestión de usuarios, menú, mesas, pedidos, facturación y reportes, proporcionando información organizada y trazable.

# 2. Objetivos del proyecto

Objetivo general

Diseñar y desarrollar un sistema integral de administración para restaurantes que centralice la información y agilice los procesos operativos, comerciales y administrativos.

Objetivos específicos

Agilizar la comunicación entre el personal de salón, cocina y caja.

Centralizar la gestión de productos, categorías, mesas y pedidos.

Facilitar la facturación, el registro de pagos y la emisión de comprobantes.

Proporcionar información para la generación de reportes administrativos.

Mantener una arquitectura organizada, mantenible y preparada para futuras ampliaciones.

# 3. Alcance funcional

SIAR contempla seis módulos funcionales:

Módulo

Descripción

Gestión de usuarios

Registro, edición, desactivación, autenticación y administración de roles.

Gestión de menú

Administración de categorías y productos, incluyendo precio, estado y disponibilidad.

Gestión de mesas

Registro de mesas, consulta de estado y administración de reservas.

Gestión de pedidos

Creación, modificación, cancelación y seguimiento de pedidos y sus detalles.

Facturación y pagos

Generación de facturas, cálculo de importes, descuentos, pagos y comprobantes.

Reportes

Consultas e indicadores para apoyar la toma de decisiones.

El módulo de inventario permanece fuera del alcance de desarrollo actual y podrá incorporarse en una etapa posterior.

# 4. Tecnologías utilizadas

Frontend

React

JavaScript

HTML5

CSS3

Bootstrap

Vite

Backend

Java

Spring Boot

Spring Web

Spring Data JPA

Hibernate

Maven

HikariCP para la gestión de la piscina de conexiones

Base de datos y caché

MySQL como sistema gestor de base de datos relacional.

WampServer como entorno local para ejecutar el servidor de base de datos durante el desarrollo.

Redis como tecnología de caché prevista en la arquitectura; su integración se realizará cuando corresponda.

Herramientas de desarrollo

Visual Studio Code

Git y GitHub

MySQL Workbench o phpMyAdmin

Postman para probar los endpoints REST.

Las versiones exactas de Java, Spring Boot y las dependencias del backend se encuentran definidas en backend/siar-backend/pom.xml. El frontend mantiene sus dependencias en package.json y sus versiones bloqueadas en package-lock.json.

# 5. Arquitectura del sistema

SIAR adopta una arquitectura monolítica organizada en capas y módulos funcionales.

La estructura lógica de las capas es:

Presentación: recibe las solicitudes HTTP y expone los endpoints de la API REST.

Lógica de negocio: contiene las reglas, validaciones, cálculos y operaciones del negocio.

Persistencia: contiene las entidades y los repositorios que representan y consultan la información persistente.

Acceso a datos: agrupa la configuración técnica de las conexiones, transacciones, seguridad e integración con servicios de infraestructura.

El flujo principal de una solicitud es:

Frontend React → API REST → Lógica de negocio → Persistencia → MySQL

HikariCP administra la piscina de conexiones JDBC utilizada por Spring Boot y Hibernate. Redis se incorporará como caché sin reemplazar a MySQL como fuente de información persistente.

# 6. Estructura del repositorio

La estructura general del repositorio es la siguiente:

SIAR/
├── .github/
├── .vscode/
├── backend/
│   └── siar-backend/
│       ├── .mvn/
│       ├── src/
│       │   ├── main/
│       │   │   ├── java/com/siar/
│       │   │   └── resources/
│       │   └── test/
│       ├── mvnw
│       ├── mvnw.cmd
│       └── pom.xml
├── frontend/
│   └── SIAR_frontend_categorias/
│       ├── src/
│       ├── index.html
│       ├── package.json
│       ├── package-lock.json
│       └── vite.config.js
├── docs/
├── infra/
├── scripts/
├── .env.example
├── .gitignore
├── .gitattributes
└── README.md

La estructura representa la organización objetivo del repositorio. Los archivos o carpetas que todavía no se hayan incorporado deben crearse a medida que se complete su configuración.

# 7. Requisitos previos

Antes de ejecutar el proyecto, es necesario contar con:

Git instalado.

Visual Studio Code.

Un JDK compatible con la versión configurada en el backend.

Node.js y npm.

WampServer con el servicio de base de datos iniciado.

La base de datos siar creada en MySQL.

Las credenciales locales de conexión configuradas.

Redis no es necesario para ejecutar las funcionalidades iniciales mientras su integración no sea requerida por el código implementado.

# 8. Clonar el repositorio

Desde una terminal, ejecuta:

git clone URL_DEL_REPOSITORIO
cd NOMBRE_DEL_REPOSITORIO

Reemplaza URL_DEL_REPOSITORIO por la dirección real del repositorio de GitHub.

Después, abre la carpeta raíz del proyecto en Visual Studio Code.

# 9. Configuración de variables de entorno

El archivo .env.example contiene una plantilla con las variables que necesita el proyecto, sin incluir contraseñas reales.

Crea tu archivo local .env a partir de esa plantilla y configura los valores correspondientes a tu instalación:

DB_URL=jdbc:mysql://localhost:3306/siar?serverTimezone=UTC
DB_USERNAME=siar_app
DB_PASSWORD=CAMBIAR_POR_TU_CLAVE_LOCAL

JWT_SECRET=CAMBIAR_POR_UNA_CLAVE_DE_AL_MENOS_32_CARACTERES
JWT_EXPIRATION_MINUTES=480
CORS_ALLOWED_ORIGIN=http://localhost:5173

SIAR_ADMIN_USER=admin
SIAR_ADMIN_EMAIL=admin@siar.local
SIAR_ADMIN_PASSWORD=CAMBIAR_POR_LA_CLAVE_DEL_ADMIN

SIAR_TASA_IMPUESTO=0.08
SIAR_DESCUENTO_MAXIMO=20
SIAR_NEGOCIO_NOMBRE=Restaurante SIAR
SIAR_NEGOCIO_NIT=900000000-0
SIAR_NEGOCIO_DIRECCION=Cali, Colombia
SIAR_NEGOCIO_TELEFONO=

JWT_SECRET es obligatoria: sin ella (o con menos de 32 caracteres) el backend no arranca. Las variables SIAR_ADMIN_* se explican en la sección 15. Las de facturación (SIAR_TASA_IMPUESTO, SIAR_DESCUENTO_MAXIMO y SIAR_NEGOCIO_*) son opcionales y se explican en la sección 16.

Si posteriormente se incorpora Redis, podrán añadirse las variables correspondientes a su conexión.

## Importante: Spring Boot no carga automáticamente un archivo .env. Antes de iniciar el backend, las variables deben cargarse en el entorno de ejecución. En Windows PowerShell se puede utilizar el script .\scripts\run-backend.ps1 cuando esté incluido y configurado en el repositorio.

El archivo .env contiene información local y no debe subirse a Git. Cada integrante debe configurar sus propias credenciales.

# 10. Configuración de la base de datos

Inicia WampServer y comprueba que el servicio de MySQL esté funcionando.

Abre MySQL Workbench o phpMyAdmin.

Crea la base de datos siar si todavía no existe.

Ejecuta el script SQL de creación de tablas correspondiente al modelo entidad-relación del proyecto.

Configura las variables de entorno para conectar Spring Boot con la base de datos.

Se recomienda guardar y versionar el script de creación de tablas en:

docs/configuracion/Script DDL SIAR.sql

Después del DDL, ejecuta el script de roles, necesario para el inicio de sesión:

docs/configuracion/Script DML roles SIAR.sql

Opcional, para desarrollo y para la colección de Postman: después de arrancar el backend una vez (para que exista el admin), ejecuta el script que crea un usuario mesero, cajero y cocinero con la misma contraseña del admin:

docs/configuracion/Script DML usuarios prueba SIAR.sql

El esquema debe mantenerse alineado con el modelo entidad-relación vigente y con las entidades JPA del backend.

# 11. Ejecutar el backend

El backend está ubicado en:

backend/siar-backend/

Desde PowerShell, carga las variables de entorno configuradas y ejecuta:

cd backend/siar-backend
.\mvnw.cmd spring-boot:run

Si utilizas el script de inicio desde la raíz, podrás ejecutar el procedimiento automatizado que cargue las variables y arranque el backend.

Cuando la aplicación se inicie correctamente, Spring Boot expondrá la API en:

http://localhost:8080

HikariCP deberá inicializar la piscina de conexiones y Hibernate deberá reconocer la base de datos configurada.

# 12. Ejecutar el frontend

El frontend inicial se encuentra en:

frontend/SIAR_frontend_categorias/

Abre una terminal de PowerShell y ejecuta:

cd frontend/SIAR_frontend_categorias
npm ci
npm run dev

Si el archivo package-lock.json todavía no existe, ejecuta npm install una primera vez para generarlo. Después, incorpora el archivo al repositorio para que los demás integrantes puedan instalar las mismas versiones de las dependencias.

Vite mostrará en la terminal la dirección local del frontend, normalmente:

http://localhost:5173

El frontend utiliza la API REST del backend. Para el desarrollo local, su configuración de Vite debe dirigir las solicitudes /api hacia http://localhost:8080.

# 13. Funcionalidades disponibles y estado del desarrollo

El proyecto se encuentra en desarrollo incremental.

Infraestructura implementada

Proyecto backend con Spring Boot y Maven.

Conexión de Spring Boot con MySQL.

Gestión de conexiones mediante HikariCP.

Inicialización de JPA/Hibernate.

Estructura inicial de entidades y repositorios del módulo de menú.

Módulo de menú en desarrollo

Consulta de categorías.

Consulta de categorías activas.

Creación y actualización de categorías.

Desactivación lógica de categorías.

Interfaz React para probar las operaciones mediante la API REST.

La disponibilidad definitiva de cada operación depende de que sus clases, endpoints y pruebas estén incorporados y verificados en el repositorio.

Seguridad implementada

Inicio de sesión con usuario o correo y contraseña cifrada con BCrypt.

Autenticación mediante tokens JWT con Spring Security.

Autorización por rol en los endpoints de menú y mesas (ver sección 15).

La integración de Redis y los módulos restantes se desarrollarán progresivamente.

# 14. Endpoints iniciales de categorías

Una vez implementado y ejecutándose el controlador de categorías, la API tendrá los siguientes endpoints:

Método

Ruta

Operación

GET

/api/categorias

Consultar todas las categorías.

GET

/api/categorias/activas

Consultar categorías activas.

GET

/api/categorias/{id}

Consultar una categoría por identificador.

POST

/api/categorias

Crear una categoría.

PUT

/api/categorias/{id}

Actualizar una categoría.

DELETE

/api/categorias/{id}

Desactivar una categoría.

La API se prueba inicialmente con Postman o con la interfaz React del módulo de menú.

### 14.1 Endpoints de Mesas y Reservas

| Método | Ruta | Operación |
| :--- | :--- | :--- |
| GET | `/api/mesas` | Consultar todas las mesas. |
| GET | `/api/mesas/{id}` | Consultar una mesa por ID. |
| POST | `/api/mesas` | Crear una mesa. |
| PUT | `/api/mesas/{id}` | Actualizar datos de una mesa. |
| PUT | `/api/mesas/{id}/estado` | Cambiar el estado de una mesa. |
| GET | `/api/mesas/{id}/disponible` | Verificar si una mesa está disponible. |
| GET | `/api/mesas/{id}/reservas` | Consultar las reservas de una mesa. |
| POST | `/api/reservas` | Crear una nueva reserva. |
| GET | `/api/reservas` | Consultar todas las reservas. |
| GET | `/api/reservas/{id}` | Consultar una reserva por ID. |
| PUT | `/api/reservas/{id}` | Actualizar datos de una reserva. |
| PUT | `/api/reservas/{id}/confirmar` | Confirmar una reserva. |
| PUT | `/api/reservas/{id}/cancelar` | Cancelar una reserva. |
| DELETE | `/api/reservas/{id}` | Eliminar una reserva. |

# 15. Seguridad: autenticación JWT y roles

La API está protegida con Spring Security. Todas las rutas /api/** exigen un token JWT, excepto el inicio de sesión.

## Cómo autenticarse

1. Iniciar sesión (el campo usuario acepta el nombre de usuario o el correo):

```http
POST /api/auth/login
Content-Type: application/json

{ "usuario": "admin", "contrasena": "tu-clave" }
```

2. La respuesta incluye el token, su fecha de expiración, el rol y los permisos del usuario.

3. Enviar el token en cada petición:

```http
Authorization: Bearer <token>
```

4. GET /api/auth/me devuelve los datos del usuario dueño del token.

Respuestas de error:

| Código | Cuándo |
|---|---|
| 401 | Credenciales incorrectas, usuario inactivo, o token ausente, inválido o expirado. |
| 403 | El usuario está autenticado pero su rol no permite la operación. |

## Usuario administrador inicial

Para poder hacer el primer login sin insertar hashes BCrypt a mano, la clase AdminInicial (backend/siar-backend/src/main/java/com/siar/config/seguridad/AdminInicial.java) crea un usuario ADMINISTRADOR al arrancar el backend.

Solo actúa si se cumplen las dos condiciones:

- La variable SIAR_ADMIN_PASSWORD está definida en el .env.
- La tabla USUARIO está vacía.

Usa SIAR_ADMIN_USER, SIAR_ADMIN_EMAIL y SIAR_ADMIN_PASSWORD como usuario, correo y contraseña; la contraseña se guarda cifrada con BCrypt. Al crearlo, el log muestra: Usuario administrador inicial 'admin' creado.

En los arranques siguientes no hace nada, porque la tabla ya tiene usuarios. Si no se define SIAR_ADMIN_PASSWORD, tampoco hace nada. La contraseña nunca está escrita en el código: sale del .env de cada integrante.

## Permisos por rol

Los roles se cargan con el script docs/configuracion/Script DML roles SIAR.sql: ADMINISTRADOR, CAJERO, MESERO y COCINERO. Las reglas están definidas en SecurityConfig (backend/siar-backend/src/main/java/com/siar/config/seguridad/SecurityConfig.java):

| Operación | Roles permitidos |
|---|---|
| Consultar (GET) categorías, productos, mesas y reservas | Cualquier usuario autenticado |
| Crear, actualizar o desactivar categorías y productos | ADMINISTRADOR |
| Cambiar disponibilidad de un producto | ADMINISTRADOR, COCINERO |
| Crear, actualizar o eliminar mesas | ADMINISTRADOR |
| Cambiar el estado de una mesa | ADMINISTRADOR, MESERO |
| Crear reservas | ADMINISTRADOR, MESERO, CAJERO |
| Confirmar, cancelar o actualizar reservas | ADMINISTRADOR, MESERO |
| Eliminar reservas | ADMINISTRADOR |
| Consultar pedidos (GET) | Cualquier usuario autenticado |
| Crear pedidos, agregar/modificar/quitar productos, enviar a cocina, marcar entregado, cancelar | ADMINISTRADOR, MESERO |
| Marcar un pedido como LISTO | ADMINISTRADOR, COCINERO |
| Todo el módulo de facturación (/api/facturas/**) | ADMINISTRADOR, CAJERO |

Cualquier endpoint nuevo queda protegido por token automáticamente. Si debe restringirse a ciertos roles, se agrega su regla en SecurityConfig.

## Pruebas

- Pruebas automáticas (no requieren base de datos): backend/siar-backend/src/test/java/com/siar/ (seguridad, pedidos y facturación).
- Postman: importar docs/postman/SIAR_COLLECTION.postman_collection.json y docs/postman/SIAR_ENVIRONMENT.postman_environment.json, seleccionar el environment "SIAR ENVIRONMENT" y ejecutar la colección completa en orden. Antes, ejecutar docs/configuracion/Script DML usuarios prueba SIAR.sql para crear los usuarios mesero, cajero y cocinero (quedan con la misma contraseña del admin).

# 16. Pedidos y facturación

## Flujo

1. El mesero crea el pedido en una mesa OCUPADA o RESERVADA. El pedido inicia PENDIENTE (HU18).
2. Agrega productos activos y disponibles con cantidad y observación; el total se recalcula solo (HU19). Mientras esté PENDIENTE puede modificar cantidades o quitar productos (HU20).
3. Lo envía a cocina: pasa a EN_PREPARACION y se registra la hora de envío (HU22). Desde aquí ya no se modifica.
4. Cocina lo marca LISTO y el mesero lo marca ENTREGADO (HU23).
5. El cajero genera la factura de un pedido ENTREGADO: número consecutivo, descuento opcional e impuesto. El pedido pasa a FACTURADO (HU24, HU25, HU26).
6. Registra el pago, simple o mixto. La factura pasa a PAGADA (HU27).
7. Emite el comprobante, que queda guardado como histórico (HU28).

Un pedido se puede cancelar en cualquier momento antes de ser FACTURADO (HU21).

## Endpoints de pedidos (/api/pedidos)

| Método | Ruta | Operación |
|---|---|---|
| GET | /api/pedidos?idMesa=&idMesero=&estado= | Consultar pedidos (filtros opcionales) |
| GET | /api/pedidos/{id} | Consultar un pedido con su detalle |
| POST | /api/pedidos | Crear pedido: { "idMesa": 1 } |
| POST | /api/pedidos/{id}/detalles | Agregar producto: { "idProducto": 1, "cantidad": 2, "observacion": "sin cebolla" } |
| PUT | /api/pedidos/{id}/detalles/{idDetalle} | Modificar cantidad u observación |
| DELETE | /api/pedidos/{id}/detalles/{idDetalle} | Quitar un producto |
| PATCH | /api/pedidos/{id}/enviar-cocina | PENDIENTE → EN_PREPARACION |
| PATCH | /api/pedidos/{id}/listo | EN_PREPARACION → LISTO |
| PATCH | /api/pedidos/{id}/entregado | LISTO → ENTREGADO |
| PATCH | /api/pedidos/{id}/cancelar | Cancelar (si no está FACTURADO) |

## Endpoints de facturación (/api/facturas)

| Método | Ruta | Operación |
|---|---|---|
| POST | /api/facturas/previsualizar | Calcular el desglose sin guardar: { "idPedido": 1, "descuento": { "tipo": "PORCENTAJE", "valor": 10 } } |
| POST | /api/facturas | Generar la factura (mismo cuerpo; descuento opcional, tipo PORCENTAJE o MONTO) |
| GET | /api/facturas?estado= | Consultar facturas (EMITIDA, PAGADA, ANULADA) |
| GET | /api/facturas/{id} | Consultar una factura |
| GET | /api/facturas/pedido/{idPedido} | Consultar la factura de un pedido |
| POST | /api/facturas/{id}/pagos | Registrar pagos: { "pagos": [ { "metodo": "TARJETA", "monto": 30000 }, { "metodo": "EFECTIVO", "monto": 20000 } ] } |
| POST | /api/facturas/{id}/comprobantes | Emitir comprobante: { "formato": "PDF" } (PDF, IMPRESO o ELECTRONICO) |
| GET | /api/facturas/{id}/comprobantes | Histórico de comprobantes |

## Reglas de cálculo

- Subtotal: suma de cantidad × precio unitario. El precio se guarda al agregar el producto, así que cambios posteriores en el menú no alteran pedidos ya tomados.
- Descuento: porcentaje o monto fijo sobre el subtotal; no puede superar el subtotal.
- Impuesto: (subtotal − descuento) × SIAR_TASA_IMPUESTO (por defecto 0.08, impuesto al consumo del 8 %).
- Total: subtotal − descuento + impuesto. Todos los valores se redondean a 2 decimales.
- Un CAJERO puede aplicar hasta SIAR_DESCUENTO_MAXIMO por ciento (por defecto 20). Un descuento mayor solo lo puede aplicar un ADMINISTRADOR (HU26).

## Reglas de pago

- La suma de los pagos debe cubrir el total.
- Tarjeta y transferencia no pueden superar el total. El efectivo sí, y la diferencia se devuelve como cambio en la respuesta.
- En la tabla PAGO el efectivo se guarda por lo efectivamente aplicado (sin el cambio), así la suma de PAGO.monto siempre coincide con FACTURA.total.

## Comprobante

El comprobante se devuelve en JSON con los datos del negocio (SIAR_NEGOCIO_*), el detalle de productos, descuento, impuesto, total y pagos, para que el frontend lo imprima o lo convierta a PDF. El backend no genera el archivo PDF.

## Errores

Todos los módulos responden los errores con el mismo formato JSON: { "estado": 409, "error": "Conflict", "mensaje": "..." }. Se usan 400 para datos inválidos, 403 para falta de rol o de autorización, 404 cuando no existe el recurso y 409 cuando el estado no permite la operación.