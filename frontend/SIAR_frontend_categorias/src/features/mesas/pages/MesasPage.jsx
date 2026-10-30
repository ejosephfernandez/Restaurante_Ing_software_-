import { useEffect, useMemo, useState } from "react";
import { mesasService } from "../services/mesasService.js";
import "../../../styles/mesas.css";
import SiarIcon from "../../../components/ui/SiarIcon.jsx";

const FORM_VACIO = {
  numero: "",
  capacidad: "4",
  ubicacion: "Salón principal",
};

const ESTADOS = [
  { value: "DISPONIBLE", label: "Disponible", tone: "available", icon: "check" },
  { value: "OCUPADA", label: "Ocupada", tone: "occupied", icon: "users" },
  { value: "RESERVADA", label: "Reservada", tone: "reserved", icon: "calendar" },
  { value: "INACTIVA", label: "Inactiva", tone: "inactive", icon: "pause" },
];

const idMesa = (mesa) => mesa?.idMesa ?? mesa?.id_mesa ?? mesa?.id;
const numeroMesa = (mesa) => mesa?.numero ?? mesa?.numeroMesa ?? "—";
const capacidadMesa = (mesa) => mesa?.capacidad ?? mesa?.numeroPersonas ?? 0;
const ubicacionMesa = (mesa) => mesa?.ubicacion || "Ubicación sin especificar";

function normalizarEstado(estado) {
  const valor = String(estado || "DISPONIBLE").trim().toUpperCase();
  return ESTADOS.some((item) => item.value === valor) ? valor : "DISPONIBLE";
}

function extraerLista(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  if (Array.isArray(respuesta?.mesas)) return respuesta.mesas;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  if (Array.isArray(respuesta?.data?.mesas)) return respuesta.data.mesas;
  if (Array.isArray(respuesta?.data?.content)) return respuesta.data.content;
  return [];
}

function adaptarMesa(mesa) {
  return {
    ...mesa,
    estado: normalizarEstado(mesa?.estado),
    capacidad: Number(capacidadMesa(mesa)) || 0,
  };
}

