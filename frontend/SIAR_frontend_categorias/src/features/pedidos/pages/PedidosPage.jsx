import { useEffect, useMemo, useState } from "react";

import PedidoForm from "../components/PedidoForm.jsx";
import PedidosList from "../components/PedidosList.jsx";
import { pedidoService } from "../services/pedidoService.js";
import SiarIcon from "../../../components/ui/SiarIcon.jsx";
import "../../../styles/pedidos.css";

import UsuarioActual from "../../../components/ui/UsuarioActual.jsx";
/**
 * Página del módulo de pedidos.
 * Conserva la lógica de negocio existente y utiliza el sistema visual global SIAR.
 */
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

function normalizarEstado(estado) {
    return String(estado ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");
}

function obtenerEstado(pedido) {
    return normalizarEstado(
        pedido?.estado ?? pedido?.estadoPedido ?? pedido?.nombreEstado
    );
}

function StatCard({ icon, label, value, note, tone = "icon-green" }) {
    return (
        <article className="stat-card pedido-stat-card">
            <div className="stat-label">
                {label}
                <span className={`stat-icon ${tone}`}>
                    <SiarIcon name={icon} size="sm" />
                </span>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-note">{note}</div>
        </article>
    );
}

export default function PedidosPage() {
    const [pedidos, setPedidos] = useState([]);
    const [mesas, setMesas] = useState([]);
    const [productos, setProductos] = useState([]);

    const [filtros, setFiltros] = useState({ estado: "", idMesa: "" });
    const [version, setVersion] = useState(0);

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [procesandoId, setProcesandoId] = useState(null);

    const [formAbierto, setFormAbierto] = useState(false);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

    // Carga de pedidos cuando cambian los filtros o se solicita una actualización.
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
                if (vigente) {
                    setError(err?.message || "No fue posible cargar los pedidos.");
                }
            } finally {
                if (vigente) setCargando(false);
            }
        })();

        return () => {
            vigente = false;
        };
    }, [filtros, version]);

    // Catálogos requeridos por el formulario.
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
                    setError(err?.message || "No fue posible cargar mesas y productos.");
                }
            }
        })();

        return () => {
            vigente = false;
        };
    }, []);

    function recargar() {
        setVersion((actual) => actual + 1);
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

    async function ejecutarAccion(pedido, accion) {
        const config = ACCIONES[accion];
        if (!config) return;

        if (
            accion === "cancelar" &&
            !window.confirm(`¿Cancelar el pedido #${pedido.idPedido}?`)
        ) {
            return;
        }

        setProcesandoId(pedido.idPedido);
        setError("");
        setMensaje("");

        try {
            const actualizado = await config.llamar(pedido.idPedido);
            setMensaje(config.mensaje);

            if (pedidoSeleccionado?.idPedido === pedido.idPedido) {
                setPedidoSeleccionado(actualizado);
            }

            recargar();
        } catch (err) {
            setError(err?.message || "No fue posible actualizar el pedido.");
        } finally {
            setProcesandoId(null);
        }
    }

    function alActualizarPedido(actualizado) {
        setPedidoSeleccionado(actualizado);
        recargar();
    }

    const resumen = useMemo(() => {
        const estados = pedidos.map(obtenerEstado);
        return {
            total: pedidos.length,
            pendientes: estados.filter((estado) => estado === "PENDIENTE").length,
            preparacion: estados.filter((estado) =>
                ["EN_PREPARACION", "PREPARACION"].includes(estado)
            ).length,
            listos: estados.filter((estado) => ["LISTO", "LISTA"].includes(estado)).length
        };
    }, [pedidos]);

    return (
        <div className="pedidos-module">
            <header className="topbar">
                <div className="breadcrumb">
                    <span>Inicio</span>
                    <span className="crumb-separator">/</span>
                    <strong>Pedidos</strong>
                </div>

                <div className="topbar-right">
                    <span className="environment-pill">
                        <span /> Entorno local
                    </span>
                    <UsuarioActual />
                </div>
            </header>

            <main className="page-content pedidos-page-content">
                <section className="page-heading">
                    <div>
                        <div className="eyebrow">MÓDULO DE PEDIDOS </div>
                        <h1>GESTIÓN DE PEDIDOS</h1>
                        <p>Administra las comandas, agrega productos y da seguimiento a cada pedido.</p>
                    </div>
                    <button
                        type="button"
                        className="button button-primary button-add"
                        onClick={abrirNuevoPedido}
                    >
                        <SiarIcon name="plus" size="sm" /> Nuevo pedido
                    </button>
                </section>

                {error && !formAbierto && (
                    <section className="connection-alert pedidos-connection-alert" role="alert">
                        <div className="alert-icon">
                            <SiarIcon name="warning" size="md" />
                        </div>
                        <div className="alert-copy">
                            <strong>No se pudo completar la operación</strong>
                            <p>{error}</p>
                        </div>
                        <button
                            type="button"
                            className="icon-button pedidos-alert-close"
                            onClick={() => setError("")}
                            aria-label="Cerrar mensaje"
                        >
                            <SiarIcon name="close" size="sm" />
                        </button>
                    </section>
                )}

                {mensaje && (
                    <div className="toast toast-success pedidos-toast" role="status">
                        <SiarIcon name="check" size="md" />
                        <span>{mensaje}</span>
                        <button type="button" onClick={() => setMensaje("")} aria-label="Cerrar notificación">
                            <SiarIcon name="close" size="sm" />
                        </button>
                    </div>
                )}

                <section className="stats-grid pedidos-stats-grid" aria-label="Resumen de pedidos">
                    <StatCard
                        icon="clipboard"
                        label="Pedidos consultados"
                        value={cargando ? "—" : String(resumen.total).padStart(2, "0")}
                        note="Según los filtros actuales"
                        tone="icon-violet"
                    />
                    <StatCard
                        icon="calendar"
                        label="Pendientes"
                        value={cargando ? "—" : String(resumen.pendientes).padStart(2, "0")}
                        note="Esperando atención"
                        tone="icon-amber"
                    />
                    <StatCard
                        icon="utensils"
                        label="En preparación"
                        value={cargando ? "—" : String(resumen.preparacion).padStart(2, "0")}
                        note="En proceso en cocina"
                        tone="icon-green"
                    />
                    <StatCard
                        icon="check"
                        label="Listos"
                        value={cargando ? "—" : String(resumen.listos).padStart(2, "0")}
                        note="Pendientes de entrega"
                        tone="icon-green"
                    />
                </section>

                <section className="pedidos-list-shell" aria-label="Listado de pedidos">
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
                </section>

                {formAbierto && (
                    <div
                        className="pedidos-modal-overlay"
                        role="presentation"
                        onMouseDown={(evento) => {
                            if (evento.target === evento.currentTarget) setFormAbierto(false);
                        }}
                    >
                        <section
                            className="pedidos-dialog"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="titulo-form-pedido"
                        >
                            <div className="pedidos-dialog-header">
                                <div>
                                    <span className="eyebrow">GESTIÓN DE PEDIDOS</span>
                                    <h2 id="titulo-form-pedido">
                                        {pedidoSeleccionado
                                            ? `Pedido #${pedidoSeleccionado.idPedido}`
                                            : "Nuevo pedido"}
                                    </h2>
                                    <p>Selecciona una mesa y agrega los productos solicitados.</p>
                                </div>
                                <button
                                    type="button"
                                    className="icon-button"
                                    aria-label="Cerrar"
                                    onClick={() => setFormAbierto(false)}
                                >
                                    <SiarIcon name="close" size="sm" />
                                </button>
                            </div>

                            <div className="pedidos-modal-body">
                                <PedidoForm
                                    pedidoInicial={pedidoSeleccionado}
                                    mesas={mesas}
                                    productos={productos}
                                    onPedidoActualizado={alActualizarPedido}
                                />
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}
