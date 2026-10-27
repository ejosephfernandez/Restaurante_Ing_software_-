import { useCallback, useEffect, useMemo, useState } from 'react';
import { categoriasApi } from '../services/categoriasApi.js';
import '../../../styles/categorias.css';

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.3" /><rect x="14" y="3" width="7" height="7" rx="1.3" /><rect x="3" y="14" width="7" height="7" rx="1.3" /><rect x="14" y="14" width="7" height="7" rx="1.3" /></>,
    tag: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r="1" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M4.5 9a7.8 7.8 0 0 1 13-2.5L20 12M4 17v-5h5" /><path d="M19.5 15a7.8 7.8 0 0 1-13 2.5L4 12" /></>,
    edit: <><path d="m15 5 4 4" /><path d="M4 20l4-.8L19.2 8a2.1 2.1 0 0 0-3-3L5 16.2 4 20Z" /></>,
    pause: <><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    utensils: <><path d="M7 3v7M4.5 3v4a2.5 2.5 0 0 0 5 0V3M7 9.5V21" /><path d="M16 3v18M16 3c3 2 4 5 4 8h-4" /></>,
    warning: <><path d="M12 3 22 20H2L12 3Z" /><path d="M12 9v4M12 16h.01" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  };
  return <svg {...common}>{paths[name] || paths.grid}</svg>;
}

const EMPTY_FORM = { nombre: '', activa: true };

function normalizarCategoria(item) {
  return {
    idCategoria: item.idCategoria ?? item.id_categoria ?? item.id ?? null,
    nombre: item.nombre ?? item.name ?? '',
    activa: item.activa ?? true,
  };
}

function parseBoolean(value) {
  if (value === false || value === 0 || value === '0') return false;
  if (value === true || value === 1 || value === '1') return true;
  return Boolean(value);
}

