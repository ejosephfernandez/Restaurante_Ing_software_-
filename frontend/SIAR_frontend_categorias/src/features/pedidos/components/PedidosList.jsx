import { useState } from "react";

/**
 * Lista de pedidos en una tabla Bootstrap.
 *
 * Es un componente "de presentacion": no hace peticiones, recibe los pedidos ya
 * cargados y avisa al padre con `onAccion` / `onAgregarProductos`.
 */

// Estados que maneja el backend (EstadoPedido).
export const ENUM_ESTADOS = ["PENDIENTE", "EN_PREPARACION", "LISTO", "ENTREGADO", "CANCELADO"];

// Texto legible para la interfaz.
export const ETIQUETAS_ESTADO = {
    PENDIENTE: "Pendiente",
    EN_PREPARACION: "En preparación",
    LISTO: "Listo",
    ENTREGADO: "Entregado",
    FACTURADO: "Facturado",
    CANCELADO: "Cancelado"
};

// Colores de Bootstrap por estado.
const COLORES_ESTADO = {
    PENDIENTE: "bg-warning text-dark",
    EN_PREPARACION: "bg-info text-dark",
    LISTO: "bg-success",
    ENTREGADO: "bg-primary",
    FACTURADO: "bg-secondary",
    CANCELADO: "bg-danger"
};

// Regla de negocio: cada estado habilita solo su siguiente accion.
const SIGUIENTE_ACCION = {
    PENDIENTE: { accion: "enviar-cocina", texto: "Enviar a cocina", clase: "btn-warning" },
    EN_PREPARACION: { accion: "listo", texto: "Marcar listo", clase: "btn-success" },
    LISTO: { accion: "entregado", texto: "Marcar entregado", clase: "btn-primary" }
};

// Cancelar se oculta si el pedido ya termino su ciclo.
// FACTURADO tambien se oculta porque el backend no permite cancelarlo.
const puedeCancelar = (estado) =>
    !["ENTREGADO", "CANCELADO", "FACTURADO"].includes(estado);

// Solo se pueden agregar o modificar productos antes de entregar.
const puedeEditarDetalle = (estado) =>
    ["PENDIENTE", "EN_PREPARACION"].includes(estado);

const dinero = (valor) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(Number(valor || 0));

const fecha = (valor) =>
    valor
        ? new Date(valor).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })
        : "—";