function StatCard({ icon, label, value, note, iconClass = "icon-green" }) {
  return (
    <article className="stat-card mesa-stat-card">
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

function EstadoBadge({ estado }) {
  const config = ESTADOS.find((item) => item.value === estado) || ESTADOS[0];
  return (
    <span className={`status-badge mesa-status mesa-status-${config.tone}`}>
      <span />
      {config.label}
    </span>
  );
}

export default function MesasPage() {
  const [mesas, setMesas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [errorCarga, setErrorCarga] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mesaEditando, setMesaEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [accionId, setAccionId] = useState(null);

  async function cargar({ silencioso = false } = {}) {
    if (!silencioso) setCargando(true);
    setError("");
    setErrorCarga(false);

    try {
      const respuesta = await mesasService.listar();
      setMesas(extraerLista(respuesta).map(adaptarMesa));
    } catch (e) {
      setError(e?.message || "No fue posible cargar las mesas.");
      setErrorCarga(true);
    } finally {
      if (!silencioso) setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // La consulta inicial se ejecuta al montar la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumen = useMemo(() => {
    const activas = mesas.filter((mesa) => mesa.estado !== "INACTIVA");
    return {
      total: mesas.length,
      disponibles: mesas.filter((mesa) => mesa.estado === "DISPONIBLE").length,
      ocupadas: mesas.filter((mesa) => mesa.estado === "OCUPADA").length,
      reservadas: mesas.filter((mesa) => mesa.estado === "RESERVADA").length,
      activas: activas.length,
    };
  }, [mesas]);

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase("es");
    return mesas
      .filter((mesa) => {
        const coincideTexto =
          !termino ||
          [numeroMesa(mesa), ubicacionMesa(mesa), mesa.estado].some((valor) =>
            String(valor ?? "").toLocaleLowerCase("es").includes(termino)
          );
        const coincideEstado = filtroEstado === "TODOS" || mesa.estado === filtroEstado;
        return coincideTexto && coincideEstado;
      })
      .sort((a, b) => Number(numeroMesa(a)) - Number(numeroMesa(b)));
  }, [mesas, busqueda, filtroEstado]);

  function mostrarMensaje(texto) {
    setMensaje(texto);
    window.setTimeout(() => setMensaje(""), 4200);
  }

  function abrirCrear() {
    setMesaEditando(null);
    setForm({ ...FORM_VACIO, numero: siguienteNumero() });
    setError("");
    setModalAbierto(true);
  }

  function siguienteNumero() {
    const numeros = mesas.map((mesa) => Number(numeroMesa(mesa))).filter(Number.isFinite);
    return String(Math.max(0, ...numeros) + 1);
  }

  function abrirEditar(mesa) {
    setMesaEditando(mesa);
    setForm({
      numero: String(numeroMesa(mesa) === "—" ? "" : numeroMesa(mesa)),
      capacidad: String(capacidadMesa(mesa) || 1),
      ubicacion: mesa.ubicacion ?? "",
    });
    setError("");
    setModalAbierto(true);
  }

  function cambiarCampo(evento) {
    const { name, value } = evento.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setError("");

    const numero = Number(form.numero);
    const capacidad = Number(form.capacidad);
    if (!Number.isInteger(numero) || numero <= 0) {
      setError("El número de mesa debe ser un entero mayor que cero.");
      return;
    }
    if (!Number.isInteger(capacidad) || capacidad <= 0) {
      setError("La capacidad debe ser un entero mayor que cero.");
      return;
    }
    if (form.ubicacion.trim().length > 100) {
      setError("La ubicación no puede superar los 100 caracteres.");
      return;
    }

    const payload = {
      numero,
      capacidad,
      ubicacion: form.ubicacion.trim() || null,
    };

    setGuardando(true);
    try {
      if (mesaEditando) {
        await mesasService.actualizar(idMesa(mesaEditando), payload);
        mostrarMensaje(`Mesa ${numero} actualizada correctamente.`);
      } else {
        await mesasService.crear(payload);
        mostrarMensaje(`Mesa ${numero} creada correctamente.`);
      }
      setModalAbierto(false);
      setMesaEditando(null);
      await cargar({ silencioso: true });
    } catch (e) {
      setError(e?.message || "No fue posible guardar la mesa.");
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(mesa, nuevoEstado) {
    if (nuevoEstado === mesa.estado) return;
    setError("");
    setMensaje("");
    setAccionId(idMesa(mesa));
    try {
      await mesasService.cambiarEstado(idMesa(mesa), nuevoEstado);
      const estadoLabel = ESTADOS.find((item) => item.value === nuevoEstado)?.label || nuevoEstado;
      mostrarMensaje(`Mesa ${numeroMesa(mesa)} ahora está ${estadoLabel.toLocaleLowerCase("es")}.`);
      await cargar({ silencioso: true });
    } catch (e) {
      setError(e?.message || "No fue posible cambiar el estado de la mesa.");
    } finally {
      setAccionId(null);
    }
  }

  return (
    <div className="mesas-module">
      <header className="topbar">
        <div className="breadcrumb">
          <span>Inicio</span>
          <span className="crumb-separator">/</span>
          <span>Operación</span>
          <span className="crumb-separator">/</span>
          <strong>Mesas</strong>
        </div>
        <div className="topbar-right">
          <span className="environment-pill"><span /> Entorno local</span>
          <div className="profile-block">
            <div className="avatar">AD</div>
            <div className="profile-details">
              <strong>Administrador</strong>
              <small>Administrador</small>
            </div>
          </div>
        </div>
      </header>

      <main className="page-content mesas-page-content">
        <section className="page-heading">
          <div>
            <div className="eyebrow">MÓDULO DE OPERACIÓN <span className="eyebrow-dot">•</span> RF12–RF16</div>
            <h1>Gestión de mesas</h1>
            <p>Organiza las mesas del restaurante, consulta su estado y administra su capacidad.</p>
          </div>
          <button className="button button-primary button-add" type="button" onClick={abrirCrear}>
            <SiarIcon name="plus" size="sm" />
            Nueva mesa
          </button>
        </section>

        {error && (
          <section className="connection-alert mesas-connection-alert" role="alert">
            <div className="alert-icon"><SiarIcon name="warning" size="md" /></div>
            <div className="alert-copy">
              <strong>No se pudo completar la operación</strong>
              <p>{error}</p>
              <small>Comprueba el backend, el token JWT y los permisos del usuario.</small>
            </div>
            <button className="button button-secondary" type="button" onClick={() => cargar()} disabled={cargando}>
              <SiarIcon name="refresh" size="sm" /> Reintentar
            </button>
          </section>
        )}

        {mensaje && (
          <div className="toast toast-success mesas-toast" role="status">
            <SiarIcon name="check" size="md" />
            <span>{mensaje}</span>
            <button type="button" onClick={() => setMensaje("")} aria-label="Cerrar notificación"><SiarIcon name="close" size="sm" /></button>
          </div>
        )}

        <section className="stats-grid mesas-stats-grid" aria-label="Resumen de mesas">
          <StatCard icon="table" label="Mesas registradas" value={cargando ? "—" : String(resumen.total).padStart(2, "0")} note="Total de mesas en el sistema" iconClass="icon-violet" />
          <StatCard icon="check" label="Disponibles" value={cargando ? "—" : String(resumen.disponibles).padStart(2, "0")} note="Listas para recibir clientes" iconClass="icon-green" />
          <StatCard icon="users" label="Ocupadas" value={cargando ? "—" : String(resumen.ocupadas).padStart(2, "0")} note="En servicio actualmente" iconClass="icon-amber" />
          <StatCard icon="calendar" label="Reservadas" value={cargando ? "—" : String(resumen.reservadas).padStart(2, "0")} note="Apartadas para clientes" iconClass="icon-violet" />
        </section>

        <section className="table-panel mesas-panel">
          <div className="panel-header">
            <div>
              <h2>Vista de mesas</h2>
              <p>Consulta cada mesa y cambia su estado según la operación del salón.</p>
            </div>
            <button className="button button-light" type="button" onClick={() => cargar()} disabled={cargando}>
              <SiarIcon name="refresh" size="sm" /> Actualizar
            </button>
          </div>

          <div className="table-toolbar mesas-toolbar">
            <label className="search-box mesas-search-box">
              <SiarIcon name="search" size="sm" />
              <input
                aria-label="Buscar mesas"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Buscar por número, ubicación o estado…"
              />
            </label>
            <div className="filter-tabs mesas-filter-tabs" role="group" aria-label="Filtrar mesas por estado">
              {[
                ["TODOS", "Todas"],
                ["DISPONIBLE", "Disponibles"],
                ["OCUPADA", "Ocupadas"],
                ["RESERVADA", "Reservadas"],
                ["INACTIVA", "Inactivas"],
              ].map(([value, label]) => (
                <button key={value} type="button" className={`filter-tab ${filtroEstado === value ? "filter-tab-active" : ""}`} onClick={() => setFiltroEstado(value)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {cargando ? (
            <div className="mesas-loading"><span className="spinner spinner-dark" /> Cargando mesas desde SIAR…</div>
          ) : errorCarga ? (
            <div className="empty-state mesas-empty-state">
              <div className="empty-icon"><SiarIcon name="warning" size="lg" /></div>
              <strong>No fue posible consultar las mesas</strong>
              <p>Revisa la conexión con el backend y vuelve a intentarlo.</p>
              <button className="button button-secondary" type="button" onClick={() => cargar()}><SiarIcon name="refresh" size="sm" /> Reintentar consulta</button>
            </div>
          ) : filtradas.length === 0 ? (
            <div className="empty-state mesas-empty-state">
              <div className="empty-icon"><SiarIcon name="table" size="lg" /></div>
              <strong>{mesas.length === 0 ? "Aún no hay mesas registradas" : "No hay mesas para estos filtros"}</strong>
              <p>{mesas.length === 0 ? "Crea la primera mesa para comenzar a organizar el salón." : "Prueba otra búsqueda o selecciona un estado diferente."}</p>
              {mesas.length === 0 && <button className="button button-primary" type="button" onClick={abrirCrear}><SiarIcon name="plus" size="sm" /> Crear primera mesa</button>}
            </div>
          ) : (
            <div className="mesas-grid">
              {filtradas.map((mesa, indice) => {
                const estado = ESTADOS.find((item) => item.value === mesa.estado) || ESTADOS[0];
                const accionEnCurso = accionId === idMesa(mesa);
                return (
                  <article className={`mesa-card mesa-card-${estado.tone}`} key={idMesa(mesa) ?? `${numeroMesa(mesa)}-${indice}`}>
                    <div className="mesa-card-topline">
                      <span className="mesa-number">Mesa <strong>{numeroMesa(mesa)}</strong></span>
                      <EstadoBadge estado={mesa.estado} />
                    </div>
                    <div className="mesa-card-visual" aria-hidden="true">
                      <div className="mesa-seat mesa-seat-top" />
                      <div className="mesa-seat mesa-seat-right" />
                      <div className="mesa-seat mesa-seat-bottom" />
                      <div className="mesa-seat mesa-seat-left" />
                      <div className="mesa-tabletop"><SiarIcon name="users" size="lg" /><strong>{capacidadMesa(mesa)}</strong><small>personas</small></div>
                    </div>
                    <div className="mesa-card-details">
                      <span className="mesa-location-label">UBICACIÓN</span>
                      <strong title={ubicacionMesa(mesa)}>{ubicacionMesa(mesa)}</strong>
                      <span className="mesa-capacity"><SiarIcon name="users" size="xs" /> Capacidad: {capacidadMesa(mesa)} {capacidadMesa(mesa) === 1 ? "persona" : "personas"}</span>
                    </div>
                    <div className="mesa-card-actions">
                      <label className="mesa-state-control">
                        <span className="sr-only">Cambiar estado de la mesa {numeroMesa(mesa)}</span>
                        <select value={mesa.estado} disabled={accionEnCurso} onChange={(evento) => cambiarEstado(mesa, evento.target.value)}>
                          {ESTADOS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                        <SiarIcon name="chevronDown" size="xs" />
                      </label>
                      <button className="action-button mesa-edit-button" type="button" onClick={() => abrirEditar(mesa)} aria-label={`Editar mesa ${numeroMesa(mesa)}`} title="Editar mesa">
                        <SiarIcon name="edit" size="sm" />
                      </button>
                    </div>
                    {accionEnCurso && <div className="mesa-action-progress"><span className="spinner spinner-dark" /> Actualizando estado…</div>}
                  </article>
                );
              })}
            </div>
          )}

          <div className="table-footer mesas-footer">
            <span>Mostrando <strong>{cargando ? "—" : filtradas.length}</strong> de <strong>{cargando ? "—" : mesas.length}</strong> mesas</span>
            <span className="footer-api"><span className={`status-light ${error ? "status-down" : cargando ? "status-pending" : "status-up"}`} /> {error ? "Revisa la conexión" : cargando ? "Consultando API" : `${resumen.activas} mesas activas`}</span>
          </div>
        </section>

        <div className="mesas-page-note">
          <span className="mesas-note-icon"><SiarIcon name="clipboard" size="md" /></span>
          <div><strong>Estados operativos</strong><p>Disponible: puede asignarse a un pedido. Ocupada: está en servicio. Reservada: está apartada. Inactiva: no debe asignarse temporalmente.</p></div>
        </div>
      </main>

      {modalAbierto && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(evento) => { if (evento.target === evento.currentTarget && !guardando) setModalAbierto(false); }}>
          <section className="modal mesa-modal" role="dialog" aria-modal="true" aria-labelledby="mesa-modal-title">
            <div className="modal-header">
              <div>
                <div className="eyebrow">GESTIÓN DE MESAS</div>
                <h2 id="mesa-modal-title">{mesaEditando ? `Editar mesa ${numeroMesa(mesaEditando)}` : "Registrar nueva mesa"}</h2>
                <p>Define el número, la capacidad y la ubicación de la mesa.</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setModalAbierto(false)} disabled={guardando} aria-label="Cerrar formulario"><SiarIcon name="close" size="sm" /></button>
            </div>

            <form onSubmit={guardar}>
              <div className="mesa-form-grid">
                <div>
                  <label className="field-label" htmlFor="mesa-numero">Número de mesa <span>*</span></label>
                  <input className="text-input" id="mesa-numero" name="numero" type="number" min="1" step="1" required value={form.numero} onChange={cambiarCampo} placeholder="Ej. 1" />
                </div>
                <div>
                  <label className="field-label" htmlFor="mesa-capacidad">Capacidad <span>*</span></label>
                  <input className="text-input" id="mesa-capacidad" name="capacidad" type="number" min="1" step="1" required value={form.capacidad} onChange={cambiarCampo} placeholder="Ej. 4" />
                  <div className="field-help">Cantidad máxima de personas.</div>
                </div>
                <div className="mesa-form-full">
                  <label className="field-label" htmlFor="mesa-ubicacion">Ubicación</label>
                  <input className="text-input" id="mesa-ubicacion" name="ubicacion" type="text" maxLength="100" value={form.ubicacion} onChange={cambiarCampo} placeholder="Ej. Terraza, salón principal…" />
                  <div className="field-help">Máximo 100 caracteres. Puede dejarse vacía.</div>
                </div>
              </div>

              {error && <div className="inline-error" role="alert"><SiarIcon name="warning" size="sm" /> {error}</div>}

              <div className="modal-actions">
                <button className="button button-secondary" type="button" onClick={() => setModalAbierto(false)} disabled={guardando}>Cancelar</button>
                <button className="button button-primary" type="submit" disabled={guardando}>
                  {guardando ? <><span className="spinner" /> Guardando…</> : <><SiarIcon name="check" size="sm" /> {mesaEditando ? "Guardar cambios" : "Crear mesa"}</>}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
