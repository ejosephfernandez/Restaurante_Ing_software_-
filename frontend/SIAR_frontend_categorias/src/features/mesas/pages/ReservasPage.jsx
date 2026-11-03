import { useCallback, useEffect, useMemo, useState } from "react";
import { mesasService } from "../services/mesasService.js";
import { reservasService } from "../services/reservasService.js";
import "../../../styles/reservas.css";
import SiarIcon from "../../../components/ui/SiarIcon.jsx";

const FILTROS = [
  ["TODAS", "Todas"],
  ["HOY", "Hoy"],
  ["PROXIMAS", "Próximas"],
  ["PASADAS", "Pasadas"],
];

const EMPTY_FORM = {
  idMesa: "",
  nombreCliente: "",
  telefono: "",
  fechaHora: "",
  numPersonas: "2",
};

const idMesa = (mesa) => mesa?.idMesa ?? mesa?.id_mesa ?? mesa?.id;
const numeroMesa = (mesa) => mesa?.numero ?? mesa?.numeroMesa ?? "—";
const capacidadMesa = (mesa) => Number(mesa?.capacidad ?? mesa?.numeroPersonas ?? 0);
const estadoMesa = (mesa) => String(mesa?.estado ?? "DISPONIBLE").toUpperCase();
const idReserva = (reserva) => reserva?.idReserva ?? reserva?.id_reserva ?? reserva?.id;
const fechaReserva = (reserva) => reserva?.fechaHora ?? reserva?.fecha_hora ?? reserva?.fecha;
const nombreCliente = (reserva) => reserva?.nombreCliente ?? reserva?.nombre_cliente ?? "Cliente sin nombre";
const telefonoCliente = (reserva) => reserva?.telefono ?? "—";
const personasReserva = (reserva) => Number(reserva?.numPersonas ?? reserva?.num_personas ?? 0);

function extraerLista(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  if (Array.isArray(respuesta?.reservas)) return respuesta.reservas;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  if (Array.isArray(respuesta?.data?.reservas)) return respuesta.data.reservas;
  if (Array.isArray(respuesta?.data?.content)) return respuesta.data.content;
  return [];
}

function parseFecha(valor) {
  if (!valor) return null;
  const fecha = new Date(String(valor).trim().replace(" ", "T"));
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function mismaFecha(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function estadoTemporal(reserva, ahora = new Date()) {
  const fecha = parseFecha(fechaReserva(reserva));
  if (!fecha) return "SIN_FECHA";
  if (fecha.getTime() < ahora.getTime()) return "PASADA";
  if (mismaFecha(fecha, ahora)) return "HOY";
  return "PROXIMA";
}

function formatoFecha(valor) {
  const fecha = parseFecha(valor);
  if (!fecha) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fecha);
}

function fechaHoraLocalInput(fecha) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
}

function fechaHoraInicial() {
  const fecha = new Date();
  fecha.setHours(fecha.getHours() + 1, 0, 0, 0);
  return fechaHoraLocalInput(fecha);
}

function mesaDeReserva(reserva, mesas) {
  const mesaRelacionada = reserva?.mesa;
  const idRelacionado = reserva?.idMesa ?? reserva?.id_mesa ?? mesaRelacionada?.idMesa ?? mesaRelacionada?.id_mesa ?? mesaRelacionada?.id;
  const mesa = mesas.find((item) => String(idMesa(item)) === String(idRelacionado));
  return {
    idMesa: idRelacionado ?? idMesa(mesa),
    numeroMesa: reserva?.numeroMesa ?? mesaRelacionada?.numero ?? mesa?.numero ?? "—",
    ubicacion: mesaRelacionada?.ubicacion ?? mesa?.ubicacion ?? "—",
  };
}

function adaptarReserva(reserva, mesas) {
  const mesa = mesaDeReserva(reserva, mesas);
  return {
    ...reserva,
    idReserva: idReserva(reserva),
    fechaHora: fechaReserva(reserva),
    nombreCliente: nombreCliente(reserva),
    telefono: telefonoCliente(reserva),
    numPersonas: personasReserva(reserva),
    ...mesa,
  };
}

