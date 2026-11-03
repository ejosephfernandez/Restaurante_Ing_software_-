import { useEffect, useMemo, useState } from "react";

import { pedidoService } from "../services/pedidoService.js";
import { ETIQUETAS_ESTADO } from "./PedidosList.jsx";

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
        <div>
            {error && (
                <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
                    <span>{error}</span>
                    <button
                        type="button"
                        className="btn-close"
                        aria-label="Cerrar"
                        onClick={() => setError("")}
                    />
                </div>
            )}

            {!pedido && (
                <form onSubmit={crearPedido}>
                    <p className="text-muted">
                        Solo se pueden tomar pedidos en mesas <strong>OCUPADA</strong> o{" "}
                        <strong>RESERVADA</strong>.
                    </p>

                    <div className="row g-2 align-items-end">
                        <div className="col-12 col-md-8">
                            <label className="form-label" htmlFor="pedido-mesa">
                                Mesa *
                            </label>
                            <select
                                id="pedido-mesa"
                                className="form-select"
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
                            {mesasDisponibles.length === 0 && (
                                <div className="form-text text-danger">
                                    No hay mesas OCUPADA ni RESERVADA en este momento.
                                </div>
                            )}
                        </div>

                        <div className="col-12 col-md-4">
                            <button
                                type="submit"
                                className="btn btn-primary w-100"
                                disabled={guardando || mesasDisponibles.length === 0}
                            >
                                {guardando ? "Creando..." : "Crear pedido"}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {pedido && (
                <>
                    {/* Cabecera del pedido */}
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                        <div>
                            <h5 className="mb-0">Pedido #{pedido.idPedido}</h5>
                            <span className="text-muted small">
                                Mesa {pedido.numeroMesa} · {ETIQUETAS_ESTADO[pedido.estado] || pedido.estado}
                            </span>
                        </div>
                        <div className="text-end">
                            <span className="text-muted small d-block">Total</span>
                            <strong className="fs-5">{dinero(pedido.total)}</strong>
                        </div>
                    </div>

                    {!puedeEditar && (
                        <div className="alert alert-secondary py-2">
                            El pedido esta {ETIQUETAS_ESTADO[pedido.estado] || pedido.estado}: ya no se
                            pueden modificar sus productos.
                        </div>
                    )}

                    {/* Buscador de productos */}
                    {puedeEditar && (
                        <div className="card mb-3">
                            <div className="card-body">
                                <label className="form-label" htmlFor="buscar-producto">
                                    Buscar producto
                                </label>
                                <input
                                    id="buscar-producto"
                                    type="search"
                                    className="form-control"
                                    placeholder="Escribe el nombre del producto..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />

                                <div className="list-group list-group-flush mt-2">
                                    {resultados.length === 0 && (
                                        <span className="text-muted small py-2">
                                            No se encontraron productos disponibles.
                                        </span>
                                    )}

                                    {resultados.map((producto) => (
                                        <button
                                            key={producto.idProducto}
                                            type="button"
                                            className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                                                productoSeleccionado?.idProducto === producto.idProducto
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() => setProductoSeleccionado(producto)}
                                        >
                                            <span>{producto.nombre}</span>
                                            <span className="small">{dinero(producto.precio)}</span>
                                        </button>
                                    ))}
                                </div>

                                {productoSeleccionado && (
                                    <form className="row g-2 align-items-end mt-3" onSubmit={agregarProducto}>
                                        <div className="col-12 col-md-4">
                                            <label className="form-label mb-1">Producto</label>
                                            <input
                                                className="form-control"
                                                value={productoSeleccionado.nombre}
                                                readOnly
                                            />
                                        </div>

                                        <div className="col-6 col-md-2">
                                            <label className="form-label mb-1" htmlFor="detalle-cantidad">
                                                Cantidad *
                                            </label>
                                            <input
                                                id="detalle-cantidad"
                                                type="number"
                                                className="form-control"
                                                min="1"
                                                value={cantidad}
                                                onChange={(e) => setCantidad(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="col-6 col-md-3">
                                            <label className="form-label mb-1" htmlFor="detalle-observacion">
                                                Observacion
                                            </label>
                                            <input
                                                id="detalle-observacion"
                                                type="text"
                                                className="form-control"
                                                maxLength="255"
                                                placeholder="Sin cebolla"
                                                value={observacion}
                                                onChange={(e) => setObservacion(e.target.value)}
                                            />
                                        </div>

                                        <div className="col-12 col-md-3">
                                            <button
                                                type="submit"
                                                className="btn btn-success w-100"
                                                disabled={guardando}
                                            >
                                                {guardando ? "Agregando..." : "Agregar"}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Detalle actual del pedido */}
                    <div className="table-responsive">
                        <table className="table table-sm align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Producto</th>
                                    <th className="text-center">Cantidad</th>
                                    <th className="text-end">Subtotal</th>
                                    <th>Observacion</th>
                                    {puedeEditar && <th className="text-end">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {(pedido.detalles || []).length === 0 && (
                                    <tr>
                                        <td colSpan={puedeEditar ? 5 : 4} className="text-center text-muted">
                                            El pedido aun no tiene productos.
                                        </td>
                                    </tr>
                                )}

                                {(pedido.detalles || []).map((detalle) => {
                                    const enEdicion = editando?.idDetalle === detalle.idDetalle;

                                    return (
                                        <tr key={detalle.idDetalle}>
                                            <td>{detalle.nombreProducto}</td>
                                            <td className="text-center" style={{ maxWidth: 110 }}>
                                                {enEdicion ? (
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm text-center"
                                                        min="1"
                                                        value={editando.cantidad}
                                                        onChange={(e) =>
                                                            setEditando({
                                                                ...editando,
                                                                cantidad: e.target.value
                                                            })
                                                        }
                                                    />
                                                ) : (
                                                    detalle.cantidad
                                                )}
                                            </td>
                                            <td className="text-end">{dinero(detalle.subtotal)}</td>
                                            <td>
                                                {enEdicion ? (
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
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
                                                    <span className="small text-muted">
                                                        {detalle.observacion || "—"}
                                                    </span>
                                                )}
                                            </td>
                                            {puedeEditar && (
                                                <td className="text-end">
                                                    {enEdicion ? (
                                                        <div className="d-flex gap-1 justify-content-end">
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-success"
                                                                onClick={guardarDetalle}
                                                                disabled={guardando}
                                                            >
                                                                Guardar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-secondary"
                                                                onClick={() => setEditando(null)}
                                                                disabled={guardando}
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="d-flex gap-1 justify-content-end">
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-primary"
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
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => eliminarDetalle(detalle)}
                                                                disabled={guardando}
                                                            >
                                                                Quitar
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {onCerrar && (
                <div className="text-end border-top pt-3 mt-3">
                    <button type="button" className="btn btn-outline-secondary" onClick={onCerrar}>
                        Cerrar
                    </button>
                </div>
            )}
        </div>
    );
}
