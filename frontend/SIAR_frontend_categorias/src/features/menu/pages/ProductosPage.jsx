import { useEffect, useMemo, useState } from "react";
import { productoService } from "../services/ProductoService.js";
import "../../../styles/productos.css";
import SiarIcon from "../../../components/ui/SiarIcon.jsx";

import UsuarioActual from "../../../components/ui/UsuarioActual.jsx";
const FORM_VACIO = {
  nombre: "",
  descripcion: "",
  precio: "",
  imagen: "",
  idCategoria: "",
  disponible: true,
  activo: true,
};

const idProducto = (producto) => producto?.idProducto ?? producto?.id;
const idCategoria = (producto) =>
  producto?.categoria?.idCategoria ?? producto?.idCategoria ?? "";
const nombreCategoria = (producto) =>
  producto?.nombreCategoria ?? producto?.categoria?.nombre ?? "Sin categoría";

const moneda = (valor) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(valor || 0));

function normalizarBooleano(valor) {
  if (valor === false || valor === 0 || valor === "0") return false;
  if (valor === true || valor === 1 || valor === "1") return true;
  return Boolean(valor);
}

function StatCard({ icon, label, value, note, iconClass = "icon-green" }) {
  return (
    <article className="stat-card product-stat-card">
      <div className="stat-label">
        {label}
        <span className={`stat-icon ${iconClass}`}>
          <SiarIcon name={icon} size="sm" />
        </span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </article>
  );
}

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [accionId, setAccionId] = useState(null);
  const porPagina = 5;

  async function cargar({ silencioso = false } = {}) {
    if (!silencioso) setCargando(true);
    setError("");

    try {
      const [productosApi, categoriasApi] = await Promise.all([
        productoService.listar(),
        productoService.listarCategoriasActivas(),
      ]);

      setProductos(
        Array.isArray(productosApi)
          ? productosApi.map((p) => ({
              ...p,
              activo: normalizarBooleano(p.activo),
              disponible: normalizarBooleano(p.disponible),
            }))
          : []
      );
      setCategorias(Array.isArray(categoriasApi) ? categoriasApi : []);
    } catch (e) {
      setError(e.message || "No fue posible cargar los productos.");
    } finally {
      if (!silencioso) setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // La carga inicial se ejecuta una vez al montar la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumen = useMemo(
    () => ({
      total: productos.length,
      activos: productos.filter((p) => p.activo).length,
      disponibles: productos.filter((p) => p.activo && p.disponible).length,
      noDisponibles: productos.filter((p) => p.activo && !p.disponible).length,
    }),
    [productos]
  );

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase("es");

    return productos
      .filter((producto) => {
        const coincideTexto =
          !termino ||
          [
            producto.nombre,
            producto.descripcion,
            nombreCategoria(producto),
          ].some((valor) =>
            String(valor || "").toLocaleLowerCase("es").includes(termino)
          );

        const coincideCategoria =
          categoriaFiltro === "todas" ||
          String(idCategoria(producto)) === categoriaFiltro;

        const coincideEstado =
          estadoFiltro === "todos" ||
          (estadoFiltro === "activos" && producto.activo) ||
          (estadoFiltro === "inactivos" && !producto.activo) ||
          (estadoFiltro === "disponibles" &&
            producto.activo &&
            producto.disponible) ||
          (estadoFiltro === "no-disponibles" &&
            producto.activo &&
            !producto.disponible);

        return coincideTexto && coincideCategoria && coincideEstado;
      })
      .sort((a, b) =>
        String(a.nombre || "").localeCompare(String(b.nombre || ""), "es")
      );
  }, [productos, busqueda, categoriaFiltro, estadoFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaActual = filtrados.slice(
    (pagina - 1) * porPagina,
    pagina * porPagina
  );

  useEffect(() => {
    setPagina(1);
  }, [busqueda, categoriaFiltro, estadoFiltro]);

  function mostrarMensaje(texto) {
    setMensaje(texto);
    window.setTimeout(() => setMensaje(""), 4500);
  }

  function abrirCrear() {
    setProductoEditando(null);
    setForm(FORM_VACIO);
    setError("");
    setMensaje("");
    setModalAbierto(true);
  }

  function abrirEditar(producto) {
    setProductoEditando(producto);
    setForm({
      nombre: producto.nombre ?? "",
      descripcion: producto.descripcion ?? "",
      precio: producto.precio ?? "",
      imagen: producto.imagen ?? "",
      idCategoria: String(idCategoria(producto)),
      disponible: normalizarBooleano(producto.disponible),
      activo: normalizarBooleano(producto.activo),
    });
    setError("");
    setMensaje("");
    setModalAbierto(true);
  }

  function cambiarCampo(evento) {
    const { name, value, type, checked } = evento.target;
    setForm((actual) => ({
      ...actual,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError("");
    setMensaje("");

    if (!form.nombre.trim()) {
      setError("Escribe el nombre del producto.");
      return;
    }

    if (!form.idCategoria) {
      setError("Selecciona una categoría activa.");
      return;
    }

    if (form.precio === "" || !Number.isFinite(Number(form.precio)) || Number(form.precio) <= 0) {
      setError("El precio debe ser un número mayor que cero.");
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: Number(form.precio),
      imagen: form.imagen.trim() || null,
      disponible: Boolean(form.disponible),
      activo: Boolean(form.activo),
      categoria: { idCategoria: Number(form.idCategoria) },
    };

    setGuardando(true);
    try {
      if (productoEditando) {
        await productoService.actualizar(idProducto(productoEditando), payload);
        mostrarMensaje("Producto actualizado correctamente.");
      } else {
        await productoService.crear(payload);
        mostrarMensaje("Producto creado correctamente.");
      }

      setModalAbierto(false);
      setProductoEditando(null);
      await cargar({ silencioso: true });
    } catch (e) {
      setError(e.message || "No fue posible guardar el producto.");
    } finally {
      setGuardando(false);
    }
  }

  async function alternarDisponibilidad(producto) {
    setError("");
    setMensaje("");
    setAccionId(idProducto(producto));

    try {
      await productoService.cambiarDisponibilidad(
        idProducto(producto),
        !producto.disponible
      );
      mostrarMensaje(
        producto.disponible
          ? "Producto marcado como no disponible."
          : "Producto habilitado para pedidos."
      );
      await cargar({ silencioso: true });
    } catch (e) {
      setError(e.message || "No fue posible cambiar la disponibilidad.");
    } finally {
      setAccionId(null);
    }
  }

  async function desactivar(producto) {
    if (
      !window.confirm(
        `¿Deseas desactivar el producto "${producto.nombre}"?`
      )
    ) {
      return;
    }

    setError("");
    setMensaje("");
    setAccionId(idProducto(producto));

    try {
      await productoService.desactivar(idProducto(producto));
      mostrarMensaje("Producto desactivado correctamente.");
      await cargar({ silencioso: true });
    } catch (e) {
      setError(e.message || "No fue posible desactivar el producto.");
    } finally {
      setAccionId(null);
    }
  }

  return (
    <div className="productos-module">
      <header className="topbar">
        <div className="breadcrumb">
          <span>Inicio</span>
          <span className="crumb-separator">/</span>
          <span>Menú</span>
          <span className="crumb-separator">/</span>
          <strong>Productos</strong>
        </div>

        <div className="topbar-right">
          <span className="environment-pill">
            <span /> Entorno local
          </span>
          <UsuarioActual />
        </div>
      </header>

      <div className="page-content product-page-content">
        <section className="page-heading">
          <div>
            <div className="eyebrow">
              MÓDULO DE MENÚ </div>
            <h1>Gestión de productos</h1>
            <p>Administra los productos, precios y disponibilidad del menú del restaurante.</p>
          </div>

          <button
            className="button button-primary button-add"
            type="button"
            onClick={abrirCrear}
          >
            <SiarIcon name="plus" size="sm" />
            Nuevo producto
          </button>
        </section>

        {error && (
          <section className="connection-alert product-connection-alert" role="alert">
            <div className="alert-icon">
              <SiarIcon name="warning" size="md" />
            </div>
            <div className="alert-copy">
              <strong>No se pudo completar la operación</strong>
              <p>{error}</p>
              <small>
                Verifica la conexión, el token JWT y los permisos del usuario.
              </small>
            </div>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => cargar()}
              disabled={cargando}
            >
              <SiarIcon name="refresh" size="sm" />
              Reintentar
            </button>
          </section>
        )}

        {mensaje && (
          <div className="toast toast-success product-toast" role="status">
            <SiarIcon name="check" size="md" />
            <span>{mensaje}</span>
            <button
              type="button"
              onClick={() => setMensaje("")}
              aria-label="Cerrar notificación"
            >
              <SiarIcon name="close" size="sm" />
            </button>
          </div>
        )}

        <section className="stats-grid product-stats-grid" aria-label="Resumen de productos">
          <StatCard
            icon="layers"
            label="Total de productos"
            value={cargando ? "—" : resumen.total.toString().padStart(2, "0")}
            note="Registrados en el menú"
            iconClass="icon-violet"
          />
          <StatCard
            icon="check"
            label="Productos activos"
            value={cargando ? "—" : resumen.activos.toString().padStart(2, "0")}
            note="Habilitados en el sistema"
            iconClass="icon-green"
          />
          <StatCard
            icon="box"
            label="Disponibles"
            value={cargando ? "—" : resumen.disponibles.toString().padStart(2, "0")}
            note="Se pueden pedir"
            iconClass="icon-green"
          />
          <StatCard
            icon="warning"
            label="No disponibles"
            value={cargando ? "—" : resumen.noDisponibles.toString().padStart(2, "0")}
            note="Temporalmente agotados"
            iconClass="icon-amber"
          />
        </section>

        <section className="table-panel product-table-panel">
          <div className="panel-header">
            <div>
              <h2>Listado de productos</h2>
              <p>Busca, filtra y administra los productos del catálogo gastronómico.</p>
            </div>
            <button
              className="button button-light"
              type="button"
              onClick={() => cargar()}
              disabled={cargando}
            >
              <SiarIcon name="refresh" size="sm" />
              Actualizar
            </button>
          </div>

          <div className="table-toolbar product-toolbar">
            <label className="search-box product-search-box">
              <SiarIcon name="search" size="sm" />
              <input
                aria-label="Buscar productos"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, descripción o categoría…"
              />
            </label>

            <div className="product-filter-controls">
              <label className="product-select-label">
                <span className="sr-only">Filtrar por categoría</span>
                <select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                >
                  <option value="todas">Todas las categorías</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.idCategoria} value={String(categoria.idCategoria)}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
                <SiarIcon name="chevronDown" size="xs" />
              </label>

              <div className="filter-tabs product-filter-tabs" role="group" aria-label="Filtrar por estado">
                {[
                  ["todos", "Todos"],
                  ["activos", "Activos"],
                  ["inactivos", "Inactivos"],
                  ["disponibles", "Disponibles"],
                  ["no-disponibles", "No disponibles"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`filter-tab ${estadoFiltro === value ? "filter-tab-active" : ""}`}
                    onClick={() => setEstadoFiltro(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="table-scroll">
            <table className="category-table product-table">
              <thead>
                <tr>
                  <th>PRODUCTO</th>
                  <th>CATEGORÍA</th>
                  <th>PRECIO</th>
                  <th>ESTADO</th>
                  <th>DISPONIBILIDAD</th>
                  <th className="actions-heading">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {cargando && (
                  <tr>
                    <td colSpan="6">
                      <div className="loading-state">
                        <span className="spinner spinner-dark" />
                        Cargando productos desde SIAR…
                      </div>
                    </td>
                  </tr>
                )}

                {!cargando && !error && paginaActual.map((producto) => (
                  <tr key={idProducto(producto)}>
                    <td>
                      <div className="category-name-cell product-name-cell">
                        {producto.imagen ? (
                          <img
                            className="product-thumb"
                            src={producto.imagen}
                            alt={producto.nombre || "Imagen del producto"}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="category-symbol symbol-0 product-thumb product-thumb-placeholder">
                            <SiarIcon name="coffee" size="md" />
                          </div>
                        )}
                        <div>
                          <strong>{producto.nombre}</strong>
                          <small>{producto.descripcion || "Sin descripción"}</small>
                        </div>
                      </div>
                    </td>
                    <td>{nombreCategoria(producto)}</td>
                    <td className="product-price">{moneda(producto.precio)}</td>
                    <td>
                      <span className={`status-badge ${producto.activo ? "badge-active" : "badge-inactive"}`}>
                        <span />
                        {producto.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${producto.disponible ? "badge-available" : "badge-unavailable"}`}>
                        <span />
                        {producto.disponible ? "Disponible" : "No disponible"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions product-actions">
                        <button
                          className="action-button"
                          type="button"
                          title="Editar producto"
                          aria-label={`Editar ${producto.nombre}`}
                          onClick={() => abrirEditar(producto)}
                          disabled={!producto.activo || accionId === idProducto(producto)}
                        >
                          <SiarIcon name="edit" size="xs" />
                          <span>Editar</span>
                        </button>
                        <button
                          className={`action-button ${producto.disponible ? "action-danger" : "action-success"}`}
                          type="button"
                          title={producto.disponible ? "Marcar no disponible" : "Marcar disponible"}
                          onClick={() => alternarDisponibilidad(producto)}
                          disabled={!producto.activo || accionId === idProducto(producto)}
                        >
                          <SiarIcon name={producto.disponible ? "pause" : "check"} size="xs" />
                          <span>{producto.disponible ? "Agotar" : "Habilitar"}</span>
                        </button>
                        <button
                          className="action-button action-danger"
                          type="button"
                          title="Desactivar producto"
                          aria-label={`Desactivar ${producto.nombre}`}
                          onClick={() => desactivar(producto)}
                          disabled={!producto.activo || accionId === idProducto(producto)}
                        >
                          <SiarIcon name="close" size="xs" />
                          <span>Desactivar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!cargando && !error && filtrados.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <div className="empty-icon">
                          <SiarIcon name="box" size="xl" />
                        </div>
                        <strong>
                          {productos.length ? "No encontramos resultados" : "Aún no hay productos"}
                        </strong>
                        <p>
                          {productos.length
                            ? "Prueba con otra búsqueda o cambia los filtros."
                            : "Registra tu primer producto para completar el catálogo."}
                        </p>
                        {!productos.length && (
                          <button className="button button-primary" type="button" onClick={abrirCrear}>
                            <SiarIcon name="plus" size="sm" />
                            Crear producto
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="table-footer product-table-footer">
            <span>
              Mostrando <strong>{filtrados.length ? (pagina - 1) * porPagina + 1 : 0}–{Math.min(pagina * porPagina, filtrados.length)}</strong>
              {" "}de <strong>{filtrados.length}</strong> productos
            </span>
            <div className="product-pagination">
              <span>Página {pagina} de {totalPaginas}</span>
              <button type="button" onClick={() => setPagina(1)} disabled={pagina === 1} aria-label="Primera página">«</button>
              <button type="button" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1} aria-label="Página anterior">‹</button>
              <button type="button" onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} aria-label="Página siguiente">›</button>
              <button type="button" onClick={() => setPagina(totalPaginas)} disabled={pagina === totalPaginas} aria-label="Última página">»</button>
            </div>
          </footer>
        </section>

        <div className="implementation-note product-implementation-note">
          <div className="note-icon">
            <SiarIcon name="layers" size="md" />
          </div>
          <div>
            <strong>Conectado al backend de SIAR</strong>
            <p>
              Las operaciones se realizan mediante <code>/api/productos</code> y las categorías mediante <code>/api/categorias/activas</code>.
            </p>
          </div>
          <span className="note-method">REST · JSON</span>
        </div>

        <footer className="page-footer">
          <span>SIAR © Sistema Integral de Administración para Restaurantes</span>
          <span>Gestión de productos</span>
        </footer>
      </div>

      {modalAbierto && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && !guardando && setModalAbierto(false)}
        >
          <section className="modal product-modal" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
            <div className="modal-header">
              <div>
                <span className="eyebrow">CATÁLOGO DEL MENÚ</span>
                <h2 id="product-form-title">{productoEditando ? "Editar producto" : "Nuevo producto"}</h2>
                <p>Completa los datos del producto del restaurante.</p>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setModalAbierto(false)}
                disabled={guardando}
                aria-label="Cerrar formulario"
              >
                <SiarIcon name="close" size="sm" />
              </button>
            </div>

            <form onSubmit={guardar}>
              <div className="product-form-grid">
                <div>
                  <label className="field-label" htmlFor="producto-nombre">Nombre del producto <span>*</span></label>
                  <input
                    id="producto-nombre"
                    className="text-input"
                    name="nombre"
                    value={form.nombre}
                    onChange={cambiarCampo}
                    maxLength={120}
                    placeholder="Ej. Limonada natural"
                    required
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="producto-categoria">Categoría <span>*</span></label>
                  <select
                    id="producto-categoria"
                    className="text-input"
                    name="idCategoria"
                    value={form.idCategoria}
                    onChange={cambiarCampo}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.idCategoria} value={categoria.idCategoria}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                  {!categorias.length && (
                    <div className="field-help product-no-categories">
                      Primero crea una categoría activa.
                    </div>
                  )}
                </div>

                <div>
                  <label className="field-label" htmlFor="producto-precio">Precio (COP) <span>*</span></label>
                  <input
                    id="producto-precio"
                    className="text-input"
                    type="number"
                    name="precio"
                    min="1"
                    step="1"
                    value={form.precio}
                    onChange={cambiarCampo}
                    placeholder="6500"
                    required
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="producto-imagen">URL de imagen</label>
                  <input
                    id="producto-imagen"
                    className="text-input"
                    type="url"
                    name="imagen"
                    value={form.imagen}
                    onChange={cambiarCampo}
                    placeholder="https://..."
                  />
                </div>

                <div className="product-field-full">
                  <label className="field-label" htmlFor="producto-descripcion">Descripción</label>
                  <textarea
                    id="producto-descripcion"
                    className="text-input product-description"
                    name="descripcion"
                    value={form.descripcion}
                    onChange={cambiarCampo}
                    maxLength={500}
                    rows={3}
                    placeholder="Describe brevemente el producto"
                  />
                </div>
              </div>

              <label className="toggle-row product-toggle-row">
                <span className="toggle-copy">
                  <strong>Producto disponible</strong>
                  <small>Indica si el producto puede agregarse a nuevos pedidos.</small>
                </span>
                <input
                  type="checkbox"
                  name="disponible"
                  checked={form.disponible}
                  onChange={cambiarCampo}
                />
                <span className="toggle-control" aria-hidden="true" />
              </label>

              {productoEditando && (
                <label className="toggle-row product-toggle-row">
                  <span className="toggle-copy">
                    <strong>Producto activo</strong>
                    <small>Los productos inactivos se conservan en el sistema, pero no se ofrecen en el catálogo.</small>
                  </span>
                  <input
                    type="checkbox"
                    name="activo"
                    checked={form.activo}
                    onChange={cambiarCampo}
                  />
                  <span className="toggle-control" aria-hidden="true" />
                </label>
              )}

              {error && (
                <div className="inline-error">
                  <SiarIcon name="warning" size="sm" />
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button className="button button-primary" type="submit" disabled={guardando}>
                  {guardando ? <span className="spinner" /> : <SiarIcon name="check" size="sm" />}
                  {guardando ? "Guardando…" : productoEditando ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