function CategoryForm({ initial, saving, onCancel, onSubmit }) {
  const [nombre, setNombre] = useState(initial?.nombre || '');
  const [activa, setActiva] = useState(initial?.activa ?? true);
  const [error, setError] = useState('');

  useEffect(() => {
    setNombre(initial?.nombre || '');
    setActiva(initial?.activa ?? true);
    setError('');
  }, [initial]);

  function handleSubmit(event) {
    event.preventDefault();
    const cleanName = nombre.trim();
    if (!cleanName) {
      setError('Escribe el nombre de la categoría.');
      return;
    }
    if (cleanName.length > 100) {
      setError('El nombre no puede superar los 100 caracteres.');
      return;
    }
    setError('');
    onSubmit({ nombre: cleanName, activa });
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">CATÁLOGO DEL MENÚ</span>
            <h2 id="form-title">{initial?.idCategoria ? 'Editar categoría' : 'Nueva categoría'}</h2>
            <p>Organiza los productos del restaurante en grupos.</p>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} aria-label="Cerrar formulario"><Icon name="close" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="category-name">Nombre de la categoría <span>*</span></label>
          <input
            id="category-name"
            className="text-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Bebidas, Entradas, Postres"
            autoFocus
            maxLength={100}
          />
          <div className="field-help">Máximo 100 caracteres.</div>
          <label className="toggle-row">
            <span className="toggle-copy">
              <strong>Categoría activa</strong>
              <small>Las categorías activas pueden mostrarse en el catálogo.</small>
            </span>
            <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} />
            <span className="toggle-control" aria-hidden="true" />
          </label>
          {error && <div className="inline-error"><Icon name="warning" size={16} />{error}</div>}
          <div className="modal-actions">
            <button className="button button-secondary" type="button" onClick={onCancel} disabled={saving}>Cancelar</button>
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving ? <span className="spinner" /> : <Icon name="check" size={17} />}
              {saving ? 'Guardando…' : 'Guardar categoría'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todas');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [actionId, setActionId] = useState(null);

  const cargarCategorias = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setApiError('');
    try {
      const data = await categoriasApi.listar();
      if (!Array.isArray(data)) {
        throw new Error('La API respondió, pero no devolvió una lista de categorías. Revisa GET /api/categorias.');
      }
      setCategorias(data.map((item) => {
        const category = normalizarCategoria(item);
        return { ...category, activa: parseBoolean(category.activa) };
      }));
    } catch (error) {
      setApiError(error.message || 'No se pudieron cargar las categorías.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarCategorias(); }, [cargarCategorias]);

  const activas = categorias.filter((c) => c.activa).length;
  const inactivas = categorias.length - activas;
  const filtradas = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es');
    return categorias.filter((c) => {
      const matchesText = c.nombre.toLocaleLowerCase('es').includes(term);
      const matchesState = filter === 'todas' || (filter === 'activas' && c.activa) || (filter === 'inactivas' && !c.activa);
      return matchesText && matchesState;
    }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [categorias, search, filter]);

  function showNotice(type, message) {
    setNotice({ type, message });
    window.setTimeout(() => setNotice(null), 4500);
  }

  async function guardarCategoria(data) {
    setSaving(true);
    try {
      if (editing?.idCategoria != null) {
        await categoriasApi.actualizar(editing.idCategoria, data);
        showNotice('success', 'Categoría actualizada correctamente.');
      } else {
        await categoriasApi.crear(data);
        showNotice('success', 'Categoría creada correctamente.');
      }
      setShowForm(false);
      setEditing(null);
      await cargarCategorias(true);
    } catch (error) {
      showNotice('error', error.message || 'No se pudo guardar la categoría.');
    } finally {
      setSaving(false);
    }
  }

  async function cambiarEstado(category) {
    const action = category.activa ? 'desactivar' : 'activar';
    if (category.activa && !window.confirm(`¿Deseas desactivar la categoría “${category.nombre}”?`)) return;
    setActionId(category.idCategoria);
    try {
      if (category.activa) {
        await categoriasApi.desactivar(category.idCategoria);
      } else {
        await categoriasApi.actualizar(category.idCategoria, { nombre: category.nombre, activa: true });
      }
      showNotice('success', `Categoría ${action === 'desactivar' ? 'desactivada' : 'activada'} correctamente.`);
      await cargarCategorias(true);
    } catch (error) {
      showNotice('error', error.message || `No se pudo ${action} la categoría.`);
    } finally {
      setActionId(null);
    }
  }

  function abrirCrear() {
    setEditing(null);
    setShowForm(true);
  }

  function abrirEditar(category) {
    setEditing(category);
    setShowForm(true);
  }

  return (
    <div className="categorias-module">
      

      <header className="topbar">
        <div className="breadcrumb">
          <span>Inicio</span><span className="crumb-separator">/</span>
          <span>Menú</span><span className="crumb-separator">/</span>
          <strong>Categorías</strong>
        </div>
        <div className="topbar-right">
          <label className="topbar-search">
            <Icon name="search" size={16} />
            <input
              aria-label="Buscar categorías"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar categorías..."
            />
          </label>
          <button className="topbar-notification" type="button" aria-label="Notificaciones" title="Notificaciones">
            <span aria-hidden="true">♧</span><i />
          </button>
          <div className="profile-block">
            <div className="avatar">AD</div>
            <div className="profile-details">
              <strong>Administrador</strong>
              <small>Administrador</small>
            </div>
          </div>
        </div>
      </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">Gestión de categorías</div>
              <h1>Categorías</h1>
              <p>Organiza el catálogo gastronómico y mantén sus categorías bajo control.</p>
            </div>
            <button className="button button-primary button-add" onClick={abrirCrear}><Icon name="plus" size={18} /> Nueva categoría</button>
          </section>

          <section className="stats-grid" aria-label="Resumen de categorías">
            <article className="stat-card"><div className="stat-label">Total de categorías <span className="stat-icon icon-violet"><Icon name="layers" /></span></div><div className="stat-value">{loading ? '—' : categorias.length.toString().padStart(2, '0')}</div><div className="stat-note">Registradas en el catálogo</div></article>
            <article className="stat-card"><div className="stat-label">Categorías activas <span className="stat-icon icon-green"><Icon name="check" /></span></div><div className="stat-value">{loading ? '—' : activas.toString().padStart(2, '0')}</div><div className="stat-note"><span className="tiny-positive" /> Disponibles para el catálogo</div></article>
            <article className="stat-card"><div className="stat-label">Categorías inactivas <span className="stat-icon icon-amber"><Icon name="pause" /></span></div><div className="stat-value">{loading ? '—' : inactivas.toString().padStart(2, '0')}</div><div className="stat-note">Conservadas en el sistema</div></article>
          </section>

          {apiError && <section className="connection-alert"><div className="alert-icon"><Icon name="warning" size={20} /></div><div className="alert-copy"><strong>No se pudo consultar la API</strong><p>{apiError}</p><small>Verifica que Spring Boot esté activo en el puerto 8080 y que exista el endpoint GET /api/categorias.</small></div><button className="button button-secondary" onClick={() => cargarCategorias()}><Icon name="refresh" size={16} /> Reintentar</button></section>}

          <section className="table-panel">
            <div className="panel-header">
              <div><h2>Listado de categorías</h2><p>Administra los nombres y el estado de cada categoría.</p></div>
              <button className="button button-light" onClick={() => cargarCategorias()} disabled={loading}><Icon name="refresh" size={16} className={loading ? 'spin-icon' : ''} /> Actualizar</button>
            </div>
            <div className="table-toolbar">
              <label className="search-box"><Icon name="search" size={18} /><input aria-label="Buscar categorías" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar categoría…" /><kbd>/</kbd></label>
              <div className="filter-tabs" role="group" aria-label="Filtrar categorías">
                {[['todas', 'Todas'], ['activas', 'Activas'], ['inactivas', 'Inactivas']].map(([value, label]) => <button key={value} className={`filter-tab ${filter === value ? 'filter-tab-active' : ''}`} onClick={() => setFilter(value)}>{label}</button>)}
              </div>
            </div>

            <div className="table-scroll">
              <table className="category-table">
                <thead><tr><th>CATEGORÍA</th><th>IDENTIFICADOR</th><th>ESTADO</th><th className="actions-heading">ACCIONES</th></tr></thead>
                <tbody>
                  {loading && <tr><td colSpan="4"><div className="loading-state"><span className="spinner spinner-dark" /> Cargando categorías desde MySQL…</div></td></tr>}
                  {!loading && !apiError && filtradas.map((category, index) => <tr key={category.idCategoria ?? `${category.nombre}-${index}`}>
                    <td><div className="category-name-cell"><div className={`category-symbol symbol-${index % 5}`}><Icon name="tag" size={17} /></div><div><strong>{category.nombre}</strong><small>Catálogo gastronómico</small></div></div></td>
                    <td><span className="id-chip">CAT-{String(category.idCategoria ?? '—').padStart(3, '0')}</span></td>
                    <td><span className={`status-badge ${category.activa ? 'badge-active' : 'badge-inactive'}`}><span />{category.activa ? 'Activa' : 'Inactiva'}</span></td>
                    <td><div className="row-actions"><button className="action-button" onClick={() => abrirEditar(category)} title="Editar categoría"><Icon name="edit" size={16} /><span>Editar</span></button><button className={`action-button ${category.activa ? 'action-danger' : 'action-success'}`} disabled={actionId === category.idCategoria} onClick={() => cambiarEstado(category)} title={category.activa ? 'Desactivar categoría' : 'Activar categoría'}>{category.activa ? <Icon name="pause" size={16} /> : <Icon name="check" size={16} />}<span>{actionId === category.idCategoria ? 'Guardando…' : category.activa ? 'Desactivar' : 'Activar'}</span></button></div></td>
                  </tr>)}
                  {!loading && !apiError && filtradas.length === 0 && <tr><td colSpan="4"><div className="empty-state"><div className="empty-icon"><Icon name="tag" size={24} /></div><strong>{categorias.length ? 'No encontramos resultados' : 'Aún no hay categorías'}</strong><p>{categorias.length ? 'Prueba con otra búsqueda o cambia el filtro.' : 'Crea tu primera categoría para empezar a organizar el menú.'}</p>{!categorias.length && <button className="button button-primary" onClick={abrirCrear}><Icon name="plus" size={16} /> Crear categoría</button>}</div></td></tr>}
                </tbody>
              </table>
            </div>
            <footer className="table-footer"><span>Mostrando <strong>{loading ? '—' : filtradas.length}</strong> de <strong>{loading ? '—' : categorias.length}</strong> categorías</span><span className="footer-api"><span className={`status-light ${apiError ? 'status-down' : loading ? 'status-pending' : 'status-up'}`} /> {apiError ? 'Sin conexión' : loading ? 'Consultando API' : 'Sincronizado con API'}</span></footer>
          </section>

          <div className="implementation-note"><div className="note-icon"><Icon name="layers" size={18} /></div><div><strong>Conectado al backend de SIAR</strong><p>Las operaciones se envían a Spring Boot mediante <code>/api/categorias</code>. Los cambios persisten en MySQL a través de JPA y HikariCP.</p></div><span className="note-method">REST · JSON</span></div>
          <footer className="page-footer"><span>SIAR © Sistema Integral de Administración para Restaurantes</span><span>Frontend de pruebas · Gestión de categorías</span></footer>
        </div>

      {showForm && <CategoryForm initial={editing} saving={saving} onCancel={() => { setShowForm(false); setEditing(null); }} onSubmit={guardarCategoria} />}
      {notice && <div className={`toast toast-${notice.type}`} role="status"><Icon name={notice.type === 'success' ? 'check' : 'warning'} size={18} /><span>{notice.message}</span><button onClick={() => setNotice(null)} aria-label="Cerrar notificación"><Icon name="close" size={16} /></button></div>}
    </div>
  );
}
