import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import SiarIcon from "../components/ui/SiarIcon.jsx";
import { useAuth } from "../features/auth/context/AuthContext.jsx";
import { iniciales, nombreRol, puedeAcceder } from "../config/roles.js";
import "../styles/admin-layout.css";

// Layout único del panel. El menú se filtra según el rol del usuario
// (ver config/roles.js), así cada rol solo ve las secciones que puede operar.
export default function AdminLayout() {
    const { sesion, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const rol = sesion?.rol;

    const [menuAbierto, setMenuAbierto] = useState(true);
    const [mesasAbierto, setMesasAbierto] = useState(
        location.pathname.startsWith("/mesas")
    );

    useEffect(() => {
        if (location.pathname.startsWith("/mesas")) {
            setMesasAbierto(true);
        }
    }, [location.pathname]);

    const verProductos = puedeAcceder(rol, "productos");
    const verCategorias = puedeAcceder(rol, "categorias");
    const verMesas = puedeAcceder(rol, "mesas");
    const verReservas = puedeAcceder(rol, "reservas");

    function cerrarSesion() {
        logout();
        navigate("/login", { replace: true });
    }

    const claseSubmenu = ({ isActive }) =>
        `admin-submenu-link ${isActive ? "active" : ""}`;

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                {/* Identidad visual de SIAR */}
                <div className="admin-brand">
                    <div className="admin-logo">✣</div>

                    <div>
                        <h1>SIAR</h1>
                        <p>
                            Sistema Integral de
                            <br />
                            Administración de Restaurantes
                        </p>
                    </div>
                </div>

                <nav className="admin-navigation">
                    {/* Secciones pendientes: se muestran deshabilitadas.
                        Inicio, Usuarios y Reportes aún no tienen módulo. */}
                    <div className="admin-nav-disabled" aria-disabled="true">
                        <span className="admin-nav-icon">⌂</span>
                        <span>Inicio</span>
                    </div>

                    {puedeAcceder(rol, "pedidos") && (
                        <NavLink
                            to="/pedidos"
                            className={({ isActive }) =>
                                `admin-nav-link ${isActive ? "active" : ""}`
                            }
                        >
                            <span className="admin-nav-icon">▤</span>
                            <span>Pedidos</span>
                        </NavLink>
                    )}

                    {(verProductos || verCategorias) && (
                        <div className="admin-nav-group">
                            <button
                                type="button"
                                className="admin-nav-menu"
                                onClick={() => setMenuAbierto(!menuAbierto)}
                                aria-expanded={menuAbierto}
                            >
                                <span className="admin-nav-icon">▦</span>
                                <span>Menú</span>

                                <span className="admin-chevron">
                                    {menuAbierto ? "⌃" : "⌄"}
                                </span>
                            </button>

                            {menuAbierto && (
                                <div className="admin-submenu">
                                    {verProductos && (
                                        <NavLink to="/productos" className={claseSubmenu}>
                                            Productos
                                        </NavLink>
                                    )}

                                    {verCategorias && (
                                        <NavLink to="/categorias" className={claseSubmenu}>
                                            Categorías
                                        </NavLink>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {rol === "ADMINISTRADOR" && (
                        <div className="admin-nav-disabled" aria-disabled="true">
                            <span className="admin-nav-icon">♙</span>
                            <span>Usuarios</span>
                        </div>
                    )}

                    {(verMesas || verReservas) && (
                        <div className="admin-nav-group">
                            <button
                                type="button"
                                className="admin-nav-menu"
                                onClick={() => setMesasAbierto((abierto) => !abierto)}
                                aria-expanded={mesasAbierto}
                            >
                                <span className="admin-nav-icon">♧</span>
                                <span>Mesas</span>
                                <span className="admin-chevron">
                                    {mesasAbierto ? "⌃" : "⌄"}
                                </span>
                            </button>

                            {mesasAbierto && (
                                <div className="admin-submenu">
                                    {verMesas && (
                                        <NavLink to="/mesas" end className={claseSubmenu}>
                                            Mesas
                                        </NavLink>
                                    )}

                                    {verReservas && (
                                        <NavLink to="/mesas/reservas" className={claseSubmenu}>
                                            Reservas
                                        </NavLink>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {rol === "ADMINISTRADOR" && (
                        <div className="admin-nav-disabled" aria-disabled="true">
                            <span className="admin-nav-icon">▥</span>
                            <span>Reportes</span>
                        </div>
                    )}

                    {/* Configuración se omite porque no pertenece
                        a los módulos definidos actualmente en SIAR. */}
                </nav>

                <div className="admin-sidebar-footer">
                    <div className="admin-avatar">{iniciales(sesion?.nombre)}</div>

                    <div className="admin-user">
                        <strong>{sesion?.nombre}</strong>
                        <span>{nombreRol(rol)}</span>
                    </div>

                    <button
                        type="button"
                        className="admin-logout"
                        onClick={cerrarSesion}
                        title="Cerrar sesión"
                        aria-label="Cerrar sesión"
                    >
                        <SiarIcon name="logout" size="sm" />
                    </button>
                </div>
            </aside>

            {/* Aquí se renderiza la página seleccionada */}
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
}
