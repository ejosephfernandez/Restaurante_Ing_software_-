# SIAR - Frontend de prueba para categorías

Interfaz React para probar los endpoints de categorías que implementamos en Spring Boot.

## Requisitos

- Node.js LTS y npm.
- Backend SIAR ejecutándose en `http://localhost:8080`.
- Endpoints del controlador `CategoriaController` disponibles en `/api/categorias`.

## Instalar y ejecutar

Desde la carpeta `frontend` (este directorio):

```bash
npm install
npm run dev
```

Vite queda disponible en `http://localhost:5173`.

## Proxy API

`vite.config.js` redirige las peticiones que empiezan por `/api` hacia `http://localhost:8080`. De esta forma, no hace falta configurar CORS para el desarrollo local cuando el backend está en ese puerto.

Si el backend utiliza otro puerto, cambia `target` en `vite.config.js`.

Opcionalmente, se puede configurar un host base con `VITE_API_BASE_URL`, pero cuando se use una URL absoluta el navegador contactará directamente ese host; en ese caso habrá que configurar CORS en Spring Boot.

## Endpoints probados

- `GET /api/categorias`
- `GET /api/categorias/activas`
- `GET /api/categorias/{id}`
- `POST /api/categorias`
- `PUT /api/categorias/{id}`
- `DELETE /api/categorias/{id}` (desactivación lógica)

El frontend espera que las categorías incluyan `idCategoria`, `nombre` y `activa`, como la entidad JPA propuesta. También admite `id_categoria` o `id` como identificador de respuesta.

## Nota de integración

El `CategoriaController` debe usar los mismos nombres de paquetes/clases que el backend del repositorio. Si todavía no existe el endpoint o difieren las rutas, ajusta `src/services/categoriasApi.js`.
