import { useEffect, useState } from "react";

import PedidoForm from "../components/PedidoForm.jsx";
import PedidosList from "../components/PedidosList.jsx";
import { pedidoService } from "../services/pedidoService.js";

/**
 * Pagina del modulo de pedidos: carga los datos, orquesta las acciones de
 * cambio de estado y muestra el formulario para crear/editar un pedido.
 */

// Accion que dispara cada boton de la tabla.
const ACCIONES = {
    "enviar-cocina": {
        llamar: pedidoService.enviarACocina,
        mensaje: "Pedido enviado a cocina."
    },
    listo: {
        llamar: pedidoService.marcarListo,
        mensaje: "Pedido marcado como listo."
    },
    entregado: {
        llamar: pedidoService.marcarEntregado,
        mensaje: "Pedido marcado como entregado."
    },
    cancelar: {
        llamar: pedidoService.cancelar,
        mensaje: "Pedido cancelado."
    }
};

export default function PedidosPage() {
    const [pedidos, setPedidos] = useState([]);
    const [mesas, setMesas] = useState([]);
    const [productos, setProductos] = useState([]);

    const [filtros, setFiltros] = useState({ estado: "", idMesa: "" });
    const [version, setVersion] = useState(0); // fuerza recarga despues de una accion

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [procesandoId, setProcesandoId] = useState(null);

    const [formAbierto, setFormAbierto] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

    // Carga de pedidos cada vez que cambian los filtros o se pide recargar.
    useEffect(() => {
        let vigente = true;

        (async () => {
            setCargando(true);
            try {
                const datos = await pedidoService.listar(filtros);
                if (vigente) {
                    setPedidos(Array.isArray(datos) ? datos : []);
                    setError("");
                }
            } catch (err) {
                if (vigente) setError(err.message || "No fue posible cargar los pedidos.");
            } finally {
                if (vigente) setCargando(false);
            }
        })();

        // Evita actualizar el estado si el componente se desmonta o cambian los filtros.
        return () => {
            vigente = false;
        };
    }, [filtros, version]);

    // Catalogos que necesita el formulario (se cargan una sola vez).
    useEffect(() => {
        let vigente = true;

        (async () => {
            try {
                const [mesasApi, productosApi] = await Promise.all([
                    pedidoService.listarMesas(),
                    pedidoService.listarProductosDisponibles()
                ]);

                if (vigente) {
                    setMesas(Array.isArray(mesasApi) ? mesasApi : []);
                    setProductos(Array.isArray(productosApi) ? productosApi : []);
                }
            } catch (err) {
                if (vigente) {
                    setError(err.message || "No fue posible cargar mesas y productos.");
                }
            }
        })();

        return () => {
            vigente = false;
        };
    }, []);

    function recargar() {
        setVersion((valor) => valor + 1);
    }

    function cambiarFiltro(campo, valor) {
        setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
    }

    function abrirNuevoPedido() {
        setPedidoSeleccionado(null);
        setFormAbierto(true);
        setError("");
        setMensaje("");
    }

    function abrirProductos(pedido) {
        setPedidoSeleccionado(pedido);
        setFormAbierto(true);
        setError("");
        setMensaje("");
    }

    // Ejecuta el cambio de estado elegido en la tabla.
    async function ejecutarAccion(pedido, accion) {
        const config = ACCIONES[accion];
        if (!config) return;

        if (accion === "cancelar" && !window.confirm(`¿Cancelar el pedido #${pedido.idPedido}?`)) {
            return;
        }

        setProcesandoId(pedido.idPedido);
        setError("");
        setMensaje("");

        try {
            const actualizado = await config.llamar(pedido.idPedido);
            setMensaje(config.mensaje);

            // Mantiene sincronizado el formulario si el pedido abierto es el mismo.
            if (pedidoSeleccionado?.idPedido === pedido.idPedido) {
                setPedidoSeleccionado(actualizado);
            }

            recargar();
        } catch (err) {
            setError(err.message || "No fue posible actualizar el pedido.");
        } finally {
            setProcesandoId(null);
        }
    }

    // El formulario avisa cuando crea un pedido o modifica su detalle.
    function alActualizarPedido(actualizado) {
        setPedidoSeleccionado(actualizado);
        recargar();
    }

    return (
        <div className="container-fluid py-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                    <h2 className="mb-0">Pedidos</h2>
                    <p className="text-muted mb-0">
                        Crea pedidos, agrega productos y actualiza su estado.
                    </p>
                </div>

                <button type="button" className="btn btn-primary" onClick={abrirNuevoPedido}>
                    + Nuevo pedido
                </button>
            </div>

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

            {mensaje && (
                <div className="alert alert-success d-flex justify-content-between align-items-center" role="status">
                    <span>{mensaje}</span>
                    <button
                        type="button"
                        className="btn-close"
                        aria-label="Cerrar"
                        onClick={() => setMensaje("")}
                    />
                </div>
            )}

            <PedidosList
                pedidos={pedidos}
                cargando={cargando}
                procesandoId={procesandoId}
                filtros={filtros}
                mesas={mesas}
                onCambiarFiltro={cambiarFiltro}
                onAccion={ejecutarAccion}
                onAgregarProductos={abrirProductos}
            />

            {/* Formulario en modal (Bootstrap sin JavaScript: se controla con estado) */}
            {formAbierto && (
                <>
                    <div
                        className="modal fade show d-block"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-form-pedido"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) setFormAbierto(false);
                        }}
                    >
                        <div className="modal-dialog modal-lg modal-dialog-scrollable">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title" id="titulo-form-pedido">
                                        {pedidoSeleccionado
                                            ? `Pedido #${pedidoSeleccionado.idPedido}`
                                            : "Nuevo pedido"}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Cerrar"
                                        onClick={() => setFormAbierto(false)}
                                    />
                                </div>

                                <div className="modal-body">
                                    <PedidoForm
                                        pedidoInicial={pedidoSeleccionado}
                                        mesas={mesas}
                                        productos={productos}
                                        onPedidoActualizado={alActualizarPedido}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" />
                </>
            )}
        </div>
    );
}
