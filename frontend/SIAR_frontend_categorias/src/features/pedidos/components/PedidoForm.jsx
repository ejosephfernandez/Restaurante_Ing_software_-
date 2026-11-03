import { useEffect, useMemo, useState } from "react";

import { pedidoService } from "../services/pedidoService.js";
import { ETIQUETAS_ESTADO } from "./PedidosList.jsx";
import "../../../styles/pedido-form.css";

/**
 * Formulario del pedido.
 *
 * Dos momentos en un mismo componente:
 *  1. Si no hay pedido: se elige la mesa y se crea el pedido (POST /api/pedidos).
 *  2. Si ya hay pedido: buscador de productos para agregarlos al detalle
 *     (POST /api/pedidos/{id}/detalles) y edicion de los productos cargados.
 *
 * El backend solo permite modificar detalles si el pedido esta PENDIENTE o
 * EN_PREPARACION, asi que el formulario se bloquea en los demas estados.
 */

const ESTADOS_EDITABLES = ["PENDIENTE", "EN_PREPARACION"];
// Estados de mesa con los que el backend permite crear un pedido.
const ESTADOS_MESA_VALIDOS = ["OCUPADA", "RESERVADA"];

const dinero = (valor) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(Number(valor || 0));

export default function PedidoForm({
    pedidoInicial = null,
    mesas = [],
    productos = [],
    onPedidoActualizado,
    onCerrar
}) {
    const [pedido, setPedido] = useState(pedidoInicial);
    const [idMesa, setIdMesa] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidad, setCantidad] = useState(1);
    const [observacion, setObservacion] = useState("");
    const [editando, setEditando] = useState(null); // { idDetalle, cantidad, observacion }
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    // Si el padre cambia el pedido seleccionado, se sincroniza el formulario.
    useEffect(() => {
        setPedido(pedidoInicial);
        setEditando(null);
        setProductoSeleccionado(null);
    }, [pedidoInicial]);

    const mesasDisponibles = useMemo(
        () =>
            mesas.filter((mesa) =>
                ESTADOS_MESA_VALIDOS.includes((mesa.estado || "").toUpperCase())
            ),
        [mesas]
    );

    // Buscador: filtra en memoria los productos disponibles.
    const resultados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        const base = texto
            ? productos.filter((producto) =>
                  (producto.nombre || "").toLowerCase().includes(texto)
              )
            : productos;

        return base.slice(0, 8);
    }, [busqueda, productos]);

    const puedeEditar = pedido ? ESTADOS_EDITABLES.includes(pedido.estado) : false;

    // Envuelve una accion asincrona para no repetir try/catch en cada boton.
    async function ejecutar(accion, mensajeError) {
        setGuardando(true);
        setError("");
        try {
            return await accion();
        } catch (err) {
            setError(err.message || mensajeError);
            return null;
        } finally {
            setGuardando(false);
        }
    }

    // 1) Crear el pedido para la mesa elegida.
    async function crearPedido(evento) {
        evento.preventDefault();

        if (!idMesa) {
            setError("Selecciona una mesa para crear el pedido.");
            return;
        }

        const creado = await ejecutar(
            () => pedidoService.crear(idMesa),
            "No fue posible crear el pedido."
        );

        if (creado) {
            setPedido(creado);
            onPedidoActualizado?.(creado);
        }
    }

    // 2) Agregar el producto seleccionado al pedido.
    async function agregarProducto(evento) {
        evento.preventDefault();

        if (!productoSeleccionado) {
            setError("Selecciona un producto de la lista.");
            return;
        }
        if (!cantidad || Number(cantidad) <= 0) {
            setError("La cantidad debe ser mayor a cero.");
            return;
        }

        const actualizado = await ejecutar(
            () =>
                pedidoService.agregarDetalle(pedido.idPedido, {
                    idProducto: productoSeleccionado.idProducto,
                    cantidad,
                    observacion
                }),
            "No fue posible agregar el producto."
        );

        if (actualizado) {
            setPedido(actualizado);
            setProductoSeleccionado(null);
            setCantidad(1);
            setObservacion("");
            setBusqueda("");
            onPedidoActualizado?.(actualizado);
        }
    }

    // 3) Guardar cantidad y observacion de un detalle ya cargado.
    async function guardarDetalle() {
        if (!editando) return;

        if (!editando.cantidad || Number(editando.cantidad) <= 0) {
            setError("La cantidad debe ser mayor a cero.");
            return;
        }

        const actualizado = await ejecutar(
            () =>
                pedidoService.modificarDetalle(pedido.idPedido, editando.idDetalle, {
                    cantidad: editando.cantidad,
                    observacion: editando.observacion
                }),
            "No fue posible modificar el producto."
        );

        if (actualizado) {
            setPedido(actualizado);
            setEditando(null);
            onPedidoActualizado?.(actualizado);
        }
    }

    // 4) Quitar un producto del pedido.
    async function eliminarDetalle(detalle) {
        if (!window.confirm(`¿Quitar "${detalle.nombreProducto}" del pedido?`)) return;

        const actualizado = await ejecutar(
            () => pedidoService.eliminarDetalle(pedido.idPedido, detalle.idDetalle),
            "No fue posible eliminar el producto."
        );

        if (actualizado) {
            setPedido(actualizado);
            onPedidoActualizado?.(actualizado);
        }
    }

    return (
        <div className="pedido-form">
            {error && (
                <div className="pedido-form-alert" role="alert">
                    <span className="pedido-form-alert-icon">!</span>
                    <span>{error}</span>
                    <button
                        type="button"
                        className="pedido-form-alert-close"
                        aria-label="Cerrar mensaje"
                        onClick={() => setError("")}
                    >
                        ×
                    </button>
                </div>
            )}

            {!pedido && (
                <form className="pedido-create-form" onSubmit={crearPedido}>
                    <div className="pedido-form-section-heading">
                        <span className="pedido-form-step">01</span>
                        <div>
                            <h3>Asignar mesa</h3>
                            <p>Selecciona la mesa en la que se registrará el pedido.</p>
                        </div>
                    </div>

                    <div className="pedido-create-grid">
                        <div className="pedido-form-field">
                            <label htmlFor="pedido-mesa">Mesa *</label>
                            <select
                                id="pedido-mesa"
                                className="form-select pedido-form-control"
                                value={idMesa}
                                onChange={(e) => setIdMesa(e.target.value)}
                                required
                            >
                                <option value="">Selecciona una mesa</option>
                                {mesasDisponibles.map((mesa) => (
                                    <option key={mesa.idMesa} value={mesa.idMesa}>
                                        Mesa {mesa.numero} · {mesa.estado} · {mesa.capacidad} personas
                                    </option>
                                ))}
                            </select>
                            <small>Solo se pueden tomar pedidos en mesas OCUPADAS o RESERVADAS.</small>
                            {mesasDisponibles.length === 0 && (
                                <small className="pedido-form-field-warning">
                                    No hay mesas OCUPADAS ni RESERVADAS en este momento.
                                </small>
                            )}
                        </div>

                        <div className="pedido-create-action">
                            <button
                                type="submit"
                                className="button button-primary"
                                disabled={guardando || mesasDisponibles.length === 0}
                            >
                                {guardando ? (
                                    <><span className="spinner" /> Creando pedido…</>
                                ) : (
                                    "Crear pedido"
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {pedido && (
                <div className="pedido-management">
                    <section className="pedido-summary">
                        <div className="pedido-summary-main">
                            <span className="pedido-summary-label">PEDIDO ACTUAL</span>
                            <h3>Pedido #{pedido.idPedido}</h3>
                            <p>
                                Mesa {pedido.numeroMesa}
                                <span>·</span>
                                {ETIQUETAS_ESTADO[pedido.estado] || pedido.estado}
                            </p>
                        </div>
                        <div className="pedido-summary-total">
                            <span>Total del pedido</span>
                            <strong>{dinero(pedido.total)}</strong>
                        </div>
                    </section>

                    {!puedeEditar && (
                        <div className="pedido-locked-notice" role="status">
                            Este pedido está {ETIQUETAS_ESTADO[pedido.estado] || pedido.estado}.
                            Ya no es posible modificar sus productos.
                        </div>
                    )}

                    {puedeEditar && (
                        <section className="pedido-products-panel">
                            <div className="pedido-form-section-heading">
                                <span className="pedido-form-step">02</span>
                                <div>
                                    <h3>Agregar productos</h3>
                                    <p>Busca y selecciona los productos que solicita el cliente.</p>
                                </div>
                            </div>

                            <div className="pedido-form-field">
                                <label htmlFor="buscar-producto">Buscar producto</label>
                                <input
                                    id="buscar-producto"
                                    type="search"
                                    className="form-control pedido-form-control"
                                    placeholder="Escribe el nombre del producto..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </div>

                            <div className="pedido-product-results">
                                {resultados.length === 0 ? (
                                    <div className="pedido-product-empty">
                                        No se encontraron productos disponibles.
                                    </div>
                                ) : (
                                    resultados.map((producto) => {
                                        const seleccionado =
                                            productoSeleccionado?.idProducto === producto.idProducto;

                                        return (
                                            <button
                                                key={producto.idProducto}
                                                type="button"
                                                className={`pedido-product-option ${seleccionado ? "selected" : ""}`}
                                                onClick={() => setProductoSeleccionado(producto)}
                                                aria-pressed={seleccionado}
                                            >
                                                <span className="pedido-product-option-mark">
                                                    {seleccionado ? "✓" : "+"}
                                                </span>
                                                <span className="pedido-product-option-copy">
                                                    <strong>{producto.nombre}</strong>
                                                    <small>Agregar al pedido</small>
                                                </span>
                                                <span className="pedido-product-option-price">
                                                    {dinero(producto.precio)}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {productoSeleccionado && (
                                <form className="pedido-add-form" onSubmit={agregarProducto}>
                                    <div className="pedido-add-form-heading">
                                        <div>
                                            <span className="pedido-summary-label">PRODUCTO SELECCIONADO</span>
                                            <strong>{productoSeleccionado.nombre}</strong>
                                        </div>
                                        <span>{dinero(productoSeleccionado.precio)}</span>
                                    </div>

                                    <div className="pedido-add-grid">
                                        <div className="pedido-form-field pedido-quantity-field">
                                            <label htmlFor="detalle-cantidad">Cantidad *</label>
                                            <input
                                                id="detalle-cantidad"
                                                type="number"
                                                className="form-control pedido-form-control"
                                                min="1"
                                                step="1"
                                                value={cantidad}
                                                onChange={(e) => setCantidad(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="pedido-form-field">
                                            <label htmlFor="detalle-observacion">Observación</label>
                                            <input
                                                id="detalle-observacion"
                                                type="text"
                                                className="form-control pedido-form-control"
                                                maxLength="255"
                                                placeholder="Ej. Sin cebolla"
                                                value={observacion}
                                                onChange={(e) => setObservacion(e.target.value)}
                                            />
                                        </div>

                                        <div className="pedido-add-action">
                                            <button
                                                type="submit"
                                                className="button button-primary"
                                                disabled={guardando}
                                            >
                                                {guardando ? (
                                                    <><span className="spinner" /> Agregando…</>
                                                ) : (
                                                    "Agregar producto"
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </section>
                    )}

                    <section className="pedido-details-panel">
                        <div className="pedido-details-heading">
                            <div className="pedido-form-section-heading">
                                <span className="pedido-form-step">03</span>
                                <div>
                                    <h3>Detalle del pedido</h3>
                                    <p>Productos registrados, cantidades y subtotales.</p>
                                </div>
                            </div>
                            <span className="pedido-detail-count">
                                {(pedido.detalles || []).length} productos
                            </span>
                        </div>

                        <div className="pedido-detail-table-wrap">
                            <table className="table pedido-detail-table">
                                <thead>
                                    <tr>
                                        <th>PRODUCTO</th>
                                        <th className="text-center">CANTIDAD</th>
                                        <th className="text-end">SUBTOTAL</th>
                                        <th>OBSERVACIÓN</th>
                                        {puedeEditar && <th className="text-end">ACCIONES</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(pedido.detalles || []).length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={puedeEditar ? 5 : 4}
                                                className="pedido-detail-empty"
                                            >
                                                Aún no se han agregado productos a este pedido.
                                            </td>
                                        </tr>
                                    )}

                                    {(pedido.detalles || []).map((detalle) => {
                                        const enEdicion =
                                            editando?.idDetalle === detalle.idDetalle;

                                        return (
                                            <tr key={detalle.idDetalle}>
                                                <td>
                                                    <strong className="pedido-detail-product-name">
                                                        {detalle.nombreProducto}
                                                    </strong>
                                                </td>

                                                <td className="text-center">
                                                    {enEdicion ? (
                                                        <input
                                                            type="number"
                                                            className="form-control form-control-sm pedido-inline-input"
                                                            min="1"
                                                            step="1"
                                                            value={editando.cantidad}
                                                            onChange={(e) =>
                                                                setEditando({
                                                                    ...editando,
                                                                    cantidad: e.target.value
                                                                })
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="pedido-detail-quantity">
                                                            {detalle.cantidad}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="text-end">
                                                    <strong className="pedido-detail-subtotal">
                                                        {dinero(detalle.subtotal)}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {enEdicion ? (
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm pedido-inline-input"
                                                            maxLength="255"
                                                            value={editando.observacion}
                                                            onChange={(e) =>
                                                                setEditando({
                                                                    ...editando,
                                                                    observacion: e.target.value
                                                                })
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="pedido-detail-observation">
                                                            {detalle.observacion || "—"}
                                                        </span>
                                                    )}
                                                </td>

                                                {puedeEditar && (
                                                    <td>
                                                        <div className="pedido-detail-actions">
                                                            {enEdicion ? (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="button button-primary button-small"
                                                                        onClick={guardarDetalle}
                                                                        disabled={guardando}
                                                                    >
                                                                        Guardar
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="button button-secondary button-small"
                                                                        onClick={() => setEditando(null)}
                                                                        disabled={guardando}
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="button button-secondary button-small"
                                                                        onClick={() =>
                                                                            setEditando({
                                                                                idDetalle: detalle.idDetalle,
                                                                                cantidad: detalle.cantidad,
                                                                                observacion: detalle.observacion || ""
                                                                            })
                                                                        }
                                                                    >
                                                                        Editar
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="button button-danger button-small"
                                                                        onClick={() => eliminarDetalle(detalle)}
                                                                        disabled={guardando}
                                                                    >
                                                                        Quitar
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            )}

            {onCerrar && (
                <div className="pedido-form-footer">
                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={onCerrar}
                    >
                        Cerrar
                    </button>
                </div>
            )}
        </div>
    );
}
