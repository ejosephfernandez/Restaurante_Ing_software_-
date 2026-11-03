import { useState } from "react";
import SiarIcon from "../../../components/ui/SiarIcon.jsx";
import "../../../styles/pedidos-list.css";

/**
 * Lista de pedidos SIAR.
 * Componente de presentación: recibe datos y comunica las acciones al padre.
 */
export const ENUM_ESTADOS = [
    "PENDIENTE",
    "EN_PREPARACION",
    "LISTO",
    "ENTREGADO",
    "CANCELADO"
];

export const ETIQUETAS_ESTADO = {
    PENDIENTE: "Pendiente",
    EN_PREPARACION: "En preparación",
    LISTO: "Listo",
    ENTREGADO: "Entregado",
    FACTURADO: "Facturado",
    CANCELADO: "Cancelado"
};

const CLASE_ESTADO = {
    PENDIENTE: "pending",
    EN_PREPARACION: "preparing",
    LISTO: "ready",
    ENTREGADO: "delivered",
    FACTURADO: "billed",
    CANCELADO: "cancelled"
};

// Cada estado habilita únicamente la siguiente acción permitida.
const SIGUIENTE_ACCION = {
    PENDIENTE: {
        accion: "enviar-cocina",
        texto: "Enviar a cocina",
        icono: "arrowRight",
        clase: "pedidos-action-send"
    },
    EN_PREPARACION: {
        accion: "listo",
        texto: "Marcar listo",
        icono: "check",
        clase: "pedidos-action-ready"
    },
    LISTO: {
        accion: "entregado",
        texto: "Marcar entregado",
        icono: "check",
        clase: "pedidos-action-deliver"
    }
};

const puedeCancelar = (estado) =>
    !["ENTREGADO", "CANCELADO", "FACTURADO"].includes(estado);

const puedeEditarDetalle = (estado) =>
    ["PENDIENTE", "EN_PREPARACION"].includes(estado);

