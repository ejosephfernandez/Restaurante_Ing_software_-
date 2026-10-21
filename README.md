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

La autenticación con Spring Security y JWT, la integración de Redis y los módulos restantes se desarrollarán progresivamente.

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