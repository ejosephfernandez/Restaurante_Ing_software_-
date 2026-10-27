import { apiRequest } from "../../../services/api.js";

export const categoriasApi = {
    // GET: Consultar todas las categorías
    listar: () =>
        apiRequest("/categorias"),

    // GET: Consultar categorías activas
    listarActivas: () =>
        apiRequest("/categorias/activas"),

    // GET: Consultar una categoría por ID
    obtenerPorId: (id) =>
        apiRequest(`/categorias/${id}`),

    // POST: Crear una categoría
    crear: (categoria) =>
        apiRequest("/categorias", {
            method: "POST",
            body: JSON.stringify(categoria)
        }),

    // PUT: Actualizar una categoría
    actualizar: (id, categoria) =>
        apiRequest(`/categorias/${id}`, {
            method: "PUT",
            body: JSON.stringify(categoria)
        }),

    // DELETE: Desactivar una categoría
    desactivar: (id) =>
        apiRequest(`/categorias/${id}`, {
            method: "DELETE"
        })
};