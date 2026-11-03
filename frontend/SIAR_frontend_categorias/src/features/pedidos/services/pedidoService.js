import { apiRequest } from "../../../services/api.js";

/**
 * Servicio del modulo de pedidos.
 *
 * El token JWT NO se agrega aqui: lo inyecta `services/api.js` en cada peticion
 * leyendo `localStorage.getItem("siar_token")` y enviando
 * `Authorization: Bearer <token>`. Asi evitamos repetir esa logica en cada servicio.
 *
 * Todos los metodos devuelven el `PedidoDto` del backend:
 * { idPedido, idMesa, numeroMesa, idMesero, nombreMesero, fechaHora,
 *   horaEnvioCocina, estado, total, detalles[] }
 */

// Arma el query string solo con los filtros que realmente vienen informados.
function construirQuery(filtros = {}) {
    const params = new URLSearchParams();

    Object.entries(filtros).forEach(([clave, valor]) => {
        if (valor !== undefined && valor !== null && valor !== "") {
            params.append(clave, valor);
        }
    });

    const texto = params.toString();
    return texto ? `?${texto}` : "";
}

export const pedidoService = {
    // GET /api/pedidos?estado=...&idMesa=...
    listar: (filtros = {}) =>
        apiRequest(`/pedidos${construirQuery(filtros)}`),

    // GET /api/pedidos/{id}
    obtener: (idPedido) =>
        apiRequest(`/pedidos/${idPedido}`),

    // POST /api/pedidos  (el mesero sale del token en el backend)
    crear: (idMesa) =>
        apiRequest("/pedidos", {
            method: "POST",
            body: JSON.stringify({ idMesa: Number(idMesa) })
        }),

    // POST /api/pedidos/{id}/detalles
    agregarDetalle: (idPedido, { idProducto, cantidad, observacion }) =>
        apiRequest(`/pedidos/${idPedido}/detalles`, {
            method: "POST",
            body: JSON.stringify({
                idProducto: Number(idProducto),
                cantidad: Number(cantidad),
                observacion: observacion?.trim() || null
            })
        }),

    // PUT /api/pedidos/{id}/detalles/{idDetalle}
    modificarDetalle: (idPedido, idDetalle, { cantidad, observacion }) =>
        apiRequest(`/pedidos/${idPedido}/detalles/${idDetalle}`, {
            method: "PUT",
            body: JSON.stringify({
                cantidad: Number(cantidad),
                observacion: observacion?.trim() || null
            })
        }),

    // DELETE /api/pedidos/{id}/detalles/{idDetalle}
    eliminarDetalle: (idPedido, idDetalle) =>
        apiRequest(`/pedidos/${idPedido}/detalles/${idDetalle}`, {
            method: "DELETE"
        }),

    // PATCH: PENDIENTE -> EN_PREPARACION
    enviarACocina: (idPedido) =>
        apiRequest(`/pedidos/${idPedido}/enviar-cocina`, { method: "PATCH" }),

    // PATCH: EN_PREPARACION -> LISTO (cocina)
    marcarListo: (idPedido) =>
        apiRequest(`/pedidos/${idPedido}/listo`, { method: "PATCH" }),

    // PATCH: LISTO -> ENTREGADO
    marcarEntregado: (idPedido) =>
        apiRequest(`/pedidos/${idPedido}/entregado`, { method: "PATCH" }),

    // PATCH: cancelar (el backend lo impide si ya esta facturado)
    cancelar: (idPedido) =>
        apiRequest(`/pedidos/${idPedido}/cancelar`, { method: "PATCH" }),

    // --- Catalogos auxiliares que usa el formulario ---

    // GET /api/mesas: solo se pueden tomar pedidos en mesas OCUPADA o RESERVADA
    listarMesas: () =>
        apiRequest("/mesas"),

    // GET /api/productos/disponibles: productos activos y con stock disponible
    listarProductosDisponibles: () =>
        apiRequest("/productos/disponibles")
};