function StatCard({ icon, label, value, note, tone = "icon-green" }) {
  return (
    <article className="stat-card reserva-stat-card">
      <div className="stat-label">
        {label}
        <span className={`stat-icon ${tone}`}><SiarIcon name={icon} size="sm" /></span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-note">{note}</div>
    </article>
  );
}

function EstadoReserva({ estado }) {
  const config = {
    HOY: ["reserva-status-today", "Hoy"],
    PROXIMA: ["reserva-status-upcoming", "Próxima"],
    PASADA: ["reserva-status-past", "Pasada"],
    SIN_FECHA: ["reserva-status-unknown", "Sin fecha"],
  }[estado] || ["reserva-status-unknown", "Sin fecha"];

  return <span className={`status-badge reserva-status ${config[0]}`}><span />{config[1]}</span>;
}

function ReservaModal({ mesas, guardando, saveError, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, fechaHora: fechaHoraInicial() }));
  const [error, setError] = useState("");
  const [ahora] = useState(() => fechaHoraLocalInput(new Date()));
  const personas = Math.max(1, Number(form.numPersonas) || 1);
  const mesasDisponibles = mesas.filter((mesa) =>
    estadoMesa(mesa) === "DISPONIBLE" && capacidadMesa(mesa) >= personas
  );

  function cambiarCampo(evento) {
    const { name, value } = evento.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  }

  function enviar(evento) {
    evento.preventDefault();
    const nombre = form.nombreCliente.trim();
    const mesa = mesasDisponibles.find((item) => String(idMesa(item)) === String(form.idMesa));
    const fecha = parseFecha(form.fechaHora);
    const cantidad = Number(form.numPersonas);

    if (!nombre) return setError("Escribe el nombre del cliente.");
    if (nombre.length > 100) return setError("El nombre no puede superar los 100 caracteres.");
    if (!mesa) return setError("Selecciona una mesa disponible con capacidad suficiente.");
    if (!fecha || fecha.getTime() <= Date.now()) return setError("Selecciona una fecha y hora futuras.");
    if (!Number.isInteger(cantidad) || cantidad <= 0) return setError("El número de personas debe ser mayor que cero.");
    if (cantidad > capacidadMesa(mesa)) return setError("La cantidad de personas supera la capacidad de la mesa.");
    if (form.telefono.trim().length > 25) return setError("El teléfono no puede superar los 25 caracteres.");

    setError("");
    onSubmit({
      idMesa: idMesa(mesa),
      reserva: {
        fechaHora: `${form.fechaHora}:00`,
        nombreCliente: nombre,
        telefono: form.telefono.trim() || null,
        numPersonas: cantidad,
      },
      mesa,
    });
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(evento) => {
      if (evento.target === evento.currentTarget && !guardando) onCancel();
    }}>
      <section className="modal reserva-modal" role="dialog" aria-modal="true" aria-labelledby="reserva-modal-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">GESTIÓN DE RESERVAS</span>
            <h2 id="reserva-modal-title">Nueva reserva</h2>
            <p>Registra los datos del cliente y asigna una mesa para su visita.</p>
          </div>
          <button className="icon-button" type="button" onClick={onCancel} disabled={guardando} aria-label="Cerrar formulario">
            <SiarIcon name="close" size="sm" />
          </button>
        </div>

        <form onSubmit={enviar}>
          <div className="reserva-form-grid">
            <div className="reserva-form-full">
              <label className="field-label" htmlFor="reserva-cliente">Nombre del cliente <span>*</span></label>
              <input className="text-input" id="reserva-cliente" name="nombreCliente" value={form.nombreCliente} onChange={cambiarCampo} maxLength={100} required autoFocus placeholder="Ej. Laura Gómez" />
            </div>

            <div>
              <label className="field-label" htmlFor="reserva-telefono">Teléfono</label>
              <input className="text-input" id="reserva-telefono" name="telefono" type="tel" value={form.telefono} onChange={cambiarCampo} maxLength={25} placeholder="Número de contacto" />
              <div className="field-help">Dato opcional para contactar al cliente.</div>
            </div>

            <div>
              <label className="field-label" htmlFor="reserva-personas">Número de personas <span>*</span></label>
              <input className="text-input" id="reserva-personas" name="numPersonas" type="number" min="1" step="1" value={form.numPersonas} onChange={cambiarCampo} required />
            </div>

            <div>
              <label className="field-label" htmlFor="reserva-fecha">Fecha y hora <span>*</span></label>
              <input className="text-input" id="reserva-fecha" name="fechaHora" type="datetime-local" min={ahora} value={form.fechaHora} onChange={cambiarCampo} required />
            </div>

            <div>
              <label className="field-label" htmlFor="reserva-mesa">Mesa disponible <span>*</span></label>
              <select className="text-input reserva-select" id="reserva-mesa" name="idMesa" value={form.idMesa} onChange={cambiarCampo} required>
                <option value="">Selecciona una mesa</option>
                {mesasDisponibles.map((mesa) => (
                  <option key={idMesa(mesa)} value={idMesa(mesa)}>
                    Mesa {numeroMesa(mesa)} · {capacidadMesa(mesa)} personas · {mesa.ubicacion || "Sin ubicación"}
                  </option>
                ))}
              </select>
              {mesasDisponibles.length === 0 && <div className="field-help reserva-field-warning">No hay mesas disponibles con esa capacidad.</div>}
            </div>
          </div>

          {(error || saveError) && <div className="inline-error" role="alert"><SiarIcon name="warning" size="sm" />{error || saveError}</div>}

          <div className="modal-actions">
            <button className="button button-secondary" type="button" onClick={onCancel} disabled={guardando}>Cancelar</button>
            <button className="button button-primary" type="submit" disabled={guardando || mesasDisponibles.length === 0}>
              {guardando ? <><span className="spinner" /> Guardando…</> : <><SiarIcon name="check" size="sm" /> Confirmar reserva</>}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DetalleReservaModal({ reserva, onClose }) {
  if (!reserva) return null;
  const estado = estadoTemporal(reserva);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(evento) => {
      if (evento.target === evento.currentTarget) onClose();
    }}>
      <section className="modal reserva-detail-modal" role="dialog" aria-modal="true" aria-labelledby="reserva-detail-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">DETALLE DE RESERVA</span>
            <h2 id="reserva-detail-title">{reserva.nombreCliente}</h2>
            <p>Información de la reserva registrada en SIAR.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar detalle"><SiarIcon name="close" size="sm" /></button>
        </div>
        <div className="reserva-detail-grid">
          <div><span>Fecha y hora</span><strong>{formatoFecha(reserva.fechaHora)}</strong></div>
          <div><span>Mesa asignada</span><strong>Mesa {reserva.numeroMesa}</strong></div>
          <div><span>Número de personas</span><strong>{reserva.numPersonas}</strong></div>
          <div><span>Teléfono</span><strong>{reserva.telefono || "No registrado"}</strong></div>
          <div><span>Ubicación</span><strong>{reserva.ubicacion || "No especificada"}</strong></div>
          <div><span>Situación temporal</span><EstadoReserva estado={estado} /></div>
        </div>
        <div className="modal-actions">
          <button className="button button-primary" type="button" onClick={onClose}>Cerrar</button>
        </div>
      </section>
    </div>
  );
}

