import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../styles/admin-layout.css";

export default function AdminLayout() {
    const [menuAbierto, setMenuAbierto] = useState(true);

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
                        Cuando se implementen, reemplazar por NavLink
                        y agregar su ruta en App.jsx. */}
                    <div className="admin-nav-disabled" aria-disabled="true">
                        <span className="admin-nav-icon">⌂</span>
                        <span>Inicio</span>
                    </div>

                    <div className="admin-nav-disabled" aria-disabled="true">
                        <span className="admin-nav-icon">▤</span>
                        <span>Pedidos</span>
                    </div>

                    {/* Menú es la sección habilitada */}
                    <div className="admin-nav-group">
                        <button
                            type="button"
                            className="admin-nav-menu"
                            onClick={() =>
                                setMenuAbierto(!menuAbierto)
                            }
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
                                <NavLink
                                    to="/productos"
                                    className={({ isActive }) =>
                                        `admin-submenu-link ${
                                            isActive ? "active" : ""
                                        }`
                                    }
                                >
                                    Productos
                                </NavLink>

                                <NavLink
                                    to="/categorias"
                                    className={({ isActive }) =>
                                        `admin-submenu-link ${
                                            isActive ? "active" : ""
                                        }`
                                    }
                                >
                                    Categorías
                                </NavLink>
                            </div>
                        )}
                    </div>

                    <div className="admin-nav-disabled" aria-disabled="true">
                        <span className="admin-nav-icon">♙</span>
                        <span>Usuarios</span>
                    </div>

                    <div className="admin-nav-disabled" aria-disabled="true">
                        <span className="admin-nav-icon">♧</span>
                        <span>Mesas</span>
                    </div>

                    <div className="admin-nav-disabled" aria-disabled="true">
                        <span className="admin-nav-icon">▥</span>
                        <span>Reportes</span>
                    </div>

                    {/* Configuración se omite porque no pertenece
                        a los módulos definidos actualmente en SIAR. */}
                </nav>

                <div className="admin-sidebar-footer">
                    <div className="admin-avatar">AD</div>

                    <div>
                        <strong>Administrador</strong>
                        <span>Acceso al sistema</span>
                    </div>
                </div>
            </aside>

            {/* Aquí se renderiza la página seleccionada */}
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    );
}