import { useEffect, useMemo, useState } from "react";

import SiarIcon from "../../../components/ui/SiarIcon.jsx";
import UsuarioActual from "../../../components/ui/UsuarioActual.jsx";
import { useAuth } from "../../auth/context/AuthContext.jsx";
import { iniciales, nombreRol, ROLES } from "../../../config/roles.js";
import { usuariosService } from "../services/usuariosService.js";
import "../../../styles/usuarios.css";

// Gestión de usuarios (HU01-HU04): el administrador registra, edita,
// asigna rol, activa/desactiva y asigna contraseñas nuevas.

const MIN_CONTRASENA = 8;

const FORM_VACIO = {
    nombre: "",
    correo: "",
    usuario: "",
    contrasena: "",
    rol: ROLES.MESERO
};

const ROLES_RESPALDO = Object.values(ROLES).map((nombre) => ({ nombre }));

function StatCard({ icon, label, value, note, iconClass }) {
    return (
        <article className="stat-card usuario-stat-card">
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

function validarDatos(form, creando) {
    if (!form.nombre.trim()) return "El nombre es obligatorio.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) return "El correo no es válido.";
    if (!form.usuario.trim()) return "El nombre de usuario es obligatorio.";
    if (/\s/.test(form.usuario.trim())) return "El nombre de usuario no puede tener espacios.";
    if (creando && form.contrasena.length < MIN_CONTRASENA) {
        return `La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres.`;
    }
    return "";
}

export default function UsuariosPage() {
    const { sesion } = useAuth();
    const idPropio = sesion?.idUsuario;

    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState(ROLES_RESPALDO);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [errorAccion, setErrorAccion] = useState("");
    const [accionId, setAccionId] = useState(null);

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("TODOS");
    const [filtroRol, setFiltroRol] = useState("TODOS");

    // Modal de crear / editar
    const [modal, setModal] = useState(null); // null | "crear" | "editar" | "contrasena"
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(FORM_VACIO);
    const [errorForm, setErrorForm] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [verContrasena, setVerContrasena] = useState(false);

    async function cargar({ silencioso = false } = {}) {
        if (!silencioso) setCargando(true);
        setErrorCarga("");
        try {
            const [lista, listaRoles] = await Promise.all([
                usuariosService.listar(),
                usuariosService.listarRoles().catch(() => null)
            ]);
            setUsuarios(Array.isArray(lista) ? lista : []);
            if (Array.isArray(listaRoles) && listaRoles.length) setRoles(listaRoles);
        } catch (e) {
            setErrorCarga(e?.message || "No fue posible cargar los usuarios.");
        } finally {
            if (!silencioso) setCargando(false);
        }
    }

    useEffect(() => {
        cargar();
        // La consulta inicial se ejecuta al montar la página.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resumen = useMemo(() => ({
        total: usuarios.length,
        activos: usuarios.filter((u) => u.activo).length,
        inactivos: usuarios.filter((u) => !u.activo).length,
        administradores: usuarios.filter((u) => u.activo && u.rol === ROLES.ADMINISTRADOR).length
    }), [usuarios]);

    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLocaleLowerCase("es");
        return usuarios.filter((u) => {
            const coincideTexto = !termino || [u.nombre, u.usuario, u.correo]
                .some((valor) => String(valor ?? "").toLocaleLowerCase("es").includes(termino));
            const coincideEstado = filtroEstado === "TODOS"
                || (filtroEstado === "ACTIVOS" ? u.activo : !u.activo);
            const coincideRol = filtroRol === "TODOS" || u.rol === filtroRol;
            return coincideTexto && coincideEstado && coincideRol;
        });
    }, [usuarios, busqueda, filtroEstado, filtroRol]);

    function mostrarMensaje(texto) {
        setMensaje(texto);
        window.setTimeout(() => setMensaje(""), 4200);
    }

    function abrirCrear() {
        setEditando(null);
        setForm(FORM_VACIO);
        setErrorForm("");
        setVerContrasena(false);
        setModal("crear");
    }

    function abrirEditar(usuario) {
        setEditando(usuario);
        setForm({ ...FORM_VACIO, nombre: usuario.nombre, correo: usuario.correo, usuario: usuario.usuario, rol: usuario.rol });
        setErrorForm("");
        setModal("editar");
    }

    function abrirContrasena(usuario) {
        setEditando(usuario);
        setForm({ ...FORM_VACIO, contrasena: "" });
        setErrorForm("");
        setVerContrasena(false);
        setModal("contrasena");
    }

    function cerrarModal() {
        if (guardando) return;
        setModal(null);
        setEditando(null);
    }

    function cambiarCampo(evento) {
        const { name, value } = evento.target;
        setForm((actual) => ({ ...actual, [name]: value }));
    }

    async function guardar(evento) {
        evento.preventDefault();
        const creando = modal === "crear";
        const error = validarDatos(form, creando);
        if (error) {
            setErrorForm(error);
            return;
        }

        const datos = {
            nombre: form.nombre.trim(),
            correo: form.correo.trim(),
            usuario: form.usuario.trim()
        };

        setGuardando(true);
        setErrorForm("");
        try {
            if (creando) {
                await usuariosService.crear({ ...datos, contrasena: form.contrasena, rol: form.rol });
                mostrarMensaje(`Usuario ${datos.usuario} registrado correctamente.`);
            } else {
                await usuariosService.actualizar(editando.idUsuario, datos);
                mostrarMensaje(`Usuario ${datos.usuario} actualizado correctamente.`);
            }
            setModal(null);
            setEditando(null);
            await cargar({ silencioso: true });
        } catch (e) {
            setErrorForm(e?.message || "No fue posible guardar el usuario.");
        } finally {
            setGuardando(false);
        }
    }

    async function guardarContrasena(evento) {
        evento.preventDefault();
        if (form.contrasena.length < MIN_CONTRASENA) {
            setErrorForm(`La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres.`);
            return;
        }
        setGuardando(true);
        setErrorForm("");
        try {
            await usuariosService.restablecerContrasena(editando.idUsuario, form.contrasena);
            mostrarMensaje(`Contraseña de ${editando.usuario} actualizada.`);
            setModal(null);
            setEditando(null);
        } catch (e) {
            setErrorForm(e?.message || "No fue posible cambiar la contraseña.");
        } finally {
            setGuardando(false);
        }
    }

    async function ejecutarAccion(usuario, accion, textoExito) {
        setErrorAccion("");
        setAccionId(usuario.idUsuario);
        try {
            await accion();
            mostrarMensaje(textoExito);
            await cargar({ silencioso: true });
        } catch (e) {
            setErrorAccion(e?.message || "No fue posible completar la operación.");
        } finally {
            setAccionId(null);
        }
    }

    function cambiarRol(usuario, rol) {
        if (rol === usuario.rol) return;
        ejecutarAccion(
            usuario,
            () => usuariosService.cambiarRol(usuario.idUsuario, rol),
            `${usuario.nombre} ahora es ${nombreRol(rol).toLocaleLowerCase("es")}.`
        );
    }

    function cambiarEstado(usuario) {
        const activar = !usuario.activo;
        if (!activar && !window.confirm(`¿Desactivar a ${usuario.nombre}? No podrá iniciar sesión.`)) {
            return;
        }
        ejecutarAccion(
            usuario,
            () => usuariosService.cambiarEstado(usuario.idUsuario, activar),
            `${usuario.nombre} fue ${activar ? "activado" : "desactivado"}.`
        );
    }

    const contador = (valor) => (cargando ? "—" : String(valor).padStart(2, "0"));

    return (
        <div className="usuarios-module">
            <header className="topbar">
                <div className="breadcrumb">
                    <span>Inicio</span>
                    <span className="crumb-separator">/</span>
                    <strong>Usuarios</strong>
                </div>
                <div className="topbar-right">
                    <span className="environment-pill"><span /> Entorno local</span>
                    <UsuarioActual />
                </div>
            </header>

            <main className="page-content usuarios-page-content">
                <section className="page-heading">
                    <div>
                        <div className="eyebrow">ADMINISTRACIÓN</div>
                        <h1>Gestión de usuarios</h1>
                        <p>Registra al personal, asigna su rol y controla quién puede iniciar sesión en SIAR.</p>
                    </div>
                    <button className="button button-primary button-add" type="button" onClick={abrirCrear}>
                        <SiarIcon name="plus" size="sm" />
                        Nuevo usuario
                    </button>
                </section>

                {errorAccion && (
                    <section className="connection-alert usuarios-alert" role="alert">
                        <div className="alert-icon"><SiarIcon name="warning" size="md" /></div>
                        <div className="alert-copy">
                            <strong>No se pudo completar la operación</strong>
                            <p>{errorAccion}</p>
                        </div>
                        <button className="icon-button" type="button" onClick={() => setErrorAccion("")} aria-label="Cerrar alerta">
                            <SiarIcon name="close" size="sm" />
                        </button>
                    </section>
                )}

                {mensaje && (
                    <div className="toast toast-success usuarios-toast" role="status">
                        <SiarIcon name="check" size="md" />
                        <span>{mensaje}</span>
                        <button type="button" onClick={() => setMensaje("")} aria-label="Cerrar notificación"><SiarIcon name="close" size="sm" /></button>
                    </div>
                )}

                <section className="stats-grid usuarios-stats-grid" aria-label="Resumen de usuarios">
                    <StatCard icon="users" label="Usuarios registrados" value={contador(resumen.total)} note="Personal con acceso a SIAR" iconClass="icon-violet" />
                    <StatCard icon="check" label="Activos" value={contador(resumen.activos)} note="Pueden iniciar sesión" iconClass="icon-green" />
                    <StatCard icon="pause" label="Inactivos" value={contador(resumen.inactivos)} note="Acceso bloqueado" iconClass="icon-amber" />
                    <StatCard icon="lock" label="Administradores" value={contador(resumen.administradores)} note="Activos con acceso total" iconClass="icon-violet" />
                </section>

                <section className="table-panel usuarios-panel">
                    <div className="panel-header">
                        <div>
                            <h2>Personal del restaurante</h2>
                            <p>Cambia el rol desde la tabla; edita los datos o la contraseña con las acciones.</p>
                        </div>
                        <button className="button button-light" type="button" onClick={() => cargar()} disabled={cargando}>
                            <SiarIcon name="refresh" size="sm" /> Actualizar
                        </button>
                    </div>

                    <div className="table-toolbar usuarios-toolbar">
                        <label className="search-box usuarios-search-box">
                            <SiarIcon name="search" size="sm" />
                            <input
                                aria-label="Buscar usuarios"
                                value={busqueda}
                                onChange={(evento) => setBusqueda(evento.target.value)}
                                placeholder="Buscar por nombre, usuario o correo…"
                            />
                        </label>
                        <label className="usuarios-rol-filter">
                            <span className="sr-only">Filtrar por rol</span>
                            <select value={filtroRol} onChange={(evento) => setFiltroRol(evento.target.value)}>
                                <option value="TODOS">Todos los roles</option>
                                {roles.map((rol) => <option key={rol.nombre} value={rol.nombre}>{nombreRol(rol.nombre)}</option>)}
                            </select>
                            <SiarIcon name="chevronDown" size="xs" />
                        </label>
                        <div className="filter-tabs" role="group" aria-label="Filtrar usuarios por estado">
                            {[["TODOS", "Todos"], ["ACTIVOS", "Activos"], ["INACTIVOS", "Inactivos"]].map(([value, label]) => (
                                <button key={value} type="button" className={`filter-tab ${filtroEstado === value ? "filter-tab-active" : ""}`} onClick={() => setFiltroEstado(value)}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="table-scroll">
                        <table className="category-table usuarios-table">
                            <thead>
                                <tr>
                                    <th>USUARIO</th>
                                    <th>CORREO</th>
                                    <th>ROL</th>
                                    <th>ESTADO</th>
                                    <th className="actions-heading">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando && (
                                    <tr><td colSpan="5"><div className="loading-state"><span className="spinner spinner-dark" /> Cargando usuarios…</div></td></tr>
                                )}

                                {!cargando && errorCarga && (
                                    <tr><td colSpan="5">
                                        <div className="empty-state">
                                            <div className="empty-icon"><SiarIcon name="warning" size="lg" /></div>
                                            <strong>No fue posible consultar los usuarios</strong>
                                            <p>{errorCarga}</p>
                                            <button className="button button-secondary" type="button" onClick={() => cargar()}><SiarIcon name="refresh" size="sm" /> Reintentar</button>
                                        </div>
                                    </td></tr>
                                )}

                                {!cargando && !errorCarga && filtrados.map((u) => {
                                    const esPropio = u.idUsuario === idPropio;
                                    const enCurso = accionId === u.idUsuario;
                                    return (
                                        <tr key={u.idUsuario} className={u.activo ? "" : "usuario-inactivo"}>
                                            <td>
                                                <div className="usuario-cell">
                                                    <div className="avatar">{iniciales(u.nombre)}</div>
                                                    <div>
                                                        <strong>{u.nombre}{esPropio && <span className="usuario-tu">Tú</span>}</strong>
                                                        <small>@{u.usuario}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="usuario-correo">{u.correo}</td>
                                            <td>
                                                <label className="usuario-rol-select" title={esPropio ? "No puedes cambiar tu propio rol" : "Cambiar rol"}>
                                                    <span className="sr-only">Rol de {u.nombre}</span>
                                                    <select value={u.rol} disabled={esPropio || enCurso} onChange={(evento) => cambiarRol(u, evento.target.value)}>
                                                        {roles.map((rol) => <option key={rol.nombre} value={rol.nombre}>{nombreRol(rol.nombre)}</option>)}
                                                    </select>
                                                    <SiarIcon name="chevronDown" size="xs" />
                                                </label>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${u.activo ? "badge-active" : "badge-inactive"}`}><span />{u.activo ? "Activo" : "Inactivo"}</span>
                                            </td>
                                            <td>
                                                <div className="row-actions">
                                                    <button className="action-button" type="button" onClick={() => abrirEditar(u)} title="Editar datos" disabled={enCurso}>
                                                        <SiarIcon name="edit" size="sm" /><span>Editar</span>
                                                    </button>
                                                    <button className="action-button" type="button" onClick={() => abrirContrasena(u)} title="Asignar contraseña nueva" disabled={enCurso}>
                                                        <SiarIcon name="lock" size="sm" /><span>Contraseña</span>
                                                    </button>
                                                    <button
                                                        className={`action-button ${u.activo ? "action-danger" : "action-success"}`}
                                                        type="button"
                                                        onClick={() => cambiarEstado(u)}
                                                        disabled={enCurso || (esPropio && u.activo)}
                                                        title={esPropio && u.activo ? "No puedes desactivar tu propio usuario" : u.activo ? "Desactivar usuario" : "Activar usuario"}
                                                    >
                                                        <SiarIcon name={u.activo ? "pause" : "check"} size="sm" />
                                                        <span>{enCurso ? "Guardando…" : u.activo ? "Desactivar" : "Activar"}</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {!cargando && !errorCarga && filtrados.length === 0 && (
                                    <tr><td colSpan="5">
                                        <div className="empty-state">
                                            <div className="empty-icon"><SiarIcon name="users" size="lg" /></div>
                                            <strong>{usuarios.length ? "No hay usuarios para estos filtros" : "Aún no hay usuarios"}</strong>
                                            <p>{usuarios.length ? "Prueba otra búsqueda o cambia los filtros." : "Registra al personal para que pueda iniciar sesión."}</p>
                                        </div>
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="table-footer">
                        <span>Mostrando <strong>{cargando ? "—" : filtrados.length}</strong> de <strong>{cargando ? "—" : usuarios.length}</strong> usuarios</span>
                        <span className="footer-api"><span className={`status-light ${errorCarga ? "status-down" : cargando ? "status-pending" : "status-up"}`} /> {errorCarga ? "Revisa la conexión" : cargando ? "Consultando API" : `${resumen.activos} usuarios activos`}</span>
                    </div>
                </section>

                <div className="usuarios-page-note">
                    <span className="usuarios-note-icon"><SiarIcon name="clipboard" size="md" /></span>
                    <div>
                        <strong>Sobre los cambios de acceso</strong>
                        <p>Un usuario desactivado ya no puede iniciar sesión. Si tenía una sesión abierta, el cambio de rol o de estado aplica cuando vuelva a iniciar sesión.</p>
                    </div>
                </div>
            </main>

            {(modal === "crear" || modal === "editar") && (
                <div className="modal-backdrop" role="presentation" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) cerrarModal(); }}>
                    <section className="modal usuario-modal" role="dialog" aria-modal="true" aria-labelledby="usuario-modal-title">
                        <div className="modal-header">
                            <div>
                                <div className="eyebrow">GESTIÓN DE USUARIOS</div>
                                <h2 id="usuario-modal-title">{modal === "crear" ? "Registrar usuario" : `Editar ${editando?.nombre}`}</h2>
                                <p>{modal === "crear" ? "Datos de acceso y rol del nuevo usuario." : "El rol y el estado se cambian desde la tabla."}</p>
                            </div>
                            <button className="icon-button" type="button" onClick={cerrarModal} disabled={guardando} aria-label="Cerrar formulario"><SiarIcon name="close" size="sm" /></button>
                        </div>

                        <form onSubmit={guardar} noValidate>
                            <div className="usuario-form-grid">
                                <div className="usuario-form-full">
                                    <label className="field-label" htmlFor="usuario-nombre">Nombre completo <span>*</span></label>
                                    <input className="text-input" id="usuario-nombre" name="nombre" maxLength="100" value={form.nombre} onChange={cambiarCampo} placeholder="Ej. Laura Gómez" autoFocus />
                                </div>
                                <div>
                                    <label className="field-label" htmlFor="usuario-usuario">Nombre de usuario <span>*</span></label>
                                    <input className="text-input" id="usuario-usuario" name="usuario" maxLength="50" value={form.usuario} onChange={cambiarCampo} placeholder="Ej. lgomez" autoComplete="off" />
                                    <div className="field-help">Sin espacios. Se usa para iniciar sesión.</div>
                                </div>
                                <div>
                                    <label className="field-label" htmlFor="usuario-correo">Correo <span>*</span></label>
                                    <input className="text-input" id="usuario-correo" name="correo" type="email" maxLength="150" value={form.correo} onChange={cambiarCampo} placeholder="Ej. laura@siar.com" autoComplete="off" />
                                </div>
                                {modal === "crear" && (
                                    <>
                                        <div>
                                            <label className="field-label" htmlFor="usuario-contrasena">Contraseña <span>*</span></label>
                                            <div className="usuario-password">
                                                <input className="text-input" id="usuario-contrasena" name="contrasena" type={verContrasena ? "text" : "password"} maxLength="72" value={form.contrasena} onChange={cambiarCampo} autoComplete="new-password" />
                                                <button type="button" onClick={() => setVerContrasena((v) => !v)} aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}>
                                                    <SiarIcon name={verContrasena ? "eyeOff" : "eye"} size="sm" />
                                                </button>
                                            </div>
                                            <div className="field-help">Mínimo {MIN_CONTRASENA} caracteres.</div>
                                        </div>
                                        <div>
                                            <label className="field-label" htmlFor="usuario-rol">Rol <span>*</span></label>
                                            <select className="text-input" id="usuario-rol" name="rol" value={form.rol} onChange={cambiarCampo}>
                                                {roles.map((rol) => <option key={rol.nombre} value={rol.nombre}>{nombreRol(rol.nombre)}</option>)}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>

                            {errorForm && <div className="inline-error" role="alert"><SiarIcon name="warning" size="sm" /> {errorForm}</div>}

                            <div className="modal-actions">
                                <button className="button button-secondary" type="button" onClick={cerrarModal} disabled={guardando}>Cancelar</button>
                                <button className="button button-primary" type="submit" disabled={guardando}>
                                    {guardando ? <><span className="spinner" /> Guardando…</> : <><SiarIcon name="check" size="sm" /> {modal === "crear" ? "Registrar usuario" : "Guardar cambios"}</>}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {modal === "contrasena" && (
                <div className="modal-backdrop" role="presentation" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) cerrarModal(); }}>
                    <section className="modal usuario-modal usuario-modal-sm" role="dialog" aria-modal="true" aria-labelledby="contrasena-modal-title">
                        <div className="modal-header">
                            <div>
                                <div className="eyebrow">GESTIÓN DE USUARIOS</div>
                                <h2 id="contrasena-modal-title">Contraseña nueva</h2>
                                <p>Para {editando?.nombre} (@{editando?.usuario}). Compártela con el usuario por un medio seguro.</p>
                            </div>
                            <button className="icon-button" type="button" onClick={cerrarModal} disabled={guardando} aria-label="Cerrar formulario"><SiarIcon name="close" size="sm" /></button>
                        </div>

                        <form onSubmit={guardarContrasena} noValidate>
                            <label className="field-label" htmlFor="nueva-contrasena">Contraseña <span>*</span></label>
                            <div className="usuario-password">
                                <input className="text-input" id="nueva-contrasena" name="contrasena" type={verContrasena ? "text" : "password"} maxLength="72" value={form.contrasena} onChange={cambiarCampo} autoComplete="new-password" autoFocus />
                                <button type="button" onClick={() => setVerContrasena((v) => !v)} aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}>
                                    <SiarIcon name={verContrasena ? "eyeOff" : "eye"} size="sm" />
                                </button>
                            </div>
                            <div className="field-help">Mínimo {MIN_CONTRASENA} caracteres.</div>

                            {errorForm && <div className="inline-error" role="alert"><SiarIcon name="warning" size="sm" /> {errorForm}</div>}

                            <div className="modal-actions">
                                <button className="button button-secondary" type="button" onClick={cerrarModal} disabled={guardando}>Cancelar</button>
                                <button className="button button-primary" type="submit" disabled={guardando}>
                                    {guardando ? <><span className="spinner" /> Guardando…</> : <><SiarIcon name="lock" size="sm" /> Asignar contraseña</>}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}
