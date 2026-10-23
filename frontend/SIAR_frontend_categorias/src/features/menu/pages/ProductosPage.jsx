import { useCallback, useEffect, useMemo, useState } from "react";
import { productoService } from "../services/productoService.js";
import "../../../styles/productos.css";

const formularioInicial = {
    nombre: "",
    descripcion: "",
    precio: "",
    imagen: "",
    categoriaId: "",
    disponible: true
};

function formatearPrecio(precio) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(Number(precio || 0));
}

export default function ProductosPage() {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);

    const [busqueda, setBusqueda] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("todas");
    const [filtroEstado, setFiltroEstado] = useState("todos");

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [productoEditando, setProductoEditando] = useState(null);
    const [formulario, setFormulario] = useState(formularioInicial);

    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [guardando, setGuardando] = useState(false);

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        setError("");

        try {
            const [resultadoProductos, resultadoCategorias] =
                await Promise.allSettled([
                    productoService.listar(),
                    productoService.listarCategoriasActivas()
                ]);

            if (resultadoProductos.status === "rejected") {
                throw resultadoProductos.reason;
            }

            const listaProductos = resultadoProductos.value;
            setProductos(
                Array.isArray(listaProductos) ? listaProductos : []
            );

            if (resultadoCategorias.status === "fulfilled") {
                const listaCategorias = resultadoCategorias.value;
                setCategorias(
                    Array.isArray(listaCategorias) ? listaCategorias : []
                );
            } else {
                setCategorias([]);
                setError(
                    "No se pudieron cargar las categorías. " +
                    "Verifica el endpoint /api/categorias/activas."
                );
            }
        } catch (e) {
            setError(
                e.message ||
                "No se pudieron cargar los productos. Verifica el backend."
            );
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const productosFiltrados = useMemo(() => {
        return productos.filter((producto) => {
            const nombre = (producto.nombre || "").toLowerCase();
            const consulta = busqueda.trim().toLowerCase();

            const coincideNombre = nombre.includes(consulta);

            const idCategoria =
                producto.categoria?.idCategoria ??
                producto.idCategoria;

            const coincideCategoria =
                filtroCategoria === "todas" ||
                String(idCategoria) === filtroCategoria;

            let coincideEstado = true;

            if (filtroEstado === "activos") {
                coincideEstado = producto.activo === true;
            } else if (filtroEstado === "inactivos") {
                coincideEstado = producto.activo === false;
            } else if (filtroEstado === "disponibles") {
                coincideEstado =
                    producto.activo === true &&
                    producto.disponible === true;
            } else if (filtroEstado === "agotados") {
                coincideEstado =
                    producto.activo === true &&
                    producto.disponible === false;
            }

            return (
                coincideNombre &&
                coincideCategoria &&
                coincideEstado
            );
        });
    }, [productos, busqueda, filtroCategoria, filtroEstado]);

    const totalActivos = productos.filter(
        (p) => p.activo === true
    ).length;

    const totalDisponibles = productos.filter(
        (p) => p.activo === true && p.disponible === true
    ).length;

    function abrirCrear() {
        setProductoEditando(null);
        setFormulario(formularioInicial);
        setMostrarFormulario(true);
        setError("");
        setMensaje("");
    }

    function abrirEditar(producto) {
        setProductoEditando(producto);
        setFormulario({
            nombre: producto.nombre || "",
            descripcion: producto.descripcion || "",
            precio: String(producto.precio ?? ""),
            imagen: producto.imagen || "",
            categoriaId: String(
                producto.categoria?.idCategoria ??
                producto.idCategoria ??
                ""
            ),
            disponible: producto.disponible === true
        });
        setMostrarFormulario(true);
        setError("");
        setMensaje("");
    }

    function manejarCambio(evento) {
        const { name, value, type, checked } = evento.target;

        setFormulario((anterior) => ({
            ...anterior,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    async function guardarProducto(evento) {
        evento.preventDefault();
        setError("");
        setMensaje("");

        if (!formulario.categoriaId) {
            setError("Selecciona una categoría para el producto.");
            return;
        }

        const precio = Number(formulario.precio);

        if (!Number.isFinite(precio) || precio <= 0) {
            setError("El precio debe ser un número mayor que cero.");
            return;
        }

        const producto = {
            nombre: formulario.nombre.trim(),
            descripcion: formulario.descripcion.trim(),
            precio,
            imagen: formulario.imagen.trim() || null,
            disponible: formulario.disponible,
            activo: productoEditando
                ? productoEditando.activo
                : true,
            categoria: {
                idCategoria: Number(formulario.categoriaId)
            }
        };

        setGuardando(true);

        try {
            if (productoEditando) {
                await productoService.actualizar(
                    productoEditando.idProducto,
                    producto
                );
                setMensaje("Producto actualizado correctamente.");
            } else {
                await productoService.crear(producto);
                setMensaje("Producto creado correctamente.");
            }

            setMostrarFormulario(false);
            setProductoEditando(null);
            setFormulario(formularioInicial);

            await cargarDatos();
        } catch (e) {
            setError(e.message || "No se pudo guardar el producto.");
        } finally {
            setGuardando(false);
        }
    }

    async function cambiarDisponibilidad(producto) {
        setError("");
        setMensaje("");

        try {
            await productoService.cambiarDisponibilidad(
                producto.idProducto,
                !producto.disponible
            );

            setMensaje("Disponibilidad actualizada.");
            await cargarDatos();
        } catch (e) {
            setError(
                e.message || "No se pudo cambiar la disponibilidad."
            );
        }
    }

    async function desactivarProducto(producto) {
        const confirmado = window.confirm(
            `¿Deseas desactivar el producto "${producto.nombre}"?`
        );

        if (!confirmado) return;

        setError("");
        setMensaje("");

        try {
            await productoService.desactivar(producto.idProducto);
            setMensaje("Producto desactivado correctamente.");
            await cargarDatos();
        } catch (e) {
            setError(e.message || "No se pudo desactivar el producto.");
        }
    }

    function cancelarFormulario() {
        setMostrarFormulario(false);
        setProductoEditando(null);
        setFormulario(formularioInicial);
        setError("");
    }

    return (
        <main className="productos-page">
            <header className="productos-header">
                <div>
                    <p className="productos-eyebrow">SIAR / MENÚ</p>
                    <h1>Gestión de productos</h1>
                    <p className="productos-subtitulo">
                        Administra los productos, precios y disponibilidad
                        del restaurante.
                    </p>
                </div>

                <button
                    className="btn-producto btn-producto-primary"
                    onClick={abrirCrear}
                    type="button"
                >
                    <span aria-hidden="true">＋</span> Nuevo producto
                </button>
            </header>

            <section className="productos-resumen">
                <article className="resumen-card">
                    <span className="resumen-icono">▤</span>
                    <div>
                        <p>Productos registrados</p>
                        <strong>{productos.length}</strong>
                    </div>
                </article>

                <article className="resumen-card">
                    <span className="resumen-icono resumen-verde">✓</span>
                    <div>
                        <p>Productos activos</p>
                        <strong>{totalActivos}</strong>
                    </div>
                </article>

                <article className="resumen-card">
                    <span className="resumen-icono resumen-azul">◉</span>
                    <div>
                        <p>Disponibles para pedir</p>
                        <strong>{totalDisponibles}</strong>
                    </div>
                </article>
            </section>

            {error && (
                <div className="producto-alerta producto-alerta-error">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => setError("")}
                        aria-label="Cerrar mensaje"
                    >
                        ×
                    </button>
                </div>
            )}

            {mensaje && (
                <div className="producto-alerta producto-alerta-exito">
                    <span>{mensaje}</span>
                    <button
                        type="button"
                        onClick={() => setMensaje("")}
                        aria-label="Cerrar mensaje"
                    >
                        ×
                    </button>
                </div>
            )}

            {mostrarFormulario && (
                <section className="producto-form-card">
                    <div className="producto-form-heading">
                        <div>
                            <h2>
                                {productoEditando
                                    ? "Editar producto"
                                    : "Registrar producto"}
                            </h2>
                            <p>
                                Completa la información del producto.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="btn-cerrar"
                            onClick={cancelarFormulario}
                            aria-label="Cerrar formulario"
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={guardarProducto}>
                        <div className="producto-form-grid">
                            <label className="producto-campo">
                                Nombre *
                                <input
                                    name="nombre"
                                    value={formulario.nombre}
                                    onChange={manejarCambio}
                                    placeholder="Ej. Limonada natural"
                                    maxLength={100}
                                    required
                                />
                            </label>

                            <label className="producto-campo">
                                Categoría *
                                <select
                                    name="categoriaId"
                                    value={formulario.categoriaId}
                                    onChange={manejarCambio}
                                    required
                                >
                                    <option value="">
                                        Selecciona una categoría
                                    </option>

                                    {categorias.map((categoria) => (
                                        <option
                                            key={categoria.idCategoria}
                                            value={categoria.idCategoria}
                                        >
                                            {categoria.nombre}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="producto-campo">
                                Precio (COP) *
                                <input
                                    name="precio"
                                    type="number"
                                    value={formulario.precio}
                                    onChange={manejarCambio}
                                    placeholder="6500"
                                    min="1"
                                    step="1"
                                    required
                                />
                            </label>

                            <label className="producto-campo">
                                URL de imagen
                                <input
                                    name="imagen"
                                    type="url"
                                    value={formulario.imagen}
                                    onChange={manejarCambio}
                                    placeholder="https://..."
                                />
                            </label>

                            <label className="producto-campo producto-campo-completo">
                                Descripción
                                <textarea
                                    name="descripcion"
                                    value={formulario.descripcion}
                                    onChange={manejarCambio}
                                    placeholder="Describe el producto..."
                                    rows="3"
                                />
                            </label>

                            <label className="producto-checkbox">
                                <input
                                    type="checkbox"
                                    name="disponible"
                                    checked={formulario.disponible}
                                    onChange={manejarCambio}
                                />
                                Producto disponible para pedidos
                            </label>
                        </div>

                        <div className="producto-form-actions">
                            <button
                                className="btn-producto btn-producto-secondary"
                                type="button"
                                onClick={cancelarFormulario}
                            >
                                Cancelar
                            </button>

                            <button
                                className="btn-producto btn-producto-primary"
                                type="submit"
                                disabled={guardando}
                            >
                                {guardando
                                    ? "Guardando..."
                                    : productoEditando
                                        ? "Guardar cambios"
                                        : "Registrar producto"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="productos-listado">
                <div className="productos-listado-heading">
                    <div>
                        <h2>Productos registrados</h2>
                        <p>
                            Consulta y administra el menú del restaurante.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn-producto btn-producto-secondary"
                        onClick={cargarDatos}
                        disabled={cargando}
                    >
                        ↻ Actualizar
                    </button>
                </div>

                <div className="productos-filtros">
                    <label className="producto-busqueda">
                        <span aria-hidden="true">⌕</span>
                        <input
                            type="search"
                            placeholder="Buscar producto por nombre..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </label>

                    <select
                        aria-label="Filtrar por categoría"
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                    >
                        <option value="todas">Todas las categorías</option>
                        {categorias.map((categoria) => (
                            <option
                                key={categoria.idCategoria}
                                value={String(categoria.idCategoria)}
                            >
                                {categoria.nombre}
                            </option>
                        ))}
                    </select>

                    <select
                        aria-label="Filtrar por estado"
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="activos">Activos</option>
                        <option value="inactivos">Inactivos</option>
                        <option value="disponibles">Disponibles</option>
                        <option value="agotados">No disponibles</option>
                    </select>
                </div>

                {cargando ? (
                    <div className="productos-estado-vacio">
                        Cargando productos...
                    </div>
                ) : productosFiltrados.length === 0 ? (
                    <div className="productos-estado-vacio">
                        <span className="vacio-icono">▤</span>
                        <h3>No hay productos para mostrar</h3>
                        <p>
                            Prueba con otros filtros o registra un producto.
                        </p>
                        <button
                            className="btn-producto btn-producto-primary"
                            type="button"
                            onClick={abrirCrear}
                        >
                            Nuevo producto
                        </button>
                    </div>
                ) : (
                    <div className="productos-tabla-contenedor">
                        <table className="productos-tabla">
                            <thead>
                                <tr>
                                    <th>PRODUCTO</th>
                                    <th>CATEGORÍA</th>
                                    <th>PRECIO</th>
                                    <th>DISPONIBILIDAD</th>
                                    <th>ESTADO</th>
                                    <th>ACCIONES</th>
                                </tr>
                            </thead>

                            <tbody>
                                {productosFiltrados.map((producto) => (
                                    <tr key={producto.idProducto}>
                                        <td>
                                            <div className="producto-identidad">
                                                {producto.imagen ? (
                                                    <img
                                                        className="producto-imagen"
                                                        src={producto.imagen}
                                                        alt=""
                                                        onError={(e) => {
                                                            e.currentTarget.style.display =
                                                                "none";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="producto-imagen producto-imagen-vacia">
                                                        {producto.nombre
                                                            ?.charAt(0)
                                                            ?.toUpperCase() || "P"}
                                                    </div>
                                                )}

                                                <div>
                                                    <strong>
                                                        {producto.nombre}
                                                    </strong>
                                                    <span>
                                                        ID: {producto.idProducto}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            {producto.categoria?.nombre ||
                                                producto.nombreCategoria ||
                                                "Sin categoría"}
                                        </td>

                                        <td className="producto-precio">
                                            {formatearPrecio(producto.precio)}
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    producto.disponible
                                                        ? "producto-badge badge-disponible"
                                                        : "producto-badge badge-no-disponible"
                                                }
                                            >
                                                {producto.disponible
                                                    ? "Disponible"
                                                    : "No disponible"}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={
                                                    producto.activo
                                                        ? "producto-badge badge-activo"
                                                        : "producto-badge badge-inactivo"
                                                }
                                            >
                                                {producto.activo
                                                    ? "Activo"
                                                    : "Inactivo"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="producto-acciones">
                                                <button
                                                    type="button"
                                                    className="accion-editar"
                                                    onClick={() =>
                                                        abrirEditar(producto)
                                                    }
                                                    disabled={!producto.activo}
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    type="button"
                                                    className="accion-disponibilidad"
                                                    onClick={() =>
                                                        cambiarDisponibilidad(
                                                            producto
                                                        )
                                                    }
                                                    disabled={!producto.activo}
                                                >
                                                    {producto.disponible
                                                        ? "Agotar"
                                                        : "Habilitar"}
                                                </button>

                                                {producto.activo && (
                                                    <button
                                                        type="button"
                                                        className="accion-desactivar"
                                                        onClick={() =>
                                                            desactivarProducto(
                                                                producto
                                                            )
                                                        }
                                                    >
                                                        Desactivar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!cargando && productosFiltrados.length > 0 && (
                    <div className="productos-pie-tabla">
                        Mostrando {productosFiltrados.length} de{" "}
                        {productos.length} productos
                    </div>
                )}
            </section>
        </main>
    );
}