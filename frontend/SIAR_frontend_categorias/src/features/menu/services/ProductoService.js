import { apiRequest } from "../../../services/api.js";

export const productoService = {
    // GET: Consultar todos los productos
    listar: () =>
        apiRequest("/productos"),

    // GET: Consultar categorías activas
    listarCategoriasActivas: () =>
        apiRequest("/categorias/activas"),

    // POST: Crear producto
    crear: (producto) =>
        apiRequest("/productos", {
            method: "POST",
            body: JSON.stringify(producto)
        }),

    // PUT: Actualizar producto por ID
    actualizar: (id, producto) =>
        apiRequest(`/productos/${id}`, {
            method: "PUT",
            body: JSON.stringify(producto)
        }),

    // PATCH: Cambiar disponibilidad
    cambiarDisponibilidad: (id, disponible) =>
        apiRequest(
            `/productos/${id}/disponibilidad?disponible=${disponible}`,
            {
                method: "PATCH"
            }
        ),

    // DELETE: Desactivar producto
    desactivar: (id) =>
        apiRequest(`/productos/${id}`, {
            method: "DELETE"
        })
};