export default function ReservasPage() {
  const [reservas, setReservas] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [avisoParcial, setAvisoParcial] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("TODAS");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    setAvisoParcial("");

    try {
      const respuestaMesas = await mesasService.listar();
      const listaMesas = extraerLista(respuestaMesas);
      setMesas(listaMesas);

      if (listaMesas.length === 0) {
        setReservas([]);
        return;
      }

      const mesasConId = listaMesas.filter((mesa) => idMesa(mesa) != null);
      const resultados = await Promise.allSettled(
        mesasConId.map(async (mesa) => {
          const respuesta = await reservasService.listarPorMesa(idMesa(mesa));
          return extraerLista(respuesta).map((reserva) => adaptarReserva(reserva, listaMesas));
        })
      );

      const listas = resultados
        .filter((resultado) => resultado.status === "fulfilled")
        .flatMap((resultado) => resultado.value);
      const fallidas = resultados.filter((resultado) => resultado.status === "rejected").length;

      const unicas = new Map();
      listas.forEach((reserva, indice) => {
        const clave = reserva.idReserva ?? `${reserva.idMesa}-${reserva.fechaHora}-${reserva.nombreCliente}-${indice}`;
        unicas.set(String(clave), reserva);
      });
      setReservas(Array.from(unicas.values()).sort((a, b) => {
        const fechaA = parseFecha(a.fechaHora)?.getTime() ?? 0;
        const fechaB = parseFecha(b.fechaHora)?.getTime() ?? 0;
        return fechaA - fechaB;
      }));

      if (fallidas > 0) {
        setAvisoParcial(`${fallidas} ${fallidas === 1 ? "mesa no pudo" : "mesas no pudieron"} devolver sus reservas. La lista puede estar incompleta.`);
      }
      if (fallidas === mesasConId.length && mesasConId.length > 0) {
        setError("No fue posible consultar las reservas. Revisa el endpoint de reservas y el mapeo de la entidad Reserva en el backend.");
      }
    } catch (e) {
      setError(e?.message || "No fue posible cargar la información de reservas.");
      setReservas([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const resumen = useMemo(() => {
    const ahora = new Date();
    return {
      total: reservas.length,
      hoy: reservas.filter((reserva) => estadoTemporal(reserva, ahora) === "HOY").length,
      proximas: reservas.filter((reserva) => estadoTemporal(reserva, ahora) === "PROXIMA").length,
      pasadas: reservas.filter((reserva) => estadoTemporal(reserva, ahora) === "PASADA").length,
    };
  }, [reservas]);

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase("es");
    const ahora = new Date();
    return reservas.filter((reserva) => {
      const texto = [
        reserva.nombreCliente,
        reserva.telefono,
        reserva.numeroMesa,
        reserva.ubicacion,
      ].some((valor) => String(valor ?? "").toLocaleLowerCase("es").includes(termino));
      const coincideFiltro = filtro === "TODAS" || estadoTemporal(reserva, ahora) === filtro.replace("PROXIMAS", "PROXIMA");
      return (!termino || texto) && coincideFiltro;
    });
  }, [reservas, busqueda, filtro]);

  const mesasDisponibles = useMemo(
    () => mesas.filter((mesa) => estadoMesa(mesa) === "DISPONIBLE"),
    [mesas]
  );

  async function crearReserva({ idMesa: mesaId, reserva, mesa }) {
    setGuardando(true);
    setError("");
    try {
      await reservasService.crear(mesaId, reserva);
      setModalAbierto(false);
      setMensaje(`Reserva de ${reserva.nombreCliente} registrada para la mesa ${numeroMesa(mesa)}.`);
      await cargar();
    } catch (e) {
      setError(e?.message || "No fue posible registrar la reserva.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="reservas-module">
      <header className="topbar">
        <div className="breadcrumb">
          <span>Inicio</span><span className="crumb-separator">/</span>
          <span>Mesas</span><span className="crumb-separator">/</span>
          <strong>Reservas</strong>
        </div>
        <div className="topbar-right">
          <span className="environment-pill"><span /> Entorno local</span>
          <div className="profile-block">
            <div className="avatar">AD</div>
            <div className="profile-details"><strong>Administrador</strong><small>Administrador</small></div>
          </div>
        </div>
      </header>

      <main className="page-content reservas-page-content">
        <section className="page-heading">
          <div>
            <div className="eyebrow">MÓDULO DE MESAS </div>
            <h1>Gestión de reservas</h1>
            <p>Organiza las próximas visitas, registra clientes y asigna mesas según su capacidad.</p>
          </div>
          <button className="button button-primary button-add" type="button" onClick={() => { setMensaje(""); setError(""); setModalAbierto(true); }} disabled={mesasDisponibles.length === 0}>
            <SiarIcon name="plus" size="sm" /> Nueva reserva
          </button>
        </section>

        {error && !modalAbierto && (
          <section className="connection-alert reservas-connection-alert" role="alert">
            <div className="alert-icon"><SiarIcon name="warning" size="md" /></div>
            <div className="alert-copy">
              <strong>No se pudieron consultar las reservas</strong>
              <p>{error}</p>
              <small>Comprueba la conexión, el token JWT y el mapeo de Reserva en el backend.</small>
            </div>
            <button className="button button-secondary" type="button" onClick={cargar} disabled={cargando}><SiarIcon name="refresh" size="sm" /> Reintentar</button>
          </section>
        )}

        {avisoParcial && !error && (
          <section className="reservas-partial-alert" role="status">
            <SiarIcon name="warning" size="sm" /> {avisoParcial}
          </section>
        )}

        {mensaje && (
          <div className="toast toast-success reservas-toast" role="status">
            <SiarIcon name="check" size="md" /><span>{mensaje}</span>
            <button type="button" onClick={() => setMensaje("")} aria-label="Cerrar notificación"><SiarIcon name="close" size="sm" /></button>
          </div>
        )}

        <section className="stats-grid reservas-stats-grid" aria-label="Resumen de reservas">
          <StatCard icon="calendar" label="Reservas registradas" value={cargando ? "—" : String(resumen.total).padStart(2, "0")} note="Registros consultados" tone="icon-violet" />
          <StatCard icon="bell" label="Programadas para hoy" value={cargando ? "—" : String(resumen.hoy).padStart(2, "0")} note="Visitas durante el día" tone="icon-green" />
          <StatCard icon="arrowRight" label="Próximas reservas" value={cargando ? "—" : String(resumen.proximas).padStart(2, "0")} note="Visitas futuras" tone="icon-amber" />
          <StatCard icon="clipboard" label="Reservas pasadas" value={cargando ? "—" : String(resumen.pasadas).padStart(2, "0")} note="Fecha y hora ya transcurridas" tone="icon-violet" />
        </section>

        <section className="table-panel reservas-panel">
          <div className="panel-header">
            <div>
              <h2>Agenda de reservas</h2>
              <p>Consulta los datos del cliente, la mesa asignada y el horario solicitado.</p>
            </div>
            <button className="button button-light" type="button" onClick={cargar} disabled={cargando}>
              <SiarIcon name="refresh" size="sm" /> Actualizar
            </button>
          </div>

          <div className="table-toolbar reservas-toolbar">
            <label className="search-box reservas-search-box">
              <SiarIcon name="search" size="sm" />
              <input aria-label="Buscar reservas" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar cliente, teléfono o mesa…" />
            </label>
            <div className="filter-tabs reservas-filter-tabs" role="group" aria-label="Filtrar reservas">
              {FILTROS.map(([value, label]) => (
                <button key={value} type="button" className={`filter-tab ${filtro === value ? "filter-tab-active" : ""}`} onClick={() => setFiltro(value)}>{label}</button>
              ))}
            </div>
          </div>

          {cargando ? (
            <div className="reservas-loading"><span className="spinner spinner-dark" /> Consultando agenda de reservas…</div>
          ) : error && reservas.length === 0 ? (
            <div className="empty-state reservas-empty-state">
              <div className="empty-icon"><SiarIcon name="warning" size="lg" /></div>
              <strong>No fue posible consultar la agenda</strong>
              <p>Verifica que el backend tenga habilitada la consulta de reservas por mesa.</p>
              <button className="button button-secondary" type="button" onClick={cargar}><SiarIcon name="refresh" size="sm" /> Reintentar consulta</button>
            </div>
          ) : filtradas.length === 0 ? (
            <div className="empty-state reservas-empty-state">
              <div className="empty-icon"><SiarIcon name="calendar" size="lg" /></div>
              <strong>{reservas.length === 0 ? "Aún no hay reservas registradas" : "No hay reservas para estos filtros"}</strong>
              <p>{reservas.length === 0 ? "Registra la primera reserva para comenzar a organizar las visitas." : "Prueba otra búsqueda o selecciona un filtro diferente."}</p>
              {reservas.length === 0 && mesasDisponibles.length > 0 && <button className="button button-primary" type="button" onClick={() => setModalAbierto(true)}><SiarIcon name="plus" size="sm" /> Crear primera reserva</button>}
            </div>
          ) : (
            <div className="table-scroll">
              <table className="category-table reservas-table">
                <thead>
                  <tr>
                    <th>CLIENTE</th>
                    <th>MESA</th>
                    <th>FECHA Y HORA</th>
                    <th>PERSONAS</th>
                    <th>CONTACTO</th>
                    <th>ESTADO TEMPORAL</th>
                    <th className="actions-heading">DETALLE</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((reserva, indice) => {
                    const estado = estadoTemporal(reserva);
                    return (
                      <tr key={reserva.idReserva ?? `${reserva.idMesa}-${reserva.fechaHora}-${indice}`}>
                        <td>
                          <div className="category-name-cell reserva-client-cell">
                            <div className={`category-symbol symbol-${indice % 5}`}><SiarIcon name="users" size="sm" /></div>
                            <div><strong>{reserva.nombreCliente}</strong><small>{reserva.idReserva != null ? `Reserva #${reserva.idReserva}` : "Reserva registrada"}</small></div>
                          </div>
                        </td>
                        <td><span className="reserva-table-chip">Mesa {reserva.numeroMesa}</span><small className="reserva-location">{reserva.ubicacion}</small></td>
                        <td><strong className="reserva-date">{formatoFecha(reserva.fechaHora)}</strong></td>
                        <td><span className="reserva-people"><SiarIcon name="users" size="xs" /> {reserva.numPersonas}</span></td>
                        <td>{reserva.telefono || <span className="reserva-muted">No registrado</span>}</td>
                        <td><EstadoReserva estado={estado} /></td>
                        <td><div className="row-actions"><button className="action-button" type="button" onClick={() => setReservaSeleccionada(reserva)}><SiarIcon name="arrowRight" size="sm" /> Ver</button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="table-footer reservas-footer">
            <span>Mostrando <strong>{cargando ? "—" : filtradas.length}</strong> de <strong>{cargando ? "—" : reservas.length}</strong> reservas</span>
            <span className="footer-api"><span className={`status-light ${error ? "status-down" : cargando ? "status-pending" : "status-up"}`} /> {error ? "Revisa la conexión" : cargando ? "Consultando API" : `${mesas.length} mesas consultadas`}</span>
          </div>
        </section>

        <div className="reservas-page-note">
          <span className="reservas-note-icon"><SiarIcon name="clipboard" size="md" /></span>
          <div><strong>Criterio de disponibilidad</strong><p>El formulario solo ofrece mesas activas en estado disponible y con capacidad suficiente. El backend debe validar que no exista otra reserva u ocupación que se cruce con la fecha y hora solicitadas.</p></div>
        </div>
      </main>

      {modalAbierto && <ReservaModal mesas={mesas} guardando={guardando} saveError={error} onCancel={() => !guardando && setModalAbierto(false)} onSubmit={crearReserva} />}
      <DetalleReservaModal reserva={reservaSeleccionada} onClose={() => setReservaSeleccionada(null)} />
    </div>
  );
}
