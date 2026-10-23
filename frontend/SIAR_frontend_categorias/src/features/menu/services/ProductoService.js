const API_URL = "/api/productos";
const CATEGORIAS_URL = "/api/categorias"

async function solicitar(url, opciones ={}) {
    const respuesta = await fetch(url, {
        ...opciones,
        headers: {
            ...(opciones.body ? {"Content-Tyoe": "application/json"} : {}),
            ...opciones.headers
        }
    });

    const texto = await respuesta.text();
    let datos = null;

    if (texto) {
        try {
            datos = JSON.parse(texto);
        } catch {
            datos = texto;
        }
    }

    if (!respuesta.ok) {
        throw new Error(
            datos?.message ||
            datos?.mensaje ||
            `Error HTTP ${respuesta.status}`
        );
    }

    return datos;
}

export const productoService = {
    listar: () => solicitar(API_URL),

    listarCategoriasActivas: () =>
        solicitar(`${CATEGORIAS_URL}/activas`),

    crear: (producto) =>
        solicitar(API_URL, {
            method: "POST",
            body: JSON.stringify(producto)
        }),

    actualizar: (id, producto) =>
        solicitar(`${API_URL}/${id}`, {
            method: "PUT",
            body: JSON.stringify(producto)
        }),

    cambiarDisponibilidad: (id, disponible) =>
        solicitar(
            `${API_URL}/${id}/disponibilidad?disponible=${disponible}`,
            { method: "PATCH" }
        ),

    desactivar: (id) =>
        solicitar(`${API_URL}/${id}`, {
            method: "DELETE"
        })

};