const normalizarEstado = (estado) =>
    String(estado ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");

const dinero = (valor) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(Number(valor || 0));

const fecha = (valor) => {
    if (!valor) return "—";

    const fechaPedido = new Date(valor);
    if (Number.isNaN(fechaPedido.getTime())) return "—";

    return fechaPedido.toLocaleString("es-CO", {
        dateStyle: "short",
        timeStyle: "short"
    });
};

export default function PedidosList({
    pedidos = [],
    cargando = false,
    procesandoId = null,
    filtros = { estado: "", idMesa: "" },
    mesas = [],
    onCambiarFiltro,
    onAccion,
    onAgregarProductos
}) {
    const [idExpandido, setIdExpandido] = useState(null);

    const limpiarFiltros = () => {
        onCambiarFiltro?.("estado", "");
        onCambiarFiltro?.("idMesa", "");
    };

    return (
        <section className="table-panel pedidos-list-panel" aria-label="Listado de pedidos">
            <header className="panel-header pedidos-list-header">
                <div>
                    <span className="eyebrow">OPERACIÓN DEL RESTAURANTE</span>
                    <h2>Pedidos registrados</h2>
                    <p>Consulta las comandas, revisa sus productos y actualiza su estado.</p>
                </div>
                <div className="pedidos-list-count" aria-live="polite">
                    <SiarIcon name="clipboard" size="sm" />
                    <strong>{cargando ? "—" : pedidos.length}</strong>
                    <span>{pedidos.length === 1 ? "pedido" : "pedidos"}</span>
                </div>
            </header>

            <div className="table-toolbar pedidos-list-toolbar">
                <label className="pedidos-filter-field" htmlFor="filtro-estado">
                    <span>Estado del pedido</span>
                    <select
                        id="filtro-estado"
                        className="pedidos-filter-select"
                        value={filtros.estado ?? ""}
                        onChange={(evento) => onCambiarFiltro?.("estado", evento.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        {ENUM_ESTADOS.map((estado) => (
                            <option key={estado} value={estado}>
                                {ETIQUETAS_ESTADO[estado]}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="pedidos-filter-field" htmlFor="filtro-mesa">
                    <span>Mesa asignada</span>
                    <select
                        id="filtro-mesa"
                        className="pedidos-filter-select"
                        value={filtros.idMesa ?? ""}
                        onChange={(evento) => onCambiarFiltro?.("idMesa", evento.target.value)}
                    >
                        <option value="">Todas las mesas</option>
                        {mesas.map((mesa) => (
                            <option key={mesa.idMesa} value={mesa.idMesa}>
                                Mesa {mesa.numero}
                            </option>
                        ))}
                    </select>
                </label>

                <button
                    type="button"
                    className="button button-light pedidos-clear-filters"
                    onClick={limpiarFiltros}
                    disabled={!filtros.estado && !filtros.idMesa}
                >
                    <SiarIcon name="refresh" size="xs" />
                    Limpiar filtros
                </button>
            </div>

            <div className="table-scroll pedidos-table-scroll">
                <table className="category-table pedidos-table">
                    <thead>
                        <tr>
                            <th>PEDIDO</th>
                            <th>MESA</th>
                            <th>MESERO</th>
                            <th>FECHA Y HORA</th>
                            <th>ESTADO</th>
                            <th className="pedidos-number-cell">TOTAL</th>
                            <th className="pedidos-center-cell">PRODUCTOS</th>
                            <th className="actions-heading">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cargando && (
                            <tr>
                                <td colSpan={8}>
                                    <div className="loading-state">
                                        <span className="spinner spinner-dark" />
                                        Consultando pedidos…
                                    </div>
                                </td>
                            </tr>
                        )}

                        {!cargando && pedidos.length === 0 && (
                            <tr>
                                <td colSpan={8}>
                                    <div className="empty-state pedidos-empty-state">
                                        <div className="empty-icon">
                                            <SiarIcon name="clipboard" size="xl" />
                                        </div>
                                        <strong>No hay pedidos para mostrar</strong>
                                        <p>No encontramos pedidos con los filtros seleccionados. Prueba con otros criterios.</p>
                                        {(filtros.estado || filtros.idMesa) && (
                                            <button
                                                type="button"
                                                className="button button-secondary"
                                                onClick={limpiarFiltros}
                                            >
                                                Limpiar filtros
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}

                        {!cargando && pedidos.map((pedido) => {
                            const estado = normalizarEstado(pedido.estado);
                            const accion = SIGUIENTE_ACCION[estado];
                            const ocupado = procesandoId === pedido.idPedido;
                            const expandido = idExpandido === pedido.idPedido;

                            return (
                                <FilaPedido
                                    key={pedido.idPedido}
                                    pedido={pedido}
                                    estado={estado}
                                    accion={accion}
                                    ocupado={ocupado}
                                    expandido={expandido}
                                    onExpandir={() => setIdExpandido(
                                        expandido ? null : pedido.idPedido
                                    )}
                                    onAccion={onAccion}
                                    onAgregarProductos={onAgregarProductos}
                                />
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <footer className="table-footer pedidos-list-footer">
                <span>
                    {cargando ? "Actualizando listado…" : (
                        <>Mostrando <strong>{pedidos.length}</strong> {pedidos.length === 1 ? "pedido" : "pedidos"}</>
                    )}
                </span>
                <span className="footer-api">
                    <span className={`status-light ${cargando ? "status-pending" : "status-up"}`} />
                    {cargando ? "Consultando API" : "Datos del sistema"}
                </span>
            </footer>
        </section>
    );
}

function FilaPedido({
    pedido,
    estado,
    accion,
    ocupado,
    expandido,
    onExpandir,
    onAccion,
    onAgregarProductos
}) {
    const claseEstado = CLASE_ESTADO[estado] || "unknown";
    const etiquetaEstado = ETIQUETAS_ESTADO[estado] || pedido.estado || "Sin estado";

    return (
        <>
            <tr className={expandido ? "pedidos-row-expanded" : ""}>
                <td>
                    <div className="pedidos-id-cell">
                        <span className="pedidos-id-icon"><SiarIcon name="receipt" size="sm" /></span>
                        <strong>#{pedido.idPedido}</strong>
                    </div>
                </td>
                <td>
                    <div className="pedidos-table-main">
                        <strong>Mesa {pedido.numeroMesa ?? "—"}</strong>
                        <small>ID {pedido.idMesa ?? "—"}</small>
                    </div>
                </td>
                <td>{pedido.nombreMesero || "—"}</td>
                <td className="pedidos-date-cell">{fecha(pedido.fechaHora)}</td>
                <td>
                    <span className={`status-badge pedidos-status pedidos-status-${claseEstado}`}>
                        <span />
                        {etiquetaEstado}
                    </span>
                </td>
                <td className="pedidos-number-cell pedidos-total-cell">{dinero(pedido.total)}</td>
                <td className="pedidos-center-cell">
                    <button
                        type="button"
                        className={`pedidos-detail-toggle ${expandido ? "is-open" : ""}`}
                        onClick={onExpandir}
                        aria-expanded={expandido}
                        aria-label={`${expandido ? "Ocultar" : "Mostrar"} productos del pedido ${pedido.idPedido}`}
                    >
                        <span>{pedido.detalles?.length || 0}</span>
                        <SiarIcon name="chevronDown" size="xs" />
                    </button>
                </td>
                <td>
                    <div className="row-actions pedidos-row-actions">
                        {puedeEditarDetalle(estado) && (
                            <button
                                type="button"
                                className="action-button pedidos-action-products"
                                onClick={() => onAgregarProductos(pedido)}
                                disabled={ocupado}
                                title="Consultar o agregar productos"
                            >
                                <SiarIcon name="plus" size="xs" />
                                <span>Productos</span>
                            </button>
                        )}

                        {accion && (
                            <button
                                type="button"
                                className={`action-button ${accion.clase}`}
                                onClick={() => onAccion(pedido, accion.accion)}
                                disabled={ocupado}
                            >
                                {ocupado ? <span className="spinner spinner-dark" /> : <SiarIcon name={accion.icono} size="xs" />}
                                <span>{ocupado ? "Procesando…" : accion.texto}</span>
                            </button>
                        )}

                        {puedeCancelar(estado) && (
                            <button
                                type="button"
                                className="action-button action-danger"
                                onClick={() => onAccion(pedido, "cancelar")}
                                disabled={ocupado}
                                title="Cancelar pedido"
                            >
                                <SiarIcon name="close" size="xs" />
                                <span>Cancelar</span>
                            </button>
                        )}
                    </div>
                </td>
            </tr>

            {expandido && (
                <tr className="pedidos-detail-row">
                    <td colSpan={8}>
                        <DetallePedido pedido={pedido} />
                    </td>
                </tr>
            )}
        </>
    );
}

function DetallePedido({ pedido }) {
    const detalles = pedido.detalles || [];

    return (
        <section className="pedidos-detail-panel" aria-label={`Detalle del pedido ${pedido.idPedido}`}>
            <header className="pedidos-detail-heading">
                <div>
                    <strong>Detalle del pedido</strong>
                    <span>Productos incluidos en la comanda</span>
                </div>
                <span className="pedidos-detail-count">
                    {detalles.length} {detalles.length === 1 ? "producto" : "productos"}
                </span>
            </header>

            {detalles.length === 0 ? (
                <div className="pedidos-detail-empty">Este pedido aún no tiene productos.</div>
            ) : (
                <div className="table-scroll pedidos-detail-table-scroll">
                    <table className="pedidos-detail-table">
                        <thead>
                            <tr>
                                <th>PRODUCTO</th>
                                <th className="pedidos-center-cell">CANTIDAD</th>
                                <th className="pedidos-number-cell">PRECIO UNITARIO</th>
                                <th className="pedidos-number-cell">SUBTOTAL</th>
                                <th>OBSERVACIÓN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detalles.map((detalle) => (
                                <tr key={detalle.idDetalle}>
                                    <td><strong>{detalle.nombreProducto}</strong></td>
                                    <td className="pedidos-center-cell">
                                        <span className="pedido-detail-quantity">{detalle.cantidad}</span>
                                    </td>
                                    <td className="pedidos-number-cell">{dinero(detalle.precioUnitario)}</td>
                                    <td className="pedidos-number-cell pedidos-detail-subtotal">{dinero(detalle.subtotal)}</td>
                                    <td className="pedidos-detail-observation">{detalle.observacion || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