export default function PedidosList({
    pedidos,
    cargando,
    procesandoId,
    filtros,
    mesas,
    onCambiarFiltro,
    onAccion,
    onAgregarProductos
}) {
    // Id del pedido cuyo detalle esta desplegado.
    const [idExpandido, setIdExpandido] = useState(null);

    return (
        <div className="card shadow-sm">
            {/* Filtros que se envian al backend: estado e idMesa */}
            <div className="card-body border-bottom">
                <div className="row g-2 align-items-end">
                    <div className="col-12 col-md-4">
                        <label className="form-label mb-1" htmlFor="filtro-estado">
                            Estado
                        </label>
                        <select
                            id="filtro-estado"
                            className="form-select"
                            value={filtros.estado}
                            onChange={(e) => onCambiarFiltro("estado", e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            {ENUM_ESTADOS.map((estado) => (
                                <option key={estado} value={estado}>
                                    {ETIQUETAS_ESTADO[estado]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-12 col-md-4">
                        <label className="form-label mb-1" htmlFor="filtro-mesa">
                            Mesa
                        </label>
                        <select
                            id="filtro-mesa"
                            className="form-select"
                            value={filtros.idMesa}
                            onChange={(e) => onCambiarFiltro("idMesa", e.target.value)}
                        >
                            <option value="">Todas las mesas</option>
                            {mesas.map((mesa) => (
                                <option key={mesa.idMesa} value={mesa.idMesa}>
                                    Mesa {mesa.numero}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-12 col-md-4 text-md-end">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                                onCambiarFiltro("estado", "");
                                onCambiarFiltro("idMesa", "");
                            }}
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                        <tr>
                            <th>Pedido</th>
                            <th>Mesa</th>
                            <th>Mesero</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th className="text-end">Total</th>
                            <th className="text-center">Productos</th>
                            <th className="text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando && (
                            <tr>
                                <td colSpan="8" className="text-center py-4">
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Cargando pedidos...
                                </td>
                            </tr>
                        )}

                        {!cargando && pedidos.length === 0 && (
                            <tr>
                                <td colSpan="8" className="text-center text-muted py-4">
                                    No hay pedidos para los filtros seleccionados.
                                </td>
                            </tr>
                        )}

                        {!cargando &&
                            pedidos.map((pedido) => {
                                const accion = SIGUIENTE_ACCION[pedido.estado];
                                const ocupado = procesandoId === pedido.idPedido;

                                return (
                                    <FilaPedido
                                        key={pedido.idPedido}
                                        pedido={pedido}
                                        accion={accion}
                                        ocupado={ocupado}
                                        expandido={idExpandido === pedido.idPedido}
                                        onExpandir={() =>
                                            setIdExpandido(
                                                idExpandido === pedido.idPedido ? null : pedido.idPedido
                                            )
                                        }
                                        onAccion={onAccion}
                                        onAgregarProductos={onAgregarProductos}
                                    />
                                );
                            })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Fila de pedido + fila desplegable con su detalle.
function FilaPedido({
    pedido,
    accion,
    ocupado,
    expandido,
    onExpandir,
    onAccion,
    onAgregarProductos
}) {
    return (
        <>
            <tr>
                <td className="fw-semibold">#{pedido.idPedido}</td>
                <td>
                    Mesa {pedido.numeroMesa}
                    <span className="text-muted small d-block">ID {pedido.idMesa}</span>
                </td>
                <td>{pedido.nombreMesero || "—"}</td>
                <td className="small">{fecha(pedido.fechaHora)}</td>
                <td>
                    <span className={`badge ${COLORES_ESTADO[pedido.estado] || "bg-secondary"}`}>
                        {ETIQUETAS_ESTADO[pedido.estado] || pedido.estado}
                    </span>
                </td>
                <td className="text-end fw-semibold">{dinero(pedido.total)}</td>
                <td className="text-center">
                    <button
                        type="button"
                        className="btn btn-sm btn-link p-0"
                        onClick={onExpandir}
                        aria-expanded={expandido}
                    >
                        {pedido.detalles?.length || 0} {expandido ? "▴" : "▾"}
                    </button>
                </td>
                <td>
                    <div className="d-flex flex-wrap gap-1 justify-content-end">
                        {puedeEditarDetalle(pedido.estado) && (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => onAgregarProductos(pedido)}
                                disabled={ocupado}
                            >
                                Productos
                            </button>
                        )}

                        {accion && (
                            <button
                                type="button"
                                className={`btn btn-sm ${accion.clase}`}
                                onClick={() => onAccion(pedido, accion.accion)}
                                disabled={ocupado}
                            >
                                {ocupado ? "Procesando..." : accion.texto}
                            </button>
                        )}

                        {puedeCancelar(pedido.estado) && (
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => onAccion(pedido, "cancelar")}
                                disabled={ocupado}
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </td>
            </tr>

            {expandido && (
                <tr className="table-light">
                    <td colSpan="8">
                        <DetallePedido pedido={pedido} />
                    </td>
                </tr>
            )}
        </>
    );
}

function DetallePedido({ pedido }) {
    const detalles = pedido.detalles || [];

    if (detalles.length === 0) {
        return <span className="text-muted small">Este pedido aun no tiene productos.</span>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-sm mb-0">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th className="text-center">Cantidad</th>
                        <th className="text-end">Precio unitario</th>
                        <th className="text-end">Subtotal</th>
                        <th>Observacion</th>
                    </tr>
                </thead>
                <tbody>
                    {detalles.map((detalle) => (
                        <tr key={detalle.idDetalle}>
                            <td>{detalle.nombreProducto}</td>
                            <td className="text-center">{detalle.cantidad}</td>
                            <td className="text-end">{dinero(detalle.precioUnitario)}</td>
                            <td className="text-end">{dinero(detalle.subtotal)}</td>
                            <td className="small text-muted">{detalle.observacion || "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
