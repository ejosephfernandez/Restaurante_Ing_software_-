import { useEffect, useMemo, useState } from "react";
import { productoService } from "../services/productoService.js";
import "../../../styles/productos.css";

const FORM_VACIO = { nombre: "", descripcion: "", precio: "", imagen: "", idCategoria: "", disponible: true, activo: true };
const idProducto = (p) => p?.idProducto ?? p?.id;
const idCategoria = (p) => p?.categoria?.idCategoria ?? p?.idCategoria ?? "";
const nombreCategoria = (p) => p?.nombreCategoria ?? p?.categoria?.nombre ?? "Sin categoría";
const moneda = (v) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(v || 0));

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const porPagina = 5;

  async function cargar() {
    setCargando(true); setError("");
    try {
      const [ps, cs] = await Promise.all([productoService.listar(), productoService.listarCategoriasActivas()]);
      setProductos(Array.isArray(ps) ? ps : []);
      setCategorias(Array.isArray(cs) ? cs : []);
    } catch (e) { setError(e.message || "No fue posible cargar los productos."); }
    finally { setCargando(false); }
  }
  useEffect(() => { cargar(); }, []);

  const resumen = useMemo(() => ({
    total: productos.length,
    activos: productos.filter(p => p.activo === true).length,
    disponibles: productos.filter(p => p.activo === true && p.disponible === true).length,
    noDisponibles: productos.filter(p => p.activo === true && p.disponible === false).length,
  }), [productos]);

  const filtrados = useMemo(() => productos.filter(p => {
    const q = busqueda.trim().toLowerCase();
    const textoOk = !q || [p.nombre, p.descripcion, nombreCategoria(p)].some(v => String(v || "").toLowerCase().includes(q));
    const categoriaOk = categoriaFiltro === "todas" || String(idCategoria(p)) === categoriaFiltro;
    const estadoOk = estadoFiltro === "todos" ||
      (estadoFiltro === "activos" && p.activo === true) ||
      (estadoFiltro === "inactivos" && p.activo === false) ||
      (estadoFiltro === "disponibles" && p.activo === true && p.disponible === true) ||
      (estadoFiltro === "no-disponibles" && p.activo === true && p.disponible === false);
    return textoOk && categoriaOk && estadoOk;
  }), [productos, busqueda, categoriaFiltro, estadoFiltro]);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaActual = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina);
  useEffect(() => setPagina(1), [busqueda, categoriaFiltro, estadoFiltro]);

  function abrirCrear() { setEditando(null); setForm(FORM_VACIO); setError(""); setMensaje(""); setModal(true); }
  function abrirEditar(p) { setEditando(p); setForm({ nombre: p.nombre ?? "", descripcion: p.descripcion ?? "", precio: p.precio ?? "", imagen: p.imagen ?? "", idCategoria: String(idCategoria(p)), disponible: p.disponible ?? true, activo: p.activo ?? true }); setError(""); setMensaje(""); setModal(true); }
  function cambio(e) { const { name, value, type, checked } = e.target; setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value })); }

  async function guardar(e) {
    e.preventDefault(); setError(""); setMensaje("");
    if (!form.nombre.trim()) return setError("Escribe el nombre del producto.");
    if (!form.idCategoria) return setError("Selecciona una categoría activa.");
    if (form.precio === "" || Number(form.precio) <= 0) return setError("El precio debe ser mayor que cero.");
    const payload = { nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), precio: Number(form.precio), imagen: form.imagen.trim() || null, disponible: Boolean(form.disponible), activo: Boolean(form.activo), categoria: { idCategoria: Number(form.idCategoria) } };
    setGuardando(true);
    try {
      if (editando) { await productoService.actualizar(idProducto(editando), payload); setMensaje("Producto actualizado correctamente."); }
      else { await productoService.crear(payload); setMensaje("Producto creado correctamente."); }
      setModal(false); await cargar();
    } catch (err) { setError(err.message || "No fue posible guardar el producto."); }
    finally { setGuardando(false); }
  }
  async function alternarDisponibilidad(p) {
    setError(""); setMensaje("");
    try { await productoService.cambiarDisponibilidad(idProducto(p), !p.disponible); setMensaje("Disponibilidad actualizada."); await cargar(); }
    catch (e) { setError(e.message || "No fue posible cambiar la disponibilidad."); }
  }
  async function desactivar(p) {
    if (!window.confirm(`¿Deseas desactivar el producto "${p.nombre}"?`)) return;
    setError(""); setMensaje("");
    try { await productoService.desactivar(idProducto(p)); setMensaje("Producto desactivado correctamente."); await cargar(); }
    catch (e) { setError(e.message || "No fue posible desactivar el producto."); }
  }

  return <div className="siar-products-shell">
    <main className="siar-products-main">
      <header className="siar-topbar"><div className="siar-breadcrumb"><span>Inicio</span><span>›</span><strong>Productos</strong></div><div className="siar-topbar-actions"><div className="siar-global-search"><span>⌕</span><span>Buscar productos, pedidos, usuarios...</span></div><button className="siar-icon-button" type="button" aria-label="Notificaciones">♧<i /></button><div className="siar-profile"><div className="siar-profile-avatar">AD</div><div><strong>Administrador</strong><span>Administrador</span></div><span>⌄</span></div></div></header>
      <section className="siar-products-content">
        <div className="siar-page-heading">
          <div><p className="siar-eyebrow">GESTIÓN DEL MENÚ</p>
          <h1>Productos</h1>
          <p className="siar-page-description">Gestiona los productos del menú del restaurante.</p>
        </div>
        <button className="siar-primary-button" type="button" onClick={abrirCrear}><span>＋</span> Nuevo producto</button></div>
        {error && <div className="siar-alert error" role="alert"><span>{error}</span><button type="button" onClick={() => setError("")}>×</button></div>}
        {mensaje && <div className="siar-alert success" role="status"><span>{mensaje}</span><button type="button" onClick={() => setMensaje("")}>×</button></div>}
        <div className="siar-product-stats"><Stat icon="▣" label="Total de productos" value={resumen.total} /><Stat icon="✓" label="Productos activos" value={resumen.activos} tone="mint" /><Stat icon="🛒" label="Disponibles" value={resumen.disponibles} /><Stat icon="×" label="No disponibles" value={resumen.noDisponibles} tone="red" /></div>
        <section className="siar-product-panel"><div className="siar-product-filters"><label className="siar-search-field"><span>⌕</span><input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre o descripción..." /></label><label className="siar-select-field"><span className="sr-only">Filtrar por categoría</span><select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}><option value="todas">Todas las categorías</option>{categorias.map(c => <option key={c.idCategoria} value={String(c.idCategoria)}>{c.nombre}</option>)}</select><span>⌄</span></label><label className="siar-select-field"><span className="sr-only">Filtrar por estado</span><select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)}><option value="todos">Todos los estados</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option><option value="disponibles">Disponibles</option><option value="no-disponibles">No disponibles</option></select><span>⌄</span></label></div>
          <div className="siar-table-scroll"><table className="siar-products-table"><thead><tr><th>Imagen</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Estado</th><th>Disponibilidad</th><th>Acciones</th></tr></thead><tbody>
            {cargando ? <tr><td colSpan="7" className="siar-table-message">Cargando productos...</td></tr> : paginaActual.length === 0 ? <tr><td colSpan="7" className="siar-table-message">No se encontraron productos para los filtros seleccionados.</td></tr> : paginaActual.map(p => <tr key={idProducto(p)}>
              <td>{p.imagen ? <img className="siar-product-thumb" src={p.imagen} alt={p.nombre} onError={e => { e.currentTarget.style.display = "none"; }} /> : <div className="siar-product-thumb siar-product-placeholder">{(p.nombre || "P").slice(0, 1).toUpperCase()}</div>}</td>
              <td><strong className="siar-product-name">{p.nombre}</strong><span className="siar-product-description">{p.descripcion || "Sin descripción"}</span></td><td>{nombreCategoria(p)}</td><td className="siar-price">{moneda(p.precio)}</td><td><span className={`siar-status ${p.activo ? "status-active" : "status-inactive"}`}>{p.activo ? "Activo" : "Inactivo"}</span></td><td><span className={`siar-status ${p.disponible ? "status-available" : "status-unavailable"}`}>{p.disponible ? "Disponible" : "No disponible"}</span></td>
              <td><div className="siar-row-actions"><button type="button" title="Editar producto" aria-label={`Editar ${p.nombre}`} onClick={() => abrirEditar(p)}>✎</button><button type="button" title="Cambiar disponibilidad" aria-label="Cambiar disponibilidad" onClick={() => alternarDisponibilidad(p)}>{p.disponible ? "◉" : "○"}</button><button type="button" className="danger" title="Desactivar producto" aria-label={`Desactivar ${p.nombre}`} onClick={() => desactivar(p)} disabled={!p.activo}>▤</button></div></td>
            </tr>)}
          </tbody></table></div>
          <div className="siar-table-footer"><span>{cargando ? "Cargando..." : `Mostrando ${filtrados.length ? (pagina - 1) * porPagina + 1 : 0}-${Math.min(pagina * porPagina, filtrados.length)} de ${filtrados.length} productos`}</span><div className="siar-pagination"><button type="button" onClick={() => setPagina(1)} disabled={pagina === 1}>«</button><button type="button" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}>‹</button><span>{pagina} / {totalPaginas}</span><button type="button" onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}>›</button><button type="button" onClick={() => setPagina(totalPaginas)} disabled={pagina === totalPaginas}>»</button></div></div>
        </section><p className="siar-content-note">Los cambios se guardan en el sistema al confirmar cada operación.</p>
      </section>
    </main>

    {modal && <div className="siar-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}><section className="siar-product-modal" role="dialog" aria-modal="true" aria-labelledby="siar-product-modal-title"><div className="siar-modal-heading"><div><p className="siar-eyebrow">{editando ? "ACTUALIZACIÓN" : "NUEVO REGISTRO"}</p><h2 id="siar-product-modal-title">{editando ? "Editar producto" : "Crear producto"}</h2><p>Completa los datos del producto del menú.</p></div><button className="siar-modal-close" type="button" onClick={() => setModal(false)} aria-label="Cerrar">×</button></div>{error && <div className="siar-alert error" role="alert">{error}</div>}<form onSubmit={guardar}><div className="siar-product-form-grid">
      <label>Nombre del producto *<input name="nombre" value={form.nombre} onChange={cambio} required maxLength="120" placeholder="Ej. Limonada natural" /></label><label>Categoría *<select name="idCategoria" value={form.idCategoria} onChange={cambio} required><option value="">Selecciona una categoría</option>{categorias.map(c => <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>)}</select></label><label>Precio (COP) *<input name="precio" type="number" min="1" step="1" value={form.precio} onChange={cambio} required placeholder="6500" /></label><label>URL de imagen<input name="imagen" type="url" value={form.imagen} onChange={cambio} placeholder="https://..." /></label><label className="span-two">Descripción<textarea name="descripcion" value={form.descripcion} onChange={cambio} rows="3" maxLength="500" placeholder="Describe brevemente el producto" /></label><label className="siar-checkbox-label"><input name="disponible" type="checkbox" checked={form.disponible} onChange={cambio} /> Disponible para pedidos</label><label className="siar-checkbox-label"><input name="activo" type="checkbox" checked={form.activo} onChange={cambio} /> Producto activo</label>
    </div><div className="siar-modal-actions"><button type="button" className="siar-secondary-button" onClick={() => setModal(false)}>Cancelar</button><button type="submit" className="siar-primary-button" disabled={guardando}>{guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear producto"}</button></div></form></section></div>}
  </div>;
}
function Stat({ icon, label, value, tone }) { 
  return <article className="siar-stat-card">
    <div className={`siar-stat-icon ${tone ? `tone-${tone}` : ""}`}>{icon}</div>
    <div><span>{label}</span><strong>{value}</strong></div></article>; 
    }
